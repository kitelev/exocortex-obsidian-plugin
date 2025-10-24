import { BacklinksCacheManager } from "../../../src/infrastructure/caching/BacklinksCacheManager";

describe("BacklinksCacheManager", () => {
  let manager: BacklinksCacheManager;
  let mockApp: any;

  beforeEach(() => {
    mockApp = {
      metadataCache: {
        resolvedLinks: {
          "source1.md": {
            "target1.md": 1,
            "target2.md": 1,
          },
          "source2.md": {
            "target1.md": 1,
            "target3.md": 1,
          },
          "source3.md": {
            "target2.md": 1,
          },
        },
      },
    };

    manager = new BacklinksCacheManager(mockApp);
  });

  describe("buildCache", () => {
    it("should build reverse index of backlinks", () => {
      manager.buildCache();

      const target1Backlinks = manager.getBacklinks("target1.md");
      expect(target1Backlinks).toBeDefined();
      expect(target1Backlinks?.size).toBe(2);
      expect(target1Backlinks?.has("source1.md")).toBe(true);
      expect(target1Backlinks?.has("source2.md")).toBe(true);

      const target2Backlinks = manager.getBacklinks("target2.md");
      expect(target2Backlinks).toBeDefined();
      expect(target2Backlinks?.size).toBe(2);
      expect(target2Backlinks?.has("source1.md")).toBe(true);
      expect(target2Backlinks?.has("source3.md")).toBe(true);

      const target3Backlinks = manager.getBacklinks("target3.md");
      expect(target3Backlinks).toBeDefined();
      expect(target3Backlinks?.size).toBe(1);
      expect(target3Backlinks?.has("source2.md")).toBe(true);
    });

    it("should not rebuild cache if already valid", () => {
      manager.buildCache();
      const firstBacklinks = manager.getBacklinks("target1.md");

      mockApp.metadataCache.resolvedLinks = {};
      manager.buildCache();
      const secondBacklinks = manager.getBacklinks("target1.md");

      expect(secondBacklinks).toBe(firstBacklinks);
      expect(secondBacklinks?.size).toBe(2);
    });

    it("should rebuild cache after invalidation", () => {
      manager.buildCache();
      const firstBacklinks = manager.getBacklinks("target1.md");
      expect(firstBacklinks?.size).toBe(2);

      mockApp.metadataCache.resolvedLinks = {
        "newSource.md": {
          "target1.md": 1,
        },
      };

      manager.invalidate();
      manager.buildCache();

      const secondBacklinks = manager.getBacklinks("target1.md");
      expect(secondBacklinks?.size).toBe(1);
      expect(secondBacklinks?.has("newSource.md")).toBe(true);
      expect(secondBacklinks?.has("source1.md")).toBe(false);
    });

    it("should return undefined for files with no backlinks", () => {
      manager.buildCache();

      const noBacklinks = manager.getBacklinks("nonexistent.md");
      expect(noBacklinks).toBeUndefined();
    });

    it("should handle empty resolvedLinks", () => {
      mockApp.metadataCache.resolvedLinks = {};
      manager.buildCache();

      expect(manager.isValid()).toBe(true);
      expect(manager.getBacklinks("target1.md")).toBeUndefined();
    });
  });

  describe("invalidate", () => {
    it("should mark cache as invalid", () => {
      manager.buildCache();
      expect(manager.isValid()).toBe(true);

      manager.invalidate();
      expect(manager.isValid()).toBe(false);
    });

    it("should trigger rebuild on next getBacklinks", () => {
      manager.buildCache();
      expect(manager.isValid()).toBe(true);

      manager.invalidate();
      expect(manager.isValid()).toBe(false);

      manager.getBacklinks("target1.md");
      expect(manager.isValid()).toBe(true);
    });
  });

  describe("getBacklinks", () => {
    it("should automatically build cache if not valid", () => {
      expect(manager.isValid()).toBe(false);

      const backlinks = manager.getBacklinks("target1.md");

      expect(manager.isValid()).toBe(true);
      expect(backlinks?.size).toBe(2);
    });

    it("should return same Set reference for multiple calls", () => {
      const firstCall = manager.getBacklinks("target1.md");
      const secondCall = manager.getBacklinks("target1.md");

      expect(firstCall).toBe(secondCall);
    });
  });

  describe("isValid", () => {
    it("should return false initially", () => {
      expect(manager.isValid()).toBe(false);
    });

    it("should return true after building cache", () => {
      manager.buildCache();
      expect(manager.isValid()).toBe(true);
    });

    it("should return false after invalidation", () => {
      manager.buildCache();
      manager.invalidate();
      expect(manager.isValid()).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle files with multiple links to same target", () => {
      mockApp.metadataCache.resolvedLinks = {
        "source.md": {
          "target.md": 5,
        },
      };

      manager.buildCache();
      const backlinks = manager.getBacklinks("target.md");

      expect(backlinks?.size).toBe(1);
      expect(backlinks?.has("source.md")).toBe(true);
    });

    it("should handle source files with no links", () => {
      mockApp.metadataCache.resolvedLinks = {
        "source1.md": {},
        "source2.md": {
          "target.md": 1,
        },
      };

      manager.buildCache();

      const backlinks = manager.getBacklinks("target.md");
      expect(backlinks?.size).toBe(1);
      expect(backlinks?.has("source2.md")).toBe(true);
    });

    it("should handle circular references", () => {
      mockApp.metadataCache.resolvedLinks = {
        "fileA.md": {
          "fileB.md": 1,
        },
        "fileB.md": {
          "fileA.md": 1,
        },
      };

      manager.buildCache();

      const aBacklinks = manager.getBacklinks("fileA.md");
      const bBacklinks = manager.getBacklinks("fileB.md");

      expect(aBacklinks?.has("fileB.md")).toBe(true);
      expect(bBacklinks?.has("fileA.md")).toBe(true);
    });
  });
});
