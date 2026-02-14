/**
 * POST /api/payments/paypal — Create PayPal order
 * PATCH /api/payments/paypal — Capture PayPal payment
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createPayPalOrder, capturePayPalOrder } from '@/lib/payments/paypal'
import { submitToSinalite } from '@/lib/orders/fulfillment'

/**
 * POST — Create PayPal order
 */
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

        const result = await createPayPalOrder({
            orderId: order.id,
            orderNumber: order.orderNumber,
            items: order.items.map(item => ({
                name: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
            })),
            shippingCost: order.shippingCost,
            tax: order.tax,
            total: order.total,
        })

        if (!result) {
            // PayPal not configured — simulate success for demo
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: 'PAID',
                    paymentId: `demo_paypal_${Date.now()}`,
                    status: 'CONFIRMED',
                },
            })

            const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
            return NextResponse.json({
                success: true,
                demo: true,
                redirectUrl: `${baseUrl}/order/${order.id}/confirmed`,
            })
        }

        // Store PayPal order ID
        await prisma.order.update({
            where: { id: orderId },
            data: { paymentId: result.paypalOrderId },
        })

        return NextResponse.json({
            success: true,
            paypalOrderId: result.paypalOrderId,
            approvalUrl: result.approvalUrl,
        })
    } catch (error) {
        console.error('PayPal create error:', error)
        return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 500 })
    }
}

/**
 * PATCH — Capture PayPal payment after customer approval
 */
export async function PATCH(request: NextRequest) {
    try {
        const { orderId, paypalOrderId } = await request.json()

        if (!orderId || !paypalOrderId) {
            return NextResponse.json({ error: 'Order ID and PayPal order ID required' }, { status: 400 })
        }

        const result = await capturePayPalOrder(paypalOrderId)

        if (!result || result.status !== 'COMPLETED') {
            return NextResponse.json({ error: 'Payment capture failed' }, { status: 400 })
        }

        // Mark order as paid
        await prisma.order.update({
            where: { id: orderId },
            data: {
                paymentStatus: 'PAID',
                paymentId: result.captureId,
                status: 'CONFIRMED',
            },
        })

        // Auto-submit to Sinalite
        await submitToSinalite(orderId)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('PayPal capture error:', error)
        return NextResponse.json({ error: 'Failed to capture payment' }, { status: 500 })
    }
}
