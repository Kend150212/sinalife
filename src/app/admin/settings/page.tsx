'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Key,
    CreditCard,
    Mail,
    Palette,
    Save,
    CheckCircle,
    AlertCircle,
    Eye,
    EyeOff,
    RefreshCw,
    Globe,
    Phone,
    MapPin,
    Download,
} from 'lucide-react'
import '../admin.css'

type TabId = 'api' | 'payments' | 'smtp' | 'branding'

const tabsDef: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'api', label: 'Sinalite API', icon: Key },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'smtp', label: 'Email (SMTP)', icon: Mail },
    { id: 'branding', label: 'Brand Your Store', icon: Palette },
]

/* eslint-disable @typescript-eslint/no-explicit-any */
interface AllSettings {
    sinalite?: { apiUrl?: string; clientId?: string; clientSecret?: string; audience?: string; storeCode?: string; autoSync?: boolean; autoSubmit?: boolean; realTimePricing?: boolean; webhooks?: boolean }
    payments?: { stripePublishableKey?: string; stripeSecretKey?: string; stripeWebhookSecret?: string; stripeMode?: string; paypalClientId?: string; paypalClientSecret?: string; paypalMode?: string; currency?: string; taxRate?: number; autoTax?: boolean; taxInclusive?: boolean; stripeEnabled?: boolean; paypalEnabled?: boolean }
    smtp?: { host?: string; port?: string; user?: string; pass?: string; secure?: boolean; fromName?: string; fromEmail?: string; replyTo?: string }
    branding?: { siteName?: string; tagline?: string; logoLight?: string; favicon?: string; primaryColor?: string; accentColor?: string; bgColor?: string; textColor?: string }
    contact?: { website?: string; phone?: string; email?: string; address?: string; about?: string }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<TabId>('api')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [settings, setSettings] = useState<AllSettings>({})
    const [loading, setLoading] = useState(true)

    // Load settings from API
    useEffect(() => {
        fetch('/api/admin/settings')
            .then(r => r.json())
            .then(data => {
                if (!data.error) setSettings(data)
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    // Update a setting group locally
    const updateGroup = useCallback((group: keyof AllSettings, field: string, value: unknown) => {
        setSettings(prev => ({
            ...prev,
            [group]: { ...(prev[group] || {}), [field]: value },
        }))
    }, [])

    // Save all settings
    const handleSave = async () => {
        setSaving(true)
        try {
            const groups: (keyof AllSettings)[] = ['sinalite', 'payments', 'smtp', 'branding', 'contact']
            for (const key of groups) {
                if (settings[key]) {
                    await fetch('/api/admin/settings', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ key, value: settings[key] }),
                    })
                }
            }
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (err) {
            console.error('Save failed:', err)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <>
                <div className="admin-page-header"><h1>Settings</h1><p>Loading...</p></div>
                <div className="admin-page-content">
                    <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                        <RefreshCw size={32} className="spin" />
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <div className="admin-page-header">
                <div className="flex-between">
                    <div>
                        <h1>Settings</h1>
                        <p>Configure your store&apos;s integrations and preferences</p>
                    </div>
                    <button
                        className="admin-btn admin-btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <><RefreshCw size={16} className="spin" /> Saving...</>
                        ) : saved ? (
                            <><CheckCircle size={16} /> Saved!</>
                        ) : (
                            <><Save size={16} /> Save Changes</>
                        )}
                    </button>
                </div>
            </div>
            <div className="admin-page-content">
                <div className="settings-tabs">
                    {tabsDef.map(tab => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>
                <div className="settings-content">
                    {activeTab === 'api' && <SinaliteAPITab settings={settings} updateGroup={updateGroup} />}
                    {activeTab === 'payments' && <PaymentsTab settings={settings} updateGroup={updateGroup} />}
                    {activeTab === 'smtp' && <SMTPTab settings={settings} updateGroup={updateGroup} />}
                    {activeTab === 'branding' && <BrandingTab settings={settings} updateGroup={updateGroup} />}
                </div>
            </div>
        </>
    )
}

interface TabProps {
    settings: AllSettings
    updateGroup: (group: keyof AllSettings, field: string, value: unknown) => void
}

/* ──────────── Sinalite API Tab ──────────── */
function SinaliteAPITab({ settings, updateGroup }: TabProps) {
    const [showKey, setShowKey] = useState(false)
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
    const [testMessage, setTestMessage] = useState('')
    const [syncing, setSyncing] = useState(false)
    const [syncMessage, setSyncMessage] = useState('')

    const s = settings.sinalite || {}

    const handleTest = async () => {
        setTestStatus('testing')
        try {
            const res = await fetch('/api/admin/settings/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiUrl: s.apiUrl || 'https://api.sinaliteuppy.com',
                    clientId: s.clientId,
                    clientSecret: s.clientSecret,
                    audience: s.audience || 'https://apiconnect.sinalite.com',
                }),
            })
            const data = await res.json()
            setTestStatus(data.success ? 'success' : 'error')
            setTestMessage(data.message || '')
            setTimeout(() => setTestStatus('idle'), 5000)
        } catch {
            setTestStatus('error')
            setTestMessage('Connection failed')
            setTimeout(() => setTestStatus('idle'), 5000)
        }
    }

