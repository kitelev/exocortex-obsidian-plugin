/**
 * SPARQL Query Cache Service
 * Provides in-memory caching for SPARQL query results with TTL and cache invalidation
 */

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  expiresAt: number;
  queryHash: string;
}

export interface CacheStatistics {
  hits: number;
  misses: number;
  evictions: number;
  totalQueries: number;
  hitRate: number;
  size: number;
  maxSize: number;
}

export interface QueryCacheConfig {
  maxSize: number; // Maximum number of cached entries
  defaultTTL: number; // Default TTL in milliseconds
  maxTTL: number; // Maximum TTL in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  enabled: boolean; // Whether caching is enabled
}

export const DEFAULT_CACHE_CONFIG: QueryCacheConfig = {
  maxSize: 1000,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxTTL: 30 * 60 * 1000, // 30 minutes
  cleanupInterval: 60 * 1000, // 1 minute
  enabled: true,
};

export class QueryCache {
  private cache: Map<string, CacheEntry<any>>;
  private stats: CacheStatistics;
  private config: QueryCacheConfig;
  private cleanupTimer?: ReturnType<typeof setTimeout>;

  constructor(config: Partial<QueryCacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalQueries: 0,
      hitRate: 0,
      size: 0,
      maxSize: this.config.maxSize,
    };

    this.startCleanupTimer();
  }

  /**
   * Get cached result for a query
   */
  get<T>(queryKey: string): T | null {
    if (!this.config.enabled) {
      this.stats.misses++;
      this.stats.totalQueries++;
      this.updateHitRate();
      return null;
    }

    const entry = this.cache.get(queryKey);
    this.stats.totalQueries++;

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(queryKey);
      this.stats.misses++;
      this.stats.evictions++;
      this.updateStats();
      this.updateHitRate();
      return null;
    }

    this.stats.hits++;
    this.updateHitRate();
    return entry.value;
  }

  /**
   * Set cached result for a query
   */
  set<T>(queryKey: string, value: T, ttl?: number): void {
    if (!this.config.enabled) {
      return;
    }

    const requestedTTL = ttl !== undefined ? ttl : this.config.defaultTTL;
    const effectiveTTL = Math.min(
      Math.max(requestedTTL, 0),
      this.config.maxTTL,
    );

    const now = Date.now();

    // Don't cache if TTL is zero or negative
    if (effectiveTTL <= 0) {
      return;
    }

    // Evict oldest entries if cache is full
    while (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: now,
      expiresAt: now + effectiveTTL,
      queryHash: this.hashQuery(queryKey),
    };

    this.cache.set(queryKey, entry);
    this.updateStats();
  }

  /**
   * Normalize and create cache key from SPARQL query
   */
  createCacheKey(query: string): string {
    // First split on the colon to handle prefix separately if it exists
    const colonIndex = query.indexOf(":");
    let prefix = "";
    let queryPart = query;

    if (colonIndex > 0 && colonIndex < 20) {
      // Assume prefix is short
      prefix = query.substring(0, colonIndex).toLowerCase() + ":";
      queryPart = query.substring(colonIndex + 1);
    }

    // Normalize the query by removing extra whitespace and converting to lowercase
    const normalized = queryPart
      .trim() // Remove leading/trailing whitespace first
      .replace(/[\r\n\t]+/g, " ") // Replace newlines and tabs with spaces
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\s*\{\s*/g, " { ") // Normalize spacing around curly braces
      .replace(/\s*\}\s*/g, " } ")
      .replace(/\s*\(\s*/g, " ( ") // Normalize spacing around parentheses
      .replace(/\s*\)\s*/g, " ) ")
      .replace(/\s+/g, " ") // Clean up spaces again
      .trim() // Trim again after replacements
      .toLowerCase(); // Convert to lowercase for case-insensitive matching

    const fullKey = prefix + normalized;

    // Use the normalized string directly as the key for better consistency
    // Only hash very long queries
    if (fullKey.length > 1000) {
      return this.hashQuery(fullKey);
    }
    return fullKey;
  }

  /**
   * Invalidate all cached entries
   */
  invalidateAll(): void {
    const sizeBefore = this.cache.size;
    this.cache.clear();
    this.stats.evictions += sizeBefore;
    this.updateStats();
  }

  /**
   * Invalidate entries based on a predicate function
   */
  invalidateWhere(
    predicate: (key: string, entry: CacheEntry<any>) => boolean,
  ): number {
    let invalidated = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (predicate(key, entry)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    this.stats.evictions += invalidated;
    this.updateStats();
    return invalidated;
  }

  /**
   * Get current cache statistics
   */
  getStatistics(): CacheStatistics {
    return { ...this.stats };
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<QueryCacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.stats.maxSize = this.config.maxSize;

    // If cache is disabled, clear it
    if (!this.config.enabled) {
      this.invalidateAll();
    }

    // If max size reduced, evict entries
    while (this.cache.size > this.config.maxSize) {
      this.evictOldest();
    }
    this.updateStats();

    // Restart cleanup timer if interval changed
    if (newConfig.cleanupInterval !== undefined) {
      this.stopCleanupTimer();
      this.startCleanupTimer();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): QueryCacheConfig {
    return { ...this.config };
  }

  /**
   * Manually trigger cleanup of expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.stats.evictions += cleaned;
      this.updateStats();
    }

    return cleaned;
  }

  /**
   * Check if a query result is cached
   */
  has(queryKey: string): boolean {
    if (!this.config.enabled) {
      return false;
    }

    const entry = this.cache.get(queryKey);
    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(queryKey);
      this.stats.evictions++;
      this.updateStats();
      return false;
    }

    return true;
  }

  /**
   * Destroy the cache and cleanup resources
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.cache.clear();
  }

  // Private methods

  private hashQuery(query: string): string {
    // Simple hash function for query strings
    let hash = 0;
    if (query.length === 0) return hash.toString();

    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString();
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      this.updateStats();
    }
  }

  private updateStats(): void {
    this.stats.size = this.cache.size;
  }

  private updateHitRate(): void {
    this.stats.hitRate =
      this.stats.totalQueries > 0
        ? (this.stats.hits / this.stats.totalQueries) * 100
        : 0;
  }

  private startCleanupTimer(): void {
    if (this.config.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, this.config.cleanupInterval);
    }
  }

  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
}
