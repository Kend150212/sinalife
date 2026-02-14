/**
 * MinIO/S3 Storage Client
 * Handles file uploads (customer artwork PDFs, images)
 */

import * as Minio from 'minio'

const globalForMinio = globalThis as unknown as {
    minioClient: Minio.Client | undefined
}

function createMinioClient(): Minio.Client {
    return new Minio.Client({
        endPoint: process.env.MINIO_ENDPOINT || 'localhost',
        port: parseInt(process.env.MINIO_PORT || '9000'),
        useSSL: process.env.MINIO_USE_SSL === 'true',
        accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
    })
}

export const storage = globalForMinio.minioClient ?? createMinioClient()

if (process.env.NODE_ENV !== 'production') globalForMinio.minioClient = storage

const BUCKET = process.env.MINIO_BUCKET || 'uploads'

/**
 * Ensure the upload bucket exists
 */
export async function ensureBucket(): Promise<void> {
    const exists = await storage.bucketExists(BUCKET)
    if (!exists) {
        await storage.makeBucket(BUCKET)
        // Set bucket policy to allow public read for product images
        const policy = {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Principal: { AWS: ['*'] },
                    Action: ['s3:GetObject'],
                    Resource: [`arn:aws:s3:::${BUCKET}/public/*`],
                },
            ],
        }
        await storage.setBucketPolicy(BUCKET, JSON.stringify(policy))
    }
}

/**
 * Upload a file
 */
export async function uploadFile(
    path: string,
    buffer: Buffer,
    contentType: string
): Promise<string> {
    await ensureBucket()
    await storage.putObject(BUCKET, path, buffer, buffer.length, {
        'Content-Type': contentType,
    })

    const endpoint = process.env.MINIO_ENDPOINT || 'localhost'
    const port = process.env.MINIO_PORT || '9000'
    const ssl = process.env.MINIO_USE_SSL === 'true'
    const protocol = ssl ? 'https' : 'http'

    return `${protocol}://${endpoint}:${port}/${BUCKET}/${path}`
}

/**
 * Generate a presigned upload URL (for direct client uploads)
 */
export async function getPresignedUploadUrl(
    path: string,
    expirySeconds: number = 3600
): Promise<string> {
    await ensureBucket()
    return storage.presignedPutObject(BUCKET, path, expirySeconds)
}

/**
 * Generate a presigned download URL
 */
export async function getPresignedDownloadUrl(
    path: string,
    expirySeconds: number = 3600
): Promise<string> {
    return storage.presignedGetObject(BUCKET, path, expirySeconds)
}

/**
 * Delete a file
 */
export async function deleteFile(path: string): Promise<void> {
    await storage.removeObject(BUCKET, path)
}

export default storage
