/**
 * Admin Categories API
 * GET    — List all categories with product counts
 * POST   — Create a new category
 * PUT    — Update a category
 * DELETE — Delete a category
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import prisma from '@/lib/db'

export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: { select: { products: true, children: true } },
                parent: { select: { id: true, name: true } },
                children: {
                    include: {
                        _count: { select: { products: true, children: true } },
                    },
                    orderBy: { sortOrder: 'asc' },
                },
            },
            where: { parentId: null }, // top-level only
            orderBy: { sortOrder: 'asc' },
        })

        // Also get total counts
        const totalCategories = await prisma.category.count()
        const totalProducts = await prisma.product.count()

        return NextResponse.json({ categories, totalCategories, totalProducts })
    } catch (err) {
        console.error('Failed to load categories:', err)
        return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const { name, parentId, description, imageUrl } = await request.json()

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        // Generate slug
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')

        // Check slug uniqueness
        const existing = await prisma.category.findUnique({ where: { slug } })
        if (existing) {
            return NextResponse.json({ error: 'A category with this name already exists' }, { status: 400 })
        }

        // Get max sort order
        const maxSort = await prisma.category.aggregate({
            _max: { sortOrder: true },
            where: { parentId: parentId || null },
        })

        const category = await prisma.category.create({
            data: {
                name,
                slug,
                parentId: parentId || null,
                description: description || null,
                imageUrl: imageUrl || null,
                sortOrder: (maxSort._max.sortOrder || 0) + 1,
            },
        })

        return NextResponse.json(category, { status: 201 })
    } catch (err) {
        console.error('Failed to create category:', err)
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const { id, name, description, imageUrl, enabled, sortOrder, parentId, markupPercent } = await request.json()

        if (!id) {
            return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
        }

        const updateData: Record<string, unknown> = {}
        if (name !== undefined) {
            updateData.name = name
            updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        }
        if (description !== undefined) updateData.description = description
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl
        if (enabled !== undefined) updateData.enabled = enabled
        if (sortOrder !== undefined) updateData.sortOrder = sortOrder
        if (parentId !== undefined) updateData.parentId = parentId || null
        if (markupPercent !== undefined) updateData.markupPercent = markupPercent

        const category = await prisma.category.update({
            where: { id },
            data: updateData,
        })

        return NextResponse.json(category)
    } catch (err) {
        console.error('Failed to update category:', err)
        return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const { id } = await request.json()

        if (!id) {
            return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
        }

        // Check for products
        const productCount = await prisma.product.count({ where: { categoryId: id } })
        if (productCount > 0) {
            return NextResponse.json(
                { error: `Cannot delete: ${productCount} products are in this category. Move them first.` },
                { status: 400 }
            )
        }

        // Check for children
        const childCount = await prisma.category.count({ where: { parentId: id } })
        if (childCount > 0) {
            return NextResponse.json(
                { error: `Cannot delete: ${childCount} subcategories exist. Delete them first.` },
                { status: 400 }
            )
        }

        await prisma.category.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Failed to delete category:', err)
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }
}
