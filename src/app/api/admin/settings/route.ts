/**
 * Admin Settings API
 * GET  — Load all settings
 * PUT  — Update a setting by key
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getAllSettings, setSetting } from '@/lib/settings'

export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const settings = await getAllSettings()
        return NextResponse.json(settings)
    } catch (err) {
        console.error('Failed to load settings:', err)
        return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const { key, value, group } = await request.json()

        if (!key || value === undefined) {
            return NextResponse.json({ error: 'key and value are required' }, { status: 400 })
        }

        const validKeys = ['branding', 'contact', 'social', 'seo', 'smtp', 'sinalite', 'payments']
        if (!validKeys.includes(key)) {
            return NextResponse.json({ error: `Invalid setting key: ${key}` }, { status: 400 })
        }

        await setSetting(key, value, group)
        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Failed to save setting:', err)
        return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 })
    }
}
