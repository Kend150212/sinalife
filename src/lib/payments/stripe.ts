/**
 * Stripe Payment Service
 * Handles Stripe Checkout Sessions and webhook processing
 */

import Stripe from 'stripe'

// Initialize Stripe with API key (falls back gracefully if not set)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || ''

export const stripe = stripeSecretKey
    ? new Stripe(stripeSecretKey, { apiVersion: '2025-04-30.basil' })
    : null

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

interface CheckoutItem {
    name: string
    description?: string
    quantity: number
    unitPrice: number // in dollars
    image?: string
}

/**
 * Create a Stripe Checkout Session
 */
export async function createCheckoutSession(params: {
    orderId: string
    orderNumber: string
    items: CheckoutItem[]
    shippingCost: number
    tax: number
    customerEmail: string
    successUrl: string
    cancelUrl: string
}): Promise<{ sessionId: string; url: string } | null> {
    if (!stripe) {
        console.warn('Stripe not configured — skipping payment session creation')
        return null
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = params.items.map(item => ({
        price_data: {
            currency: 'usd',
            product_data: {
                name: item.name,
                description: item.description,
                ...(item.image ? { images: [item.image] } : {}),
            },
            unit_amount: Math.round(item.unitPrice * 100), // Stripe uses cents
        },
        quantity: item.quantity,
    }))

    // Add shipping as a line item
    if (params.shippingCost > 0) {
        lineItems.push({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: 'Shipping',
                    description: 'Standard shipping',
                },
                unit_amount: Math.round(params.shippingCost * 100),
            },
            quantity: 1,
        })
    }

    // Add tax as a line item
    if (params.tax > 0) {
        lineItems.push({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: 'Tax',
                    description: 'Estimated sales tax',
                },
                unit_amount: Math.round(params.tax * 100),
            },
            quantity: 1,
        })
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        customer_email: params.customerEmail,
        metadata: {
            orderId: params.orderId,
            orderNumber: params.orderNumber,
        },
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
    })

    return {
        sessionId: session.id,
        url: session.url || '',
    }
}

/**
 * Verify and construct a Stripe webhook event
 */
export function constructWebhookEvent(
    payload: string | Buffer,
    signature: string
): Stripe.Event | null {
    if (!stripe) return null

    try {
        return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET)
    } catch (err) {
        console.error('Stripe webhook signature verification failed:', err)
        return null
    }
}
