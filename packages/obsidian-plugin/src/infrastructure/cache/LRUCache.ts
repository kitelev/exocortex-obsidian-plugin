/**
 * Configuration options for LRUCache
 */
export interface LRUCacheOptions {
  /**
   * Maximum number of entries before eviction (default: 1000)
   */
  maxEntries?: number;

  /**
   * Time-to-live in milliseconds. Entries expire after this duration.
   * Set to 0 or undefined to disable TTL (default: 0 = disabled)
   */
  ttl?: number;
}

/**
 * Internal cache entry with TTL tracking
 */
interface CacheEntry<V> {
  value: V;
  expiresAt: number | null; // null means no expiration
}

/**
 * LRUCache - A Map-based Least Recently Used cache with size limits and optional TTL
 *
 * Provides automatic eviction when max entries exceeded or entries expire.
 * Entries are evicted in insertion order (oldest first).
 *
 * Features:
 * - Bounded memory usage via maxEntries limit
 * - Optional TTL-based expiration for stale entry cleanup
 * - Automatic eviction of oldest entries
 * - O(1) get/set operations (Map-based)
 * - Statistics for monitoring (hits, misses, evictions, ttlExpirations)
 * - Explicit cleanup method for lifecycle management
 *
 * Usage:
 * ```typescript
 * // Basic usage (no TTL)
 * const cache = new LRUCache<string, UserData>(100); // Max 100 entries
 *
 * // With TTL (5 minute expiration)
 * const cacheWithTTL = new LRUCache<string, UserData>({ maxEntries: 100, ttl: 5 * 60 * 1000 });
 *
 * cache.set("user:123", userData);
 * const data = cache.get("user:123");
 * cache.cleanup(); // Clear all entries
 * ```
 */
export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private readonly maxEntries: number;
  private readonly ttl: number;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    ttlExpirations: 0,
  };

  /**
   * Creates a new LRU cache with the specified options.
   *
   * @param options - Number for maxEntries only, or LRUCacheOptions object
   */
  constructor(options: number | LRUCacheOptions = 1000) {
    const opts = typeof options === "number" ? { maxEntries: options } : options;
    const maxEntries = opts.maxEntries ?? 1000;
    const ttl = opts.ttl ?? 0;

    if (maxEntries < 1) {
      throw new Error("maxEntries must be at least 1");
    }
    if (ttl < 0) {
      throw new Error("ttl must be non-negative");
    }

    this.maxEntries = maxEntries;
    this.ttl = ttl;
    this.cache = new Map();
  }

  /**
   * Gets a value from the cache and marks it as recently used.
   * Returns undefined if the entry has expired (TTL exceeded).
   *
   * @param key - The key to look up
   * @returns The value if found and not expired, undefined otherwise
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (entry !== undefined) {
      // Check TTL expiration
      if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        this.stats.ttlExpirations++;
        this.stats.misses++;
        return undefined;
      }

      this.stats.hits++;
      // Move to end (most recently used) by re-inserting
      // Note: We refresh TTL on access to implement "sliding window" TTL
      this.cache.delete(key);
      if (this.ttl > 0) {
        entry.expiresAt = Date.now() + this.ttl;
      }
      this.cache.set(key, entry);
      return entry.value;
    }

    this.stats.misses++;
    return undefined;
  }

  /**
   * Sets a value in the cache, evicting oldest entries if needed.
   *
   * @param key - The key to store
   * @param value - The value to store
   */
  set(key: K, value: V): void {
    // If key exists, delete it first to update its position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
        this.stats.evictions++;
      }
    }

    const entry: CacheEntry<V> = {
      value,
      expiresAt: this.ttl > 0 ? Date.now() + this.ttl : null,
    };
    this.cache.set(key, entry);
  }

  /**
   * Checks if a key exists in the cache and is not expired (does not affect LRU ordering).
   *
   * @param key - The key to check
   * @returns true if the key exists and is not expired
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (entry === undefined) {
      return false;
    }
    // Check TTL expiration - do not delete here (has is non-destructive)
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      return false;
    }
    return true;
  }

  /**
   * Deletes an entry from the cache.
   *
   * @param key - The key to delete
   * @returns true if the key was deleted
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Returns the current number of entries in the cache.
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Returns the maximum number of entries allowed.
   */
  get capacity(): number {
    return this.maxEntries;
  }

  /**
   * Returns cache statistics for monitoring.
   */
  getStats(): { hits: number; misses: number; evictions: number; ttlExpirations: number; size: number; capacity: number; ttl: number } {
    return {
      ...this.stats,
      size: this.cache.size,
      capacity: this.maxEntries,
      ttl: this.ttl,
    };
  }

  /**
   * Resets the statistics counters.
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0, evictions: 0, ttlExpirations: 0 };
  }

  /**
   * Clears all entries from the cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clears all entries and resets statistics.
   * Should be called in onunload() or cleanup() methods.
   */
  cleanup(): void {
    this.cache.clear();
    this.resetStats();
  }

  /**
   * Returns all keys in the cache (in LRU order, oldest first).
   * Note: May include expired entries that haven't been cleaned up yet.
   */
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  /**
   * Returns all non-expired values in the cache (in LRU order, oldest first).
   */
  *values(): IterableIterator<V> {
    const now = Date.now();
    for (const entry of this.cache.values()) {
      if (entry.expiresAt === null || entry.expiresAt > now) {
        yield entry.value;
      }
    }
  }

  /**
   * Returns all non-expired entries in the cache (in LRU order, oldest first).
   */
  *entries(): IterableIterator<[K, V]> {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt === null || entry.expiresAt > now) {
        yield [key, entry.value];
      }
    }
  }

  /**
   * Iterates over all non-expired entries in the cache.
   */
  forEach(callback: (value: V, key: K) => void): void {
    const now = Date.now();
    this.cache.forEach((entry, key) => {
      if (entry.expiresAt === null || entry.expiresAt > now) {
        callback(entry.value, key);
      }
    });
  }

  /**
   * Removes all expired entries from the cache.
   * Call periodically for large caches to reclaim memory proactively.
   * @returns Number of entries removed
   */
  pruneExpired(): number {
    if (this.ttl === 0) {
      return 0; // No TTL configured, nothing to prune
    }

    const now = Date.now();
    let pruned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt !== null && entry.expiresAt <= now) {
        this.cache.delete(key);
        this.stats.ttlExpirations++;
        pruned++;
      }
    }

    return pruned;
  }
}
