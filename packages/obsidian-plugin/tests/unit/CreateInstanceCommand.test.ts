import { CreateInstanceCommand } from "../../src/application/commands/CreateInstanceCommand";
import { App, TFile, Notice, WorkspaceLeaf } from "obsidian";
import {
  TaskCreationService,
  CommandVisibilityContext,
  LoggingService,
  WikiLinkHelpers,
  AssetClass
} from "@exocortex/core";
import { LabelInputModal } from "../../src/presentation/modals/LabelInputModal";
import { ObsidianVaultAdapter } from "../../src/adapters/ObsidianVaultAdapter";

jest.mock("obsidian", () => ({
  ...jest.requireActual("obsidian"),
  Notice: jest.fn(),
}));
jest.mock("../../src/presentation/modals/LabelInputModal");
jest.mock("@exocortex/core", () => ({
  ...jest.requireActual("@exocortex/core"),
  canCreateInstance: jest.fn(),
  LoggingService: {
    error: jest.fn(),
  },
  WikiLinkHelpers: {
    normalize: jest.fn(),
  },
  AssetClass: {
    MEETING_PROTOTYPE: "MeetingPrototype",
  },
}));

describe("CreateInstanceCommand", () => {
  let command: CreateInstanceCommand;
  let mockApp: jest.Mocked<App>;
  let mockTaskCreationService: jest.Mocked<TaskCreationService>;
  let mockVaultAdapter: jest.Mocked<ObsidianVaultAdapter>;
  let mockFile: jest.Mocked<TFile>;
  let mockContext: CommandVisibilityContext;
  let mockLeaf: jest.Mocked<WorkspaceLeaf>;
  let mockTFile: jest.Mocked<TFile>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup WikiLinkHelpers mock
    const { WikiLinkHelpers } = require("@exocortex/core");
    WikiLinkHelpers.normalize.mockImplementation((str: string) => str);

    // Create mock leaf
    mockLeaf = {
      openFile: jest.fn(),
    } as unknown as jest.Mocked<WorkspaceLeaf>;

    // Create mock TFile for created file
    mockTFile = {
      path: "new-instance.md",
      basename: "new-instance",
    } as jest.Mocked<TFile>;

    // Create mock app
    mockApp = {
      workspace: {
        getLeaf: jest.fn().mockReturnValue(mockLeaf),
        setActiveLeaf: jest.fn(),
        getActiveFile: jest.fn().mockReturnValue(mockTFile),
      },
      metadataCache: {
        getFileCache: jest.fn().mockReturnValue({
          frontmatter: { key: "value" },
        }),
      },
    } as unknown as jest.Mocked<App>;

    // Create mock services
    mockTaskCreationService = {
      createTask: jest.fn(),
    } as unknown as jest.Mocked<TaskCreationService>;

    mockVaultAdapter = {
      toTFile: jest.fn().mockReturnValue(mockTFile),
    } as unknown as jest.Mocked<ObsidianVaultAdapter>;

    // Create mock file
    mockFile = {
      path: "test-file.md",
      basename: "test-file",
    } as jest.Mocked<TFile>;

    // Create mock context
    mockContext = {
      instanceClass: "Task",
      status: "Active",
      archived: false,
      isDraft: false,
    };

    // Create command instance
    command = new CreateInstanceCommand(mockApp, mockTaskCreationService, mockVaultAdapter);
  });

  describe("id and name", () => {
    it("should have correct id and name", () => {
      expect(command.id).toBe("create-instance");
      expect(command.name).toBe("Create instance");
    });
  });

  describe("checkCallback", () => {
    const mockCanCreateInstance = require("@exocortex/core").canCreateInstance;

    it("should return false when context is null", () => {
      const result = command.checkCallback(true, mockFile, null);
      expect(result).toBe(false);
      expect(mockTaskCreationService.createTask).not.toHaveBeenCalled();
    });

    it("should return false when canCreateInstance returns false", () => {
      mockCanCreateInstance.mockReturnValue(false);
      const result = command.checkCallback(true, mockFile, mockContext);
      expect(result).toBe(false);
      expect(mockTaskCreationService.createTask).not.toHaveBeenCalled();
    });

    it("should return true when canCreateInstance returns true and checking is true", () => {
      mockCanCreateInstance.mockReturnValue(true);
      const result = command.checkCallback(true, mockFile, mockContext);
      expect(result).toBe(true);
      expect(mockTaskCreationService.createTask).not.toHaveBeenCalled();
    });

    it("should execute command when checking is false and canCreateInstance returns true", async () => {
      mockCanCreateInstance.mockReturnValue(true);
      const createdFile = { basename: "new-instance", path: "new-instance.md" };
      mockTaskCreationService.createTask.mockResolvedValue(createdFile as any);

      // Mock modal to return label and task size
      (LabelInputModal as jest.Mock).mockImplementation((app, callback) => ({
        open: jest.fn(() => {
          setTimeout(() => callback({ label: "Test Instance", taskSize: "medium" }), 0);
        }),
      }));

      const result = command.checkCallback(false, mockFile, mockContext);
      expect(result).toBe(true);

      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(LabelInputModal).toHaveBeenCalledWith(
        mockApp,
        expect.any(Function),
        "",
        true
      );
      expect(mockTaskCreationService.createTask).toHaveBeenCalledWith(
        mockFile,
        { key: "value" },
        "Task",
        "Test Instance",
        "medium"
      );
      expect(mockVaultAdapter.toTFile).toHaveBeenCalledWith(createdFile);
      expect(mockLeaf.openFile).toHaveBeenCalledWith(mockTFile);
      expect(mockApp.workspace.setActiveLeaf).toHaveBeenCalledWith(mockLeaf, { focus: true });
      expect(Notice).toHaveBeenCalledWith("Instance created: new-instance");
    });

    it("should handle modal cancellation", async () => {
      mockCanCreateInstance.mockReturnValue(true);

      // Mock modal to return null (cancelled)
      (LabelInputModal as jest.Mock).mockImplementation((app, callback) => ({
        open: jest.fn(() => {
          setTimeout(() => callback({ label: null, taskSize: null }), 0);
        }),
      }));

      const result = command.checkCallback(false, mockFile, mockContext);
      expect(result).toBe(true);

      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(LabelInputModal).toHaveBeenCalled();
      expect(mockTaskCreationService.createTask).not.toHaveBeenCalled();
      expect(Notice).not.toHaveBeenCalled();
    });

    it("should handle service error and show error notice", async () => {
      mockCanCreateInstance.mockReturnValue(true);
      const error = new Error("Failed to create task");
      mockTaskCreationService.createTask.mockRejectedValue(error);

      (LabelInputModal as jest.Mock).mockImplementation((app, callback) => ({
        open: jest.fn(() => {
          setTimeout(() => callback({ label: "Test", taskSize: "small" }), 0);
        }),
      }));

      const result = command.checkCallback(false, mockFile, mockContext);
      expect(result).toBe(true);

      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockTaskCreationService.createTask).toHaveBeenCalled();
      expect(LoggingService.error).toHaveBeenCalledWith("Create instance error", error);
      expect(Notice).toHaveBeenCalledWith("Failed to create instance: Failed to create task");
    });

    it("should handle array instanceClass", async () => {
      mockCanCreateInstance.mockReturnValue(true);
      const arrayContext = {
        ...mockContext,
        instanceClass: ["Task", "Project"],
      };
      const createdFile = { basename: "new-task", path: "new-task.md" };
      mockTaskCreationService.createTask.mockResolvedValue(createdFile as any);

      (LabelInputModal as jest.Mock).mockImplementation((app, callback) => ({
        open: jest.fn(() => {
          setTimeout(() => callback({ label: "My Task", taskSize: "large" }), 0);
        }),
      }));

      const result = command.checkCallback(false, mockFile, arrayContext);
      expect(result).toBe(true);

      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockTaskCreationService.createTask).toHaveBeenCalledWith(
        mockFile,
        { key: "value" },
        "Task", // First class in array
        "My Task",
        "large"
      );
      expect(Notice).toHaveBeenCalledWith("Instance created: new-task");
    });

    it("should not show task size for MeetingPrototype", async () => {
      mockCanCreateInstance.mockReturnValue(true);
      const meetingContext = {
        ...mockContext,
        instanceClass: AssetClass.MEETING_PROTOTYPE,
      };
      const createdFile = { basename: "new-meeting", path: "new-meeting.md" };
      mockTaskCreationService.createTask.mockResolvedValue(createdFile as any);

      (LabelInputModal as jest.Mock).mockImplementation((app, callback, title, showTaskSize) => ({
        open: jest.fn(() => {
          // Verify showTaskSize is false
          expect(showTaskSize).toBe(false);
          setTimeout(() => callback({ label: "Meeting", taskSize: undefined }), 0);
        }),
      }));

      const result = command.checkCallback(false, mockFile, meetingContext);
      expect(result).toBe(true);

      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(LabelInputModal).toHaveBeenCalledWith(
        mockApp,
        expect.any(Function),
        "",
        false // showTaskSize should be false for MeetingPrototype
      );
    });

    it("should wait for file to become active", async () => {
      mockCanCreateInstance.mockReturnValue(true);
      const createdFile = { basename: "new-instance", path: "new-instance.md" };
      mockTaskCreationService.createTask.mockResolvedValue(createdFile as any);

      (LabelInputModal as jest.Mock).mockImplementation((app, callback) => ({
        open: jest.fn(() => {
          setTimeout(() => callback({ label: "Test", taskSize: "small" }), 0);
        }),
      }));

      // Simulate file becoming active after 3 attempts
      let attempts = 0;
      mockApp.workspace.getActiveFile = jest.fn(() => {
        attempts++;
        return attempts >= 3 ? mockTFile : null;
      });

      const result = command.checkCallback(false, mockFile, mockContext);
      expect(result).toBe(true);

      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 400));

      expect(mockApp.workspace.getActiveFile).toHaveBeenCalledTimes(3);
      expect(Notice).toHaveBeenCalledWith("Instance created: new-instance");
    });

    it("should handle missing frontmatter metadata", async () => {
      mockCanCreateInstance.mockReturnValue(true);
      mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue({});
      const createdFile = { basename: "new-instance", path: "new-instance.md" };
      mockTaskCreationService.createTask.mockResolvedValue(createdFile as any);

      (LabelInputModal as jest.Mock).mockImplementation((app, callback) => ({
        open: jest.fn(() => {
          setTimeout(() => callback({ label: "Test", taskSize: "medium" }), 0);
        }),
      }));

      const result = command.checkCallback(false, mockFile, mockContext);
      expect(result).toBe(true);

      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockTaskCreationService.createTask).toHaveBeenCalledWith(
        mockFile,
        {}, // Empty metadata
        "Task", // sourceClass still comes from context.instanceClass
        "Test",
        "medium"
      );
      expect(Notice).toHaveBeenCalledWith("Instance created: new-instance");
    });

    it("should handle null cache from metadataCache", async () => {
      mockCanCreateInstance.mockReturnValue(true);
      mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue(null);
      const createdFile = { basename: "new-instance", path: "new-instance.md" };
      mockTaskCreationService.createTask.mockResolvedValue(createdFile as any);

      (LabelInputModal as jest.Mock).mockImplementation((app, callback) => ({
        open: jest.fn(() => {
          setTimeout(() => callback({ label: "Test", taskSize: "small" }), 0);
        }),
      }));

      const result = command.checkCallback(false, mockFile, mockContext);
      expect(result).toBe(true);

      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockTaskCreationService.createTask).toHaveBeenCalledWith(
        mockFile,
        {}, // Empty metadata
        "Task", // sourceClass still comes from context.instanceClass
        "Test",
        "small"
      );
      expect(Notice).toHaveBeenCalledWith("Instance created: new-instance");
    });
  });
});