import { ExitCodes } from "../ExitCodes.js";
import { CLIError } from "./CLIError.js";

/**
 * Error thrown when a file was modified by another process during command execution
 */
export class ConcurrentModificationError extends CLIError {
  readonly exitCode = ExitCodes.CONCURRENT_MODIFICATION;
  readonly guidance = `The file was modified by another process.
To fix:
  • Retry the command to process the latest version
  • Ensure only one process modifies the file at a time
  • Use file locking mechanisms if concurrent access is needed`;

  constructor(
    filepath: string,
    details?: string,
    context?: Record<string, unknown>,
  ) {
    super(
      `Concurrent modification detected: ${filepath}${details ? ` (${details})` : ""}`,
      {
        filepath,
        ...context,
      },
    );
  }
}
