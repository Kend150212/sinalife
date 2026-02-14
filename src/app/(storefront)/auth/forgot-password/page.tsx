'use client'

import { useState } from 'react'
import Link from 'next/link'
import '../auth.css'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to send reset email')
                setLoading(false)
                return
            }

            setSent(true)
        } catch {
            setError('Something went wrong. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <Link href="/" className="auth-logo">
                    <span className="auth-logo-icon">🖨️</span>
                    <span className="auth-logo-text">PrintPro</span>
                </Link>

                <div className="auth-card">
                    {sent ? (
                        <>
                            <h1>Check your email</h1>
                            <p className="auth-subtitle">
                                We sent a password reset link to <strong style={{ color: '#f1f5f9' }}>{email}</strong>
                            </p>
                            <div className="auth-success">
                                ✉️ If an account exists with this email, you&apos;ll receive reset instructions shortly.
                            </div>
                            <div style={{ marginTop: '20px' }}>
                                <Link href="/auth/login" className="auth-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                                    Back to Sign In
                                </Link>
                            </div>
                        </>
                    ) : (
                        <>
                            <h1>Reset your password</h1>
                            <p className="auth-subtitle">
                                Enter your email and we&apos;ll send you a link to reset your password
                            </p>

                            {error && (
                                <div className="auth-error">
                                    ⚠️ {error}
                                </div>
                            )}

                            <form className="auth-form" onSubmit={handleSubmit}>
                                <div className="auth-field">
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        id="email"
                                        type="email"
                                        className="auth-input"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                        autoFocus
                                    />
                                </div>

                                <button type="submit" className="auth-submit" disabled={loading}>
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </form>
                        </>
                    )}
                </div>

                <div className="auth-footer">
                    Remember your password?{' '}
                    <Link href="/auth/login">Sign in</Link>
                </div>
            </div>
        </div>
    )
}
