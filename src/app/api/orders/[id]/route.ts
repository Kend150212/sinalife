/**
 * GET /api/orders/[id]
 * Fetch order details by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: true,
                user: { select: { email: true, firstName: true, lastName: true } },
            },
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        return NextResponse.json({
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus,
            subtotal: order.subtotal,
            shippingCost: order.shippingCost,
            tax: order.tax,
            total: order.total,
            shippingMethod: order.shippingMethod,
            shippingInfo: order.shippingInfo,
            billingInfo: order.billingInfo,
            items: order.items.map(item => ({
                productName: item.productName,
                sku: item.sku,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
                selectedOptions: item.selectedOptions,
            })),
            createdAt: order.createdAt,
        })
    } catch (error) {
        console.error('Order fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
    }
}
