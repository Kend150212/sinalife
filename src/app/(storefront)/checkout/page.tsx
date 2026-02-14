'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

// Image map for thumbnails
const categoryImages: Record<string, string> = {
    'business-cards': '/images/products/business_cards.png',
    'flyers-brochures': '/images/products/flyers_brochures.png',
    'banners-signs': '/images/products/banners_signs.png',
    'stickers': '/images/products/custom_stickers.png',
    'print-products': '/images/products/print_products.png',
    'apparel': '/images/products/apparel_products.png',
}

function getProductImage(slug: string): string {
    for (const [key, val] of Object.entries(categoryImages)) {
        if (slug.includes(key) || key.includes(slug.split('-')[0])) return val
    }
    return categoryImages['business-cards']
}

interface CartItem {
    productId: number
    name: string
    slug: string
    sku: string
    image: string
    options: Record<string, string>
    optionLabels?: Record<string, string>
    quantity: number
    unitPrice: number
    artworkFile?: string
}

const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
    'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
    'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
]

const SHIPPING_METHODS = [
    { id: 'ground', name: 'Ground Shipping', desc: '5–7 business days', price: 9.99 },
    { id: 'express', name: 'Express Shipping', desc: '2–3 business days', price: 19.99 },
    { id: 'overnight', name: 'Overnight Shipping', desc: '1 business day', price: 34.99 },
]

