'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function ProfilePage() {
    const { data: session } = useSession()
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    useEffect(() => {
        if (session?.user) {
            const parts = (session.user.name || '').split(' ')
            setFirstName(parts[0] || '')
            setLastName(parts.slice(1).join(' ') || '')
            setEmail(session.user.email || '')
        }
    }, [session])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        try {
            const res = await fetch('/api/account/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, phone }),
            })

            if (res.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' })
            } else {
                const data = await res.json()
                setMessage({ type: 'error', text: data.error || 'Failed to update profile' })
            }
        } catch {
            setMessage({ type: 'error', text: 'Something went wrong' })
        }

        setSaving(false)
        setTimeout(() => setMessage(null), 4000)
    }

    return (
        <div>
            <div className="account-page-header">
                <h1>Profile</h1>
                <p>Manage your personal information</p>
            </div>

            {message && (
                <div className={message.type === 'success' ? 'account-success' : 'account-error'}>
                    {message.type === 'success' ? '✓' : '⚠'} {message.text}
                </div>
            )}

            <div className="account-card">
                <h3>👤 Personal Information</h3>
                <form onSubmit={handleSave}>
                    <div className="account-form-grid">
                        <div className="account-field">
                            <label htmlFor="firstName">First Name</label>
                            <input
                                id="firstName"
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="account-field">
                            <label htmlFor="lastName">Last Name</label>
                            <input
                                id="lastName"
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="account-field">
                            <label htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                disabled
                            />
                        </div>
                        <div className="account-field">
                            <label htmlFor="phone">Phone Number</label>
                            <input
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="(555) 123-4567"
                            />
                        </div>
                    </div>
                    <div className="account-actions">
                        <button type="submit" className="account-btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="account-card">
                <h3>🔐 Change Password</h3>
                <form onSubmit={(e) => { e.preventDefault(); setMessage({ type: 'success', text: 'Password change coming soon!' }) }}>
                    <div className="account-form-grid">
                        <div className="account-field">
                            <label htmlFor="currentPassword">Current Password</label>
                            <input id="currentPassword" type="password" placeholder="••••••••" />
                        </div>
                        <div className="account-field">
                            <label htmlFor="newPassword">New Password</label>
                            <input id="newPassword" type="password" placeholder="••••••••" />
                        </div>
                    </div>
                    <div className="account-actions">
                        <button type="submit" className="account-btn-secondary">
                            Update Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
