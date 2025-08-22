import { App, TFile } from "obsidian";
import ExocortexPlugin from "../../src/main";

describe.skip("LayoutRenderer Integration (deprecated)", () => {
  let plugin: ExocortexPlugin;
  let mockApp: any;

  beforeEach(() => {
    // Create mock app
    mockApp = {
      vault: {
        getMarkdownFiles: jest.fn().mockReturnValue([]),
        read: jest.fn(),
        create: jest.fn(),
        modify: jest.fn(),
        on: jest.fn().mockReturnValue({ unload: jest.fn() }),
        getAbstractFileByPath: jest.fn(),
      },
      workspace: {
        getActiveFile: jest.fn(),
        on: jest.fn().mockReturnValue({ unload: jest.fn() }),
      },
      metadataCache: {
        getFileCache: jest.fn(),
        on: jest.fn().mockReturnValue({ unload: jest.fn() }),
      },
    };

    plugin = new ExocortexPlugin(mockApp, {} as any);
  });

  describe("Layout Renderer Registration", () => {
    test("should register exo-layout code block processor", async () => {
      const registerSpy = jest.fn();
      plugin.registerMarkdownCodeBlockProcessor = registerSpy;

      await plugin.onload();

      // Check that exo-layout processor was registered
      const calls = registerSpy.mock.calls;
      const layoutCall = calls.find((call) => call[0] === "exo-layout");

      expect(layoutCall).toBeDefined();
      expect(layoutCall[0]).toBe("exo-layout");
      expect(typeof layoutCall[1]).toBe("function");
    });

    test("should render layout when exo-layout block is processed", async () => {
      let layoutProcessor: any;
      plugin.registerMarkdownCodeBlockProcessor = jest.fn((type, processor) => {
        if (type === "exo-layout") {
          layoutProcessor = processor;
        }
      });

      await plugin.onload();

      // Mock active file with frontmatter
      const mockFile = {
        path: "test.md",
        basename: "test",
        name: "test.md",
      } as TFile;

      mockApp.workspace.getActiveFile.mockReturnValue(mockFile);
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          title: "Test Task",
          status: "active",
        },
      });

      // Create mock element
      const mockEl = {
        empty: jest.fn(),
        createDiv: jest.fn().mockReturnValue({
          createEl: jest.fn(),
          createDiv: jest.fn(),
          style: {},
          setAttribute: jest.fn(),
          addClass: jest.fn(),
        }),
        createEl: jest.fn(),
      };

      // Process the block
      await layoutProcessor("", mockEl, {});

      expect(mockEl.empty).toHaveBeenCalled();
      expect(mockApp.workspace.getActiveFile).toHaveBeenCalled();
      expect(mockApp.metadataCache.getFileCache).toHaveBeenCalledWith(mockFile);
    });

    test("should not render if no active file", async () => {
      let layoutProcessor: any;
      plugin.registerMarkdownCodeBlockProcessor = jest.fn((type, processor) => {
        if (type === "exo-layout") {
          layoutProcessor = processor;
        }
      });

      await plugin.onload();

      mockApp.workspace.getActiveFile.mockReturnValue(null);

      const mockEl = {
        empty: jest.fn(),
      };

      await layoutProcessor("", mockEl, {});

      expect(mockEl.empty).not.toHaveBeenCalled();
    });

    test("should not render if no frontmatter", async () => {
      let layoutProcessor: any;
      plugin.registerMarkdownCodeBlockProcessor = jest.fn((type, processor) => {
        if (type === "exo-layout") {
          layoutProcessor = processor;
        }
      });

      await plugin.onload();

      const mockFile = {
        path: "test.md",
      } as TFile;

      mockApp.workspace.getActiveFile.mockReturnValue(mockFile);
      mockApp.metadataCache.getFileCache.mockReturnValue(null);

      const mockEl = {
        empty: jest.fn(),
      };

      await layoutProcessor("", mockEl, {});

      expect(mockEl.empty).not.toHaveBeenCalled();
    });
  });

  describe("Layout Rendering Types", () => {
    test("should support query blocks in layouts", async () => {
      await plugin.onload();
      const layoutRenderer = (plugin as any).layoutRenderer;
      expect(layoutRenderer).toBeDefined();

      // Verify renderer has query block support
      expect((layoutRenderer as any).queryRenderer).toBeDefined();
    });

    test("should support properties blocks in layouts", async () => {
      await plugin.onload();
      const layoutRenderer = (plugin as any).layoutRenderer;
      expect(layoutRenderer).toBeDefined();

      // Verify renderer has properties block support
      expect((layoutRenderer as any).propertiesRenderer).toBeDefined();
    });

    test("should support backlinks blocks in layouts", async () => {
      await plugin.onload();
      const layoutRenderer = (plugin as any).layoutRenderer;
      expect(layoutRenderer).toBeDefined();

      // Verify renderer has backlinks block support
      expect((layoutRenderer as any).backlinksRenderer).toBeDefined();
    });

    test("should support custom blocks in layouts", async () => {
      await plugin.onload();
      const layoutRenderer = (plugin as any).layoutRenderer;
      expect(layoutRenderer).toBeDefined();

      // Verify renderer has custom block support
      expect((layoutRenderer as any).customRenderer).toBeDefined();
    });
  });
});
