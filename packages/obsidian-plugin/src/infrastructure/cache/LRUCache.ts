/**
 * Cache entry with value and timestamp for TTL support
 */
interface CacheEntry<V> {
  value: V;
  timestamp: number;
}

/**
 * Configuration options for LRUCache
 */
export interface LRUCacheOptions {
  /** Maximum number of entries before eviction (default: 1000) */
  maxEntries?: number;
  /** Time-to-live in milliseconds (default: undefined = no expiration) */
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
 * - Statistics for monitoring (hits, misses, evictions, expirations)
 * - Explicit cleanup method for lifecycle management
 *
 * Usage:
 * ```typescript
 * // Basic usage with max entries only
 * const cache = new LRUCache<string, UserData>(100);
 *
 * // With TTL (5 minutes)
 * const cacheWithTTL = new LRUCache<string, UserData>({ maxEntries: 100, ttl: 300000 });
 *
 * cache.set("user:123", userData);
 * const data = cache.get("user:123");
 * cache.cleanup(); // Clear all entries
 * ```
 */
export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private readonly maxEntries: number;
  private readonly ttl: number | undefined;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    expirations: 0,
  };

  /**
   * Creates a new LRU cache with the specified options.
   *
   * @param options - Either a number for maxEntries (backward compatible) or LRUCacheOptions object
   */
  constructor(options: number | LRUCacheOptions = 1000) {
    // Support both number (backward compatible) and options object
    if (typeof options === "number") {
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
   */
  private isExpired(entry: CacheEntry<V>): boolean {
    if (this.ttl === undefined) {
      return false;
    }
    return Date.now() - entry.timestamp > this.ttl;
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
      // Check if entry has expired
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        this.stats.expirations++;
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
    if (entry === undefined) {
      return false;
    }
    // Check if expired and clean up if so
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.expirations++;
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
  getStats(): { hits: number; misses: number; evictions: number; expirations: number; size: number; capacity: number; ttl: number | undefined } {
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
    this.stats = { hits: 0, misses: 0, evictions: 0, expirations: 0 };
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
   * Note: May include expired entries - use evictExpired() first if needed.
   */
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  /**
   * Returns all values in the cache (in LRU order, oldest first).
   * Note: May include expired entries - use evictExpired() first if needed.
   */
  *values(): IterableIterator<V> {
    for (const entry of this.cache.values()) {
      yield entry.value;
    }
  }

  /**
   * Returns all entries in the cache (in LRU order, oldest first).
   * Note: May include expired entries - use evictExpired() first if needed.
   */
  *entries(): IterableIterator<[K, V]> {
    for (const [key, entry] of this.cache.entries()) {
      yield [key, entry.value];
    }
  }

  /**
   * Iterates over all entries in the cache.
   * Note: May include expired entries - use evictExpired() first if needed.
   */
  forEach(callback: (value: V, key: K) => void): void {
    this.cache.forEach((entry, key) => {
      callback(entry.value, key);
    });
  }

  /**
   * Evicts all expired entries from the cache.
   * Useful for periodic cleanup or before iteration.
   *
   * @returns Number of entries evicted
   */
  evictExpired(): number {
    if (this.ttl === undefined) {
      return 0;
    }

    const now = Date.now();
    let evicted = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        this.stats.expirations++;
        evicted++;
      }
    }

    return evicted;
  }

  /**
   * Invalidates (deletes) all entries matching the given predicate.
   * Useful for cache invalidation on file changes.
   *
   * @param predicate - Function that returns true for entries to delete
   * @returns Number of entries invalidated
   */
  invalidateWhere(predicate: (key: K, value: V) => boolean): number {
    let invalidated = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (predicate(key, entry.value)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }
}
