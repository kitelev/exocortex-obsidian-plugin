import { ExitCodes } from "./ExitCodes.js";
import { CLIError } from "./errors/CLIError.js";

/**
 * Handles errors in CLI commands with appropriate exit codes
 *
 * Provides centralized error handling with user-friendly messages
 * and proper Unix exit codes for scripting integration.
 */
export class ErrorHandler {
  /**
   * Handles an error by printing a message and exiting with appropriate code
   *
   * @param error - The error to handle
   * @returns never (process exits)
   *
   * @example
   * try {
   *   // ... command logic
   * } catch (error) {
   *   ErrorHandler.handle(error as Error);
   * }
   */
  static handle(error: Error): never {
    // Handle typed CLI errors with actionable guidance
    if (error instanceof CLIError) {
      console.error(error.format());

      // Show stack trace in development for debugging
      if (process.env.DEBUG || process.env.NODE_ENV === "development") {
        console.error("\n📍 Stack trace:");
        console.error(error.stack);
      }

      process.exit(error.exitCode);
    }

    // Backward compatibility: Handle plain Error instances with string matching
    // Check more specific patterns first to avoid false matches

    // State transition errors (check before "Invalid")
    if (error.message.toLowerCase().includes("transition")) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(ExitCodes.INVALID_STATE_TRANSITION);
    }

    // Transaction errors (check before generic errors)
    if (error.message.toLowerCase().includes("transaction")) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(ExitCodes.TRANSACTION_FAILED);
    }

    // File not found errors
    if (
      error.message.includes("not found") ||
      error.message.includes("ENOENT")
    ) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(ExitCodes.FILE_NOT_FOUND);
    }

    // Permission errors
    if (
      error.message.includes("EACCES") ||
      error.message.includes("permission denied")
    ) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(ExitCodes.PERMISSION_DENIED);
    }

    // Invalid arguments (validation errors) - check last as "Invalid" is broad
    if (
      error.message.includes("Invalid") ||
      error.message.includes("outside vault") ||
      error.message.includes("Not a")
    ) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(ExitCodes.INVALID_ARGUMENTS);
    }

    // Generic error (catch-all)
    console.error(`❌ Error: ${error.message}`);

    // Show stack trace in development for debugging
    if (process.env.DEBUG || process.env.NODE_ENV === "development") {
      console.error(error.stack);
    }

    process.exit(ExitCodes.GENERAL_ERROR);
  }

  /**
   * Handles an error with a custom message
   *
   * @param message - Custom error message to display
   * @param exitCode - Exit code to use (defaults to GENERAL_ERROR)
   * @returns never (process exits)
   */
  static handleWithMessage(
    message: string,
    exitCode: ExitCodes = ExitCodes.GENERAL_ERROR,
  ): never {
    console.error(`❌ Error: ${message}`);
    process.exit(exitCode);
  }
}
