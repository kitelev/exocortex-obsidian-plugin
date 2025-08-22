import { App } from "obsidian";
import { ExocortexSettingTab } from "../../../src/presentation/settings/ExocortexSettingTab";
import { ExocortexSettings } from "../../../src/domain/entities/ExocortexSettings";

// Create mock functions for testing
function createMockApp(): any {
  return {
    vault: {
      adapter: {
        exists: jest.fn(),
        read: jest.fn(),
        write: jest.fn(),
      },
    },
  };
}

function createMockPlugin(): any {
  return {
    app: createMockApp(),
    settings: null,
    saveSettings: jest.fn(),
    updateContainer: jest.fn(),
  };
}

// Mock DOM methods for testing
Object.defineProperty(document, "createElement", {
  value: jest.fn(() => ({
    appendChild: jest.fn(),
    remove: jest.fn(),
    querySelector: jest.fn(),
    innerHTML: "",
    className: "",
    textContent: "",
    style: {},
    onclick: null,
  })),
  writable: true,
});

describe("ExocortexSettingTab Integration", () => {
  let mockApp: App;
  let mockPlugin: any;
  let settingTab: ExocortexSettingTab;

  beforeEach(() => {
    mockApp = createMockApp();
    mockPlugin = createMockPlugin();

    // Initialize plugin with settings
    mockPlugin.settings = new ExocortexSettings();
    mockPlugin.saveSettings = jest.fn().mockResolvedValue(undefined);
    mockPlugin.updateContainer = jest.fn();

    settingTab = new ExocortexSettingTab(mockApp, mockPlugin);
  });

  describe("Construction", () => {
    it("should create settings tab with plugin reference", () => {
      expect(settingTab).toBeDefined();
      expect(settingTab.plugin).toBe(mockPlugin);
    });
  });

  describe("Display", () => {
    it("should be properly initialized", () => {
      expect(settingTab).toBeInstanceOf(ExocortexSettingTab);
      expect(typeof settingTab.display).toBe("function");
    });
  });

  describe("Settings Updates", () => {
    it("should update settings and save when value changes", async () => {
      const settingTab = new ExocortexSettingTab(mockApp, mockPlugin);

      // Call the private updateSetting method through reflection for testing
      const updateSetting = (settingTab as any).updateSetting.bind(settingTab);

      await updateSetting("enableDebugMode", true);

      expect(mockPlugin.settings.get("enableDebugMode")).toBe(true);
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
      expect(mockPlugin.updateContainer).toHaveBeenCalled();
    });

    it("should handle invalid settings gracefully", async () => {
      const settingTab = new ExocortexSettingTab(mockApp, mockPlugin);
      const updateSetting = (settingTab as any).updateSetting.bind(settingTab);

      // This should not throw but should not save either
      await updateSetting("sparqlCacheMaxSize", -1);

      // Settings should not be updated with invalid value
      expect(mockPlugin.settings.get("sparqlCacheMaxSize")).not.toBe(-1);
      expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
    });
  });

  describe("Reset Functionality", () => {
    it("should reset settings to defaults", async () => {
      // Modify some settings first
      mockPlugin.settings.set("enableDebugMode", true);
      mockPlugin.settings.set("layoutsFolderPath", "custom-layouts");

      const settingTab = new ExocortexSettingTab(mockApp, mockPlugin);
      const resetAllSettings = (settingTab as any).resetAllSettings.bind(
        settingTab,
      );

      // Mock display method to avoid DOM operations
      settingTab.display = jest.fn();

      await resetAllSettings();

      expect(mockPlugin.settings.get("enableDebugMode")).toBe(false);
      expect(mockPlugin.settings.get("layoutsFolderPath")).toBe("layouts");
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
      expect(mockPlugin.updateContainer).toHaveBeenCalled();
    });
  });

  describe("Settings Integration with Plugin", () => {
    it("should properly integrate with plugin settings lifecycle", () => {
      const settings = new ExocortexSettings({
        enableDebugMode: true,
        sparqlCacheMaxSize: 1000,
        layoutsFolderPath: "test-layouts",
      });

      mockPlugin.settings = settings;

      const settingTab = new ExocortexSettingTab(mockApp, mockPlugin);

      expect(settingTab.plugin.settings.get("enableDebugMode")).toBe(true);
      expect(settingTab.plugin.settings.get("sparqlCacheMaxSize")).toBe(1000);
      expect(settingTab.plugin.settings.get("layoutsFolderPath")).toBe(
        "test-layouts",
      );
    });
  });
});
