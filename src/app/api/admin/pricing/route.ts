/**
 * Admin Markup & Pricing API
 * GET — List all markup rules + stats
 * PUT — Upsert a markup rule
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import prisma from '@/lib/db'
import { getGlobalMarkup } from '@/lib/markup/calculator'

export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const rules = await prisma.markupRule.findMany({
            orderBy: [{ priority: 'desc' }, { name: 'asc' }],
        })

        // Get categories with markup info
        const categories = await prisma.category.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                markupPercent: true,
                _count: { select: { products: true } },
            },
            orderBy: { name: 'asc' },
        })

        // Stats
        const activeRules = rules.filter(r => r.enabled).length
        const avgMarkup = rules.length > 0
            ? rules.reduce((sum, r) => sum + r.markupPercent, 0) / rules.length
            : await getGlobalMarkup()

        return NextResponse.json({
            rules,
            categories,
            stats: {
                activeRules,
                totalRules: rules.length,
                avgMarkup: Math.round(avgMarkup * 10) / 10,
                globalDefault: await getGlobalMarkup(),
            },
        })
    } catch (err) {
        console.error('Failed to load pricing:', err)
        return NextResponse.json({ error: 'Failed to load pricing data' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const { rules, globalDefault } = await request.json()

        // Update global default
        if (globalDefault !== undefined) {
            await prisma.markupRule.upsert({
                where: {
                    categorySlug_productSku: {
                        categorySlug: '',
                        productSku: '',
                    },
                },
                update: { markupPercent: globalDefault, enabled: true },
                create: {
                    name: 'Global Default',
                    categorySlug: '',
                    productSku: '',
                    markupPercent: globalDefault,
                    priority: 0,
                    enabled: true,
                },
            })
        }

        // Update individual rules
        if (rules && Array.isArray(rules)) {
            for (const rule of rules) {
                if (rule.id) {
                    await prisma.markupRule.update({
                        where: { id: rule.id },
                        data: {
                            markupPercent: rule.markupPercent,
                            enabled: rule.enabled ?? true,
                            name: rule.name,
                        },
                    })
                } else {
                    await prisma.markupRule.create({
                        data: {
                            name: rule.name,
                            categorySlug: rule.categorySlug || null,
                            productSku: rule.productSku || null,
                            markupPercent: rule.markupPercent,
                            priority: rule.priority || 0,
                            enabled: rule.enabled ?? true,
                        },
                    })
                }
            }
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Failed to save pricing:', err)
        return NextResponse.json({ error: 'Failed to save pricing data' }, { status: 500 })
    }
}
