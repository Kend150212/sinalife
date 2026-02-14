'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'

// Image map per product slug
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

// Demo product detail data
const demoProductDetails: Record<string, {
    id: number, name: string, slug: string, sku: string, description: string,
    categorySlug: string, categoryName: string,
    basePrice: number, options: { group: string, values: string[] }[]
}> = {
    'premium-business-cards': {
        id: 1, name: 'Premium Business Cards', slug: 'premium-business-cards', sku: 'BC-001',
        description: 'Make a lasting first impression with our premium 16pt business cards. Full-color printing on both sides, with a variety of finishes available including gloss, matte, and UV coating.',
        categorySlug: 'business-cards', categoryName: 'Business Cards', basePrice: 29.99,
        options: [
            { group: 'Quantity', values: ['250', '500', '1000', '2500', '5000'] },
            { group: 'Size', values: ['3.5" x 2" (Standard)', '3.5" x 2.5"', '2" x 2" (Square)'] },
            { group: 'Paper Stock', values: ['16pt Cardstock', '14pt Cardstock', '18pt Cardstock'] },
            { group: 'Coating', values: ['Gloss UV', 'Matte Finish', 'Soft Touch', 'Uncoated'] },
            { group: 'Print Sides', values: ['Front Only', 'Front & Back'] },
        ],
    },
    'soft-touch-business-cards': {
        id: 2, name: 'Soft Touch Business Cards', slug: 'soft-touch-business-cards', sku: 'BC-002',
        description: 'Premium soft touch laminated business cards with a velvety smooth finish. Perfect for luxury brands and professionals who want to stand out.',
        categorySlug: 'business-cards', categoryName: 'Business Cards', basePrice: 49.99,
        options: [
            { group: 'Quantity', values: ['250', '500', '1000', '2500'] },
            { group: 'Size', values: ['3.5" x 2" (Standard)', '2" x 3.5" (Vertical)'] },
            { group: 'Paper Stock', values: ['16pt Cardstock', '18pt Cardstock'] },
            { group: 'Print Sides', values: ['Front Only', 'Front & Back'] },
        ],
    },
    'standard-flyers': {
        id: 3, name: 'Standard Flyers', slug: 'standard-flyers', sku: 'FL-001',
        description: 'Eye-catching full-color flyers for events, promotions, and marketing. Printed on high-quality paper with vibrant colors.',
        categorySlug: 'flyers-brochures', categoryName: 'Flyers & Brochures', basePrice: 39.99,
        options: [
            { group: 'Quantity', values: ['250', '500', '1000', '2500', '5000', '10000'] },
            { group: 'Size', values: ['8.5" x 11" (Letter)', '5.5" x 8.5" (Half Letter)', '4" x 6"'] },
            { group: 'Paper Stock', values: ['100lb Gloss Text', '80lb Matte Text', '100lb Matte Text'] },
            { group: 'Print Sides', values: ['Front Only', 'Front & Back'] },
        ],
    },
    'tri-fold-brochures': {
        id: 4, name: 'Tri-Fold Brochures', slug: 'tri-fold-brochures', sku: 'BR-001',
        description: 'Professional tri-fold brochures for marketing materials. Perfect for restaurants, real estate, and service businesses.',
        categorySlug: 'flyers-brochures', categoryName: 'Flyers & Brochures', basePrice: 59.99,
        options: [
            { group: 'Quantity', values: ['250', '500', '1000', '2500'] },
            { group: 'Size', values: ['8.5" x 11" (Letter)', '8.5" x 14" (Legal)'] },
            { group: 'Paper Stock', values: ['100lb Gloss Text', '100lb Matte Text', '80lb Gloss Cover'] },
            { group: 'Fold', values: ['Tri-Fold', 'Z-Fold', 'Half-Fold'] },
        ],
    },
    'vinyl-banners': {
        id: 5, name: 'Vinyl Banners', slug: 'vinyl-banners', sku: 'BN-001',
        description: 'Durable 13oz vinyl banners with vivid full-color printing. Weather-resistant for indoor and outdoor use. Includes grommets.',
        categorySlug: 'banners-signs', categoryName: 'Banners & Signs', basePrice: 24.99,
        options: [
            { group: 'Size', values: ['2\' x 4\'', '3\' x 6\'', '4\' x 8\'', '2\' x 8\'', 'Custom Size'] },
            { group: 'Material', values: ['13oz Vinyl', '15oz Vinyl (Heavy Duty)', 'Mesh Vinyl (Wind-through)'] },
            { group: 'Finishing', values: ['Grommets', 'Pole Pockets', 'Hemmed Edges'] },
        ],
    },
    'retractable-banners': {
        id: 6, name: 'Retractable Banners', slug: 'retractable-banners', sku: 'BN-002',
        description: 'Professional retractable banner stands for trade shows, events, and retail displays. Easy setup with carrying case included.',
        categorySlug: 'banners-signs', categoryName: 'Banners & Signs', basePrice: 89.99,
        options: [
            { group: 'Size', values: ['33" x 80"', '36" x 92"', '47" x 80"'] },
            { group: 'Stand Type', values: ['Economy', 'Standard', 'Premium (Double-sided)'] },
        ],
    },
    'custom-stickers': {
        id: 7, name: 'Custom Stickers', slug: 'custom-stickers', sku: 'ST-001',
        description: 'Die-cut stickers and labels in any shape. Waterproof vinyl material perfect for laptops, phones, water bottles, and more.',
        categorySlug: 'promotional', categoryName: 'Promotional', basePrice: 19.99,
        options: [
            { group: 'Quantity', values: ['50', '100', '250', '500', '1000'] },
            { group: 'Size', values: ['2" x 2"', '3" x 3"', '4" x 4"', 'Custom Size'] },
            { group: 'Material', values: ['White Vinyl', 'Clear Vinyl', 'Holographic'] },
            { group: 'Shape', values: ['Die Cut', 'Circle', 'Rectangle', 'Square'] },
        ],
    },
    'postcards': {
        id: 8, name: 'Postcards', slug: 'postcards', sku: 'PC-001',
        description: 'Full-color postcards for direct mail campaigns, event invitations, and promotional mailers.',
        categorySlug: 'print-products', categoryName: 'Print Products', basePrice: 34.99,
        options: [
            { group: 'Quantity', values: ['250', '500', '1000', '2500', '5000'] },
            { group: 'Size', values: ['4" x 6"', '5" x 7"', '6" x 9"'] },
            { group: 'Paper Stock', values: ['14pt Cardstock', '16pt Cardstock'] },
            { group: 'Coating', values: ['Gloss UV', 'Matte', 'Uncoated'] },
        ],
    },
    'custom-t-shirts': {
        id: 12, name: 'Custom T-Shirts', slug: 'custom-t-shirts', sku: 'TS-001',
        description: 'High-quality custom printed t-shirts available in a wide range of sizes and colors. DTG and screen printing options.',
        categorySlug: 'apparel', categoryName: 'Apparel', basePrice: 14.99,
        options: [
            { group: 'Quantity', values: ['12', '24', '50', '100', '250'] },
            { group: 'Size', values: ['S', 'M', 'L', 'XL', '2XL', '3XL'] },
            { group: 'Color', values: ['White', 'Black', 'Navy', 'Red', 'Heather Grey'] },
            { group: 'Print Method', values: ['DTG (Direct-to-Garment)', 'Screen Print', 'Vinyl Transfer'] },
        ],
    },
}

