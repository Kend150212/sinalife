/**
 * POST /api/payments/stripe
 * Creates a Stripe Checkout Session for a given order
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createCheckoutSession } from '@/lib/payments/stripe'

export async function POST(request: NextRequest) {
    try {
        const { orderId } = await request.json()

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        const shippingInfo = order.shippingInfo as Record<string, string> | null
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

        const session = await createCheckoutSession({
            orderId: order.id,
            orderNumber: order.orderNumber,
            items: order.items.map(item => ({
                name: item.productName,
                description: `SKU: ${item.sku}`,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
            })),
            shippingCost: order.shippingCost,
            tax: order.tax,
            customerEmail: shippingInfo?.email || '',
            successUrl: `${baseUrl}/order/${order.id}/confirmed?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${baseUrl}/checkout?cancelled=true&orderId=${order.id}`,
        })

        if (!session) {
            // Stripe not configured — simulate success for demo
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: 'PAID',
                    paymentId: `demo_${Date.now()}`,
                    status: 'CONFIRMED',
                },
            })

            return NextResponse.json({
                success: true,
                demo: true,
                redirectUrl: `${baseUrl}/order/${order.id}/confirmed`,
            })
        }

        // Update order with Stripe session ID
        await prisma.order.update({
            where: { id: orderId },
            data: { paymentId: session.sessionId },
        })

        return NextResponse.json({
            success: true,
            sessionId: session.sessionId,
            url: session.url,
        })
    } catch (error) {
        console.error('Stripe session error:', error)
        return NextResponse.json(
            { error: 'Failed to create payment session' },
            { status: 500 }
        )
    }
}
