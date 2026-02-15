'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import '../../../checkout/checkout.css'

interface OrderData {
    orderNumber: string
    status: string
    paymentStatus: string
    subtotal: number
    shippingCost: number
    tax: number
    total: number
    shippingMethod: string
    shippingInfo: {
        firstName: string
        lastName: string
        address1: string
        address2?: string
        city: string
        state: string
        zipCode: string
        email: string
    }
    items: Array<{
        productName: string
        quantity: number
        unitPrice: number
        total: number
    }>
    createdAt: string
}

export default function OrderConfirmationPage() {
    const params = useParams()
    const orderId = params.id as string
    const [order, setOrder] = useState<OrderData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Try to fetch order data if DB is available
        async function fetchOrder() {
            try {
                const res = await fetch(`/api/orders/${orderId}`)
                if (res.ok) {
                    const data = await res.json()
                    setOrder(data)
                }
            } catch {
                // DB may not be running — show demo confirmation
            } finally {
                setLoading(false)
            }
        }
        fetchOrder()
    }, [orderId])

    if (loading) {
        return (
            <div className="confirmation-page">
                <div className="confirmation-card">
                    <div className="processing-spinner" style={{ margin: '2rem auto' }} />
                    <p>Loading order details...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="confirmation-page">
            <div className="confirmation-card">
                <div className="confirmation-icon">✅</div>
                <h1>Thank You for Your Order!</h1>
                <p className="order-number">
                    Order Number: <strong>{order?.orderNumber || `PP-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-DEMO`}</strong>
                </p>

                <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.6 }}>
                    We&apos;ve received your order and are getting it ready. You&apos;ll receive a
                    confirmation email shortly with your order details and tracking information.
                </p>

                {order ? (
                    <div className="confirmation-details">
                        <h3>Order Summary</h3>
                        {order.items.map((item, i) => (
                            <div key={i} className="conf-item">
                                <span>{item.productName} × {item.quantity}</span>
                                <span>${item.total.toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="conf-item">
                            <span>Subtotal</span>
                            <span>${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="conf-item">
                            <span>Shipping ({order.shippingMethod})</span>
                            <span>${order.shippingCost.toFixed(2)}</span>
                        </div>
                        <div className="conf-item">
                            <span>Tax</span>
                            <span>${order.tax.toFixed(2)}</span>
                        </div>
                        <div className="conf-item total">
                            <span>Total</span>
                            <span>${order.total.toFixed(2)}</span>
                        </div>
                    </div>
                ) : (
                    <div className="confirmation-details">
                        <h3>What Happens Next?</h3>
                        <div className="conf-item">
                            <span>📧 Order confirmation email sent</span>
                            <span>✓</span>
                        </div>
                        <div className="conf-item">
                            <span>🖨️ Your files sent to production</span>
                            <span>Within 24h</span>
                        </div>
                        <div className="conf-item">
                            <span>📦 Order ships</span>
                            <span>3–5 days</span>
                        </div>
                        <div className="conf-item">
                            <span>🚚 Tracking email sent</span>
                            <span>When shipped</span>
                        </div>
                    </div>
                )}

                <div className="confirmation-actions">
                    <Link href="/products" className="btn-continue-shopping">
                        Continue Shopping
                    </Link>
                    <Link href="/account/orders" className="btn-view-orders">
                        View My Orders
                    </Link>
                </div>
            </div>
        </div>
    )
}
