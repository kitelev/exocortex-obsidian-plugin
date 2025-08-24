/**
 * Smoke Test Suite for Plugin Initialization
 * 
 * This test suite ensures that the plugin can be loaded without critical errors,
 * particularly focusing on the "Service IAssetRepository not found" issue.
 * 
 * Run with: npm run test:smoke
 */

import { App } from "obsidian";
import ExocortexPlugin from "../../src/ExocortexPlugin";
import { ServiceProvider } from "../../src/infrastructure/providers/ServiceProvider";
import { DIContainer } from "../../src/infrastructure/container/DIContainer";
import { UniversalLayoutRenderer } from "../../src/presentation/renderers/UniversalLayoutRenderer";
import { AssetListRenderer } from "../../src/presentation/renderers/AssetListRenderer";

describe("Plugin Initialization Smoke Tests", () => {
  let app: App;
  let plugin: ExocortexPlugin;
  let consoleErrors: string[] = [];

  beforeEach(() => {
    // Capture console errors
    consoleErrors = [];
    jest.spyOn(console, "error").mockImplementation((...args) => {
      consoleErrors.push(args.join(" "));
    });

    // Create minimal mock Obsidian app
    app = createMockApp();
  });

  afterEach(async () => {
    if (plugin) {
      await plugin.onunload();
    }
    jest.restoreAllMocks();
  });

  describe("Critical: Service Registration", () => {
    it("should register IAssetRepository service during initialization", async () => {
      // Arrange
      plugin = new ExocortexPlugin(app, createMockManifest());

      // Act
      await plugin.onload();
      const serviceProvider = (plugin as any).serviceProvider as ServiceProvider;

      // Assert
      expect(serviceProvider).toBeDefined();
      expect(serviceProvider.hasService("IAssetRepository")).toBe(true);
      
      // Verify the service can be retrieved without error
      expect(() => {
        const assetRepo = serviceProvider.getService("IAssetRepository");
        expect(assetRepo).toBeDefined();
      }).not.toThrow();
    });

    it("should register all required services for code block processors", async () => {
      // Arrange
      plugin = new ExocortexPlugin(app, createMockManifest());
      
      // Act
      await plugin.onload();
      const serviceProvider = (plugin as any).serviceProvider as ServiceProvider;

      // Assert - Check all services required by renderers
      const requiredServices = [
        "RDFService",
        "IAssetRepository",
        "LayoutRenderer",
        "PropertyRenderer"
      ];

      requiredServices.forEach(serviceName => {
        expect(serviceProvider.hasService(serviceName)).toBe(true);
        expect(() => serviceProvider.getService(serviceName)).not.toThrow();
      });
    });
  });

  describe("Critical: Code Block Processor Initialization", () => {
    it("should initialize UniversalLayoutRenderer without 'Service not found' error", async () => {
      // Arrange
      plugin = new ExocortexPlugin(app, createMockManifest());
      await plugin.onload();
      const serviceProvider = (plugin as any).serviceProvider as ServiceProvider;

      // Act & Assert - This was previously throwing "Service IAssetRepository not found"
      expect(() => {
        const renderer = new UniversalLayoutRenderer(serviceProvider);
        expect(renderer).toBeDefined();
      }).not.toThrow();

      // Verify no service not found errors
      const serviceNotFoundErrors = consoleErrors.filter(err => 
        err.includes("Service") && err.includes("not found")
      );
      expect(serviceNotFoundErrors).toHaveLength(0);
    });

    it("should initialize AssetListRenderer without errors", async () => {
      // Arrange
      plugin = new ExocortexPlugin(app, createMockManifest());
      await plugin.onload();
      const serviceProvider = (plugin as any).serviceProvider as ServiceProvider;

      // Act & Assert
      expect(() => {
        const renderer = new AssetListRenderer(serviceProvider);
        expect(renderer).toBeDefined();
      }).not.toThrow();
    });

    it("should complete full plugin initialization without errors", async () => {
      // Arrange
      plugin = new ExocortexPlugin(app, createMockManifest());

      // Act
      await plugin.onload();

      // Assert
      expect((plugin as any).codeBlockProcessor).toBeDefined();
      expect(consoleErrors.filter(e => e.includes("Error") || e.includes("error"))).toHaveLength(0);
    });
  });

  describe("Initialization Order Verification", () => {
    it("should initialize ServiceProvider before CodeBlockProcessor", async () => {
      // Arrange
      const initOrder: string[] = [];
      plugin = new ExocortexPlugin(app, createMockManifest());

      // Spy on initialization methods
      jest.spyOn(plugin as any, "initializeServiceProvider").mockImplementation(async function(this: any) {
        initOrder.push("ServiceProvider");
        // Call the original implementation
        const sp = new ServiceProvider(this.plugin, this.graphManager.getGraph(), this.settingsManager.getSettings());
        await sp.initializeServices();
        this.serviceProvider = sp;
      });

      jest.spyOn(plugin as any, "initializeCodeBlockProcessor").mockImplementation(async function(this: any) {
        initOrder.push("CodeBlockProcessor");
        // Simplified version - just verify serviceProvider exists
        expect(this.serviceProvider).toBeDefined();
      });

      // Act
      await plugin.onload();

      // Assert
      expect(initOrder).toEqual(["ServiceProvider", "CodeBlockProcessor"]);
      expect(initOrder.indexOf("ServiceProvider")).toBeLessThan(initOrder.indexOf("CodeBlockProcessor"));
    });
  });

  describe("Error Recovery", () => {
    it("should handle missing services gracefully with meaningful error", async () => {
      // Arrange
      plugin = new ExocortexPlugin(app, createMockManifest());
      await plugin.onload();
      const serviceProvider = (plugin as any).serviceProvider as ServiceProvider;

      // Act & Assert
      expect(() => {
        serviceProvider.getService("NonExistentService");
      }).toThrow("Service NonExistentService not found");
    });

    it("should not crash when a service fails to initialize", async () => {
      // Arrange
      plugin = new ExocortexPlugin(app, createMockManifest());

      // Mock one service to throw during initialization
      jest.spyOn(DIContainer.prototype, "resolve").mockImplementation((service) => {
        if (service === "FailingService") {
          throw new Error("Service initialization failed");
        }
        // Return mock for other services
        return createMockService(service);
      });

      // Act
      await plugin.onload();

      // Assert - Plugin should still load
      expect(plugin).toBeDefined();
      expect((plugin as any).serviceProvider).toBeDefined();
    });
  });

  describe("Plugin Lifecycle", () => {
    it("should load and unload without errors", async () => {
      // Arrange
      plugin = new ExocortexPlugin(app, createMockManifest());

      // Act - Load
      await plugin.onload();
      expect(plugin).toBeDefined();

      // Act - Unload
      await plugin.onunload();

      // Assert
      expect(consoleErrors.filter(e => e.includes("Error during plugin cleanup"))).toHaveLength(0);
    });

    it("should support reload without duplicate registrations", async () => {
      // Arrange
      plugin = new ExocortexPlugin(app, createMockManifest());

      // Act - First load
      await plugin.onload();
      const firstServiceProvider = (plugin as any).serviceProvider;

      // Act - Unload and reload
      await plugin.onunload();
      plugin = new ExocortexPlugin(app, createMockManifest());
      await plugin.onload();
      const secondServiceProvider = (plugin as any).serviceProvider;

      // Assert
      expect(firstServiceProvider).not.toBe(secondServiceProvider);
      expect(secondServiceProvider.hasService("IAssetRepository")).toBe(true);
      expect(consoleErrors.filter(e => e.includes("already registered"))).toHaveLength(0);
    });
  });
});

