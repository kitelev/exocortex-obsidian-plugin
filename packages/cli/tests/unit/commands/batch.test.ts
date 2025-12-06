import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";

// Mock fs-extra before imports
const mockFsExtra = {
  existsSync: jest.fn(),
  readFile: jest.fn(),
};

jest.unstable_mockModule("fs-extra", () => ({
  default: mockFsExtra,
  ...mockFsExtra,
}));

// Mock BatchExecutor
const mockExecuteBatch = jest.fn();
const mockParseInput = jest.fn();

jest.unstable_mockModule("../../../src/executors/BatchExecutor.js", () => ({
  BatchExecutor: jest.fn().mockImplementation(() => ({
    executeBatch: mockExecuteBatch,
  })),
}));

// Add static method to mock after module mock
const { BatchExecutor } = await import(
  "../../../src/executors/BatchExecutor.js"
);
(BatchExecutor as any).parseInput = mockParseInput;

// Mock ErrorHandler
const mockErrorHandlerHandle = jest.fn();
const mockErrorHandlerSetFormat = jest.fn();

jest.unstable_mockModule("../../../src/utils/ErrorHandler.js", () => ({
  ErrorHandler: {
    handle: mockErrorHandlerHandle,
    setFormat: mockErrorHandlerSetFormat,
  },
}));

// Dynamic import after mocks
const { batchCommand } = await import("../../../src/commands/batch.js");

