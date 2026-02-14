/**
 * Admin Auth Guard
 * Verifies the request is from an authenticated ADMIN or STAFF user
 */

import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function requireAdmin() {
    const session = await auth()

    if (!session?.user) {
        return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null }
    }

    const role = (session.user as { role?: string }).role
    if (!role || !['ADMIN', 'STAFF'].includes(role)) {
        return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null }
    }

    return { error: null, session }
}
