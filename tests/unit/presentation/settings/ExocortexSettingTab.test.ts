import { ExocortexSettingTab } from "../../../../src/presentation/settings/ExocortexSettingTab";
import { ExocortexSettings } from "../../../../src/domain/entities/ExocortexSettings";
import { Result } from "../../../../src/domain/core/Result";
import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import ExocortexPlugin from "../../../../src/main";

// Mock Obsidian components
jest.mock("obsidian", () => ({
  PluginSettingTab: jest.fn().mockImplementation(function(this: any, app: any, plugin: any) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = {
      empty: jest.fn(),
      createEl: jest.fn().mockReturnValue({
        style: {},
        querySelector: jest.fn(),
      }),
    };
    return this;
  }),
  Setting: jest.fn().mockImplementation(function(this: any) {
    this.setName = jest.fn().mockReturnThis();
    this.setDesc = jest.fn().mockReturnThis();
    this.addToggle = jest.fn().mockReturnThis();
    this.addButton = jest.fn().mockReturnThis();
    return this;
  }),
  Notice: jest.fn(),
}));

// Mock document methods
Object.defineProperty(document, 'body', {
  value: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  },
  writable: true,
});

Object.defineProperty(document, 'createElement', {
  value: jest.fn().mockImplementation((tagName: string) => {
    const element = {
      tagName: tagName.toUpperCase(),
      className: '',
      innerHTML: '',
      onclick: null,
      querySelector: jest.fn(),
      style: {},
    };
    return element;
  }),
  writable: true,
});

