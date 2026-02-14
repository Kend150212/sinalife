// prisma/seed-admin.ts — Create admin user (Prisma 7 + adapter-pg)
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
    const email = 'admin@printpro.com'
    const password = 'Admin123!'

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
        console.log(`✅ Admin user already exists: ${email}`)
        return
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            role: 'ADMIN',
            firstName: 'Admin',
            lastName: 'PrintPro',
        },
    })

    console.log(`✅ Admin user created successfully!`)
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   ID: ${user.id}`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