// Pricing simulation
const pricingTable: Record<string, Record<string, number>> = {
    '250': { base: 1.0 },
    '500': { base: 0.85 },
    '1000': { base: 0.7 },
    '2500': { base: 0.55 },
    '5000': { base: 0.45 },
    '10000': { base: 0.35 },
    '50': { base: 1.2 },
    '100': { base: 1.0 },
    '12': { base: 1.5 },
    '24': { base: 1.3 },
}

export default function ProductDetailPage() {
    const params = useParams()
    const slug = params.slug as string

    const product = demoProductDetails[slug]
    const imageSrc = productImages[slug] || '/images/products/print-products.png'

    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
        if (!product) return {}
        const defaults: Record<string, string> = {}
        product.options.forEach(opt => {
            defaults[opt.group] = opt.values[0]
        })
        return defaults
    })

    const [quantity, setQuantity] = useState(1)
    const [uploadedFile, setUploadedFile] = useState<string | null>(null)
    const [addedToCart, setAddedToCart] = useState(false)

    if (!product) {
        return (
            <div className="product-detail">
                <div className="products-empty">
                    <span className="products-empty-icon">🔍</span>
                    <h3>Product not found</h3>
                    <p>The product you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                    <Link href="/products" style={{
                        display: 'inline-block',
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        color: '#fff',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        fontWeight: 600
                    }}>
                        Browse Products
                    </Link>
                </div>
            </div>
        )
    }

    // Calculate dynamic price based on quantity option
    const qtyOption = selectedOptions['Quantity'] || '250'
    const multiplier = pricingTable[qtyOption]?.base || 1.0
    const unitPrice = product.basePrice * multiplier
    const totalPrice = unitPrice * quantity
    const qtyNum = parseInt(qtyOption) || 1

    const handleOptionChange = (group: string, value: string) => {
        setSelectedOptions(prev => ({ ...prev, [group]: value }))
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setUploadedFile(file.name)
        }
    }

    const handleAddToCart = () => {
        const cart = JSON.parse(localStorage.getItem('printpro_cart') || '[]')
        cart.push({
            productId: product.id,
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            image: imageSrc,
            options: selectedOptions,
            quantity: quantity,
            unitPrice: unitPrice,
            totalPrice: totalPrice,
            artwork: uploadedFile,
            addedAt: new Date().toISOString(),
        })
        localStorage.setItem('printpro_cart', JSON.stringify(cart))
        window.dispatchEvent(new Event('cart-updated'))
        setAddedToCart(true)
        setTimeout(() => setAddedToCart(false), 3000)
    }

    return (
        <div className="product-detail">
            {/* Breadcrumb */}
            <nav className="product-detail-breadcrumb">
                <Link href="/">Home</Link>
                <span>/</span>
                <Link href="/products">Products</Link>
                <span>/</span>
                <Link href={`/products?category=${product.categorySlug}`}>{product.categoryName}</Link>
                <span>/</span>
                <span style={{ color: '#0f172a' }}>{product.name}</span>
            </nav>

            <div className="product-detail-grid" style={{ marginTop: '24px' }}>
                {/* Product Image */}
                <div className="product-detail-image" style={{ overflow: 'hidden' }}>
                    <Image
                        src={imageSrc}
                        alt={product.name}
                        width={600}
                        height={600}
                        style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: '16px' }}
                        priority
                    />
                </div>

                {/* Product Info */}
                <div className="product-detail-info">
                    <div>
                        <h1>{product.name}</h1>
                        <p className="product-detail-sku">SKU: {product.sku}</p>
                    </div>

                    <p className="product-detail-desc">{product.description}</p>

                    {/* Product Options */}
                    <div className="product-options">
                        {product.options.map(option => (
                            <div key={option.group} className="product-option-group">
                                <label>{option.group}</label>
                                <select
                                    value={selectedOptions[option.group] || option.values[0]}
                                    onChange={(e) => handleOptionChange(option.group, e.target.value)}
                                >
                                    {option.values.map(val => (
                                        <option key={val} value={val}>{val}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>

                    {/* Quantity */}
                    <div className="quantity-selector">
                        <label>Quantity (sets)</label>
                        <div className="quantity-controls">
                            <button className="quantity-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                            <span className="quantity-value">{quantity}</span>
                            <button className="quantity-btn" onClick={() => setQuantity(quantity + 1)}>+</button>
                        </div>
                    </div>

                    {/* Price Display */}
                    <div className="product-price-display">
                        <div className="product-price-label">Your Price</div>
                        <div className="product-price-value">${totalPrice.toFixed(2)}</div>
                        <div className="product-price-unit">
                            {qtyNum > 1 && `$${(totalPrice / qtyNum).toFixed(4)} per piece · `}
                            {qtyNum} pcs × {quantity} {quantity > 1 ? 'sets' : 'set'}
                        </div>
                    </div>

                    {/* Artwork Upload */}
                    <div className="file-upload-area" onClick={() => document.getElementById('artwork-upload')?.click()}>
                        <input
                            id="artwork-upload"
                            type="file"
                            accept=".pdf,.ai,.psd,.jpg,.jpeg,.png,.svg"
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                        />
                        {uploadedFile ? (
                            <>
                                <div className="file-upload-icon">✅</div>
                                <h4>{uploadedFile}</h4>
                                <p>Click to change file</p>
                            </>
                        ) : (
                            <>
                                <div className="file-upload-icon">📎</div>
                                <h4>Upload Your Artwork</h4>
                                <p>Drag & drop or click to upload. PDF, AI, PSD, JPG, PNG accepted.</p>
                            </>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="product-actions">
                        <button
                            className="btn-add-cart"
                            onClick={handleAddToCart}
                            style={addedToCart ? { background: 'linear-gradient(135deg, #22c55e, #16a34a)' } : {}}
                        >
                            {addedToCart ? '✓ Added to Cart!' : '🛒 Add to Cart'}
                        </button>
                        <button className="btn-wishlist">♡</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
