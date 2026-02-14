/**
 * Site Settings Helper
 * Manages all site configuration from the database
 */

import prisma from '@/lib/db'
import { cached, invalidateCache } from '@/lib/redis'

export interface BrandingSettings {
    siteName: string
    tagline: string
    logoLight: string
    logoDark: string
    favicon: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
    fromEmail: string
}

export interface ContactSettings {
    email: string
    phone: string
    address: string
    city: string
    state: string
    zip: string
    country: string
}

export interface SocialSettings {
    facebook: string
    instagram: string
    twitter: string
    linkedin: string
    youtube: string
}

export interface SeoSettings {
    title: string
    description: string
    ogImage: string
    keywords: string
}

export interface SmtpSettings {
    host: string
    port: string
    secure: string
    user: string
    pass: string
}

export interface SinaliteSettings {
    apiUrl: string
    clientId: string
    clientSecret: string
    audience: string
    storeCode: string
}

export interface PaymentSettings {
    stripeEnabled: boolean
    stripePublishableKey: string
    stripeSecretKey: string
    stripeWebhookSecret: string
    paypalEnabled: boolean
    paypalClientId: string
    paypalClientSecret: string
    paypalMode: string
}

type SettingKey = 'branding' | 'contact' | 'social' | 'seo' | 'smtp' | 'sinalite' | 'payments'

/**
 * Get a setting by key (with Redis caching)
 */
export async function getSetting<T>(key: SettingKey): Promise<T | null> {
    return cached(`settings:${key}`, 600, async () => {
        const setting = await prisma.siteSetting.findUnique({
            where: { key },
        })
        return (setting?.value as T) ?? null
    })
}

/**
 * Set/update a setting
 */
export async function setSetting<T>(key: SettingKey, value: T, group?: string): Promise<void> {
    await prisma.siteSetting.upsert({
        where: { key },
        update: { value: value as object },
        create: { key, value: value as object, group: group || 'general' },
    })

    // Invalidate cache
    await invalidateCache(`settings:${key}`)
}

/**
 * Get all settings at once
 */
export async function getAllSettings(): Promise<Record<string, unknown>> {
    return cached('settings:all', 600, async () => {
        const settings = await prisma.siteSetting.findMany()
        const result: Record<string, unknown> = {}
        for (const s of settings) {
            result[s.key] = s.value
        }
        return result
    })
}

/**
 * Get branding for use in storefront/emails
 */
export async function getBranding(): Promise<BrandingSettings> {
    const branding = await getSetting<BrandingSettings>('branding')
    return branding || {
        siteName: 'Print Shop',
        tagline: 'Premium Printing Services',
        logoLight: '',
        logoDark: '',
        favicon: '',
        primaryColor: '#1a73e8',
        secondaryColor: '#ff6d00',
        accentColor: '#00c853',
        fromEmail: 'noreply@example.com',
    }
}
