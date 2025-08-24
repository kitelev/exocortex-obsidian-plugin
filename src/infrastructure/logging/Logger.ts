import { ILogger, LogLevel, LogContext, LogEntry } from "./ILogger";
import { LoggerConfig, LoggerConfigFactory } from "./LoggerConfig";
import { v4 as uuidv4 } from "uuid";

export class Logger implements ILogger {
  private timers: Map<string, number> = new Map();
  private correlationId?: string;
  private persistentContext: LogContext = {};

  constructor(
    private config: LoggerConfig = LoggerConfigFactory.createDefault(),
    private name?: string,
  ) {}

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log(LogLevel.INFO, message, context);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log(LogLevel.WARN, message, context);
    }
  }

  error(message: string, context?: LogContext, error?: Error): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.log(LogLevel.ERROR, message, context, error);
    }
  }

  startTiming(label: string): void {
    this.timers.set(label, performance.now());
    this.debug(`Timer started: ${label}`);
  }

  endTiming(label: string, context?: LogContext): void {
    const startTime = this.timers.get(label);
    if (startTime === undefined) {
      this.warn(`Timer not found: ${label}`);
      return;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(label);

    const timingContext = {
      ...context,
      label,
      duration: `${duration.toFixed(2)}ms`,
      durationMs: duration,
    };

    if (duration > this.config.performanceThreshold) {
      this.warn(`Slow operation: ${label}`, timingContext);
    } else {
      this.debug(`Timer ended: ${label}`, timingContext);
    }
  }

  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  getCorrelationId(): string | undefined {
    if (!this.correlationId) {
      this.correlationId = this.generateCorrelationId();
    }
    return this.correlationId;
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  getLevel(): LogLevel {
    return this.config.level;
  }

  createChildLogger(context: LogContext): ILogger {
    const child = new Logger(this.config, this.name);
    child.correlationId = this.correlationId;
    child.persistentContext = { ...this.persistentContext, ...context };
    return child;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.isLoggingEnabled()) {
      return false;
    }
    return level >= this.config.level;
  }

  private isLoggingEnabled(): boolean {
    const isProduction = process.env.NODE_ENV === "production";
    return isProduction
      ? this.config.enabledInProduction
      : this.config.enabledInDevelopment;
  }

  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
  ): void {
    const entry = this.createLogEntry(level, message, context, error);

    if (this.config.formatJson) {
      this.outputJson(entry);
    } else {
      this.outputPretty(entry);
    }
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
  ): LogEntry {
    const sanitizedContext = this.sanitizeContext({
      ...this.persistentContext,
      ...context,
      logger: this.name,
    });

    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: sanitizedContext,
      correlationId: this.correlationId || this.generateCorrelationId(),
      error: error ? this.sanitizeError(error) : undefined,
    };
  }

  private sanitizeContext(context: LogContext): LogContext {
    const sanitized: LogContext = {};

    for (const [key, value] of Object.entries(context)) {
      if (this.isSensitiveKey(key)) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeNestedObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private sanitizeNestedObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) =>
        typeof item === "object" ? this.sanitizeNestedObject(item) : item,
      );
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (this.isSensitiveKey(key)) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeNestedObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private isSensitiveKey(key: string): boolean {
    const lowerKey = key.toLowerCase();
    return this.config.sensitiveKeys.some((sensitiveKey) =>
      lowerKey.includes(sensitiveKey.toLowerCase()),
    );
  }

  private sanitizeError(error: Error): any {
    return {
      name: error.name,
      message: error.message,
      stack: this.config.includeStackTrace ? error.stack : undefined,
    };
  }

  private generateCorrelationId(): string {
    if (!this.correlationId) {
      this.correlationId = uuidv4();
    }
    return this.correlationId;
  }

  private outputJson(entry: LogEntry): void {
    const jsonString = JSON.stringify(entry);

    // Respect max log size
    if (jsonString.length > this.config.maxLogSize) {
      const truncated = {
        ...entry,
        message: entry.message.substring(0, this.config.maxLogSize - 200),
        truncated: true,
      };
      console.log(JSON.stringify(truncated));
    } else {
      console.log(jsonString);
    }
  }

  private outputPretty(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const level = LogLevel[entry.level].padEnd(5);
    const correlationId = entry.correlationId?.substring(0, 8) || "unknown";

    let output = `[${timestamp}] ${level} [${correlationId}]`;

    if (this.name) {
      output += ` [${this.name}]`;
    }

    output += ` ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      output += ` ${JSON.stringify(entry.context)}`;
    }

    const logFunction = this.getConsoleFunction(entry.level);
    logFunction(output);

    if (entry.error && this.config.includeStackTrace) {
      console.error(entry.error.stack);
    }
  }

  private getConsoleFunction(level: LogLevel): Function {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }
}
