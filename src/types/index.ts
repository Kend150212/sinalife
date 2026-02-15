/**
 * Shared TypeScript types
 */

import type { UserRole } from '@/generated/prisma'

// Extend NextAuth types
declare module 'next-auth' {
    interface User {
        role?: UserRole
    }

    interface Session {
        user: {
            id: string
            email: string
            name: string
            role: UserRole
        }
    }

    interface JWT {
        role?: UserRole
        id?: string
    }
}

// API Response types
export interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

// Product types for frontend
export interface ProductCardData {
    id: number
    name: string
    slug: string
    sku: string
    categorySlug: string | null
    categoryName: string | null
    images: string[]
    minPrice: number | null
    maxPrice: number | null
    enabled: boolean
    featured: boolean
}

export interface ProductDetailData extends ProductCardData {
    description: string | null
    shortDescription: string | null
    options: ProductOption[]
}

export interface ProductOption {
    id: number
    group: string
    name: string
}

// Cart types
export interface CartItemData {
    id: string
    productId: number
    productName: string
    productSlug: string
    productImage: string
    quantity: number
    selectedOptions: Record<string, string>
    files: string[]
    unitPrice: number
    total: number
}

// Order types
export interface OrderSummary {
    id: string
    orderNumber: string
    status: string
    total: number
    itemCount: number
    createdAt: string
}

// Shipping types
export interface ShippingOption {
    carrier: string
    method: string
    price: number
    days: number
}

// Settings types for admin
export interface SettingsFormData {
    branding: {
        siteName: string
        tagline: string
        primaryColor: string
        secondaryColor: string
        accentColor: string
        fromEmail: string
    }
    contact: {
        email: string
        phone: string
        address: string
        city: string
        state: string
        zip: string
        country: string
    }
    social: {
        facebook: string
        instagram: string
        twitter: string
        linkedin: string
        youtube: string
    }
}
