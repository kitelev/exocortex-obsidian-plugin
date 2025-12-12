/**
 * Negative Tests for Error Handling
 * Issue #788: Add negative tests for error handling (10+ scenarios)
 *
 * This file contains comprehensive tests for error paths across the codebase:
 * 1. LRUCache - invalid input and constructor errors
 * 2. Invalid input handling scenarios
 * 3. Concurrent operation errors
 * 4. Recovery mechanism tests
 * 5. Error message verification
 * 6. Edge case handling
 * 7. Cache boundary conditions
 * 8. Special character handling
 * 9. Resource cleanup verification
 * 10. Type safety tests
 * 11. Performance edge cases
 * 12. Iteration error handling
 */

import { LRUCache } from "../../../src/infrastructure/cache/LRUCache";

describe("Negative Tests - Error Handling Scenarios", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("1. LRUCache Error Handling", () => {
    describe("invalid constructor arguments", () => {
      it("should throw error for maxEntries of 0", () => {
        expect(() => new LRUCache<string, number>(0)).toThrow(
          "maxEntries must be at least 1"
        );
      });

      it("should throw error for negative maxEntries", () => {
        expect(() => new LRUCache<string, number>(-1)).toThrow(
          "maxEntries must be at least 1"
        );
        expect(() => new LRUCache<string, number>(-100)).toThrow(
          "maxEntries must be at least 1"
        );
      });

      it("should throw error for very large negative values", () => {
        expect(() => new LRUCache<string, number>(-Number.MAX_SAFE_INTEGER)).toThrow(
          "maxEntries must be at least 1"
        );
      });

      it("should accept minimum valid maxEntries of 1", () => {
        const cache = new LRUCache<string, number>(1);
        expect(cache.capacity).toBe(1);
      });
    });

    describe("edge cases with null/undefined values", () => {
      it("should handle null values in cache", () => {
        const cache = new LRUCache<string, null>(3);
        cache.set("key", null);
        expect(cache.has("key")).toBe(true);
      });

      it("should handle undefined values in cache", () => {
        const cache = new LRUCache<string, undefined>(3);
        cache.set("key", undefined);
        expect(cache.has("key")).toBe(true);
      });

      it("should distinguish between missing key and undefined value", () => {
        const cache = new LRUCache<string, undefined>(3);
        cache.set("existing", undefined);

        expect(cache.has("existing")).toBe(true);
        expect(cache.has("missing")).toBe(false);
        expect(cache.get("existing")).toBeUndefined();
        expect(cache.get("missing")).toBeUndefined();
      });
    });

    describe("boundary conditions", () => {
      it("should handle eviction at exact capacity", () => {
        const cache = new LRUCache<string, number>(3);
        cache.set("a", 1);
        cache.set("b", 2);
        cache.set("c", 3);

        // At capacity, next insert should evict
        expect(cache.size).toBe(3);

        cache.set("d", 4);
        expect(cache.size).toBe(3);
        expect(cache.has("a")).toBe(false); // Oldest evicted
        expect(cache.has("d")).toBe(true);
      });

      it("should track eviction count correctly", () => {
        const cache = new LRUCache<string, number>(2);

        cache.set("a", 1);
        cache.set("b", 2);
        expect(cache.getStats().evictions).toBe(0);

        cache.set("c", 3); // Evicts "a"
        expect(cache.getStats().evictions).toBe(1);

        cache.set("d", 4); // Evicts "b"
        expect(cache.getStats().evictions).toBe(2);
      });
    });
  });

  describe("2. Invalid Input Handling", () => {
    describe("empty string handling", () => {
      it("LRUCache should handle empty string keys", () => {
        const cache = new LRUCache<string, number>(3);
        cache.set("", 42);
        expect(cache.get("")).toBe(42);
        expect(cache.has("")).toBe(true);
      });

      it("should handle empty string values", () => {
        const cache = new LRUCache<string, string>(3);
        cache.set("key", "");
        expect(cache.get("key")).toBe("");
        expect(cache.has("key")).toBe(true);
      });
    });

    describe("special character handling", () => {
      it("LRUCache should handle keys with special characters", () => {
        const cache = new LRUCache<string, string>(10);
        const specialKeys = [
          "key\0null",
          "key\twith\ttabs",
          "key\nwith\nnewlines",
          "key with spaces",
          "🔑emoji",
          "键中文",
          "مفتاح",
          "<script>alert('xss')</script>",
          "key&with=special?chars",
        ];

        specialKeys.forEach((key, index) => {
          cache.set(key, `value${index}`);
          expect(cache.get(key)).toBe(`value${index}`);
        });
      });

      it("should handle values with special characters", () => {
        const cache = new LRUCache<string, string>(3);
        const specialValues = [
          "value\0with\0nulls",
          "value\nwith\nnewlines",
          "<div>html</div>",
        ];

        specialValues.forEach((value, index) => {
          cache.set(`key${index}`, value);
          expect(cache.get(`key${index}`)).toBe(value);
        });
      });
    });

    describe("very long strings", () => {
      it("LRUCache should handle very long keys", () => {
        const cache = new LRUCache<string, number>(3);
        const longKey = "a".repeat(10000);
        cache.set(longKey, 123);
        expect(cache.get(longKey)).toBe(123);
      });

      it("should handle very long values", () => {
        const cache = new LRUCache<string, string>(3);
        const longValue = "x".repeat(100000);
        cache.set("key", longValue);
        expect(cache.get("key")).toBe(longValue);
        expect(cache.get("key")?.length).toBe(100000);
      });
    });

    describe("complex key types", () => {
      it("should handle object keys", () => {
        const cache = new LRUCache<object, number>(3);
        const key1 = { id: 1 };
        const key2 = { id: 2 };

        cache.set(key1, 100);
        cache.set(key2, 200);

        expect(cache.get(key1)).toBe(100);
        expect(cache.get(key2)).toBe(200);

        // Different object with same content is different key
        const key1Copy = { id: 1 };
        expect(cache.get(key1Copy)).toBeUndefined();
      });

      it("should handle symbol keys", () => {
        const cache = new LRUCache<symbol, string>(3);
        const sym1 = Symbol("test1");
        const sym2 = Symbol("test2");

        cache.set(sym1, "value1");
        cache.set(sym2, "value2");

        expect(cache.get(sym1)).toBe("value1");
        expect(cache.get(sym2)).toBe("value2");
      });
    });
  });

  describe("3. Concurrent Operation Error Handling", () => {
    describe("rapid successive operations", () => {
      it("LRUCache should handle rapid set/get operations", () => {
        const cache = new LRUCache<string, number>(100);

        // Simulate rapid operations
        for (let i = 0; i < 1000; i++) {
          cache.set(`key${i}`, i);
          cache.get(`key${i - 50}`); // Access older keys
        }

        // Cache should maintain integrity
        expect(cache.size).toBeLessThanOrEqual(100);
        expect(cache.getStats().evictions).toBeGreaterThan(0);
      });

      it("should maintain LRU order under stress", () => {
        const cache = new LRUCache<string, number>(3);

        // Fill cache
        cache.set("a", 1);
        cache.set("b", 2);
        cache.set("c", 3);

        // Rapid access pattern
        for (let i = 0; i < 100; i++) {
          cache.get("a"); // Keep "a" fresh
        }

        // Add new entry - "b" should be evicted, not "a"
        cache.set("d", 4);

        expect(cache.has("a")).toBe(true);
        expect(cache.has("b")).toBe(false);
      });
    });

    describe("alternating operations", () => {
      it("should handle alternating set/delete operations", () => {
        const cache = new LRUCache<string, number>(5);

        for (let i = 0; i < 100; i++) {
          cache.set(`key${i}`, i);
          if (i > 0) {
            cache.delete(`key${i - 1}`);
          }
        }

        // Should only have last entry
        expect(cache.size).toBe(1);
        expect(cache.has("key99")).toBe(true);
      });

      it("should handle interleaved clear operations", () => {
        const cache = new LRUCache<string, number>(10);

        for (let batch = 0; batch < 10; batch++) {
          // Clear every 3rd batch (before adding entries)
          if (batch % 3 === 0 && batch > 0) {
            cache.clear();
          }

          // Add some entries
          for (let i = 0; i < 5; i++) {
            cache.set(`batch${batch}_key${i}`, batch * 10 + i);
          }
        }

        // Cache should still work - last batch (9) was cleared before adding,
        // so we have entries from batch 9
        expect(cache.size).toBeGreaterThan(0);
        expect(cache.size).toBeLessThanOrEqual(10);
      });
    });
  });

  describe("4. Recovery Mechanism Tests", () => {
    describe("cache recovery after clear", () => {
      it("should work normally after clear operation", () => {
        const cache = new LRUCache<string, number>(3);

        // Fill cache
        cache.set("a", 1);
        cache.set("b", 2);
        cache.set("c", 3);

        // Clear
        cache.clear();

        // Should work normally after clear
        cache.set("d", 4);
        expect(cache.get("d")).toBe(4);
        expect(cache.size).toBe(1);
      });

      it("should maintain capacity after multiple clears", () => {
        const cache = new LRUCache<string, number>(2);

        for (let i = 0; i < 5; i++) {
          cache.set("a", i);
          cache.set("b", i + 1);
          cache.set("c", i + 2); // Should evict
          cache.clear();
        }

        cache.set("x", 1);
        cache.set("y", 2);
        cache.set("z", 3); // Should evict x

        expect(cache.size).toBe(2);
        expect(cache.has("x")).toBe(false);
      });
    });

    describe("stats recovery after reset", () => {
      it("should track stats correctly after resetStats", () => {
        const cache = new LRUCache<string, number>(3);

        // Generate some stats
        cache.set("a", 1);
        cache.get("a"); // hit
        cache.get("missing"); // miss

        const beforeReset = cache.getStats();
        expect(beforeReset.hits).toBe(1);
        expect(beforeReset.misses).toBe(1);

        cache.resetStats();

        // New operations should be tracked
        cache.get("a"); // hit
        const afterReset = cache.getStats();
        expect(afterReset.hits).toBe(1);
        expect(afterReset.misses).toBe(0);
      });

      it("should not affect eviction count after resetStats", () => {
        const cache = new LRUCache<string, number>(2);

        cache.set("a", 1);
        cache.set("b", 2);
        cache.set("c", 3); // Evicts

        expect(cache.getStats().evictions).toBe(1);

        cache.resetStats();

        // Eviction counter should be reset
        expect(cache.getStats().evictions).toBe(0);

        cache.set("d", 4); // Another eviction
        expect(cache.getStats().evictions).toBe(1);
      });
    });

    describe("cleanup recovery", () => {
      it("should allow normal operations after cleanup", () => {
        const cache = new LRUCache<string, number>(3);

        cache.set("a", 1);
        cache.get("a");

        cache.cleanup();

        // Should work normally after cleanup
        cache.set("b", 2);
        cache.get("b");

        expect(cache.size).toBe(1);
        expect(cache.getStats().hits).toBe(1);
      });

      it("should reset all state after cleanup", () => {
        const cache = new LRUCache<string, number>(5);

        // Build up state
        cache.set("a", 1);
        cache.set("b", 2);
        cache.get("a");
        cache.get("missing");

        // Cleanup
        cache.cleanup();

        // All state should be reset
        expect(cache.size).toBe(0);
        expect(cache.getStats().hits).toBe(0);
        expect(cache.getStats().misses).toBe(0);
        expect(cache.getStats().evictions).toBe(0);
      });
    });
  });

  describe("5. Error Message Verification", () => {
    it("should have user-friendly error messages for LRUCache", () => {
      try {
        new LRUCache<string, number>(0);
        fail("Expected error to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("maxEntries must be at least 1");
      }
    });

    it("should provide clear error for negative capacity", () => {
      const expectedMessage = "maxEntries must be at least 1";

      expect(() => new LRUCache(-5)).toThrow(expectedMessage);
      expect(() => new LRUCache(-1)).toThrow(expectedMessage);
      expect(() => new LRUCache(0)).toThrow(expectedMessage);
    });
  });

  describe("6. Cache Iteration Error Handling", () => {
    describe("iteration on empty cache", () => {
      it("should safely iterate keys on empty cache", () => {
        const cache = new LRUCache<string, number>(3);
        const keys = Array.from(cache.keys());
        expect(keys).toEqual([]);
      });

      it("should safely iterate values on empty cache", () => {
        const cache = new LRUCache<string, number>(3);
        const values = Array.from(cache.values());
        expect(values).toEqual([]);
      });

      it("should safely iterate entries on empty cache", () => {
        const cache = new LRUCache<string, number>(3);
        const entries = Array.from(cache.entries());
        expect(entries).toEqual([]);
      });

      it("should handle forEach on empty cache", () => {
        const cache = new LRUCache<string, number>(3);
        const callback = jest.fn();
        cache.forEach(callback);
        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe("iteration after modifications", () => {
      it("should reflect deletions in iteration", () => {
        const cache = new LRUCache<string, number>(3);
        cache.set("a", 1);
        cache.set("b", 2);
        cache.set("c", 3);

        cache.delete("b");

        const keys = Array.from(cache.keys());
        expect(keys).toEqual(["a", "c"]);
      });

      it("should reflect clear in iteration", () => {
        const cache = new LRUCache<string, number>(3);
        cache.set("a", 1);
        cache.set("b", 2);

        cache.clear();

        const entries = Array.from(cache.entries());
        expect(entries).toEqual([]);
      });
    });
  });

  describe("7. Delete Operation Edge Cases", () => {
    describe("delete non-existent keys", () => {
      it("should return false for non-existent key", () => {
        const cache = new LRUCache<string, number>(3);
        expect(cache.delete("nonexistent")).toBe(false);
      });

      it("should return false after key already deleted", () => {
        const cache = new LRUCache<string, number>(3);
        cache.set("key", 1);

        expect(cache.delete("key")).toBe(true);
        expect(cache.delete("key")).toBe(false);
      });

      it("should not affect other entries when deleting non-existent", () => {
        const cache = new LRUCache<string, number>(3);
        cache.set("a", 1);
        cache.set("b", 2);

        cache.delete("nonexistent");

        expect(cache.size).toBe(2);
        expect(cache.get("a")).toBe(1);
        expect(cache.get("b")).toBe(2);
      });
    });

    describe("delete after eviction", () => {
      it("should handle delete of evicted key", () => {
        const cache = new LRUCache<string, number>(2);
        cache.set("a", 1);
        cache.set("b", 2);
        cache.set("c", 3); // Evicts "a"

        // Try to delete already-evicted key
        expect(cache.delete("a")).toBe(false);
      });
    });
  });

  describe("8. Stats Consistency Tests", () => {
    describe("stats accuracy under various operations", () => {
      it("should track hit ratio accurately", () => {
        const cache = new LRUCache<string, number>(3);

        cache.set("a", 1);
        cache.set("b", 2);

        // 3 hits
        cache.get("a");
        cache.get("b");
        cache.get("a");

        // 2 misses
        cache.get("c");
        cache.get("d");

        const stats = cache.getStats();
        expect(stats.hits).toBe(3);
        expect(stats.misses).toBe(2);
      });

      it("should report correct size and capacity", () => {
        const cache = new LRUCache<string, number>(5);

        cache.set("a", 1);
        cache.set("b", 2);
        cache.set("c", 3);

        const stats = cache.getStats();
        expect(stats.size).toBe(3);
        expect(stats.capacity).toBe(5);
      });

      it("should update stats after operations", () => {
        const cache = new LRUCache<string, number>(2);

        let stats = cache.getStats();
        expect(stats.size).toBe(0);

        cache.set("a", 1);
        stats = cache.getStats();
        expect(stats.size).toBe(1);

        cache.delete("a");
        stats = cache.getStats();
        expect(stats.size).toBe(0);
      });
    });
  });

  describe("9. Update Existing Key Behavior", () => {
    it("should update value for existing key", () => {
      const cache = new LRUCache<string, number>(3);

      cache.set("key", 1);
      expect(cache.get("key")).toBe(1);

      cache.set("key", 2);
      expect(cache.get("key")).toBe(2);

      // Size should remain 1
      expect(cache.size).toBe(1);
    });

    it("should move updated key to most recent position", () => {
      const cache = new LRUCache<string, number>(3);

      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      // Update "a", making it most recent
      cache.set("a", 10);

      // Add new entry - "b" should be evicted
      cache.set("d", 4);

      expect(cache.has("a")).toBe(true);
      expect(cache.has("b")).toBe(false);
      expect(cache.has("c")).toBe(true);
      expect(cache.has("d")).toBe(true);
    });

    it("should not count update as eviction", () => {
      const cache = new LRUCache<string, number>(2);

      cache.set("a", 1);
      cache.set("b", 2);

      // Update existing key - no eviction
      cache.set("a", 10);

      expect(cache.getStats().evictions).toBe(0);
    });
  });

  describe("10. Capacity Edge Cases", () => {
    describe("single capacity cache", () => {
      it("should work correctly with capacity of 1", () => {
        const cache = new LRUCache<string, number>(1);

        cache.set("a", 1);
        expect(cache.get("a")).toBe(1);
        expect(cache.size).toBe(1);

        cache.set("b", 2);
        expect(cache.get("b")).toBe(2);
        expect(cache.has("a")).toBe(false);
        expect(cache.size).toBe(1);
      });

      it("should track evictions with capacity 1", () => {
        const cache = new LRUCache<string, number>(1);

        cache.set("a", 1);
        cache.set("b", 2);
        cache.set("c", 3);

        expect(cache.getStats().evictions).toBe(2);
      });
    });

    describe("large capacity cache", () => {
      it("should handle large capacity efficiently", () => {
        const cache = new LRUCache<number, number>(10000);

        for (let i = 0; i < 10000; i++) {
          cache.set(i, i * 2);
        }

        expect(cache.size).toBe(10000);
        expect(cache.get(0)).toBe(0);
        expect(cache.get(9999)).toBe(19998);
      });
    });
  });

  describe("11. Type Safety Tests", () => {
    it("should maintain type safety with generic types", () => {
      interface User {
        id: number;
        name: string;
      }

      const cache = new LRUCache<string, User>(3);

      cache.set("user1", { id: 1, name: "Alice" });

      const user = cache.get("user1");
      expect(user?.id).toBe(1);
      expect(user?.name).toBe("Alice");
    });

    it("should handle array values", () => {
      const cache = new LRUCache<string, number[]>(3);

      cache.set("arr", [1, 2, 3]);

      const arr = cache.get("arr");
      expect(arr).toEqual([1, 2, 3]);
    });

    it("should handle function values", () => {
      const cache = new LRUCache<string, () => number>(3);

      const fn = () => 42;
      cache.set("fn", fn);

      const retrieved = cache.get("fn");
      expect(retrieved?.()).toBe(42);
    });
  });

  describe("12. Memory/Performance Edge Cases", () => {
    it("should handle rapid set operations efficiently", () => {
      const cache = new LRUCache<string, number>(100);
      const iterations = 10000;

      const start = Date.now();
      for (let i = 0; i < iterations; i++) {
        cache.set(`key${i}`, i);
      }
      const duration = Date.now() - start;

      // Should complete in reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
      expect(cache.size).toBe(100);
    });

    it("should handle rapid get operations efficiently", () => {
      const cache = new LRUCache<string, number>(1000);

      // Pre-fill cache
      for (let i = 0; i < 1000; i++) {
        cache.set(`key${i}`, i);
      }

      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        cache.get(`key${i % 1000}`);
      }
      const duration = Date.now() - start;

      // Should complete in reasonable time
      expect(duration).toBeLessThan(1000);
    });
  });
});
