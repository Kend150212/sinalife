'use client'

import { useState, useEffect } from 'react'
import {
    FolderTree,
    Plus,
    Search,
    ChevronRight,
    ChevronDown,
    Edit2,
    Trash2,
    GripVertical,
    X,
    Check,
    RefreshCw,
    Package,
} from 'lucide-react'
import '../admin.css'

interface Category {
    id: string
    name: string
    slug: string
    description: string | null
    enabled: boolean
    sortOrder: number
    parentId: string | null
    _count: { products: number; children: number }
    children?: Category[]
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showAddForm, setShowAddForm] = useState(false)
    const [newName, setNewName] = useState('')
    const [newParent, setNewParent] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [totalProducts, setTotalProducts] = useState(0)

    const loadCategories = async () => {
        try {
            const res = await fetch('/api/admin/categories')
            const data = await res.json()
            if (!data.error) {
                setCategories(data.categories || [])
                setTotalProducts(data.totalProducts || 0)
            }
        } catch (err) {
            console.error('Failed to load categories:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadCategories() }, [])

    const handleAdd = async () => {
        if (!newName.trim()) return
        try {
            const res = await fetch('/api/admin/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, parentId: newParent || null }),
            })
            if (res.ok) {
                setNewName('')
                setNewParent('')
                setShowAddForm(false)
                loadCategories()
            }
        } catch (err) {
            console.error('Add failed:', err)
        }
    }

    const handleToggle = async (id: string, enabled: boolean) => {
        try {
            await fetch('/api/admin/categories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, enabled: !enabled }),
            })
            loadCategories()
        } catch (err) {
            console.error('Toggle failed:', err)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return
        try {
            const res = await fetch('/api/admin/categories', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            })
            const data = await res.json()
            if (data.error) alert(data.error)
            else loadCategories()
        } catch (err) {
            console.error('Delete failed:', err)
        }
    }

    const handleSaveEdit = async (id: string) => {
        if (!editName.trim()) return
        try {
            await fetch('/api/admin/categories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, name: editName }),
            })
            setEditingId(null)
            loadCategories()
        } catch (err) {
            console.error('Edit failed:', err)
        }
    }

    // Flatten categories for search
    const flattenCategories = (cats: Category[], depth = 0): (Category & { depth: number })[] => {
        const result: (Category & { depth: number })[] = []
        for (const cat of cats) {
            result.push({ ...cat, depth })
            if (cat.children) {
                result.push(...flattenCategories(cat.children, depth + 1))
            }
        }
        return result
    }

    const allFlat = flattenCategories(categories)
    const filtered = searchTerm
        ? allFlat.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : allFlat

    const totalCategories = allFlat.length
    const activeCategories = allFlat.filter(c => c.enabled).length

    if (loading) {
        return (
            <>
                <div className="admin-page-header"><h1>Categories</h1></div>
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
                        <h1>Categories</h1>
                        <p>Manage your product categories and their hierarchy</p>
                    </div>
                    <button className="admin-btn admin-btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                        <Plus size={16} /> Add Category
                    </button>
                </div>
            </div>

            <div className="admin-page-content">
                {/* Stats */}
                <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
                    <div className="admin-stat-card">
                        <div className="stat-icon" style={{ background: '#EFF6FF' }}><FolderTree size={20} color="#2563eb" /></div>
                        <div><div className="stat-value">{totalCategories}</div><div className="stat-label">Total Categories</div></div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="stat-icon" style={{ background: '#F0FDF4' }}><Check size={20} color="#16a34a" /></div>
                        <div><div className="stat-value">{activeCategories}</div><div className="stat-label">Active</div></div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="stat-icon" style={{ background: '#FFF7ED' }}><Package size={20} color="#ea580c" /></div>
                        <div><div className="stat-value">{totalProducts}</div><div className="stat-label">Total Products</div></div>
                    </div>
                </div>

                {/* Add Form */}
                {showAddForm && (
                    <div className="admin-card" style={{ marginBottom: 16 }}>
                        <h3>New Category</h3>
                        <div className="settings-form-grid">
                            <div className="admin-form-group">
                                <label className="form-label">Name</label>
                                <input className="form-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Category name" autoFocus />
                            </div>
                            <div className="admin-form-group">
                                <label className="form-label">Parent (optional)</label>
                                <select className="form-input form-select" value={newParent} onChange={e => setNewParent(e.target.value)}>
                                    <option value="">— Top Level —</option>
                                    {allFlat.map(c => (
                                        <option key={c.id} value={c.id}>{'  '.repeat(c.depth)}{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className="admin-btn admin-btn-primary" onClick={handleAdd}><Check size={14} /> Create</button>
                            <button className="admin-btn admin-btn-secondary" onClick={() => setShowAddForm(false)}><X size={14} /> Cancel</button>
                        </div>
                    </div>
                )}

                {/* Search */}
                <div className="admin-card" style={{ marginBottom: 16 }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input className="form-input" placeholder="Search categories..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: 36 }} />
                    </div>
                </div>

                {/* Category List */}
                <div className="admin-card">
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                            <FolderTree size={40} />
                            <p>No categories found. Create your first category to get started.</p>
                        </div>
                    ) : (
                        <div style={{ overflow: 'auto' }}>
                            <table className="admin-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: 30 }}></th>
                                        <th>Category</th>
                                        <th>Products</th>
                                        <th>Status</th>
                                        <th style={{ width: 100 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(cat => (
                                        <tr key={cat.id}>
                                            <td><GripVertical size={14} color="#cbd5e1" /></td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', paddingLeft: cat.depth * 24 }}>
                                                    {cat._count.children > 0 ? <ChevronDown size={14} style={{ marginRight: 4 }} /> : <ChevronRight size={14} style={{ marginRight: 4, opacity: 0.3 }} />}
                                                    {editingId === cat.id ? (
                                                        <input className="form-input" style={{ width: 200, padding: '4px 8px', fontSize: 13 }} value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveEdit(cat.id)} autoFocus />
                                                    ) : (
                                                        <span style={{ fontWeight: 500 }}>{cat.name}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td><span className="badge">{cat._count.products}</span></td>
                                            <td>
                                                <button
                                                    className={`badge ${cat.enabled ? 'badge-success' : 'badge-warning'}`}
                                                    onClick={() => handleToggle(cat.id, cat.enabled)}
                                                    style={{ cursor: 'pointer', border: 'none' }}
                                                >
                                                    {cat.enabled ? 'Active' : 'Disabled'}
                                                </button>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    {editingId === cat.id ? (
                                                        <>
                                                            <button className="admin-btn admin-btn-sm" onClick={() => handleSaveEdit(cat.id)}><Check size={12} /></button>
                                                            <button className="admin-btn admin-btn-sm" onClick={() => setEditingId(null)}><X size={12} /></button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button className="admin-btn admin-btn-sm" onClick={() => { setEditingId(cat.id); setEditName(cat.name) }}><Edit2 size={12} /></button>
                                                            <button className="admin-btn admin-btn-sm" onClick={() => handleDelete(cat.id)} style={{ color: '#dc2626' }}><Trash2 size={12} /></button>
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
            </div>
        </>
    )
}
