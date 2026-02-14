'use client'

import { useState, useEffect } from 'react'
import {
    Users,
    Search,
    DollarSign,
    ShoppingCart,
    TrendingUp,
    RefreshCw,
    Mail,
} from 'lucide-react'
import '../admin.css'

interface Customer {
    id: string
    email: string
    firstName: string
    lastName: string
    phone: string | null
    avatar: string | null
    createdAt: string
    totalSpent: number
    orderCount: number
    lastOrder: string | null
    isActive: boolean
}

interface Stats {
    totalCustomers: number
    totalRevenue: number
    avgOrderValue: number
    totalOrders: number
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [stats, setStats] = useState<Stats>({ totalCustomers: 0, totalRevenue: 0, avgOrderValue: 0, totalOrders: 0 })
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const loadCustomers = async () => {
        try {
            const params = new URLSearchParams()
            if (searchTerm) params.set('search', searchTerm)
            if (statusFilter !== 'all') params.set('status', statusFilter)

            const res = await fetch(`/api/admin/customers?${params}`)
            const data = await res.json()
            if (!data.error) {
                setCustomers(data.customers || [])
                setStats(data.stats || { totalCustomers: 0, totalRevenue: 0, avgOrderValue: 0, totalOrders: 0 })
            }
        } catch (err) {
            console.error('Failed to load customers:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadCustomers() }, [searchTerm, statusFilter])

    const fmtCurrency = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

    if (loading) {
        return (
            <>
                <div className="admin-page-header"><h1>Customers</h1></div>
                <div className="admin-page-content" style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                    <RefreshCw size={32} className="spin" />
                </div>
            </>
        )
    }

    return (
        <>
            <div className="admin-page-header">
                <h1>Customers</h1>
                <p>Manage your customer base and track spending</p>
            </div>

            <div className="admin-page-content">
                {/* Stats Cards */}
                <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
                    <div className="admin-stat-card">
                        <div className="stat-icon" style={{ background: '#EFF6FF' }}><Users size={20} color="#2563eb" /></div>
                        <div><div className="stat-value">{stats.totalCustomers}</div><div className="stat-label">Total Customers</div></div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="stat-icon" style={{ background: '#F0FDF4' }}><DollarSign size={20} color="#16a34a" /></div>
                        <div><div className="stat-value">{fmtCurrency(stats.totalRevenue)}</div><div className="stat-label">Total Revenue</div></div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="stat-icon" style={{ background: '#FFF7ED' }}><ShoppingCart size={20} color="#ea580c" /></div>
                        <div><div className="stat-value">{fmtCurrency(stats.avgOrderValue)}</div><div className="stat-label">Avg Order Value</div></div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="stat-icon" style={{ background: '#FAF5FF' }}><TrendingUp size={20} color="#9333ea" /></div>
                        <div><div className="stat-value">{stats.totalOrders}</div><div className="stat-label">Total Orders</div></div>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="admin-card" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input className="form-input" placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: 36 }} />
                        </div>
                        <select className="form-input form-select" style={{ width: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {/* Customer Table */}
                <div className="admin-card">
                    {customers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                            <Users size={40} />
                            <p>No customers found.</p>
                        </div>
                    ) : (
                        <div style={{ overflow: 'auto' }}>
                            <table className="admin-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Orders</th>
                                        <th>Total Spent</th>
                                        <th>Last Order</th>
                                        <th>Status</th>
                                        <th>Joined</th>
                                        <th style={{ width: 60 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.map(c => (
                                        <tr key={c.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{
                                                        width: 36, height: 36, borderRadius: '50%', background: '#EFF6FF',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 600, color: '#2563eb', fontSize: 14,
                                                    }}>
                                                        {c.firstName?.[0]}{c.lastName?.[0]}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 500 }}>{c.firstName} {c.lastName}</div>
                                                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{c.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className="badge">{c.orderCount}</span></td>
                                            <td style={{ fontWeight: 500 }}>{fmtCurrency(c.totalSpent)}</td>
                                            <td style={{ fontSize: 13, color: '#64748b' }}>{fmtDate(c.lastOrder)}</td>
                                            <td>
                                                <span className={`badge ${c.isActive ? 'badge-success' : 'badge-warning'}`}>
                                                    {c.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: 13, color: '#64748b' }}>{fmtDate(c.createdAt)}</td>
                                            <td>
                                                <button className="admin-btn admin-btn-sm" title="Send email"><Mail size={12} /></button>
                                            </td>
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
