/**
 * POST /api/payments/stripe/webhook
 * Handles Stripe webhook events
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { constructWebhookEvent } from '@/lib/payments/stripe'
import { submitToSinalite } from '@/lib/orders/fulfillment'

export async function POST(request: NextRequest) {
    try {
        const body = await request.text()
        const signature = request.headers.get('stripe-signature') || ''

        const event = constructWebhookEvent(body, signature)

        if (!event) {
            return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
        }

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as { metadata?: { orderId?: string }; payment_status?: string }
                const orderId = session.metadata?.orderId

                if (orderId && session.payment_status === 'paid') {
                    // Mark order as paid
                    await prisma.order.update({
                        where: { id: orderId },
                        data: {
                            paymentStatus: 'PAID',
                            status: 'CONFIRMED',
                        },
                    })

                    // Auto-submit to Sinalite
                    await submitToSinalite(orderId)
                }
                break
            }

            case 'checkout.session.expired': {
                const session = event.data.object as { metadata?: { orderId?: string } }
                const orderId = session.metadata?.orderId

                if (orderId) {
                    await prisma.order.update({
                        where: { id: orderId },
                        data: {
                            paymentStatus: 'FAILED',
                            status: 'CANCELLED',
                        },
                    })
                }
                break
            }
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Stripe webhook error:', error)
        return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
    }
}
