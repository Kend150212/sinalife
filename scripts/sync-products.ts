/**
 * Product Sync Script
 * Fetches all products from Sinalite API and syncs to local database
 * Run via: npx ts-node scripts/sync-products.ts
 */

import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

// Sinalite category → local category slug mapping
const CATEGORY_MAP: Record<string, string> = {
    'Business Cards': 'business-cards',
    'Postcards': 'print-products',
    'Flyers': 'print-products',
    'Brochures': 'print-products',
    'Bookmarks': 'print-products',
    'Presentation Folders': 'print-products',
    'Booklets': 'print-products',
    'Magnets': 'print-products',
    'Greeting Cards': 'print-products',
    'Invitations': 'print-products',
    'Posters': 'print-products',
    'Door Hangers': 'print-products',
    'Digital Sheets': 'print-products',
    'Banners': 'large-format',
    'Yard Signs': 'large-format',
    'Coroplast Signs': 'large-format',
    'Foam Board': 'large-format',
    'Canvas': 'large-format',
    'Aluminum Signs': 'large-format',
    'Pull Up Banners': 'large-format',
    'Letterhead': 'stationery',
    'Envelopes': 'stationery',
    'Notepads': 'stationery',
    'NCR Forms': 'stationery',
    'Mugs': 'promotional',
    'Bottles': 'promotional',
    'Tumblers': 'promotional',
    'Puzzles': 'promotional',
    'Labels': 'packaging',
    'Product Boxes': 'packaging',
    'Corrugated Boxes': 'packaging',
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}

interface SinaliteProduct {
    id: number
    sku: string
    name: string
    category: string
    enabled: number
}

interface SinaliteAuthResponse {
    access_token: string
}

async function authenticate(): Promise<string> {
    const response = await fetch(
        `${process.env.SINALITE_API_URL || 'https://api.sinaliteuppy.com'}/auth/token`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.SINALITE_CLIENT_ID,
                client_secret: process.env.SINALITE_CLIENT_SECRET,
                audience: process.env.SINALITE_AUDIENCE || 'https://apiconnect.sinalite.com',
                grant_type: 'client_credentials',
            }),
        }
    )

    const data: SinaliteAuthResponse = await response.json()
    return data.access_token
}

async function syncProducts() {
    console.log('🔄 Starting product sync...')

    const token = await authenticate()
    console.log('✅ Authenticated with Sinalite API')

    // Fetch all products
    const response = await fetch(
        `${process.env.SINALITE_API_URL || 'https://api.sinaliteuppy.com'}/product`,
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        }
    )

    const products: SinaliteProduct[] = await response.json()
    console.log(`📦 Found ${products.length} products`)

    // Get categories from DB
    const categories = await prisma.category.findMany()
    const categoryMap = new Map(categories.map((c) => [c.slug, c.id]))

    let synced = 0
    let skipped = 0

    for (const product of products) {
        const categorySlug = CATEGORY_MAP[product.category] || null
        const categoryId = categorySlug ? categoryMap.get(categorySlug) || null : null

        const slug = slugify(product.name)

        try {
            // Fetch product options for US store
            const optionsResponse = await fetch(
                `${process.env.SINALITE_API_URL || 'https://api.sinaliteuppy.com'}/product/${product.id}/9`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            let sinaliteOptions = null
            if (optionsResponse.ok) {
                sinaliteOptions = await optionsResponse.json()
            }

            await prisma.product.upsert({
                where: { sku: product.sku },
                update: {
                    name: product.name,
                    categoryId,
                    sinaliteOptions,
                    enabled: product.enabled === 1,
                    syncedAt: new Date(),
                },
                create: {
                    sinaliteProductId: product.id,
                    sku: product.sku,
                    name: product.name,
                    slug: slug,
                    categoryId,
                    sinaliteOptions,
                    enabled: product.enabled === 1,
                    syncedAt: new Date(),
                },
            })
            synced++

            // Rate limit: wait 200ms between API calls
            await new Promise((resolve) => setTimeout(resolve, 200))
        } catch (error) {
            console.error(`❌ Failed to sync product ${product.name}:`, error)
            skipped++
        }
    }

    console.log(`\n✅ Sync complete: ${synced} synced, ${skipped} skipped`)
}

syncProducts()
    .catch((e) => {
        console.error('❌ Sync failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
