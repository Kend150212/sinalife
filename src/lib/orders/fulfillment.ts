/**
 * Order Fulfillment Service
 * Handles automatic order submission to Sinalite after payment
 */

import { prisma } from '@/lib/db'
import { sinalite } from '@/lib/sinalite/client'
import type { SinaliteShippingInfo, SinaliteBillingInfo, SinaliteOrderItem } from '@/lib/sinalite/client'

/**
 * Submit a paid order to Sinalite for fulfillment
 */
export async function submitToSinalite(orderId: string): Promise<{
    success: boolean
    sinaliteOrderId?: number
    error?: string
}> {
    try {
        // 1. Fetch the order with items
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: { include: { product: true } },
                user: true,
            },
        })

        if (!order) {
            return { success: false, error: 'Order not found' }
        }

        if (order.sinaliteOrderId) {
            return { success: true, sinaliteOrderId: order.sinaliteOrderId }
        }

        // 2. Build Sinalite order items
        const shippingInfo = order.shippingInfo as Record<string, string> | null
        const billingInfo = order.billingInfo as Record<string, string> | null

        const sinaliteItems: SinaliteOrderItem[] = order.items.map(item => ({
            productId: item.product.sinaliteProductId,
            options: item.selectedOptions as Record<string, string>,
            files: (item.files as Array<{ type: string; url: string }>) || [],
        }))

        const sinaliteShipping: SinaliteShippingInfo = {
            ShipFName: shippingInfo?.firstName || '',
            ShipLName: shippingInfo?.lastName || '',
            ShipEmail: shippingInfo?.email || order.user.email,
            ShipAddr: shippingInfo?.address1 || '',
            ShipAddr2: shippingInfo?.address2 || '',
            ShipCity: shippingInfo?.city || '',
            ShipState: shippingInfo?.state || '',
            ShipZip: shippingInfo?.zipCode || '',
            ShipCountry: shippingInfo?.country || 'US',
            ShipPhone: shippingInfo?.phone || '',
            ShipMethod: order.shippingMethod || 'Ground',
        }

        const sinaliteBilling: SinaliteBillingInfo = {
            BillFName: billingInfo?.firstName || shippingInfo?.firstName || '',
            BillLName: billingInfo?.lastName || shippingInfo?.lastName || '',
            BillEmail: billingInfo?.email || order.user.email,
            BillAddr: billingInfo?.address1 || shippingInfo?.address1 || '',
            BillAddr2: billingInfo?.address2 || shippingInfo?.address2 || '',
            BillCity: billingInfo?.city || shippingInfo?.city || '',
            BillState: billingInfo?.state || shippingInfo?.state || '',
            BillZip: billingInfo?.zipCode || shippingInfo?.zipCode || '',
            BillCountry: billingInfo?.country || shippingInfo?.country || 'US',
            BillPhone: billingInfo?.phone || shippingInfo?.phone || '',
        }

        // 3. Submit to Sinalite
        const response = await sinalite.placeOrder({
            items: sinaliteItems,
            shippingInfo: sinaliteShipping,
            billingInfo: sinaliteBilling,
            notes: `Web Order #${order.orderNumber}`,
        })

        // 4. Update order with Sinalite response
        await prisma.order.update({
            where: { id: orderId },
            data: {
                sinaliteOrderId: response.orderId,
                status: 'PROCESSING',
                sinaliteResponse: JSON.parse(JSON.stringify(response)),
            },
        })

        return { success: true, sinaliteOrderId: response.orderId }
    } catch (error) {
        console.error('Failed to submit order to Sinalite:', error)

        // Store the error but don't block the order
        await prisma.order.update({
            where: { id: orderId },
            data: {
                sinaliteResponse: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    failedAt: new Date().toISOString(),
                },
            },
        })

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to submit to Sinalite',
        }
    }
}

/**
 * Generate a unique order number 
 */
export function generateOrderNumber(): string {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `PP-${year}${month}${day}-${random}`
}
