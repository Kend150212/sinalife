import Link from 'next/link'
import Image from 'next/image'

const featuredProducts = [
    { name: 'Premium Business Cards', slug: 'business-cards/premium-business-cards', price: '$19.00', image: '/images/products/business-cards.png', badge: 'NEW', badgeClass: 'new' },
    { name: 'Glossy Flyers', slug: 'flyers-brochures/standard-flyers', price: '$45.00', image: '/images/products/flyers-brochures.png', badge: 'BEST SELLER', badgeClass: 'bestseller' },
    { name: 'Vinyl Banners', slug: 'banners-signs/vinyl-banners', price: '$89.00', image: '/images/products/banners-signs.png', badge: 'DURABLE', badgeClass: 'durable' },
    { name: 'Letterheads', slug: 'print-products/letterheads', price: '$32.00', image: '/images/products/print-products.png' },
    { name: 'Tri-fold Brochures', slug: 'flyers-brochures/tri-fold-brochures', price: '$55.00', image: '/images/products/flyers-brochures.png' },
    { name: 'Retractable Banners', slug: 'banners-signs/retractable-banners', price: '$120.00', image: '/images/products/banners-signs.png' },
    { name: 'Custom Stickers', slug: 'promotional/custom-stickers', price: '$12.00', image: '/images/products/stickers.png' },
    { name: 'Custom T-Shirts', slug: 'apparel/custom-t-shirts', price: '$14.99', image: '/images/products/apparel.png' },
]

const categoryPills = ['All', 'Business', 'Marketing', 'Signage', 'Labels']

const features = [
    { icon: '⚡', color: '#FFF7ED', title: 'Fast Turnaround', description: 'Most orders produced and shipped within 2-3 business days.' },
    { icon: '💎', color: '#EFF6FF', title: 'Premium Quality', description: 'Professional-grade materials and state-of-the-art printing technology.' },
    { icon: '🚚', color: '#F0FDF4', title: 'Free Shipping', description: 'Free standard shipping on qualifying orders across the USA.' },
    { icon: '🎨', color: '#FDF2F8', title: 'Upload Your Design', description: 'Simply upload your artwork and we handle the rest.' },
    { icon: '💰', color: '#FEFCE8', title: 'Competitive Pricing', description: 'Wholesale pricing with volume discounts. No hidden fees.' },
    { icon: '🛡️', color: '#F5F3FF', title: 'Satisfaction Guaranteed', description: "We stand behind our quality. Not happy? We'll make it right." },
]

export default function HomePage() {
    return (
        <>
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-inner">
                    <h1 className="hero-title">
                        Design. Print. <span className="gradient-text">Delivered.</span>
                    </h1>
                    <p className="hero-subtitle">
                        A professional printing ecosystem for modern businesses.
                    </p>
                    <div className="hero-search">
                        <span className="hero-search-icon">🔍</span>
                        <input
                            type="text"
                            className="hero-search-input"
                            placeholder="Search for business cards, flyers, banners..."
                            readOnly
                        />
                        <span className="hero-search-shortcut">CMD + K</span>
                    </div>
                </div>
            </section>

            {/* Products Section */}
            <section className="products-section">
                <div className="products-section-header">
                    <h2 className="products-section-title">Direct from the Press.</h2>
                    <Link href="/products" className="products-section-link">
                        Explore all 100+ items →
                    </Link>
                </div>

                <div className="category-pills">
                    {categoryPills.map((cat, i) => (
                        <span key={cat} className={`category-pill ${i === 0 ? 'active' : ''}`}>
                            {cat}
                        </span>
                    ))}
                </div>

                <div className="home-products-grid">
                    {featuredProducts.map((product) => (
                        <Link key={product.slug} href={`/products/${product.slug}`} className="home-product-card">
                            <div className="home-product-image">
                                <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                    style={{ objectFit: 'cover' }}
                                />
                                {product.badge && (
                                    <span className={`product-badge ${product.badgeClass}`}>
                                        {product.badge}
                                    </span>
                                )}
                                <span className="customize-btn">Customize</span>
                            </div>
                            <h3 className="home-product-name">{product.name}</h3>
                            <p className="home-product-price">Starts at {product.price}</p>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Quality Section (Bento Grid) */}
            <section className="quality-section">
                <div className="quality-grid">
                    <div className="quality-main-card">
                        <h2>The quality you can feel.</h2>
                        <p>
                            We use state-of-the-art HP Indigo presses and premium FSC-certified
                            papers to ensure your brand looks its absolute best.
                        </p>
                        <Link href="/about" className="quality-link">
                            Learn about our process →
                        </Link>
                    </div>
                    <div className="quality-dark-card">
                        <span className="big-number">24h</span>
                        <h3>Rush Printing</h3>
                        <p>Need it tomorrow? We&apos;ve got you covered with local production hubs.</p>
                    </div>
                </div>
                <div className="quality-bottom-grid" style={{ marginTop: 16 }}>
                    <div className="quality-card eco">
                        <h3>Eco-Friendly</h3>
                        <p>Sustainable inks and recycled materials options for every product.</p>
                    </div>
                    <div className="quality-card design">
                        <h3>Design Studios</h3>
                        <p>Professional design assistance available for every order. Let our experts polish your vision.</p>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="section-inner">
                    <div className="section-header">
                        <h2>Why Choose PrintPro</h2>
                        <p>Everything you need for professional custom printing</p>
                    </div>
                    <div className="features-grid">
                        {features.map((feature) => (
                            <div key={feature.title} className="feature-card">
                                <div className="feature-icon" style={{ backgroundColor: feature.color }}>
                                    {feature.icon}
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="section-inner">
                    <h2>Ready to Start Printing?</h2>
                    <p>Get your custom prints delivered in as fast as 2 business days.</p>
                    <Link href="/products" className="cta-btn">
                        Get Started Now →
                    </Link>
                </div>
            </section>
        </>
    )
}
