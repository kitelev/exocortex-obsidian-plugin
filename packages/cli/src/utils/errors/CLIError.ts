import { ExitCodes } from "../ExitCodes.js";

/**
 * Base error class for all CLI errors
 *
 * Provides structured error information with:
 * - Error message describing what went wrong
 * - Exit code for shell integration
 * - Actionable guidance on how to fix
 * - Optional context for debugging
 */
export abstract class CLIError extends Error {
  /**
   * Exit code for this error type
   */
  abstract readonly exitCode: ExitCodes;

  /**
   * Actionable guidance on how to fix this error
   */
  abstract readonly guidance: string;

  /**
   * Additional context for debugging (optional)
   */
  readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.context = context;

    // Maintain proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Formats the error for display to user
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
}
