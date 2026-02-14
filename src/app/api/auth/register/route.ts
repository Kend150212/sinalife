import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { welcomeEmail } from '@/lib/email/templates'

export async function POST(request: Request) {
    try {
        const { firstName, lastName, email, password } = await request.json()

        if (!firstName || !lastName || !email || !password) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            )
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            )
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'An account with this email already exists' },
                { status: 409 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user
        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email: email.toLowerCase(),
                passwordHash: hashedPassword,
                role: 'CUSTOMER',
            },
        })

        // Send welcome email (fire-and-forget)
        const welcome = welcomeEmail({ name: `${firstName} ${lastName}` })
        sendEmail({ to: email.toLowerCase(), ...welcome }).catch(console.error)

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
            },
        }, { status: 201 })
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
