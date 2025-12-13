import type { ErrorCode } from "./ErrorCodes";

/**
 * Options for error logging with production-safe sanitization.
 */
export interface ErrorLogOptions {
  /**
   * Error code for debugging (shown in both dev and prod).
   * Use ErrorCodes constants for consistent error identification.
   */
  errorCode?: ErrorCode;

  /**
   * The actual error object.
   * Stack trace is only logged in development mode.
   */
  error?: Error | unknown;

  /**
   * Additional context for debugging.
   * Only logged in development mode.
   */
  context?: Record<string, unknown>;
}

export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;

  /**
   * Log an error message.
   *
   * In production mode:
   * - Shows user-friendly message with error code
   * - Hides stack traces and implementation details
   *
   * In development mode:
   * - Shows full error details including stack traces
   * - Shows additional context
   *
   * @param message - User-friendly error message
   * @param errorOrOptions - Error object or options with error code
   */
  error(message: string, errorOrOptions?: Error | unknown | ErrorLogOptions): void;
}
