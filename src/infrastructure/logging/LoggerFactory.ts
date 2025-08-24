import { ILogger } from "./ILogger";
import { Logger } from "./Logger";
import { LoggerConfig, LoggerConfigFactory } from "./LoggerConfig";

export class LoggerFactory {
  private static config: LoggerConfig = LoggerConfigFactory.createDefault();
  private static loggers: Map<string, ILogger> = new Map();

  static setConfig(config: LoggerConfig): void {
    this.config = config;
    // Clear existing loggers to force recreation with new config
    this.loggers.clear();
  }

  static getConfig(): LoggerConfig {
    return this.config;
  }

  static create(name?: string): ILogger {
    if (!name) {
      return new Logger(this.config);
    }

    const existing = this.loggers.get(name);
    if (existing) {
      return existing;
    }

    const logger = new Logger(this.config, name);
    this.loggers.set(name, logger);
    return logger;
  }

  static createForClass<T>(constructor: new (...args: any[]) => T): ILogger {
    return this.create(constructor.name);
  }

  static createWithContext(
    name: string,
    context: Record<string, any>,
  ): ILogger {
    const baseLogger = this.create(name);
    return baseLogger.createChildLogger(context);
  }

  static getLogger(name: string): ILogger | undefined {
    return this.loggers.get(name);
  }

  static getAllLoggers(): Map<string, ILogger> {
    return new Map(this.loggers);
  }

  static clearAll(): void {
    this.loggers.clear();
  }
}
