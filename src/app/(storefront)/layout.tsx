import type { Metadata } from 'next'
import Link from 'next/link'
import './storefront.css'

export const metadata: Metadata = {
    title: 'PrintPro — Premium Custom Printing Services',
    description: 'Professional custom printing services. Business cards, flyers, banners, and more. Fast turnaround, competitive pricing.',
}

export default function StorefrontLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <header className="store-header">
                <div className="store-header-inner">
                    <Link href="/" className="store-logo">
                        <span className="store-logo-text">PrintPro</span>
                    </Link>
                    <nav className="store-nav">
                        <Link href="/products" className="store-nav-link">Store</Link>
                        <Link href="/products/business-cards" className="store-nav-link">Business</Link>
                        <Link href="/products/flyers-brochures" className="store-nav-link">Marketing</Link>
                        <Link href="/products/banners-signs" className="store-nav-link">Signage</Link>
                        <Link href="/contact" className="store-nav-link">Support</Link>
                    </nav>
                    <div className="store-header-actions">
                        <button className="store-header-icon" aria-label="Search">🔍</button>
                        <Link href="/auth/login" className="store-header-icon" aria-label="Account">👤</Link>
                        <Link href="/cart" className="store-cart-btn">
                            🛒
                            <span className="cart-count">0</span>
                        </Link>
                    </div>
                </div>
            </header>
            <main className="store-main">
                {children}
            </main>
            <footer className="store-footer">
                <div className="store-footer-inner">
                    <div className="footer-grid">
                        <div className="footer-col">
                            <h4>Products</h4>
                            <Link href="/products/business-cards">Business Cards</Link>
                            <Link href="/products/flyers-brochures">Flyers & Brochures</Link>
                            <Link href="/products/banners-signs">Banners & Signs</Link>
                            <Link href="/products/promotional">Promotional</Link>
                            <Link href="/products/packaging">Packaging</Link>
                        </div>
                        <div className="footer-col">
                            <h4>Company</h4>
                            <Link href="/about">About Us</Link>
                            <Link href="/contact">Contact</Link>
                            <Link href="/faq">FAQ</Link>
                            <Link href="/terms">Terms & Conditions</Link>
                            <Link href="/privacy">Privacy Policy</Link>
                        </div>
                        <div className="footer-col">
                            <h4>Support</h4>
                            <Link href="/faq">Help Center</Link>
                            <Link href="/contact">Contact Us</Link>
                            <Link href="/shipping">Shipping Info</Link>
                            <Link href="/returns">Returns</Link>
                        </div>
                        <div className="footer-col">
                            <h4>Connect</h4>
                            <p className="footer-contact-text">Questions? We&apos;re here to help!</p>
                            <p className="footer-contact-text">📧 info@printpro.com</p>
                            <p className="footer-contact-text">📞 1-800-PRINT-US</p>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; {new Date().getFullYear()} PrintPro. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </>
    )
}
