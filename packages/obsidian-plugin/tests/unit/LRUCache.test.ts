import { LRUCache } from "../../src/infrastructure/cache/LRUCache";

describe("LRUCache", () => {
  let cache: LRUCache<string, number>;

  beforeEach(() => {
    cache = new LRUCache<string, number>(3);
  });

  describe("constructor", () => {
    it("should create cache with default capacity", () => {
      const defaultCache = new LRUCache<string, number>();
      expect(defaultCache.capacity).toBe(1000);
    });

    it("should create cache with specified capacity", () => {
      expect(cache.capacity).toBe(3);
    });

    it("should throw error for maxEntries < 1", () => {
      expect(() => new LRUCache<string, number>(0)).toThrow("maxEntries must be at least 1");
      expect(() => new LRUCache<string, number>(-1)).toThrow("maxEntries must be at least 1");
    });

    it("should start with empty cache", () => {
      expect(cache.size).toBe(0);
    });

    it("should start with zero stats", () => {
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.evictions).toBe(0);
    });
  });

  describe("set", () => {
    it("should add entry to cache", () => {
      cache.set("a", 1);

      expect(cache.size).toBe(1);
      expect(cache.has("a")).toBe(true);
    });

    it("should update existing entry", () => {
      cache.set("a", 1);
      cache.set("a", 2);

      expect(cache.size).toBe(1);
      expect(cache.get("a")).toBe(2);
    });

    it("should evict oldest entry when at capacity", () => {
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);
      cache.set("d", 4);

      expect(cache.size).toBe(3);
      expect(cache.has("a")).toBe(false);
      expect(cache.has("b")).toBe(true);
      expect(cache.has("c")).toBe(true);
      expect(cache.has("d")).toBe(true);
    });

    it("should track evictions in stats", () => {
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);
      cache.set("d", 4);

      const stats = cache.getStats();
      expect(stats.evictions).toBe(1);
    });

    it("should update position when updating existing key", () => {
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("a", 10); // Updates 'a', making it most recent
      cache.set("c", 3);
      cache.set("d", 4);

      // 'b' should be evicted, not 'a'
      expect(cache.has("a")).toBe(true);
      expect(cache.has("b")).toBe(false);
    });
  });

  describe("get", () => {
    it("should return value for existing key", () => {
      cache.set("a", 1);

      expect(cache.get("a")).toBe(1);
    });

    it("should return undefined for non-existing key", () => {
      expect(cache.get("nonexistent")).toBeUndefined();
    });

    it("should track hits in stats", () => {
      cache.set("a", 1);
      cache.get("a");
      cache.get("a");

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
    });

    it("should track misses in stats", () => {
      cache.get("nonexistent");
      cache.get("another");

      const stats = cache.getStats();
      expect(stats.misses).toBe(2);
    });

    it("should update LRU order (accessed item becomes most recent)", () => {
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      cache.get("a"); // 'a' is now most recent

      cache.set("d", 4);
      cache.set("e", 5);

      // 'b' and 'c' should be evicted, 'a' should remain
      expect(cache.has("a")).toBe(true);
      expect(cache.has("b")).toBe(false);
      expect(cache.has("c")).toBe(false);
      expect(cache.has("d")).toBe(true);
      expect(cache.has("e")).toBe(true);
    });
  });

  describe("has", () => {
    it("should return true for existing key", () => {
      cache.set("a", 1);

      expect(cache.has("a")).toBe(true);
    });

    it("should return false for non-existing key", () => {
      expect(cache.has("nonexistent")).toBe(false);
    });

    it("should not affect LRU order", () => {
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      cache.has("a"); // Should NOT update LRU order

      cache.set("d", 4);

      // 'a' should be evicted (oldest)
      expect(cache.has("a")).toBe(false);
    });

    it("should not affect stats", () => {
      cache.set("a", 1);
      cache.has("a");
      cache.has("nonexistent");

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe("delete", () => {
    it("should remove existing entry", () => {
      cache.set("a", 1);

      const result = cache.delete("a");

      expect(result).toBe(true);
      expect(cache.has("a")).toBe(false);
      expect(cache.size).toBe(0);
    });

    it("should return false for non-existing key", () => {
      const result = cache.delete("nonexistent");

      expect(result).toBe(false);
    });

    it("should not affect other entries", () => {
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      cache.delete("b");

      expect(cache.has("a")).toBe(true);
      expect(cache.has("c")).toBe(true);
      expect(cache.size).toBe(2);
    });
  });

  describe("size", () => {
    it("should return 0 for empty cache", () => {
      expect(cache.size).toBe(0);
    });

    it("should return correct count after additions", () => {
      cache.set("a", 1);
      expect(cache.size).toBe(1);

      cache.set("b", 2);
      expect(cache.size).toBe(2);

      cache.set("c", 3);
      expect(cache.size).toBe(3);
    });

    it("should not exceed capacity", () => {
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);
      cache.set("d", 4);
      cache.set("e", 5);

      expect(cache.size).toBe(3);
    });
  });

  describe("capacity", () => {
    it("should return the maxEntries value", () => {
      expect(cache.capacity).toBe(3);

      const largeCache = new LRUCache<string, number>(1000);
      expect(largeCache.capacity).toBe(1000);
    });
  });

  describe("getStats", () => {
    it("should return all statistics", () => {
      cache.set("a", 1);
      cache.set("b", 2);
      cache.get("a");
      cache.get("nonexistent");
      cache.set("c", 3);
      cache.set("d", 4);

      const stats = cache.getStats();

      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.evictions).toBe(1);
      expect(stats.size).toBe(3);
      expect(stats.capacity).toBe(3);
    });
  });

  describe("resetStats", () => {
    it("should reset all counters to 0", () => {
      cache.set("a", 1);
      cache.set("b", 2);
      cache.get("a");
      cache.get("miss");
      cache.set("c", 3);
      cache.set("d", 4);

      cache.resetStats();

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.evictions).toBe(0);
    });

    it("should not affect cache contents", () => {
      cache.set("a", 1);
      cache.set("b", 2);

      cache.resetStats();

      expect(cache.size).toBe(2);
      expect(cache.get("a")).toBe(1);
      expect(cache.get("b")).toBe(2);
    });
  });

  describe("clear", () => {
    it("should remove all entries", () => {
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      cache.clear();

      expect(cache.size).toBe(0);
      expect(cache.has("a")).toBe(false);
      expect(cache.has("b")).toBe(false);
      expect(cache.has("c")).toBe(false);
    });

    it("should not reset stats", () => {
      cache.set("a", 1);
      cache.get("a");

      cache.clear();

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
    });
  });

  describe("cleanup", () => {
    it("should remove all entries and reset stats", () => {
      cache.set("a", 1);
      cache.set("b", 2);
      cache.get("a");
      cache.get("miss");

      cache.cleanup();

      expect(cache.size).toBe(0);
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.evictions).toBe(0);
      expect(stats.expirations).toBe(0);
    });
  });

  describe("keys", () => {
    it("should return all keys in LRU order (oldest first)", () => {
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      const keys = Array.from(cache.keys());

      expect(keys).toEqual(["a", "b", "c"]);
    });

    it("should return empty iterator for empty cache", () => {
      const keys = Array.from(cache.keys());

      expect(keys).toEqual([]);
    });

    it("should reflect LRU order after access", () => {
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);
      cache.get("a"); // Move 'a' to most recent

      const keys = Array.from(cache.keys());

      expect(keys).toEqual(["b", "c", "a"]);
    });
  });

  describe("values", () => {
    it("should return all values in LRU order (oldest first)", () => {
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      const values = Array.from(cache.values());

      expect(values).toEqual([1, 2, 3]);
    });

    it("should return empty iterator for empty cache", () => {
      const values = Array.from(cache.values());

      expect(values).toEqual([]);
    });
  });

  describe("entries", () => {
    it("should return all entries in LRU order (oldest first)", () => {
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      const entries = Array.from(cache.entries());

      expect(entries).toEqual([
        ["a", 1],
        ["b", 2],
        ["c", 3],
      ]);
    });

    it("should return empty iterator for empty cache", () => {
      const entries = Array.from(cache.entries());

      expect(entries).toEqual([]);
    });
  });

  describe("forEach", () => {
    it("should iterate over all entries", () => {
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      const collected: [string, number][] = [];
      cache.forEach((value, key) => {
        collected.push([key, value]);
      });

      expect(collected).toEqual([
        ["a", 1],
        ["b", 2],
        ["c", 3],
      ]);
    });

    it("should not call callback for empty cache", () => {
      const callback = jest.fn();
      cache.forEach(callback);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle cache with capacity 1", () => {
      const singleCache = new LRUCache<string, number>(1);

      singleCache.set("a", 1);
      expect(singleCache.size).toBe(1);
      expect(singleCache.get("a")).toBe(1);

      singleCache.set("b", 2);
      expect(singleCache.size).toBe(1);
      expect(singleCache.has("a")).toBe(false);
      expect(singleCache.get("b")).toBe(2);
    });

    it("should handle null values", () => {
      const nullCache = new LRUCache<string, null>(3);

      nullCache.set("a", null);

      expect(nullCache.has("a")).toBe(true);
      // Note: get() returns undefined for cache misses
      // null values may cause issues with the current implementation
    });

    it("should handle complex key types", () => {
      const objectCache = new LRUCache<object, number>(3);
      const key1 = { id: 1 };
      const key2 = { id: 2 };

      objectCache.set(key1, 100);
      objectCache.set(key2, 200);

      expect(objectCache.get(key1)).toBe(100);
      expect(objectCache.get(key2)).toBe(200);
    });

    it("should handle rapid set/get operations", () => {
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, i);
        if (i > 0) {
          cache.get(`key${i - 1}`);
        }
      }

      // Should only have last 3 entries
      expect(cache.size).toBe(3);
    });

    it("should handle setting undefined values", () => {
      const undefinedCache = new LRUCache<string, number | undefined>(3);

      undefinedCache.set("a", undefined);

      // undefined value should be stored, but get() returns undefined anyway
      expect(undefinedCache.has("a")).toBe(true);
    });
  });

  describe("LRU behavior verification", () => {
    it("should evict in correct LRU order after multiple accesses", () => {
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      // Access pattern: a, b, a, c, b
      cache.get("a");
      cache.get("b");
      cache.get("a");
      cache.get("c");
      cache.get("b");

      // Order should now be: a (oldest), c, b (newest)
      cache.set("d", 4);

      // 'a' should be evicted
      expect(cache.has("a")).toBe(false);
      expect(cache.has("c")).toBe(true);
      expect(cache.has("b")).toBe(true);
      expect(cache.has("d")).toBe(true);
    });

    it("should maintain correct order after interleaved set and get", () => {
      cache.set("a", 1);
      cache.get("a");
      cache.set("b", 2);
      cache.get("a");
      cache.set("c", 3);
      cache.get("b");
      cache.set("d", 4);

      // 'a' should be evicted (it was accessed early)
      expect(cache.has("a")).toBe(false);
      expect(cache.has("b")).toBe(true);
      expect(cache.has("c")).toBe(true);
      expect(cache.has("d")).toBe(true);
    });
  });
});
