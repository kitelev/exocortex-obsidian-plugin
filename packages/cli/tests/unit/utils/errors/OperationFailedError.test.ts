import { describe, it, expect } from "@jest/globals";
import { OperationFailedError } from "../../../../src/utils/errors/OperationFailedError.js";
import { ExitCodes } from "../../../../src/utils/ExitCodes.js";
import { ErrorCode } from "../../../../src/responses/index.js";

describe("OperationFailedError", () => {
  describe("constructor", () => {
    it("should create error with operation and reason", () => {
      const error = new OperationFailedError("create-task", "Disk full");

      expect(error.message).toBe('Operation "create-task" failed: Disk full');
    });

    it("should set correct exit code", () => {
      const error = new OperationFailedError("update", "Unknown error");

      expect(error.exitCode).toBe(ExitCodes.OPERATION_FAILED);
    });

    it("should set correct error code", () => {
      const error = new OperationFailedError("update", "Unknown error");

      expect(error.errorCode).toBe(ErrorCode.INTERNAL_OPERATION_FAILED);
    });

    it("should include operation and reason in context", () => {
      const error = new OperationFailedError("create-task", "Disk full");

      expect(error.context?.operation).toBe("create-task");
      expect(error.context?.reason).toBe("Disk full");
    });

    it("should merge additional context", () => {
      const error = new OperationFailedError(
        "update",
        "Error",
        undefined,
        { filepath: "/test/file.md" },
      );

      expect(error.context?.operation).toBe("update");
      expect(error.context?.filepath).toBe("/test/file.md");
    });

    it("should use custom suggestion when provided", () => {
      const error = new OperationFailedError(
        "backup",
        "No space",
        "Free up disk space and retry",
      );

      expect(error.guidance).toBe("Free up disk space and retry");
    });

    it("should use default guidance when no suggestion provided", () => {
      const error = new OperationFailedError("update", "Failed");

      expect(error.guidance).toContain("update");
      expect(error.guidance).toContain("Failed");
    });

    it("should have recovery hint", () => {
      const error = new OperationFailedError("update", "Failed", "Retry the operation");

      expect(error.recoveryHint).toBeDefined();
    });
  });

  describe("inheritance", () => {
    it("should be instance of Error", () => {
      const error = new OperationFailedError("op", "reason");

      expect(error).toBeInstanceOf(Error);
    });

    it("should have correct name", () => {
      const error = new OperationFailedError("op", "reason");

      expect(error.name).toBe("OperationFailedError");
    });
  });

  describe("format()", () => {
    it("should format error for display", () => {
      const error = new OperationFailedError("create-task", "Permission denied");

      const formatted = error.format();

      expect(formatted).toContain("❌ OperationFailedError");
      expect(formatted).toContain("create-task");
      expect(formatted).toContain("Permission denied");
    });
  });

  describe("toStructuredResponse()", () => {
    it("should return structured response", () => {
      const error = new OperationFailedError("update", "Failed");

      const response = error.toStructuredResponse();

      expect(response.success).toBe(false);
      expect(response.error.code).toBe(ErrorCode.INTERNAL_OPERATION_FAILED);
      expect(response.error.exitCode).toBe(ExitCodes.OPERATION_FAILED);
    });
  });
});
