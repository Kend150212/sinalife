import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }

        // In production, this would:
        // 1. Look up the user by email
        // 2. Generate a reset token and save it
        // 3. Send an email with the reset link
        // For now, always return success (don't leak whether email exists)

        return NextResponse.json({
            success: true,
            message: 'If an account exists with this email, a reset link has been sent.',
        })
    } catch (error) {
        console.error('Forgot password error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
