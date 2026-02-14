/**
 * PayPal Payment Service
 * Handles PayPal order creation and capture
 */

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ''
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ''
const PAYPAL_API_URL = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'

export const paypalConfigured = !!(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET)

/**
 * Get PayPal access token
 */
async function getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')

    const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${auth}`,
        },
        body: 'grant_type=client_credentials',
    })

    if (!response.ok) {
        throw new Error(`PayPal auth failed: ${response.status}`)
    }

    const data = await response.json()
    return data.access_token
}

interface PayPalItem {
    name: string
    quantity: number
    unitPrice: number
}

/**
 * Create a PayPal order
 */
export async function createPayPalOrder(params: {
    orderId: string
    orderNumber: string
    items: PayPalItem[]
    shippingCost: number
    tax: number
    total: number
}): Promise<{ paypalOrderId: string; approvalUrl: string } | null> {
    if (!paypalConfigured) {
        console.warn('PayPal not configured — skipping order creation')
        return null
    }

    const accessToken = await getAccessToken()

    const itemTotal = params.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

    const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [{
                reference_id: params.orderId,
                description: `Order ${params.orderNumber}`,
                amount: {
                    currency_code: 'USD',
                    value: params.total.toFixed(2),
                    breakdown: {
                        item_total: { currency_code: 'USD', value: itemTotal.toFixed(2) },
                        shipping: { currency_code: 'USD', value: params.shippingCost.toFixed(2) },
                        tax_total: { currency_code: 'USD', value: params.tax.toFixed(2) },
                    },
                },
                items: params.items.map(item => ({
                    name: item.name.substring(0, 127),
                    quantity: String(item.quantity),
                    unit_amount: { currency_code: 'USD', value: item.unitPrice.toFixed(2) },
                })),
            }],
            payment_source: {
                paypal: {
                    experience_context: {
                        payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
                        brand_name: 'PrintPro',
                        landing_page: 'LOGIN',
                        user_action: 'PAY_NOW',
                        return_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/order/${params.orderId}/confirmed`,
                        cancel_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/checkout?cancelled=true`,
                    },
                },
            },
        }),
    })

    if (!response.ok) {
        const err = await response.text()
        throw new Error(`PayPal create order failed: ${response.status} - ${err}`)
    }

    const data = await response.json()
    const approvalUrl = data.links?.find((l: { rel: string; href: string }) => l.rel === 'payer-action')?.href || ''

    return {
        paypalOrderId: data.id,
        approvalUrl,
    }
}

/**
 * Capture a PayPal order (after customer approval)
 */
export async function capturePayPalOrder(paypalOrderId: string): Promise<{
    status: string
    captureId: string
} | null> {
    if (!paypalConfigured) return null

    const accessToken = await getAccessToken()

    const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${paypalOrderId}/capture`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
    })

    if (!response.ok) {
        const err = await response.text()
        throw new Error(`PayPal capture failed: ${response.status} - ${err}`)
    }

    const data = await response.json()
    const capture = data.purchase_units?.[0]?.payments?.captures?.[0]

    return {
        status: data.status,
        captureId: capture?.id || '',
    }
}
