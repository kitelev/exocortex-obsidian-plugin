import { BacklinksCacheManager } from "../../src/adapters/caching/BacklinksCacheManager";
import { App } from "obsidian";

describe("BacklinksCacheManager", () => {
  let cacheManager: BacklinksCacheManager;
  let mockApp: App;
  let mockResolvedLinks: Record<string, Record<string, number>>;

  beforeEach(() => {
    // Create mock resolved links structure
    mockResolvedLinks = {
      "note1.md": {
        "note2.md": 2,
        "note3.md": 1,
      },
      "note2.md": {
        "note3.md": 3,
        "note4.md": 1,
      },
      "note3.md": {
        "note4.md": 2,
      },
      "note4.md": {
        "note1.md": 1,
      },
    };

    // Mock Obsidian App
    mockApp = {
      metadataCache: {
        resolvedLinks: mockResolvedLinks,
      },
    } as any;

    cacheManager = new BacklinksCacheManager(mockApp);
  });

  describe("constructor", () => {
    it("should initialize with invalid cache", () => {
      expect(cacheManager.isValid()).toBe(false);
    });

    it("should initialize with empty backlinks cache", () => {
      expect(cacheManager.getBacklinks("any-file.md")).toBeUndefined();
    });
  });

  describe("buildCache", () => {
    it("should build backlinks cache from resolved links", () => {
      cacheManager.buildCache();

      // Check backlinks for note2.md (should have note1.md pointing to it)
      const note2Backlinks = cacheManager.getBacklinks("note2.md");
      expect(note2Backlinks).toBeDefined();
      expect(note2Backlinks?.has("note1.md")).toBe(true);
      expect(note2Backlinks?.size).toBe(1);

      // Check backlinks for note3.md (should have note1.md and note2.md)
      const note3Backlinks = cacheManager.getBacklinks("note3.md");
      expect(note3Backlinks).toBeDefined();
      expect(note3Backlinks?.has("note1.md")).toBe(true);
      expect(note3Backlinks?.has("note2.md")).toBe(true);
      expect(note3Backlinks?.size).toBe(2);

      // Check backlinks for note4.md (should have note2.md and note3.md)
      const note4Backlinks = cacheManager.getBacklinks("note4.md");
      expect(note4Backlinks).toBeDefined();
      expect(note4Backlinks?.has("note2.md")).toBe(true);
      expect(note4Backlinks?.has("note3.md")).toBe(true);
      expect(note4Backlinks?.size).toBe(2);

      // Check backlinks for note1.md (should have note4.md)
      const note1Backlinks = cacheManager.getBacklinks("note1.md");
      expect(note1Backlinks).toBeDefined();
      expect(note1Backlinks?.has("note4.md")).toBe(true);
      expect(note1Backlinks?.size).toBe(1);
    });

    it("should mark cache as valid after building", () => {
      expect(cacheManager.isValid()).toBe(false);
      cacheManager.buildCache();
      expect(cacheManager.isValid()).toBe(true);
    });

    it("should skip building if cache is already valid", () => {
      // Build cache once
      cacheManager.buildCache();
      expect(cacheManager.isValid()).toBe(true);

      // Modify resolved links
      mockApp.metadataCache.resolvedLinks["note5.md"] = { "note1.md": 1 };

      // Build again - should skip because cache is valid
      cacheManager.buildCache();

      // note1.md should not have note5.md as backlink because cache wasn't rebuilt
      const note1Backlinks = cacheManager.getBacklinks("note1.md");
      expect(note1Backlinks?.has("note5.md")).toBe(false);
    });

    it("should handle empty resolved links", () => {
      mockApp.metadataCache.resolvedLinks = {};
      cacheManager.buildCache();

      expect(cacheManager.isValid()).toBe(true);
      expect(cacheManager.getBacklinks("any.md")).toBeUndefined();
    });

    it("should handle files with no links", () => {
      mockApp.metadataCache.resolvedLinks = {
        "isolated.md": {},
      };
      cacheManager.buildCache();

      expect(cacheManager.isValid()).toBe(true);
      expect(cacheManager.getBacklinks("isolated.md")).toBeUndefined();
    });

    it("should accumulate backlinks from multiple sources", () => {
      mockApp.metadataCache.resolvedLinks = {
        "source1.md": {
          "target.md": 1,
        },
        "source2.md": {
          "target.md": 2,
        },
        "source3.md": {
          "target.md": 3,
          "other.md": 1,
        },
      };

      cacheManager.buildCache();

      const targetBacklinks = cacheManager.getBacklinks("target.md");
      expect(targetBacklinks).toBeDefined();
      expect(targetBacklinks?.size).toBe(3);
      expect(targetBacklinks?.has("source1.md")).toBe(true);
      expect(targetBacklinks?.has("source2.md")).toBe(true);
      expect(targetBacklinks?.has("source3.md")).toBe(true);
    });
  });

  describe("invalidate", () => {
    it("should mark cache as invalid", () => {
      cacheManager.buildCache();
      expect(cacheManager.isValid()).toBe(true);

      cacheManager.invalidate();
      expect(cacheManager.isValid()).toBe(false);
    });

    it("should not clear the cache data immediately", () => {
      cacheManager.buildCache();
      const backlinks = cacheManager.getBacklinks("note3.md");
      expect(backlinks).toBeDefined();

      cacheManager.invalidate();

      // Cache data still exists, but will be rebuilt on next access
      // This is because getBacklinks calls buildCache internally
      const backlinksAfterInvalidate = cacheManager.getBacklinks("note3.md");
      expect(backlinksAfterInvalidate).toBeDefined();
    });

    it("should trigger rebuild on next getBacklinks call", () => {
      cacheManager.buildCache();
      expect(cacheManager.isValid()).toBe(true);

      // Add new link
      mockApp.metadataCache.resolvedLinks["note5.md"] = { "note1.md": 1 };

      // Invalidate cache
      cacheManager.invalidate();
      expect(cacheManager.isValid()).toBe(false);

      // Get backlinks - should rebuild cache
      const note1Backlinks = cacheManager.getBacklinks("note1.md");
      expect(cacheManager.isValid()).toBe(true);
      expect(note1Backlinks?.has("note5.md")).toBe(true);
    });
  });

  describe("getBacklinks", () => {
    it("should return undefined for files with no backlinks", () => {
      cacheManager.buildCache();
      const backlinks = cacheManager.getBacklinks("non-existent.md");
      expect(backlinks).toBeUndefined();
    });

    it("should return Set of backlinks for files with backlinks", () => {
      cacheManager.buildCache();
      const backlinks = cacheManager.getBacklinks("note3.md");

      expect(backlinks).toBeDefined();
      expect(backlinks).toBeInstanceOf(Set);
      expect(backlinks?.size).toBe(2);
      expect(backlinks?.has("note1.md")).toBe(true);
      expect(backlinks?.has("note2.md")).toBe(true);
    });

    it("should automatically build cache if invalid", () => {
      expect(cacheManager.isValid()).toBe(false);

      const backlinks = cacheManager.getBacklinks("note3.md");

      expect(cacheManager.isValid()).toBe(true);
      expect(backlinks).toBeDefined();
      expect(backlinks?.size).toBe(2);
    });

    it("should not rebuild cache if already valid", () => {
      cacheManager.buildCache();
      const initialBacklinks = cacheManager.getBacklinks("note3.md");

      // Modify resolved links (but cache won't see this because it's valid)
      mockApp.metadataCache.resolvedLinks["note5.md"] = { "note3.md": 1 };

      const backlinksAfter = cacheManager.getBacklinks("note3.md");

      // Should be same as before because cache wasn't rebuilt
      expect(backlinksAfter).toEqual(initialBacklinks);
      expect(backlinksAfter?.has("note5.md")).toBe(false);
    });

    it("should handle circular references", () => {
      mockApp.metadataCache.resolvedLinks = {
        "a.md": { "b.md": 1 },
        "b.md": { "c.md": 1 },
        "c.md": { "a.md": 1 },
      };

      cacheManager.buildCache();

      expect(cacheManager.getBacklinks("a.md")?.has("c.md")).toBe(true);
      expect(cacheManager.getBacklinks("b.md")?.has("a.md")).toBe(true);
      expect(cacheManager.getBacklinks("c.md")?.has("b.md")).toBe(true);
    });

    it("should handle self-references", () => {
      mockApp.metadataCache.resolvedLinks = {
        "self.md": { "self.md": 1, "other.md": 1 },
      };

      cacheManager.buildCache();

      const selfBacklinks = cacheManager.getBacklinks("self.md");
      expect(selfBacklinks?.has("self.md")).toBe(true);
      expect(selfBacklinks?.size).toBe(1);
    });
  });

  describe("isValid", () => {
    it("should return false initially", () => {
      expect(cacheManager.isValid()).toBe(false);
    });

    it("should return true after building cache", () => {
      cacheManager.buildCache();
      expect(cacheManager.isValid()).toBe(true);
    });

    it("should return false after invalidation", () => {
      cacheManager.buildCache();
      expect(cacheManager.isValid()).toBe(true);
      cacheManager.invalidate();
      expect(cacheManager.isValid()).toBe(false);
    });

    it("should return true after rebuilding invalidated cache", () => {
      cacheManager.buildCache();
      cacheManager.invalidate();
      expect(cacheManager.isValid()).toBe(false);
      cacheManager.buildCache();
      expect(cacheManager.isValid()).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle undefined resolved links", () => {
      mockApp.metadataCache.resolvedLinks = undefined as any;
      expect(() => cacheManager.buildCache()).not.toThrow();
      expect(cacheManager.isValid()).toBe(true);
    });

    it("should handle null resolved links", () => {
      mockApp.metadataCache.resolvedLinks = null as any;
      expect(() => cacheManager.buildCache()).not.toThrow();
      expect(cacheManager.isValid()).toBe(true);
    });

    it("should handle files with many backlinks", () => {
      const manyBacklinks: Record<string, Record<string, number>> = {};
      for (let i = 0; i < 100; i++) {
        manyBacklinks[`source${i}.md`] = { "popular.md": 1 };
      }

      mockApp.metadataCache.resolvedLinks = manyBacklinks;
      cacheManager.buildCache();

      const popularBacklinks = cacheManager.getBacklinks("popular.md");
      expect(popularBacklinks?.size).toBe(100);
    });

    it("should handle deeply nested paths", () => {
      mockApp.metadataCache.resolvedLinks = {
        "folder1/folder2/folder3/deep.md": {
          "other/path/target.md": 1,
        },
      };

      cacheManager.buildCache();

      const targetBacklinks = cacheManager.getBacklinks("other/path/target.md");
      expect(targetBacklinks?.has("folder1/folder2/folder3/deep.md")).toBe(
        true,
      );
    });

    it("should handle special characters in file names", () => {
      mockApp.metadataCache.resolvedLinks = {
        "file with spaces.md": {
          "target[brackets].md": 1,
        },
        "emoji-😀.md": {
          "target[brackets].md": 1,
        },
      };

      cacheManager.buildCache();

      const targetBacklinks = cacheManager.getBacklinks("target[brackets].md");
      expect(targetBacklinks?.has("file with spaces.md")).toBe(true);
      expect(targetBacklinks?.has("emoji-😀.md")).toBe(true);
    });
  });
});
