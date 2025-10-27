/* eslint-disable no-console */
import { ILogger } from "./ILogger";

export class Logger implements ILogger {
  constructor(private context: string) {}

  debug(message: string, ...args: unknown[]): void {
    console.debug(`[${this.context}] ${message}`, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    console.info(`[${this.context}] ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[${this.context}] ${message}`, ...args);
  }

  error(message: string, error?: Error | unknown): void {
    if (error instanceof Error) {
      console.error(`[${this.context}] ${message}`, error);
    } else {
      console.error(`[${this.context}] ${message}`, error);
    }
  }
}
