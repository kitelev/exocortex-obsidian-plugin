import { flushPromises } from "./helpers/testHelpers";
import { TrashEffortCommand } from "../../src/application/commands/TrashEffortCommand";
import { App, TFile, Notice } from "obsidian";
import { TaskStatusService, CommandVisibilityContext, LoggingService, IVaultAdapter } from "@exocortex/core";
import { TrashReasonModal, TrashReasonModalResult } from "../../src/presentation/modals/TrashReasonModal";

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
jest.mock("../../src/presentation/modals/TrashReasonModal");

describe("TrashEffortCommand", () => {
  let command: TrashEffortCommand;
  let mockApp: jest.Mocked<App>;
  let mockTaskStatusService: jest.Mocked<TaskStatusService>;
  let mockVaultAdapter: jest.Mocked<IVaultAdapter>;
  let mockFile: jest.Mocked<TFile>;
  let mockContext: CommandVisibilityContext;
  let modalResolve: (result: TrashReasonModalResult) => void;

  beforeEach(() => {
    jest.clearAllMocks();

    mockApp = {} as jest.Mocked<App>;

    // Create mock task status service
    mockTaskStatusService = {
      trashEffort: jest.fn(),
    } as unknown as jest.Mocked<TaskStatusService>;

    // Create mock vault adapter
    mockVaultAdapter = {
      read: jest.fn().mockResolvedValue("---\nfrontmatter: value\n---\n\nBody content"),
      modify: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<IVaultAdapter>;

    // Create mock file
    mockFile = {
      path: "test-effort.md",
      basename: "test-effort",
      name: "test-effort.md",
      parent: null,
    } as jest.Mocked<TFile>;

    // Create mock context
    mockContext = {
      instanceClass: "Effort",
      status: "Cancelled",
      archived: false,
      isDraft: false,
    };

    // Mock TrashReasonModal to capture the resolve function
    (TrashReasonModal as jest.Mock).mockImplementation((app, onSubmit) => {
      modalResolve = onSubmit;
      return {
        open: jest.fn(),
      };
    });

    // Create command instance
    command = new TrashEffortCommand(mockApp, mockTaskStatusService, mockVaultAdapter);
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

    it("should show modal when checking is false and canTrashEffort returns true", async () => {
      mockCanTrashEffort.mockReturnValue(true);
      mockTaskStatusService.trashEffort.mockResolvedValue();

      const result = command.checkCallback(false, mockFile, mockContext);
      expect(result).toBe(true);

      // Wait for modal to be created
      await flushPromises();

      expect(TrashReasonModal).toHaveBeenCalledWith(mockApp, expect.any(Function));
    });

    it("should trash effort when modal is confirmed without reason", async () => {
      mockCanTrashEffort.mockReturnValue(true);
      mockTaskStatusService.trashEffort.mockResolvedValue();

      command.checkCallback(false, mockFile, mockContext);
      await flushPromises();

      // Simulate user confirming without reason
      modalResolve({ reason: null, confirmed: true });
      await flushPromises();

      expect(mockVaultAdapter.read).not.toHaveBeenCalled();
      expect(mockVaultAdapter.modify).not.toHaveBeenCalled();
      expect(mockTaskStatusService.trashEffort).toHaveBeenCalledWith(mockFile);
      expect(Notice).toHaveBeenCalledWith("Trashed: test-effort");
    });

    it("should append reason to note body when provided", async () => {
      mockCanTrashEffort.mockReturnValue(true);
      mockTaskStatusService.trashEffort.mockResolvedValue();

      command.checkCallback(false, mockFile, mockContext);
      await flushPromises();

      // Simulate user confirming with reason
      modalResolve({ reason: "No longer needed", confirmed: true });
      await flushPromises();

      expect(mockVaultAdapter.read).toHaveBeenCalledWith(
        expect.objectContaining({ path: "test-effort.md" }),
      );
      expect(mockVaultAdapter.modify).toHaveBeenCalledWith(
        expect.objectContaining({ path: "test-effort.md" }),
        "---\nfrontmatter: value\n---\n\nBody content\n\n## Trash Reason\n\nNo longer needed",
      );
      expect(mockTaskStatusService.trashEffort).toHaveBeenCalledWith(mockFile);
      expect(Notice).toHaveBeenCalledWith("Trashed: test-effort");
    });

    it("should not trash effort when modal is cancelled", async () => {
      mockCanTrashEffort.mockReturnValue(true);

      command.checkCallback(false, mockFile, mockContext);
      await flushPromises();

      // Simulate user cancelling
      modalResolve({ reason: null, confirmed: false });
      await flushPromises();

      expect(mockVaultAdapter.read).not.toHaveBeenCalled();
      expect(mockVaultAdapter.modify).not.toHaveBeenCalled();
      expect(mockTaskStatusService.trashEffort).not.toHaveBeenCalled();
      expect(Notice).not.toHaveBeenCalled();
    });

    it("should handle errors and show notice", async () => {
      mockCanTrashEffort.mockReturnValue(true);
      const error = new Error("Failed to move to trash");
      mockTaskStatusService.trashEffort.mockRejectedValue(error);

      command.checkCallback(false, mockFile, mockContext);
      await flushPromises();

      // Simulate user confirming
      modalResolve({ reason: null, confirmed: true });
      await flushPromises();

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
        name: "[URGENT] Important Effort.md",
        parent: null,
      } as TFile;

      command.checkCallback(false, specialFile, mockContext);
      await flushPromises();

      // Simulate user confirming
      modalResolve({ reason: null, confirmed: true });
      await flushPromises();

      expect(mockTaskStatusService.trashEffort).toHaveBeenCalledWith(specialFile);
      expect(Notice).toHaveBeenCalledWith("Trashed: [URGENT] Important Effort");
    });

    it("should handle permission denied errors", async () => {
      mockCanTrashEffort.mockReturnValue(true);
      const permError = new Error("Permission denied: cannot delete file");
      mockTaskStatusService.trashEffort.mockRejectedValue(permError);

      command.checkCallback(false, mockFile, mockContext);
      await flushPromises();

      // Simulate user confirming
      modalResolve({ reason: null, confirmed: true });
      await flushPromises();

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

    it("should handle multiline reason", async () => {
      mockCanTrashEffort.mockReturnValue(true);
      mockTaskStatusService.trashEffort.mockResolvedValue();

      command.checkCallback(false, mockFile, mockContext);
      await flushPromises();

      // Simulate user confirming with multiline reason
      modalResolve({ reason: "Line 1\nLine 2\nLine 3", confirmed: true });
      await flushPromises();

      expect(mockVaultAdapter.modify).toHaveBeenCalledWith(
        expect.objectContaining({ path: "test-effort.md" }),
        "---\nfrontmatter: value\n---\n\nBody content\n\n## Trash Reason\n\nLine 1\nLine 2\nLine 3",
      );
    });
  });
});
