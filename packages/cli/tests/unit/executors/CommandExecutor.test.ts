import { CommandExecutor } from "../../../src/executors/CommandExecutor";
import { PathResolver } from "../../../src/utils/PathResolver";
import { NodeFsAdapter } from "../../../src/adapters/NodeFsAdapter";
import { ExitCodes } from "../../../src/utils/ExitCodes";
import { FrontmatterService } from "@exocortex/core";

jest.mock("../../../src/utils/PathResolver");
jest.mock("../../../src/adapters/NodeFsAdapter");
jest.mock("@exocortex/core", () => ({
  FrontmatterService: jest.fn().mockImplementation(() => ({
    updateProperty: jest.fn((content: string, prop: string, value: string) => {
      return content.replace(/---\n([\s\S]*?)\n---/, (match, fm) => {
        return `---\n${fm}\n${prop}: ${value}\n---`;
      });
    }),
    parse: jest.fn((content: string) => ({
      exists: content.includes("---"),
      content: content.match(/---\n([\s\S]*?)\n---/)?.[1] || "",
      originalContent: content,
    })),
  })),
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
});
