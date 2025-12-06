import { ExitCodes } from "../ExitCodes.js";
import { CLIError } from "./CLIError.js";
import { ErrorCode } from "../../responses/index.js";

/**
 * Error thrown when a required file does not exist
 */
export class FileNotFoundError extends CLIError {
  readonly exitCode = ExitCodes.FILE_NOT_FOUND;
  readonly errorCode = ErrorCode.VALIDATION_FILE_NOT_FOUND;
  readonly guidance = `Verify the file path is correct and the file exists.
Check:
  • File path spelling
  • File is in the vault directory
  • File has .md extension`;

  constructor(filepath: string, context?: Record<string, unknown>) {
    super(
      `File not found: ${filepath}`,
      {
        filepath,
        ...context,
      },
      {
        message: "Verify the file path is correct and the file exists",
        suggestion: `ls -la "${filepath}" or find . -name "$(basename ${filepath})"`,
      },
    );
  }
}
