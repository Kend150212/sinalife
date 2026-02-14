'use client'

import { useState, useEffect } from 'react'
import {
    DollarSign,
    Save,
    RefreshCw,
    CheckCircle,
    Edit2,
    TrendingUp,
    Layers,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react'
import '../admin.css'

interface MarkupRule {
    id: string
    name: string
    categorySlug: string | null
    productSku: string | null
    markupPercent: number
    priority: number
    enabled: boolean
}

interface CategoryInfo {
    id: string
    name: string
    slug: string
    markupPercent: number | null
    _count: { products: number }
}

interface Stats {
    activeRules: number
    totalRules: number
    avgMarkup: number
    globalDefault: number
}

export default function PricingPage() {
    const [rules, setRules] = useState<MarkupRule[]>([])
    const [categories, setCategories] = useState<CategoryInfo[]>([])
    const [stats, setStats] = useState<Stats>({ activeRules: 0, totalRules: 0, avgMarkup: 35, globalDefault: 35 })
    const [globalDefault, setGlobalDefault] = useState(35)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [editingRule, setEditingRule] = useState<string | null>(null)
    const [editValues, setEditValues] = useState<Partial<MarkupRule>>({})

    useEffect(() => {
        fetch('/api/admin/pricing')
            .then(r => r.json())
            .then(data => {
                if (!data.error) {
                    setRules(data.rules || [])
                    setCategories(data.categories || [])
                    setStats(data.stats || { activeRules: 0, totalRules: 0, avgMarkup: 35, globalDefault: 35 })
                    setGlobalDefault(data.stats?.globalDefault || 35)
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            await fetch('/api/admin/pricing', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rules, globalDefault }),
            })
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (err) {
            console.error('Save failed:', err)
        } finally {
            setSaving(false)
        }
    }

    const startEdit = (rule: MarkupRule) => {
        setEditingRule(rule.id)
        setEditValues({ markupPercent: rule.markupPercent, enabled: rule.enabled })
    }

    const saveEdit = () => {
        if (!editingRule) return
        setRules(prev => prev.map(r =>
            r.id === editingRule
                ? { ...r, ...editValues }
                : r
        ))
        setEditingRule(null)
    }

    const toggleRule = (id: string) => {
        setRules(prev => prev.map(r =>
            r.id === id ? { ...r, enabled: !r.enabled } : r
        ))
    }

    if (loading) {
        return (
            <>
                <div className="admin-page-header"><h1>Markup & Pricing</h1></div>
                <div className="admin-page-content" style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                    <RefreshCw size={32} className="spin" />
                </div>
            </>
        )
    }

    return (
        <>
            <div className="admin-page-header">
                <div className="flex-between">
                    <div>
                        <h1>Markup & Pricing</h1>
                        <p>Manage pricing rules and markup percentages</p>
                    </div>
                    <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? <><RefreshCw size={16} className="spin" /> Saving...</> : saved ? <><CheckCircle size={16} /> Saved!</> : <><Save size={16} /> Save Changes</>}
                    </button>
                </div>
            </div>

            <div className="admin-page-content">
                {/* Stats */}
                <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
                    <div className="admin-stat-card">
                        <div className="stat-icon" style={{ background: '#EFF6FF' }}><TrendingUp size={20} color="#2563eb" /></div>
                        <div><div className="stat-value">{stats.avgMarkup}%</div><div className="stat-label">Avg Markup</div></div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="stat-icon" style={{ background: '#F0FDF4' }}><Layers size={20} color="#16a34a" /></div>
                        <div><div className="stat-value">{stats.activeRules}</div><div className="stat-label">Active Rules</div></div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="stat-icon" style={{ background: '#FFF7ED' }}><DollarSign size={20} color="#ea580c" /></div>
                        <div><div className="stat-value">+{Math.round(stats.avgMarkup)}%</div><div className="stat-label">Revenue Boost</div></div>
                    </div>
                </div>

                {/* Global Default */}
                <div className="admin-card" style={{ marginBottom: 16 }}>
                    <h3>Global Default Markup</h3>
                    <p style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>
                        Applied to all products unless overridden by a category or product-specific rule.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input
                            className="form-input"
                            type="number"
                            value={globalDefault}
                            onChange={e => setGlobalDefault(parseFloat(e.target.value) || 0)}
                            min="0"
                            max="500"
                            step="0.5"
                            style={{ width: 100 }}
                        />
                        <span style={{ color: '#64748b' }}>%</span>
                        <span style={{ fontSize: 13, color: '#94a3b8' }}>
                            Example: $10.00 cost → ${(10 * (1 + globalDefault / 100)).toFixed(2)} selling price
                        </span>
                    </div>
                </div>

                {/* Rules Table */}
                <div className="admin-card">
                    <h3>Markup Rules</h3>
                    {rules.length === 0 && categories.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                            <DollarSign size={40} />
                            <p>No markup rules yet. The global default ({globalDefault}%) will apply to all products.</p>
                        </div>
                    ) : (
                        <div style={{ overflow: 'auto' }}>
                            <table className="admin-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Rule Name</th>
                                        <th>Scope</th>
                                        <th>Markup</th>
                                        <th>Example ($10)</th>
                                        <th>Status</th>
                                        <th style={{ width: 80 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rules.map(rule => (
                                        <tr key={rule.id} style={{ opacity: rule.enabled ? 1 : 0.5 }}>
                                            <td style={{ fontWeight: 500 }}>{rule.name}</td>
                                            <td>
                                                <span className="badge">
                                                    {rule.productSku ? `Product: ${rule.productSku}` : rule.categorySlug ? `Category: ${rule.categorySlug}` : 'Global'}
                                                </span>
                                            </td>
                                            <td>
                                                {editingRule === rule.id ? (
                                                    <input className="form-input" type="number" style={{ width: 80, padding: '4px 8px', fontSize: 13 }} value={editValues.markupPercent || 0} onChange={e => setEditValues({ ...editValues, markupPercent: parseFloat(e.target.value) || 0 })} autoFocus />
                                                ) : (
                                                    <strong>{rule.markupPercent}%</strong>
                                                )}
                                            </td>
                                            <td style={{ color: '#16a34a', fontWeight: 500 }}>
                                                ${(10 * (1 + (editingRule === rule.id ? (editValues.markupPercent || 0) : rule.markupPercent) / 100)).toFixed(2)}
                                            </td>
                                            <td>
                                                <button onClick={() => toggleRule(rule.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: rule.enabled ? '#16a34a' : '#94a3b8' }}>
                                                    {rule.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                                </button>
                                            </td>
                                            <td>
                                                {editingRule === rule.id ? (
                                                    <button className="admin-btn admin-btn-sm" onClick={saveEdit}><CheckCircle size={12} /></button>
                                                ) : (
                                                    <button className="admin-btn admin-btn-sm" onClick={() => startEdit(rule)}><Edit2 size={12} /></button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Also show categories with markup */}
                                    {categories.filter(c => c.markupPercent != null).map(cat => (
                                        <tr key={`cat-${cat.id}`}>
                                            <td style={{ fontWeight: 500 }}>{cat.name}</td>
                                            <td><span className="badge">Category Override</span></td>
                                            <td><strong>{cat.markupPercent}%</strong></td>
                                            <td style={{ color: '#16a34a', fontWeight: 500 }}>${(10 * (1 + (cat.markupPercent || 0) / 100)).toFixed(2)}</td>
                                            <td><span className="badge badge-success">{cat._count.products} products</span></td>
                                            <td></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
