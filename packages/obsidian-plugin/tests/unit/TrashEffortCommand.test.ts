import { TrashEffortCommand } from "../../src/application/commands/TrashEffortCommand";
import { TFile, Notice } from "obsidian";
import { TaskStatusService, CommandVisibilityContext, LoggingService } from "@exocortex/core";

jest.mock("obsidian", () => ({
  ...jest.requireActual("obsidian"),
  Notice: jest.fn(),
}));
jest.mock("@exocortex/core", () => ({
  ...jest.requireActual("@exocortex/core"),
  canTrashEffort: jest.fn(),
  LoggingService: {
    error: jest.fn(),
  },
}));

describe("TrashEffortCommand", () => {
  let command: TrashEffortCommand;
  let mockTaskStatusService: jest.Mocked<TaskStatusService>;
  let mockFile: jest.Mocked<TFile>;
  let mockContext: CommandVisibilityContext;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock task status service
    mockTaskStatusService = {
      trashEffort: jest.fn(),
    } as unknown as jest.Mocked<TaskStatusService>;

    // Create mock file
    mockFile = {
      path: "test-effort.md",
      basename: "test-effort",
    } as jest.Mocked<TFile>;

    // Create mock context
    mockContext = {
      instanceClass: "Effort",
      status: "Cancelled",
      archived: false,
      isDraft: false,
    };

    // Create command instance
    command = new TrashEffortCommand(mockTaskStatusService);
  });

  describe("id and name", () => {
    it("should have correct id and name", () => {
      expect(command.id).toBe("trash-effort");
      expect(command.name).toBe("Trash");
    });
  });

  describe("checkCallback", () => {
    const mockCanTrashEffort = require("@exocortex/core").canTrashEffort;

    it("should return false when context is null", () => {
      const result = command.checkCallback(true, mockFile, null);
      expect(result).toBe(false);
      expect(mockTaskStatusService.trashEffort).not.toHaveBeenCalled();
    });

    it("should return false when canTrashEffort returns false", () => {
      mockCanTrashEffort.mockReturnValue(false);
      const result = command.checkCallback(true, mockFile, mockContext);
      expect(result).toBe(false);
      expect(mockTaskStatusService.trashEffort).not.toHaveBeenCalled();
    });

    it("should return true when canTrashEffort returns true and checking is true", () => {
      mockCanTrashEffort.mockReturnValue(true);
      const result = command.checkCallback(true, mockFile, mockContext);
      expect(result).toBe(true);
      expect(mockTaskStatusService.trashEffort).not.toHaveBeenCalled();
    });

    it("should execute command when checking is false and canTrashEffort returns true", async () => {
      mockCanTrashEffort.mockReturnValue(true);
      mockTaskStatusService.trashEffort.mockResolvedValue();

      const result = command.checkCallback(false, mockFile, mockContext);
      expect(result).toBe(true);

      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockTaskStatusService.trashEffort).toHaveBeenCalledWith(mockFile);
      expect(Notice).toHaveBeenCalledWith("Trashed: test-effort");
    });

    it("should handle errors and show notice", async () => {
      mockCanTrashEffort.mockReturnValue(true);
      const error = new Error("Failed to move to trash");
      mockTaskStatusService.trashEffort.mockRejectedValue(error);

      const result = command.checkCallback(false, mockFile, mockContext);
      expect(result).toBe(true);

      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockTaskStatusService.trashEffort).toHaveBeenCalledWith(mockFile);
      expect(LoggingService.error).toHaveBeenCalledWith("Trash effort error", error);
      expect(Notice).toHaveBeenCalledWith("Failed to trash effort: Failed to move to trash");
    });

    it("should handle already trashed effort", () => {
      mockCanTrashEffort.mockReturnValue(false);
      const trashedContext = { ...mockContext, status: "Trashed" };
      const result = command.checkCallback(true, mockFile, trashedContext);
      expect(result).toBe(false);
    });

    it("should handle files with special paths", async () => {
      mockCanTrashEffort.mockReturnValue(true);
      mockTaskStatusService.trashEffort.mockResolvedValue();

      const specialFile = {
        path: "path/to/[URGENT] Important Effort.md",
        basename: "[URGENT] Important Effort",
      } as TFile;

      const result = command.checkCallback(false, specialFile, mockContext);
      expect(result).toBe(true);

      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockTaskStatusService.trashEffort).toHaveBeenCalledWith(specialFile);
      expect(Notice).toHaveBeenCalledWith("Trashed: [URGENT] Important Effort");
    });

    it("should handle permission denied errors", async () => {
      mockCanTrashEffort.mockReturnValue(true);
      const permError = new Error("Permission denied: cannot delete file");
      mockTaskStatusService.trashEffort.mockRejectedValue(permError);

      const result = command.checkCallback(false, mockFile, mockContext);
      expect(result).toBe(true);

      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockTaskStatusService.trashEffort).toHaveBeenCalledWith(mockFile);
      expect(LoggingService.error).toHaveBeenCalledWith("Trash effort error", permError);
      expect(Notice).toHaveBeenCalledWith("Failed to trash effort: Permission denied: cannot delete file");
    });

    it("should handle non-Effort context", () => {
      mockCanTrashEffort.mockReturnValue(false);
      const taskContext = { ...mockContext, instanceClass: "Task" };
      const result = command.checkCallback(true, mockFile, taskContext);
      expect(result).toBe(false);
    });

    it("should handle InProgress effort", () => {
      mockCanTrashEffort.mockReturnValue(false);
      const inProgressContext = { ...mockContext, status: "InProgress" };
      const result = command.checkCallback(true, mockFile, inProgressContext);
      expect(result).toBe(false);
    });
  });
});