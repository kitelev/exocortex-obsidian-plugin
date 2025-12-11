import { describe, it, expect } from "@jest/globals";
import { ConcurrentModificationError } from "../../../../src/utils/errors/ConcurrentModificationError.js";
import { ExitCodes } from "../../../../src/utils/ExitCodes.js";
import { ErrorCode } from "../../../../src/responses/index.js";

describe("ConcurrentModificationError", () => {
  describe("constructor", () => {
    it("should create error with filepath", () => {
      const error = new ConcurrentModificationError("/path/to/file.md");

      expect(error.message).toBe("Concurrent modification detected: /path/to/file.md");
    });

    it("should include details when provided", () => {
      const error = new ConcurrentModificationError(
        "/path/to/file.md",
        "modified by another process",
      );

      expect(error.message).toBe("Concurrent modification detected: /path/to/file.md (modified by another process)");
    });

    it("should set correct exit code", () => {
      const error = new ConcurrentModificationError("/path/to/file.md");

      expect(error.exitCode).toBe(ExitCodes.CONCURRENT_MODIFICATION);
    });

    it("should set correct error code", () => {
      const error = new ConcurrentModificationError("/path/to/file.md");

      expect(error.errorCode).toBe(ErrorCode.STATE_CONCURRENT_MODIFICATION);
    });

    it("should include filepath in context", () => {
      const error = new ConcurrentModificationError("/path/to/file.md");

      expect(error.context?.filepath).toBe("/path/to/file.md");
    });

    it("should merge additional context", () => {
      const error = new ConcurrentModificationError(
        "/path/to/file.md",
        undefined,
        { expectedHash: "abc123", actualHash: "def456" },
      );

      expect(error.context?.filepath).toBe("/path/to/file.md");
      expect(error.context?.expectedHash).toBe("abc123");
      expect(error.context?.actualHash).toBe("def456");
    });

    it("should have helpful guidance", () => {
      const error = new ConcurrentModificationError("/path/to/file.md");

      expect(error.guidance).toContain("modified by another process");
      expect(error.guidance).toContain("Retry");
    });

    it("should have recovery hint", () => {
      const error = new ConcurrentModificationError("/path/to/file.md");

      expect(error.recoveryHint).toBeDefined();
      expect(error.recoveryHint?.message).toContain("Retry");
    });
  });

  describe("inheritance", () => {
    it("should be instance of Error", () => {
      const error = new ConcurrentModificationError("/path");

      expect(error).toBeInstanceOf(Error);
    });

    it("should have correct name", () => {
      const error = new ConcurrentModificationError("/path");

      expect(error.name).toBe("ConcurrentModificationError");
    });
  });

  describe("format()", () => {
    it("should format error for display", () => {
      const error = new ConcurrentModificationError("/test/file.md");

      const formatted = error.format();

      expect(formatted).toContain("❌ ConcurrentModificationError");
      expect(formatted).toContain("Concurrent modification detected");
      expect(formatted).toContain("/test/file.md");
    });
  });

  describe("toStructuredResponse()", () => {
    it("should return structured response", () => {
      const error = new ConcurrentModificationError("/path");

      const response = error.toStructuredResponse();

      expect(response.success).toBe(false);
      expect(response.error.code).toBe(ErrorCode.STATE_CONCURRENT_MODIFICATION);
      expect(response.error.exitCode).toBe(ExitCodes.CONCURRENT_MODIFICATION);
    });
  });
});
