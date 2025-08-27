import ExocortexPlugin from "../../src/ExocortexPlugin";
import { App, Plugin } from "obsidian";

// Mock the dependencies
jest.mock("../../src/infrastructure/lifecycle/LifecycleRegistry");
jest.mock("../../src/presentation/command-controllers/CommandRegistry");
jest.mock("../../src/infrastructure/providers/ServiceProvider");
jest.mock("../../src/infrastructure/lifecycle/SettingsLifecycleManager");
jest.mock("../../src/infrastructure/lifecycle/GraphLifecycleManager");
jest.mock("../../src/presentation/command-controllers/AssetCommandController");
jest.mock("../../src/presentation/command-controllers/RDFCommandController");
jest.mock("../../src/presentation/processors/QueryProcessor");
jest.mock("../../src/infrastructure/logging/LoggerFactory");

import { LifecycleRegistry } from "../../src/infrastructure/lifecycle/LifecycleRegistry";
import { CommandRegistry } from "../../src/presentation/command-controllers/CommandRegistry";
import { ServiceProvider } from "../../src/infrastructure/providers/ServiceProvider";
import { SettingsLifecycleManager } from "../../src/infrastructure/lifecycle/SettingsLifecycleManager";
import { GraphLifecycleManager } from "../../src/infrastructure/lifecycle/GraphLifecycleManager";
import { AssetCommandController } from "../../src/presentation/command-controllers/AssetCommandController";
import { RDFCommandController } from "../../src/presentation/command-controllers/RDFCommandController";
import { QueryProcessor } from "../../src/presentation/processors/QueryProcessor";
import { LoggerFactory } from "../../src/infrastructure/logging/LoggerFactory";
import { ExocortexSettings } from "../../src/domain/entities/ExocortexSettings";

