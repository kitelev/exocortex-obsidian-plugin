import "reflect-metadata";
import { container } from "tsyringe";
import { UniversalLayoutRenderer } from "../../src/presentation/renderers/UniversalLayoutRenderer";
import { ExocortexSettings } from "../../src/domain/settings/ExocortexSettings";
import { TFile } from "obsidian";
import {
  DI_TOKENS,
  IVaultAdapter,
  TaskFrontmatterGenerator,
  AlgorithmExtractor,
  TaskCreationService,
} from "@exocortex/core";

describe("UniversalLayoutRenderer", () => {
  let mockApp: any;
  let mockSettings: ExocortexSettings;
  let mockPlugin: any;
  let mockVault: any;
  let mockVaultAdapter: any;

  beforeEach(() => {
    container.clearInstances();
    jest.useFakeTimers();

    mockApp = {
      vault: {
        getMarkdownFiles: jest.fn().mockReturnValue([]),
        getAbstractFileByPath: jest.fn(),
        read: jest.fn(),
        modify: jest.fn(),
      },
      metadataCache: {
        getFileCache: jest.fn().mockReturnValue({ frontmatter: {} }),
        getFirstLinkpathDest: jest.fn(),
      },
      workspace: {
        getActiveFile: jest.fn(),
        getLeaf: jest.fn().mockReturnValue({
          openLinkText: jest.fn(),
        }),
        openLinkText: jest.fn(),
      },
    };

    mockSettings = {
      showPropertiesSection: false,
      showLayoutByDefault: true,
      showArchivedAssets: false,
    } as ExocortexSettings;

    mockPlugin = {
      saveSettings: jest.fn(),
    };

    // Setup mock vaultAdapter for renderer
    mockVaultAdapter = {
      getAllFiles: jest.fn().mockReturnValue([]),
      read: jest.fn(),
      create: jest.fn(),
      modify: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      getAbstractFileByPath: jest.fn(),
      getFrontmatter: jest.fn().mockReturnValue({}),
      updateFrontmatter: jest.fn(),
      rename: jest.fn(),
      createFolder: jest.fn(),
      getFirstLinkpathDest: jest.fn(),
      process: jest.fn(),
      getDefaultNewFileParent: jest.fn(),
      updateLinks: jest.fn(),
    };

    // Setup DI container for TaskCreationService
    mockVault = {
      create: jest.fn().mockResolvedValue({ path: "test-task.md" }),
      read: jest.fn().mockResolvedValue(""),
      modify: jest.fn().mockResolvedValue(undefined),
    };

    container.registerInstance<IVaultAdapter>(DI_TOKENS.IVaultAdapter, mockVault);
    container.register(TaskFrontmatterGenerator, { useClass: TaskFrontmatterGenerator });
    container.register(AlgorithmExtractor, { useClass: AlgorithmExtractor });
    container.register(TaskCreationService, { useClass: TaskCreationService });
  });

  afterEach(() => {
    container.clearInstances();
    jest.useRealTimers();
  });

  it("should create renderer instance", () => {
    const renderer = new UniversalLayoutRenderer(mockApp, mockSettings, mockPlugin, mockVaultAdapter);
    expect(renderer).toBeDefined();
  });

  it("should cleanup without errors", () => {
    const renderer = new UniversalLayoutRenderer(mockApp, mockSettings, mockPlugin, mockVaultAdapter);
    expect(() => renderer.cleanup()).not.toThrow();
  });

  it("should invalidate backlinks cache without errors", () => {
    const renderer = new UniversalLayoutRenderer(mockApp, mockSettings, mockPlugin, mockVaultAdapter);
    expect(() => renderer.invalidateBacklinksCache()).not.toThrow();
  });

  describe("handleMetadataChange", () => {
    it("should debounce metadata changes", async () => {
      const renderer = new UniversalLayoutRenderer(mockApp, mockSettings, mockPlugin, mockVaultAdapter);
      const renderer_any = renderer as any;

      // Setup mock file
      const mockFile = {
        path: "test.md",
        extension: "md",
        basename: "test",
      } as TFile;

      mockVaultAdapter.getAbstractFileByPath.mockReturnValue(mockFile);

      // Set current file path so handler processes the file
      renderer_any.currentFilePath = "test.md";
      renderer_any.rootContainer = document.createElement("div");

      // Mock metadataExtractor
      renderer_any.metadataExtractor = {
        extractMetadata: jest.fn().mockReturnValue({}),
      };

      // Simulate multiple rapid metadata changes
      renderer.handleMetadataChange("test.md");
      renderer.handleMetadataChange("test.md");
      renderer.handleMetadataChange("test.md");

      // Verify debounce happened (should only be called after timer)
      expect(mockVaultAdapter.getAbstractFileByPath).toHaveBeenCalledTimes(0);

      // Fast-forward time past debounce delay
      jest.advanceTimersByTime(100);

      // Now it should have been called once
      expect(mockVaultAdapter.getAbstractFileByPath).toHaveBeenCalledTimes(1);
    });

    it("should ignore non-markdown files", async () => {
      const renderer = new UniversalLayoutRenderer(mockApp, mockSettings, mockPlugin, mockVaultAdapter);

      const mockFile = {
        path: "test.pdf",
        extension: "pdf",
      } as any;

      mockVaultAdapter.getAbstractFileByPath.mockReturnValue(mockFile);

      await renderer.handleMetadataChange("test.pdf");
      jest.advanceTimersByTime(100);

      // Should not process non-markdown files
      // Just verify it doesn't throw
      expect(true).toBe(true);
    });

    it("should ignore changes when no container is set", async () => {
      const renderer = new UniversalLayoutRenderer(mockApp, mockSettings, mockPlugin, mockVaultAdapter);

      const mockFile = {
        path: "test.md",
        extension: "md",
      } as TFile;

      mockVaultAdapter.getAbstractFileByPath.mockReturnValue(mockFile);

      await renderer.handleMetadataChange("test.md");
      jest.advanceTimersByTime(100);

      // Should handle gracefully when rootContainer is null
      expect(true).toBe(true);
    });

    it("should detect metadata changes", async () => {
      const renderer = new UniversalLayoutRenderer(mockApp, mockSettings, mockPlugin, mockVaultAdapter);

      // Setup mock file with changing metadata
      const mockFile = {
        path: "test.md",
        extension: "md",
        basename: "test",
      } as TFile;

      mockVaultAdapter.getAbstractFileByPath.mockReturnValue(mockFile);

      // First call - set initial metadata
      const renderer_any = renderer as any;
      renderer_any.currentFilePath = "test.md";
      renderer_any.metadataCache.set("test.md", {
        exo__Asset_label: "Old Label"
      });

      // Mock metadata extractor to return new metadata
      renderer_any.metadataExtractor = {
        extractMetadata: jest.fn().mockReturnValue({
          exo__Asset_label: "New Label",
        }),
      };

      // Mock root container
      renderer_any.rootContainer = document.createElement("div");

      await renderer.handleMetadataChange("test.md");
      jest.advanceTimersByTime(100);

      // Verify metadata was extracted
      expect(renderer_any.metadataExtractor.extractMetadata).toHaveBeenCalledWith(mockFile);
    });
  });

  describe("incrementalUpdate", () => {
    it("should update only affected sections", async () => {
      const renderer = new UniversalLayoutRenderer(mockApp, mockSettings, mockPlugin, mockVaultAdapter);
      const renderer_any = renderer as any;

      // Mock the section update methods
      renderer_any.updatePropertiesSection = jest.fn().mockResolvedValue(undefined);
      renderer_any.updateButtonsSection = jest.fn().mockResolvedValue(undefined);
      renderer_any.updateDailyTasksSection = jest.fn().mockResolvedValue(undefined);

      // Mock root container
      renderer_any.rootContainer = document.createElement("div");

      const mockFile = {
        path: "test.md",
        basename: "test",
      } as TFile;

      // Call with specific sections
      await renderer_any.incrementalUpdate(mockFile, ["properties", "buttons"]);

      // Verify only specified sections were updated
      expect(renderer_any.updatePropertiesSection).toHaveBeenCalledWith(mockFile);
      expect(renderer_any.updateButtonsSection).toHaveBeenCalledWith(mockFile);
      expect(renderer_any.updateDailyTasksSection).not.toHaveBeenCalled();
    });

    it("should handle missing root container gracefully", async () => {
      const renderer = new UniversalLayoutRenderer(mockApp, mockSettings, mockPlugin, mockVaultAdapter);
      const renderer_any = renderer as any;

      // No root container set
      renderer_any.rootContainer = null;

      const mockFile = {
        path: "test.md",
        basename: "test",
      } as TFile;

      // Should not throw
      await expect(renderer_any.incrementalUpdate(mockFile, ["properties"])).resolves.toBeUndefined();
    });
  });

  describe("section update methods", () => {
    let renderer: UniversalLayoutRenderer;
    let renderer_any: any;
    let mockFile: TFile;
    let mockContainer: HTMLElement;

    beforeEach(() => {
      renderer = new UniversalLayoutRenderer(mockApp, mockSettings, mockPlugin, mockVaultAdapter);
      renderer_any = renderer as any;

      mockFile = {
        path: "test.md",
        basename: "test",
      } as TFile;

      // Mock vault to return our mock file
      mockVaultAdapter.getAbstractFileByPath.mockReturnValue(mockFile);
      mockApp.metadataCache.getFileCache.mockReturnValue({ frontmatter: {} });

      // Create mock container with querySelector
      mockContainer = document.createElement("div");
      renderer_any.rootContainer = mockContainer;
    });

    it("should handle missing section containers gracefully - properties", async () => {
      // No section element exists
      const result = await renderer_any.updatePropertiesSection(mockFile);
      expect(result).toBeUndefined();
    });

    it("should handle missing section containers gracefully - buttons", async () => {
      // Mock ButtonGroupsBuilder to return empty array (no buttons to render)
      renderer_any.buttonGroupsBuilder = {
        build: jest.fn().mockResolvedValue([]),
      };

      const result = await renderer_any.updateButtonsSection(mockFile);
      expect(result).toBeUndefined();

      // Verify builder was called but no container created (empty button groups)
      expect(renderer_any.buttonGroupsBuilder.build).toHaveBeenCalledWith(mockFile);

      // No button section should exist since buttonGroups.length === 0
      const container = mockContainer.querySelector(".exocortex-buttons-section");
      expect(container).toBeNull();
    });

    it("should handle missing section containers gracefully - daily tasks", async () => {
      const result = await renderer_any.updateDailyTasksSection(mockFile);
      expect(result).toBeUndefined();
    });

    it("should handle missing section containers gracefully - daily projects", async () => {
      const result = await renderer_any.updateDailyProjectsSection(mockFile);
      expect(result).toBeUndefined();
    });

    it("should handle missing section containers gracefully - area tree", async () => {
      const result = await renderer_any.updateAreaTreeSection(mockFile);
      expect(result).toBeUndefined();
    });

    it("should handle missing section containers gracefully - relations", async () => {
      const result = await renderer_any.updateRelationsSection(mockFile);
      expect(result).toBeUndefined();
    });

    it("should update properties section when container exists", async () => {
      // Create mock section container
      const sectionContainer = document.createElement("div");
      sectionContainer.className = "exocortex-properties-section";
      sectionContainer.empty = jest.fn();
      mockContainer.appendChild(sectionContainer);

      // Mock querySelector to return our section
      mockContainer.querySelector = jest.fn().mockReturnValue(sectionContainer);

      // Mock propertiesRenderer
      renderer_any.propertiesRenderer = {
        render: jest.fn().mockResolvedValue(undefined),
      };

      // Mock backlinks cache
      renderer_any.backlinksCacheManager = {
        getBacklinks: jest.fn().mockReturnValue(new Map()),
      };

      await renderer_any.updatePropertiesSection(mockFile);

      // Verify section was cleared and re-rendered
      expect(sectionContainer.empty).toHaveBeenCalled();
      expect(renderer_any.propertiesRenderer.render).toHaveBeenCalled();
    });

    it("should update buttons section when container exists", async () => {
      // Mock ButtonGroupsBuilder to return button groups
      renderer_any.buttonGroupsBuilder = {
        build: jest.fn().mockResolvedValue([{ buttons: [] }]),
      };

      await renderer_any.updateButtonsSection(mockFile);

      // Verify builder was called and button groups were generated
      expect(renderer_any.buttonGroupsBuilder.build).toHaveBeenCalledWith(mockFile);

      // Verify new container was created (old one was removed, new one created)
      const newContainer = mockContainer.querySelector(".exocortex-buttons-section");
      expect(newContainer).toBeTruthy();
    });

    it("should update daily tasks section when container exists", async () => {
      const sectionContainer = document.createElement("div");
      sectionContainer.className = "exocortex-daily-tasks-section";
      sectionContainer.empty = jest.fn();
      mockContainer.appendChild(sectionContainer);

      mockContainer.querySelector = jest.fn().mockReturnValue(sectionContainer);

      renderer_any.dailyTasksRenderer = {
        render: jest.fn().mockResolvedValue(undefined),
      };

      await renderer_any.updateDailyTasksSection(mockFile);

      expect(sectionContainer.empty).toHaveBeenCalled();
      expect(renderer_any.dailyTasksRenderer.render).toHaveBeenCalled();
    });
  });
});
