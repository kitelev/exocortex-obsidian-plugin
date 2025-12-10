import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { UUIDIndex, extractUuids, UUID_PATTERN } from "../../../src/index/UUIDIndex.js";

describe("UUIDIndex", () => {
  let index: UUIDIndex;

  const UUID_1 = "550e8400-e29b-41d4-a716-446655440000";
  const UUID_2 = "7a1b2c3d-4e5f-6789-abcd-ef0123456789";
  const UUID_3 = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

  const PATH_1 = "/vault/03 Knowledge/550e8400-e29b-41d4-a716-446655440000.md";
  const PATH_2 = "/vault/03 Knowledge/7a1b2c3d-4e5f-6789-abcd-ef0123456789 - Task.md";
  const PATH_3 = "/vault/Projects/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.md";

  beforeEach(() => {
    index = new UUIDIndex();
  });

  describe("add()", () => {
    it("should add a UUID-to-filepath mapping", () => {
      const result = index.add(UUID_1, PATH_1);

      expect(result).toBe(true);
      expect(index.size()).toBe(1);
      expect(index.resolve(UUID_1)).toBe(PATH_1);
    });

    it("should normalize UUID to lowercase", () => {
      index.add(UUID_1.toUpperCase(), PATH_1);

      expect(index.resolve(UUID_1.toLowerCase())).toBe(PATH_1);
      expect(index.resolve(UUID_1.toUpperCase())).toBe(PATH_1);
    });

    it("should handle duplicate UUID with same path", () => {
      index.add(UUID_1, PATH_1);
      const result = index.add(UUID_1, PATH_1);

      expect(result).toBe(true);
      expect(index.size()).toBe(1);
    });

    it("should warn and update on duplicate UUID with different path", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      index.add(UUID_1, PATH_1);
      index.add(UUID_1, PATH_2);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Duplicate UUID"),
      );
      expect(index.resolve(UUID_1)).toBe(PATH_2); // Updated to new path
      expect(index.size()).toBe(1);

      consoleSpy.mockRestore();
    });

    it("should maintain reverse index", () => {
      index.add(UUID_1, PATH_1);

      expect(index.getUuidByPath(PATH_1)).toBe(UUID_1.toLowerCase());
    });
  });

  describe("resolve()", () => {
    beforeEach(() => {
      index.add(UUID_1, PATH_1);
      index.add(UUID_2, PATH_2);
    });

    it("should resolve UUID to filepath", () => {
      expect(index.resolve(UUID_1)).toBe(PATH_1);
      expect(index.resolve(UUID_2)).toBe(PATH_2);
    });

    it("should be case-insensitive", () => {
      expect(index.resolve(UUID_1.toLowerCase())).toBe(PATH_1);
      expect(index.resolve(UUID_1.toUpperCase())).toBe(PATH_1);
      expect(index.resolve("550E8400-e29B-41d4-A716-446655440000")).toBe(PATH_1);
    });

    it("should return null for non-existent UUID", () => {
      expect(index.resolve(UUID_3)).toBeNull();
      expect(index.resolve("00000000-0000-0000-0000-000000000000")).toBeNull();
    });

    it("should track lookup statistics", () => {
      index.resolve(UUID_1); // Hit
      index.resolve(UUID_2); // Hit
      index.resolve(UUID_3); // Miss

      const stats = index.getStats();
      expect(stats.lookupCount).toBe(3);
      expect(stats.hitCount).toBe(2);
      expect(stats.hitRate).toBeCloseTo(2 / 3);
    });
  });

  describe("resolvePartial()", () => {
    beforeEach(() => {
      index.add(UUID_1, PATH_1);
      index.add(UUID_2, PATH_2);
      index.add(UUID_3, PATH_3);
    });

    it("should find all matches for partial UUID", () => {
      const matches = index.resolvePartial("550e8400");
      expect(matches).toHaveLength(1);
      expect(matches[0]).toBe(PATH_1);
    });

    it("should be case-insensitive", () => {
      const matchesLower = index.resolvePartial("550e");
      const matchesUpper = index.resolvePartial("550E");

      expect(matchesLower).toEqual(matchesUpper);
    });

    it("should find multiple matches", () => {
      // Add another UUID starting with 550e
      index.add("550e1111-2222-3333-4444-555566667777", "/vault/other.md");

      const matches = index.resolvePartial("550e");
      expect(matches).toHaveLength(2);
    });

    it("should return empty array when no matches", () => {
      const matches = index.resolvePartial("zzzzz");
      expect(matches).toHaveLength(0);
    });
  });

  describe("getUuidByPath()", () => {
    it("should return UUID for given filepath", () => {
      index.add(UUID_1, PATH_1);

      expect(index.getUuidByPath(PATH_1)).toBe(UUID_1.toLowerCase());
    });

    it("should return null for unknown filepath", () => {
      expect(index.getUuidByPath("/unknown/path.md")).toBeNull();
    });
  });

  describe("removeByPath()", () => {
    beforeEach(() => {
      index.add(UUID_1, PATH_1);
      index.add(UUID_2, PATH_2);
    });

    it("should remove entry by filepath", () => {
      const result = index.removeByPath(PATH_1);

      expect(result).toBe(true);
      expect(index.resolve(UUID_1)).toBeNull();
      expect(index.getUuidByPath(PATH_1)).toBeNull();
      expect(index.size()).toBe(1);
    });

    it("should return false for unknown filepath", () => {
      const result = index.removeByPath("/unknown/path.md");
      expect(result).toBe(false);
    });

    it("should not affect other entries", () => {
      index.removeByPath(PATH_1);

      expect(index.resolve(UUID_2)).toBe(PATH_2);
    });
  });

  describe("remove()", () => {
    beforeEach(() => {
      index.add(UUID_1, PATH_1);
    });

    it("should remove entry by UUID", () => {
      const result = index.remove(UUID_1);

      expect(result).toBe(true);
      expect(index.resolve(UUID_1)).toBeNull();
      expect(index.getUuidByPath(PATH_1)).toBeNull();
    });

    it("should be case-insensitive", () => {
      const result = index.remove(UUID_1.toUpperCase());
      expect(result).toBe(true);
    });

    it("should return false for unknown UUID", () => {
      const result = index.remove(UUID_2);
      expect(result).toBe(false);
    });
  });

  describe("exists()", () => {
    it("should return true for existing UUID", () => {
      index.add(UUID_1, PATH_1);
      expect(index.exists(UUID_1)).toBe(true);
    });

    it("should be case-insensitive", () => {
      index.add(UUID_1, PATH_1);
      expect(index.exists(UUID_1.toUpperCase())).toBe(true);
    });

    it("should return false for non-existent UUID", () => {
      expect(index.exists(UUID_1)).toBe(false);
    });
  });

  describe("getAllUUIDs()", () => {
    it("should return all indexed UUIDs", () => {
      index.add(UUID_1, PATH_1);
      index.add(UUID_2, PATH_2);

      const uuids = index.getAllUUIDs();

      expect(uuids).toHaveLength(2);
      expect(uuids).toContain(UUID_1.toLowerCase());
      expect(uuids).toContain(UUID_2.toLowerCase());
    });

    it("should return empty array when index is empty", () => {
      expect(index.getAllUUIDs()).toHaveLength(0);
    });
  });

  describe("getAllPaths()", () => {
    it("should return all indexed filepaths", () => {
      index.add(UUID_1, PATH_1);
      index.add(UUID_2, PATH_2);

      const paths = index.getAllPaths();

      expect(paths).toHaveLength(2);
      expect(paths).toContain(PATH_1);
      expect(paths).toContain(PATH_2);
    });
  });

  describe("size()", () => {
    it("should return the number of entries", () => {
      expect(index.size()).toBe(0);

      index.add(UUID_1, PATH_1);
      expect(index.size()).toBe(1);

      index.add(UUID_2, PATH_2);
      expect(index.size()).toBe(2);
    });
  });

  describe("clear()", () => {
    it("should remove all entries", () => {
      index.add(UUID_1, PATH_1);
      index.add(UUID_2, PATH_2);

      index.clear();

      expect(index.size()).toBe(0);
      expect(index.resolve(UUID_1)).toBeNull();
      expect(index.getUuidByPath(PATH_1)).toBeNull();
    });

    it("should reset statistics", () => {
      index.add(UUID_1, PATH_1);
      index.resolve(UUID_1);

      index.clear();

      const stats = index.getStats();
      expect(stats.lookupCount).toBe(0);
      expect(stats.hitCount).toBe(0);
    });
  });

  describe("getStats()", () => {
    it("should return initial statistics", () => {
      const stats = index.getStats();

      expect(stats.size).toBe(0);
      expect(stats.lookupCount).toBe(0);
      expect(stats.hitCount).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.buildTimeMs).toBe(0);
      expect(stats.lastBuildAt).toBeNull();
    });

    it("should track hit rate correctly", () => {
      index.add(UUID_1, PATH_1);

      index.resolve(UUID_1); // Hit
      index.resolve(UUID_1); // Hit
      index.resolve(UUID_2); // Miss

      const stats = index.getStats();
      expect(stats.hitRate).toBeCloseTo(2 / 3);
    });
  });

  describe("toJSON() / fromJSON()", () => {
    beforeEach(() => {
      index.add(UUID_1, PATH_1);
      index.add(UUID_2, PATH_2);
    });

    it("should export index to JSON", () => {
      const json = index.toJSON();

      expect(json.entries).toHaveLength(2);
      expect(json.entries).toContainEqual({
        uuid: UUID_1.toLowerCase(),
        filepath: PATH_1,
      });
    });

    it("should import index from JSON", () => {
      const json = index.toJSON();

      const newIndex = new UUIDIndex();
      const count = newIndex.fromJSON(json);

      expect(count).toBe(2);
      expect(newIndex.resolve(UUID_1)).toBe(PATH_1);
      expect(newIndex.resolve(UUID_2)).toBe(PATH_2);
    });

    it("should clear existing entries on import", () => {
      const newIndex = new UUIDIndex();
      newIndex.add(UUID_3, PATH_3);

      newIndex.fromJSON({ entries: [{ uuid: UUID_1, filepath: PATH_1 }] });

      expect(newIndex.size()).toBe(1);
      expect(newIndex.resolve(UUID_3)).toBeNull();
    });
  });
});