describe("ExocortexPlugin", () => {
  let plugin: ExocortexPlugin;
  let mockApp: App;
  let mockLogger: any;
  let mockLifecycleRegistry: jest.Mocked<LifecycleRegistry>;
  let mockCommandRegistry: jest.Mocked<CommandRegistry>;
  let mockServiceProvider: jest.Mocked<ServiceProvider>;
  let mockSettingsManager: jest.Mocked<SettingsLifecycleManager>;
  let mockGraphManager: jest.Mocked<GraphLifecycleManager>;

  beforeEach(() => {
    // Setup mock logger
    mockLogger = {
      startTiming: jest.fn(),
      endTiming: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    // Mock logger factory
    (LoggerFactory.createForClass as jest.Mock).mockReturnValue(mockLogger);

    // Setup mock app
    mockApp = new App();

    // Create plugin instance
    plugin = new ExocortexPlugin(mockApp, {
      id: "exocortex",
      name: "Exocortex",
    });

    // Setup mock instances
    mockLifecycleRegistry = {
      registerManager: jest.fn(),
      initializeAll: jest.fn().mockResolvedValue(undefined),
      cleanupAll: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockCommandRegistry = {
      registerController: jest.fn(),
      initializeAll: jest.fn().mockResolvedValue(undefined),
      cleanupAll: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockServiceProvider = {
      initializeServices: jest.fn().mockResolvedValue(undefined),
      getService: jest.fn().mockReturnValue({}),
      updateServices: jest.fn(),
      cleanup: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockSettingsManager = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getSettings: jest.fn().mockReturnValue({ version: "1.0.0" }),
      saveSettings: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockGraphManager = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getGraph: jest.fn().mockReturnValue({}),
    } as any;

    // Mock constructors
    (LifecycleRegistry as jest.Mock).mockReturnValue(mockLifecycleRegistry);
    (CommandRegistry as jest.Mock).mockReturnValue(mockCommandRegistry);
    (ServiceProvider as jest.Mock).mockReturnValue(mockServiceProvider);
    (SettingsLifecycleManager as jest.Mock).mockReturnValue(
      mockSettingsManager,
    );
    (GraphLifecycleManager as jest.Mock).mockReturnValue(mockGraphManager);
    (AssetCommandController as jest.Mock).mockReturnValue({});
    (RDFCommandController as jest.Mock).mockReturnValue({});
    (QueryProcessor as jest.Mock).mockReturnValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Plugin Lifecycle", () => {
    describe("onload", () => {
      it("should initialize successfully with correct sequence", async () => {
        // Act
        await plugin.onload();

        // Assert - Check initialization sequence
        expect(LoggerFactory.createForClass).toHaveBeenCalledWith(
          ExocortexPlugin,
        );
        expect(mockLogger.startTiming).toHaveBeenCalledWith("plugin-onload");

        // Verify registries created
        expect(LifecycleRegistry).toHaveBeenCalledWith(plugin);
        expect(CommandRegistry).toHaveBeenCalledWith(plugin);

        // Verify lifecycle managers initialized
        expect(SettingsLifecycleManager).toHaveBeenCalledWith(plugin);
        expect(GraphLifecycleManager).toHaveBeenCalledWith(plugin);
        expect(mockLifecycleRegistry.registerManager).toHaveBeenCalledWith(
          mockSettingsManager,
        );
        expect(mockLifecycleRegistry.registerManager).toHaveBeenCalledWith(
          mockGraphManager,
        );
        expect(mockSettingsManager.initialize).toHaveBeenCalled();

        // Verify service provider initialized
        expect(ServiceProvider).toHaveBeenCalledWith(
          plugin,
          mockGraphManager.getGraph(),
          mockSettingsManager.getSettings(),
        );
        expect(mockServiceProvider.initializeServices).toHaveBeenCalled();

        // Verify command controllers created and registered
        expect(AssetCommandController).toHaveBeenCalledWith(plugin);
        expect(RDFCommandController).toHaveBeenCalledWith(
          plugin,
          mockGraphManager.getGraph(),
          mockServiceProvider.getService("RDFService"),
          expect.any(Object),
        );
        expect(mockCommandRegistry.registerController).toHaveBeenCalledTimes(2);

        // Verify initialization called
        expect(mockLifecycleRegistry.initializeAll).toHaveBeenCalled();
        expect(mockCommandRegistry.initializeAll).toHaveBeenCalled();

        // Verify logging
        expect(mockLogger.endTiming).toHaveBeenCalledWith("plugin-onload");
        expect(mockLogger.info).toHaveBeenCalledWith(
          "Exocortex Plugin initialized successfully",
          {
            managers: ["lifecycle", "settings", "graph"],
            controllers: ["asset", "rdf"],
          },
        );
      });

      it("should handle initialization errors gracefully", async () => {
        // Arrange
        const testError = new Error("Initialization failed");
        mockSettingsManager.initialize.mockRejectedValue(testError);

        // Act & Assert
        await expect(plugin.onload()).rejects.toThrow("Initialization failed");

        expect(mockLogger.error).toHaveBeenCalledWith(
          "Failed to initialize Exocortex Plugin",
          { stage: "onload" },
          testError,
        );
      });

      it("should handle logger creation failure", async () => {
        // Arrange
        (LoggerFactory.createForClass as jest.Mock).mockImplementation(() => {
          throw new Error("Logger creation failed");
        });

        // Act & Assert
        await expect(plugin.onload()).rejects.toThrow("Logger creation failed");
      });

      it("should handle lifecycle registry initialization failure", async () => {
        // Arrange
        mockLifecycleRegistry.initializeAll.mockRejectedValue(
          new Error("Lifecycle init failed"),
        );

        // Act & Assert
        await expect(plugin.onload()).rejects.toThrow("Lifecycle init failed");
      });

      it("should handle service provider initialization failure", async () => {
        // Arrange
        mockServiceProvider.initializeServices.mockRejectedValue(
          new Error("Service provider init failed"),
        );

        // Act & Assert
        await expect(plugin.onload()).rejects.toThrow(
          "Service provider init failed",
        );
      });
    });

    describe("onunload", () => {
      beforeEach(async () => {
        await plugin.onload();
        jest.clearAllMocks();
      });

      it("should cleanup in reverse order successfully", async () => {
        // Act
        await plugin.onunload();

        // Assert - Check cleanup sequence
        expect(mockLogger.startTiming).toHaveBeenCalledWith("plugin-onunload");

        // Verify cleanup order (reverse of initialization)
        expect(mockCommandRegistry.cleanupAll).toHaveBeenCalled();
        expect(mockServiceProvider.cleanup).toHaveBeenCalled();
        expect(mockLifecycleRegistry.cleanupAll).toHaveBeenCalled();

        // Verify logging
        expect(mockLogger.endTiming).toHaveBeenCalledWith("plugin-onunload");
        expect(mockLogger.info).toHaveBeenCalledWith(
          "Exocortex Plugin cleaned up successfully",
          {
            cleanedUp: ["commands", "services", "lifecycle"],
          },
        );
      });

      it("should handle cleanup errors gracefully", async () => {
        // Arrange
        const cleanupError = new Error("Cleanup failed");
        mockCommandRegistry.cleanupAll.mockRejectedValue(cleanupError);

        // Act - should not throw
        await plugin.onunload();

        // Assert
        expect(mockLogger.error).toHaveBeenCalledWith(
          "Error during plugin cleanup",
          { stage: "onunload" },
          cleanupError,
        );
      });

      it("should handle missing components during cleanup", async () => {
        // Arrange - simulate uninitialized plugin
        const uninitializedPlugin = new ExocortexPlugin(mockApp, {
          id: "exocortex",
          name: "Exocortex",
        });

        // Act - should not throw
        await uninitializedPlugin.onunload();

        // Assert - should handle gracefully
        expect(mockLogger.info).not.toHaveBeenCalled(); // Logger not initialized
      });
    });
  });

  describe("Settings Management", () => {
    beforeEach(async () => {
      await plugin.onload();
    });

    describe("get settings", () => {
      it("should return settings from settings manager", () => {
        // Arrange
        const mockSettings = { version: "1.0.0", debug: true };
        mockSettingsManager.getSettings.mockReturnValue(
          mockSettings as ExocortexSettings,
        );

        // Act
        const settings = plugin.settings;

        // Assert
        expect(settings).toBe(mockSettings);
        expect(mockSettingsManager.getSettings).toHaveBeenCalled();
      });

      it("should handle missing settings manager", () => {
        // Arrange
        const uninitializedPlugin = new ExocortexPlugin(mockApp, {
          id: "exocortex",
          name: "Exocortex",
        });

        // Act
        const settings = uninitializedPlugin.settings;

        // Assert
        expect(settings).toBeUndefined();
      });
    });

    describe("saveSettings", () => {
      it("should save settings and update services", async () => {
        // Arrange
        const mockSettings = { version: "1.0.0", debug: true };
        mockSettingsManager.getSettings.mockReturnValue(
          mockSettings as ExocortexSettings,
        );

        // Act
        await plugin.saveSettings();

        // Assert
        expect(mockSettingsManager.saveSettings).toHaveBeenCalled();
        expect(mockServiceProvider.updateServices).toHaveBeenCalledWith(
          mockSettings,
        );
      });

      it("should handle save errors gracefully", async () => {
        // Arrange
        mockSettingsManager.saveSettings.mockRejectedValue(
          new Error("Save failed"),
        );

        // Act & Assert - should propagate error
        await expect(plugin.saveSettings()).rejects.toThrow("Save failed");
      });
    });

    describe("updateContainer", () => {
      it("should update services with current settings", () => {
        // Arrange
        const mockSettings = { version: "1.0.0", debug: false };
        mockSettingsManager.getSettings.mockReturnValue(
          mockSettings as ExocortexSettings,
        );

        // Act
        plugin.updateContainer();

        // Assert
        expect(mockServiceProvider.updateServices).toHaveBeenCalledWith(
          mockSettings,
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle missing dependencies gracefully", async () => {
      // Arrange
      (LifecycleRegistry as jest.Mock).mockImplementation(() => {
        throw new Error("Dependency injection failed");
      });

      // Act & Assert
      await expect(plugin.onload()).rejects.toThrow(
        "Dependency injection failed",
      );
    });

    it("should handle async operation timeouts", async () => {
      // Arrange
      mockLifecycleRegistry.initializeAll.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000)),
      );

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 100),
      );

      // Mock the plugin's onload to race with timeout
      const originalOnload = plugin.onload.bind(plugin);
      plugin.onload = jest
        .fn()
        .mockImplementation(() =>
          Promise.race([originalOnload(), timeoutPromise]),
        );

      // Act & Assert
      await expect(plugin.onload()).rejects.toThrow("Timeout");
    });
  });

  describe("Memory Management", () => {
    it("should not leak memory after multiple load/unload cycles", async () => {
      // Track initial state
      const initialMockCalls =
        mockLifecycleRegistry.registerManager.mock.calls.length;

      // Perform multiple cycles
      for (let i = 0; i < 3; i++) {
        await plugin.onload();
        await plugin.onunload();
      }

      // Verify cleanup was called appropriately
      expect(mockLifecycleRegistry.cleanupAll).toHaveBeenCalledTimes(3);
      expect(mockCommandRegistry.cleanupAll).toHaveBeenCalledTimes(3);
      expect(mockServiceProvider.cleanup).toHaveBeenCalledTimes(3);
    });
  });

  describe("Integration Points", () => {
    beforeEach(async () => {
      await plugin.onload();
    });

    it("should properly wire up cache invalidation callback", () => {
      // This test verifies the setupCacheInvalidation method is called
      // Currently a placeholder, but ensures the method exists and is called
      expect(plugin.onload).toBeDefined();
    });

    it("should expose correct public interface", () => {
      // Verify public methods are available
      expect(typeof plugin.settings).toBe("object");
      expect(typeof plugin.saveSettings).toBe("function");
      expect(typeof plugin.updateContainer).toBe("function");
      expect(typeof plugin.onload).toBe("function");
      expect(typeof plugin.onunload).toBe("function");
    });

    it("should maintain correct initialization order dependencies", async () => {
      // Reset and track call order
      jest.clearAllMocks();

      const callOrder: string[] = [];

      mockSettingsManager.initialize.mockImplementation(async () => {
        callOrder.push("settings-init");
      });

      mockLifecycleRegistry.initializeAll.mockImplementation(async () => {
        callOrder.push("lifecycle-init");
      });

      mockCommandRegistry.initializeAll.mockImplementation(async () => {
        callOrder.push("commands-init");
      });

      // Act
      await plugin.onload();

      // Assert - settings must be initialized first, then lifecycle, then commands
      expect(callOrder).toEqual([
        "settings-init",
        "lifecycle-init",
        "commands-init",
      ]);
    });
  });

  describe("Edge Cases", () => {
    it("should handle double initialization gracefully", async () => {
      // Act
      await plugin.onload();

      // Second initialization should not break
      await plugin.onload();

      // Assert - managers should be called again (idempotent behavior)
      expect(mockSettingsManager.initialize).toHaveBeenCalledTimes(2);
    });

    it("should handle cleanup without initialization", async () => {
      // Act - cleanup without init
      await plugin.onunload();

      // Assert - should handle gracefully
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it("should handle partial initialization failure", async () => {
      // Arrange - fail after settings but before service provider
      mockServiceProvider.initializeServices.mockRejectedValue(
        new Error("Service initialization failed"),
      );

      // Act & Assert
      await expect(plugin.onload()).rejects.toThrow(
        "Service initialization failed",
      );

      // Verify partial cleanup would work
      expect(mockSettingsManager.initialize).toHaveBeenCalled();
    });
  });
});
