'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface CartItem {
    productId: number
    name: string
    slug: string
    sku: string
    image: string
    options: Record<string, string>
    quantity: number
    unitPrice: number
    totalPrice: number
    artwork?: string
    addedAt: string
}

export default function CartPage() {
    const [items, setItems] = useState<CartItem[]>([])
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        loadCart()

        const handler = () => loadCart()
        window.addEventListener('cart-updated', handler)
        return () => window.removeEventListener('cart-updated', handler)
    }, [])

    const loadCart = () => {
        const stored = localStorage.getItem('printpro_cart')
        if (stored) {
            setItems(JSON.parse(stored))
        }
    }

    const saveCart = (newItems: CartItem[]) => {
        localStorage.setItem('printpro_cart', JSON.stringify(newItems))
        setItems(newItems)
        window.dispatchEvent(new Event('cart-updated'))
    }

    const updateQuantity = (index: number, delta: number) => {
        const updated = [...items]
        updated[index].quantity = Math.max(1, updated[index].quantity + delta)
        updated[index].totalPrice = updated[index].unitPrice * updated[index].quantity
        saveCart(updated)
    }

    const removeItem = (index: number) => {
        const updated = items.filter((_, i) => i !== index)
        saveCart(updated)
    }

    const clearCart = () => {
        saveCart([])
    }

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
    const shipping = subtotal > 0 ? 9.99 : 0
    const tax = subtotal * 0.08
    const total = subtotal + shipping + tax

    if (!mounted) return null

    if (items.length === 0) {
        return (
            <div className="cart-page">
                <div className="cart-empty">
                    <span className="cart-empty-icon">🛒</span>
                    <h2>Your cart is empty</h2>
                    <p>Looks like you haven&apos;t added anything yet.</p>
                    <Link href="/products" className="btn-checkout" style={{ display: 'inline-block', maxWidth: '240px' }}>
                        Browse Products
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="cart-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h1>Shopping Cart</h1>
                <button onClick={clearCart} style={{ fontSize: '13px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Clear All
                </button>
            </div>
            <p className="cart-subtitle">{items.length} {items.length === 1 ? 'item' : 'items'} in your cart</p>

            <div className="cart-layout">
                {/* Cart Items */}
                <div className="cart-items">
                    {items.map((item, idx) => (
                        <div key={`${item.slug}-${idx}`} className="cart-item">
                            <div className="cart-item-image" style={{ overflow: 'hidden' }}>
                                {item.image && item.image.startsWith('/') ? (
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        width={80}
                                        height={80}
                                        style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: '8px' }}
                                    />
                                ) : (
                                    <span style={{ fontSize: '28px' }}>{item.image || '📦'}</span>
                                )}
                            </div>
                            <div className="cart-item-info">
                                <h3>{item.name}</h3>
                                <p>SKU: {item.sku}</p>
                                <div className="cart-item-options">
                                    {Object.entries(item.options).map(([key, val]) => (
                                        <span key={key}>{key}: {val} · </span>
                                    ))}
                                </div>
                                {item.artwork && (
                                    <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px' }}>
                                        📎 {item.artwork}
                                    </div>
                                )}
                                <button className="cart-item-remove" onClick={() => removeItem(idx)}>
                                    ✕ Remove
                                </button>
                            </div>
                            <div className="cart-item-qty">
                                <button onClick={() => updateQuantity(idx, -1)}>−</button>
                                <span>{item.quantity}</span>
                                <button onClick={() => updateQuantity(idx, 1)}>+</button>
                            </div>
                            <div className="cart-item-price">
                                ${item.totalPrice.toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Cart Summary */}
                <div className="cart-summary">
                    <h3>Order Summary</h3>
                    <div className="cart-summary-row">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="cart-summary-row">
                        <span>Shipping (est.)</span>
                        <span>${shipping.toFixed(2)}</span>
                    </div>
                    <div className="cart-summary-row">
                        <span>Tax (est.)</span>
                        <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="cart-summary-total">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                    <Link href="/checkout" className="btn-checkout">
                        Proceed to Checkout
                    </Link>
                    <Link href="/products" className="cart-continue">
                        ← Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    )
}
