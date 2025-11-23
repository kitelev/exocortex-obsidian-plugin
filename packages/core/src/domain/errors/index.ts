/**
 * Centralized error handling for the application
 *
 * This module provides:
 * - Standardized error codes
 * - Base ApplicationError class with structured metadata
 * - Typed error classes for common failure scenarios
 * - User-friendly error messages with actionable guidance
 */

export { ErrorCode } from "./ErrorCode.js";
export { ApplicationError } from "./ApplicationError.js";
export { ValidationError } from "./ValidationError.js";
export { NetworkError } from "./NetworkError.js";
export { StateTransitionError } from "./StateTransitionError.js";
export { PermissionError } from "./PermissionError.js";
export { NotFoundError } from "./NotFoundError.js";
export { ResourceExhaustedError } from "./ResourceExhaustedError.js";
