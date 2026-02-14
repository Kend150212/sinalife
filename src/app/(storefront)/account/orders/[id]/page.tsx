'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

// Demo order data (in production, fetched from API by ID)
const demoOrderDetail = {
    id: 'ORD-001',
    date: '2026-02-14',
    status: 'delivered',
    statusLabel: 'Delivered',
    payment: 'Stripe',
    items: [
        { name: 'Premium Business Cards (500)', quantity: 1, price: 49.00, sku: 'BC-PREM-001' },
        { name: 'Standard Flyers (8.5×11)', quantity: 2, price: 45.00, sku: 'FL-STD-001' },
        { name: 'Custom Stickers (Sheet)', quantity: 1, price: 12.00, sku: 'PR-STK-001' },
    ],
    subtotal: 151.00,
    shipping: 12.99,
    tax: 0,
    total: 163.99,
    shippingAddress: {
        name: 'John Doe',
        line1: '123 Main Street',
        line2: 'Suite 100',
        city: 'Toronto',
        state: 'ON',
        zip: 'M5V 3A8',
        country: 'Canada',
    },
    timeline: [
        { status: 'Order Placed', date: '2026-02-14 10:30 AM', completed: true },
        { status: 'Payment Confirmed', date: '2026-02-14 10:31 AM', completed: true },
        { status: 'In Production', date: '2026-02-14 2:00 PM', completed: true },
        { status: 'Shipped', date: '2026-02-15 9:00 AM', completed: true },
        { status: 'Delivered', date: '2026-02-17 11:45 AM', completed: true },
    ],
    tracking: {
        carrier: 'UPS',
        number: '1Z999AA10123456784',
    },
}

export default function OrderDetailPage() {
    const params = useParams()
    const orderId = params.id as string
    const order = demoOrderDetail // In production: fetch by orderId

    return (
        <div>
            <div className="order-detail-header">
                <div>
                    <Link href="/account/orders" className="order-back-link">
                        ← Back to Orders
                    </Link>
                    <h1>
                        Order #{orderId}
                        <span className={`order-status-badge ${order.status}`}>
                            {order.statusLabel}
                        </span>
                    </h1>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>
                        Placed on {new Date(order.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
                {/* Left column */}
                <div>
                    {/* Items */}
                    <div className="account-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
                            <h3 style={{ margin: 0 }}>📦 Items ({order.items.length})</h3>
                        </div>
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>SKU</th>
                                    <th style={{ textAlign: 'center' }}>Qty</th>
                                    <th style={{ textAlign: 'right' }}>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 500 }}>{item.name}</td>
                                        <td style={{ color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace' }}>{item.sku}</td>
                                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 500 }}>${(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ padding: '16px 24px', borderTop: '2px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#64748b' }}>
                                <span>Subtotal</span>
                                <span>${order.subtotal.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#64748b' }}>
                                <span>Shipping</span>
                                <span>${order.shipping.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                                <span>Total</span>
                                <span>${order.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="account-card">
                        <h3>📍 Shipping Address</h3>
                        <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
                            {order.shippingAddress.name}<br />
                            {order.shippingAddress.line1}<br />
                            {order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
                            {order.shippingAddress.country}
                        </p>
                    </div>
                </div>

                {/* Right column — Timeline & Tracking */}
                <div>
                    {/* Tracking */}
                    {order.tracking && (
                        <div className="account-card">
                            <h3>🚚 Tracking</h3>
                            <p style={{ margin: '0 0 4px', fontSize: '14px' }}>
                                <strong>Carrier:</strong> <span style={{ color: '#64748b' }}>{order.tracking.carrier}</span>
                            </p>
                            <p style={{ margin: 0, fontSize: '14px' }}>
                                <strong>Tracking #:</strong> <span style={{ color: '#64748b', fontFamily: 'monospace', fontSize: '12px' }}>{order.tracking.number}</span>
                            </p>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="account-card">
                        <h3>📋 Order Timeline</h3>
                        <div className="order-timeline">
                            {order.timeline.map((step, i) => (
                                <div key={i} className="timeline-item">
                                    <div className={`timeline-dot ${step.completed ? 'completed' : ''}`} />
                                    <div className="timeline-title">{step.status}</div>
                                    <div className="timeline-date">{step.date}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment */}
                    <div className="account-card">
                        <h3>💳 Payment</h3>
                        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                            Paid via <strong>{order.payment}</strong>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
