import { CommandExecutor } from "../../../src/executors/CommandExecutor";
import { PathResolver } from "../../../src/utils/PathResolver";
import { NodeFsAdapter } from "../../../src/adapters/NodeFsAdapter";
import { ExitCodes } from "../../../src/utils/ExitCodes";

jest.mock("../../../src/utils/PathResolver");
jest.mock("../../../src/adapters/NodeFsAdapter");

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
});
