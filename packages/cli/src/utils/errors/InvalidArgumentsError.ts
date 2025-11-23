import { ExitCodes } from "../ExitCodes.js";
import { CLIError } from "./CLIError.js";

/**
 * Error thrown when command arguments are invalid
 */
export class InvalidArgumentsError extends CLIError {
  readonly exitCode = ExitCodes.INVALID_ARGUMENTS;
  readonly guidance: string;

  constructor(
    message: string,
    suggestion?: string,
    context?: Record<string, unknown>,
  ) {
    super(message, context);

    this.guidance =
      suggestion ||
      `Check command syntax and argument format.
Use: exocortex command --help for usage information.`;
  }
}