// Helper functions
function createMockApp(): App {
  return {
    vault: {
      getMarkdownFiles: jest.fn(() => []),
      getAbstractFileByPath: jest.fn(),
      create: jest.fn(),
      modify: jest.fn(),
      delete: jest.fn(),
      on: jest.fn(() => ({ unload: jest.fn() })),
      off: jest.fn(),
    },
    metadataCache: {
      getFileCache: jest.fn(() => null),
      getCache: jest.fn(() => null),
      on: jest.fn(() => ({ unload: jest.fn() })),
      off: jest.fn(),
      resolvedLinks: {},
    },
    workspace: {
      getActiveFile: jest.fn(() => null),
      openLinkText: jest.fn(),
      on: jest.fn(() => ({ unload: jest.fn() })),
      off: jest.fn(),
    },
    plugins: {
      enabledPlugins: new Set(),
    },
  } as any;
}

function createMockManifest(): any {
  return {
    id: "exocortex",
    name: "Exocortex",
    version: "5.1.0",
  };
}

function createMockService(serviceName: string): any {
  // Return appropriate mock based on service name
  switch (serviceName) {
    case "IAssetRepository":
      return {
        findById: jest.fn(),
        save: jest.fn(),
        updateFrontmatter: jest.fn(),
      };
    case "RDFService":
      return {
        addTriple: jest.fn(),
        removeTriple: jest.fn(),
        query: jest.fn(),
      };
    case "IClassLayoutRepository":
      return {
        findByClass: jest.fn(),
        save: jest.fn(),
      };
    default:
      return {};
  }
}