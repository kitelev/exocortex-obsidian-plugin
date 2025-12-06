import { ExitCodes } from "../ExitCodes.js";
import { CLIError } from "./CLIError.js";
import { ErrorCode } from "../../responses/index.js";

/**
 * Error thrown when file system permission is denied
 */
export class PermissionDeniedError extends CLIError {
  readonly exitCode = ExitCodes.PERMISSION_DENIED;
  readonly errorCode = ErrorCode.PERMISSION_DENIED;
  readonly guidance = `Permission denied for file system operation.
Check:
  • File and directory permissions
  • You have write access to the vault
  • No other process has locked the file`;

  constructor(
    filepath: string,
    operation: string,
    context?: Record<string, unknown>,
  ) {
    super(
      `Permission denied: cannot ${operation} "${filepath}"`,
      {
        filepath,
        operation,
        ...context,
      },
      {
        message: "Check file permissions and ensure you have access",
        suggestion: `chmod u+rw "${filepath}" or check parent directory permissions`,
      },
    );
  }
}
