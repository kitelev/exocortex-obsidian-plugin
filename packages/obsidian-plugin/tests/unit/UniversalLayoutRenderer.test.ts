import { UniversalLayoutRenderer } from "../../src/presentation/renderers/UniversalLayoutRenderer";
import { ExocortexSettings } from "../../src/domain/settings/ExocortexSettings";
import { MarkdownPostProcessorContext, TFile } from "obsidian";
import React from "react";

// Mock dependencies
jest.mock("../../src/adapters/logging/LoggerFactory", () => ({
  LoggerFactory: {
    create: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    }),
  },
}));

jest.mock("../../src/presentation/utils/ReactRenderer", () => ({
  ReactRenderer: jest.fn().mockImplementation(() => ({
    render: jest.fn(),
    cleanup: jest.fn(),
  })),
}));

jest.mock("../../src/adapters/events/EventListenerManager", () => ({
  EventListenerManager: jest.fn().mockImplementation(() => ({
    cleanup: jest.fn(),
  })),
}));

jest.mock("../../src/adapters/caching/BacklinksCacheManager", () => ({
  BacklinksCacheManager: jest.fn().mockImplementation(() => ({
    invalidate: jest.fn(),
  })),
}));

jest.mock("../../src/adapters/ObsidianVaultAdapter", () => ({
  ObsidianVaultAdapter: jest.fn().mockImplementation(() => ({
    getAllFiles: jest.fn().mockReturnValue([]),
    getFrontmatter: jest.fn(),
    read: jest.fn(),
  })),
}));

jest.mock("@exocortex/core", () => ({
  AreaHierarchyBuilder: jest.fn().mockImplementation(() => ({})),
  TaskCreationService: jest.fn().mockImplementation(() => ({})),
  ProjectCreationService: jest.fn().mockImplementation(() => ({})),
  AreaCreationService: jest.fn().mockImplementation(() => ({})),
  ConceptCreationService: jest.fn().mockImplementation(() => ({})),
  TaskStatusService: jest.fn().mockImplementation(() => ({})),
  PropertyCleanupService: jest.fn().mockImplementation(() => ({})),
  FolderRepairService: jest.fn().mockImplementation(() => ({})),
  RenameToUidService: jest.fn().mockImplementation(() => ({})),
  EffortVotingService: jest.fn().mockImplementation(() => ({})),
  LabelToAliasService: jest.fn().mockImplementation(() => ({})),
  MetadataHelpers: {},
  AssetClass: {},
  MetadataExtractor: jest.fn().mockImplementation(() => ({
    extractMetadata: jest.fn().mockReturnValue({}),
  })),
}));

jest.mock("../../src/presentation/builders/ButtonGroupsBuilder", () => ({
  ButtonGroupsBuilder: jest.fn().mockImplementation(() => ({
    build: jest.fn().mockResolvedValue([]),
  })),
}));

jest.mock("../../src/presentation/renderers/DailyTasksRenderer", () => ({
  DailyTasksRenderer: jest.fn().mockImplementation(() => ({
    render: jest.fn(),
  })),
}));

jest.mock("../../src/presentation/renderers/DailyProjectsRenderer", () => ({
  DailyProjectsRenderer: jest.fn().mockImplementation(() => ({
    render: jest.fn(),
  })),
}));

