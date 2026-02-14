/**
 * Admin Customers API
 * GET — List customers with order stats, search, filter
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status') || 'all' // all, active, inactive
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        // Build where clause
        const where: Record<string, unknown> = {
            role: 'CUSTOMER',
        }

        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
            ]
        }

        // Get customers with order stats
        const customers = await prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                avatar: true,
                createdAt: true,
                orders: {
                    select: {
                        id: true,
                        total: true,
                        createdAt: true,
                        status: true,
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        })

        // Calculate stats per customer
        const customersWithStats = customers.map(c => {
            const totalSpent = c.orders.reduce((sum, o) => sum + o.total, 0)
            const orderCount = c.orders.length
            const lastOrder = c.orders[0]?.createdAt || null
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            const isActive = c.orders.some(o => new Date(o.createdAt) > thirtyDaysAgo)

            return {
                id: c.id,
                email: c.email,
                firstName: c.firstName,
                lastName: c.lastName,
                phone: c.phone,
                avatar: c.avatar,
                createdAt: c.createdAt,
                totalSpent: Math.round(totalSpent * 100) / 100,
                orderCount,
                lastOrder,
                isActive,
            }
        })

        // Filter by activity status after processing (can't do in Prisma query easily)
        const filtered = status === 'all'
            ? customersWithStats
            : status === 'active'
                ? customersWithStats.filter(c => c.isActive)
                : customersWithStats.filter(c => !c.isActive)

        const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } })

        // Aggregate stats
        const orderAgg = await prisma.order.aggregate({
            _sum: { total: true },
            _avg: { total: true },
            _count: true,
        })

        return NextResponse.json({
            customers: filtered,
            pagination: {
                page,
                limit,
                total: totalCustomers,
                totalPages: Math.ceil(totalCustomers / limit),
            },
            stats: {
                totalCustomers,
                totalRevenue: Math.round((orderAgg._sum.total || 0) * 100) / 100,
                avgOrderValue: Math.round((orderAgg._avg.total || 0) * 100) / 100,
                totalOrders: orderAgg._count,
            },
        })
    } catch (err) {
        console.error('Failed to load customers:', err)
        return NextResponse.json({ error: 'Failed to load customers' }, { status: 500 })
    }
}
