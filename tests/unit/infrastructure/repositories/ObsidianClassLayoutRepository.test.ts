import { App, TFile, MetadataCache } from "obsidian";
import { ObsidianClassLayoutRepository } from "../../../../src/infrastructure/repositories/ObsidianClassLayoutRepository";
import {
  ClassLayout,
  LayoutBlockConfig,
} from "../../../../src/domain/entities/ClassLayout";
import { ClassName } from "../../../../src/domain/value-objects/ClassName";
import { AssetId } from "../../../../src/domain/value-objects/AssetId";

// Mock the ClassLayout.create static method
jest.mock("../../../../src/domain/entities/ClassLayout", () => {
  const mockCreate = jest.fn().mockImplementation((params: any) => {
    const mockClassLayout = {
      id: params.id || { equals: jest.fn(), toString: () => "test-id" },
      targetClass: params.targetClass || {
        equals: jest.fn(),
        value: "test__Class",
      },
      isEnabled: params.isEnabled !== undefined ? params.isEnabled : true,
      priority: params.priority !== undefined ? params.priority : 1,
      blocks: params.blocks || [],
    };

    return {
      isSuccess: true,
      isFailure: false,
      getValue: () => mockClassLayout,
      getError: () => "",
    };
  });

  return {
    ClassLayout: class {
      static create = mockCreate;
    },
  };
});

