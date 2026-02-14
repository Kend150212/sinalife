/**
 * Test Sinalite API Connection
 * POST — Tests auth with provided credentials
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const { apiUrl, clientId, clientSecret, audience } = await request.json()

        if (!apiUrl || !clientId || !clientSecret) {
            return NextResponse.json(
                { success: false, message: 'API URL, Client ID, and Client Secret are required' },
                { status: 400 }
            )
        }

        // Try to authenticate
        const authResponse = await fetch(`${apiUrl}/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                audience: audience || 'https://apiconnect.sinalite.com',
                grant_type: 'client_credentials',
            }),
        })

        if (!authResponse.ok) {
            const errText = await authResponse.text()
            return NextResponse.json({
                success: false,
                message: `Authentication failed (${authResponse.status}): ${errText}`,
            })
        }

        const authData = await authResponse.json()

        // Try to list products as a connectivity check
        const productsResponse = await fetch(`${apiUrl}/product`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authData.access_token}`,
            },
        })

        if (!productsResponse.ok) {
            return NextResponse.json({
                success: false,
                message: `Authenticated, but product listing failed (${productsResponse.status})`,
            })
        }

        const products = await productsResponse.json()

        return NextResponse.json({
            success: true,
            message: `Connected successfully! Found ${Array.isArray(products) ? products.length : 0} products.`,
            productCount: Array.isArray(products) ? products.length : 0,
        })
    } catch (err) {
        console.error('Connection test failed:', err)
        return NextResponse.json({
            success: false,
            message: `Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        })
    }
}
