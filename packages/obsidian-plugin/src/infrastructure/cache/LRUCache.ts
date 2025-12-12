/**
 * LRUCache - A Map-based Least Recently Used cache with size limits
 *
 * Provides automatic eviction when max entries exceeded.
 * Entries are evicted in insertion order (oldest first).
 *
 * Features:
 * - Bounded memory usage via maxEntries limit
 * - Automatic eviction of oldest entries
 * - O(1) get/set operations (Map-based)
 * - Statistics for monitoring (hits, misses, evictions)
 * - Explicit cleanup method for lifecycle management
 *
 * Usage:
 * ```typescript
 * const cache = new LRUCache<string, UserData>(100); // Max 100 entries
 * cache.set("user:123", userData);
 * const data = cache.get("user:123");
 * cache.cleanup(); // Clear all entries
 * ```
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private readonly maxEntries: number;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  /**
   * Creates a new LRU cache with the specified maximum number of entries.
   *
   * @param maxEntries - Maximum number of entries before eviction (default: 1000)
   */
  constructor(maxEntries: number = 1000) {
    if (maxEntries < 1) {
      throw new Error("maxEntries must be at least 1");
    }
    this.maxEntries = maxEntries;
    this.cache = new Map();
  }

  /**
   * Gets a value from the cache and marks it as recently used.
   *
   * @param key - The key to look up
   * @returns The value if found, undefined otherwise
   */
  get(key: K): V | undefined {
    const value = this.cache.get(key);

    if (value !== undefined) {
      this.stats.hits++;
      // Move to end (most recently used) by re-inserting
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
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

    this.cache.set(key, value);
  }

  /**
   * Checks if a key exists in the cache (does not affect LRU ordering).
   *
   * @param key - The key to check
   * @returns true if the key exists
   */
  has(key: K): boolean {
    return this.cache.has(key);
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
  getStats(): { hits: number; misses: number; evictions: number; size: number; capacity: number } {
    return {
      ...this.stats,
      size: this.cache.size,
      capacity: this.maxEntries,
    };
  }

  /**
   * Resets the statistics counters.
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0, evictions: 0 };
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
   */
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  /**
   * Returns all values in the cache (in LRU order, oldest first).
   */
  values(): IterableIterator<V> {
    return this.cache.values();
  }

  /**
   * Returns all entries in the cache (in LRU order, oldest first).
   */
  entries(): IterableIterator<[K, V]> {
    return this.cache.entries();
  }

  /**
   * Iterates over all entries in the cache.
   */
  forEach(callback: (value: V, key: K, map: Map<K, V>) => void): void {
    this.cache.forEach(callback);
  }
}