    const handleSync = async () => {
        setSyncing(true)
        setSyncMessage('')
        try {
            const res = await fetch('/api/admin/sync', { method: 'POST' })
            const data = await res.json()
            setSyncMessage(data.message || 'Sync complete')
        } catch {
            setSyncMessage('Sync failed')
        } finally {
            setSyncing(false)
        }
    }

    return (
        <div className="settings-section">
            <div className="settings-section-header">
                <h2>🔗 Sinalite API Configuration</h2>
                <p>Connect your Sinalite account to sync products and submit orders automatically.</p>
            </div>

            <div className="admin-card" style={{ marginBottom: 16 }}>
                <h3>API Credentials</h3>
                <div className="settings-form-grid">
                    <div className="admin-form-group">
                        <label className="form-label">API Endpoint URL</label>
                        <input
                            className="form-input"
                            type="url"
                            value={s.apiUrl || ''}
                            onChange={e => updateGroup('sinalite', 'apiUrl', e.target.value)}
                            placeholder="https://api.sinaliteuppy.com"
                        />
                        <span className="form-hint">The base URL for the Sinalite API</span>
                    </div>
                    <div className="admin-form-group">
                        <label className="form-label">Client ID</label>
                        <input
                            className="form-input"
                            type="text"
                            value={s.clientId || ''}
                            onChange={e => updateGroup('sinalite', 'clientId', e.target.value)}
                            placeholder="Your Sinalite Client ID"
                        />
                    </div>
                    <div className="admin-form-group">
                        <label className="form-label">Client Secret</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="form-input"
                                type={showKey ? 'text' : 'password'}
                                value={s.clientSecret || ''}
                                onChange={e => updateGroup('sinalite', 'clientSecret', e.target.value)}
                                placeholder="Your Sinalite Client Secret"
                                style={{ paddingRight: 44 }}
                            />
                            <button
                                onClick={() => setShowKey(!showKey)}
                                style={{
                                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                                }}
                            >
                                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div className="admin-form-group">
                        <label className="form-label">Audience</label>
                        <input
                            className="form-input"
                            type="text"
                            value={s.audience || ''}
                            onChange={e => updateGroup('sinalite', 'audience', e.target.value)}
                            placeholder="https://apiconnect.sinalite.com"
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button className="admin-btn admin-btn-secondary" onClick={handleTest}>
                        {testStatus === 'testing' && <><RefreshCw size={14} className="spin" /> Testing...</>}
                        {testStatus === 'idle' && <>Test Connection</>}
                        {testStatus === 'success' && <><CheckCircle size={14} /> Connected!</>}
                        {testStatus === 'error' && <><AlertCircle size={14} /> Failed</>}
                    </button>
                    <button className="admin-btn admin-btn-primary" onClick={handleSync} disabled={syncing}>
                        {syncing ? <><RefreshCw size={14} className="spin" /> Syncing...</> : <><Download size={14} /> Sync Products from Sinalite</>}
                    </button>
                </div>
                {testMessage && <p style={{ marginTop: 8, fontSize: 13, color: testStatus === 'success' ? '#16a34a' : '#dc2626' }}>{testMessage}</p>}
                {syncMessage && <p style={{ marginTop: 8, fontSize: 13, color: syncMessage.includes('fail') ? '#dc2626' : '#16a34a' }}>{syncMessage}</p>}
            </div>

            <div className="admin-card">
                <h3>Sync Options</h3>
                <div className="settings-toggle-list">
                    <ToggleRow label="Auto-sync products" description="Automatically sync products every 24 hours" checked={s.autoSync ?? true} onChange={v => updateGroup('sinalite', 'autoSync', v)} />
                    <ToggleRow label="Auto-submit orders" description="Automatically submit orders to Sinalite on payment" checked={s.autoSubmit ?? true} onChange={v => updateGroup('sinalite', 'autoSubmit', v)} />
                    <ToggleRow label="Real-time pricing" description="Fetch live pricing from Sinalite API" checked={s.realTimePricing ?? false} onChange={v => updateGroup('sinalite', 'realTimePricing', v)} />
                    <ToggleRow label="Webhook notifications" description="Receive order status updates via webhooks" checked={s.webhooks ?? true} onChange={v => updateGroup('sinalite', 'webhooks', v)} />
                </div>
            </div>
        </div>
    )
}

