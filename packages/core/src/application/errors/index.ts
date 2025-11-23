/**
 * Application-level error handling services
 *
 * Provides:
 * - ApplicationErrorHandler with retry logic
 * - Error telemetry hooks for monitoring
 * - Retry configuration
 */

export {
  ApplicationErrorHandler,
  type RetryConfig,
  type ErrorTelemetryHook,
} from "./ApplicationErrorHandler.js";