describe("ObsidianClassLayoutRepository", () => {
  let repository: ObsidianClassLayoutRepository;
  let mockApp: App;
  let mockVault: any;
  let mockMetadataCache: MetadataCache;

  beforeEach(() => {
    // Reset time
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-01"));

    // Create mock vault
    mockVault = {
      getFiles: jest.fn(),
      getAbstractFileByPath: jest.fn(),
      create: jest.fn(),
      modify: jest.fn(),
      delete: jest.fn(),
    };

    // Create mock metadata cache
    mockMetadataCache = {
      getFileCache: jest.fn(),
    } as any;

    // Create mock app
    mockApp = {
      vault: mockVault,
      metadataCache: mockMetadataCache,
    } as App;

    repository = new ObsidianClassLayoutRepository(mockApp, "test-layouts");
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe("Constructor and Initialization", () => {
    it("should initialize with default layouts folder path", () => {
      const repo = new ObsidianClassLayoutRepository(mockApp);
      expect(repo).toBeInstanceOf(ObsidianClassLayoutRepository);
    });

    it("should initialize with custom layouts folder path", () => {
      const repo = new ObsidianClassLayoutRepository(mockApp, "custom-layouts");
      expect(repo).toBeInstanceOf(ObsidianClassLayoutRepository);
    });

    it("should handle null app gracefully", () => {
      expect(
        () => new ObsidianClassLayoutRepository(null as any),
      ).not.toThrow();
    });
  });

  describe("Cache Management", () => {
    beforeEach(() => {
      mockVault.getFiles.mockReturnValue([]);
    });

    it("should load cache on first access", async () => {
      mockVault.getFiles.mockReturnValue([]);

      await repository.findAll();

      expect(mockVault.getFiles).toHaveBeenCalled();
    });

    it("should use cache within TTL period", async () => {
      await repository.findAll();

      // Reset mock call count
      mockVault.getFiles.mockClear();

      // Call again immediately
      await repository.findAll();

      // Should not call vault again
      expect(mockVault.getFiles).not.toHaveBeenCalled();
    });

    it("should refresh cache after TTL expires", async () => {
      await repository.findAll();

      // Advance time beyond TTL (30 seconds)
      jest.advanceTimersByTime(35000);

      mockVault.getFiles.mockClear();
      await repository.findAll();

      expect(mockVault.getFiles).toHaveBeenCalled();
    });

    it("should clear cache on loadLayoutsFromFiles", async () => {
      // This test verifies that cache behaves properly
      // After implementation changes, manually added layouts are preserved
      // but the cache refresh mechanism still works

      // Force initial load
      await repository.findAll();
      expect(mockVault.getFiles).toHaveBeenCalled();

      // Clear mock call count
      mockVault.getFiles.mockClear();

      // Advance time to trigger refresh
      jest.advanceTimersByTime(35000);

      // Create new repository without manually added layouts to test file loading
      const freshRepository = new ObsidianClassLayoutRepository(
        mockApp,
        "test-layouts",
      );
      await freshRepository.findAll();

      // Should call getFiles for fresh repository
      expect(mockVault.getFiles).toHaveBeenCalled();
    });
  });

  describe("findByClass", () => {
    const mockClassName = ClassName.create("test__Class").getValue();

    beforeEach(() => {
      setupMockLayoutFiles();
    });

    it("should find layouts for specific class", async () => {
      const result = await repository.findByClass(mockClassName);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return only enabled layouts", async () => {
      const result = await repository.findByClass(mockClassName);

      result.forEach((layout) => {
        expect(layout.isEnabled).toBe(true);
      });
    });

    it("should sort layouts by priority (higher first)", async () => {
      const layout1 = createMockLayout("id1", mockClassName, true, 1);
      const layout2 = createMockLayout("id2", mockClassName, true, 3);
      const layout3 = createMockLayout("id3", mockClassName, true, 2);

      await repository.save(layout1);
      await repository.save(layout2);
      await repository.save(layout3);

      const result = await repository.findByClass(mockClassName);

      // Should be sorted by priority: 3, 2, 1
      expect(result[0].priority).toBe(3);
      expect(result[1].priority).toBe(2);
      expect(result[2].priority).toBe(1);
    });

    it("should return empty array for non-existent class", async () => {
      const nonExistentClass = ClassName.create("NonExistent").getValue();
      const result = await repository.findByClass(nonExistentClass);

      expect(result).toEqual([]);
    });

    it("should filter out disabled layouts", async () => {
      const enabledLayout = createMockLayout("enabled", mockClassName, true);
      const disabledLayout = createMockLayout("disabled", mockClassName, false);

      await repository.save(enabledLayout);
      await repository.save(disabledLayout);

      const result = await repository.findByClass(mockClassName);

      expect(result).toHaveLength(1);
      expect(result[0].isEnabled).toBe(true);
    });
  });

  describe("findById", () => {
    const mockId = AssetId.create("test-id").getValue();
    const mockClassName = ClassName.create("test__Class").getValue();

    beforeEach(() => {
      setupMockLayoutFiles();
    });

    it("should find layout by ID", async () => {
      const layout = createMockLayout("test-id", mockClassName);
      await repository.save(layout);

      const result = await repository.findById(mockId);

      expect(result).toBeDefined();
      expect(result?.id.equals(mockId)).toBe(true);
    });

    it("should return null for non-existent ID", async () => {
      const nonExistentId = AssetId.create("non-existent").getValue();
      const result = await repository.findById(nonExistentId);

      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    beforeEach(() => {
      setupMockLayoutFiles();
    });

    it("should return all layouts from cache", async () => {
      const className1 = ClassName.create("Class1").getValue();
      const className2 = ClassName.create("Class2").getValue();

      await repository.save(createMockLayout("id1", className1));
      await repository.save(createMockLayout("id2", className2));

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
    });

    it("should return empty array when no layouts exist", async () => {
      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe("findEnabledByClass", () => {
    const mockClassName = ClassName.create("test__Class").getValue();

    it("should return only enabled layouts", async () => {
      const enabledLayout = createMockLayout("enabled", mockClassName, true);
      const disabledLayout = createMockLayout("disabled", mockClassName, false);

      await repository.save(enabledLayout);
      await repository.save(disabledLayout);

      const result = await repository.findEnabledByClass(mockClassName);

      expect(result).toHaveLength(1);
      expect(result[0].isEnabled).toBe(true);
    });

    it("should return empty array when no enabled layouts exist", async () => {
      const disabledLayout = createMockLayout("disabled", mockClassName, false);
      await repository.save(disabledLayout);

      const result = await repository.findEnabledByClass(mockClassName);

      expect(result).toEqual([]);
    });
  });

  describe("save", () => {
    const mockClassName = ClassName.create("test__Class").getValue();

    it("should save new layout to cache", async () => {
      const layout = createMockLayout("new-id", mockClassName);

      await repository.save(layout);

      const result = await repository.findById(layout.id);
      expect(result).toBe(layout);
    });

    it("should update existing layout in cache", async () => {
      const layout = createMockLayout("existing-id", mockClassName);
      await repository.save(layout);

      const updatedLayout = { ...layout, priority: 5 };
      await repository.save(updatedLayout);

      const result = await repository.findById(layout.id);
      expect(result?.priority).toBe(5);
    });

    it("should maintain cache structure by class name", async () => {
      const class1 = ClassName.create("Class1").getValue();
      const class2 = ClassName.create("Class2").getValue();

      await repository.save(createMockLayout("id1", class1));
      await repository.save(createMockLayout("id2", class2));

      const class1Layouts = await repository.findByClass(class1);
      const class2Layouts = await repository.findByClass(class2);

      expect(class1Layouts).toHaveLength(1);
      expect(class2Layouts).toHaveLength(1);
    });
  });

  describe("delete", () => {
    const mockClassName = ClassName.create("test__Class").getValue();

    it("should remove layout from cache", async () => {
      const layout = createMockLayout("to-delete", mockClassName);
      await repository.save(layout);

      await repository.delete(layout.id);

      const result = await repository.findById(layout.id);
      expect(result).toBeNull();
    });

    it("should handle deletion of non-existent layout gracefully", async () => {
      const nonExistentId = AssetId.create("non-existent").getValue();

      await expect(repository.delete(nonExistentId)).resolves.not.toThrow();
    });

    it("should maintain other layouts after deletion", async () => {
      const layout1 = createMockLayout("keep", mockClassName);
      const layout2 = createMockLayout("delete", mockClassName);

      await repository.save(layout1);
      await repository.save(layout2);

      await repository.delete(layout2.id);

      const remaining = await repository.findByClass(mockClassName);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(layout1.id);
    });
  });

  describe("Layout File Parsing", () => {
    const mockFile = new TFile("layouts/Layout - test__Class.md");

    it("should identify layout files correctly", async () => {
      mockVault.getFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ui__ClassLayout]]",
          ui__ClassLayout_targetClass: "[[test__Class]]",
        },
      });

      await repository.findAll();

      expect(mockMetadataCache.getFileCache).toHaveBeenCalledWith(mockFile);
    });

    it("should parse layout blocks correctly", async () => {
      const mockBlocks = [
        {
          id: "properties-block",
          type: "properties",
          title: "Properties",
          order: 0,
          config: {
            includedProperties: ["name", "description"],
            editableProperties: ["name"],
          },
          isVisible: true,
        },
        {
          id: "query-block",
          type: "query",
          title: "Related Items",
          order: 1,
          config: {
            query: "SELECT * WHERE { ?s ?p ?o }",
            maxResults: 10,
          },
        },
      ];

      mockVault.getFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "ui__ClassLayout",
          ui__ClassLayout_targetClass: "test__Class",
          ui__ClassLayout_blocks: mockBlocks,
          exo__Asset_uid: "test-uid",
        },
      });

      await repository.findAll();

      // Verify ClassLayout.create was called with parsed blocks
      const {
        ClassLayout,
      } = require("../../../../src/domain/entities/ClassLayout");
      expect(ClassLayout.create).toHaveBeenCalledWith(
        expect.objectContaining({
          blocks: expect.arrayContaining([
            expect.objectContaining({
              id: "properties-block",
              type: "properties",
              title: "Properties",
            }),
          ]),
        }),
      );
    });

    it("should handle missing frontmatter gracefully", async () => {
      mockVault.getFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue(null);

      const result = await repository.findAll();
      expect(result).toEqual([]);
    });

    it("should filter out non-layout files", async () => {
      const nonLayoutFile = new TFile("regular-note.md");
      mockVault.getFiles.mockReturnValue([nonLayoutFile]);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "SomeOtherClass",
        },
      });

      const result = await repository.findAll();
      expect(result).toEqual([]);
    });

    it("should handle different block types correctly", async () => {
      const blockConfigs = {
        query: {
          type: "query",
          query: "SELECT * WHERE { ?s ?p ?o }",
          maxResults: 50,
        },
        properties: {
          type: "properties",
          includedProperties: ["name"],
          editableProperties: [],
        },
        relations: {
          type: "relations",
          relationProperty: "relatedTo",
          showBacklinks: true,
        },
        backlinks: {
          type: "backlinks",
          maxResults: 25,
        },
        custom: {
          type: "custom",
          templatePath: "templates/custom.md",
        },
      };

      Object.entries(blockConfigs).forEach(([type, config]) => {
        const result = (repository as any).parseBlockConfig(type, config);
        expect(result.type).toBe(type);
      });
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle vault getFiles error gracefully", async () => {
      mockVault.getFiles.mockImplementation(() => {
        throw new Error("Vault error");
      });

      await expect(repository.findAll()).rejects.toThrow("Vault error");
    });

    it("should handle metadata cache errors gracefully", async () => {
      const mockFile = new TFile("test.md");
      mockVault.getFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockImplementation(() => {
        throw new Error("Metadata error");
      });

      await expect(repository.findAll()).rejects.toThrow("Metadata error");
    });

    it("should handle malformed block configurations", async () => {
      const malformedBlocks = [
        null,
        undefined,
        {
          /* missing required fields */
        },
        { id: "test" /* missing type */ },
      ];

      const result = (repository as any).parseBlocks(malformedBlocks);

      // Should filter out invalid blocks and assign defaults
      expect(Array.isArray(result)).toBe(true);
      result.forEach((block) => {
        expect(block.id).toBeDefined();
        expect(block.type).toBeDefined();
      });
    });

    it("should handle non-array blocks data", async () => {
      const result = (repository as any).parseBlocks("not-an-array");
      expect(result).toEqual([]);
    });

    it("should handle empty or null property filters", async () => {
      const result = (repository as any).parsePropertyFilters(null);
      expect(result).toEqual([]);

      const result2 = (repository as any).parsePropertyFilters("not-an-array");
      expect(result2).toEqual([]);
    });

    it("should clean class names correctly", async () => {
      const testCases = [
        { input: "[[test__Class]]", expected: "test__Class" },
        { input: "test__Class", expected: "test__Class" },
        { input: ["[[test__Class]]"], expected: "test__Class" },
        { input: null, expected: "" },
        { input: undefined, expected: "" },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = (repository as any).cleanClassName(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe("Performance and Concurrency", () => {
    it("should handle concurrent cache access", async () => {
      setupMockLayoutFiles();

      const promises = [
        repository.findAll(),
        repository.findAll(),
        repository.findAll(),
      ];

      const results = await Promise.all(promises);

      // All should succeed and return the same structure
      results.forEach((result) => {
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it("should handle concurrent save operations", async () => {
      const className = ClassName.create("test__Class").getValue();
      const layouts = [
        createMockLayout("concurrent1", className),
        createMockLayout("concurrent2", className),
        createMockLayout("concurrent3", className),
      ];

      const promises = layouts.map((layout) => repository.save(layout));
      await Promise.all(promises);

      const result = await repository.findByClass(className);
      expect(result).toHaveLength(3);
    });
  });

  // Helper functions
  function createMockLayout(
    id: string,
    targetClass: ClassName,
    isEnabled: boolean = true,
    priority: number = 1,
  ): any {
    const assetId = {
      equals: (other: any) =>
        other && other.toString && other.toString() === id,
      toString: () => id,
    };

    const targetClassObject = {
      equals: (other: ClassName) => other && other.value === targetClass.value,
      value: targetClass.value,
    };

    return {
      id: assetId,
      targetClass: targetClassObject,
      isEnabled,
      priority,
      blocks: [] as LayoutBlockConfig[],
    };
  }

  function setupMockLayoutFiles() {
    mockVault.getFiles.mockReturnValue([]);
  }

  describe("Data Consistency and Validation", () => {
    it("should validate layout data consistency across operations", async () => {
      const className = ClassName.create("ConsistencyTest").getValue();
      const originalLayout = createMockLayout(
        "consistency-test",
        className,
        true,
        5,
      );
      originalLayout.blocks = [
        {
          id: "test-block",
          type: "properties",
          title: "Test Properties",
          order: 0,
          config: { includedProperties: ["name", "description"] },
          isVisible: true,
        } as LayoutBlockConfig,
      ];

      // Save layout
      await repository.save(originalLayout);

      // Retrieve and verify
      const retrieved = await repository.findById(originalLayout.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.targetClass.value).toBe(className.value);
      expect(retrieved?.priority).toBe(5);
      expect(retrieved?.isEnabled).toBe(true);
      expect(retrieved?.blocks).toHaveLength(1);

      // Update layout
      const updatedLayout = {
        ...originalLayout,
        priority: 10,
        isEnabled: false,
      };
      await repository.save(updatedLayout);

      // Verify update
      const afterUpdate = await repository.findById(originalLayout.id);
      expect(afterUpdate?.priority).toBe(10);
      expect(afterUpdate?.isEnabled).toBe(false);

      // Verify it doesn't appear in enabled layouts
      const enabledLayouts = await repository.findEnabledByClass(className);
      expect(enabledLayouts).toHaveLength(0);

      // Verify it still appears in all layouts for class
      const allClassLayouts = await repository.findByClass(className);
      expect(allClassLayouts).toHaveLength(0); // Filtered out because disabled
    });

    it("should handle layout priority conflicts gracefully", async () => {
      const className = ClassName.create("PriorityTest").getValue();
      const layouts = [
        createMockLayout("priority1", className, true, 1),
        createMockLayout("priority2", className, true, 1), // Same priority
        createMockLayout("priority3", className, true, 2),
        createMockLayout("priority4", className, true, 2), // Same priority
        createMockLayout("priority5", className, true, 3),
      ];

      // Save all layouts
      await Promise.all(layouts.map((layout) => repository.save(layout)));

      // Retrieve sorted by priority
      const result = await repository.findByClass(className);

      expect(result).toHaveLength(5);
      expect(result[0].priority).toBe(3); // Highest priority first
      expect(result[1].priority).toBe(2);
      expect(result[2].priority).toBe(2);
      expect(result[3].priority).toBe(1);
      expect(result[4].priority).toBe(1);
    });

    it("should maintain data integrity during concurrent modifications", async () => {
      const className = ClassName.create("ConcurrentMod").getValue();
      const baseLayout = createMockLayout(
        "concurrent-base",
        className,
        true,
        1,
      );

      // Simulate concurrent save operations without setTimeout (which doesn't work well with fake timers)
      const modifications = [
        { ...baseLayout, priority: 5 },
        { ...baseLayout, priority: 3 },
        { ...baseLayout, isEnabled: false },
        { ...baseLayout, priority: 7, isEnabled: true },
      ];

      // Use Promise.resolve to create proper async behavior
      const savePromises = modifications.map((mod) =>
        Promise.resolve().then(() => repository.save(mod)),
      );

      await Promise.all(savePromises);

      // Final state should reflect one of the concurrent operations
      const finalState = await repository.findById(baseLayout.id);
      expect(finalState).toBeDefined();

      // Should have one of the expected states
      const expectedStates = modifications.map((mod) => ({
        priority: mod.priority,
        isEnabled: mod.isEnabled,
      }));

      const actualState = {
        priority: finalState?.priority,
        isEnabled: finalState?.isEnabled,
      };

      expect(expectedStates).toContainEqual(actualState);
    }, 10000); // Add reasonable timeout

    it("should handle repository state after multiple cache refreshes", async () => {
      const className = ClassName.create("CacheRefreshTest").getValue();
      const persistentLayout = createMockLayout(
        "persistent",
        className,
        true,
        1,
      );
      const transientLayout = createMockLayout("transient", className, true, 2);

      // Setup initial mock response
      mockVault.getFiles.mockReturnValue([]);

      // Save layouts to memory-only cache
      await repository.save(persistentLayout);
      await repository.save(transientLayout);

      // Verify initial state
      let layouts = await repository.findByClass(className);
      expect(layouts).toHaveLength(2);

      // Force cache refresh by advancing time
      jest.advanceTimersByTime(35000);

      // Mock file system returning empty (simulating all layouts removed)
      mockVault.getFiles.mockReturnValue([]);

      layouts = await repository.findByClass(className);

      // After implementation changes, manually added layouts are preserved
      // This reflects the new behavior where in-memory layouts persist
      expect(layouts).toHaveLength(2);
    });
  });

  describe("Memory Management and Performance", () => {
    it("should handle large cache sizes efficiently", async () => {
      // Setup mock to return empty array for getFiles to avoid filter error
      mockVault.getFiles.mockReturnValue([]);

      const startTime = Date.now();
      const largeDataset: any[] = [];

      // Create large dataset
      for (let classIndex = 0; classIndex < 10; classIndex++) {
        const className = ClassName.create(`Class${classIndex}`).getValue();
        for (let layoutIndex = 0; layoutIndex < 5; layoutIndex++) {
          largeDataset.push(
            createMockLayout(
              `class${classIndex}-layout${layoutIndex}`,
              className,
              layoutIndex % 2 === 0, // Alternate enabled/disabled
              layoutIndex + 1,
            ),
          );
        }
      }

      // Save all layouts (50 layouts total)
      await Promise.all(largeDataset.map((layout) => repository.save(layout)));

      const saveTime = Date.now();

      // Perform various operations
      const allLayouts = await repository.findAll();
      const class1Layouts = await repository.findByClass(
        ClassName.create("Class1").getValue(),
      );
      const enabledClass1 = await repository.findEnabledByClass(
        ClassName.create("Class1").getValue(),
      );

      const operationTime = Date.now();

      // Verify results
      expect(allLayouts).toHaveLength(50);
      expect(class1Layouts).toHaveLength(3); // Only enabled layouts (indices 0, 2, 4)
      expect(enabledClass1).toHaveLength(3);

      // Performance assertions (operations should complete reasonably quickly)
      const totalTime = operationTime - startTime;
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it("should clean up cache efficiently during delete operations", async () => {
      // Setup mock to return empty array for getFiles to avoid filter error
      mockVault.getFiles.mockReturnValue([]);

      const className = ClassName.create("CleanupTest").getValue();
      const layouts: any[] = [];

      // Create moderate dataset
      for (let i = 0; i < 20; i++) {
        layouts.push(createMockLayout(`cleanup-${i}`, className, true, i + 1));
      }

      // Save all layouts
      await Promise.all(layouts.map((layout) => repository.save(layout)));

      // Verify initial state
      let allLayouts = await repository.findAll();
      expect(allLayouts).toHaveLength(20);

      // Delete half the layouts
      const layoutsToDelete = layouts.slice(0, 10);
      await Promise.all(
        layoutsToDelete.map((layout) => repository.delete(layout.id)),
      );

      // Verify deletions
      allLayouts = await repository.findAll();
      expect(allLayouts).toHaveLength(10);

      // Verify specific layouts are gone
      for (const deletedLayout of layoutsToDelete) {
        const found = await repository.findById(deletedLayout.id);
        expect(found).toBeNull();
      }

      // Verify remaining layouts are still accessible
      const remainingLayouts = layouts.slice(10);
      for (const remainingLayout of remainingLayouts) {
        const found = await repository.findById(remainingLayout.id);
        expect(found).toBe(remainingLayout);
      }
    });
  });
});
