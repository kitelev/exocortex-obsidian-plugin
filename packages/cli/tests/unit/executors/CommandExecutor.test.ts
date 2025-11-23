import { CommandExecutor } from "../../../src/executors/CommandExecutor";
import { PathResolver } from "../../../src/utils/PathResolver";
import { NodeFsAdapter } from "../../../src/adapters/NodeFsAdapter";
import { ExitCodes } from "../../../src/utils/ExitCodes";
import { FrontmatterService, DateFormatter } from "@exocortex/core";

jest.mock("../../../src/utils/PathResolver");
jest.mock("../../../src/adapters/NodeFsAdapter");
jest.mock("@exocortex/core", () => ({
  FrontmatterService: jest.fn().mockImplementation(() => ({
    updateProperty: jest.fn((content: string, prop: string, value: string) => {
      return content.replace(/---\n([\s\S]*?)\n---/, (match, fm) => {
        return `---\n${fm}\n${prop}: ${value}\n---`;
      });
    }),
    removeProperty: jest.fn((content: string, prop: string) => {
      return content.replace(new RegExp(`${prop}:.*\\n`, "g"), "");
    }),
    parse: jest.fn((content: string) => ({
      exists: content.includes("---"),
      content: content.match(/---\n([\s\S]*?)\n---/)?.[1] || "",
      originalContent: content,
    })),
  })),
  DateFormatter: {
    toLocalTimestamp: jest.fn((date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }),
  },
  FileNotFoundError: class FileNotFoundError extends Error {},
  FileAlreadyExistsError: class FileAlreadyExistsError extends Error {},
}));

