/**
 * POST /api/upload
 * Handles artwork file uploads to MinIO/S3
 */

import { NextRequest, NextResponse } from 'next/server'
import { uploadFile } from '@/lib/storage'
import { randomUUID } from 'crypto'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'image/tiff',
    'application/postscript', // AI files
    'image/vnd.adobe.photoshop', // PSD
    'application/octet-stream', // fallback for AI/PSD
]

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 100MB.' },
                { status: 400 }
            )
        }

        // Get the file extension
        const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
        const uuid = randomUUID()
        const storagePath = `artwork/${uuid}.${ext}`

        // Convert to buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload to MinIO/S3
        let fileUrl: string
        try {
            fileUrl = await uploadFile(storagePath, buffer, file.type || 'application/octet-stream')
        } catch {
            // MinIO not available — store locally as fallback in dev
            const fs = await import('fs/promises')
            const path = await import('path')
            const dir = path.join(process.cwd(), 'public', 'uploads', 'artwork')
            await fs.mkdir(dir, { recursive: true })
            const localPath = path.join(dir, `${uuid}.${ext}`)
            await fs.writeFile(localPath, buffer)
            fileUrl = `/uploads/artwork/${uuid}.${ext}`
        }

        return NextResponse.json({
            success: true,
            url: fileUrl,
            filename: file.name,
            size: file.size,
            type: file.type,
        })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}
