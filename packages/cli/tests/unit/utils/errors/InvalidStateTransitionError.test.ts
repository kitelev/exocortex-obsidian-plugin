import { describe, it, expect } from "@jest/globals";
import { InvalidStateTransitionError } from "../../../../src/utils/errors/InvalidStateTransitionError.js";
import { ExitCodes } from "../../../../src/utils/ExitCodes.js";
import { ErrorCode } from "../../../../src/responses/index.js";

describe("InvalidStateTransitionError", () => {
  describe("constructor", () => {
    it("should create error with state transition message", () => {
      const error = new InvalidStateTransitionError("ToDo", "Done", ["Doing", "Trashed"]);

      expect(error.message).toContain("Invalid state transition");
      expect(error.message).toContain("ToDo");
      expect(error.message).toContain("Done");
    });

    it("should set correct exit code", () => {
      const error = new InvalidStateTransitionError("ToDo", "Done", ["Doing"]);

      expect(error.exitCode).toBe(ExitCodes.INVALID_STATE_TRANSITION);
    });

    it("should set correct error code", () => {
      const error = new InvalidStateTransitionError("ToDo", "Done", ["Doing"]);

      expect(error.errorCode).toBe(ErrorCode.STATE_INVALID_TRANSITION);
    });

    it("should include states in context", () => {
      const error = new InvalidStateTransitionError("ToDo", "Done", ["Doing", "Trashed"]);

      expect(error.context?.currentState).toBe("ToDo");
      expect(error.context?.targetState).toBe("Done");
      expect(error.context?.allowedStates).toEqual(["Doing", "Trashed"]);
    });

    it("should merge additional context", () => {
      const error = new InvalidStateTransitionError(
        "ToDo",
        "Done",
        ["Doing"],
        { filepath: "/test/task.md" },
      );

      expect(error.context?.currentState).toBe("ToDo");
      expect(error.context?.filepath).toBe("/test/task.md");
    });

    it("should include allowed states in guidance", () => {
      const error = new InvalidStateTransitionError("ToDo", "Done", ["Doing", "Trashed", "Backlog"]);

      expect(error.guidance).toContain("Doing");
      expect(error.guidance).toContain("Trashed");
      expect(error.guidance).toContain("Backlog");
    });

    it("should have recovery hint with allowed states", () => {
      const error = new InvalidStateTransitionError("ToDo", "Done", ["Doing"]);

      expect(error.recoveryHint).toBeDefined();
      expect(error.recoveryHint?.message).toContain("Doing");
    });
  });

  describe("inheritance", () => {
    it("should be instance of Error", () => {
      const error = new InvalidStateTransitionError("ToDo", "Done", ["Doing"]);

      expect(error).toBeInstanceOf(Error);
    });

    it("should have correct name", () => {
      const error = new InvalidStateTransitionError("ToDo", "Done", ["Doing"]);

      expect(error.name).toBe("InvalidStateTransitionError");
    });
  });

  describe("format()", () => {
    it("should format error for display", () => {
      const error = new InvalidStateTransitionError("ToDo", "Done", ["Doing"]);

      const formatted = error.format();

      expect(formatted).toContain("❌ InvalidStateTransitionError");
      expect(formatted).toContain("Invalid state transition");
    });

    it("should show context with state information", () => {
      const error = new InvalidStateTransitionError("ToDo", "Done", ["Doing"]);

      const formatted = error.format();

      expect(formatted).toContain("📋 Context:");
      expect(formatted).toContain("currentState");
    });
  });

  describe("toStructuredResponse()", () => {
    it("should return structured response", () => {
      const error = new InvalidStateTransitionError("ToDo", "Done", ["Doing"]);

      const response = error.toStructuredResponse();

      expect(response.success).toBe(false);
      expect(response.error.code).toBe(ErrorCode.STATE_INVALID_TRANSITION);
      expect(response.error.exitCode).toBe(ExitCodes.INVALID_STATE_TRANSITION);
    });
  });
});
