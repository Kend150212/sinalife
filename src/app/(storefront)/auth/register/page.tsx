'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import '../auth.css'

export default function RegisterPage() {
    const router = useRouter()

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const getPasswordStrength = (pw: string): { level: number; text: string } => {
        if (!pw) return { level: 0, text: '' }
        let score = 0
        if (pw.length >= 8) score++
        if (/[A-Z]/.test(pw)) score++
        if (/[0-9]/.test(pw)) score++
        if (/[^A-Za-z0-9]/.test(pw)) score++

        if (score <= 1) return { level: 1, text: 'Weak' }
        if (score <= 2) return { level: 2, text: 'Medium' }
        if (score <= 3) return { level: 3, text: 'Strong' }
        return { level: 4, text: 'Very strong' }
    }

    const strength = getPasswordStrength(formData.password)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Registration failed')
                setLoading(false)
                return
            }

            router.push('/auth/login?registered=true')
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
                    <h1>Create an account</h1>
                    <p className="auth-subtitle">Start ordering custom prints today</p>

                    {error && (
                        <div className="auth-error">
                            ⚠️ {error}
                        </div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="auth-row">
                            <div className="auth-field">
                                <label htmlFor="firstName">First Name</label>
                                <input
                                    id="firstName"
                                    type="text"
                                    className="auth-input"
                                    placeholder="John"
                                    value={formData.firstName}
                                    onChange={(e) => updateField('firstName', e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="auth-field">
                                <label htmlFor="lastName">Last Name</label>
                                <input
                                    id="lastName"
                                    type="text"
                                    className="auth-input"
                                    placeholder="Doe"
                                    value={formData.lastName}
                                    onChange={(e) => updateField('lastName', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                className="auth-input"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={(e) => updateField('email', e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                className="auth-input"
                                placeholder="Min 8 characters"
                                value={formData.password}
                                onChange={(e) => updateField('password', e.target.value)}
                                required
                                autoComplete="new-password"
                                minLength={8}
                            />
                            {formData.password && (
                                <>
                                    <div className="password-strength">
                                        {[1, 2, 3, 4].map(i => (
                                            <div
                                                key={i}
                                                className={`password-strength-bar ${i <= strength.level ? 'active' : ''} ${strength.level <= 1 ? 'weak' : strength.level <= 2 ? 'medium' : 'strong'}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="password-strength-text">{strength.text}</span>
                                </>
                            )}
                        </div>

                        <div className="auth-field">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                className="auth-input"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={(e) => updateField('confirmPassword', e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                        </div>

                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>
                </div>

                <div className="auth-footer">
                    Already have an account?{' '}
                    <Link href="/auth/login">Sign in</Link>
                </div>
            </div>
        </div>
    )
}