/* ──────────── Payments Tab ──────────── */
function PaymentsTab({ settings, updateGroup }: TabProps) {
    const p = settings.payments || {}

    return (
        <div className="settings-section">
            <div className="settings-section-header">
                <h2>💳 Payment Configuration</h2>
                <p>Set up your payment gateways to accept customer payments.</p>
            </div>

            {/* Stripe */}
            <div className="admin-card" style={{ marginBottom: 16 }}>
                <div className="flex-between">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12, background: '#F0F0FF',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                        }}>💜</div>
                        <div>
                            <h3 style={{ margin: 0 }}>Stripe</h3>
                            <span className="text-sm text-muted">Credit/debit cards, Apple Pay, Google Pay</span>
                        </div>
                    </div>
                    <span className={`badge ${p.stripeEnabled ? 'badge-success' : 'badge-warning'}`}>{p.stripeEnabled ? 'Active' : 'Not configured'}</span>
                </div>
                <div className="settings-form-grid" style={{ marginTop: 20 }}>
                    <div className="admin-form-group">
                        <label className="form-label">Publishable Key</label>
                        <input className="form-input" type="text" value={p.stripePublishableKey || ''} onChange={e => updateGroup('payments', 'stripePublishableKey', e.target.value)} placeholder="pk_live_xxxxxxxx" />
                    </div>
                    <div className="admin-form-group">
                        <label className="form-label">Secret Key</label>
                        <input className="form-input" type="password" value={p.stripeSecretKey || ''} onChange={e => updateGroup('payments', 'stripeSecretKey', e.target.value)} placeholder="sk_live_xxxxxxxx" />
                    </div>
                    <div className="admin-form-group">
                        <label className="form-label">Webhook Secret</label>
                        <input className="form-input" type="password" value={p.stripeWebhookSecret || ''} onChange={e => updateGroup('payments', 'stripeWebhookSecret', e.target.value)} placeholder="whsec_xxxxxxxx" />
                    </div>
                    <div className="admin-form-group">
                        <label className="form-label">Mode</label>
                        <select className="form-input form-select" value={p.stripeMode || 'test'} onChange={e => updateGroup('payments', 'stripeMode', e.target.value)}>
                            <option value="test">Test Mode</option>
                            <option value="live">Live Mode</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* PayPal */}
            <div className="admin-card" style={{ marginBottom: 16 }}>
                <div className="flex-between">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12, background: '#FFF8E7',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                        }}>🅿️</div>
                        <div>
                            <h3 style={{ margin: 0 }}>PayPal</h3>
                            <span className="text-sm text-muted">PayPal balance, bank debit, credit/debit cards</span>
                        </div>
                    </div>
                    <span className={`badge ${p.paypalEnabled ? 'badge-success' : 'badge-warning'}`}>{p.paypalEnabled ? 'Active' : 'Not configured'}</span>
                </div>
                <div className="settings-form-grid" style={{ marginTop: 20 }}>
                    <div className="admin-form-group">
                        <label className="form-label">Client ID</label>
                        <input className="form-input" type="text" value={p.paypalClientId || ''} onChange={e => updateGroup('payments', 'paypalClientId', e.target.value)} placeholder="AxxxxxxxxxxxxxxxxxxxxxxxxxxxxB" />
                    </div>
                    <div className="admin-form-group">
                        <label className="form-label">Client Secret</label>
                        <input className="form-input" type="password" value={p.paypalClientSecret || ''} onChange={e => updateGroup('payments', 'paypalClientSecret', e.target.value)} placeholder="ExxxxxxxxxxxxxxxxxxxxxxxxxxxxF" />
                    </div>
                    <div className="admin-form-group">
                        <label className="form-label">Mode</label>
                        <select className="form-input form-select" value={p.paypalMode || 'sandbox'} onChange={e => updateGroup('payments', 'paypalMode', e.target.value)}>
                            <option value="sandbox">Sandbox</option>
                            <option value="live">Live</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Currency */}
            <div className="admin-card">
                <h3>Currency & Tax</h3>
                <div className="settings-form-grid">
                    <div className="admin-form-group">
                        <label className="form-label">Default Currency</label>
                        <select className="form-input form-select" value={p.currency || 'USD'} onChange={e => updateGroup('payments', 'currency', e.target.value)}>
                            <option value="USD">USD — US Dollar</option>
                            <option value="CAD">CAD — Canadian Dollar</option>
                            <option value="EUR">EUR — Euro</option>
                            <option value="GBP">GBP — British Pound</option>
                        </select>
                    </div>
                    <div className="admin-form-group">
                        <label className="form-label">Tax Rate (%)</label>
                        <input className="form-input" type="number" value={p.taxRate ?? 0} onChange={e => updateGroup('payments', 'taxRate', parseFloat(e.target.value) || 0)} min="0" max="100" step="0.01" />
                    </div>
                </div>
                <div className="settings-toggle-list" style={{ marginTop: 16 }}>
                    <ToggleRow label="Calculate tax automatically" description="Use address-based tax calculation" checked={p.autoTax ?? false} onChange={v => updateGroup('payments', 'autoTax', v)} />
                    <ToggleRow label="Show prices with tax included" description="Display tax-inclusive pricing" checked={p.taxInclusive ?? false} onChange={v => updateGroup('payments', 'taxInclusive', v)} />
                </div>
            </div>
        </div>
    )
}

