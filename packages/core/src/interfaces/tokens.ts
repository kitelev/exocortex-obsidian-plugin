/**
 * Dependency Injection Tokens
 * Symbol-based tokens for TSyringe container registration
 */

export const DI_TOKENS = {
  // Infrastructure adapters
  IFileSystemAdapter: Symbol.for("IFileSystemAdapter"),
  IVaultAdapter: Symbol.for("IVaultAdapter"),

  // Cross-cutting concerns
  ILogger: Symbol.for("ILogger"),
  IEventBus: Symbol.for("IEventBus"),
  IConfiguration: Symbol.for("IConfiguration"),
  INotificationService: Symbol.for("INotificationService"),
} as const;

export type DIToken = typeof DI_TOKENS[keyof typeof DI_TOKENS];
