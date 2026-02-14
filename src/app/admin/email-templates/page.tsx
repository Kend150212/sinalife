'use client'

import { useState } from 'react'
import '../admin.css'

const templates = [
    {
        id: 'welcome',
        name: 'Welcome Email',
        description: 'Sent to new customers after registration',
        trigger: 'Automatic — on registration',
        icon: '👋',
    },
    {
        id: 'orderConfirmation',
        name: 'Order Confirmation',
        description: 'Sent after successful payment',
        trigger: 'Automatic — on payment',
        icon: '✅',
    },
    {
        id: 'orderShipped',
        name: 'Order Shipped',
        description: 'Sent when order status changes to shipped',
        trigger: 'Automatic — on status change',
        icon: '📦',
    },
    {
        id: 'orderDelivered',
        name: 'Order Delivered',
        description: 'Sent when order is marked as delivered',
        trigger: 'Automatic — on delivery',
        icon: '🎉',
    },
    {
        id: 'passwordReset',
        name: 'Password Reset',
        description: 'Sent when user requests a password reset',
        trigger: 'Automatic — on request',
        icon: '🔐',
    },
    {
        id: 'orderStatus',
        name: 'Order Status Update',
        description: 'Sent when order status changes',
        trigger: 'Automatic — on status change',
        icon: '🔄',
    },
    {
        id: 'emailVerification',
        name: 'Email Verification',
        description: 'Sent to verify email address',
        trigger: 'Automatic — on registration',
        icon: '📧',
    },
    {
        id: 'promotional',
        name: 'Promotional Email',
        description: 'Marketing email sent by admin',
        trigger: 'Manual — admin sends',
        icon: '🎨',
    },
]

export default function EmailTemplatesPage() {
    const [previewId, setPreviewId] = useState<string | null>(null)
    const [previewHtml, setPreviewHtml] = useState('')
    const [loading, setLoading] = useState(false)
    const [sendTest, setSendTest] = useState(false)
    const [testEmail, setTestEmail] = useState('')
    const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

    const handlePreview = async (id: string) => {
        setLoading(true)
        setPreviewId(id)
        try {
            const res = await fetch(`/api/email/preview?template=${id}`)
            const data = await res.json()
            setPreviewHtml(data.html || '')
        } catch {
            setPreviewHtml('<p>Failed to load preview</p>')
        }
        setLoading(false)
    }

    const handleSendTest = async () => {
        if (!testEmail || !previewId) return
        setSendStatus('sending')
        try {
            const res = await fetch('/api/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ template: previewId, to: testEmail }),
            })
            setSendStatus(res.ok ? 'sent' : 'error')
        } catch {
            setSendStatus('error')
        }
        setTimeout(() => setSendStatus('idle'), 3000)
    }

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h1>Email Templates</h1>
                    <p>Manage and preview automated email notifications</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: previewId ? '1fr 1fr' : '1fr', gap: '24px' }}>
                {/* Template List */}
                <div>
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {templates.map((t) => (
                            <div
                                key={t.id}
                                onClick={() => handlePreview(t.id)}
                                style={{
                                    background: previewId === t.id ? '#f0f4ff' : '#fff',
                                    border: `1px solid ${previewId === t.id ? '#2563eb' : '#e2e8f0'}`,
                                    borderRadius: '12px',
                                    padding: '20px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                }}
                            >
                                <span style={{ fontSize: '28px' }}>{t.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 600 }}>{t.name}</h3>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{t.description}</p>
                                </div>
                                <span style={{
                                    fontSize: '11px',
                                    color: t.trigger.startsWith('Manual') ? '#f59e0b' : '#22c55e',
                                    background: t.trigger.startsWith('Manual') ? '#fef3c7' : '#f0fdf4',
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    fontWeight: 500,
                                    whiteSpace: 'nowrap',
                                }}>
                                    {t.trigger.split(' — ')[0]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Preview Panel */}
                {previewId && (
                    <div style={{
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        position: 'sticky',
                        top: '24px',
                        maxHeight: 'calc(100vh - 120px)',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '15px' }}>Preview</h3>
                                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                                    {templates.find(t => t.id === previewId)?.name}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => setSendTest(!sendTest)}
                                    style={{
                                        fontSize: '12px',
                                        padding: '6px 14px',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0',
                                        background: sendTest ? '#2563eb' : '#fff',
                                        color: sendTest ? '#fff' : '#1e293b',
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                    }}
                                >
                                    Send Test
                                </button>
                                <button
                                    onClick={() => { setPreviewId(null); setPreviewHtml('') }}
                                    style={{
                                        fontSize: '16px',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0',
                                        background: '#fff',
                                        cursor: 'pointer',
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {sendTest && (
                            <div style={{
                                padding: '12px 20px',
                                borderBottom: '1px solid #e2e8f0',
                                display: 'flex',
                                gap: '8px',
                                background: '#f8fafc',
                            }}>
                                <input
                                    type="email"
                                    placeholder="Enter email address..."
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '13px',
                                    }}
                                />
                                <button
                                    onClick={handleSendTest}
                                    disabled={sendStatus === 'sending'}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: sendStatus === 'sent' ? '#22c55e' : sendStatus === 'error' ? '#ef4444' : '#2563eb',
                                        color: '#fff',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {sendStatus === 'sending' ? 'Sending...' : sendStatus === 'sent' ? 'Sent ✓' : sendStatus === 'error' ? 'Error ✗' : 'Send'}
                                </button>
                            </div>
                        )}

                        <div style={{ flex: 1, overflow: 'auto' }}>
                            {loading ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading preview...</div>
                            ) : (
                                <iframe
                                    srcDoc={previewHtml}
                                    style={{ width: '100%', height: '600px', border: 'none' }}
                                    title="Email Preview"
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
