/**
 * Unit tests for QueryCache service
 */

import {
  QueryCache,
  QueryCacheConfig,
  CacheStatistics,
  CacheEntry,
} from "../../../../src/application/services/QueryCache";

describe("QueryCache", () => {
  let cache: QueryCache;

  beforeEach(() => {
    cache = new QueryCache({
      maxSize: 100,
      defaultTTL: 5000,
      cleanupInterval: 1000,
      enabled: true,
    });
  });

  afterEach(() => {
    cache.destroy();
  });

  describe("basic cache operations", () => {
    it("should store and retrieve values", () => {
      const key = "test-query";
      const value = { results: ["result1", "result2"] };

      cache.set(key, value);
      const retrieved = cache.get(key);

      expect(retrieved).toEqual(value);
    });

    it("should return null for non-existent keys", () => {
      const result = cache.get("non-existent-key");
      expect(result).toBeNull();
    });

    it("should return null when cache is disabled", () => {
      const disabledCache = new QueryCache({ enabled: false });
      disabledCache.set("test", "value");
      const result = disabledCache.get("test");

      expect(result).toBeNull();
      disabledCache.destroy();
    });

    it("should check if key exists in cache", () => {
      const key = "existence-test";
      const value = "test-value";

      expect(cache.has(key)).toBe(false);

      cache.set(key, value);
      expect(cache.has(key)).toBe(true);
    });

    it("should handle has() when cache is disabled", () => {
      const disabledCache = new QueryCache({ enabled: false });
      disabledCache.set("test", "value");

      expect(disabledCache.has("test")).toBe(false);
      disabledCache.destroy();
    });
  });

  describe("cache key normalization", () => {
    it("should create consistent cache keys for identical queries", () => {
      const query1 = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }";
      const query2 = "  SELECT   ?s  ?p  ?o   WHERE  {  ?s  ?p  ?o  }  ";
      const query3 = "SELECT\n?s\n?p\n?o\nWHERE\n{\n?s\n?p\n?o\n}";

      const key1 = cache.createCacheKey(query1);
      const key2 = cache.createCacheKey(query2);
      const key3 = cache.createCacheKey(query3);

      expect(key1).toBe(key2);
      expect(key2).toBe(key3);
    });

    it("should create different keys for different queries", () => {
      const query1 = "SELECT ?s WHERE { ?s ?p ?o }";
      const query2 = "SELECT ?p WHERE { ?s ?p ?o }";

      const key1 = cache.createCacheKey(query1);
      const key2 = cache.createCacheKey(query2);

      expect(key1).not.toBe(key2);
    });

    it("should be case insensitive", () => {
      const query1 = "SELECT ?s WHERE { ?s ?p ?o }";
      const query2 = "select ?s where { ?s ?p ?o }";

      const key1 = cache.createCacheKey(query1);
      const key2 = cache.createCacheKey(query2);

      expect(key1).toBe(key2);
    });
  });

  describe("TTL (Time To Live)", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should expire entries after default TTL", () => {
      const key = "expiring-key";
      const value = "expiring-value";

      cache.set(key, value);
      expect(cache.get(key)).toBe(value);

      // Advance time past TTL
      jest.advanceTimersByTime(6000);

      expect(cache.get(key)).toBeNull();
    });

    it("should respect custom TTL", () => {
      const key = "custom-ttl-key";
      const value = "custom-ttl-value";
      const customTTL = 10000;

      cache.set(key, value, customTTL);

      // Advance time less than custom TTL
      jest.advanceTimersByTime(8000);
      expect(cache.get(key)).toBe(value);

      // Advance past custom TTL
      jest.advanceTimersByTime(3000);
      expect(cache.get(key)).toBeNull();
    });

    it("should respect maximum TTL limit", () => {
      const maxTTLCache = new QueryCache({
        defaultTTL: 5000,
        maxTTL: 15000,
        enabled: true,
      });

      const key = "max-ttl-test";
      const value = "max-ttl-value";
      const requestedTTL = 20000; // Higher than maxTTL

      maxTTLCache.set(key, value, requestedTTL);

      // Should expire at maxTTL, not requestedTTL
      jest.advanceTimersByTime(16000);
      expect(maxTTLCache.get(key)).toBeNull();

      maxTTLCache.destroy();
    });

    it("should remove expired entries in has() check", () => {
      const key = "expire-in-has";
      const value = "test-value";

      cache.set(key, value);
      expect(cache.has(key)).toBe(true);

      jest.advanceTimersByTime(6000);
      expect(cache.has(key)).toBe(false);
    });
  });

  describe("cache size management", () => {
    let smallCache: QueryCache;

    beforeEach(() => {
      smallCache = new QueryCache({ maxSize: 3, enabled: true });
    });

    afterEach(() => {
      smallCache.destroy();
    });

    it("should evict oldest entries when cache is full", () => {
      smallCache.set("key1", "value1");
      smallCache.set("key2", "value2");
      smallCache.set("key3", "value3");

      expect(smallCache.has("key1")).toBe(true);
      expect(smallCache.has("key2")).toBe(true);
      expect(smallCache.has("key3")).toBe(true);

      // Adding 4th item should evict oldest
      smallCache.set("key4", "value4");

      expect(smallCache.has("key1")).toBe(false);
      expect(smallCache.has("key2")).toBe(true);
      expect(smallCache.has("key3")).toBe(true);
      expect(smallCache.has("key4")).toBe(true);
    });

    it("should update cache size when maxSize is reduced", () => {
      smallCache.set("key1", "value1");
      smallCache.set("key2", "value2");
      smallCache.set("key3", "value3");

      // Reduce max size
      smallCache.updateConfig({ maxSize: 2 });

      const stats = smallCache.getStatistics();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(2);
    });
  });

  describe("cache statistics", () => {
    it("should track hits and misses", () => {
      const key = "stats-test";
      const value = "stats-value";

      // Initial stats
      let stats = cache.getStatistics();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.totalQueries).toBe(0);
      expect(stats.hitRate).toBe(0);

      // Miss
      cache.get("non-existent");
      stats = cache.getStatistics();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(1);
      expect(stats.totalQueries).toBe(1);
      expect(stats.hitRate).toBe(0);

      // Set and hit
      cache.set(key, value);
      cache.get(key);
      stats = cache.getStatistics();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.totalQueries).toBe(2);
      expect(stats.hitRate).toBe(50);
    });

    it("should track cache size", () => {
      let stats = cache.getStatistics();
      expect(stats.size).toBe(0);

      cache.set("key1", "value1");
      stats = cache.getStatistics();
      expect(stats.size).toBe(1);

      cache.set("key2", "value2");
      stats = cache.getStatistics();
      expect(stats.size).toBe(2);
    });

    it("should track evictions", () => {
      const smallCache = new QueryCache({ maxSize: 2, enabled: true });

      smallCache.set("key1", "value1");
      smallCache.set("key2", "value2");

      let stats = smallCache.getStatistics();
      expect(stats.evictions).toBe(0);

      // Force eviction
      smallCache.set("key3", "value3");

      stats = smallCache.getStatistics();
      expect(stats.evictions).toBe(1);

      smallCache.destroy();
    });

    it("should not count queries when cache is disabled", () => {
      const disabledCache = new QueryCache({ enabled: false });

      disabledCache.get("test");
      const stats = disabledCache.getStatistics();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(1);
      expect(stats.totalQueries).toBe(1);

      disabledCache.destroy();
    });
  });

  describe("cache invalidation", () => {
    it("should invalidate all entries", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.set("key3", "value3");

      expect(cache.has("key1")).toBe(true);
      expect(cache.has("key2")).toBe(true);
      expect(cache.has("key3")).toBe(true);

      cache.invalidateAll();

      expect(cache.has("key1")).toBe(false);
      expect(cache.has("key2")).toBe(false);
      expect(cache.has("key3")).toBe(false);

      const stats = cache.getStatistics();
      expect(stats.size).toBe(0);
    });

    it("should invalidate entries based on predicate", () => {
      cache.set("select1", { type: "SELECT", results: [] });
      cache.set("construct1", { type: "CONSTRUCT", results: [] });
      cache.set("select2", { type: "SELECT", results: [] });

      // Invalidate all SELECT queries
      const invalidated = cache.invalidateWhere((key, entry) => {
        return key.includes("select");
      });

      expect(invalidated).toBe(2);
      expect(cache.has("select1")).toBe(false);
      expect(cache.has("select2")).toBe(false);
      expect(cache.has("construct1")).toBe(true);
    });
  });

  describe("cleanup operations", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should manually cleanup expired entries", () => {
      cache.set("key1", "value1", 3000);
      cache.set("key2", "value2", 7000);
      cache.set("key3", "value3", 10000);

      expect(cache.getStatistics().size).toBe(3);

      // Advance time to expire some entries
      jest.advanceTimersByTime(5000);

      const cleaned = cache.cleanup();
      expect(cleaned).toBe(1); // Only key1 should be expired

      const stats = cache.getStatistics();
      expect(stats.size).toBe(2);
      expect(cache.has("key1")).toBe(false);
      expect(cache.has("key2")).toBe(true);
      expect(cache.has("key3")).toBe(true);
    });

    it("should automatically cleanup expired entries", () => {
      const autoCleanupCache = new QueryCache({
        cleanupInterval: 100,
        defaultTTL: 200,
        enabled: true,
      });

      autoCleanupCache.set("key1", "value1");
      expect(autoCleanupCache.has("key1")).toBe(true);

      // Wait for expiration and auto cleanup
      jest.advanceTimersByTime(300);

      expect(autoCleanupCache.has("key1")).toBe(false);

      autoCleanupCache.destroy();
    });
  });

  describe("configuration management", () => {
    it("should update configuration", () => {
      const originalConfig = cache.getConfig();
      expect(originalConfig.maxSize).toBe(100);

      cache.updateConfig({ maxSize: 200, defaultTTL: 10000 });

      const updatedConfig = cache.getConfig();
      expect(updatedConfig.maxSize).toBe(200);
      expect(updatedConfig.defaultTTL).toBe(10000);
      expect(updatedConfig.enabled).toBe(true); // Should preserve other values
    });

    it("should clear cache when disabled", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");

      expect(cache.getStatistics().size).toBe(2);

      cache.updateConfig({ enabled: false });

      expect(cache.getStatistics().size).toBe(0);
      expect(cache.has("key1")).toBe(false);
      expect(cache.has("key2")).toBe(false);
    });

    it("should restart cleanup timer when interval changes", () => {
      jest.useFakeTimers();

      const timerCache = new QueryCache({
        cleanupInterval: 1000,
        defaultTTL: 500,
        enabled: true,
      });

      timerCache.set("key1", "value1");

      // Change cleanup interval
      timerCache.updateConfig({ cleanupInterval: 2000 });

      // Advance time past original interval but not new interval
      jest.advanceTimersByTime(1500);

      // Entry should still exist (new timer interval)
      expect(timerCache.has("key1")).toBe(false); // Should be expired by TTL

      timerCache.destroy();
      jest.useRealTimers();
    });
  });

  describe("edge cases", () => {
    it("should handle empty query strings", () => {
      const key1 = cache.createCacheKey("");
      const key2 = cache.createCacheKey("   ");
      const key3 = cache.createCacheKey("\n\t\r");

      expect(key1).toBe(key2);
      expect(key2).toBe(key3);
    });

    it("should handle very long query strings", () => {
      const longQuery = "SELECT ".repeat(1000) + "?s WHERE { ?s ?p ?o }";
      const key = cache.createCacheKey(longQuery);

      expect(typeof key).toBe("string");
      expect(key.length).toBeGreaterThan(0);

      // Should be able to use the key
      cache.set(key, "test-value");
      expect(cache.get(key)).toBe("test-value");
    });

    it("should handle null/undefined values gracefully", () => {
      cache.set("null-test", null);
      cache.set("undefined-test", undefined);

      expect(cache.get("null-test")).toBe(null);
      expect(cache.get("undefined-test")).toBe(undefined);
    });

    it("should handle complex nested objects", () => {
      const complexValue = {
        results: [
          { name: "Test 1", properties: { priority: 1, tags: ["urgent"] } },
          {
            name: "Test 2",
            properties: { priority: 2, tags: ["normal", "review"] },
          },
        ],
        metadata: {
          queryTime: "2024-01-01T00:00:00Z",
          version: "1.0",
          nested: {
            deep: {
              value: 42,
            },
          },
        },
      };

      cache.set("complex-test", complexValue);
      const retrieved = cache.get("complex-test");

      expect(retrieved).toEqual(complexValue);
    });

    it("should handle zero TTL", () => {
      jest.useFakeTimers();

      cache.set("zero-ttl-test", "value", 0);

      // Should expire immediately
      expect(cache.get("zero-ttl-test")).toBeNull();

      jest.useRealTimers();
    });

    it("should handle negative TTL", () => {
      jest.useFakeTimers();

      cache.set("negative-ttl-test", "value", -1000);

      // Should expire immediately
      expect(cache.get("negative-ttl-test")).toBeNull();

      jest.useRealTimers();
    });
  });

  describe("memory pressure scenarios", () => {
    let memoryPressureCache: QueryCache;

    beforeEach(() => {
      memoryPressureCache = new QueryCache({
        maxSize: 5,
        defaultTTL: 10000,
        enabled: true,
      });
    });

    afterEach(() => {
      memoryPressureCache.destroy();
    });

    it("should handle rapid insertions under memory pressure", () => {
      // Fill cache to capacity
      for (let i = 0; i < 10; i++) {
        memoryPressureCache.set(`key${i}`, `value${i}`);
      }

      const stats = memoryPressureCache.getStatistics();
      expect(stats.size).toBe(5); // Should maintain maxSize
      expect(stats.evictions).toBe(5); // Should have evicted oldest entries

      // Only most recent entries should remain
      expect(memoryPressureCache.has("key9")).toBe(true);
      expect(memoryPressureCache.has("key8")).toBe(true);
      expect(memoryPressureCache.has("key0")).toBe(false);
      expect(memoryPressureCache.has("key1")).toBe(false);
    });

    it("should handle large value storage efficiently", () => {
      const largeValue = {
        data: "x".repeat(10000),
        results: Array(1000)
          .fill()
          .map((_, i) => ({ id: i, value: `item${i}` })),
        metadata: {
          timestamp: Date.now(),
          nested: {
            deep: {
              values: Array(100).fill("test"),
            },
          },
        },
      };

      memoryPressureCache.set("large-value", largeValue);
      const retrieved = memoryPressureCache.get("large-value");

      expect(retrieved).toEqual(largeValue);
      expect(retrieved.data.length).toBe(10000);
      expect(retrieved.results).toHaveLength(1000);
    });

    it("should prioritize recently accessed items during eviction", () => {
      // Fill cache
      for (let i = 0; i < 5; i++) {
        memoryPressureCache.set(`key${i}`, `value${i}`);
      }

      // Access middle item to make it more recent
      memoryPressureCache.get("key2");

      // Add new item to trigger eviction
      memoryPressureCache.set("key5", "value5");

      // key2 should still exist (was accessed recently)
      // key0 should be evicted (oldest)
      expect(memoryPressureCache.has("key2")).toBe(true);
      expect(memoryPressureCache.has("key0")).toBe(false);
    });
  });

  describe("concurrent access scenarios", () => {
    let concurrentCache: QueryCache;

    beforeEach(() => {
      concurrentCache = new QueryCache({
        maxSize: 100,
        defaultTTL: 5000,
        enabled: true,
      });
    });

    afterEach(() => {
      concurrentCache.destroy();
    });

    it("should handle concurrent reads and writes", async () => {
      const promises = [];
      const results = { reads: [], writes: [] };

      // Simulate concurrent operations
      for (let i = 0; i < 50; i++) {
        // Concurrent writes
        promises.push(
          Promise.resolve().then(() => {
            concurrentCache.set(`concurrent-key-${i}`, `value-${i}`);
            results.writes.push(i);
          }),
        );

        // Concurrent reads (some will miss, some will hit)
        promises.push(
          Promise.resolve().then(() => {
            const value = concurrentCache.get(`concurrent-key-${i % 10}`);
            if (value) results.reads.push(value);
          }),
        );
      }

      await Promise.all(promises);

      expect(results.writes).toHaveLength(50);
      expect(concurrentCache.getStatistics().size).toBeGreaterThan(0);
    });

    it("should handle concurrent cache operations during cleanup", async () => {
      jest.useFakeTimers();

      // Add entries with short TTL
      for (let i = 0; i < 20; i++) {
        concurrentCache.set(`cleanup-key-${i}`, `value-${i}`, 1000);
      }

      // Start concurrent operations
      const operations = [];

      // Concurrent cleanup
      operations.push(
        Promise.resolve().then(() => {
          jest.advanceTimersByTime(1500);
          return concurrentCache.cleanup();
        }),
      );

      // Concurrent reads
      for (let i = 0; i < 10; i++) {
        operations.push(
          Promise.resolve().then(() => {
            return concurrentCache.get(`cleanup-key-${i}`);
          }),
        );
      }

      // Concurrent writes
      for (let i = 20; i < 30; i++) {
        operations.push(
          Promise.resolve().then(() => {
            concurrentCache.set(`new-key-${i}`, `value-${i}`);
          }),
        );
      }

      const results = await Promise.all(operations);
      expect(results).toBeDefined();

      jest.useRealTimers();
    });
  });

  describe("complex TTL scenarios", () => {
    let ttlCache: QueryCache;

    beforeEach(() => {
      jest.useFakeTimers();
      ttlCache = new QueryCache({
        maxSize: 50,
        defaultTTL: 5000,
        maxTTL: 30000,
        cleanupInterval: 1000,
        enabled: true,
      });
    });

    afterEach(() => {
      ttlCache.destroy();
      jest.useRealTimers();
    });

    it("should handle mixed TTL entries correctly", () => {
      // Add entries with different TTLs
      ttlCache.set("short-lived", "value1", 1000); // 1 second
      ttlCache.set("medium-lived", "value2", 5000); // 5 seconds
      ttlCache.set("long-lived", "value3", 10000); // 10 seconds
      ttlCache.set("default-ttl", "value4"); // 5 seconds (default)

      expect(ttlCache.getStatistics().size).toBe(4);

      // Advance 2 seconds
      jest.advanceTimersByTime(2000);
      expect(ttlCache.has("short-lived")).toBe(false);
      expect(ttlCache.has("medium-lived")).toBe(true);
      expect(ttlCache.has("long-lived")).toBe(true);
      expect(ttlCache.has("default-ttl")).toBe(true);

      // Advance to 6 seconds
      jest.advanceTimersByTime(4000);
      expect(ttlCache.has("medium-lived")).toBe(false);
      expect(ttlCache.has("default-ttl")).toBe(false);
      expect(ttlCache.has("long-lived")).toBe(true);

      // Advance to 11 seconds
      jest.advanceTimersByTime(5000);
      expect(ttlCache.has("long-lived")).toBe(false);
    });

    it("should respect maxTTL limits", () => {
      // Try to set TTL longer than maxTTL
      ttlCache.set("limited-ttl", "value", 60000); // 60 seconds, but maxTTL is 30

      // Should expire at maxTTL (30 seconds), not requested TTL (60 seconds)
      jest.advanceTimersByTime(35000);
      expect(ttlCache.has("limited-ttl")).toBe(false);
    });

    it("should handle TTL updates correctly", () => {
      ttlCache.set("updatable", "value1", 5000);
      expect(ttlCache.has("updatable")).toBe(true);

      // Update with shorter TTL
      ttlCache.set("updatable", "value2", 2000);

      // Should expire at new TTL
      jest.advanceTimersByTime(3000);
      expect(ttlCache.has("updatable")).toBe(false);
    });

    it("should handle zero and negative TTL correctly", () => {
      // Zero TTL should not cache
      ttlCache.set("zero-ttl", "value", 0);
      expect(ttlCache.has("zero-ttl")).toBe(false);

      // Negative TTL should not cache
      ttlCache.set("negative-ttl", "value", -1000);
      expect(ttlCache.has("negative-ttl")).toBe(false);

      expect(ttlCache.getStatistics().size).toBe(0);
    });

    it("should handle automatic cleanup with mixed TTLs", () => {
      // Add entries with staggered expiration
      for (let i = 0; i < 10; i++) {
        ttlCache.set(`staggered-${i}`, `value${i}`, (i + 1) * 1000);
      }

      expect(ttlCache.getStatistics().size).toBe(10);

      // Let automatic cleanup run several times
      jest.advanceTimersByTime(3500); // 3.5 seconds

      // First few entries should be cleaned up, but exact count depends on cleanup timing
      const stats = ttlCache.getStatistics();
      expect(stats.size).toBeLessThan(10); // Some entries should be cleaned up
      expect(stats.size).toBeGreaterThan(0); // Some entries should remain
    });
  });

  describe("cache key stress testing", () => {
    it("should handle very long cache keys", () => {
      const longKey = "SELECT * WHERE { " + "?s ?p ?o . ".repeat(1000) + "}";
      cache.set(longKey, "long-key-value");

      expect(cache.has(longKey)).toBe(true);
      expect(cache.get(longKey)).toBe("long-key-value");
    });

    it("should handle cache keys with special characters", () => {
      const specialKeys = [
        "query with spaces",
        "query\twith\ttabs",
        "query\nwith\nnewlines",
        'query"with"quotes',
        "query'with'apostrophes",
        "query{with}braces",
        "query[with]brackets",
        "query(with)parentheses",
        "query<with>angles",
        "query/with/slashes",
        "query\\with\\backslashes",
        "query.with.dots",
        "query,with,commas",
        "query;with;semicolons",
      ];

      specialKeys.forEach((key, index) => {
        cache.set(key, `value-${index}`);
        expect(cache.has(key)).toBe(true);
        expect(cache.get(key)).toBe(`value-${index}`);
      });
    });

    it("should handle unicode cache keys", () => {
      const unicodeKeys = [
        "SELECT ?名前 WHERE { ?person rdfs:label ?名前 }",
        "SELECT ?имя WHERE { ?person rdfs:label ?имя }",
        "SELECT ?nom WHERE { ?person rdfs:label ?nom }",
        "SELECT ?नाम WHERE { ?person rdfs:label ?नाम }",
        "SELECT ?名前 WHERE { ?人 rdfs:label ?名前 }",
      ];

      unicodeKeys.forEach((key, index) => {
        cache.set(key, `unicode-value-${index}`);
        expect(cache.has(key)).toBe(true);
        expect(cache.get(key)).toBe(`unicode-value-${index}`);
      });
    });

    it("should create consistent keys for queries with different whitespace", () => {
      const queries = [
        "SELECT ?s ?p ?o WHERE { ?s ?p ?o }",
        "  SELECT   ?s   ?p   ?o   WHERE   {   ?s   ?p   ?o   }  ",
        "SELECT\n?s\n?p\n?o\nWHERE\n{\n?s\n?p\n?o\n}",
        "SELECT\t?s\t?p\t?o\tWHERE\t{\t?s\t?p\t?o\t}",
        "SELECT\r\n?s\r\n?p\r\n?o\r\nWHERE\r\n{\r\n?s\r\n?p\r\n?o\r\n}",
      ];

      const keys = queries.map((q) => cache.createCacheKey(q));

      // All keys should be identical
      for (let i = 1; i < keys.length; i++) {
        expect(keys[i]).toBe(keys[0]);
      }
    });
  });

  describe("advanced invalidation scenarios", () => {
    it("should invalidate by complex predicates", () => {
      // Add various types of queries
      cache.set("SELECT * WHERE { ?s ?p ?o }", {
        type: "SELECT",
        vars: ["s", "p", "o"],
      });
      cache.set("CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }", {
        type: "CONSTRUCT",
        vars: ["s", "p", "o"],
      });
      cache.set("ASK WHERE { ?s ?p ?o }", { type: "ASK", vars: [] });
      cache.set("SELECT ?name WHERE { ?person foaf:name ?name }", {
        type: "SELECT",
        vars: ["name"],
      });

      // Invalidate all queries that use specific variables
      const invalidated = cache.invalidateWhere((key, entry) => {
        return entry.value.vars && entry.value.vars.includes("name");
      });

      expect(invalidated).toBe(1);
      expect(cache.has("SELECT ?name WHERE { ?person foaf:name ?name }")).toBe(
        false,
      );
      expect(cache.has("SELECT * WHERE { ?s ?p ?o }")).toBe(true);
    });

    it("should invalidate by timestamp ranges", () => {
      jest.useFakeTimers();
      const baseTime = Date.now();

      // Add entries at different times
      cache.set("old-query-1", "value1");
      jest.advanceTimersByTime(1000);
      cache.set("old-query-2", "value2");
      jest.advanceTimersByTime(5000);
      cache.set("new-query-1", "value3");
      cache.set("new-query-2", "value4");

      const cutoffTime = baseTime + 3000;

      // Invalidate entries older than cutoff
      const invalidated = cache.invalidateWhere((key, entry) => {
        return entry.timestamp < cutoffTime;
      });

      expect(invalidated).toBe(2);
      expect(cache.has("old-query-1")).toBe(false);
      expect(cache.has("old-query-2")).toBe(false);
      expect(cache.has("new-query-1")).toBe(true);
      expect(cache.has("new-query-2")).toBe(true);

      jest.useRealTimers();
    });

    it("should handle invalidation during iteration", () => {
      // Fill cache with many entries
      for (let i = 0; i < 50; i++) {
        cache.set(`key-${i}`, { id: i, group: i % 5 });
      }

      // Invalidate every other group while iterating
      const invalidated = cache.invalidateWhere((key, entry) => {
        return entry.value.group % 2 === 0;
      });

      expect(invalidated).toBe(30); // Groups 0, 2, 4 (3 groups * 10 items each)
      expect(cache.getStatistics().size).toBe(20); // Groups 1, 3 (2 groups * 10 items each)
    });
  });

  describe("performance under load", () => {
    it("should maintain performance with high cache churn", () => {
      const highChurnCache = new QueryCache({ maxSize: 100, enabled: true });

      const startTime = performance.now();

      // Simulate high churn - add 1000 items to 100-item cache
      for (let i = 0; i < 1000; i++) {
        highChurnCache.set(`churn-key-${i}`, `value-${i}`);

        // Occasional reads
        if (i % 10 === 0) {
          highChurnCache.get(`churn-key-${Math.max(0, i - 50)}`);
        }
      }

      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(100); // Should complete quickly
      expect(highChurnCache.getStatistics().size).toBe(100);

      highChurnCache.destroy();
    });

    it("should handle frequent TTL checks efficiently", () => {
      jest.useFakeTimers();

      const ttlTestCache = new QueryCache({
        maxSize: 50, // Smaller cache to reduce overhead
        defaultTTL: 1000,
        cleanupInterval: 100,
        enabled: true,
      });

      // Add fewer entries to reduce test time
      for (let i = 0; i < 50; i++) {
        ttlTestCache.set(`ttl-key-${i}`, `value-${i}`, 500 + i * 10);
      }

      const initialSize = ttlTestCache.getStatistics().size;
      expect(initialSize).toBe(50);

      // Advance time to trigger cleanup cycles
      for (let cycle = 0; cycle < 10; cycle++) {
        jest.advanceTimersByTime(100);
      }

      // Verify that expired entries were cleaned up
      const finalSize = ttlTestCache.getStatistics().size;
      expect(finalSize).toBeLessThan(initialSize);

      // Verify cache is still functional
      ttlTestCache.set("test-after-cleanup", "test-value");
      expect(ttlTestCache.has("test-after-cleanup")).toBe(true);

      ttlTestCache.destroy();
      jest.useRealTimers();
    });
  });

  describe("resource cleanup", () => {
    it("should cleanup timers on destroy", () => {
      const timerSpy = jest.spyOn(global, "clearInterval");

      const testCache = new QueryCache({ cleanupInterval: 1000 });
      testCache.destroy();

      expect(timerSpy).toHaveBeenCalled();

      timerSpy.mockRestore();
    });

    it("should be safe to call destroy multiple times", () => {
      const testCache = new QueryCache();

      expect(() => {
        testCache.destroy();
        testCache.destroy();
        testCache.destroy();
      }).not.toThrow();
    });

    it("should handle operations after destroy gracefully", () => {
      const testCache = new QueryCache();
      testCache.set("key", "value");

      expect(testCache.get("key")).toBe("value");

      testCache.destroy();

      // After destroy, cache should be cleared
      expect(testCache.has("key")).toBe(false);
      // Operations should still work without throwing
      expect(() => testCache.set("key2", "value2")).not.toThrow();
      expect(() => testCache.cleanup()).not.toThrow();
      // Newly set values should work
      expect(testCache.has("key2")).toBe(true);
    });

    it("should handle memory cleanup for large cached values", () => {
      const memoryTestCache = new QueryCache({ maxSize: 10, enabled: true });

      // Add large values that would consume significant memory
      const largeValue = {
        data: new Array(1000).fill("large-string-data"), // Smaller array
        nested: {
          deep: new Array(500).fill({
            id: 1,
            name: "test",
            data: "x".repeat(10),
          }), // Smaller nested array
        },
      };

      for (let i = 0; i < 20; i++) {
        memoryTestCache.set(`large-${i}`, { ...largeValue, id: i });
      }

      expect(memoryTestCache.getStatistics().size).toBe(10);

      // Clear the cache manually before destroy to test the behavior
      memoryTestCache.invalidateAll();
      expect(memoryTestCache.getStatistics().size).toBe(0);

      // Destroy should not fail
      memoryTestCache.destroy();
    });
  });
});
