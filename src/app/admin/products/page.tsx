import Link from 'next/link'
import {
    Search,
    RefreshCw,
    ArrowUpRight,
    Plus,
} from 'lucide-react'

const demoProducts = [
    { id: 1, name: 'Premium Business Cards', sku: 'BC-PREM-001', category: 'Business Cards', minPrice: '$19.00', maxPrice: '$89.00', status: 'Active', synced: true },
    { id: 2, name: 'Standard Flyers (8.5x11)', sku: 'FL-STD-001', category: 'Flyers & Brochures', minPrice: '$45.00', maxPrice: '$220.00', status: 'Active', synced: true },
    { id: 3, name: 'Vinyl Banners', sku: 'BN-VNL-001', category: 'Banners & Signs', minPrice: '$89.00', maxPrice: '$450.00', status: 'Active', synced: true },
    { id: 4, name: 'Letterheads', sku: 'PP-LTR-001', category: 'Print Products', minPrice: '$32.00', maxPrice: '$150.00', status: 'Active', synced: true },
    { id: 5, name: 'Tri-fold Brochures', sku: 'FL-TRI-001', category: 'Flyers & Brochures', minPrice: '$55.00', maxPrice: '$280.00', status: 'Active', synced: false },
    { id: 6, name: 'Retractable Banners', sku: 'BN-RTR-001', category: 'Banners & Signs', minPrice: '$120.00', maxPrice: '$350.00', status: 'Draft', synced: false },
    { id: 7, name: 'Custom Stickers', sku: 'PR-STK-001', category: 'Promotional', minPrice: '$12.00', maxPrice: '$95.00', status: 'Active', synced: true },
    { id: 8, name: 'Custom T-Shirts', sku: 'AP-TSH-001', category: 'Apparel', minPrice: '$14.99', maxPrice: '$54.99', status: 'Active', synced: false },
]

export default function ProductsPage() {
    return (
        <>
            <div className="admin-page-header">
                <div className="flex-between">
                    <div>
                        <h1>Products</h1>
                        <p>Manage your product catalog and sync from Sinalite</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="admin-btn admin-btn-secondary">
                            <RefreshCw size={16} /> Sync from Sinalite
                        </button>
                        <button className="admin-btn admin-btn-primary">
                            <Plus size={16} /> Add Product
                        </button>
                    </div>
                </div>
            </div>
            <div className="admin-page-content">
                {/* Filters */}
                <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: 12 }}>
                    <div className="admin-search">
                        <Search size={16} style={{ color: '#9CA3AF' }} />
                        <input type="text" placeholder="Search products..." />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <select className="form-input" style={{ width: 'auto', padding: '8px 36px 8px 12px', borderRadius: 9999, fontSize: 13 }}>
                            <option>All Categories</option>
                            <option>Business Cards</option>
                            <option>Flyers & Brochures</option>
                            <option>Banners & Signs</option>
                            <option>Promotional</option>
                            <option>Apparel</option>
                        </select>
                        <select className="form-input" style={{ width: 'auto', padding: '8px 36px 8px 12px', borderRadius: 9999, fontSize: 13 }}>
                            <option>All Status</option>
                            <option>Active</option>
                            <option>Draft</option>
                        </select>
                    </div>
                </div>

                {/* Products Table */}
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>SKU</th>
                                <th>Category</th>
                                <th>Price Range</th>
                                <th>Synced</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {demoProducts.map((product) => (
                                <tr key={product.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 10,
                                                background: '#F5F5F7', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                fontSize: 18, flexShrink: 0
                                            }}>
                                                📦
                                            </div>
                                            <span style={{ fontWeight: 600, color: '#000' }}>{product.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748B' }}>{product.sku}</td>
                                    <td>{product.category}</td>
                                    <td>
                                        <span style={{ fontWeight: 600 }}>{product.minPrice}</span>
                                        <span style={{ color: '#9CA3AF' }}> – </span>
                                        <span style={{ fontWeight: 600 }}>{product.maxPrice}</span>
                                    </td>
                                    <td>
                                        {product.synced ? (
                                            <span className="badge badge-success">✓ Synced</span>
                                        ) : (
                                            <span className="badge badge-pending">Not synced</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`badge ${product.status === 'Active' ? 'badge-success' : 'badge-pending'}`}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td>
                                        <Link href={`/admin/products/${product.id}`} className="admin-btn admin-btn-sm admin-btn-secondary">
                                            Edit <ArrowUpRight size={14} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}