export default function CheckoutPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [cart, setCart] = useState<CartItem[]>([])
    const [processing, setProcessing] = useState(false)

    // Form state
    const [shipping, setShipping] = useState({
        firstName: '', lastName: '', email: '', phone: '',
        address1: '', address2: '', city: '', state: '', zipCode: '', country: 'US',
    })
    const [shippingMethod, setShippingMethod] = useState('ground')
    const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe')

    useEffect(() => {
        const stored = localStorage.getItem('printpro_cart')
        if (stored) {
            const items = JSON.parse(stored) as CartItem[]
            if (items.length === 0) {
                router.push('/cart')
                return
            }
            setCart(items)
        } else {
            router.push('/cart')
        }
    }, [router])

    const subtotal = cart.reduce((s, item) => s + item.unitPrice * item.quantity, 0)
    const selectedShipping = SHIPPING_METHODS.find(m => m.id === shippingMethod) || SHIPPING_METHODS[0]
    const tax = subtotal * 0.08 // estimate 8% sales tax
    const total = subtotal + selectedShipping.price + tax

    const steps = [
        { num: 1, label: 'Shipping' },
        { num: 2, label: 'Method' },
        { num: 3, label: 'Payment' },
        { num: 4, label: 'Review' },
    ]

    const canProceedStep1 = shipping.firstName && shipping.lastName && shipping.email && shipping.address1 && shipping.city && shipping.state && shipping.zipCode

    async function handlePlaceOrder() {
        setProcessing(true)
        try {
            // 1. Create order
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shipping,
                    items: cart,
                    shippingMethod: selectedShipping.name,
                    shippingCost: selectedShipping.price,
                    tax,
                    paymentMethod,
                }),
            })

            const data = await res.json()
            if (!data.success) throw new Error(data.error || 'Checkout failed')

            // 2. Initiate payment
            const payUrl = paymentMethod === 'stripe'
                ? '/api/payments/stripe'
                : '/api/payments/paypal'

            const payRes = await fetch(payUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: data.orderId }),
            })

            const payData = await payRes.json()

            // 3. Clear cart
            localStorage.removeItem('printpro_cart')

            // 4. Redirect
            if (payData.url) {
                // Stripe hosted checkout
                window.location.href = payData.url
            } else if (payData.approvalUrl) {
                // PayPal approval
                window.location.href = payData.approvalUrl
            } else if (payData.redirectUrl) {
                // Demo mode
                router.push(payData.redirectUrl)
            } else {
                router.push(`/order/${data.orderId}/confirmed`)
            }
        } catch (err) {
            console.error('Order error:', err)
            setProcessing(false)
            alert('Something went wrong. Please try again.')
        }
    }

    function updateShipping(field: string, value: string) {
        setShipping(prev => ({ ...prev, [field]: value }))
    }

    if (cart.length === 0 && !processing) {
        return (
            <div className="checkout-page" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                <p>Loading...</p>
            </div>
        )
    }

    return (
        <div className="checkout-page">
            <h1>Checkout</h1>

            {/* Step Indicator */}
            <div className="checkout-steps">
                {steps.map((s, i) => (
                    <div key={s.num} style={{ display: 'flex', alignItems: 'center' }}>
                        <div
                            className={`step-item ${step === s.num ? 'active' : ''} ${step > s.num ? 'completed' : ''}`}
                            onClick={() => s.num < step && setStep(s.num)}
                        >
                            <div className="step-number">
                                {step > s.num ? '✓' : s.num}
                            </div>
                            <span className="step-label">{s.label}</span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`step-divider ${step > s.num ? 'active' : ''}`} />
                        )}
                    </div>
                ))}
            </div>

            <div className="checkout-layout">
                {/* Main Form */}
                <div className="checkout-form-card">
                    {/* STEP 1: Shipping Info */}
                    {step === 1 && (
                        <>
                            <h2>📦 Shipping Information</h2>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>First Name *</label>
                                    <input
                                        type="text"
                                        value={shipping.firstName}
                                        onChange={e => updateShipping('firstName', e.target.value)}
                                        placeholder="John"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Last Name *</label>
                                    <input
                                        type="text"
                                        value={shipping.lastName}
                                        onChange={e => updateShipping('lastName', e.target.value)}
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        value={shipping.email}
                                        onChange={e => updateShipping('email', e.target.value)}
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input
                                        type="tel"
                                        value={shipping.phone}
                                        onChange={e => updateShipping('phone', e.target.value)}
                                        placeholder="(555) 123-4567"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Address Line 1 *</label>
                                <input
                                    type="text"
                                    value={shipping.address1}
                                    onChange={e => updateShipping('address1', e.target.value)}
                                    placeholder="123 Main Street"
                                />
                            </div>
                            <div className="form-group">
                                <label>Address Line 2</label>
                                <input
                                    type="text"
                                    value={shipping.address2}
                                    onChange={e => updateShipping('address2', e.target.value)}
                                    placeholder="Apt 4B"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>City *</label>
                                    <input
                                        type="text"
                                        value={shipping.city}
                                        onChange={e => updateShipping('city', e.target.value)}
                                        placeholder="New York"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>State *</label>
                                    <select
                                        value={shipping.state}
                                        onChange={e => updateShipping('state', e.target.value)}
                                    >
                                        <option value="">Select State</option>
                                        {US_STATES.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>ZIP Code *</label>
                                    <input
                                        type="text"
                                        value={shipping.zipCode}
                                        onChange={e => updateShipping('zipCode', e.target.value)}
                                        placeholder="10001"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Country</label>
                                    <select value={shipping.country} onChange={e => updateShipping('country', e.target.value)}>
                                        <option value="US">United States</option>
                                        <option value="CA">Canada</option>
                                    </select>
                                </div>
                            </div>

                            <div className="checkout-nav">
                                <Link href="/cart" className="btn-back">← Back to Cart</Link>
                                <button
                                    className="btn-next"
                                    disabled={!canProceedStep1}
                                    onClick={() => setStep(2)}
                                >
                                    Continue to Shipping →
                                </button>
                            </div>
                        </>
                    )}

                    {/* STEP 2: Shipping Method */}
                    {step === 2 && (
                        <>
                            <h2>🚚 Shipping Method</h2>
                            <div className="shipping-methods">
                                {SHIPPING_METHODS.map(method => (
                                    <div
                                        key={method.id}
                                        className={`shipping-option ${shippingMethod === method.id ? 'selected' : ''}`}
                                        onClick={() => setShippingMethod(method.id)}
                                    >
                                        <div className="shipping-left">
                                            <div className="ship-radio" />
                                            <div className="ship-info">
                                                <h4>{method.name}</h4>
                                                <p>{method.desc}</p>
                                            </div>
                                        </div>
                                        <div className="ship-price">${method.price.toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="checkout-nav">
                                <button className="btn-back" onClick={() => setStep(1)}>← Shipping Info</button>
                                <button className="btn-next" onClick={() => setStep(3)}>
                                    Continue to Payment →
                                </button>
                            </div>
                        </>
                    )}

                    {/* STEP 3: Payment Method */}
                    {step === 3 && (
                        <>
                            <h2>💳 Payment Method</h2>
                            <div className="payment-methods">
                                <div
                                    className={`payment-option ${paymentMethod === 'stripe' ? 'selected' : ''}`}
                                    onClick={() => setPaymentMethod('stripe')}
                                >
                                    <div className="payment-icon">💳</div>
                                    <div className="payment-info">
                                        <h4>Credit / Debit Card</h4>
                                        <p>Visa, Mastercard, Amex — powered by Stripe</p>
                                    </div>
                                </div>
                                <div
                                    className={`payment-option ${paymentMethod === 'paypal' ? 'selected' : ''}`}
                                    onClick={() => setPaymentMethod('paypal')}
                                >
                                    <div className="payment-icon">🅿️</div>
                                    <div className="payment-info">
                                        <h4>PayPal</h4>
                                        <p>Pay with your PayPal account</p>
                                    </div>
                                </div>
                            </div>

                            <div className="checkout-nav">
                                <button className="btn-back" onClick={() => setStep(2)}>← Shipping Method</button>
                                <button className="btn-next" onClick={() => setStep(4)}>
                                    Review Order →
                                </button>
                            </div>
                        </>
                    )}

                    {/* STEP 4: Review */}
                    {step === 4 && (
                        <>
                            <h2>📋 Review Your Order</h2>

                            <div className="review-section">
                                <h3>📦 Shipping To</h3>
                                <div className="review-info">
                                    <strong>{shipping.firstName} {shipping.lastName}</strong><br />
                                    {shipping.address1}{shipping.address2 && `, ${shipping.address2}`}<br />
                                    {shipping.city}, {shipping.state} {shipping.zipCode}<br />
                                    {shipping.email} {shipping.phone && `• ${shipping.phone}`}
                                </div>
                            </div>

                            <div className="review-section">
                                <h3>🚚 Shipping Method</h3>
                                <div className="review-info">
                                    {selectedShipping.name} — {selectedShipping.desc} — <strong>${selectedShipping.price.toFixed(2)}</strong>
                                </div>
                            </div>

                            <div className="review-section">
                                <h3>💳 Payment</h3>
                                <div className="review-info">
                                    {paymentMethod === 'stripe' ? 'Credit / Debit Card (Stripe)' : 'PayPal'}
                                </div>
                            </div>

                            <div className="review-section">
                                <h3>🛒 Items ({cart.length})</h3>
                                <div className="review-items">
                                    {cart.map((item, i) => {
                                        const imgSrc = item.image?.startsWith('/') ? item.image : getProductImage(item.slug)
                                        return (
                                            <div key={i} className="review-item">
                                                <div className="review-item-image">
                                                    {imgSrc.startsWith('/') ? (
                                                        <Image src={imgSrc} alt={item.name} width={56} height={56} style={{ objectFit: 'cover' }} />
                                                    ) : (
                                                        <span style={{ fontSize: '1.5rem' }}>{item.image}</span>
                                                    )}
                                                </div>
                                                <div className="review-item-details">
                                                    <h4>{item.name}</h4>
                                                    <p>Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}</p>
                                                </div>
                                                <div className="review-item-price">
                                                    ${(item.unitPrice * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="checkout-nav">
                                <button className="btn-back" onClick={() => setStep(3)}>← Payment</button>
                                <button
                                    className="btn-pay"
                                    onClick={handlePlaceOrder}
                                    disabled={processing}
                                >
                                    🔒 Place Order — ${total.toFixed(2)}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Order Summary Sidebar */}
                <div className="order-summary-card">
                    <h3>Order Summary</h3>

                    {cart.map((item, i) => {
                        const imgSrc = item.image?.startsWith('/') ? item.image : getProductImage(item.slug)
                        return (
                            <div key={i} className="summary-item">
                                <div className="summary-item-thumb">
                                    {imgSrc.startsWith('/') ? (
                                        <Image src={imgSrc} alt={item.name} width={44} height={44} style={{ objectFit: 'cover' }} />
                                    ) : (
                                        <span>{item.image}</span>
                                    )}
                                </div>
                                <div className="summary-item-info">
                                    <h4>{item.name}</h4>
                                    <span>Qty: {item.quantity}</span>
                                </div>
                                <div className="summary-item-price">
                                    ${(item.unitPrice * item.quantity).toFixed(2)}
                                </div>
                            </div>
                        )
                    })}

                    <div className="summary-totals">
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Shipping</span>
                            <span>${selectedShipping.price.toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Est. Tax</span>
                            <span>${tax.toFixed(2)}</span>
                        </div>
                        <div className="summary-row total">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="secure-badge">
                        🔒 Secure 256-bit SSL encryption
                    </div>
                </div>
            </div>

            {/* Processing Overlay */}
            {processing && (
                <div className="processing-overlay">
                    <div className="processing-card">
                        <div className="processing-spinner" />
                        <h3>Processing your order...</h3>
                        <p>Please don&apos;t close this page.</p>
                    </div>
                </div>
            )}
        </div>
    )
}
