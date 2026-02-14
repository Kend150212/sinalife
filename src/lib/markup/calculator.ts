/**
 * Markup Calculator
 * Resolves the correct markup for a product based on priority:
 * Product Override > Category > Global Default
 */

import prisma from '@/lib/db'
import { cached } from '@/lib/redis'

const DEFAULT_MARKUP = 35 // 35% default markup

interface MarkupResult {
    markupPercent: number
    source: 'product' | 'category' | 'global'
    originalPrice: number
    markedUpPrice: number
}

/**
 * Get the effective markup for a product
 * Priority: Product.markupPercent > Category.markupPercent > MarkupRule (product) > MarkupRule (category) > Global Default
 */
export async function getEffectiveMarkup(
    productId: number,
    categoryId: string | null
): Promise<{ markupPercent: number; source: string }> {
    return cached(`markup:${productId}:${categoryId}`, 300, async () => {
        // 1. Check product-level markup
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { markupPercent: true, sku: true },
        })

        if (product?.markupPercent !== null && product?.markupPercent !== undefined) {
            return { markupPercent: product.markupPercent, source: 'product' }
        }

        // 2. Check product-level markup rule
        if (product?.sku) {
            const productRule = await prisma.markupRule.findFirst({
                where: { productSku: product.sku, enabled: true },
            })
            if (productRule) {
                return { markupPercent: productRule.markupPercent, source: 'product-rule' }
            }
        }

        // 3. Check category-level markup
        if (categoryId) {
            const category = await prisma.category.findUnique({
                where: { id: categoryId },
                select: { markupPercent: true, slug: true, parentId: true },
            })

            if (category?.markupPercent !== null && category?.markupPercent !== undefined) {
                return { markupPercent: category.markupPercent, source: 'category' }
            }

            // 3b. Check category-level markup rule
            if (category?.slug) {
                const categoryRule = await prisma.markupRule.findFirst({
                    where: { categorySlug: category.slug, productSku: null, enabled: true },
                })
                if (categoryRule) {
                    return { markupPercent: categoryRule.markupPercent, source: 'category-rule' }
                }
            }

            // 3c. Check parent category
            if (category?.parentId) {
                const parentCategory = await prisma.category.findUnique({
                    where: { id: category.parentId },
                    select: { markupPercent: true },
                })
                if (parentCategory?.markupPercent !== null && parentCategory?.markupPercent !== undefined) {
                    return { markupPercent: parentCategory.markupPercent, source: 'parent-category' }
                }
            }
        }

        // 4. Check global markup rule
        const globalRule = await prisma.markupRule.findFirst({
            where: { categorySlug: null, productSku: null, enabled: true },
        })
        if (globalRule) {
            return { markupPercent: globalRule.markupPercent, source: 'global-rule' }
        }

        // 5. Fallback to default
        return { markupPercent: DEFAULT_MARKUP, source: 'global' }
    })
}

/**
 * Apply markup to a wholesale price
 */
export function applyMarkup(wholesalePrice: number, markupPercent: number): number {
    return Math.round(wholesalePrice * (1 + markupPercent / 100) * 100) / 100
}

/**
 * Calculate the full markup result for a product
 */
export async function calculateMarkup(
    productId: number,
    categoryId: string | null,
    wholesalePrice: number
): Promise<MarkupResult> {
    const { markupPercent, source } = await getEffectiveMarkup(productId, categoryId)

    return {
        markupPercent,
        source: source as MarkupResult['source'],
        originalPrice: wholesalePrice,
        markedUpPrice: applyMarkup(wholesalePrice, markupPercent),
    }
}

/**
 * Get global default markup
 */
export async function getGlobalMarkup(): Promise<number> {
    const globalRule = await prisma.markupRule.findFirst({
        where: { categorySlug: null, productSku: null, enabled: true },
    })
    return globalRule?.markupPercent ?? DEFAULT_MARKUP
}