describe("extractUuids()", () => {
  it("should extract single UUID from text", () => {
    const text = "File: 550e8400-e29b-41d4-a716-446655440000.md";
    const uuids = extractUuids(text);

    expect(uuids).toHaveLength(1);
    expect(uuids[0]).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("should extract multiple UUIDs", () => {
    const text = `
      Parent: 550e8400-e29b-41d4-a716-446655440000
      Child: 7a1b2c3d-4e5f-6789-abcd-ef0123456789
    `;
    const uuids = extractUuids(text);

    expect(uuids).toHaveLength(2);
  });

  it("should normalize UUIDs to lowercase", () => {
    const text = "UUID: 550E8400-E29B-41D4-A716-446655440000";
    const uuids = extractUuids(text);

    expect(uuids[0]).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("should return empty array when no UUIDs found", () => {
    const text = "No UUIDs here, just regular text.";
    const uuids = extractUuids(text);

    expect(uuids).toHaveLength(0);
  });
});

describe("UUID_PATTERN", () => {
  it("should match valid UUID v4 format", () => {
    const validUuids = [
      "550e8400-e29b-41d4-a716-446655440000",
      "7a1b2c3d-4e5f-6789-abcd-ef0123456789",
      "AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE",
    ];

    for (const uuid of validUuids) {
      expect(uuid).toMatch(UUID_PATTERN);
    }
  });

  it("should not match invalid formats", () => {
    const invalidUuids = [
      "not-a-uuid",
      "550e8400-e29b-41d4-a716", // Too short
      "550e8400e29b41d4a716446655440000", // No dashes
      "gggggggg-gggg-gggg-gggg-gggggggggggg", // Invalid characters
    ];

    for (const uuid of invalidUuids) {
      UUID_PATTERN.lastIndex = 0; // Reset regex state
      expect(uuid).not.toMatch(UUID_PATTERN);
    }
  });
});

describe("UUIDIndex Performance", () => {
  it("should provide fast lookups even with many entries", () => {
    const largeIndex = new UUIDIndex();

    // Add 10,000 entries
    for (let i = 0; i < 10000; i++) {
      const uuid = `${i.toString(16).padStart(8, "0")}-0000-0000-0000-000000000000`;
      largeIndex.add(uuid, `/vault/file-${i}.md`);
    }

    const targetUuid = "00001000-0000-0000-0000-000000000000";
    largeIndex.add(targetUuid, "/vault/target.md");

    // Measure lookup time
    const start = performance.now();
    const result = largeIndex.resolve(targetUuid);
    const elapsed = performance.now() - start;

    expect(result).toBe("/vault/target.md");
    expect(elapsed).toBeLessThan(10); // Should be < 10ms (O(1) lookup)
  });

  it("should build index efficiently", () => {
    const largeIndex = new UUIDIndex();

    // Simulate adding many entries (without file system)
    const startBuild = performance.now();
    for (let i = 0; i < 10000; i++) {
      const uuid = `${i.toString(16).padStart(8, "0")}-0000-0000-0000-000000000000`;
      largeIndex.add(uuid, `/vault/file-${i}.md`);
    }
    const buildTime = performance.now() - startBuild;

    expect(largeIndex.size()).toBe(10000);
    expect(buildTime).toBeLessThan(1000); // Should be < 1s for 10k entries
  });
});
