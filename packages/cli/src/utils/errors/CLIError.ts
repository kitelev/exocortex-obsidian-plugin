import { ExitCodes } from "../ExitCodes.js";
import {
  ErrorCode,
  type RecoveryHint,
  type StructuredErrorResponse,
  ResponseBuilder,
} from "../../responses/index.js";

/**
 * Base error class for all CLI errors
 *
 * Provides structured error information with:
 * - Error message describing what went wrong
 * - Exit code for shell integration
 * - Actionable guidance on how to fix
 * - Optional context for debugging
 * - Structured JSON response for MCP compatibility
 */
export abstract class CLIError extends Error {
  /**
   * Exit code for this error type
   */
  abstract readonly exitCode: ExitCodes;

  /**
   * Error code for programmatic handling by MCP tools
   */
  abstract readonly errorCode: ErrorCode;

  /**
   * Actionable guidance on how to fix this error
   */
  abstract readonly guidance: string;

  /**
   * Additional context for debugging (optional)
   */
  readonly context?: Record<string, unknown>;

  /**
   * Recovery hint for MCP tools
   */
  readonly recoveryHint?: RecoveryHint;

  constructor(
    message: string,
    context?: Record<string, unknown>,
    recoveryHint?: RecoveryHint,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.context = context;
    this.recoveryHint = recoveryHint;

    // Maintain proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Formats the error for display to user (text mode)
   */
  format(): string {
    let output = `❌ ${this.name}: ${this.message}`;

    if (this.guidance) {
      output += `\n\n💡 ${this.guidance}`;
    }

    if (this.context && Object.keys(this.context).length > 0) {
      output += `\n\n📋 Context:`;
      for (const [key, value] of Object.entries(this.context)) {
        output += `\n  ${key}: ${JSON.stringify(value)}`;
      }
    }

    return output;
  }

  /**
   * Converts error to structured JSON response for MCP compatibility
   *
   * @param includeStack - Include stack trace (for debug mode)
   */
  toStructuredResponse(includeStack = false): StructuredErrorResponse {
    return ResponseBuilder.error(this.errorCode, this.message, this.exitCode, {
      recovery: this.recoveryHint || {
        message: this.guidance,
      },
      context: this.context,
      stack: includeStack ? this.stack : undefined,
    });
  }

  /**
   * Formats the error as JSON string
   *
   * @param includeStack - Include stack trace (for debug mode)
   */
  formatJson(includeStack = false): string {
    return JSON.stringify(this.toStructuredResponse(includeStack), null, 2);
  }
}
