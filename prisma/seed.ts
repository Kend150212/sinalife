import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // 1. Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@printshop.com' },
        update: {},
        create: {
            email: 'admin@printshop.com',
            passwordHash: adminPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN',
        },
    })
    console.log(`✅ Admin user created: ${admin.email}`)

    // 2. Seed site settings
    const defaultSettings = [
        {
            key: 'branding',
            group: 'branding',
            value: {
                siteName: 'PrintPro USA',
                tagline: 'Premium Custom Printing Services',
                logoLight: '',
                logoDark: '',
                favicon: '',
                primaryColor: '#1a73e8',
                secondaryColor: '#ff6d00',
                accentColor: '#00c853',
                fromEmail: 'noreply@printpro.com',
            },
        },
        {
            key: 'contact',
            group: 'general',
            value: {
                email: 'info@printpro.com',
                phone: '1-800-PRINT-US',
                address: '123 Print Street',
                city: 'New York',
                state: 'NY',
                zip: '10001',
                country: 'US',
            },
        },
        {
            key: 'social',
            group: 'general',
            value: { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' },
        },
        {
            key: 'seo',
            group: 'seo',
            value: {
                title: 'PrintPro USA | Custom Printing Services',
                description: 'Premium custom printing services for businesses and individuals. Business cards, flyers, banners, and more.',
                ogImage: '',
                keywords: 'printing, custom printing, business cards, flyers, banners',
            },
        },
    ]

    for (const setting of defaultSettings) {
        await prisma.siteSetting.upsert({
            where: { key: setting.key },
            update: {},
            create: setting,
        })
    }
    console.log('✅ Site settings seeded')

    // 3. Seed categories
    const categories = [
        { name: 'Business Cards', slug: 'business-cards', sortOrder: 1, markupPercent: 40 },
        { name: 'Print Products', slug: 'print-products', sortOrder: 2, markupPercent: 35 },
        { name: 'Large Format', slug: 'large-format', sortOrder: 3, markupPercent: 30 },
        { name: 'Stationery', slug: 'stationery', sortOrder: 4, markupPercent: 35 },
        { name: 'Promotional', slug: 'promotional', sortOrder: 5, markupPercent: 45 },
        { name: 'Packaging', slug: 'packaging', sortOrder: 6, markupPercent: 35 },
        { name: 'Apparel', slug: 'apparel', sortOrder: 7, markupPercent: 50 },
        { name: 'Signage', slug: 'signage', sortOrder: 8, markupPercent: 30 },
    ]

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: cat,
        })
    }
    console.log('✅ Categories seeded')

    // 5. Seed global markup rule
    await prisma.markupRule.upsert({
        where: { categorySlug_productSku: { categorySlug: '', productSku: '' } },
        update: {},
        create: {
            name: 'Global Default',
            markupPercent: 35,
            priority: 0,
        },
    })
    console.log('✅ Global markup rule seeded')

    console.log('🎉 Database seeded successfully!')
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
