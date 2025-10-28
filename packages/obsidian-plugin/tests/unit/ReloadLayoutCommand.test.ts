import { ReloadLayoutCommand } from "../../src/application/commands/ReloadLayoutCommand";
import { Notice } from "obsidian";

jest.mock("obsidian", () => ({
  ...jest.requireActual("obsidian"),
  Notice: jest.fn(),
}));

describe("ReloadLayoutCommand", () => {
  let command: ReloadLayoutCommand;
  let mockReloadLayoutCallback: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReloadLayoutCallback = jest.fn();
  });

  describe("id and name", () => {
    it("should have correct id and name", () => {
      command = new ReloadLayoutCommand(mockReloadLayoutCallback);
      expect(command.id).toBe("reload-layout");
      expect(command.name).toBe("Reload layout");
    });
  });

  describe("callback", () => {
    it("should call reloadLayoutCallback and show success notice", () => {
      command = new ReloadLayoutCommand(mockReloadLayoutCallback);

      command.callback();

      expect(mockReloadLayoutCallback).toHaveBeenCalled();
      expect(Notice).toHaveBeenCalledWith("Layout reloaded");
    });

    it("should show failure notice when reloadLayoutCallback is undefined", () => {
      command = new ReloadLayoutCommand(undefined);

      command.callback();

      expect(Notice).toHaveBeenCalledWith("Failed to reload layout");
    });

    it("should show failure notice when reloadLayoutCallback is null", () => {
      command = new ReloadLayoutCommand(null as any);

      command.callback();

      expect(Notice).toHaveBeenCalledWith("Failed to reload layout");
    });

    it("should handle multiple calls correctly", () => {
      command = new ReloadLayoutCommand(mockReloadLayoutCallback);

      command.callback();
      command.callback();
      command.callback();

      expect(mockReloadLayoutCallback).toHaveBeenCalledTimes(3);
      expect(Notice).toHaveBeenCalledTimes(3);
      expect(Notice).toHaveBeenCalledWith("Layout reloaded");
    });

    it("should handle callback that throws error", () => {
      const errorCallback = jest.fn(() => {
        throw new Error("Reload failed");
      });
      command = new ReloadLayoutCommand(errorCallback);

      expect(() => command.callback()).toThrow("Reload failed");
      expect(errorCallback).toHaveBeenCalled();
      expect(Notice).not.toHaveBeenCalled();
    });

    it("should work with async callback", () => {
      const asyncCallback = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      command = new ReloadLayoutCommand(asyncCallback);

      command.callback();

      expect(asyncCallback).toHaveBeenCalled();
      expect(Notice).toHaveBeenCalledWith("Layout reloaded");
    });

    it("should show failure notice when callback is empty string", () => {
      command = new ReloadLayoutCommand("" as any);

      command.callback();

      expect(Notice).toHaveBeenCalledWith("Failed to reload layout");
    });

    it("should show failure notice when callback is false", () => {
      command = new ReloadLayoutCommand(false as any);

      command.callback();

      expect(Notice).toHaveBeenCalledWith("Failed to reload layout");
    });
  });
});