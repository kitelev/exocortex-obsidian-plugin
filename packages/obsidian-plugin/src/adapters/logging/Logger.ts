/* eslint-disable no-console */
import type { ILogger, ErrorLogOptions } from "./ILogger";
import { ErrorMessages } from "./ErrorCodes";

/**
 * Environment-aware logger that sanitizes stack traces in production.
 *
 * In production mode:
 * - Shows user-friendly error messages with error codes
 * - Hides stack traces to prevent information leakage
 *
 * In development mode:
 * - Shows full error details including stack traces
 * - Shows additional context for debugging
 */
export class Logger implements ILogger {
  private static isDevelopment: boolean | undefined = undefined;

  constructor(private context: string) {}

  /**
   * Determines if we're in development mode.
   * Uses process.env.NODE_ENV if available, falls back to checking for common dev indicators.
   */
  private static checkIsDevelopment(): boolean {
    if (Logger.isDevelopment !== undefined) {
      return Logger.isDevelopment;
    }

    // Check NODE_ENV if available
    if (typeof process !== "undefined" && process.env?.NODE_ENV) {
      Logger.isDevelopment = process.env.NODE_ENV === "development";
      return Logger.isDevelopment;
    }

    // Fallback: check for localhost or common dev indicators
    // In Obsidian, we can't rely on process.env, so we use a reasonable default
    // This can be overridden via setDevelopmentMode()
    Logger.isDevelopment = false;
    return Logger.isDevelopment;
  }

  /**
   * Allows explicitly setting development mode.
   * Useful for testing or when environment detection doesn't work.
   */
  static setDevelopmentMode(isDev: boolean): void {
    Logger.isDevelopment = isDev;
  }

  /**
   * Gets the current development mode setting.
   */
  static isDevelopmentMode(): boolean {
    return Logger.checkIsDevelopment();
  }

  debug(message: string, ...args: unknown[]): void {
    console.debug(`[${this.context}] ${message}`, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    console.info(`[${this.context}] ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[${this.context}] ${message}`, ...args);
  }

  error(message: string, errorOrOptions?: Error | unknown | ErrorLogOptions): void {
    const isDev = Logger.checkIsDevelopment();

    // Handle the different call signatures
    if (this.isErrorLogOptions(errorOrOptions)) {
      this.logWithOptions(message, errorOrOptions, isDev);
    } else {
      this.logSimpleError(message, errorOrOptions, isDev);
    }
  }

  /**
   * Type guard to check if the argument is ErrorLogOptions
   */
  private isErrorLogOptions(arg: unknown): arg is ErrorLogOptions {
    return (
      typeof arg === "object" &&
      arg !== null &&
      !this.isError(arg) &&
      ("errorCode" in arg || "error" in arg || "context" in arg)
    );
  }

  /**
   * Type guard for Error objects
   */
  private isError(arg: unknown): arg is Error {
    return arg instanceof Error;
  }

  /**
   * Log error with ErrorLogOptions for structured logging
   */
  private logWithOptions(message: string, options: ErrorLogOptions, isDev: boolean): void {
    const { errorCode, error, context } = options;

    if (isDev) {
      // Development: show full details
      const errorCodeStr = errorCode ? ` [${errorCode}]` : "";
      console.error(`[${this.context}]${errorCodeStr} ${message}`);

      if (error) {
        if (this.isError(error)) {
          console.error(`  Error: ${error.message}`);
          if (error.stack) {
            console.error(`  Stack trace:\n${error.stack}`);
          }
        } else {
          console.error(`  Error:`, error);
        }
      }

      if (context && Object.keys(context).length > 0) {
        console.error(`  Context:`, context);
      }
    } else {
      // Production: sanitized output
      const errorCodeStr = errorCode ? ` [${errorCode}]` : "";
      const userMessage = errorCode ? ErrorMessages[errorCode] || message : message;

      // Log user-friendly message with error code for debugging
      console.error(`[${this.context}]${errorCodeStr} ${userMessage}`);

      // Only log the error message (no stack trace)
      if (error && this.isError(error)) {
        console.error(`  Details: ${error.message}`);
      }
    }
  }

  /**
   * Log simple error (backward compatible with existing code)
   */
  private logSimpleError(message: string, error: unknown, isDev: boolean): void {
    if (isDev) {
      // Development: show full details
      console.error(`[${this.context}] ${message}`);

      if (error) {
        if (this.isError(error)) {
          console.error(`  Error: ${error.message}`);
          if (error.stack) {
            console.error(`  Stack trace:\n${error.stack}`);
          }
        } else {
          console.error(`  Error:`, error);
        }
      }
    } else {
      // Production: sanitized output
      console.error(`[${this.context}] ${message}`);

      // Only log the error message (no stack trace)
      if (error && this.isError(error)) {
        console.error(`  Details: ${error.message}`);
      }
    }
  }
}
