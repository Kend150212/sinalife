/**
 * POST /api/checkout
 * Creates an order from the checkout form + cart items
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateOrderNumber } from '@/lib/orders/fulfillment'

interface CheckoutCartItem {
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

interface CheckoutBody {
    // Shipping
    shipping: {
        firstName: string
        lastName: string
        email: string
        phone: string
        address1: string
        address2?: string
        city: string
        state: string
        zipCode: string
        country: string
    }
    // Billing (optional - same as shipping if not provided)
    billing?: {
        firstName: string
        lastName: string
        email: string
        phone: string
        address1: string
        address2?: string
        city: string
        state: string
        zipCode: string
        country: string
    }
    // Cart items
    items: CheckoutCartItem[]
    // Shipping method + cost
    shippingMethod: string
    shippingCost: number
    tax: number
    // Payment method choice
    paymentMethod: 'stripe' | 'paypal'
}

export async function POST(request: NextRequest) {
    try {
        const body: CheckoutBody = await request.json()

        // Validate required fields
        if (!body.shipping?.email || !body.shipping?.firstName || !body.items?.length) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Calculate totals
        const subtotal = body.items.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0
        )
        const total = subtotal + body.shippingCost + body.tax

        // Find or create guest user
        let user = await prisma.user.findUnique({
            where: { email: body.shipping.email },
        })

        if (!user) {
            // Create a guest user account
            user = await prisma.user.create({
                data: {
                    email: body.shipping.email,
                    firstName: body.shipping.firstName,
                    lastName: body.shipping.lastName,
                    phone: body.shipping.phone || '',
                    passwordHash: '', // guest user — no password
                    role: 'CUSTOMER',
                },
            })
        }

        // Generate order number
        const orderNumber = generateOrderNumber()

        // Create the order
        const order = await prisma.order.create({
            data: {
                orderNumber,
                userId: user.id,
                status: 'PENDING',
                paymentMethod: body.paymentMethod === 'stripe' ? 'STRIPE' : 'PAYPAL',
                paymentStatus: 'PENDING',
                subtotal,
                shippingCost: body.shippingCost,
                tax: body.tax,
                total,
                shippingMethod: body.shippingMethod,
                shippingInfo: body.shipping,
                billingInfo: body.billing || body.shipping,
                items: {
                    create: body.items.map(item => ({
                        productId: item.productId,
                        productName: item.name,
                        sku: item.sku,
                        quantity: item.quantity,
                        selectedOptions: item.options,
                        files: item.artworkFile
                            ? [{ type: 'artwork', url: item.artworkFile }]
                            : [],
                        unitPrice: item.unitPrice,
                        costPrice: item.unitPrice * 0.65, // estimate wholesale ~65% of retail
                        total: item.unitPrice * item.quantity,
                    })),
                },
            },
            include: { items: true },
        })

        return NextResponse.json({
            success: true,
            orderId: order.id,
            orderNumber: order.orderNumber,
            total: order.total,
        })
    } catch (error) {
        console.error('Checkout error:', error)
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        )
    }
}
