/**
 * Admin Reports API
 * GET — Aggregate analytics data: revenue, orders, top products, top customers
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') || '30d'

        // Calculate date range
        let daysBack = 30
        if (period === '7d') daysBack = 7
        else if (period === '90d') daysBack = 90
        else if (period === '12m') daysBack = 365

        const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)

        // Overall stats
        const [totalRevenue, periodRevenue, totalOrders, periodOrders, totalCustomers, totalProducts] =
            await Promise.all([
                prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'PAID' } }),
                prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'PAID', createdAt: { gte: startDate } } }),
                prisma.order.count(),
                prisma.order.count({ where: { createdAt: { gte: startDate } } }),
                prisma.user.count({ where: { role: 'CUSTOMER' } }),
                prisma.product.count({ where: { enabled: true } }),
            ])

        // Previous period for comparison
        const prevStartDate = new Date(startDate.getTime() - daysBack * 24 * 60 * 60 * 1000)
        const [prevRevenue, prevOrders] = await Promise.all([
            prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'PAID', createdAt: { gte: prevStartDate, lt: startDate } } }),
            prisma.order.count({ where: { createdAt: { gte: prevStartDate, lt: startDate } } }),
        ])

        // Revenue trend (group by day or month)
        const orders = await prisma.order.findMany({
            where: { createdAt: { gte: startDate }, paymentStatus: 'PAID' },
            select: { total: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
        })

        // Group orders by date for chart
        const revenueByDate: Record<string, { revenue: number; orders: number }> = {}
        for (const o of orders) {
            const key = period === '12m'
                ? o.createdAt.toISOString().slice(0, 7) // YYYY-MM
                : o.createdAt.toISOString().slice(0, 10) // YYYY-MM-DD
            if (!revenueByDate[key]) revenueByDate[key] = { revenue: 0, orders: 0 }
            revenueByDate[key].revenue += o.total
            revenueByDate[key].orders += 1
        }

        const chartData = Object.entries(revenueByDate).map(([date, data]) => ({
            date,
            revenue: Math.round(data.revenue * 100) / 100,
            orders: data.orders,
        }))

        // Top products by revenue
        const topProducts = await prisma.orderItem.groupBy({
            by: ['productId', 'productName'],
            _sum: { total: true },
            _count: true,
            orderBy: { _sum: { total: 'desc' } },
            take: 5,
        })

        // Top customers by spending
        const topCustomerOrders = await prisma.order.groupBy({
            by: ['userId'],
            _sum: { total: true },
            _count: true,
            where: { paymentStatus: 'PAID' },
            orderBy: { _sum: { total: 'desc' } },
            take: 5,
        })

        // Fetch customer names for top customer IDs
        const topCustomerIds = topCustomerOrders.map(c => c.userId)
        const customerUsers = await prisma.user.findMany({
            where: { id: { in: topCustomerIds } },
            select: { id: true, firstName: true, lastName: true, email: true },
        })
        const customerMap = new Map(customerUsers.map(u => [u.id, u]))

        const topCustomers = topCustomerOrders.map(c => {
            const user = customerMap.get(c.userId)
            return {
                id: c.userId,
                name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
                email: user?.email || '',
                totalSpent: Math.round((c._sum.total || 0) * 100) / 100,
                orderCount: c._count,
            }
        })

        // Revenue by category
        const categoryRevenue = await prisma.$queryRawUnsafe<
            Array<{ category_name: string; total: number; order_count: number }>
        >(`
            SELECT 
                COALESCE(c.name, 'Uncategorized') as category_name,
                COALESCE(SUM(oi.total), 0) as total,
                COUNT(DISTINCT oi.order_id) as order_count
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            LEFT JOIN categories c ON c.id = p.category_id
            GROUP BY c.name
            ORDER BY total DESC
            LIMIT 10
        `)

        // Calculate trends
        const currentRev = periodRevenue._sum.total || 0
        const prevRev = prevRevenue._sum.total || 0
        const revenueTrend = prevRev > 0 ? ((currentRev - prevRev) / prevRev * 100) : 0
        const ordersTrend = prevOrders > 0 ? ((periodOrders - prevOrders) / prevOrders * 100) : 0

        return NextResponse.json({
            kpis: {
                totalRevenue: Math.round((totalRevenue._sum.total || 0) * 100) / 100,
                periodRevenue: Math.round(currentRev * 100) / 100,
                revenueTrend: Math.round(revenueTrend * 10) / 10,
                totalOrders,
                periodOrders,
                ordersTrend: Math.round(ordersTrend * 10) / 10,
                totalCustomers,
                totalProducts,
                avgOrderValue: totalOrders > 0
                    ? Math.round(((totalRevenue._sum.total || 0) / totalOrders) * 100) / 100
                    : 0,
            },
            chartData,
            topProducts: topProducts.map(p => ({
                productId: p.productId,
                name: p.productName,
                revenue: Math.round((p._sum.total || 0) * 100) / 100,
                orderCount: p._count,
            })),
            topCustomers,
            categoryRevenue: categoryRevenue.map(c => ({
                category: c.category_name,
                revenue: Math.round(Number(c.total) * 100) / 100,
                orderCount: Number(c.order_count),
            })),
        })
    } catch (err) {
        console.error('Failed to load reports:', err)
        return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 })
    }
}
