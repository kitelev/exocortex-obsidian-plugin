import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { ErrorHandler } from "../../../src/utils/ErrorHandler";
import { ExitCodes } from "../../../src/utils/ExitCodes";
import {
  FileNotFoundError,
  InvalidArgumentsError,
  ConcurrentModificationError,
} from "../../../src/utils/errors/index";

describe("ErrorHandler", () => {
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    processExitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`process.exit(${code})`);
      }) as any;
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe("handle()", () => {
    it("should exit with FILE_NOT_FOUND for file not found errors", () => {
      const error = new Error("File not found: /path/to/file.md");

      expect(() => ErrorHandler.handle(error)).toThrow("process.exit(3)");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("File not found"),
      );
    });

    it("should exit with FILE_NOT_FOUND for ENOENT errors", () => {
      const error = new Error("ENOENT: no such file or directory");

      expect(() => ErrorHandler.handle(error)).toThrow("process.exit(3)");
    });

    it("should exit with INVALID_ARGUMENTS for validation errors", () => {
      const error = new Error("Invalid file path");

      expect(() => ErrorHandler.handle(error)).toThrow("process.exit(2)");
    });

    it("should exit with INVALID_ARGUMENTS for outside vault errors", () => {
      const error = new Error("File path outside vault root");

      expect(() => ErrorHandler.handle(error)).toThrow("process.exit(2)");
    });

    it("should exit with PERMISSION_DENIED for EACCES errors", () => {
      const error = new Error("EACCES: permission denied");

      expect(() => ErrorHandler.handle(error)).toThrow("process.exit(4)");
    });

    it("should exit with INVALID_STATE_TRANSITION for transition errors", () => {
      const error = new Error("Invalid state transition from Done to InProgress");

      expect(() => ErrorHandler.handle(error)).toThrow("process.exit(6)");
    });

    it("should exit with TRANSACTION_FAILED for transaction errors", () => {
      const error = new Error("Transaction failed: rollback");

      expect(() => ErrorHandler.handle(error)).toThrow("process.exit(7)");
    });

    it("should exit with GENERAL_ERROR for unknown errors", () => {
      const error = new Error("Some other error");

      expect(() => ErrorHandler.handle(error)).toThrow("process.exit(1)");
    });
  });

  describe("handle() with typed CLI errors", () => {
    it("should handle FileNotFoundError with formatted output and correct exit code", () => {
      const error = new FileNotFoundError("/path/to/file.md");

      expect(() => ErrorHandler.handle(error)).toThrow("process.exit(3)");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("FileNotFoundError"),
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("File not found: /path/to/file.md"),
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("💡"),
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Verify the file path is correct"),
      );
    });

    it("should handle InvalidArgumentsError with formatted output and correct exit code", () => {
      const error = new InvalidArgumentsError(
        "Invalid file path",
        "Provide a valid file path within the vault.",
      );

      expect(() => ErrorHandler.handle(error)).toThrow("process.exit(2)");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("InvalidArgumentsError"),
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid file path"),
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Provide a valid file path within the vault"),
      );
    });

    it("should handle ConcurrentModificationError with formatted output and exit code 8", () => {
      const error = new ConcurrentModificationError(
        "/path/to/file.md",
        "file hash mismatch",
      );

      expect(() => ErrorHandler.handle(error)).toThrow("process.exit(8)");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("ConcurrentModificationError"),
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Concurrent modification detected"),
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("file hash mismatch"),
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Retry the command"),
      );
    });

    it("should include context in formatted error output", () => {
      const error = new FileNotFoundError("/path/to/file.md", {
        attemptedPath: "/absolute/path",
        vaultRoot: "/vault",
      });

      expect(() => ErrorHandler.handle(error)).toThrow("process.exit(3)");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("📋 Context"),
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("attemptedPath"),
      );
    });
  });

  describe("handleWithMessage()", () => {
    it("should exit with custom message and exit code", () => {
      expect(() =>
        ErrorHandler.handleWithMessage("Custom error", ExitCodes.OPERATION_FAILED),
      ).toThrow("process.exit(5)");
      expect(consoleErrorSpy).toHaveBeenCalledWith("❌ Error: Custom error");
    });

    it("should use GENERAL_ERROR by default", () => {
      expect(() => ErrorHandler.handleWithMessage("Some error")).toThrow(
        "process.exit(1)",
      );
    });
  });
});
