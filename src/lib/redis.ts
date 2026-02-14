import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
    redis: Redis | undefined
}

export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
})

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

/**
 * Cache helper: get or set with TTL
 */
export async function cached<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>
): Promise<T> {
    try {
        const existing = await redis.get(key)
        if (existing) {
            return JSON.parse(existing) as T
        }
    } catch {
        // Redis unavailable, skip cache
    }

    const data = await fetcher()

    try {
        await redis.setex(key, ttlSeconds, JSON.stringify(data))
    } catch {
        // Redis unavailable, skip cache
    }

    return data
}

export async function invalidateCache(pattern: string): Promise<void> {
    try {
        const keys = await redis.keys(pattern)
        if (keys.length > 0) {
            await redis.del(...keys)
        }
    } catch {
        // Redis unavailable
    }
}

export default redis
