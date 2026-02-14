'use client'

import { useState, useEffect } from 'react'
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Users,
    Package,
    RefreshCw,
    ArrowUpRight,
} from 'lucide-react'
import '../admin.css'

interface KPIs {
    totalRevenue: number
    periodRevenue: number
    revenueTrend: number
    totalOrders: number
    periodOrders: number
    ordersTrend: number
    totalCustomers: number
    totalProducts: number
    avgOrderValue: number
}

interface ChartPoint {
    date: string
    revenue: number
    orders: number
}

interface TopProduct {
    productId: number
    name: string
    revenue: number
    orderCount: number
}

interface TopCustomer {
    id: string
    name: string
    email: string
    totalSpent: number
    orderCount: number
}

interface CategoryRevenue {
    category: string
    revenue: number
    orderCount: number
}

export default function ReportsPage() {
    const [period, setPeriod] = useState('30d')
    const [loading, setLoading] = useState(true)
    const [kpis, setKpis] = useState<KPIs>({ totalRevenue: 0, periodRevenue: 0, revenueTrend: 0, totalOrders: 0, periodOrders: 0, ordersTrend: 0, totalCustomers: 0, totalProducts: 0, avgOrderValue: 0 })
    const [chartData, setChartData] = useState<ChartPoint[]>([])
    const [topProducts, setTopProducts] = useState<TopProduct[]>([])
    const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
    const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenue[]>([])

    const loadReports = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/reports?period=${period}`)
            const data = await res.json()
            if (!data.error) {
                setKpis(data.kpis || {})
                setChartData(data.chartData || [])
                setTopProducts(data.topProducts || [])
                setTopCustomers(data.topCustomers || [])
                setCategoryRevenue(data.categoryRevenue || [])
            }
        } catch (err) {
            console.error('Failed to load reports:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadReports() }, [period])

    const fmtCurrency = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    const periodLabel = { '7d': 'Last 7 Days', '30d': 'Last 30 Days', '90d': 'Last 90 Days', '12m': 'Last 12 Months' }[period] || period

    const TrendBadge = ({ value }: { value: number }) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 600, color: value >= 0 ? '#16a34a' : '#dc2626' }}>
            {value >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(value)}%
        </span>
    )

    // Simple bar chart using CSS
    const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1)

    return (
        <>
            <div className="admin-page-header">
                <div className="flex-between">
                    <div>
                        <h1>Reports</h1>
                        <p>Analytics and business performance · {periodLabel}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                        {['7d', '30d', '90d', '12m'].map(p => (
                            <button
                                key={p}
                                className={`admin-btn ${period === p ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                                onClick={() => setPeriod(p)}
                                style={{ fontSize: 12, padding: '6px 12px' }}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="admin-page-content">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                        <RefreshCw size={32} className="spin" />
                    </div>
                ) : (
                    <>
                        {/* KPI Cards */}
                        <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
                            <div className="admin-stat-card">
                                <div className="stat-icon" style={{ background: '#F0FDF4' }}><DollarSign size={20} color="#16a34a" /></div>
                                <div>
                                    <div className="stat-value">{fmtCurrency(kpis.periodRevenue)}</div>
                                    <div className="stat-label">Revenue <TrendBadge value={kpis.revenueTrend} /></div>
                                </div>
                            </div>
                            <div className="admin-stat-card">
                                <div className="stat-icon" style={{ background: '#EFF6FF' }}><ShoppingCart size={20} color="#2563eb" /></div>
                                <div>
                                    <div className="stat-value">{kpis.periodOrders}</div>
                                    <div className="stat-label">Orders <TrendBadge value={kpis.ordersTrend} /></div>
                                </div>
                            </div>
                            <div className="admin-stat-card">
                                <div className="stat-icon" style={{ background: '#FFF7ED' }}><BarChart3 size={20} color="#ea580c" /></div>
                                <div>
                                    <div className="stat-value">{fmtCurrency(kpis.avgOrderValue)}</div>
                                    <div className="stat-label">Avg Order Value</div>
                                </div>
                            </div>
                            <div className="admin-stat-card">
                                <div className="stat-icon" style={{ background: '#FAF5FF' }}><Users size={20} color="#9333ea" /></div>
                                <div>
                                    <div className="stat-value">{kpis.totalCustomers}</div>
                                    <div className="stat-label">Total Customers</div>
                                </div>
                            </div>
                        </div>

                        {/* Charts */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            {/* Revenue Chart */}
                            <div className="admin-card">
                                <h3>Revenue Trend</h3>
                                {chartData.length === 0 ? (
                                    <p style={{ color: '#94a3b8', fontSize: 13 }}>No data for selected period</p>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120, marginTop: 12 }}>
                                        {chartData.map((d, i) => (
                                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <div
                                                    style={{
                                                        width: '100%', maxWidth: 28, borderRadius: '4px 4px 0 0',
                                                        background: 'linear-gradient(180deg, #2563eb, #60a5fa)',
                                                        height: `${(d.revenue / maxRevenue) * 100}%`,
                                                        minHeight: 2,
                                                    }}
                                                    title={`${d.date}: ${fmtCurrency(d.revenue)}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Orders Chart */}
                            <div className="admin-card">
                                <h3>Orders Trend</h3>
                                {chartData.length === 0 ? (
                                    <p style={{ color: '#94a3b8', fontSize: 13 }}>No data for selected period</p>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120, marginTop: 12 }}>
                                        {chartData.map((d, i) => (
                                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <div
                                                    style={{
                                                        width: '100%', maxWidth: 28, borderRadius: '4px 4px 0 0',
                                                        background: 'linear-gradient(180deg, #16a34a, #4ade80)',
                                                        height: `${(d.orders / Math.max(...chartData.map(x => x.orders), 1)) * 100}%`,
                                                        minHeight: 2,
                                                    }}
                                                    title={`${d.date}: ${d.orders} orders`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Leaderboards */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            {/* Top Products */}
                            <div className="admin-card">
                                <div className="flex-between" style={{ marginBottom: 12 }}>
                                    <h3 style={{ margin: 0 }}><Package size={16} style={{ display: 'inline', marginRight: 6 }} />Top Products</h3>
                                </div>
                                {topProducts.length === 0 ? (
                                    <p style={{ color: '#94a3b8', fontSize: 13 }}>No product data yet</p>
                                ) : (
                                    topProducts.map((p, i) => (
                                        <div key={p.productId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < topProducts.length - 1 ? '1px solid #f1f5f9' : undefined }}>
                                            <span style={{ width: 24, height: 24, borderRadius: 6, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#2563eb' }}>{i + 1}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</div>
                                                <span style={{ fontSize: 12, color: '#94a3b8' }}>{p.orderCount} orders</span>
                                            </div>
                                            <strong style={{ color: '#16a34a' }}>{fmtCurrency(p.revenue)}</strong>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Top Customers */}
                            <div className="admin-card">
                                <div className="flex-between" style={{ marginBottom: 12 }}>
                                    <h3 style={{ margin: 0 }}><Users size={16} style={{ display: 'inline', marginRight: 6 }} />Top Customers</h3>
                                </div>
                                {topCustomers.length === 0 ? (
                                    <p style={{ color: '#94a3b8', fontSize: 13 }}>No customer data yet</p>
                                ) : (
                                    topCustomers.map((c, i) => (
                                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < topCustomers.length - 1 ? '1px solid #f1f5f9' : undefined }}>
                                            <span style={{ width: 24, height: 24, borderRadius: 6, background: '#FAF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#9333ea' }}>{i + 1}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</div>
                                                <span style={{ fontSize: 12, color: '#94a3b8' }}>{c.orderCount} orders</span>
                                            </div>
                                            <strong style={{ color: '#16a34a' }}>{fmtCurrency(c.totalSpent)}</strong>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Category Revenue */}
                        <div className="admin-card">
                            <h3>Revenue by Category</h3>
                            {categoryRevenue.length === 0 ? (
                                <p style={{ color: '#94a3b8', fontSize: 13 }}>No category revenue data yet</p>
                            ) : (
                                <div>
                                    {categoryRevenue.map((c, i) => {
                                        const maxCatRev = Math.max(...categoryRevenue.map(x => x.revenue), 1)
                                        return (
                                            <div key={i} style={{ padding: '8px 0', borderBottom: i < categoryRevenue.length - 1 ? '1px solid #f1f5f9' : undefined }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                    <span style={{ fontWeight: 500, fontSize: 13 }}>{c.category}</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{c.orderCount} orders</span>
                                                        <strong style={{ color: '#16a34a', fontSize: 13 }}>{fmtCurrency(c.revenue)}</strong>
                                                    </div>
                                                </div>
                                                <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                                                    <div style={{ height: '100%', width: `${(c.revenue / maxCatRev) * 100}%`, background: 'linear-gradient(90deg, #2563eb, #60a5fa)', borderRadius: 3 }} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    )
}
