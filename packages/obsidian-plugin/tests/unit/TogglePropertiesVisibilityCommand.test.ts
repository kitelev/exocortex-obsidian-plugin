import { TogglePropertiesVisibilityCommand } from "../../src/application/commands/TogglePropertiesVisibilityCommand";
import { Notice } from "obsidian";
import { ExocortexPluginInterface } from "../../src/types";

jest.mock("obsidian", () => ({
  ...jest.requireActual("obsidian"),
  Notice: jest.fn(),
}));

describe("TogglePropertiesVisibilityCommand", () => {
  let command: TogglePropertiesVisibilityCommand;
  let mockPlugin: jest.Mocked<ExocortexPluginInterface>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock plugin
    mockPlugin = {
      settings: {
        showPropertiesSection: false,
      },
      saveSettings: jest.fn(),
      refreshLayout: jest.fn(),
    } as unknown as jest.Mocked<ExocortexPluginInterface>;

    // Create command instance
    command = new TogglePropertiesVisibilityCommand(mockPlugin);
  });

  describe("id and name", () => {
    it("should have correct id and name", () => {
      expect(command.id).toBe("toggle-properties-visibility");
      expect(command.name).toBe("Toggle properties visibility");
    });
  });

  describe("callback", () => {
    it("should toggle showPropertiesSection from false to true", async () => {
      mockPlugin.settings.showPropertiesSection = false;
      mockPlugin.saveSettings.mockResolvedValue();

      await command.callback();

      expect(mockPlugin.settings.showPropertiesSection).toBe(true);
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
      expect(mockPlugin.refreshLayout).toHaveBeenCalled();
      expect(Notice).toHaveBeenCalledWith("Properties section shown");
    });

    it("should toggle showPropertiesSection from true to false", async () => {
      mockPlugin.settings.showPropertiesSection = true;
      mockPlugin.saveSettings.mockResolvedValue();

      await command.callback();

      expect(mockPlugin.settings.showPropertiesSection).toBe(false);
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
      expect(mockPlugin.refreshLayout).toHaveBeenCalled();
      expect(Notice).toHaveBeenCalledWith("Properties section hidden");
    });

    it("should handle multiple toggles correctly", async () => {
      mockPlugin.settings.showPropertiesSection = false;
      mockPlugin.saveSettings.mockResolvedValue();

      // First toggle (false -> true)
      await command.callback();
      expect(mockPlugin.settings.showPropertiesSection).toBe(true);
      expect(Notice).toHaveBeenNthCalledWith(1, "Properties section shown");

      // Second toggle (true -> false)
      await command.callback();
      expect(mockPlugin.settings.showPropertiesSection).toBe(false);
      expect(Notice).toHaveBeenNthCalledWith(2, "Properties section hidden");

      // Third toggle (false -> true)
      await command.callback();
      expect(mockPlugin.settings.showPropertiesSection).toBe(true);
      expect(Notice).toHaveBeenNthCalledWith(3, "Properties section shown");

      // Fourth toggle (true -> false)
      await command.callback();
      expect(mockPlugin.settings.showPropertiesSection).toBe(false);
      expect(Notice).toHaveBeenNthCalledWith(4, "Properties section hidden");

      expect(mockPlugin.saveSettings).toHaveBeenCalledTimes(4);
      expect(mockPlugin.refreshLayout).toHaveBeenCalledTimes(4);
    });

    it("should handle saveSettings errors", async () => {
      mockPlugin.settings.showPropertiesSection = false;
      const error = new Error("Save failed");
      mockPlugin.saveSettings.mockRejectedValue(error);

      await expect(command.callback()).rejects.toThrow("Save failed");

      // Settings should still be toggled even if save fails
      expect(mockPlugin.settings.showPropertiesSection).toBe(true);
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
      // refreshLayout should not be called if saveSettings fails
      expect(mockPlugin.refreshLayout).not.toHaveBeenCalled();
    });

    it("should handle missing refreshLayout gracefully", async () => {
      mockPlugin.settings.showPropertiesSection = false;
      mockPlugin.refreshLayout = undefined;
      mockPlugin.saveSettings.mockResolvedValue();

      await command.callback();

      expect(mockPlugin.settings.showPropertiesSection).toBe(true);
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
      expect(Notice).toHaveBeenCalledWith("Properties section shown");
      // Should not throw even if refreshLayout is undefined
    });

    it("should handle null refreshLayout", async () => {
      mockPlugin.settings.showPropertiesSection = true;
      mockPlugin.refreshLayout = null;
      mockPlugin.saveSettings.mockResolvedValue();

      await command.callback();

      expect(mockPlugin.settings.showPropertiesSection).toBe(false);
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
      expect(Notice).toHaveBeenCalledWith("Properties section hidden");
    });

    it("should call refreshLayout if it exists", async () => {
      mockPlugin.settings.showPropertiesSection = false;
      mockPlugin.saveSettings.mockResolvedValue();
      const mockRefreshLayout = jest.fn();
      mockPlugin.refreshLayout = mockRefreshLayout;

      await command.callback();

      expect(mockRefreshLayout).toHaveBeenCalled();
      expect(mockRefreshLayout).toHaveBeenCalledTimes(1);
    });

    it("should persist state across command instances", async () => {
      mockPlugin.settings.showPropertiesSection = false;
      mockPlugin.saveSettings.mockResolvedValue();

      // First command instance
      const command1 = new TogglePropertiesVisibilityCommand(mockPlugin);
      await command1.callback();
      expect(mockPlugin.settings.showPropertiesSection).toBe(true);

      // Second command instance should see the updated state
      const command2 = new TogglePropertiesVisibilityCommand(mockPlugin);
      await command2.callback();
      expect(mockPlugin.settings.showPropertiesSection).toBe(false);

      // Third command instance
      const command3 = new TogglePropertiesVisibilityCommand(mockPlugin);
      await command3.callback();
      expect(mockPlugin.settings.showPropertiesSection).toBe(true);
    });

    it("should handle saveSettings timeout", async () => {
      mockPlugin.settings.showPropertiesSection = true;
      const timeoutError = new Error("Save timeout");
      mockPlugin.saveSettings.mockRejectedValue(timeoutError);

      await expect(command.callback()).rejects.toThrow("Save timeout");

      expect(mockPlugin.settings.showPropertiesSection).toBe(false);
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
      expect(mockPlugin.refreshLayout).not.toHaveBeenCalled();
    });
  });
});
