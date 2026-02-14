'use client'

import Link from 'next/link'

// Demo orders for display (in production, fetched from API)
const demoOrders = [
    {
        id: 'ORD-001',
        date: '2026-02-14',
        items: 3,
        total: 149.00,
        status: 'delivered',
        statusLabel: 'Delivered',
        payment: 'Stripe',
    },
    {
        id: 'ORD-002',
        date: '2026-02-12',
        items: 1,
        total: 89.50,
        status: 'shipped',
        statusLabel: 'Shipped',
        payment: 'PayPal',
    },
    {
        id: 'ORD-003',
        date: '2026-02-10',
        items: 2,
        total: 245.00,
        status: 'processing',
        statusLabel: 'Processing',
        payment: 'Stripe',
    },
    {
        id: 'ORD-004',
        date: '2026-02-08',
        items: 1,
        total: 32.00,
        status: 'delivered',
        statusLabel: 'Delivered',
        payment: 'Stripe',
    },
]

export default function OrdersPage() {
    return (
        <div>
            <div className="account-page-header">
                <h1>Order History</h1>
                <p>View and track all your orders</p>
            </div>

            {demoOrders.length === 0 ? (
                <div className="account-card">
                    <div className="account-empty">
                        <div className="account-empty-icon">📦</div>
                        <h3>No orders yet</h3>
                        <p>When you place orders, they&apos;ll appear here.</p>
                        <Link href="/products" className="account-btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                            Browse Products
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="account-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Date</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {demoOrders.map((order) => (
                                <tr key={order.id}>
                                    <td style={{ fontWeight: 600 }}>{order.id}</td>
                                    <td style={{ color: '#64748b' }}>{new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                    <td>{order.items} item{order.items !== 1 ? 's' : ''}</td>
                                    <td style={{ fontWeight: 600 }}>${order.total.toFixed(2)}</td>
                                    <td style={{ color: '#64748b' }}>{order.payment}</td>
                                    <td>
                                        <span className={`order-status-badge ${order.status}`}>
                                            {order.statusLabel}
                                        </span>
                                    </td>
                                    <td>
                                        <Link href={`/account/orders/${order.id}`} className="order-view-link">
                                            View →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