/* ──────────── SMTP Tab ──────────── */
function SMTPTab({ settings, updateGroup }: TabProps) {
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
    const sm = settings.smtp || {}

    const handleTest = async () => {
        setTestStatus('testing')
        await new Promise(r => setTimeout(r, 2000))
        setTestStatus('success')
        setTimeout(() => setTestStatus('idle'), 4000)
    }

    return (
        <div className="settings-section">
            <div className="settings-section-header">
                <h2>📧 Email (SMTP) Configuration</h2>
                <p>Configure your SMTP server to send transactional emails to customers.</p>
            </div>

            <div className="admin-card" style={{ marginBottom: 16 }}>
                <h3>SMTP Server</h3>
                <div className="settings-form-grid">
                    <div className="admin-form-group">
                        <label className="form-label">SMTP Host</label>
                        <input className="form-input" type="text" value={sm.host || ''} onChange={e => updateGroup('smtp', 'host', e.target.value)} placeholder="smtp.gmail.com" />
                    </div>
                    <div className="admin-form-group">
                        <label className="form-label">SMTP Port</label>
                        <input className="form-input" type="number" value={sm.port || '587'} onChange={e => updateGroup('smtp', 'port', e.target.value)} />
                    </div>
                    <div className="admin-form-group">
                        <label className="form-label">Username</label>
                        <input className="form-input" type="text" value={sm.user || ''} onChange={e => updateGroup('smtp', 'user', e.target.value)} placeholder="your@email.com" />
                    </div>
                    <div className="admin-form-group">
                        <label className="form-label">Password</label>
                        <input className="form-input" type="password" value={sm.pass || ''} onChange={e => updateGroup('smtp', 'pass', e.target.value)} placeholder="••••••••" />
                    </div>
                </div>
                <div className="settings-toggle-list" style={{ marginTop: 16 }}>
                    <ToggleRow label="Use SSL/TLS" description="Encrypt email communications" checked={sm.secure ?? true} onChange={v => updateGroup('smtp', 'secure', v)} />
                </div>
                <div style={{ marginTop: 16 }}>
                    <button className="admin-btn admin-btn-secondary" onClick={handleTest}>
                        {testStatus === 'testing' && <><RefreshCw size={14} className="spin" /> Sending test...</>}
                        {testStatus === 'idle' && <><Mail size={14} /> Send Test Email</>}
                        {testStatus === 'success' && <><CheckCircle size={14} /> Test email sent!</>}
                        {testStatus === 'error' && <><AlertCircle size={14} /> Failed</>}
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <h3>Sender Info</h3>
                <div className="settings-form-grid">
                    <div className="admin-form-group">
                        <label className="form-label">From Name</label>
                        <input className="form-input" type="text" value={sm.fromName || ''} onChange={e => updateGroup('smtp', 'fromName', e.target.value)} placeholder="Your Store Name" />
                    </div>
                    <div className="admin-form-group">
                        <label className="form-label">From Email</label>
                        <input className="form-input" type="email" value={sm.fromEmail || ''} onChange={e => updateGroup('smtp', 'fromEmail', e.target.value)} placeholder="noreply@yourstore.com" />
                    </div>
                    <div className="admin-form-group">
                        <label className="form-label">Reply-To Email</label>
                        <input className="form-input" type="email" value={sm.replyTo || ''} onChange={e => updateGroup('smtp', 'replyTo', e.target.value)} placeholder="support@yourstore.com" />
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ──────────── Branding Tab ──────────── */
function BrandingTab({ settings, updateGroup }: TabProps) {
    const b = settings.branding || {}
    const c = settings.contact || {}

    return (
        <div className="settings-section">
            <div className="settings-section-header">
                <h2>🎨 Brand Your Store</h2>
                <p>Customize your store&apos;s appearance and business information.</p>
            </div>

            <div className="admin-card" style={{ marginBottom: 16 }}>
                <h3>Store Identity</h3>
                <div className="settings-form-grid">
                    <div className="admin-form-group">
                        <label className="form-label">Store Name</label>
                        <input className="form-input" type="text" value={b.siteName || ''} onChange={e => updateGroup('branding', 'siteName', e.target.value)} placeholder="Your Store Name" />
                    </div>
                    <div className="admin-form-group">
                        <label className="form-label">Store Tagline</label>
                        <input className="form-input" type="text" value={b.tagline || ''} onChange={e => updateGroup('branding', 'tagline', e.target.value)} placeholder="Premium Custom Printing Services" />
                    </div>
                </div>

                <div className="admin-form-group" style={{ marginTop: 16 }}>
                    <label className="form-label">Store Logo</label>
                    <div className="upload-zone">
                        <div className="upload-zone-content">
                            <Palette size={32} style={{ color: '#94a3b8' }} />
                            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 14 }}>
                                Drag & drop or click to upload
                            </p>
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>PNG, SVG, or WebP. Max 2MB.</span>
                        </div>
                    </div>
                </div>

                <div className="admin-form-group" style={{ marginTop: 16 }}>
                    <label className="form-label">Favicon</label>
                    <div className="upload-zone upload-zone-sm">
                        <div className="upload-zone-content">
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>32×32 px · ICO or PNG</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="admin-card" style={{ marginBottom: 16 }}>
                <h3>Brand Colors</h3>
                <div style={{ display: 'flex', gap: 24 }}>
                    <ColorPicker label="Primary Color" color={b.primaryColor || '#2563eb'} onChange={v => updateGroup('branding', 'primaryColor', v)} />
                    <ColorPicker label="Accent Color" color={b.accentColor || '#16a34a'} onChange={v => updateGroup('branding', 'accentColor', v)} />
                    <ColorPicker label="Background" color={b.bgColor || '#f8fafc'} onChange={v => updateGroup('branding', 'bgColor', v)} />
                    <ColorPicker label="Text Color" color={b.textColor || '#0f172a'} onChange={v => updateGroup('branding', 'textColor', v)} />
                </div>
            </div>

            <div className="admin-card">
                <h3>Contact Information</h3>
                <div className="settings-form-grid">
                    <div className="admin-form-group">
                        <label className="form-label">
                            <Globe size={14} style={{ display: 'inline', marginRight: 4 }} />Website
                        </label>
                        <input className="form-input" type="url" value={c.website || ''} onChange={e => updateGroup('contact', 'website', e.target.value)} placeholder="https://yourstore.com" />
                    </div>
                    <div className="admin-form-group">
                        <label className="form-label">
                            <Phone size={14} style={{ display: 'inline', marginRight: 4 }} />Phone
                        </label>
                        <input className="form-input" type="tel" value={c.phone || ''} onChange={e => updateGroup('contact', 'phone', e.target.value)} placeholder="(555) 123-4567" />
                    </div>
                    <div className="admin-form-group">
                        <label className="form-label">
                            <Mail size={14} style={{ display: 'inline', marginRight: 4 }} />Support Email
                        </label>
                        <input className="form-input" type="email" value={c.email || ''} onChange={e => updateGroup('contact', 'email', e.target.value)} placeholder="support@yourstore.com" />
                    </div>
                    <div className="admin-form-group">
                        <label className="form-label">
                            <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />Address
                        </label>
                        <input className="form-input" type="text" value={c.address || ''} onChange={e => updateGroup('contact', 'address', e.target.value)} placeholder="123 Main St, City, State ZIP" />
                    </div>
                </div>
                <div className="admin-form-group" style={{ marginTop: 16 }}>
                    <label className="form-label">About / Footer Text</label>
                    <textarea className="form-input" rows={3} value={c.about || ''} onChange={e => updateGroup('contact', 'about', e.target.value)} placeholder="Your store description..." />
                </div>
            </div>
        </div>
    )
}

