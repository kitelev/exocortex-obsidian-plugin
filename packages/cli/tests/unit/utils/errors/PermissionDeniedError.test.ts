import { describe, it, expect } from "@jest/globals";
import { PermissionDeniedError } from "../../../../src/utils/errors/PermissionDeniedError.js";
import { ExitCodes } from "../../../../src/utils/ExitCodes.js";
import { ErrorCode } from "../../../../src/responses/index.js";

describe("PermissionDeniedError", () => {
  describe("constructor", () => {
    it("should create error with filepath and operation", () => {
      const error = new PermissionDeniedError("/path/to/file.md", "write");

      expect(error.message).toBe('Permission denied: cannot write "/path/to/file.md"');
    });

    it("should set correct exit code", () => {
      const error = new PermissionDeniedError("/path/to/file.md", "read");

      expect(error.exitCode).toBe(ExitCodes.PERMISSION_DENIED);
    });

    it("should set correct error code", () => {
      const error = new PermissionDeniedError("/path/to/file.md", "read");

      expect(error.errorCode).toBe(ErrorCode.PERMISSION_DENIED);
    });

    it("should include filepath and operation in context", () => {
      const error = new PermissionDeniedError("/path/to/file.md", "delete");

      expect(error.context?.filepath).toBe("/path/to/file.md");
      expect(error.context?.operation).toBe("delete");
    });

    it("should merge additional context", () => {
      const error = new PermissionDeniedError(
        "/path/to/file.md",
        "write",
        { user: "test-user" },
      );

      expect(error.context?.filepath).toBe("/path/to/file.md");
      expect(error.context?.user).toBe("test-user");
    });

    it("should have helpful guidance", () => {
      const error = new PermissionDeniedError("/path/to/file.md", "write");

      expect(error.guidance).toContain("Permission denied");
      expect(error.guidance).toContain("permissions");
    });

    it("should have recovery hint with chmod suggestion", () => {
      const error = new PermissionDeniedError("/path/to/file.md", "write");

      expect(error.recoveryHint).toBeDefined();
      expect(error.recoveryHint?.suggestion).toContain("chmod");
    });
  });

  describe("inheritance", () => {
    it("should be instance of Error", () => {
      const error = new PermissionDeniedError("/path", "read");

      expect(error).toBeInstanceOf(Error);
    });

    it("should have correct name", () => {
      const error = new PermissionDeniedError("/path", "read");

      expect(error.name).toBe("PermissionDeniedError");
    });
  });

  describe("format()", () => {
    it("should format error for display", () => {
      const error = new PermissionDeniedError("/test/file.md", "write");

      const formatted = error.format();

      expect(formatted).toContain("❌ PermissionDeniedError");
      expect(formatted).toContain("Permission denied");
      expect(formatted).toContain("/test/file.md");
    });

    it("should show context with operation", () => {
      const error = new PermissionDeniedError("/test/file.md", "delete");

      const formatted = error.format();

      expect(formatted).toContain("📋 Context:");
      expect(formatted).toContain("operation");
      expect(formatted).toContain("delete");
    });
  });

  describe("toStructuredResponse()", () => {
    it("should return structured response", () => {
      const error = new PermissionDeniedError("/path", "read");

      const response = error.toStructuredResponse();

      expect(response.success).toBe(false);
      expect(response.error.code).toBe(ErrorCode.PERMISSION_DENIED);
      expect(response.error.exitCode).toBe(ExitCodes.PERMISSION_DENIED);
    });
  });
});
