import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db'

// Image map: category-slug → real product photo
const categoryImages: Record<string, string> = {
    'business-cards': '/images/products/business-cards.png',
    'flyers-brochures': '/images/products/flyers-brochures.png',
    'banners-signs': '/images/products/banners-signs.png',
    'promotional': '/images/products/stickers.png',
    'print-products': '/images/products/print-products.png',
    'apparel': '/images/products/apparel.png',
}

// Per-product image override (more specific)
const productImages: Record<string, string> = {
    'premium-business-cards': '/images/products/business-cards.png',
    'soft-touch-business-cards': '/images/products/business-cards.png',
    'standard-flyers': '/images/products/flyers-brochures.png',
    'tri-fold-brochures': '/images/products/flyers-brochures.png',
    'vinyl-banners': '/images/products/banners-signs.png',
    'retractable-banners': '/images/products/banners-signs.png',
    'custom-stickers': '/images/products/stickers.png',
    'postcards': '/images/products/print-products.png',
    'door-hangers': '/images/products/stickers.png',
    'presentation-folders': '/images/products/print-products.png',
    'letterheads': '/images/products/print-products.png',
    'custom-t-shirts': '/images/products/apparel.png',
}

function getProductImage(slug: string, categorySlug: string): string {
    return productImages[slug] || categoryImages[categorySlug] || '/images/products/print-products.png'
}

// Demo products for when DB is not available
const demoProducts = [
    { id: 1, name: 'Premium Business Cards', slug: 'premium-business-cards', sku: 'BC-001', description: 'High-quality business cards on premium 16pt cardstock', categorySlug: 'business-cards', enabled: true, basePrice: 29.99 },
    { id: 2, name: 'Soft Touch Business Cards', slug: 'soft-touch-business-cards', sku: 'BC-002', description: 'Luxurious soft touch coating for a premium feel', categorySlug: 'business-cards', enabled: true, basePrice: 49.99 },
    { id: 3, name: 'Standard Flyers', slug: 'standard-flyers', sku: 'FL-001', description: 'Full-color flyers printed on glossy or matte paper', categorySlug: 'flyers-brochures', enabled: true, basePrice: 39.99 },
    { id: 4, name: 'Tri-Fold Brochures', slug: 'tri-fold-brochures', sku: 'BR-001', description: 'Professional tri-fold brochures for marketing materials', categorySlug: 'flyers-brochures', enabled: true, basePrice: 59.99 },
    { id: 5, name: 'Vinyl Banners', slug: 'vinyl-banners', sku: 'BN-001', description: 'Durable vinyl banners for indoor and outdoor use', categorySlug: 'banners-signs', enabled: true, basePrice: 24.99 },
    { id: 6, name: 'Retractable Banners', slug: 'retractable-banners', sku: 'BN-002', description: 'Professional retractable banner stands for trade shows', categorySlug: 'banners-signs', enabled: true, basePrice: 89.99 },
    { id: 7, name: 'Custom Stickers', slug: 'custom-stickers', sku: 'ST-001', description: 'Die-cut custom stickers and labels in any shape', categorySlug: 'promotional', enabled: true, basePrice: 19.99 },
    { id: 8, name: 'Postcards', slug: 'postcards', sku: 'PC-001', description: 'Full-color postcards for direct mail campaigns', categorySlug: 'print-products', enabled: true, basePrice: 34.99 },
    { id: 9, name: 'Door Hangers', slug: 'door-hangers', sku: 'DH-001', description: 'Custom door hangers for local marketing', categorySlug: 'promotional', enabled: true, basePrice: 44.99 },
    { id: 10, name: 'Presentation Folders', slug: 'presentation-folders', sku: 'PF-001', description: 'Professional presentation folders with pockets', categorySlug: 'print-products', enabled: true, basePrice: 79.99 },
    { id: 11, name: 'Letterheads', slug: 'letterheads', sku: 'LH-001', description: 'Custom letterheads for professional correspondence', categorySlug: 'print-products', enabled: true, basePrice: 29.99 },
    { id: 12, name: 'Custom T-Shirts', slug: 'custom-t-shirts', sku: 'TS-001', description: 'High-quality custom printed t-shirts', categorySlug: 'apparel', enabled: true, basePrice: 14.99 },
]

const demoCategories = [
    { id: 'business-cards', name: 'Business Cards', slug: 'business-cards', count: 2 },
    { id: 'flyers-brochures', name: 'Flyers & Brochures', slug: 'flyers-brochures', count: 2 },
    { id: 'banners-signs', name: 'Banners & Signs', slug: 'banners-signs', count: 2 },
    { id: 'promotional', name: 'Promotional', slug: 'promotional', count: 2 },
    { id: 'print-products', name: 'Print Products', slug: 'print-products', count: 3 },
    { id: 'apparel', name: 'Apparel', slug: 'apparel', count: 1 },
]

