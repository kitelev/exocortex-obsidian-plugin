/**
 * Cache entry wrapper with timestamp for TTL support
 */
interface CacheEntry<V> {
  value: V;
  timestamp: number;
}

/**
 * Options for LRUCache configuration
 */
export interface LRUCacheOptions {
  /** Maximum number of entries before eviction (default: 1000) */
  maxEntries?: number;
  /** Time-to-live in milliseconds. Entries older than TTL are considered stale (default: undefined = no TTL) */
  ttl?: number;
}

/**
 * LRUCache - A Map-based Least Recently Used cache with size limits and optional TTL
 *
 * Provides automatic eviction when max entries exceeded or TTL expires.
 * Entries are evicted in insertion order (oldest first).
 *
 * Features:
 * - Bounded memory usage via maxEntries limit
 * - Optional TTL-based expiration
 * - Automatic eviction of oldest entries
 * - O(1) get/set operations (Map-based)
 * - Statistics for monitoring (hits, misses, evictions, ttlExpiries)
 * - Explicit cleanup method for lifecycle management
 *
 * Usage:
 * ```typescript
 * // Basic LRU cache
 * const cache = new LRUCache<string, UserData>(100); // Max 100 entries
 *
 * // LRU cache with TTL
 * const cacheWithTTL = new LRUCache<string, UserData>({
 *   maxEntries: 500,
 *   ttl: 1000 * 60 * 5, // 5 minute TTL
 * });
 *
 * cache.set("user:123", userData);
 * const data = cache.get("user:123");
 * cache.cleanup(); // Clear all entries
 * ```
 */
export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private readonly maxEntries: number;
  private readonly ttl?: number;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    ttlExpiries: 0,
  };

  /**
   * Creates a new LRU cache with the specified options.
   *
   * @param options - Configuration options or max entries number for backward compatibility
   */
  constructor(options: number | LRUCacheOptions = 1000) {
    if (typeof options === "number") {
      // Backward compatibility: treat number as maxEntries
      if (options < 1) {
        throw new Error("maxEntries must be at least 1");
      }
      this.maxEntries = options;
      this.ttl = undefined;
    } else {
      const maxEntries = options.maxEntries ?? 1000;
      if (maxEntries < 1) {
        throw new Error("maxEntries must be at least 1");
      }
      this.maxEntries = maxEntries;
      this.ttl = options.ttl;
    }
    this.cache = new Map();
  }

  /**
   * Checks if an entry has expired based on TTL.
   *
   * @param entry - The cache entry to check
   * @returns true if the entry is expired, false otherwise
   */
  private isExpired(entry: CacheEntry<V>): boolean {
    if (!this.ttl) return false;
    return Date.now() - entry.timestamp > this.ttl;
  }

  /**
   * Gets a value from the cache and marks it as recently used.
   * Returns undefined if the entry doesn't exist or has expired (TTL).
   *
   * @param key - The key to look up
   * @returns The value if found and not expired, undefined otherwise
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (entry !== undefined) {
      // Check TTL expiration
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        this.stats.ttlExpiries++;
        this.stats.misses++;
        return undefined;
      }

      this.stats.hits++;
      // Move to end (most recently used) by re-inserting with updated timestamp
      this.cache.delete(key);
      this.cache.set(key, { value: entry.value, timestamp: Date.now() });
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

    this.cache.set(key, { value, timestamp: Date.now() });
  }

  /**
   * Checks if a key exists in the cache and is not expired (does not affect LRU ordering).
   *
   * @param key - The key to check
   * @returns true if the key exists and is not expired
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check TTL expiration without removing or updating stats
    // The entry will be cleaned up on next get() call
    if (this.isExpired(entry)) {
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
  getStats(): { hits: number; misses: number; evictions: number; ttlExpiries: number; size: number; capacity: number; ttl?: number } {
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
    this.stats = { hits: 0, misses: 0, evictions: 0, ttlExpiries: 0 };
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
   * Note: Does not filter expired entries - use get() for TTL-safe access.
   */
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  /**
   * Returns all values in the cache (in LRU order, oldest first).
   * Note: Does not filter expired entries - use get() for TTL-safe access.
   */
  values(): IterableIterator<V> {
    const cacheValues = Array.from(this.cache.values());
    let index = 0;
    return {
      next: () => {
        if (index < cacheValues.length) {
          return { value: cacheValues[index++].value, done: false };
        }
        return { value: undefined as unknown as V, done: true };
      },
      [Symbol.iterator]() {
        return this;
      },
    };
  }

  /**
   * Returns all entries in the cache (in LRU order, oldest first).
   * Note: Does not filter expired entries - use get() for TTL-safe access.
   */
  entries(): IterableIterator<[K, V]> {
    const cacheEntries = Array.from(this.cache.entries());
    let index = 0;
    return {
      next: () => {
        if (index < cacheEntries.length) {
          const [key, entry] = cacheEntries[index++];
          return { value: [key, entry.value] as [K, V], done: false };
        }
        return { value: undefined as unknown as [K, V], done: true };
      },
      [Symbol.iterator]() {
        return this;
      },
    };
  }

  /**
   * Iterates over all entries in the cache.
   * Note: Does not filter expired entries - use get() for TTL-safe access.
   */
  forEach(callback: (value: V, key: K) => void): void {
    this.cache.forEach((entry, key) => {
      callback(entry.value, key);
    });
  }

  /**
   * Removes all expired entries from the cache.
   * Useful for periodic cleanup in long-running applications.
   * @returns Number of entries removed
   */
  pruneExpired(): number {
    if (!this.ttl) return 0;

    let removed = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        this.stats.ttlExpiries++;
        removed++;
      }
    }

    return removed;
  }
}