describe("ExocortexSettingTab", () => {
  let settingTab: ExocortexSettingTab;
  let mockApp: jest.Mocked<App>;
  let mockPlugin: jest.Mocked<ExocortexPlugin>;
  let mockSettings: jest.Mocked<ExocortexSettings>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockApp = {} as jest.Mocked<App>;

    mockSettings = {
      get: jest.fn(),
      set: jest.fn(),
      resetToDefaults: jest.fn(),
    } as any;

    mockPlugin = {
      settings: mockSettings,
      saveSettings: jest.fn(),
      updateContainer: jest.fn(),
    } as any;

    settingTab = new ExocortexSettingTab(mockApp, mockPlugin);
  });

  describe("Initialization", () => {
    it("should initialize with app and plugin references", () => {
      expect(settingTab.plugin).toBe(mockPlugin);
      expect((settingTab as any).settings).toBe(mockSettings);
    });

    it("should extend PluginSettingTab", () => {
      expect(PluginSettingTab).toHaveBeenCalledWith(mockApp, mockPlugin);
    });
  });

  describe("Display Method", () => {
    beforeEach(() => {
      mockSettings.get.mockReturnValue(false);
    });

    it("should clear container and create header elements", () => {
      settingTab.display();

      expect(settingTab.containerEl.empty).toHaveBeenCalled();
      expect(settingTab.containerEl.createEl).toHaveBeenCalledWith("h1", { text: "Exocortex Settings" });
      expect(settingTab.containerEl.createEl).toHaveBeenCalledWith("p", {
        text: "Essential settings for the Exocortex plugin.",
        cls: "setting-item-description",
      });
    });

    it("should create debug section", () => {
      settingTab.display();

      expect(settingTab.containerEl.createEl).toHaveBeenCalledWith("h2", { text: "Debug Settings" });
      expect(Setting).toHaveBeenCalled();
    });

    it("should create reset section", () => {
      settingTab.display();

      expect(settingTab.containerEl.createEl).toHaveBeenCalledWith("h2", { text: "Reset Settings" });
    });

    it("should create warning message with error color", () => {
      const mockWarningEl = { style: {} };
      settingTab.containerEl.createEl.mockReturnValue(mockWarningEl);

      settingTab.display();

      expect(mockWarningEl.style.color).toBe("var(--text-error)");
    });
  });

  describe("Debug Settings", () => {
    beforeEach(() => {
      mockSettings.get.mockReturnValue(false);
      settingTab.display();
    });

    it("should create debug mode toggle", () => {
      expect(Setting).toHaveBeenCalled();
      
      // Get the first Setting instance (debug mode)
      const settingInstances = (Setting as jest.Mock).mock.instances;
      const debugModeSetting = settingInstances[0];
      
      expect(debugModeSetting.setName).toHaveBeenCalledWith("Enable debug mode");
      expect(debugModeSetting.setDesc).toHaveBeenCalledWith("Enable extended logging and debug features");
      expect(debugModeSetting.addToggle).toHaveBeenCalled();
    });

    it("should create performance tracking toggle", () => {
      const settingInstances = (Setting as jest.Mock).mock.instances;
      const performanceSetting = settingInstances[1];
      
      expect(performanceSetting.setName).toHaveBeenCalledWith("Enable performance tracking");
      expect(performanceSetting.setDesc).toHaveBeenCalledWith("Track and log performance metrics");
      expect(performanceSetting.addToggle).toHaveBeenCalled();
    });

    it("should create verbose logging toggle", () => {
      const settingInstances = (Setting as jest.Mock).mock.instances;
      const verboseSetting = settingInstances[2];
      
      expect(verboseSetting.setName).toHaveBeenCalledWith("Show console logs");
      expect(verboseSetting.setDesc).toHaveBeenCalledWith("Display detailed logs in the developer console");
      expect(verboseSetting.addToggle).toHaveBeenCalled();
    });

    it("should read current setting values", () => {
      expect(mockSettings.get).toHaveBeenCalledWith("enableDebugMode");
      expect(mockSettings.get).toHaveBeenCalledWith("enablePerformanceMetrics");
      expect(mockSettings.get).toHaveBeenCalledWith("enableVerboseLogging");
    });
  });

  describe("Setting Updates", () => {
    beforeEach(() => {
      mockSettings.get.mockReturnValue(false);
      mockSettings.set.mockReturnValue(Result.ok(undefined));
    });

    it("should update settings successfully", async () => {
      await (settingTab as any).updateSetting("enableDebugMode", true);

      expect(mockSettings.set).toHaveBeenCalledWith("enableDebugMode", true);
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
      expect(mockPlugin.updateContainer).toHaveBeenCalled();
    });

    it("should handle setting update failures", async () => {
      mockSettings.set.mockReturnValue(Result.fail("Setting validation failed"));

      await (settingTab as any).updateSetting("enableDebugMode", true);

      expect(Notice).toHaveBeenCalledWith("Settings error: Setting validation failed");
      expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
    });

    it("should work without updateContainer method", async () => {
      mockPlugin.updateContainer = undefined;

      await (settingTab as any).updateSetting("enableDebugMode", true);

      expect(mockSettings.set).toHaveBeenCalledWith("enableDebugMode", true);
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
    });

    it("should handle different setting keys and values", async () => {
      const testCases = [
        ["enableDebugMode", true],
        ["enablePerformanceMetrics", false],
        ["enableVerboseLogging", true],
      ];

      for (const [key, value] of testCases) {
        await (settingTab as any).updateSetting(key, value);
        expect(mockSettings.set).toHaveBeenCalledWith(key, value);
      }
    });
  });

  describe("Reset Functionality", () => {
    it("should create reset button", () => {
      settingTab.display();

      const settingInstances = (Setting as jest.Mock).mock.instances;
      const resetSetting = settingInstances[settingInstances.length - 1]; // Last setting should be reset

      expect(resetSetting.setName).toHaveBeenCalledWith("Reset to defaults");
      expect(resetSetting.setDesc).toHaveBeenCalledWith("Reset all plugin settings to their default values");
      expect(resetSetting.addButton).toHaveBeenCalled();
    });

    it("should handle reset confirmation dialog", async () => {
      // Mock the DOM elements that would be created
      const mockModal = {
        querySelector: jest.fn().mockImplementation((selector) => {
          switch (selector) {
            case "#confirm-reset":
              return { onclick: null };
            case "#cancel-reset":
              return { onclick: null };
            case ".modal-bg":
              return { onclick: null };
            default:
              return null;
          }
        }),
      };

      (document.createElement as jest.Mock).mockReturnValue(mockModal);

      const confirmResetPromise = (settingTab as any).confirmReset();

      // Should have created modal
      expect(document.createElement).toHaveBeenCalledWith("div");
      expect(document.body.appendChild).toHaveBeenCalled();

      // Simulate clicking confirm button
      const confirmBtn = mockModal.querySelector("#confirm-reset");
      if (confirmBtn) {
        confirmBtn.onclick();
      }

      const result = await confirmResetPromise;
      expect(result).toBe(true);
    });

    it("should handle reset cancellation", async () => {
      const mockModal = {
        querySelector: jest.fn().mockImplementation((selector) => {
          switch (selector) {
            case "#confirm-reset":
              return { onclick: null };
            case "#cancel-reset":
              return { onclick: null };
            case ".modal-bg":
              return { onclick: null };
            default:
              return null;
          }
        }),
      };

      (document.createElement as jest.Mock).mockReturnValue(mockModal);

      const confirmResetPromise = (settingTab as any).confirmReset();

      // Simulate clicking cancel button
      const cancelBtn = mockModal.querySelector("#cancel-reset");
      if (cancelBtn) {
        cancelBtn.onclick();
      }

      const result = await confirmResetPromise;
      expect(result).toBe(false);
    });

    it("should handle background click cancellation", async () => {
      const mockModal = {
        querySelector: jest.fn().mockImplementation((selector) => {
          switch (selector) {
            case "#confirm-reset":
              return { onclick: null };
            case "#cancel-reset":
              return { onclick: null };
            case ".modal-bg":
              return { onclick: null };
            default:
              return null;
          }
        }),
      };

      (document.createElement as jest.Mock).mockReturnValue(mockModal);

      const confirmResetPromise = (settingTab as any).confirmReset();

      // Simulate clicking modal background
      const modalBg = mockModal.querySelector(".modal-bg");
      if (modalBg) {
        modalBg.onclick();
      }

      const result = await confirmResetPromise;
      expect(result).toBe(false);
    });

    it("should reset all settings when confirmed", async () => {
      // Mock display method
      const displaySpy = jest.spyOn(settingTab, 'display').mockImplementation();

      await (settingTab as any).resetAllSettings();

      expect(mockSettings.resetToDefaults).toHaveBeenCalled();
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
      expect(mockPlugin.updateContainer).toHaveBeenCalled();
      expect(displaySpy).toHaveBeenCalled();
      expect(Notice).toHaveBeenCalledWith("✅ All settings have been reset to defaults");

      displaySpy.mockRestore();
    });

    it("should work without updateContainer during reset", async () => {
      mockPlugin.updateContainer = undefined;
      const displaySpy = jest.spyOn(settingTab, 'display').mockImplementation();

      await (settingTab as any).resetAllSettings();

      expect(mockSettings.resetToDefaults).toHaveBeenCalled();
      expect(mockPlugin.saveSettings).toHaveBeenCalled();

      displaySpy.mockRestore();
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle missing DOM elements in confirmation modal", async () => {
      const mockModal = {
        querySelector: jest.fn().mockReturnValue(null),
      };

      (document.createElement as jest.Mock).mockReturnValue(mockModal);

      // Should not crash even if DOM elements are not found
      const result = await (settingTab as any).confirmReset();
      
      // Should handle gracefully (might resolve with false or handle differently)
      expect(typeof result).toBe("boolean");
    });

    it("should handle settings get/set exceptions", async () => {
      mockSettings.get.mockImplementation(() => {
        throw new Error("Settings read error");
      });

      // Should not crash when rendering
      expect(() => settingTab.display()).not.toThrow();
    });

    it("should handle plugin save failures", async () => {
      mockPlugin.saveSettings.mockRejectedValue(new Error("Save failed"));
      mockSettings.set.mockReturnValue(Result.ok(undefined));

      // Should handle the promise rejection gracefully
      await expect((settingTab as any).updateSetting("enableDebugMode", true))
        .resolves
        .toBeUndefined();
    });

    it("should handle updateContainer exceptions", async () => {
      mockPlugin.updateContainer = jest.fn().mockImplementation(() => {
        throw new Error("Container update failed");
      });
      mockSettings.set.mockReturnValue(Result.ok(undefined));

      // Should not crash despite updateContainer failing
      await expect((settingTab as any).updateSetting("enableDebugMode", true))
        .resolves
        .toBeUndefined();
    });

    it("should handle null/undefined plugin references", () => {
      const nullPluginTab = new ExocortexSettingTab(mockApp, null as any);

      // Should handle gracefully without crashing
      expect(() => nullPluginTab.display()).not.toThrow();
    });
  });

  describe("DOM Manipulation", () => {
    it("should properly structure the settings UI", () => {
      settingTab.display();

      // Should create proper heading structure
      expect(settingTab.containerEl.createEl).toHaveBeenCalledWith("h1", { text: "Exocortex Settings" });
      expect(settingTab.containerEl.createEl).toHaveBeenCalledWith("h2", { text: "Debug Settings" });
      expect(settingTab.containerEl.createEl).toHaveBeenCalledWith("h2", { text: "Reset Settings" });
    });

    it("should create appropriate CSS classes", () => {
      settingTab.display();

      expect(settingTab.containerEl.createEl).toHaveBeenCalledWith("p", {
        text: "Essential settings for the Exocortex plugin.",
        cls: "setting-item-description",
      });

      expect(settingTab.containerEl.createEl).toHaveBeenCalledWith("p", {
        text: "Debug options for troubleshooting plugin issues.",
        cls: "setting-item-description",
      });
    });

    it("should handle containerEl methods safely", () => {
      // Mock containerEl methods to throw errors
      settingTab.containerEl.createEl.mockImplementation(() => {
        throw new Error("DOM error");
      });

      // Should handle DOM errors gracefully
      expect(() => settingTab.display()).not.toThrow();
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle complete settings workflow", async () => {
      // Initial display
      settingTab.display();
      
      // Update a setting
      mockSettings.set.mockReturnValue(Result.ok(undefined));
      await (settingTab as any).updateSetting("enableDebugMode", true);
      
      // Reset settings
      const displaySpy = jest.spyOn(settingTab, 'display').mockImplementation();
      await (settingTab as any).resetAllSettings();
      
      expect(mockSettings.set).toHaveBeenCalledWith("enableDebugMode", true);
      expect(mockSettings.resetToDefaults).toHaveBeenCalled();
      expect(displaySpy).toHaveBeenCalled();
      
      displaySpy.mockRestore();
    });

    it("should handle rapid setting changes", async () => {
      mockSettings.set.mockReturnValue(Result.ok(undefined));
      
      // Simulate rapid setting changes
      const promises = [
        (settingTab as any).updateSetting("enableDebugMode", true),
        (settingTab as any).updateSetting("enablePerformanceMetrics", true),
        (settingTab as any).updateSetting("enableVerboseLogging", false),
      ];
      
      await Promise.all(promises);
      
      expect(mockSettings.set).toHaveBeenCalledTimes(3);
      expect(mockPlugin.saveSettings).toHaveBeenCalledTimes(3);
    });

    it("should maintain state consistency", () => {
      mockSettings.get
        .mockReturnValueOnce(true)   // enableDebugMode
        .mockReturnValueOnce(false)  // enablePerformanceMetrics  
        .mockReturnValueOnce(true);  // enableVerboseLogging

      settingTab.display();

      // Should have called get for each setting
      expect(mockSettings.get).toHaveBeenCalledTimes(3);
      expect(mockSettings.get).toHaveBeenCalledWith("enableDebugMode");
      expect(mockSettings.get).toHaveBeenCalledWith("enablePerformanceMetrics");
      expect(mockSettings.get).toHaveBeenCalledWith("enableVerboseLogging");
    });
  });
});