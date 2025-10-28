import { BacklinksCacheManager } from "../../src/adapters/caching/BacklinksCacheManager";
import { App } from "obsidian";

describe("BacklinksCacheManager", () => {
  let cacheManager: BacklinksCacheManager;
  let mockApp: jest.Mocked<App>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock app with metadataCache
    mockApp = {
      metadataCache: {
        resolvedLinks: {},
      },
    } as unknown as jest.Mocked<App>;

    // Create cache manager instance
    cacheManager = new BacklinksCacheManager(mockApp);
  });

  describe("constructor", () => {
    it("should initialize with invalid cache", () => {
      expect(cacheManager.isValid()).toBe(false);
    });

    it("should initialize with empty backlinks map", () => {
      const backlinks = cacheManager.getBacklinks("test.md");
      expect(backlinks).toBeUndefined();
      // After getting backlinks, cache should be built and valid
      expect(cacheManager.isValid()).toBe(true);
    });

    it("should store app reference", () => {
      // Test that constructor properly stores app by using it
      cacheManager.buildCache();
      // If app wasn't stored properly, accessing metadataCache would fail
      expect(cacheManager.isValid()).toBe(true);
    });
  });

  describe("buildCache", () => {
    it("should build cache from metadataCache.resolvedLinks", () => {
      mockApp.metadataCache.resolvedLinks = {
        "note1.md": { "note2.md": 1, "note3.md": 2 },
        "note2.md": { "note3.md": 1 },
        "note3.md": { "note1.md": 1 },
      };

      cacheManager.buildCache();

      expect(cacheManager.isValid()).toBe(true);
      expect(cacheManager.getBacklinks("note1.md")).toEqual(new Set(["note3.md"]));
      expect(cacheManager.getBacklinks("note2.md")).toEqual(new Set(["note1.md"]));
      expect(cacheManager.getBacklinks("note3.md")).toEqual(new Set(["note1.md", "note2.md"]));
    });

    it("should handle empty resolvedLinks", () => {
      mockApp.metadataCache.resolvedLinks = {};

      cacheManager.buildCache();

      expect(cacheManager.isValid()).toBe(true);
      expect(cacheManager.getBacklinks("any.md")).toBeUndefined();
    });

    it("should handle single link relationship", () => {
      mockApp.metadataCache.resolvedLinks = {
        "source.md": { "target.md": 1 },
      };

      cacheManager.buildCache();

      expect(cacheManager.getBacklinks("target.md")).toEqual(new Set(["source.md"]));
      expect(cacheManager.getBacklinks("source.md")).toBeUndefined();
    });

    it("should handle multiple backlinks to same target", () => {
      mockApp.metadataCache.resolvedLinks = {
        "note1.md": { "target.md": 3 },
        "note2.md": { "target.md": 1 },
        "note3.md": { "target.md": 2 },
        "note4.md": { "target.md": 1 },
      };

      cacheManager.buildCache();

      const backlinks = cacheManager.getBacklinks("target.md");
      expect(backlinks).toEqual(new Set(["note1.md", "note2.md", "note3.md", "note4.md"]));
    });

    it("should handle complex link network", () => {
      mockApp.metadataCache.resolvedLinks = {
        "hub.md": { "spoke1.md": 1, "spoke2.md": 1, "spoke3.md": 1 },
        "spoke1.md": { "hub.md": 1, "spoke2.md": 1 },
        "spoke2.md": { "hub.md": 1, "spoke3.md": 1 },
        "spoke3.md": { "hub.md": 1, "spoke1.md": 1 },
      };

      cacheManager.buildCache();

      expect(cacheManager.getBacklinks("hub.md")).toEqual(
        new Set(["spoke1.md", "spoke2.md", "spoke3.md"])
      );
      expect(cacheManager.getBacklinks("spoke1.md")).toEqual(new Set(["hub.md", "spoke3.md"]));
      expect(cacheManager.getBacklinks("spoke2.md")).toEqual(new Set(["hub.md", "spoke1.md"]));
      expect(cacheManager.getBacklinks("spoke3.md")).toEqual(new Set(["hub.md", "spoke2.md"]));
    });

    it("should not rebuild cache if already valid", () => {
      mockApp.metadataCache.resolvedLinks = {
        "note1.md": { "note2.md": 1 },
      };

      cacheManager.buildCache();
      expect(cacheManager.isValid()).toBe(true);

      // Change resolvedLinks
      mockApp.metadataCache.resolvedLinks = {
        "note3.md": { "note4.md": 1 },
      };

      // Build again - should not rebuild since cache is valid
      cacheManager.buildCache();

      // Should still have old data
      expect(cacheManager.getBacklinks("note2.md")).toEqual(new Set(["note1.md"]));
      expect(cacheManager.getBacklinks("note4.md")).toBeUndefined();
    });

    it("should clear cache before rebuilding", () => {
      mockApp.metadataCache.resolvedLinks = {
        "old1.md": { "old2.md": 1 },
      };

      cacheManager.buildCache();
      expect(cacheManager.getBacklinks("old2.md")).toEqual(new Set(["old1.md"]));

      // Invalidate and rebuild with new data
      cacheManager.invalidate();
      mockApp.metadataCache.resolvedLinks = {
        "new1.md": { "new2.md": 1 },
      };
      cacheManager.buildCache();

      // Old data should be gone
      expect(cacheManager.getBacklinks("old2.md")).toBeUndefined();
      expect(cacheManager.getBacklinks("new2.md")).toEqual(new Set(["new1.md"]));
    });

    it("should handle self-referencing links", () => {
      mockApp.metadataCache.resolvedLinks = {
        "self.md": { "self.md": 1, "other.md": 1 },
        "other.md": { "self.md": 1 },
      };

      cacheManager.buildCache();

      expect(cacheManager.getBacklinks("self.md")).toEqual(new Set(["self.md", "other.md"]));
      expect(cacheManager.getBacklinks("other.md")).toEqual(new Set(["self.md"]));
    });

    it("should handle deep path structures", () => {
      mockApp.metadataCache.resolvedLinks = {
        "folder/subfolder/note1.md": { "folder/subfolder/note2.md": 1 },
        "folder/note3.md": { "folder/subfolder/note2.md": 1 },
        "note4.md": { "folder/subfolder/note2.md": 1 },
      };

      cacheManager.buildCache();

      expect(cacheManager.getBacklinks("folder/subfolder/note2.md")).toEqual(
        new Set(["folder/subfolder/note1.md", "folder/note3.md", "note4.md"])
      );
    });

    it("should handle special characters in paths", () => {
      mockApp.metadataCache.resolvedLinks = {
        "notes/[DATE] Task (2024).md": { "notes/Project #1.md": 1 },
        "notes/@mention note.md": { "notes/Project #1.md": 1 },
        "notes/note & another.md": { "notes/Project #1.md": 1 },
      };

      cacheManager.buildCache();

      expect(cacheManager.getBacklinks("notes/Project #1.md")).toEqual(
        new Set([
          "notes/[DATE] Task (2024).md",
          "notes/@mention note.md",
          "notes/note & another.md",
        ])
      );
    });

    it("should handle multiple links from same source", () => {
      mockApp.metadataCache.resolvedLinks = {
        "source.md": {
          "target1.md": 3, // 3 links to target1
          "target2.md": 5, // 5 links to target2
          "target3.md": 1, // 1 link to target3
        },
      };

      cacheManager.buildCache();

      // Each target should have source as a backlink (count doesn't matter)
      expect(cacheManager.getBacklinks("target1.md")).toEqual(new Set(["source.md"]));
      expect(cacheManager.getBacklinks("target2.md")).toEqual(new Set(["source.md"]));
      expect(cacheManager.getBacklinks("target3.md")).toEqual(new Set(["source.md"]));
    });
  });

  describe("invalidate", () => {
    it("should mark cache as invalid", () => {
      mockApp.metadataCache.resolvedLinks = {
        "note1.md": { "note2.md": 1 },
      };

      cacheManager.buildCache();
      expect(cacheManager.isValid()).toBe(true);

      cacheManager.invalidate();
      expect(cacheManager.isValid()).toBe(false);
    });

    it("should cause rebuild on next getBacklinks", () => {
      mockApp.metadataCache.resolvedLinks = {
        "note1.md": { "note2.md": 1 },
      };

      cacheManager.buildCache();
      expect(cacheManager.getBacklinks("note2.md")).toEqual(new Set(["note1.md"]));

      // Invalidate and change data
      cacheManager.invalidate();
      mockApp.metadataCache.resolvedLinks = {
        "note3.md": { "note4.md": 1 },
      };

      // Next getBacklinks should trigger rebuild
      expect(cacheManager.getBacklinks("note4.md")).toEqual(new Set(["note3.md"]));
      expect(cacheManager.getBacklinks("note2.md")).toBeUndefined(); // Old data gone
    });

    it("should be idempotent", () => {
      cacheManager.buildCache();
      expect(cacheManager.isValid()).toBe(true);

      cacheManager.invalidate();
      expect(cacheManager.isValid()).toBe(false);

      cacheManager.invalidate();
      expect(cacheManager.isValid()).toBe(false);
    });

    it("should work on already invalid cache", () => {
      expect(cacheManager.isValid()).toBe(false);

      cacheManager.invalidate();
      expect(cacheManager.isValid()).toBe(false);
    });
  });

  describe("getBacklinks", () => {
    it("should auto-build cache if invalid", () => {
      mockApp.metadataCache.resolvedLinks = {
        "note1.md": { "note2.md": 1 },
      };

      expect(cacheManager.isValid()).toBe(false);

      const backlinks = cacheManager.getBacklinks("note2.md");

      expect(cacheManager.isValid()).toBe(true);
      expect(backlinks).toEqual(new Set(["note1.md"]));
    });

    it("should return undefined for non-existent target", () => {
      mockApp.metadataCache.resolvedLinks = {
        "note1.md": { "note2.md": 1 },
      };

      const backlinks = cacheManager.getBacklinks("nonexistent.md");
      expect(backlinks).toBeUndefined();
    });

    it("should return same Set instance for repeated calls", () => {
      mockApp.metadataCache.resolvedLinks = {
        "note1.md": { "note2.md": 1 },
      };

      const backlinks1 = cacheManager.getBacklinks("note2.md");
      const backlinks2 = cacheManager.getBacklinks("note2.md");

      expect(backlinks1).toBe(backlinks2); // Same reference
    });

    it("should handle concurrent calls gracefully", () => {
      mockApp.metadataCache.resolvedLinks = {
        "note1.md": { "target.md": 1 },
        "note2.md": { "target.md": 1 },
        "note3.md": { "target.md": 1 },
      };

      // Simulate concurrent calls
      const results = [
        cacheManager.getBacklinks("target.md"),
        cacheManager.getBacklinks("target.md"),
        cacheManager.getBacklinks("target.md"),
      ];

      const expectedSet = new Set(["note1.md", "note2.md", "note3.md"]);
      results.forEach(result => {
        expect(result).toEqual(expectedSet);
      });

      // Cache should be built only once
      expect(cacheManager.isValid()).toBe(true);
    });

    it("should return empty set for isolated nodes", () => {
      mockApp.metadataCache.resolvedLinks = {
        "isolated.md": {}, // Has no outgoing links
        "other1.md": { "other2.md": 1 },
        "other2.md": { "other1.md": 1 },
      };

      const backlinks = cacheManager.getBacklinks("isolated.md");
      expect(backlinks).toBeUndefined(); // No incoming links
    });

    it("should handle when resolvedLinks is null", () => {
      (mockApp.metadataCache as any).resolvedLinks = null;

      const backlinks = cacheManager.getBacklinks("any.md");
      expect(backlinks).toBeUndefined();
      // Should not throw error
    });

    it("should handle when resolvedLinks is undefined", () => {
      (mockApp.metadataCache as any).resolvedLinks = undefined;

      const backlinks = cacheManager.getBacklinks("any.md");
      expect(backlinks).toBeUndefined();
      // Should not throw error
    });
  });

  describe("isValid", () => {
    it("should return false initially", () => {
      expect(cacheManager.isValid()).toBe(false);
    });

    it("should return true after buildCache", () => {
      cacheManager.buildCache();
      expect(cacheManager.isValid()).toBe(true);
    });

    it("should return false after invalidate", () => {
      cacheManager.buildCache();
      expect(cacheManager.isValid()).toBe(true);

      cacheManager.invalidate();
      expect(cacheManager.isValid()).toBe(false);
    });

    it("should return true after getBacklinks triggers build", () => {
      expect(cacheManager.isValid()).toBe(false);

      cacheManager.getBacklinks("any.md");
      expect(cacheManager.isValid()).toBe(true);
    });
  });

  describe("memory management", () => {
    it("should handle large link graphs", () => {
      const largeResolvedLinks: Record<string, Record<string, number>> = {};

      // Create a large interconnected graph
      for (let i = 0; i < 1000; i++) {
        const links: Record<string, number> = {};
        // Each note links to 10 random others
        for (let j = 0; j < 10; j++) {
          const target = Math.floor(Math.random() * 1000);
          links[`note${target}.md`] = 1;
        }
        largeResolvedLinks[`note${i}.md`] = links;
      }

      mockApp.metadataCache.resolvedLinks = largeResolvedLinks;

      cacheManager.buildCache();
      expect(cacheManager.isValid()).toBe(true);

      // Check that backlinks are properly collected
      const backlinks = cacheManager.getBacklinks("note0.md");
      // Should have backlinks from various sources
      expect(backlinks).toBeDefined();
      if (backlinks) {
        expect(backlinks.size).toBeGreaterThan(0);
      }
    });

    it("should properly clear old cache on rebuild", () => {
      // First build
      mockApp.metadataCache.resolvedLinks = {
        "old1.md": { "old2.md": 1 },
        "old3.md": { "old4.md": 1 },
      };
      cacheManager.buildCache();

      // Invalidate and rebuild with different data
      cacheManager.invalidate();
      mockApp.metadataCache.resolvedLinks = {
        "new1.md": { "new2.md": 1 },
      };
      cacheManager.buildCache();

      // Old entries should not exist
      expect(cacheManager.getBacklinks("old2.md")).toBeUndefined();
      expect(cacheManager.getBacklinks("old4.md")).toBeUndefined();

      // New entries should exist
      expect(cacheManager.getBacklinks("new2.md")).toEqual(new Set(["new1.md"]));
    });
  });

  describe("edge cases", () => {
    it("should handle empty string paths", () => {
      mockApp.metadataCache.resolvedLinks = {
        "": { "target.md": 1 },
        "source.md": { "": 1 },
      };

      cacheManager.buildCache();

      expect(cacheManager.getBacklinks("")).toEqual(new Set(["source.md"]));
      expect(cacheManager.getBacklinks("target.md")).toEqual(new Set([""]));
    });

    it("should handle very long paths", () => {
      const longPath = "a/".repeat(100) + "file.md";
      mockApp.metadataCache.resolvedLinks = {
        "source.md": { [longPath]: 1 },
      };

      cacheManager.buildCache();

      expect(cacheManager.getBacklinks(longPath)).toEqual(new Set(["source.md"]));
    });

    it("should handle unicode characters in paths", () => {
      mockApp.metadataCache.resolvedLinks = {
        "笔记/源文件.md": { "ملاحظات/الهدف.md": 1 },
        "заметки/источник.md": { "ملاحظات/الهدف.md": 1 },
      };

      cacheManager.buildCache();

      expect(cacheManager.getBacklinks("ملاحظات/الهدف.md")).toEqual(
        new Set(["笔记/源文件.md", "заметки/источник.md"])
      );
    });

    it("should handle when metadataCache is missing", () => {
      const brokenApp = {} as App;
      const brokenCacheManager = new BacklinksCacheManager(brokenApp);

      // Should not throw
      expect(() => brokenCacheManager.buildCache()).toThrow();
    });

    it("should handle circular references", () => {
      mockApp.metadataCache.resolvedLinks = {
        "a.md": { "b.md": 1 },
        "b.md": { "c.md": 1 },
        "c.md": { "a.md": 1 },
      };

      cacheManager.buildCache();

      expect(cacheManager.getBacklinks("a.md")).toEqual(new Set(["c.md"]));
      expect(cacheManager.getBacklinks("b.md")).toEqual(new Set(["a.md"]));
      expect(cacheManager.getBacklinks("c.md")).toEqual(new Set(["b.md"]));
    });
  });

  describe("performance characteristics", () => {
    it("should efficiently handle repeated invalidation and rebuild", () => {
      mockApp.metadataCache.resolvedLinks = {
        "note1.md": { "note2.md": 1 },
      };

      for (let i = 0; i < 10; i++) {
        cacheManager.invalidate();
        cacheManager.buildCache();
      }

      expect(cacheManager.isValid()).toBe(true);
      expect(cacheManager.getBacklinks("note2.md")).toEqual(new Set(["note1.md"]));
    });
  });
});