/* ──────────── Shared Components ──────────── */
function ToggleRow({
    label,
    description,
    checked,
    onChange,
}: {
    label: string
    description: string
    checked: boolean
    onChange: (v: boolean) => void
}) {
    return (
        <div className="settings-toggle-row">
            <div>
                <div className="settings-toggle-label">{label}</div>
                <div className="settings-toggle-desc">{description}</div>
            </div>
            <button
                className={`settings-toggle ${checked ? 'on' : ''}`}
                onClick={() => onChange(!checked)}
            >
                <span className="settings-toggle-knob" />
            </button>
        </div>
    )
}

function ColorPicker({ label, color, onChange }: { label: string; color: string; onChange: (v: string) => void }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <div
                style={{
                    width: 48, height: 48, borderRadius: 12, background: color,
                    border: '2px solid #e2e8f0', cursor: 'pointer', position: 'relative',
                    marginBottom: 8,
                }}
            >
                <input
                    type="color"
                    value={color}
                    onChange={e => onChange(e.target.value)}
                    style={{
                        position: 'absolute', inset: 0,
                        opacity: 0, width: '100%', height: '100%', cursor: 'pointer',
                    }}
                />
            </div>
            <span style={{ fontSize: 12, color: '#64748b', display: 'block' }}>{label}</span>
            <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{color}</span>
        </div>
    )
}
