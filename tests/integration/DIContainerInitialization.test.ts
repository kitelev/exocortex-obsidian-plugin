import { DIContainer } from "../../src/infrastructure/container/DIContainer";
import { App } from "obsidian";

describe("DIContainer Initialization", () => {
  let mockApp: App;

  beforeEach(() => {
    // Reset the singleton instance for clean tests
    DIContainer.reset();

    // Create mock app
    mockApp = {
      vault: {
        getMarkdownFiles: jest.fn().mockReturnValue([]),
        getFiles: jest.fn().mockReturnValue([]),
        getAbstractFileByPath: jest.fn(),
        read: jest.fn().mockResolvedValue(""),
        modify: jest.fn().mockResolvedValue(undefined),
        create: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue(undefined),
        rename: jest.fn().mockResolvedValue(undefined),
      },
      workspace: {
        getActiveFile: jest.fn(),
        openLinkText: jest.fn(),
      },
      metadataCache: {
        getFileCache: jest.fn(),
      },
    } as any;
  });

  afterEach(() => {
    // Clean up singleton
    (DIContainer as any).instance = undefined;
  });

  describe("Singleton Pattern", () => {
    it("should throw error when getInstance is called before initialize", () => {
      expect(() => {
        DIContainer.getInstance();
      }).toThrow("DIContainer not initialized. Call initialize(app) first.");
    });

    it("should initialize correctly with app parameter", () => {
      const container = DIContainer.initialize(mockApp);

      expect(container).toBeDefined();
      expect(container).toBeInstanceOf(DIContainer);
    });

    it("should return same instance on multiple initialize calls", () => {
      const container1 = DIContainer.initialize(mockApp);
      const container2 = DIContainer.initialize(mockApp);

      expect(container1).toBe(container2);
    });

    it("should return same instance via getInstance after initialization", () => {
      const container1 = DIContainer.initialize(mockApp);
      const container2 = DIContainer.getInstance();

      expect(container1).toBe(container2);
    });

    it("should accept plugin parameter in initialize", () => {
      const mockPlugin = { name: "test-plugin" };
      const container = DIContainer.initialize(mockApp, mockPlugin);

      expect(container).toBeDefined();
      expect((container as any).plugin).toBe(mockPlugin);
    });
  });

  describe("Dependency Resolution", () => {
    it("should resolve CreateAssetUseCase after initialization", () => {
      const container = DIContainer.initialize(mockApp);
      const useCase = container.getCreateAssetUseCase();

      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe("CreateAssetUseCase");
    });

    it("should resolve PropertyEditingUseCase after initialization", () => {
      const container = DIContainer.initialize(mockApp);
      const useCase = container.getPropertyEditingUseCase();

      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe("PropertyEditingUseCase");
    });

    it("should resolve repositories after initialization", () => {
      const container = DIContainer.initialize(mockApp);

      const assetRepo = container.resolve("IAssetRepository");
      const ontologyRepo = container.resolve("IOntologyRepository");

      expect(assetRepo).toBeDefined();
      expect(ontologyRepo).toBeDefined();
    });
  });

  describe("Async Initialize Method", () => {
    it("should support async initialize for backward compatibility", async () => {
      const container = DIContainer.initialize(mockApp);

      // Should not throw and should resolve
      await expect(container.initialize(mockApp)).resolves.toBeUndefined();
    });
  });

  describe("Plugin Integration", () => {
    it("should work correctly in plugin onload lifecycle", async () => {
      // Simulate plugin onload
      class TestPlugin {
        app: App = mockApp;
        container?: DIContainer;

        async onload() {
          // This is how it's used in main.ts
          this.container = DIContainer.initialize(this.app, this);

          // Should be able to get use cases
          const createAsset = this.container.getCreateAssetUseCase();
          expect(createAsset).toBeDefined();
        }
      }

      const plugin = new TestPlugin();
      await plugin.onload();

      expect(plugin.container).toBeDefined();
    });

    it("should prevent initialization errors in production usage", () => {
      // Test the exact sequence that happens in the plugin
      const mockPlugin = {
        app: mockApp,
        addCommand: jest.fn(),
        addRibbonIcon: jest.fn(),
      };

      // Initialize container as in main.ts
      const container = DIContainer.initialize(mockPlugin.app, mockPlugin);

      // Should be able to use getInstance after initialize
      const sameContainer = DIContainer.getInstance();
      expect(sameContainer).toBe(container);

      // Should be able to get use cases for modal
      const createAssetUseCase = container.getCreateAssetUseCase();
      expect(createAssetUseCase).toBeDefined();
    });
  });
});