describe("batchCommand", () => {
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let processExitSpy: jest.SpiedFunction<typeof process.exit>;

  beforeEach(() => {
    jest.clearAllMocks();

    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    processExitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation((() => {}) as any);

    // Default mock implementations
    mockParseInput.mockReturnValue([
      { command: "start", filepath: "task.md" },
    ]);

    mockExecuteBatch.mockResolvedValue({
      success: true,
      total: 1,
      succeeded: 1,
      failed: 0,
      results: [
        {
          success: true,
          command: "start",
          filepath: "task.md",
          action: "Started task",
        },
      ],
      durationMs: 50,
      atomic: false,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("command configuration", () => {
    it("should have correct name", () => {
      const cmd = batchCommand();
      expect(cmd.name()).toBe("batch");
    });

    it("should have description", () => {
      const cmd = batchCommand();
      expect(cmd.description()).toContain("multiple operations");
    });

    it("should have --vault option with default", () => {
      const cmd = batchCommand();
      const options = cmd.options;
      const vaultOption = options.find((o) => o.long === "--vault");
      expect(vaultOption).toBeDefined();
      expect(vaultOption?.defaultValue).toBe(process.cwd());
    });

    it("should have --input option", () => {
      const cmd = batchCommand();
      const options = cmd.options;
      const inputOption = options.find((o) => o.long === "--input");
      expect(inputOption).toBeDefined();
    });

    it("should have --file option", () => {
      const cmd = batchCommand();
      const options = cmd.options;
      const fileOption = options.find((o) => o.long === "--file");
      expect(fileOption).toBeDefined();
    });

    it("should have --atomic option", () => {
      const cmd = batchCommand();
      const options = cmd.options;
      const atomicOption = options.find((o) => o.long === "--atomic");
      expect(atomicOption).toBeDefined();
    });

    it("should have --dry-run option", () => {
      const cmd = batchCommand();
      const options = cmd.options;
      const dryRunOption = options.find((o) => o.long === "--dry-run");
      expect(dryRunOption).toBeDefined();
    });

    it("should have --format option with default text", () => {
      const cmd = batchCommand();
      const options = cmd.options;
      const formatOption = options.find((o) => o.long === "--format");
      expect(formatOption).toBeDefined();
      expect(formatOption?.defaultValue).toBe("text");
    });
  });

  describe("input handling", () => {
    it("should accept --input option with JSON", async () => {
      const cmd = batchCommand();

      // Simulate command execution
      await cmd.parseAsync([
        "node",
        "test",
        "--input",
        '[{"command":"start","filepath":"task.md"}]',
        "--vault",
        "/test/vault",
      ]);

      expect(mockParseInput).toHaveBeenCalledWith(
        '[{"command":"start","filepath":"task.md"}]',
      );
    });

    it("should accept --file option", async () => {
      mockFsExtra.existsSync.mockReturnValue(true);
      mockFsExtra.readFile.mockResolvedValue(
        '[{"command":"start","filepath":"task.md"}]',
      );

      const cmd = batchCommand();
      await cmd.parseAsync([
        "node",
        "test",
        "--file",
        "/path/to/operations.json",
        "--vault",
        "/test/vault",
      ]);

      expect(mockFsExtra.existsSync).toHaveBeenCalled();
      expect(mockFsExtra.readFile).toHaveBeenCalled();
    });

    it("should error when neither --input nor --file provided", async () => {
      const cmd = batchCommand();
      await cmd.parseAsync(["node", "test", "--vault", "/test/vault"]);

      expect(mockErrorHandlerHandle).toHaveBeenCalled();
    });

    it("should error when file not found", async () => {
      mockFsExtra.existsSync.mockReturnValue(false);

      const cmd = batchCommand();
      await cmd.parseAsync([
        "node",
        "test",
        "--file",
        "/nonexistent.json",
        "--vault",
        "/test/vault",
      ]);

      expect(mockErrorHandlerHandle).toHaveBeenCalled();
    });
  });

  describe("execution", () => {
    it("should execute batch with parsed operations", async () => {
      const cmd = batchCommand();
      await cmd.parseAsync([
        "node",
        "test",
        "--input",
        '[{"command":"start","filepath":"task.md"}]',
        "--vault",
        "/test/vault",
      ]);

      expect(mockExecuteBatch).toHaveBeenCalledWith(
        [{ command: "start", filepath: "task.md" }],
        undefined, // atomic flag
      );
    });

    it("should pass atomic flag when --atomic option provided", async () => {
      const cmd = batchCommand();
      await cmd.parseAsync([
        "node",
        "test",
        "--input",
        '[{"command":"start","filepath":"task.md"}]',
        "--vault",
        "/test/vault",
        "--atomic",
      ]);

      expect(mockExecuteBatch).toHaveBeenCalledWith(
        expect.any(Array),
        true, // atomic flag
      );
    });

    it("should exit with SUCCESS code on success", async () => {
      const cmd = batchCommand();
      await cmd.parseAsync([
        "node",
        "test",
        "--input",
        '[{"command":"start","filepath":"task.md"}]',
        "--vault",
        "/test/vault",
      ]);

      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it("should exit with OPERATION_FAILED code on failure", async () => {
      mockExecuteBatch.mockResolvedValue({
        success: false,
        total: 1,
        succeeded: 0,
        failed: 1,
        results: [
          {
            success: false,
            command: "start",
            filepath: "task.md",
            error: "File not found",
          },
        ],
        durationMs: 50,
        atomic: false,
      });

      const cmd = batchCommand();
      await cmd.parseAsync([
        "node",
        "test",
        "--input",
        '[{"command":"start","filepath":"task.md"}]',
        "--vault",
        "/test/vault",
      ]);

      expect(processExitSpy).toHaveBeenCalledWith(5); // OPERATION_FAILED
    });
  });

  describe("output formatting", () => {
    it("should output text format by default", async () => {
      const cmd = batchCommand();
      await cmd.parseAsync([
        "node",
        "test",
        "--input",
        '[{"command":"start","filepath":"task.md"}]',
        "--vault",
        "/test/vault",
      ]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Batch Execution"),
      );
    });

    it("should output JSON format when --format json", async () => {
      const cmd = batchCommand();
      await cmd.parseAsync([
        "node",
        "test",
        "--input",
        '[{"command":"start","filepath":"task.md"}]',
        "--vault",
        "/test/vault",
        "--format",
        "json",
      ]);

      // Should output JSON with success: true
      const jsonOutput = consoleLogSpy.mock.calls
        .map((call) => call[0])
        .find((output) => typeof output === "string" && output.includes('"success"'));
      expect(jsonOutput).toBeDefined();
    });

    it("should set error handler format", async () => {
      const cmd = batchCommand();
      await cmd.parseAsync([
        "node",
        "test",
        "--input",
        '[{"command":"start","filepath":"task.md"}]',
        "--vault",
        "/test/vault",
        "--format",
        "json",
      ]);

      expect(mockErrorHandlerSetFormat).toHaveBeenCalledWith("json");
    });
  });
});
