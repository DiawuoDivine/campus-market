/**
 * Redis client placeholder.
 * In production, replace with Bun's native RedisClient or ioredis.
 * For now we provide a no-op in-memory fallback so the server boots
 * without Redis configured.
 */

interface RedisLike {
  get(key: string): Promise<string | null>
  set(key: string, value: string, exSeconds?: number): Promise<void>
  del(key: string): Promise<void>
  exists(key: string): Promise<boolean>
}

class InMemoryCache implements RedisLike {
  private store = new Map<string, { value: string; expiresAt?: number }>()

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  async set(key: string, value: string, exSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: exSeconds ? Date.now() + exSeconds * 1000 : undefined,
    })
  }

  async del(key: string): Promise<void> {
    this.store.delete(key)
  }

  async exists(key: string): Promise<boolean> {
    return (await this.get(key)) !== null
  }
}

export const cache: RedisLike = new InMemoryCache()