describe("CommandExecutor", () => {
  let executor: CommandExecutor;
  let mockPathResolver: jest.Mocked<PathResolver>;
  let mockFsAdapter: jest.Mocked<NodeFsAdapter>;
  let consoleLogSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    mockPathResolver = {
      resolve: jest.fn(),
      validate: jest.fn(),
      getVaultRoot: jest.fn().mockReturnValue("/test/vault"),
    } as any;

    mockFsAdapter = {
      readFile: jest.fn(),
      getFileMetadata: jest.fn(),
      updateFile: jest.fn(),
      renameFile: jest.fn(),
    } as any;

    (PathResolver as jest.MockedClass<typeof PathResolver>).mockImplementation(
      () => mockPathResolver,
    );
    (NodeFsAdapter as jest.MockedClass<typeof NodeFsAdapter>).mockImplementation(
      () => mockFsAdapter,
    );

    executor = new CommandExecutor("/test/vault");

    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    processExitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`process.exit(${code})`);
      }) as any;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    processExitSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe("execute()", () => {
    it("should resolve and validate filepath", async () => {
      mockPathResolver.resolve.mockReturnValue("/test/vault/task.md");
      mockFsAdapter.readFile.mockResolvedValue("# Task");

      await expect(
        executor.execute("rename-to-uid", "task.md", {}),
      ).rejects.toThrow("process.exit(0)");

      expect(mockPathResolver.resolve).toHaveBeenCalledWith("task.md");
      expect(mockPathResolver.validate).toHaveBeenCalledWith(
        "/test/vault/task.md",
      );
    });

    it("should read file to verify accessibility", async () => {
      mockPathResolver.resolve.mockReturnValue("/test/vault/task.md");
      mockFsAdapter.readFile.mockResolvedValue("# Task");

      await expect(
        executor.execute("start", "task.md", {}),
      ).rejects.toThrow("process.exit(0)");

      expect(mockFsAdapter.readFile).toHaveBeenCalledWith("task.md");
    });

    it("should display command execution info", async () => {
      mockPathResolver.resolve.mockReturnValue("/test/vault/task.md");
      mockFsAdapter.readFile.mockResolvedValue("# Task");

      await expect(
        executor.execute("complete", "task.md", {}),
      ).rejects.toThrow("process.exit(0)");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Command infrastructure verified"),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("complete"),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("/test/vault/task.md"),
      );
    });

    it("should handle options if provided", async () => {
      mockPathResolver.resolve.mockReturnValue("/test/vault/task.md");
      mockFsAdapter.readFile.mockResolvedValue("# Task");

      await expect(
        executor.execute("start", "task.md", { priority: "high" }),
      ).rejects.toThrow("process.exit(0)");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Options"),
      );
    });

    it("should exit with SUCCESS code when completed", async () => {
      mockPathResolver.resolve.mockReturnValue("/test/vault/task.md");
      mockFsAdapter.readFile.mockResolvedValue("# Task");

      await expect(
        executor.execute("rename-to-uid", "task.md", {}),
      ).rejects.toThrow("process.exit(0)");

      expect(processExitSpy).toHaveBeenCalledWith(ExitCodes.SUCCESS);
    });

    it("should handle path resolution errors", async () => {
      mockPathResolver.resolve.mockImplementation(() => {
        throw new Error("File path outside vault root");
      });

      await expect(
        executor.execute("start", "../outside/task.md", {}),
      ).rejects.toThrow("process.exit");

      // ErrorHandler should have been called
      expect(processExitSpy).toHaveBeenCalled();
    });

    it("should handle file read errors", async () => {
      mockPathResolver.resolve.mockReturnValue("/test/vault/task.md");
      mockFsAdapter.readFile.mockRejectedValue(
        new Error("File not found: task.md"),
      );

      await expect(
        executor.execute("complete", "task.md", {}),
      ).rejects.toThrow("process.exit");

      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe("getVaultRoot()", () => {
    it("should return vault root from path resolver", () => {
      expect(executor.getVaultRoot()).toBe("/test/vault");
      expect(mockPathResolver.getVaultRoot).toHaveBeenCalled();
    });
  });

  describe("executeRenameToUid()", () => {
    beforeEach(() => {
      mockPathResolver.resolve.mockReturnValue("/test/vault/my-task.md");
    });

    it("should rename file to UID format", async () => {
      mockFsAdapter.getFileMetadata.mockResolvedValue({
        exo__Asset_uid: "task-uid-123",
        exo__Asset_label: "My Task",
      });

      await expect(
        executor.executeRenameToUid("my-task.md"),
      ).rejects.toThrow("process.exit(0)");

      expect(mockFsAdapter.renameFile).toHaveBeenCalledWith(
        "my-task.md",
        "task-uid-123.md",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Renamed to UID format"),
      );
      expect(processExitSpy).toHaveBeenCalledWith(ExitCodes.SUCCESS);
    });

    it("should exit successfully when already renamed", async () => {
      mockPathResolver.resolve.mockReturnValue("/test/vault/task-uid-123.md");
      mockFsAdapter.getFileMetadata.mockResolvedValue({
        exo__Asset_uid: "task-uid-123",
        exo__Asset_label: "My Task",
      });

      await expect(
        executor.executeRenameToUid("task-uid-123.md"),
      ).rejects.toThrow("process.exit(0)");

      expect(mockFsAdapter.renameFile).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Already renamed"),
      );
      expect(processExitSpy).toHaveBeenCalledWith(ExitCodes.SUCCESS);
    });

    it("should throw error when UID missing", async () => {
      mockFsAdapter.getFileMetadata.mockResolvedValue({
        exo__Asset_label: "My Task",
      });

      await expect(
        executor.executeRenameToUid("my-task.md"),
      ).rejects.toThrow("process.exit");

      expect(mockFsAdapter.renameFile).not.toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalledWith(ExitCodes.SUCCESS);
    });

    it("should update label if missing before renaming", async () => {
      mockFsAdapter.getFileMetadata.mockResolvedValue({
        exo__Asset_uid: "task-uid-123",
        exo__Asset_label: "",
      });
      mockFsAdapter.readFile.mockResolvedValue("---\nexo__Asset_uid: task-uid-123\n---\n# Content");

      await expect(
        executor.executeRenameToUid("my-task.md"),
      ).rejects.toThrow("process.exit(0)");

      expect(mockFsAdapter.updateFile).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updated label: "my-task"'),
      );
      expect(mockFsAdapter.renameFile).toHaveBeenCalled();
    });

    it("should preserve label when it exists", async () => {
      mockFsAdapter.getFileMetadata.mockResolvedValue({
        exo__Asset_uid: "task-uid-123",
        exo__Asset_label: "Existing Label",
      });

      await expect(
        executor.executeRenameToUid("my-task.md"),
      ).rejects.toThrow("process.exit(0)");

      expect(mockFsAdapter.updateFile).not.toHaveBeenCalled();
      expect(mockFsAdapter.renameFile).toHaveBeenCalled();
    });

    it("should handle file in subdirectory", async () => {
      mockPathResolver.resolve.mockReturnValue("/test/vault/folder/my-task.md");
      mockFsAdapter.getFileMetadata.mockResolvedValue({
        exo__Asset_uid: "task-uid-123",
        exo__Asset_label: "My Task",
      });

      await expect(
        executor.executeRenameToUid("folder/my-task.md"),
      ).rejects.toThrow("process.exit(0)");

      expect(mockFsAdapter.renameFile).toHaveBeenCalledWith(
        "folder/my-task.md",
        "folder/task-uid-123.md",
      );
    });
  });

  describe("executeUpdateLabel()", () => {
    beforeEach(() => {
      mockPathResolver.resolve.mockReturnValue("/test/vault/task.md");
      mockFsAdapter.readFile.mockResolvedValue(
        "---\nexo__Asset_label: Old Label\naliases:\n  - Old Label\n---\n# Content",
      );
    });

    it("should update label property", async () => {
      await expect(
        executor.executeUpdateLabel("task.md", "New Label"),
      ).rejects.toThrow("process.exit(0)");

      expect(mockFsAdapter.updateFile).toHaveBeenCalled();
      const updateCall = mockFsAdapter.updateFile.mock.calls[0];
      expect(updateCall[1]).toContain("exo__Asset_label: New Label");
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('New label: "New Label"'),
      );
      expect(processExitSpy).toHaveBeenCalledWith(ExitCodes.SUCCESS);
    });

    it("should synchronize aliases array", async () => {
      await expect(
        executor.executeUpdateLabel("task.md", "New Label"),
      ).rejects.toThrow("process.exit(0)");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Aliases synchronized"),
      );
    });

    it("should throw error if label is empty", async () => {
      await expect(
        executor.executeUpdateLabel("task.md", ""),
      ).rejects.toThrow("process.exit");

      expect(mockFsAdapter.updateFile).not.toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalledWith(ExitCodes.SUCCESS);
    });

    it("should trim whitespace from label", async () => {
      await expect(
        executor.executeUpdateLabel("task.md", "  Trimmed Label  "),
      ).rejects.toThrow("process.exit(0)");

      expect(mockFsAdapter.updateFile).toHaveBeenCalled();
      const updateCall = mockFsAdapter.updateFile.mock.calls[0];
      expect(updateCall[1]).toContain("exo__Asset_label: Trimmed Label");
    });

    it("should not add duplicate alias if label already in aliases", async () => {
      mockFsAdapter.readFile.mockResolvedValue(
        "---\nexo__Asset_label: Existing\naliases:\n  - Existing\n---\n# Content",
      );

      await expect(
        executor.executeUpdateLabel("task.md", "Existing"),
      ).rejects.toThrow("process.exit(0)");

      expect(mockFsAdapter.updateFile).toHaveBeenCalled();
    });

    it("should create aliases array if missing", async () => {
      mockFsAdapter.readFile.mockResolvedValue(
        "---\nexo__Asset_label: Old\n---\n# Content",
      );

      await expect(
        executor.executeUpdateLabel("task.md", "New Label"),
      ).rejects.toThrow("process.exit(0)");

      expect(mockFsAdapter.updateFile).toHaveBeenCalled();
      const updateCall = mockFsAdapter.updateFile.mock.calls[0];
      expect(updateCall[1]).toContain("aliases:");
    });

    it("should handle path resolution errors", async () => {
      mockPathResolver.resolve.mockImplementation(() => {
        throw new Error("File path outside vault root");
      });

      await expect(
        executor.executeUpdateLabel("../outside/task.md", "New Label"),
      ).rejects.toThrow("process.exit");

      expect(mockFsAdapter.updateFile).not.toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalledWith(ExitCodes.SUCCESS);
    });
  });

  describe("executeStart()", () => {
    beforeEach(() => {
      mockPathResolver.resolve.mockReturnValue("/test/vault/task.md");
      mockFsAdapter.readFile.mockResolvedValue(
        "---\nexo__Asset_label: My Task\nems__Effort_status: \"[[ems__EffortStatusToDo]]\"\n---\n# Content",
      );
    });

    it("should transition to Doing status", async () => {
      await expect(executor.executeStart("task.md")).rejects.toThrow(
        "process.exit(0)",
      );

      expect(mockFsAdapter.updateFile).toHaveBeenCalled();
      const updateCall = mockFsAdapter.updateFile.mock.calls[0];
      expect(updateCall[1]).toContain("ems__Effort_status: \"[[ems__EffortStatusDoing]]\"");
      expect(processExitSpy).toHaveBeenCalledWith(ExitCodes.SUCCESS);
    });

    it("should add start timestamp", async () => {
      const mockDate = new Date("2025-11-23T10:30:00");
      jest.spyOn(global, "Date").mockImplementation(() => mockDate as any);
      const expectedTimestamp = DateFormatter.toLocalTimestamp(mockDate);

      await expect(executor.executeStart("task.md")).rejects.toThrow(
        "process.exit(0)",
      );

      expect(mockFsAdapter.updateFile).toHaveBeenCalled();
      const updateCall = mockFsAdapter.updateFile.mock.calls[0];
      expect(updateCall[1]).toContain(`ems__Effort_startTimestamp: ${expectedTimestamp}`);
    });

    it("should display status confirmation", async () => {
      await expect(executor.executeStart("task.md")).rejects.toThrow(
        "process.exit(0)",
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Started:"),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Status: Doing"),
      );
    });

    it("should handle file read errors", async () => {
      mockFsAdapter.readFile.mockRejectedValue(
        new Error("File not found: task.md"),
      );

      await expect(executor.executeStart("task.md")).rejects.toThrow(
        "process.exit",
      );

      expect(processExitSpy).not.toHaveBeenCalledWith(ExitCodes.SUCCESS);
    });
  });

  describe("executeComplete()", () => {
    beforeEach(() => {
      mockPathResolver.resolve.mockReturnValue("/test/vault/task.md");
      mockFsAdapter.readFile.mockResolvedValue(
        "---\nexo__Asset_label: My Task\nems__Effort_status: \"[[ems__EffortStatusDoing]]\"\n---\n# Content",
      );
    });

    it("should transition to Done status", async () => {
      await expect(executor.executeComplete("task.md")).rejects.toThrow(
        "process.exit(0)",
      );

      expect(mockFsAdapter.updateFile).toHaveBeenCalled();
      const updateCall = mockFsAdapter.updateFile.mock.calls[0];
      expect(updateCall[1]).toContain("ems__Effort_status: \"[[ems__EffortStatusDone]]\"");
      expect(processExitSpy).toHaveBeenCalledWith(ExitCodes.SUCCESS);
    });

    it("should add end and resolution timestamps", async () => {
      const mockDate = new Date("2025-11-23T15:45:00");
      jest.spyOn(global, "Date").mockImplementation(() => mockDate as any);
      const expectedTimestamp = DateFormatter.toLocalTimestamp(mockDate);

      await expect(executor.executeComplete("task.md")).rejects.toThrow(
        "process.exit(0)",
      );

      expect(mockFsAdapter.updateFile).toHaveBeenCalled();
      const updateCall = mockFsAdapter.updateFile.mock.calls[0];
      expect(updateCall[1]).toContain(`ems__Effort_endTimestamp: ${expectedTimestamp}`);
      expect(updateCall[1]).toContain(`ems__Effort_resolutionTimestamp: ${expectedTimestamp}`);
    });

    it("should display completion confirmation", async () => {
      await expect(executor.executeComplete("task.md")).rejects.toThrow(
        "process.exit(0)",
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Completed:"),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Status: Done"),
      );
    });
  });

  describe("executeTrash()", () => {
    beforeEach(() => {
      mockPathResolver.resolve.mockReturnValue("/test/vault/task.md");
      mockFsAdapter.readFile.mockResolvedValue(
        "---\nexo__Asset_label: My Task\nems__Effort_status: \"[[ems__EffortStatusDoing]]\"\n---\n# Content",
      );
    });

    it("should transition to Trashed status", async () => {
      await expect(executor.executeTrash("task.md")).rejects.toThrow(
        "process.exit(0)",
      );

      expect(mockFsAdapter.updateFile).toHaveBeenCalled();
      const updateCall = mockFsAdapter.updateFile.mock.calls[0];
      expect(updateCall[1]).toContain("ems__Effort_status: \"[[ems__EffortStatusTrashed]]\"");
      expect(processExitSpy).toHaveBeenCalledWith(ExitCodes.SUCCESS);
    });

    it("should add resolution timestamp", async () => {
      const mockDate = new Date("2025-11-23T12:00:00");
      jest.spyOn(global, "Date").mockImplementation(() => mockDate as any);
      const expectedTimestamp = DateFormatter.toLocalTimestamp(mockDate);

      await expect(executor.executeTrash("task.md")).rejects.toThrow(
        "process.exit(0)",
      );

      expect(mockFsAdapter.updateFile).toHaveBeenCalled();
      const updateCall = mockFsAdapter.updateFile.mock.calls[0];
      expect(updateCall[1]).toContain(`ems__Effort_resolutionTimestamp: ${expectedTimestamp}`);
    });

    it("should display trash confirmation", async () => {
      await expect(executor.executeTrash("task.md")).rejects.toThrow(
        "process.exit(0)",
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Trashed:"),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Status: Trashed"),
      );
    });
  });

  describe("executeArchive()", () => {
    beforeEach(() => {
      mockPathResolver.resolve.mockReturnValue("/test/vault/task.md");
      mockFsAdapter.readFile.mockResolvedValue(
        "---\nexo__Asset_label: My Task\naliases:\n  - My Task\n---\n# Content",
      );
    });

    it("should set archived flag to true", async () => {
      await expect(executor.executeArchive("task.md")).rejects.toThrow(
        "process.exit(0)",
      );

      expect(mockFsAdapter.updateFile).toHaveBeenCalled();
      const updateCall = mockFsAdapter.updateFile.mock.calls[0];
      expect(updateCall[1]).toContain("archived: true");
      expect(processExitSpy).toHaveBeenCalledWith(ExitCodes.SUCCESS);
    });

    it("should remove aliases", async () => {
      await expect(executor.executeArchive("task.md")).rejects.toThrow(
        "process.exit(0)",
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Aliases removed"),
      );
    });

    it("should display archive confirmation", async () => {
      await expect(executor.executeArchive("task.md")).rejects.toThrow(
        "process.exit(0)",
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Archived:"),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Archived: true"),
      );
    });
  });

  describe("executeMoveToBacklog()", () => {
    beforeEach(() => {
      mockPathResolver.resolve.mockReturnValue("/test/vault/task.md");
      mockFsAdapter.readFile.mockResolvedValue(
        "---\nexo__Asset_label: My Task\n---\n# Content",
      );
    });

    it("should transition to Backlog status", async () => {
      await expect(executor.executeMoveToBacklog("task.md")).rejects.toThrow(
        "process.exit(0)",
      );

      expect(mockFsAdapter.updateFile).toHaveBeenCalled();
      const updateCall = mockFsAdapter.updateFile.mock.calls[0];
      expect(updateCall[1]).toContain("ems__Effort_status: \"[[ems__EffortStatusBacklog]]\"");
      expect(processExitSpy).toHaveBeenCalledWith(ExitCodes.SUCCESS);
    });

    it("should display status confirmation", async () => {
      await expect(executor.executeMoveToBacklog("task.md")).rejects.toThrow(
        "process.exit(0)",
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Moved to Backlog:"),
      );
    });
  });

  describe("executeMoveToAnalysis()", () => {
    beforeEach(() => {
      mockPathResolver.resolve.mockReturnValue("/test/vault/project.md");
      mockFsAdapter.readFile.mockResolvedValue(
        "---\nexo__Asset_label: My Project\n---\n# Content",
      );
    });

    it("should transition to Analysis status", async () => {
      await expect(executor.executeMoveToAnalysis("project.md")).rejects.toThrow(
        "process.exit(0)",
      );

      expect(mockFsAdapter.updateFile).toHaveBeenCalled();
      const updateCall = mockFsAdapter.updateFile.mock.calls[0];
      expect(updateCall[1]).toContain("ems__Effort_status: \"[[ems__EffortStatusAnalysis]]\"");
      expect(processExitSpy).toHaveBeenCalledWith(ExitCodes.SUCCESS);
    });

    it("should display status confirmation", async () => {
      await expect(executor.executeMoveToAnalysis("project.md")).rejects.toThrow(
        "process.exit(0)",
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Moved to Analysis:"),
      );
    });
  });

  describe("executeMoveToToDo()", () => {
    beforeEach(() => {
      mockPathResolver.resolve.mockReturnValue("/test/vault/task.md");
      mockFsAdapter.readFile.mockResolvedValue(
        "---\nexo__Asset_label: My Task\n---\n# Content",
      );
    });

    it("should transition to ToDo status", async () => {
      await expect(executor.executeMoveToToDo("task.md")).rejects.toThrow(
        "process.exit(0)",
      );

      expect(mockFsAdapter.updateFile).toHaveBeenCalled();
      const updateCall = mockFsAdapter.updateFile.mock.calls[0];
      expect(updateCall[1]).toContain("ems__Effort_status: \"[[ems__EffortStatusToDo]]\"");
      expect(processExitSpy).toHaveBeenCalledWith(ExitCodes.SUCCESS);
    });

    it("should display status confirmation", async () => {
      await expect(executor.executeMoveToToDo("task.md")).rejects.toThrow(
        "process.exit(0)",
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Moved to ToDo:"),
      );
    });
  });

  describe("executeCreateTask()", () => {
    beforeEach(() => {
      mockPathResolver.resolve.mockReturnValue("/test/vault/task.md");
      mockFsAdapter.fileExists = jest.fn().mockResolvedValue(false);
      mockFsAdapter.createFile = jest.fn().mockResolvedValue("task.md");
    });

    it("should create task with minimal parameters", async () => {
      await expect(
        executor.executeCreateTask("task.md", "My Task"),
      ).rejects.toThrow("process.exit(0)");

      expect(mockFsAdapter.createFile).toHaveBeenCalled();
      const createCall = mockFsAdapter.createFile.mock.calls[0];
      const content = createCall[1];

      expect(content).toContain("exo__Asset_label: My Task");
      expect(content).toContain("exo__Asset_uid:");
      expect(content).toContain("exo__Instance_class:");
      expect(content).toContain("\"[[ems__Task]]\"");
      expect(content).toContain("ems__Effort_status: \"[[ems__EffortStatusDraft]]\"");
      expect(processExitSpy).toHaveBeenCalledWith(ExitCodes.SUCCESS);
    });

    it("should create task with prototype", async () => {
      await expect(
        executor.executeCreateTask("task.md", "My Task", { prototype: "proto-123" }),
      ).rejects.toThrow("process.exit(0)");

      const createCall = mockFsAdapter.createFile.mock.calls[0];
      const content = createCall[1];
      expect(content).toContain("ems__Effort_prototype: \"[[proto-123]]\"");
    });

    it("should create task with area", async () => {
      await expect(
        executor.executeCreateTask("task.md", "My Task", { area: "area-456" }),
      ).rejects.toThrow("process.exit(0)");

      const createCall = mockFsAdapter.createFile.mock.calls[0];
      const content = createCall[1];
      expect(content).toContain("ems__Effort_area: \"[[area-456]]\"");
    });

    it("should create task with parent", async () => {
      await expect(
        executor.executeCreateTask("task.md", "My Task", { parent: "parent-789" }),
      ).rejects.toThrow("process.exit(0)");

      const createCall = mockFsAdapter.createFile.mock.calls[0];
      const content = createCall[1];
      expect(content).toContain("ems__Effort_parent: \"[[parent-789]]\"");
    });

    it("should create task with all optional parameters", async () => {
      await expect(
        executor.executeCreateTask("task.md", "My Task", {
          prototype: "proto-123",
          area: "area-456",
          parent: "parent-789",
        }),
      ).rejects.toThrow("process.exit(0)");

      const createCall = mockFsAdapter.createFile.mock.calls[0];
      const content = createCall[1];
      expect(content).toContain("ems__Effort_prototype: \"[[proto-123]]\"");
      expect(content).toContain("ems__Effort_area: \"[[area-456]]\"");
      expect(content).toContain("ems__Effort_parent: \"[[parent-789]]\"");
    });

    it("should trim whitespace from label", async () => {
      await expect(
        executor.executeCreateTask("task.md", "  Trimmed Task  "),
      ).rejects.toThrow("process.exit(0)");

      const createCall = mockFsAdapter.createFile.mock.calls[0];
      const content = createCall[1];
      expect(content).toContain("exo__Asset_label: Trimmed Task");
    });

    it("should throw error if label is empty", async () => {
      await expect(
        executor.executeCreateTask("task.md", ""),
      ).rejects.toThrow("process.exit");

      expect(mockFsAdapter.createFile).not.toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalledWith(ExitCodes.SUCCESS);
    });

    it("should throw error if label is whitespace only", async () => {
      await expect(
        executor.executeCreateTask("task.md", "   "),
      ).rejects.toThrow("process.exit");

      expect(mockFsAdapter.createFile).not.toHaveBeenCalled();
    });

    it("should throw error if file already exists", async () => {
      mockFsAdapter.fileExists = jest.fn().mockResolvedValue(true);

      await expect(
        executor.executeCreateTask("task.md", "My Task"),
      ).rejects.toThrow("process.exit");

      expect(mockFsAdapter.createFile).not.toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalledWith(ExitCodes.SUCCESS);
    });

    it("should display creation confirmation with UID", async () => {
      await expect(
        executor.executeCreateTask("task.md", "My Task"),
      ).rejects.toThrow("process.exit(0)");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Created task:"),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("UID:"),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Label: My Task"),
      );
    });

    it("should include created timestamp", async () => {
      const mockDate = new Date("2025-11-23T14:30:00");
      jest.spyOn(global, "Date").mockImplementation(() => mockDate as any);
      const expectedTimestamp = DateFormatter.toLocalTimestamp(mockDate);

      await expect(
        executor.executeCreateTask("task.md", "My Task"),
      ).rejects.toThrow("process.exit(0)");

      const createCall = mockFsAdapter.createFile.mock.calls[0];
      const content = createCall[1];
      expect(content).toContain(`exo__Asset_createdAt: ${expectedTimestamp}`);
    });
  });

  describe("executeCreateMeeting()", () => {
    beforeEach(() => {
      mockPathResolver.resolve.mockReturnValue("/test/vault/meeting.md");
      mockFsAdapter.fileExists = jest.fn().mockResolvedValue(false);
      mockFsAdapter.createFile = jest.fn().mockResolvedValue("meeting.md");
    });

    it("should create meeting with minimal parameters", async () => {
      await expect(
        executor.executeCreateMeeting("meeting.md", "Team Sync"),
      ).rejects.toThrow("process.exit(0)");

      expect(mockFsAdapter.createFile).toHaveBeenCalled();
      const createCall = mockFsAdapter.createFile.mock.calls[0];
      const content = createCall[1];

      expect(content).toContain("exo__Asset_label: Team Sync");
      expect(content).toContain("\"[[ems__Meeting]]\"");
      expect(content).toContain("ems__Effort_status: \"[[ems__EffortStatusDraft]]\"");
      expect(processExitSpy).toHaveBeenCalledWith(ExitCodes.SUCCESS);
    });

    it("should create meeting with all optional parameters", async () => {
      await expect(
        executor.executeCreateMeeting("meeting.md", "Team Sync", {
          prototype: "meeting-proto",
          area: "area-123",
          parent: "parent-456",
        }),
      ).rejects.toThrow("process.exit(0)");

      const createCall = mockFsAdapter.createFile.mock.calls[0];
      const content = createCall[1];
      expect(content).toContain("ems__Effort_prototype: \"[[meeting-proto]]\"");
      expect(content).toContain("ems__Effort_area: \"[[area-123]]\"");
      expect(content).toContain("ems__Effort_parent: \"[[parent-456]]\"");
    });

    it("should display creation confirmation", async () => {
      await expect(
        executor.executeCreateMeeting("meeting.md", "Team Sync"),
      ).rejects.toThrow("process.exit(0)");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Created meeting:"),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Label: Team Sync"),
      );
    });

    it("should throw error if file already exists", async () => {
      mockFsAdapter.fileExists = jest.fn().mockResolvedValue(true);

      await expect(
        executor.executeCreateMeeting("meeting.md", "Team Sync"),
      ).rejects.toThrow("process.exit");

      expect(mockFsAdapter.createFile).not.toHaveBeenCalled();
    });
  });

  describe("executeCreateProject()", () => {
    beforeEach(() => {
      mockPathResolver.resolve.mockReturnValue("/test/vault/project.md");
      mockFsAdapter.fileExists = jest.fn().mockResolvedValue(false);
      mockFsAdapter.createFile = jest.fn().mockResolvedValue("project.md");
    });

    it("should create project with minimal parameters", async () => {
      await expect(
        executor.executeCreateProject("project.md", "Website Redesign"),
      ).rejects.toThrow("process.exit(0)");

      expect(mockFsAdapter.createFile).toHaveBeenCalled();
      const createCall = mockFsAdapter.createFile.mock.calls[0];
      const content = createCall[1];

      expect(content).toContain("exo__Asset_label: Website Redesign");
      expect(content).toContain("\"[[ems__Project]]\"");
      expect(content).toContain("ems__Effort_status: \"[[ems__EffortStatusDraft]]\"");
      expect(processExitSpy).toHaveBeenCalledWith(ExitCodes.SUCCESS);
    });

    it("should create project with all optional parameters", async () => {
      await expect(
        executor.executeCreateProject("project.md", "Website Redesign", {
          prototype: "project-proto",
          area: "area-789",
          parent: "parent-012",
        }),
      ).rejects.toThrow("process.exit(0)");

      const createCall = mockFsAdapter.createFile.mock.calls[0];
      const content = createCall[1];
      expect(content).toContain("ems__Effort_prototype: \"[[project-proto]]\"");
      expect(content).toContain("ems__Effort_area: \"[[area-789]]\"");
      expect(content).toContain("ems__Effort_parent: \"[[parent-012]]\"");
    });

    it("should display creation confirmation", async () => {
      await expect(
        executor.executeCreateProject("project.md", "Website Redesign"),
      ).rejects.toThrow("process.exit(0)");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Created project:"),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Label: Website Redesign"),
      );
    });

    it("should throw error if label is empty", async () => {
      await expect(
        executor.executeCreateProject("project.md", ""),
      ).rejects.toThrow("process.exit");

      expect(mockFsAdapter.createFile).not.toHaveBeenCalled();
    });
  });

  describe("executeCreateArea()", () => {
    beforeEach(() => {
      mockPathResolver.resolve.mockReturnValue("/test/vault/area.md");
      mockFsAdapter.fileExists = jest.fn().mockResolvedValue(false);
      mockFsAdapter.createFile = jest.fn().mockResolvedValue("area.md");
    });

    it("should create area with minimal parameters", async () => {
      await expect(
        executor.executeCreateArea("area.md", "Engineering"),
      ).rejects.toThrow("process.exit(0)");

      expect(mockFsAdapter.createFile).toHaveBeenCalled();
      const createCall = mockFsAdapter.createFile.mock.calls[0];
      const content = createCall[1];

      expect(content).toContain("exo__Asset_label: Engineering");
      expect(content).toContain("\"[[ems__Area]]\"");
      expect(content).not.toContain("ems__Effort_status"); // Areas don't have status
      expect(processExitSpy).toHaveBeenCalledWith(ExitCodes.SUCCESS);
    });

    it("should create area with optional parameters", async () => {
      await expect(
        executor.executeCreateArea("area.md", "Engineering", {
          prototype: "area-proto",
        }),
      ).rejects.toThrow("process.exit(0)");

      const createCall = mockFsAdapter.createFile.mock.calls[0];
      const content = createCall[1];
      expect(content).toContain("ems__Effort_prototype: \"[[area-proto]]\"");
    });

    it("should display creation confirmation", async () => {
      await expect(
        executor.executeCreateArea("area.md", "Engineering"),
      ).rejects.toThrow("process.exit(0)");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Created area:"),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Label: Engineering"),
      );
    });

    it("should include all required frontmatter properties", async () => {
      await expect(
        executor.executeCreateArea("area.md", "Engineering"),
      ).rejects.toThrow("process.exit(0)");

      const createCall = mockFsAdapter.createFile.mock.calls[0];
      const content = createCall[1];
      expect(content).toContain("exo__Asset_isDefinedBy: \"[[Ontology/EMS]]\"");
      expect(content).toContain("exo__Asset_uid:");
      expect(content).toContain("exo__Asset_createdAt:");
      expect(content).toContain("aliases:");
    });

    it("should throw error if file already exists", async () => {
      mockFsAdapter.fileExists = jest.fn().mockResolvedValue(true);

      await expect(
        executor.executeCreateArea("area.md", "Engineering"),
      ).rejects.toThrow("process.exit");

      expect(mockFsAdapter.createFile).not.toHaveBeenCalled();
    });
  });

  describe("executeSchedule()", () => {
    beforeEach(() => {
      mockPathResolver.resolve.mockReturnValue("/test/vault/task.md");
      mockFsAdapter.fileExists = jest.fn().mockResolvedValue(true);
      mockFsAdapter.readFile = jest.fn().mockResolvedValue(
        "---\nexo__Asset_label: Test Task\n---\nBody content",
      );
      mockFsAdapter.writeFile = jest.fn().mockResolvedValue(undefined);
    });

    it("should schedule task with valid date", async () => {
      await expect(
        executor.executeSchedule("task.md", "2025-11-25"),
      ).rejects.toThrow("process.exit(0)");

      expect(mockFsAdapter.readFile).toHaveBeenCalledWith("task.md");
      expect(mockFsAdapter.writeFile).toHaveBeenCalled();

      const writeCall = mockFsAdapter.writeFile.mock.calls[0];
      const updatedContent = writeCall[1];

      expect(updatedContent).toContain("ems__Effort_plannedStartTimestamp:");
      expect(updatedContent).toContain("2025-11-25T00:00:00");
      expect(processExitSpy).toHaveBeenCalledWith(ExitCodes.SUCCESS);
    });

    it("should throw error if file does not exist", async () => {
      mockFsAdapter.fileExists = jest.fn().mockResolvedValue(false);

      await expect(
        executor.executeSchedule("task.md", "2025-11-25"),
      ).rejects.toThrow("process.exit");

      expect(mockFsAdapter.readFile).not.toHaveBeenCalled();
      expect(mockFsAdapter.writeFile).not.toHaveBeenCalled();
    });

    it("should throw error for invalid date format", async () => {
      await expect(
        executor.executeSchedule("task.md", "11/25/2025"),
      ).rejects.toThrow("process.exit");

      expect(mockFsAdapter.writeFile).not.toHaveBeenCalled();
    });

    it("should throw error for malformed date", async () => {
      await expect(
        executor.executeSchedule("task.md", "2025-13-45"),
      ).rejects.toThrow("process.exit");
    });

    it("should handle different date values", async () => {
      await expect(
        executor.executeSchedule("task.md", "2025-12-31"),
      ).rejects.toThrow("process.exit(0)");

      const writeCall = mockFsAdapter.writeFile.mock.calls[0];
      const updatedContent = writeCall[1];

      expect(updatedContent).toContain("2025-12-31T00:00:00");
    });
  });

  describe("executeSetDeadline()", () => {
    beforeEach(() => {
      mockPathResolver.resolve.mockReturnValue("/test/vault/task.md");
      mockFsAdapter.fileExists = jest.fn().mockResolvedValue(true);
      mockFsAdapter.readFile = jest.fn().mockResolvedValue(
        "---\nexo__Asset_label: Test Task\n---\nBody content",
      );
      mockFsAdapter.writeFile = jest.fn().mockResolvedValue(undefined);
    });

    it("should set deadline with valid date", async () => {
      await expect(
        executor.executeSetDeadline("task.md", "2025-12-01"),
      ).rejects.toThrow("process.exit(0)");

      expect(mockFsAdapter.readFile).toHaveBeenCalledWith("task.md");
      expect(mockFsAdapter.writeFile).toHaveBeenCalled();

      const writeCall = mockFsAdapter.writeFile.mock.calls[0];
      const updatedContent = writeCall[1];

      expect(updatedContent).toContain("ems__Effort_plannedEndTimestamp:");
      expect(updatedContent).toContain("2025-12-01T00:00:00");
      expect(processExitSpy).toHaveBeenCalledWith(ExitCodes.SUCCESS);
    });

    it("should throw error if file does not exist", async () => {
      mockFsAdapter.fileExists = jest.fn().mockResolvedValue(false);

      await expect(
        executor.executeSetDeadline("task.md", "2025-12-01"),
      ).rejects.toThrow("process.exit");

      expect(mockFsAdapter.readFile).not.toHaveBeenCalled();
      expect(mockFsAdapter.writeFile).not.toHaveBeenCalled();
    });

    it("should throw error for invalid date format", async () => {
      await expect(
        executor.executeSetDeadline("task.md", "12/01/2025"),
      ).rejects.toThrow("process.exit");

      expect(mockFsAdapter.writeFile).not.toHaveBeenCalled();
    });

    it("should throw error for malformed date", async () => {
      await expect(
        executor.executeSetDeadline("task.md", "2025-13-99"),
      ).rejects.toThrow("process.exit");
    });

    it("should handle different date values", async () => {
      await expect(
        executor.executeSetDeadline("task.md", "2026-01-15"),
      ).rejects.toThrow("process.exit(0)");

      const writeCall = mockFsAdapter.writeFile.mock.calls[0];
      const updatedContent = writeCall[1];

      expect(updatedContent).toContain("2026-01-15T00:00:00");
    });
  });
});
