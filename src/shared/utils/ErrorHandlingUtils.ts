import { Notice } from "obsidian";

/**
 * Common error handling utilities to eliminate duplication
 * Implements DRY principle for error processing and user notifications
 */
export class ErrorHandlingUtils {
  /**
   * Handle repository operation errors with consistent logging and user notification
   */
  static handleRepositoryError(
    operation: string,
    error: Error,
    context?: Record<string, any>,
  ): void {
    const message = `${operation} failed: ${error.message}`;
    console.error(message, { error, context });

    new Notice(`Error: ${message}`, 5000);
  }

  /**
   * Handle rendering errors with graceful degradation
   */
  static handleRenderingError(
    component: string,
    error: Error,
    container?: HTMLElement,
    fallbackMessage?: string,
  ): void {
    const message = `${component} rendering failed: ${error.message}`;
    console.error(message, error);

    if (container) {
      container.empty();
      container.createEl("div", {
        text: fallbackMessage || "Content could not be displayed",
        cls: "exocortex-error-fallback",
      });
    }

    new Notice(`Rendering error in ${component}`, 3000);
  }

  /**
   * Handle validation errors with user-friendly messages
   */
  static handleValidationError(
    field: string,
    value: any,
    expectedFormat?: string,
  ): void {
    const message = expectedFormat
      ? `Invalid ${field}: "${value}". Expected format: ${expectedFormat}`
      : `Invalid ${field}: "${value}"`;

    console.warn(message);
    new Notice(message, 4000);
  }

  /**
   * Safe async operation wrapper with error handling
   */
  static async safeAsync<T>(
    operation: () => Promise<T>,
    errorContext: string,
    fallback?: T,
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      console.error(`${errorContext} failed:`, error);

      if (fallback !== undefined) {
        return fallback;
      }

      return undefined;
    }
  }

  /**
   * Safe sync operation wrapper with error handling
   */
  static safeSync<T>(
    operation: () => T,
    errorContext: string,
    fallback?: T,
  ): T | undefined {
    try {
      return operation();
    } catch (error) {
      console.error(`${errorContext} failed:`, error);

      if (fallback !== undefined) {
        return fallback;
      }

      return undefined;
    }
  }

  /**
   * Create standardized error objects
   */
  static createError(
    code: string,
    message: string,
    context?: Record<string, any>,
  ): Error {
    const error = new Error(message);
    (error as any).code = code;
    (error as any).context = context;
    return error;
  }

  /**
   * Check if error is of specific type
   */
  static isErrorOfType(error: any, expectedCode: string): boolean {
    return error?.code === expectedCode;
  }

  /**
   * Format error for logging with context
   */
  static formatErrorForLogging(
    error: Error,
    context?: Record<string, any>,
  ): Record<string, any> {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: (error as any).code,
      context,
      timestamp: new Date().toISOString(),
    };
  }
}
