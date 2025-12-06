import { ExitCodes } from "../ExitCodes.js";
import { CLIError } from "./CLIError.js";
import { ErrorCode } from "../../responses/index.js";

/**
 * Error thrown when an invalid state transition is attempted
 */
export class InvalidStateTransitionError extends CLIError {
  readonly exitCode = ExitCodes.INVALID_STATE_TRANSITION;
  readonly errorCode = ErrorCode.STATE_INVALID_TRANSITION;
  readonly guidance: string;

  constructor(
    currentState: string,
    targetState: string,
    allowedStates: string[],
    context?: Record<string, unknown>,
  ) {
    const allowedList = allowedStates.join(", ");
    super(
      `Invalid state transition: cannot transition from "${currentState}" to "${targetState}"`,
      {
        currentState,
        targetState,
        allowedStates,
        ...context,
      },
      {
        message: `Valid transitions from "${currentState}": ${allowedList}`,
        suggestion: `Use one of the allowed commands for the current state`,
      },
    );

    this.guidance = `Cannot transition from "${currentState}" to "${targetState}".
Valid target states from "${currentState}": ${allowedList}`;
  }
}
