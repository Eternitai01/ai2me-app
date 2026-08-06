/**
 * Simple in-memory cache for API responses
 * For production, consider using React Query or SWR
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class ApiCache {
  private cache: Map<string, CacheEntry<unknown>>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    // Default TTL: 5 minutes
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get cached data if still valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const timestamp = Date.now();
    const expiresAt = timestamp + (ttl || this.defaultTTL);

    this.cache.set(key, {
      data,
      timestamp,
      expiresAt,
    });
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all entries matching pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get or set with factory function
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check if cached
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const data = await factory();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Clean expired entries
   */
  cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  stats(): {
    size: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: entry.expiresAt - now,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }
}

// Global cache instance
export const apiCache = new ApiCache();

// Setup periodic cleanup (every 5 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Cache key builder utilities
 */
export const CacheKeys = {
  connectors: {
    list: (orgId: string) => `connectors:list:${orgId}`,
    detail: (id: string) => `connectors:detail:${id}`,
    schema: (id: string) => `connectors:schema:${id}`,
  },

  templates: {
    list: (industry?: string) => `templates:list:${industry || 'all'}`,
    detail: (id: string) => `templates:detail:${id}`,
  },

  mappings: {
    list: (connectorId: string) => `mappings:list:${connectorId}`,
    detail: (id: string) => `mappings:detail:${id}`,
  },

  relationships: {
    list: (connectorId: string) => `relationships:list:${connectorId}`,
    detail: (id: string) => `relationships:detail:${id}`,
  },

  glueJobs: {
    list: (connectorId: string) => `glue:list:${connectorId}`,
    detail: (id: string) => `glue:detail:${id}`,
    status: (id: string) => `glue:status:${id}`,
  },
};

/**
 * TTL presets (in milliseconds)
 */
export const CacheTTL = {
  short: 1 * 60 * 1000, // 1 minute
  medium: 5 * 60 * 1000, // 5 minutes
  long: 15 * 60 * 1000, // 15 minutes
  veryLong: 60 * 60 * 1000, // 1 hour
};
