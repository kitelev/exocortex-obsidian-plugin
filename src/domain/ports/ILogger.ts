export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  correlationId?: string;
  error?: Error;
}

export interface ILogger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext, error?: Error): void;

  startTiming(label: string): void;
  endTiming(label: string, context?: LogContext): void;

  setCorrelationId(id: string): void;
  getCorrelationId(): string | undefined;

  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;

  createChildLogger(context: LogContext): ILogger;
}
