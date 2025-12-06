import { ExitCodes } from "../ExitCodes.js";
import { CLIError } from "./CLIError.js";
import { ErrorCode } from "../../responses/index.js";

/**
 * Error thrown when the vault directory does not exist
 */
export class VaultNotFoundError extends CLIError {
  readonly exitCode = ExitCodes.FILE_NOT_FOUND;
  readonly errorCode = ErrorCode.VALIDATION_VAULT_NOT_FOUND;
  readonly guidance = `The specified vault directory does not exist.
Check:
  • Path spelling and case sensitivity
  • Directory exists and is accessible
  • You have read permissions for the directory`;

  constructor(vaultPath: string, context?: Record<string, unknown>) {
    super(
      `Vault not found: ${vaultPath}`,
      {
        vaultPath,
        ...context,
      },
      {
        message: "Verify the vault path is correct and the directory exists",
        suggestion: `ls -la "${vaultPath}" or check --vault option`,
      },
    );
  }
}