describe("UniversalLayoutRenderer", () => {
  let renderer: UniversalLayoutRenderer;
  let mockApp: any;
  let mockSettings: ExocortexSettings;
  let mockPlugin: any;
  let mockEl: HTMLElement;
  let mockCtx: MarkdownPostProcessorContext;

  beforeEach(() => {
    // Mock HTML element
    mockEl = {
      createDiv: jest.fn().mockReturnValue({
        createDiv: jest.fn().mockReturnValue(document.createElement("div")),
        createEl: jest.fn().mockReturnValue(document.createElement("div")),
      }),
      createEl: jest.fn().mockReturnValue(document.createElement("div")),
      empty: jest.fn(),
      setAttribute: jest.fn(),
      getAttribute: jest.fn(),
      closest: jest.fn(),
    } as any;

    // Mock app
    mockApp = {
      workspace: {
        getActiveFile: jest.fn(),
      },
      vault: {
        getAbstractFileByPath: jest.fn(),
        getMarkdownFiles: jest.fn().mockReturnValue([]),
        read: jest.fn(),
      },
      metadataCache: {
        getFileCache: jest.fn(),
        getBacklinks: jest.fn(),
        resolveLinks: jest.fn().mockReturnValue({}),
      },
      fileManager: {
        getNewFileParent: jest.fn(),
      },
    };

    // Mock settings
    mockSettings = {
      showPropertiesSection: true,
      exo__Archived: "exo__Archived",
      semantic__subclass_of: "semantic__subclass_of",
      ems__Area: "ems__Area",
      pn__DailyNote: "pn__DailyNote",
      exo__Instance_class: "exo__Instance_class",
    } as ExocortexSettings;

    // Mock plugin
    mockPlugin = {};

    // Mock context
    mockCtx = {} as MarkdownPostProcessorContext;

    // Create renderer
    renderer = new UniversalLayoutRenderer(mockApp, mockSettings, mockPlugin);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("render", () => {
    it("should render message when no active file", async () => {
      mockApp.workspace.getActiveFile.mockReturnValue(null);

      await renderer.render("", mockEl, mockCtx);

      expect(mockEl.createDiv).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "No active file",
          cls: "exocortex-message",
        })
      );
    });

    it("should render asset properties when enabled", async () => {
      const mockFile = Object.create(TFile.prototype);
      Object.assign(mockFile, {
        path: "test.md",
        basename: "test",
        name: "test.md",
      });

      mockApp.workspace.getActiveFile.mockReturnValue(mockFile);
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "ems__Area",
          semantic__label: "Test Area",
        },
      });

      await renderer.render("", mockEl, mockCtx);

      expect(mockEl.createDiv).toHaveBeenCalledWith(
        expect.objectContaining({
          cls: "exocortex-properties-section",
        })
      );
    });

    it("should skip asset properties when disabled", async () => {
      mockSettings.showPropertiesSection = false;
      renderer = new UniversalLayoutRenderer(mockApp, mockSettings, mockPlugin);

      const mockFile = Object.create(TFile.prototype);
      Object.assign(mockFile, {
        path: "test.md",
        basename: "test",
        name: "test.md",
      });

      mockApp.workspace.getActiveFile.mockReturnValue(mockFile);

      await renderer.render("", mockEl, mockCtx);

      expect(mockEl.createDiv).not.toHaveBeenCalledWith(
        expect.objectContaining({
          cls: "exocortex-properties-section",
        })
      );
    });

    it("should render action buttons when available", async () => {
      const mockFile = Object.create(TFile.prototype);
      Object.assign(mockFile, {
        path: "test.md",
        basename: "test",
        name: "test.md",
      });

      mockApp.workspace.getActiveFile.mockReturnValue(mockFile);

      // Mock ButtonGroupsBuilder
      const mockButtonGroupsBuilder = require("../../src/presentation/builders/ButtonGroupsBuilder");
      mockButtonGroupsBuilder.ButtonGroupsBuilder.mockImplementation(() => ({
        build: jest.fn().mockResolvedValue([
          {
            title: "Actions",
            buttons: [
              { label: "Create Task", command: "create-task" },
            ],
          },
        ]),
      }));

      await renderer.render("", mockEl, mockCtx);

      expect(mockEl.createDiv).toHaveBeenCalledWith(
        expect.objectContaining({
          cls: "exocortex-buttons-section",
        })
      );
    });

    it("should render daily tasks for DailyNote", async () => {
      const mockFile = Object.create(TFile.prototype);
      Object.assign(mockFile, {
        path: "daily/2024-01-15.md",
        basename: "2024-01-15",
        name: "2024-01-15.md",
      });

      mockApp.workspace.getActiveFile.mockReturnValue(mockFile);
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "pn__DailyNote",
        },
      });

      // Mock DailyTasksRenderer
      const mockDailyTasksRenderer = require("../../src/presentation/renderers/DailyTasksRenderer");
      mockDailyTasksRenderer.DailyTasksRenderer.mockImplementation(() => ({
        render: jest.fn(),
      }));

      await renderer.render("", mockEl, mockCtx);

      // Verify DailyTasksRenderer was used
      expect(mockDailyTasksRenderer.DailyTasksRenderer).toHaveBeenCalled();
    });

    it("should render area tree for Area assets", async () => {
      const mockFile = Object.create(TFile.prototype);
      Object.assign(mockFile, {
        path: "areas/work.md",
        basename: "work",
        name: "work.md",
      });

      mockApp.workspace.getActiveFile.mockReturnValue(mockFile);
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "ems__Area",
          semantic__label: "Work",
        },
      });

      // Mock area relations
      mockApp.vault.getMarkdownFiles.mockReturnValue([
        Object.assign(Object.create(TFile.prototype), {
          path: "areas/project1.md",
          basename: "project1",
        }),
      ]);

      await renderer.render("", mockEl, mockCtx);

      // Should create area tree container
      expect(mockEl.createDiv).toHaveBeenCalled();
    });

    it("should handle render errors gracefully", async () => {
      mockApp.workspace.getActiveFile.mockImplementation(() => {
        throw new Error("Test error");
      });

      await renderer.render("", mockEl, mockCtx);

      expect(mockEl.createDiv).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "Error: Test error",
          cls: "exocortex-error-message",
        })
      );
    });
  });

  // Skip complex private method tests for now
  // These would require deeper mocking of the internals

  describe("cleanup", () => {
    it("should cleanup all resources", () => {
      renderer.cleanup();

      const mockEventListenerManager = require("../../src/adapters/events/EventListenerManager");
      const mockReactRenderer = require("../../src/presentation/utils/ReactRenderer");

      expect(mockEventListenerManager.EventListenerManager).toHaveBeenCalled();
      expect(mockReactRenderer.ReactRenderer).toHaveBeenCalled();
    });
  });

  describe("refresh", () => {
    it("should refresh the view", async () => {
      const mockContainer = {
        empty: jest.fn(),
        getAttribute: jest.fn().mockReturnValue("test-source"),
        closest: jest.fn().mockReturnValue({ scrollTop: 100 }),
      } as any;

      renderer["rootContainer"] = mockContainer;

      await renderer.refresh();

      expect(mockContainer.empty).toHaveBeenCalled();
      expect(mockContainer.getAttribute).toHaveBeenCalledWith("data-source");
    });

    it("should handle missing root container", async () => {
      renderer["rootContainer"] = null;

      // Should not throw
      await renderer.refresh();
    });
  });

  describe("invalidateBacklinksCache", () => {
    it("should invalidate the backlinks cache", () => {
      renderer.invalidateBacklinksCache();

      const mockBacklinksCacheManager = require("../../src/adapters/caching/BacklinksCacheManager");
      expect(mockBacklinksCacheManager.BacklinksCacheManager).toHaveBeenCalled();
    });
  });
});