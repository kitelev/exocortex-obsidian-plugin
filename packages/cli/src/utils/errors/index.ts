/**
 * Typed error classes for CLI commands
 *
 * Provides structured errors with:
 * - Specific exit codes for shell integration
 * - Actionable guidance for users
 * - Context information for debugging
 */

export { CLIError } from "./CLIError.js";
export { FileNotFoundError } from "./FileNotFoundError.js";
export { InvalidArgumentsError } from "./InvalidArgumentsError.js";
export { ConcurrentModificationError } from "./ConcurrentModificationError.js";
