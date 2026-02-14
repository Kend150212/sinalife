import Link from 'next/link'
import {
    Search,
    Filter,
    ArrowUpRight,
    Package,
} from 'lucide-react'

const demoOrders = [
    { id: 'ORD-001', customer: 'John Smith', email: 'john@example.com', date: '2026-02-14', total: '$149.00', items: 3, status: 'Completed', payment: 'Stripe' },
    { id: 'ORD-002', customer: 'Sarah Lee', email: 'sarah@example.com', date: '2026-02-14', total: '$89.50', items: 1, status: 'Processing', payment: 'PayPal' },
    { id: 'ORD-003', customer: 'Mike Chen', email: 'mike@example.com', date: '2026-02-13', total: '$245.00', items: 5, status: 'Pending', payment: 'Stripe' },
    { id: 'ORD-004', customer: 'Emma Wilson', email: 'emma@example.com', date: '2026-02-13', total: '$32.00', items: 1, status: 'Shipped', payment: 'Stripe' },
    { id: 'ORD-005', customer: 'Alex Brown', email: 'alex@example.com', date: '2026-02-12', total: '$178.50', items: 4, status: 'Completed', payment: 'PayPal' },
]

function getStatusBadge(status: string) {
    const map: Record<string, string> = {
        Completed: 'badge-success',
        Processing: 'badge-info',
        Pending: 'badge-pending',
        Shipped: 'badge-warning',
        Cancelled: 'badge-danger',
    }
    return map[status] || 'badge-pending'
}

export default function OrdersPage() {
    return (
        <>
            <div className="admin-page-header">
                <div className="flex-between">
                    <div>
                        <h1>Orders</h1>
                        <p>Manage and track all customer orders</p>
                    </div>
                    <button className="admin-btn admin-btn-primary">
                        <Package size={16} /> Export Orders
                    </button>
                </div>
            </div>
            <div className="admin-page-content">
                {/* Filters */}
                <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: 12 }}>
                    <div className="admin-search">
                        <Search size={16} style={{ color: '#9CA3AF' }} />
                        <input type="text" placeholder="Search orders..." />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <select className="form-input" style={{ width: 'auto', padding: '8px 36px 8px 12px', borderRadius: 9999, fontSize: 13 }}>
                            <option>All Status</option>
                            <option>Pending</option>
                            <option>Processing</option>
                            <option>Shipped</option>
                            <option>Completed</option>
                            <option>Cancelled</option>
                        </select>
                        <select className="form-input" style={{ width: 'auto', padding: '8px 36px 8px 12px', borderRadius: 9999, fontSize: 13 }}>
                            <option>All Payment</option>
                            <option>Stripe</option>
                            <option>PayPal</option>
                        </select>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {demoOrders.map((order) => (
                                <tr key={order.id}>
                                    <td>
                                        <span style={{ fontWeight: 700, color: '#000' }}>{order.id}</span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, color: '#000' }}>{order.customer}</div>
                                        <div style={{ fontSize: 12, color: '#9CA3AF' }}>{order.email}</div>
                                    </td>
                                    <td>{order.date}</td>
                                    <td>{order.items}</td>
                                    <td style={{ fontWeight: 700 }}>{order.total}</td>
                                    <td>{order.payment}</td>
                                    <td>
                                        <span className={`badge ${getStatusBadge(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>
                                        <Link href={`/admin/orders/${order.id}`} className="admin-btn admin-btn-sm admin-btn-secondary">
                                            View <ArrowUpRight size={14} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}
