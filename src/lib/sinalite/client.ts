/**
 * Sinalite API Client
 * Handles authentication and all API communication with Sinalite
 */

interface SinaliteAuthResponse {
    access_token: string
    token_type: string
}

interface SinaliteProduct {
    id: number
    sku: string
    name: string
    category: string
    enabled: number
}

interface SinaliteOption {
    id: number
    group: string
    name: string
}

interface SinaliteVariant {
    price: number
    key: string
}

interface SinalitePriceResponse {
    price: string
    packageInfo: {
        'total weight': string
        'weight per box': string
        'Units Per Box': string
        'box size': string
        'number of boxes': string
    }
    productOptions: Record<string, string>
}

interface SinaliteOrderItem {
    productId: number
    options: Record<string, string>
    files: Array<{ type: string; url: string }>
}

interface SinaliteShippingInfo {
    ShipFName: string
    ShipLName: string
    ShipEmail: string
    ShipAddr: string
    ShipAddr2?: string
    ShipCity: string
    ShipState: string
    ShipZip: string
    ShipCountry: string
    ShipPhone: string
    ShipMethod: string
}

interface SinaliteBillingInfo {
    BillFName: string
    BillLName: string
    BillEmail: string
    BillAddr: string
    BillAddr2?: string
    BillCity: string
    BillState: string
    BillZip: string
    BillCountry: string
    BillPhone: string
}

interface SinaliteOrderRequest {
    items: SinaliteOrderItem[]
    shippingInfo: SinaliteShippingInfo
    billingInfo: SinaliteBillingInfo
    notes?: string
}

interface SinaliteOrderResponse {
    message: string
    orderId: number
    status: string
}

interface ShippingEstimateRequest {
    items: Array<{
        productId: number
        options: Record<string, string>
    }>
    shippingInfo: {
        ShipState: string
        ShipZip: string
        ShipCountry: string
    }
}

type ShippingRate = [string, string, number, number] // [carrier, method, price, days]

interface ShippingEstimateResponse {
    statusCode: number
    body: ShippingRate[]
}

class SinaliteClient {
    private baseUrl: string
    private clientId: string
    private clientSecret: string
    private audience: string
    private accessToken: string | null = null
    private tokenExpiry: number = 0

    constructor() {
        this.baseUrl = process.env.SINALITE_API_URL || 'https://api.sinaliteuppy.com'
        this.clientId = process.env.SINALITE_CLIENT_ID || ''
        this.clientSecret = process.env.SINALITE_CLIENT_SECRET || ''
        this.audience = process.env.SINALITE_AUDIENCE || 'https://apiconnect.sinalite.com'
    }

    /**
     * Get or refresh the auth token
     */
    private async authenticate(): Promise<string> {
        // Return cached token if still valid (with 5 min buffer)
        if (this.accessToken && Date.now() < this.tokenExpiry - 300000) {
            return this.accessToken
        }

        const response = await fetch(`${this.baseUrl}/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                audience: this.audience,
                grant_type: 'client_credentials',
            }),
        })

        if (!response.ok) {
            throw new Error(`Sinalite auth failed: ${response.status} ${response.statusText}`)
        }

        const data: SinaliteAuthResponse = await response.json()
        this.accessToken = data.access_token

        // JWT tokens typically expire in 24h, set expiry to 23h
        this.tokenExpiry = Date.now() + 23 * 60 * 60 * 1000

        return this.accessToken
    }

    /**
     * Make an authenticated request to the Sinalite API
     */
    private async request<T>(
        method: 'GET' | 'POST',
        path: string,
        body?: Record<string, unknown>
    ): Promise<T> {
        const token = await this.authenticate()

        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        }

        if (body) {
            options.body = JSON.stringify(body)
        }

        const response = await fetch(`${this.baseUrl}${path}`, options)

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Sinalite API error [${method} ${path}]: ${response.status} - ${errorText}`)
        }

        return response.json()
    }

    // ============================================
    // PRODUCTS
    // ============================================

    /**
     * Get all products
     */
    async getProducts(): Promise<SinaliteProduct[]> {
        return this.request<SinaliteProduct[]>('GET', '/product')
    }

    /**
     * Get a specific product
     */
    async getProduct(id: number): Promise<SinaliteProduct[]> {
        return this.request<SinaliteProduct[]>('GET', `/product/${id}`)
    }

    /**
     * Get product options and pricing data
     * storeCode: 9 = US, 6 = Canada
     */
    async getProductPricing(
        id: number,
        storeCode: number = 9
    ): Promise<[SinaliteOption[], Record<string, string>[], Array<{ metadata: string }>]> {
        return this.request('GET', `/product/${id}/${storeCode}`)
    }

    // ============================================
    // PRICING
    // ============================================

    /**
     * Calculate price for a specific product option combination
     */
    async calculatePrice(
        productId: number,
        optionIds: number[],
        storeCode: number = 9
    ): Promise<SinalitePriceResponse> {
        return this.request<SinalitePriceResponse>('POST', `/price/${productId}/${storeCode}`, {
            productOptions: optionIds,
        })
    }

    /**
     * Get all variants with pricing (paginated, 1000 per page)
     */
    async getVariants(productId: number, offset: number = 0): Promise<SinaliteVariant[]> {
        return this.request<SinaliteVariant[]>('GET', `/variants/${productId}/${offset}`)
    }

    /**
     * Get price by variant key
     */
    async getPriceByKey(productId: number, key: string): Promise<[{ price: number }]> {
        return this.request('GET', `/pricedbykey/${productId}/${key}`)
    }

    // ============================================
    // ORDERS
    // ============================================

    /**
     * Place an order with Sinalite
     */
    async placeOrder(order: SinaliteOrderRequest): Promise<SinaliteOrderResponse> {
        return this.request<SinaliteOrderResponse>('POST', '/order/new', order as unknown as Record<string, unknown>)
    }

    /**
     * Get shipping estimate
     */
    async getShippingEstimate(data: ShippingEstimateRequest): Promise<ShippingEstimateResponse> {
        return this.request<ShippingEstimateResponse>('POST', '/order/shippingEstimate', data as unknown as Record<string, unknown>)
    }
}

// Singleton instance
const globalForSinalite = globalThis as unknown as {
    sinaliteClient: SinaliteClient | undefined
}

export const sinalite = globalForSinalite.sinaliteClient ?? new SinaliteClient()

if (process.env.NODE_ENV !== 'production') globalForSinalite.sinaliteClient = sinalite

export type {
    SinaliteProduct,
    SinaliteOption,
    SinaliteVariant,
    SinalitePriceResponse,
    SinaliteOrderRequest,
    SinaliteOrderResponse,
    SinaliteShippingInfo,
    SinaliteBillingInfo,
    SinaliteOrderItem,
    ShippingEstimateRequest,
    ShippingEstimateResponse,
    ShippingRate,
}
