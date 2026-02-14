/**
 * Admin Users (Staff) API
 * GET    — List staff/admin users
 * POST   — Create a new staff user
 * PUT    — Update user role/status
 * DELETE — Remove a staff user
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const users = await prisma.user.findMany({
            where: {
                role: { in: ['ADMIN', 'STAFF'] },
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
                sessions: {
                    select: { expires: true },
                    orderBy: { expires: 'desc' },
                    take: 1,
                },
            },
            orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
        })

        const usersWithMeta = users.map(u => ({
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            role: u.role,
            avatar: u.avatar,
            createdAt: u.createdAt,
            lastLogin: u.sessions[0]?.expires || null,
        }))

        // Role counts
        const adminCount = users.filter(u => u.role === 'ADMIN').length
        const staffCount = users.filter(u => u.role === 'STAFF').length

        return NextResponse.json({
            users: usersWithMeta,
            stats: {
                admins: adminCount,
                staff: staffCount,
                total: users.length,
            },
        })
    } catch (err) {
        console.error('Failed to load users:', err)
        return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const { email, firstName, lastName, role, password } = await request.json()

        if (!email || !firstName || !lastName || !password) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
        }

        // Check if email exists
        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 })
        }

        const validRoles = ['ADMIN', 'STAFF']
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: 'Role must be ADMIN or STAFF' }, { status: 400 })
        }

        const passwordHash = await bcrypt.hash(password, 12)

        const user = await prisma.user.create({
            data: {
                email,
                firstName,
                lastName,
                role,
                passwordHash,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
            },
        })

        return NextResponse.json(user, { status: 201 })
    } catch (err) {
        console.error('Failed to create user:', err)
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const { id, role, firstName, lastName } = await request.json()

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        const updateData: Record<string, unknown> = {}
        if (role) {
            const validRoles = ['ADMIN', 'STAFF']
            if (!validRoles.includes(role)) {
                return NextResponse.json({ error: 'Role must be ADMIN or STAFF' }, { status: 400 })
            }
            updateData.role = role
        }
        if (firstName) updateData.firstName = firstName
        if (lastName) updateData.lastName = lastName

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: { id: true, email: true, firstName: true, lastName: true, role: true },
        })

        return NextResponse.json(user)
    } catch (err) {
        console.error('Failed to update user:', err)
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    const { error, session } = await requireAdmin()
    if (error) return error

    try {
        const { id } = await request.json()

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        // Prevent self-deletion
        if (session?.user?.id === id) {
            return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
        }

        await prisma.user.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Failed to delete user:', err)
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }
}
