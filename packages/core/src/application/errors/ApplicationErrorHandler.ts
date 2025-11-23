import { ApplicationError } from "../../domain/errors/ApplicationError.js";

/**
 * Retry configuration for error handling
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts
   */
  maxRetries: number;

  /**
   * Initial delay in milliseconds before first retry
   */
  initialDelayMs: number;

  /**
   * Backoff multiplier for exponential backoff
   * Each retry delay = previous delay * backoffMultiplier
   */
  backoffMultiplier: number;

  /**
   * Maximum delay in milliseconds between retries
   */
  maxDelayMs: number;
}

/**
 * Error telemetry hook for logging/monitoring
 */
export interface ErrorTelemetryHook {
  /**
   * Called when an error is handled
   */
  onError(error: ApplicationError, context?: Record<string, unknown>): void;

  /**
   * Called when a retry attempt is made
   */
  onRetry?(
    error: ApplicationError,
    attemptNumber: number,
    delayMs: number,
  ): void;

  /**
   * Called when all retries are exhausted
   */
  onRetryExhausted?(error: ApplicationError, totalAttempts: number): void;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  backoffMultiplier: 2, // Exponential backoff: 1s, 2s, 4s
  maxDelayMs: 10000, // 10 seconds max
};

/**
 * Centralized error handler with retry logic and telemetry hooks
 *
 * Features:
 * - Automatic retry for retriable errors with exponential backoff
 * - Error telemetry hooks for logging/monitoring (e.g., Sentry)
 * - User-friendly error formatting
 * - Context enrichment for debugging
 */
export class ApplicationErrorHandler {
  private telemetryHooks: ErrorTelemetryHook[] = [];
  private retryConfig: RetryConfig;

  constructor(retryConfig?: Partial<RetryConfig>) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  /**
   * Registers a telemetry hook for error monitoring
   */
  registerTelemetryHook(hook: ErrorTelemetryHook): void {
    this.telemetryHooks.push(hook);
  }

  /**
   * Removes a telemetry hook
   */
  unregisterTelemetryHook(hook: ErrorTelemetryHook): void {
    const index = this.telemetryHooks.indexOf(hook);
    if (index !== -1) {
      this.telemetryHooks.splice(index, 1);
    }
  }

  /**
   * Handles an error with optional retry logic
   *
   * @param error - The error to handle
   * @param context - Additional context for debugging
   * @returns Formatted error message
   */
  handle(error: Error, context?: Record<string, unknown>): string {
    // Convert plain Error to ApplicationError if needed
    const appError = this.ensureApplicationError(error, context);

    // Notify telemetry hooks
    this.notifyTelemetryHooks(appError, context);

    // Return formatted error message
    return appError.format();
  }

  /**
   * Executes an operation with automatic retry for retriable errors
   *
   * @param operation - The async operation to execute
   * @param context - Additional context for debugging
   * @returns Result of the operation
   * @throws ApplicationError if all retries exhausted or error is not retriable
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context?: Record<string, unknown>,
  ): Promise<T> {
    let lastError: ApplicationError | null = null;
    let attempt = 0;

    while (attempt <= this.retryConfig.maxRetries) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.ensureApplicationError(error as Error, context);

        // If error is not retriable, fail immediately
        if (!lastError.retriable) {
          this.notifyTelemetryHooks(lastError, context);
          throw lastError;
        }

        // If max retries reached, fail
        if (attempt >= this.retryConfig.maxRetries) {
          this.notifyTelemetryHooks(lastError, context);
          this.notifyRetryExhausted(lastError, attempt + 1);
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt);

        // Notify telemetry hooks about retry
        this.notifyRetryAttempt(lastError, attempt + 1, delay);

        // Wait before retrying
        await this.sleep(delay);

        attempt++;
      }
    }

    // Should never reach here, but TypeScript needs this
    throw lastError!;
  }

  /**
   * Converts any error to ApplicationError
   */
  private ensureApplicationError(
    error: Error,
    context?: Record<string, unknown>,
  ): ApplicationError {
    if (error instanceof ApplicationError) {
      // Merge context if provided
      if (context) {
        return Object.create(error, {
          context: {
            value: { ...error.context, ...context },
            enumerable: true,
          },
        });
      }
      return error;
    }

    // Wrap plain Error as ApplicationError
    // Use a generic UnknownError class (to be implemented)
    return {
      name: "UnknownError",
      message: error.message,
      code: 9000, // UNKNOWN_ERROR
      retriable: false,
      guidance: "An unexpected error occurred. Please check logs for details.",
      context: { originalError: error.name, ...context },
      timestamp: new Date(),
      stack: error.stack,
      format() {
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
      },
      toJSON() {
        return {
          name: this.name,
          message: this.message,
          code: this.code,
          retriable: this.retriable,
          timestamp: this.timestamp.toISOString(),
          context: this.context,
          stack: this.stack,
        };
      },
    } as ApplicationError;
  }

  /**
   * Calculates retry delay with exponential backoff
   */
  private calculateDelay(attemptNumber: number): number {
    const delay =
      this.retryConfig.initialDelayMs *
      Math.pow(this.retryConfig.backoffMultiplier, attemptNumber);
    return Math.min(delay, this.retryConfig.maxDelayMs);
  }

  /**
   * Sleeps for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Notifies all telemetry hooks about error
   */
  private notifyTelemetryHooks(
    error: ApplicationError,
    context?: Record<string, unknown>,
  ): void {
    for (const hook of this.telemetryHooks) {
      try {
        hook.onError(error, context);
      } catch (hookError) {
        // Prevent hook errors from breaking error handling
        console.error("Error in telemetry hook:", hookError);
      }
    }
  }

  /**
   * Notifies all telemetry hooks about retry attempt
   */
  private notifyRetryAttempt(
    error: ApplicationError,
    attemptNumber: number,
    delayMs: number,
  ): void {
    for (const hook of this.telemetryHooks) {
      try {
        hook.onRetry?.(error, attemptNumber, delayMs);
      } catch (hookError) {
        console.error("Error in telemetry hook:", hookError);
      }
    }
  }

  /**
   * Notifies all telemetry hooks that retries are exhausted
   */
  private notifyRetryExhausted(
    error: ApplicationError,
    totalAttempts: number,
  ): void {
    for (const hook of this.telemetryHooks) {
      try {
        hook.onRetryExhausted?.(error, totalAttempts);
      } catch (hookError) {
        console.error("Error in telemetry hook:", hookError);
      }
    }
  }
}
