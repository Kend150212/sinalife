'use client'

import { useState, useEffect } from 'react'
import {
    UserCog,
    Plus,
    Search,
    Shield,
    ShieldCheck,
    Edit2,
    Trash2,
    X,
    Check,
    RefreshCw,
    Mail,
} from 'lucide-react'
import '../admin.css'

interface StaffUser {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    avatar: string | null
    createdAt: string
    lastLogin: string | null
}

interface Stats {
    admins: number
    staff: number
    total: number
}

const permissions = [
    { name: 'View Dashboard', admin: true, staff: true },
    { name: 'Manage Orders', admin: true, staff: true },
    { name: 'Manage Products', admin: true, staff: true },
    { name: 'Manage Categories', admin: true, staff: false },
    { name: 'Manage Pricing', admin: true, staff: false },
    { name: 'View Reports', admin: true, staff: true },
    { name: 'Manage Customers', admin: true, staff: false },
    { name: 'Manage Staff', admin: true, staff: false },
    { name: 'Store Settings', admin: true, staff: false },
]

export default function UsersPage() {
    const [users, setUsers] = useState<StaffUser[]>([])
    const [stats, setStats] = useState<Stats>({ admins: 0, staff: 0, total: 0 })
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showAddForm, setShowAddForm] = useState(false)
    const [newUser, setNewUser] = useState({ email: '', firstName: '', lastName: '', role: 'STAFF', password: '' })
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editRole, setEditRole] = useState('')

    const loadUsers = async () => {
        try {
            const res = await fetch('/api/admin/users')
            const data = await res.json()
            if (!data.error) {
                setUsers(data.users || [])
                setStats(data.stats || { admins: 0, staff: 0, total: 0 })
            }
        } catch (err) {
            console.error('Failed to load users:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadUsers() }, [])

    const handleAdd = async () => {
        if (!newUser.email || !newUser.firstName || !newUser.lastName || !newUser.password) return
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            })
            const data = await res.json()
            if (data.error) alert(data.error)
            else {
                setShowAddForm(false)
                setNewUser({ email: '', firstName: '', lastName: '', role: 'STAFF', password: '' })
                loadUsers()
            }
        } catch (err) {
            console.error('Add failed:', err)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this user?')) return
        try {
            const res = await fetch('/api/admin/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            })
            const data = await res.json()
            if (data.error) alert(data.error)
            else loadUsers()
        } catch (err) {
            console.error('Delete failed:', err)
        }
    }

    const handleSaveRole = async (id: string) => {
        try {
            await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, role: editRole }),
            })
            setEditingId(null)
            loadUsers()
        } catch (err) {
            console.error('Update failed:', err)
        }
    }

    const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

    const filtered = searchTerm
        ? users.filter(u =>
            `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : users

    if (loading) {
        return (
            <>
                <div className="admin-page-header"><h1>Staff / Users</h1></div>
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
                        <h1>Staff / Users</h1>
                        <p>Manage your team members and their access levels</p>
                    </div>
                    <button className="admin-btn admin-btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                        <Plus size={16} /> Invite User
                    </button>
                </div>
            </div>

            <div className="admin-page-content">
                {/* Stats */}
                <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
                    <div className="admin-stat-card">
                        <div className="stat-icon" style={{ background: '#FFF7ED' }}><ShieldCheck size={20} color="#ea580c" /></div>
                        <div><div className="stat-value">{stats.admins}</div><div className="stat-label">Admins</div></div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="stat-icon" style={{ background: '#EFF6FF' }}><Shield size={20} color="#2563eb" /></div>
                        <div><div className="stat-value">{stats.staff}</div><div className="stat-label">Staff</div></div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="stat-icon" style={{ background: '#F0FDF4' }}><UserCog size={20} color="#16a34a" /></div>
                        <div><div className="stat-value">{stats.total}</div><div className="stat-label">Total Team</div></div>
                    </div>
                </div>

                {/* Add Form */}
                {showAddForm && (
                    <div className="admin-card" style={{ marginBottom: 16 }}>
                        <h3>Invite New Team Member</h3>
                        <div className="settings-form-grid">
                            <div className="admin-form-group">
                                <label className="form-label">First Name</label>
                                <input className="form-input" value={newUser.firstName} onChange={e => setNewUser({ ...newUser, firstName: e.target.value })} placeholder="First name" />
                            </div>
                            <div className="admin-form-group">
                                <label className="form-label">Last Name</label>
                                <input className="form-input" value={newUser.lastName} onChange={e => setNewUser({ ...newUser, lastName: e.target.value })} placeholder="Last name" />
                            </div>
                            <div className="admin-form-group">
                                <label className="form-label">Email</label>
                                <input className="form-input" type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@example.com" />
                            </div>
                            <div className="admin-form-group">
                                <label className="form-label">Password</label>
                                <input className="form-input" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="••••••••" />
                            </div>
                            <div className="admin-form-group">
                                <label className="form-label">Role</label>
                                <select className="form-input form-select" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                    <option value="STAFF">Staff</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className="admin-btn admin-btn-primary" onClick={handleAdd}><Check size={14} /> Create User</button>
                            <button className="admin-btn admin-btn-secondary" onClick={() => setShowAddForm(false)}><X size={14} /> Cancel</button>
                        </div>
                    </div>
                )}

                {/* Search */}
                <div className="admin-card" style={{ marginBottom: 16 }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input className="form-input" placeholder="Search team members..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: 36 }} />
                    </div>
                </div>

                {/* Users Table */}
                <div className="admin-card" style={{ marginBottom: 16 }}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                            <UserCog size={40} />
                            <p>No team members found.</p>
                        </div>
                    ) : (
                        <div style={{ overflow: 'auto' }}>
                            <table className="admin-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Member</th>
                                        <th>Role</th>
                                        <th>Last Login</th>
                                        <th>Joined</th>
                                        <th style={{ width: 100 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(u => (
                                        <tr key={u.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{
                                                        width: 36, height: 36, borderRadius: '50%',
                                                        background: u.role === 'ADMIN' ? '#FFF7ED' : '#EFF6FF',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 600, color: u.role === 'ADMIN' ? '#ea580c' : '#2563eb', fontSize: 14,
                                                    }}>
                                                        {u.firstName?.[0]}{u.lastName?.[0]}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 500 }}>{u.firstName} {u.lastName}</div>
                                                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {editingId === u.id ? (
                                                    <select className="form-input form-select" style={{ width: 100, padding: '4px 8px', fontSize: 13 }} value={editRole} onChange={e => setEditRole(e.target.value)}>
                                                        <option value="ADMIN">Admin</option>
                                                        <option value="STAFF">Staff</option>
                                                    </select>
                                                ) : (
                                                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-warning' : 'badge-success'}`}>
                                                        {u.role === 'ADMIN' ? '🛡️ Admin' : '👤 Staff'}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ fontSize: 13, color: '#64748b' }}>{fmtDate(u.lastLogin)}</td>
                                            <td style={{ fontSize: 13, color: '#64748b' }}>{fmtDate(u.createdAt)}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    {editingId === u.id ? (
                                                        <>
                                                            <button className="admin-btn admin-btn-sm" onClick={() => handleSaveRole(u.id)}><Check size={12} /></button>
                                                            <button className="admin-btn admin-btn-sm" onClick={() => setEditingId(null)}><X size={12} /></button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button className="admin-btn admin-btn-sm" onClick={() => { setEditingId(u.id); setEditRole(u.role) }}><Edit2 size={12} /></button>
                                                            <button className="admin-btn admin-btn-sm" onClick={() => handleDelete(u.id)} style={{ color: '#dc2626' }}><Trash2 size={12} /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Permissions Matrix */}
                <div className="admin-card">
                    <h3>Role Permissions</h3>
                    <div style={{ overflow: 'auto' }}>
                        <table className="admin-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Permission</th>
                                    <th style={{ textAlign: 'center' }}>🛡️ Admin</th>
                                    <th style={{ textAlign: 'center' }}>👤 Staff</th>
                                </tr>
                            </thead>
                            <tbody>
                                {permissions.map(p => (
                                    <tr key={p.name}>
                                        <td style={{ fontWeight: 500 }}>{p.name}</td>
                                        <td style={{ textAlign: 'center', color: p.admin ? '#16a34a' : '#dc2626' }}>{p.admin ? '✓' : '—'}</td>
                                        <td style={{ textAlign: 'center', color: p.staff ? '#16a34a' : '#dc2626' }}>{p.staff ? '✓' : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    )
}
