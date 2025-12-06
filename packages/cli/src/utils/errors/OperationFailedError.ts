import { ExitCodes } from "../ExitCodes.js";
import { CLIError } from "./CLIError.js";
import { ErrorCode } from "../../responses/index.js";

/**
 * Error thrown when a CLI operation fails for internal reasons
 */
export class OperationFailedError extends CLIError {
  readonly exitCode = ExitCodes.OPERATION_FAILED;
  readonly errorCode = ErrorCode.INTERNAL_OPERATION_FAILED;
  readonly guidance: string;

  constructor(
    operation: string,
    reason: string,
    suggestion?: string,
    context?: Record<string, unknown>,
  ) {
    super(
      `Operation "${operation}" failed: ${reason}`,
      {
        operation,
        reason,
        ...context,
      },
      {
        message: suggestion || "Check the error details and retry",
        suggestion: suggestion,
      },
    );

    this.guidance = suggestion || `The operation "${operation}" could not be completed.
Reason: ${reason}
Try checking file permissions and vault configuration.`;
  }
}