async function getProducts() {
    try {
        const products = await prisma.product.findMany({
            where: { enabled: true },
            include: { category: true },
            orderBy: { name: 'asc' },
        })
        return products.length > 0 ? products : null
    } catch {
        return null
    }
}

async function getCategories() {
    try {
        const categories = await prisma.category.findMany({
            where: { enabled: true },
            include: { _count: { select: { products: true } } },
            orderBy: { sortOrder: 'asc' },
        })
        return categories.length > 0 ? categories : null
    } catch {
        return null
    }
}

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ category?: string; search?: string; sort?: string }>
}) {
    const params = await searchParams
    const dbProducts = await getProducts()
    const dbCategories = await getCategories()

    // Use DB data if available, otherwise use demo data
    const useDemo = !dbProducts
    const products = useDemo ? demoProducts : dbProducts.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        description: p.description || '',
        categorySlug: p.category?.slug || '',
        enabled: p.enabled,
        basePrice: 0,
    }))

    const categories = useDemo ? demoCategories : dbCategories!.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        count: c._count.products,
    }))

    // Apply filters
    let filtered = products
    if (params.category) {
        filtered = filtered.filter(p => p.categorySlug === params.category)
    }
    if (params.search) {
        const q = params.search.toLowerCase()
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        )
    }

    // Sort
    if (params.sort === 'price-asc') {
        filtered = [...filtered].sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0))
    } else if (params.sort === 'price-desc') {
        filtered = [...filtered].sort((a, b) => (b.basePrice || 0) - (a.basePrice || 0))
    } else if (params.sort === 'name') {
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
    }

    const activeCategory = params.category
    const activeCategoryName = categories.find(c => c.slug === activeCategory)?.name

    return (
        <div className="products-page">
            {/* Page Header */}
            <div className="products-header">
                <div className="products-header-inner">
                    <div>
                        <h1>{activeCategoryName || 'All Products'}</h1>
                        <p>{filtered.length} {filtered.length === 1 ? 'product' : 'products'} available</p>
                    </div>
                    <div className="products-toolbar">
                        <form className="products-search" action="/products" method="GET">
                            {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
                            <input
                                type="text"
                                name="search"
                                placeholder="Search products..."
                                defaultValue={params.search || ''}
                                className="products-search-input"
                            />
                            <button type="submit" className="products-search-btn">🔍</button>
                        </form>
                        <div className="products-sort">
                            <label htmlFor="sort">Sort:</label>
                            <select id="sort" defaultValue={params.sort || 'default'}>
                                <option value="default">Featured</option>
                                <option value="name">Name A-Z</option>
                                <option value="price-asc">Price: Low → High</option>
                                <option value="price-desc">Price: High → Low</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="products-layout">
                {/* Sidebar - Categories */}
                <aside className="products-sidebar">
                    <h3>Categories</h3>
                    <nav className="category-nav">
                        <Link
                            href="/products"
                            className={`category-nav-link ${!activeCategory ? 'active' : ''}`}
                        >
                            All Products
                            <span className="category-count">{products.length}</span>
                        </Link>
                        {categories.map(cat => (
                            <Link
                                key={cat.id}
                                href={`/products?category=${cat.slug}`}
                                className={`category-nav-link ${activeCategory === cat.slug ? 'active' : ''}`}
                            >
                                {cat.name}
                                <span className="category-count">{cat.count}</span>
                            </Link>
                        ))}
                    </nav>
                </aside>

                {/* Product Grid */}
                <div className="products-grid-container">
                    {filtered.length === 0 ? (
                        <div className="products-empty">
                            <span className="products-empty-icon">🔍</span>
                            <h3>No products found</h3>
                            <p>Try adjusting your search or filter criteria</p>
                            <Link href="/products" className="btn btn-primary">View All Products</Link>
                        </div>
                    ) : (
                        <div className="products-grid">
                            {filtered.map(product => (
                                <Link
                                    key={product.id}
                                    href={`/products/${product.categorySlug || 'all'}/${product.slug}`}
                                    className="product-card"
                                >
                                    <div className="product-card-image">
                                        <Image
                                            src={getProductImage(product.slug, product.categorySlug)}
                                            alt={product.name}
                                            width={400}
                                            height={280}
                                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                        />
                                    </div>
                                    <div className="product-card-body">
                                        <span className="product-card-category">
                                            {categories.find(c => c.slug === product.categorySlug)?.name || 'General'}
                                        </span>
                                        <h3 className="product-card-title">{product.name}</h3>
                                        <p className="product-card-desc">{product.description}</p>
                                        {'basePrice' in product && product.basePrice > 0 && (
                                            <div className="product-card-price">
                                                Starting at <strong>${product.basePrice.toFixed(2)}</strong>
                                            </div>
                                        )}
                                        <div className="product-card-cta">
                                            View Options →
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
