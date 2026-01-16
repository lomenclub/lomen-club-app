/**
 * Simple in-memory cache service to replace Redis for rate-limit mitigation
 * Uses Map with TTL support for basic caching needs
 */

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class SimpleCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL: number;

  constructor(defaultTTL: number = 300) { // 300 seconds = 5 minutes default
    this.defaultTTL = defaultTTL;
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    try {
      const ttl = options?.ttl || this.defaultTTL;
      const expiresAt = Date.now() + (ttl * 1000); // Convert seconds to milliseconds
      
      this.cache.set(key, {
        value,
        expiresAt
      });
      
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      return this.cache.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Clear all cache entries matching pattern
   */
  async clearPattern(pattern: string): Promise<number> {
    try {
      const regex = new RegExp(pattern.replace('*', '.*'));
      let deletedCount = 0;
      
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
          deletedCount++;
        }
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Cache clear pattern error:', error);
      return 0;
    }
  }

  /**
   * Health check - always returns OK for in-memory cache
   */
  async healthCheck(): Promise<{ status: string; message: string }> {
    return {
      status: 'OK',
      message: 'In-memory cache is healthy'
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let deletedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance with 5 minute default TTL
export const simpleCacheService = new SimpleCacheService(300); // 300 seconds = 5 minutes
