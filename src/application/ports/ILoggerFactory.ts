import { ILogger } from "./ILogger";

/**
 * Application layer abstraction for logger creation
 * Follows Dependency Inversion Principle - high-level modules should not depend on low-level modules
 */
export interface ILoggerFactory {
  create(name?: string): ILogger;
  createForClass<T>(constructor: new (...args: any[]) => T): ILogger;
  createWithContext(name: string, context: Record<string, any>): ILogger;
}