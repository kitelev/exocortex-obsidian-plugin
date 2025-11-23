import { ApplicationError } from "./ApplicationError.js";
import { ErrorCode } from "./ErrorCode.js";

/**
 * Error thrown when resource limits are exceeded
 *
 * Examples:
 * - Out of memory
 * - Disk space full
 * - Rate limit exceeded
 * - Too many open files
 * - Query result set too large
 */
export class ResourceExhaustedError extends ApplicationError {
  readonly code = ErrorCode.RESOURCE_EXHAUSTED;
  readonly retriable = true; // May resolve after resources freed
  readonly guidance =
    `A resource limit has been exceeded.
To resolve:
  • Free up system resources (memory, disk space)
  • Reduce the size of your request
  • Wait and retry (for rate limits)
  • Close unused files/connections
  • Paginate large queries`;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
