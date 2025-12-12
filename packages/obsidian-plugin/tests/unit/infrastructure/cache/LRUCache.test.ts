import { LRUCache } from "../../../../src/infrastructure/cache/LRUCache";

describe("LRUCache", () => {
  describe("constructor", () => {
    it("should create a cache with default capacity of 1000", () => {
      const cache = new LRUCache<string, number>();
      expect(cache.capacity).toBe(1000);
    });

    it("should create a cache with specified capacity (number argument)", () => {
      const cache = new LRUCache<string, number>(50);
      expect(cache.capacity).toBe(50);
    });

    it("should create a cache with options object", () => {
      const cache = new LRUCache<string, number>({ maxEntries: 100, ttl: 5000 });
      expect(cache.capacity).toBe(100);
    });

    it("should throw error if maxEntries is less than 1 (number argument)", () => {
      expect(() => new LRUCache(0)).toThrow("maxEntries must be at least 1");
      expect(() => new LRUCache(-1)).toThrow("maxEntries must be at least 1");
    });

    it("should throw error if maxEntries is less than 1 (options argument)", () => {
      expect(() => new LRUCache({ maxEntries: 0 })).toThrow("maxEntries must be at least 1");
      expect(() => new LRUCache({ maxEntries: -1 })).toThrow("maxEntries must be at least 1");
    });
  });

  describe("set and get", () => {
    it("should store and retrieve values", () => {
      const cache = new LRUCache<string, string>(10);
      cache.set("key1", "value1");
      expect(cache.get("key1")).toBe("value1");
    });

    it("should return undefined for non-existent keys", () => {
      const cache = new LRUCache<string, string>(10);
      expect(cache.get("nonexistent")).toBeUndefined();
    });

    it("should update value when setting same key", () => {
      const cache = new LRUCache<string, string>(10);
      cache.set("key1", "value1");
      cache.set("key1", "value2");
      expect(cache.get("key1")).toBe("value2");
      expect(cache.size).toBe(1);
    });

    it("should track size correctly", () => {
      const cache = new LRUCache<string, number>(10);
      expect(cache.size).toBe(0);
      cache.set("a", 1);
      expect(cache.size).toBe(1);
      cache.set("b", 2);
      expect(cache.size).toBe(2);
      cache.set("a", 3); // Update existing
      expect(cache.size).toBe(2);
    });
  });

  describe("LRU eviction", () => {
    it("should evict oldest entry when at capacity", () => {
      const cache = new LRUCache<string, number>(3);
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);
      // At capacity, adding new entry should evict "a"
      cache.set("d", 4);

      expect(cache.get("a")).toBeUndefined();
      expect(cache.get("b")).toBe(2);
      expect(cache.get("c")).toBe(3);
      expect(cache.get("d")).toBe(4);
      expect(cache.size).toBe(3);
    });

    it("should update LRU order on get", () => {
      const cache = new LRUCache<string, number>(3);
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      // Access "a", making it most recently used
      cache.get("a");

      // Add new entry - should evict "b" (now oldest)
      cache.set("d", 4);

      expect(cache.get("a")).toBe(1); // Still exists
      expect(cache.get("b")).toBeUndefined(); // Evicted
      expect(cache.get("c")).toBe(3);
      expect(cache.get("d")).toBe(4);
    });

    it("should update LRU order on set of existing key", () => {
      const cache = new LRUCache<string, number>(3);
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      // Update "a", making it most recently used
      cache.set("a", 10);

      // Add new entry - should evict "b" (now oldest)
      cache.set("d", 4);

      expect(cache.get("a")).toBe(10);
      expect(cache.get("b")).toBeUndefined();
      expect(cache.get("c")).toBe(3);
      expect(cache.get("d")).toBe(4);
    });
  });

  describe("has", () => {
    it("should return true for existing keys", () => {
      const cache = new LRUCache<string, number>(10);
      cache.set("key1", 1);
      expect(cache.has("key1")).toBe(true);
    });

    it("should return false for non-existent keys", () => {
      const cache = new LRUCache<string, number>(10);
      expect(cache.has("key1")).toBe(false);
    });

    it("should not affect LRU order", () => {
      const cache = new LRUCache<string, number>(3);
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      // has() should not change order
      cache.has("a");

      // Add new entry - should still evict "a"
      cache.set("d", 4);

      expect(cache.has("a")).toBe(false);
    });
  });

  describe("delete", () => {
    it("should remove existing entry", () => {
      const cache = new LRUCache<string, number>(10);
      cache.set("key1", 1);
      expect(cache.delete("key1")).toBe(true);
      expect(cache.has("key1")).toBe(false);
      expect(cache.size).toBe(0);
    });

    it("should return false for non-existent key", () => {
      const cache = new LRUCache<string, number>(10);
      expect(cache.delete("nonexistent")).toBe(false);
    });
  });

  describe("clear and cleanup", () => {
    it("should clear all entries", () => {
      const cache = new LRUCache<string, number>(10);
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      cache.clear();

      expect(cache.size).toBe(0);
      expect(cache.get("a")).toBeUndefined();
    });

    it("should cleanup all entries and reset stats", () => {
      const cache = new LRUCache<string, number>(3);
      cache.set("a", 1);
      cache.set("b", 2);
      cache.get("a"); // Hit
      cache.get("nonexistent"); // Miss
      cache.set("c", 3);
      cache.set("d", 4); // Eviction

      const statsBefore = cache.getStats();
      expect(statsBefore.hits).toBe(1);
      expect(statsBefore.misses).toBe(1);
      expect(statsBefore.evictions).toBe(1);

      cache.cleanup();

      expect(cache.size).toBe(0);
      const statsAfter = cache.getStats();
      expect(statsAfter.hits).toBe(0);
      expect(statsAfter.misses).toBe(0);
      expect(statsAfter.evictions).toBe(0);
      expect(statsAfter.expirations).toBe(0);
    });
  });

  describe("statistics", () => {
    it("should track hits correctly", () => {
      const cache = new LRUCache<string, number>(10);
      cache.set("key", 1);

      cache.get("key");
      cache.get("key");
      cache.get("key");

      expect(cache.getStats().hits).toBe(3);
    });

    it("should track misses correctly", () => {
      const cache = new LRUCache<string, number>(10);

      cache.get("nonexistent1");
      cache.get("nonexistent2");

      expect(cache.getStats().misses).toBe(2);
    });

    it("should track evictions correctly", () => {
      const cache = new LRUCache<string, number>(2);
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3); // Evicts a
      cache.set("d", 4); // Evicts b

      expect(cache.getStats().evictions).toBe(2);
    });

    it("should include size and capacity in stats", () => {
      const cache = new LRUCache<string, number>(100);
      cache.set("a", 1);
      cache.set("b", 2);

      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.capacity).toBe(100);
    });

    it("should reset stats", () => {
      const cache = new LRUCache<string, number>(2);
      cache.set("a", 1);
      cache.get("a");
      cache.get("nonexistent");
      cache.set("b", 2);
      cache.set("c", 3); // Eviction

      cache.resetStats();

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.evictions).toBe(0);
      // Size should remain
      expect(stats.size).toBe(2);
    });
  });

  describe("iteration", () => {
    it("should iterate keys in LRU order (oldest first)", () => {
      const cache = new LRUCache<string, number>(10);
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      const keys = Array.from(cache.keys());
      expect(keys).toEqual(["a", "b", "c"]);
    });

    it("should iterate values in LRU order", () => {
      const cache = new LRUCache<string, number>(10);
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      const values = Array.from(cache.values());
      expect(values).toEqual([1, 2, 3]);
    });

    it("should iterate entries in LRU order", () => {
      const cache = new LRUCache<string, number>(10);
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

    it("should support forEach", () => {
      const cache = new LRUCache<string, number>(10);
      cache.set("a", 1);
      cache.set("b", 2);

      const collected: Array<[string, number]> = [];
      cache.forEach((value, key) => {
        collected.push([key, value]);
      });

      expect(collected).toEqual([
        ["a", 1],
        ["b", 2],
      ]);
    });
  });

  describe("edge cases", () => {
    it("should handle capacity of 1", () => {
      const cache = new LRUCache<string, number>(1);
      cache.set("a", 1);
      expect(cache.get("a")).toBe(1);

      cache.set("b", 2);
      expect(cache.get("a")).toBeUndefined();
      expect(cache.get("b")).toBe(2);
      expect(cache.size).toBe(1);
    });

    it("should handle undefined values", () => {
      const cache = new LRUCache<string, undefined>(10);
      cache.set("key", undefined);
      // Note: undefined values are treated as cache misses by design
      // This is a known limitation - use has() to check existence
      expect(cache.has("key")).toBe(true);
    });

    it("should handle complex objects as values", () => {
      interface UserData {
        name: string;
        age: number;
      }
      const cache = new LRUCache<string, UserData>(10);
      const user = { name: "Alice", age: 30 };
      cache.set("user1", user);

      const retrieved = cache.get("user1");
      expect(retrieved).toEqual(user);
      expect(retrieved).toBe(user); // Same reference
    });

    it("should handle numeric keys", () => {
      const cache = new LRUCache<number, string>(10);
      cache.set(1, "one");
      cache.set(2, "two");

      expect(cache.get(1)).toBe("one");
      expect(cache.get(2)).toBe("two");
    });
  });

  describe("TTL (time-to-live)", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should return value before TTL expires", () => {
      const cache = new LRUCache<string, number>({ maxEntries: 10, ttl: 1000 });
      cache.set("key", 42);

      // Advance time by 500ms (within TTL)
      jest.advanceTimersByTime(500);

      expect(cache.get("key")).toBe(42);
    });

    it("should return undefined after TTL expires", () => {
      const cache = new LRUCache<string, number>({ maxEntries: 10, ttl: 1000 });
      cache.set("key", 42);

      // Advance time beyond TTL
      jest.advanceTimersByTime(1001);

      expect(cache.get("key")).toBeUndefined();
    });

    it("should track expirations in stats", () => {
      const cache = new LRUCache<string, number>({ maxEntries: 10, ttl: 1000 });
      cache.set("key", 42);

      // Advance time beyond TTL
      jest.advanceTimersByTime(1001);

      cache.get("key"); // Should trigger expiration

      expect(cache.getStats().expirations).toBe(1);
      expect(cache.getStats().misses).toBe(1);
    });

    it("should reset TTL on get (access refreshes timestamp)", () => {
      const cache = new LRUCache<string, number>({ maxEntries: 10, ttl: 1000 });
      cache.set("key", 42);

      // Advance time by 800ms
      jest.advanceTimersByTime(800);

      // Access the key (should refresh timestamp)
      expect(cache.get("key")).toBe(42);

      // Advance time by another 800ms (total 1600ms from original set, but only 800ms from last access)
      jest.advanceTimersByTime(800);

      // Should still be valid because timestamp was refreshed
      expect(cache.get("key")).toBe(42);
    });

    it("should return false from has() after TTL expires", () => {
      const cache = new LRUCache<string, number>({ maxEntries: 10, ttl: 1000 });
      cache.set("key", 42);

      expect(cache.has("key")).toBe(true);

      jest.advanceTimersByTime(1001);

      expect(cache.has("key")).toBe(false);
      expect(cache.getStats().expirations).toBe(1);
    });

    it("should not expire entries when TTL is not set", () => {
      const cache = new LRUCache<string, number>(10); // No TTL
      cache.set("key", 42);

      // Advance time significantly
      jest.advanceTimersByTime(1000000);

      expect(cache.get("key")).toBe(42);
      expect(cache.getStats().expirations).toBe(0);
    });

    it("should prune expired entries", () => {
      const cache = new LRUCache<string, number>({ maxEntries: 10, ttl: 1000 });
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      jest.advanceTimersByTime(1001);

      const removed = cache.pruneExpired();

      expect(removed).toBe(3);
      expect(cache.size).toBe(0);
      expect(cache.getStats().expirations).toBe(3);
    });

    it("should not prune entries when TTL not exceeded", () => {
      const cache = new LRUCache<string, number>({ maxEntries: 10, ttl: 1000 });
      cache.set("a", 1);
      cache.set("b", 2);

      jest.advanceTimersByTime(500);

      const removed = cache.pruneExpired();

      expect(removed).toBe(0);
      expect(cache.size).toBe(2);
    });

    it("should return 0 from pruneExpired when no TTL configured", () => {
      const cache = new LRUCache<string, number>(10); // No TTL
      cache.set("a", 1);
      cache.set("b", 2);

      jest.advanceTimersByTime(1000000);

      const removed = cache.pruneExpired();

      expect(removed).toBe(0);
      expect(cache.size).toBe(2);
    });
  });
});
