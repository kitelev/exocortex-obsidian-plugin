/**
 * Central type definitions for the Exocortex plugin
 * Exports all type definitions and utilities
 */

// Obsidian types
export * from './obsidian';

// Property system types
export * from './properties';

// Rendering system types
export * from './rendering';

// Type guards and validation
export * from './guards';

// Domain-specific types
export * from './domain';

// Common utility types
export type Maybe<T> = T | null | undefined;
export type Optional<T> = T | undefined;
export type NonNullable<T> = T extends null | undefined ? never : T;

// Result type for error handling
export interface Success<T> {
  success: true;
  data: T;
  error?: never;
}

export interface Failure {
  success: false;
  data?: never;
  error: string;
}

export type Result<T> = Success<T> | Failure;

// Event handling types
export interface EventHandler<T = unknown> {
  (event: T): void | Promise<void>;
}

export interface EventEmitter<T extends Record<string, unknown> = Record<string, unknown>> {
  on<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void;
  off<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void;
  emit<K extends keyof T>(event: K, data: T[K]): void;
}

// Plugin configuration types
export interface PluginSettings {
  enableDebugLogging: boolean;
  defaultOntology: string;
  queryTimeout: number;
  maxQueryResults: number;
  cacheEnabled: boolean;
  cacheSize: number;
  [key: string]: unknown;
}

// Error types
export class TypeValidationError extends Error {
  constructor(message: string, public readonly field?: string, public readonly expectedType?: string) {
    super(message);
    this.name = 'TypeValidationError';
  }
}

export class ConfigurationError extends Error {
  constructor(message: string, public readonly configKey?: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

// Utility type for making properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Utility type for making properties required
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Deep readonly utility type
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};