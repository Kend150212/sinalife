import {
    DollarSign,
    ShoppingCart,
    Package,
    Users,
    TrendingUp,
    ArrowUpRight,
} from 'lucide-react'
import prisma from '@/lib/db'
import './admin.css'

export default async function AdminDashboard() {
    // Fetch real stats from database
    let totalRevenue = 0
    let totalOrders = 0
    let totalProducts = 0
    let totalCustomers = 0
    let recentOrders: { id: string; orderNumber: string; total: number; status: string; createdAt: Date; user: { firstName: string; lastName: string } }[] = []

    try {
        const [revenueAgg, orderCount, productCount, customerCount, recent] = await Promise.all([
            prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'PAID' } }),
            prisma.order.count(),
            prisma.product.count({ where: { enabled: true } }),
            prisma.user.count({ where: { role: 'CUSTOMER' } }),
            prisma.order.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    orderNumber: true,
                    total: true,
                    status: true,
                    createdAt: true,
                    user: { select: { firstName: true, lastName: true } },
                },
            }),
        ])

        totalRevenue = revenueAgg._sum.total || 0
        totalOrders = orderCount
        totalProducts = productCount
        totalCustomers = customerCount
        recentOrders = recent
    } catch (err) {
        console.error('Dashboard data fetch error:', err)
    }

    const fmtCurrency = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

    return (
        <>
            <div className="admin-page-header">
                <h1>Dashboard</h1>
                <p>Welcome back! Here&apos;s an overview of your store.</p>
            </div>
            <div className="admin-page-content">
                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Total Revenue</span>
                            <div className="stat-card-icon blue">
                                <DollarSign size={20} />
                            </div>
                        </div>
                        <div className="stat-card-value">{fmtCurrency(totalRevenue)}</div>
                        <div className="stat-card-change positive">
                            <TrendingUp size={14} style={{ display: 'inline', marginRight: 4 }} />
                            {totalRevenue > 0 ? 'From paid orders' : 'Connect Sinalite API to start'}
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Orders</span>
                            <div className="stat-card-icon green">
                                <ShoppingCart size={20} />
                            </div>
                        </div>
                        <div className="stat-card-value">{totalOrders}</div>
                        <div className="stat-card-change positive">
                            {totalOrders > 0 ? `${totalOrders} total orders` : 'Ready for first order'}
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Products</span>
                            <div className="stat-card-icon purple">
                                <Package size={20} />
                            </div>
                        </div>
                        <div className="stat-card-value">{totalProducts}</div>
                        <div className="stat-card-change">
                            {totalProducts > 0 ? `${totalProducts} active products` : 'Sync from Sinalite API'}
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Customers</span>
                            <div className="stat-card-icon orange">
                                <Users size={20} />
                            </div>
                        </div>
                        <div className="stat-card-value">{totalCustomers}</div>
                        <div className="stat-card-change">
                            {totalCustomers > 0 ? `${totalCustomers} registered` : 'Awaiting registrations'}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="admin-card" style={{ marginTop: 24 }}>
                    <h2 style={{ marginBottom: 16 }}>Quick Actions</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                        <a href="/admin/settings" className="admin-btn admin-btn-secondary" style={{ textAlign: 'center', textDecoration: 'none', padding: '16px 12px' }}>
                            🔗 Sync Products <ArrowUpRight size={14} />
                        </a>
                        <a href="/admin/orders" className="admin-btn admin-btn-secondary" style={{ textAlign: 'center', textDecoration: 'none', padding: '16px 12px' }}>
                            📦 View Orders <ArrowUpRight size={14} />
                        </a>
                        <a href="/admin/customers" className="admin-btn admin-btn-secondary" style={{ textAlign: 'center', textDecoration: 'none', padding: '16px 12px' }}>
                            👥 View Customers <ArrowUpRight size={14} />
                        </a>
                        <a href="/admin/reports" className="admin-btn admin-btn-secondary" style={{ textAlign: 'center', textDecoration: 'none', padding: '16px 12px' }}>
                            📊 View Reports <ArrowUpRight size={14} />
                        </a>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="admin-card" style={{ marginTop: 16 }}>
                    <div className="flex-between" style={{ marginBottom: 16 }}>
                        <h2 style={{ margin: 0 }}>Recent Orders</h2>
                        <a href="/admin/orders" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                            View all <ArrowUpRight size={12} />
                        </a>
                    </div>
                    {recentOrders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                            <ShoppingCart size={40} />
                            <p>No orders yet. Your recent orders will appear here.</p>
                        </div>
                    ) : (
                        <div style={{ overflow: 'auto' }}>
                            <table className="admin-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Order</th>
                                        <th>Customer</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.map(order => (
                                        <tr key={order.id}>
                                            <td style={{ fontWeight: 500 }}>#{order.orderNumber}</td>
                                            <td>{order.user.firstName} {order.user.lastName}</td>
                                            <td style={{ fontWeight: 500 }}>{fmtCurrency(order.total)}</td>
                                            <td>
                                                <span className={`badge ${order.status === 'DELIVERED' ? 'badge-success' :
                                                        order.status === 'SHIPPED' ? 'badge-success' :
                                                            order.status === 'CANCELLED' ? 'badge-error' :
                                                                'badge-warning'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: 13, color: '#64748b' }}>
                                                {order.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
