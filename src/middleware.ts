import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Lightweight middleware for route protection.
 * Uses JWT cookie check only (no NextAuth import to avoid Edge Runtime crypto issue).
 * Full auth verification happens in server components/API routes.
 */
export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    // Check for session cookie (next-auth uses this name)
    const sessionToken = req.cookies.get('next-auth.session-token')?.value
        || req.cookies.get('__Secure-next-auth.session-token')?.value
        || req.cookies.get('authjs.session-token')?.value

    const isAuthenticated = !!sessionToken

    // Protect admin routes - redirect to login if no session cookie
    if (pathname.startsWith('/admin')) {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL('/auth/login?callbackUrl=/admin', req.url))
        }
        // Role check happens in the admin layout server component
    }

    // Protect account routes
    if (pathname.startsWith('/account')) {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL('/auth/login?callbackUrl=/account', req.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*', '/account/:path*'],
}
