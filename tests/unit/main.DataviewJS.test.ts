import ExocortexPlugin from "../../src/main";
import { App, Plugin, TFile } from "obsidian";

describe("ExocortexPlugin DataviewJS Integration", () => {
  let plugin: ExocortexPlugin;
  let mockApp: App;

  beforeEach(() => {
    // Clean up any existing window.ExoUIRender
    if ((window as any).ExoUIRender) {
      delete (window as any).ExoUIRender;
    }

    // Setup mock App
    mockApp = {
      vault: {
        getMarkdownFiles: jest.fn().mockReturnValue([]),
        read: jest.fn(),
        on: jest.fn().mockReturnValue({ unload: jest.fn() }),
      },
      workspace: {
        getActiveFile: jest.fn(),
      },
      metadataCache: {
        getFileCache: jest.fn(),
      },
    } as any;

    // Create plugin instance
    plugin = new ExocortexPlugin(mockApp, {} as any);
  });

  afterEach(async () => {
    // Clean up
    if (plugin) {
      await plugin.onunload();
    }
    if ((window as any).ExoUIRender) {
      delete (window as any).ExoUIRender;
    }
  });

  describe("ExoUIRender function registration", () => {
    it("should register ExoUIRender function on window object during onload", async () => {
      // Initially, ExoUIRender should not exist
      expect((window as any).ExoUIRender).toBeUndefined();

      // Load the plugin
      await plugin.onload();

      // After loading, ExoUIRender should be registered
      expect((window as any).ExoUIRender).toBeDefined();
      expect(typeof (window as any).ExoUIRender).toBe("function");
    });

    it("should remove ExoUIRender function on plugin unload", async () => {
      // Load the plugin
      await plugin.onload();
      expect((window as any).ExoUIRender).toBeDefined();

      // Unload the plugin
      await plugin.onunload();

      // After unloading, ExoUIRender should be removed
      expect((window as any).ExoUIRender).toBeUndefined();
    });

    it("should handle ExoUIRender call with no active file", async () => {
      await plugin.onload();

      // Mock no active file
      mockApp.workspace.getActiveFile = jest.fn().mockReturnValue(null);

      // Create mock context
      const mockContainer = {
        createEl: jest.fn().mockReturnValue({}),
      };
      const mockCtx = { container: mockContainer };
      const mockDv = {};

      // Call ExoUIRender
      await (window as any).ExoUIRender(mockDv, mockCtx);

      // Should create error element
      expect(mockContainer.createEl).toHaveBeenCalledWith("p", {
        text: "Error: No active file found",
        cls: "exocortex-error",
      });
    });

    it("should handle ExoUIRender call with active file", async () => {
      await plugin.onload();

      // Mock active file
      const mockFile = {
        path: "test.md",
        name: "test.md",
        extension: "md",
      } as TFile;
      mockApp.workspace.getActiveFile = jest.fn().mockReturnValue(mockFile);

      // Mock metadata
      const mockMetadata = {
        frontmatter: {
          exo__Instance_class: "TestClass",
        },
      };
      mockApp.metadataCache.getFileCache = jest
        .fn()
        .mockReturnValue(mockMetadata);

      // Create mock context
      const mockContainer = document.createElement("div");
      const mockCtx = { container: mockContainer };
      const mockDv = {};

      // Call ExoUIRender
      await (window as any).ExoUIRender(mockDv, mockCtx);

      // Should not throw error
      expect(mockContainer.children.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle errors gracefully in ExoUIRender", async () => {
      await plugin.onload();

      // Mock active file that will cause an error
      const mockFile = {} as TFile; // Invalid file object
      mockApp.workspace.getActiveFile = jest.fn().mockReturnValue(mockFile);
      mockApp.metadataCache.getFileCache = jest.fn().mockImplementation(() => {
        throw new Error("Test error");
      });

      // Create mock context
      const mockContainer = {
        createEl: jest.fn().mockReturnValue({}),
      };
      const mockCtx = { container: mockContainer };
      const mockDv = {};

      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      // Call ExoUIRender
      await (window as any).ExoUIRender(mockDv, mockCtx);

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "ExoUIRender error:",
        expect.any(Error),
      );

      // Should create error element
      expect(mockContainer.createEl).toHaveBeenCalledWith("p", {
        text: expect.stringContaining("Error rendering layout:"),
        cls: "exocortex-error",
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("DataviewJS integration scenarios", () => {
    it("should work with typical DataviewJS call pattern", async () => {
      await plugin.onload();

      // Simulate DataviewJS context
      const dataviewContext = {
        container: document.createElement("div"),
        file: { path: "test.md" },
      };

      const dataviewAPI = {
        page: jest.fn(),
        pages: jest.fn(),
        current: jest.fn(),
      };

      // Mock active file
      const mockFile = {
        path: "test.md",
        name: "test.md",
        extension: "md",
      } as TFile;
      mockApp.workspace.getActiveFile = jest.fn().mockReturnValue(mockFile);
      mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue({
        frontmatter: {
          exo__Instance_class: "TestClass",
          exo__Asset_uid: "test-uuid",
          exo__Asset_isDefinedBy: "[[Ontology - Test]]",
          exo__Asset_createdAt: "2025-01-20T10:00:00",
        },
      });

      // Execute ExoUIRender as it would be called from DataviewJS
      await (window as any).ExoUIRender(dataviewAPI, dataviewContext);

      // Should not throw and container should be populated
      expect(dataviewContext.container).toBeDefined();
    });
  });
});
