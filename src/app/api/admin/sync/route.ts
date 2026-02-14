/**
 * Admin Product Sync API
 * POST — Sync products from Sinalite API into the local database
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { sinalite } from '@/lib/sinalite/client'
import prisma from '@/lib/db'

export async function POST() {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        // Check if API credentials are configured
        if (!process.env.SINALITE_CLIENT_ID || !process.env.SINALITE_CLIENT_SECRET) {
            return NextResponse.json({
                success: false,
                message: 'Sinalite API credentials are not configured. Go to Settings → Sinalite API to add them.',
            }, { status: 400 })
        }

        // Fetch all products from Sinalite
        const sinaliteProducts = await sinalite.getProducts()

        if (!Array.isArray(sinaliteProducts) || sinaliteProducts.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'No products returned from Sinalite API.',
            })
        }

        let added = 0
        let updated = 0
        let failed = 0
        const errors: string[] = []

        for (const sp of sinaliteProducts) {
            try {
                // Generate slug from product name
                const slug = sp.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '')
                    .slice(0, 100)

                // Find or create category from Sinalite category name
                let categoryId: string | null = null
                if (sp.category) {
                    const categorySlug = sp.category
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, '')

                    const category = await prisma.category.upsert({
                        where: { slug: categorySlug },
                        update: {},
                        create: {
                            name: sp.category,
                            slug: categorySlug,
                            enabled: true,
                        },
                    })
                    categoryId = category.id
                }

                // Try to fetch pricing data
                let sinaliteOptions = null
                let sinaliteVariants = null
                let minPrice: number | null = null
                let maxPrice: number | null = null

                try {
                    const pricingData = await sinalite.getProductPricing(sp.id)
                    if (pricingData) {
                        sinaliteOptions = pricingData[0] || null
                        // Fetch variants
                        const variants = await sinalite.getVariants(sp.id)
                        if (Array.isArray(variants) && variants.length > 0) {
                            sinaliteVariants = variants
                            const prices = variants.map(v => v.price).filter(p => p > 0)
                            if (prices.length > 0) {
                                minPrice = Math.min(...prices)
                                maxPrice = Math.max(...prices)
                            }
                        }
                    }
                } catch {
                    // Pricing fetch failed, continue without it
                }

                // Upsert product
                const existing = await prisma.product.findFirst({
                    where: { sinaliteProductId: sp.id },
                })

                if (existing) {
                    await prisma.product.update({
                        where: { id: existing.id },
                        data: {
                            name: sp.name,
                            sku: sp.sku || `SL-${sp.id}`,
                            categoryId,
                            enabled: sp.enabled === 1,
                            sinaliteOptions: sinaliteOptions ? JSON.parse(JSON.stringify(sinaliteOptions)) : undefined,
                            sinaliteVariants: sinaliteVariants ? JSON.parse(JSON.stringify(sinaliteVariants)) : undefined,
                            minPrice: minPrice ?? undefined,
                            maxPrice: maxPrice ?? undefined,
                            syncedAt: new Date(),
                        },
                    })
                    updated++
                } else {
                    // Make slug unique
                    let uniqueSlug = slug
                    let suffix = 1
                    while (await prisma.product.findUnique({ where: { slug: uniqueSlug } })) {
                        uniqueSlug = `${slug}-${suffix++}`
                    }

                    // Make sku unique
                    let uniqueSku = sp.sku || `SL-${sp.id}`
                    let skuSuffix = 1
                    while (await prisma.product.findUnique({ where: { sku: uniqueSku } })) {
                        uniqueSku = `${sp.sku || `SL-${sp.id}`}-${skuSuffix++}`
                    }

                    await prisma.product.create({
                        data: {
                            sinaliteProductId: sp.id,
                            name: sp.name,
                            slug: uniqueSlug,
                            sku: uniqueSku,
                            categoryId,
                            enabled: sp.enabled === 1,
                            sinaliteOptions: sinaliteOptions ? JSON.parse(JSON.stringify(sinaliteOptions)) : undefined,
                            sinaliteVariants: sinaliteVariants ? JSON.parse(JSON.stringify(sinaliteVariants)) : undefined,
                            minPrice,
                            maxPrice,
                            syncedAt: new Date(),
                        },
                    })
                    added++
                }
            } catch (productErr) {
                failed++
                errors.push(`Product ${sp.id} (${sp.name}): ${productErr instanceof Error ? productErr.message : 'Unknown error'}`)
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sync complete: ${added} added, ${updated} updated, ${failed} failed out of ${sinaliteProducts.length} total`,
            stats: { added, updated, failed, total: sinaliteProducts.length },
            errors: errors.slice(0, 10), // Limit error output
        })
    } catch (err) {
        console.error('Product sync failed:', err)
        return NextResponse.json({
            success: false,
            message: `Sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        }, { status: 500 })
    }
}
