import { LogLevel } from "./ILogger";

export interface LoggerConfig {
  level: LogLevel;
  enabledInProduction: boolean;
  enabledInDevelopment: boolean;
  formatJson: boolean;
  includeStackTrace: boolean;
  maxLogSize: number;
  performanceThreshold: number; // ms
  sensitiveKeys: string[];
}

export class LoggerConfigFactory {
  static createDefault(): LoggerConfig {
    return {
      level: this.getEnvironmentLogLevel(),
      enabledInProduction: false,
      enabledInDevelopment: true,
      formatJson: this.isProduction(),
      includeStackTrace: !this.isProduction(),
      maxLogSize: 1000000, // 1MB
      performanceThreshold: 100, // 100ms
      sensitiveKeys: [
        "password",
        "token",
        "secret",
        "key",
        "auth",
        "credential",
        "private",
        "sensitive",
      ],
    };
  }

  private static getEnvironmentLogLevel(): LogLevel {
    if (this.isProduction()) {
      return LogLevel.ERROR;
    }
    if (this.isTesting()) {
      return LogLevel.WARN;
    }
    return LogLevel.DEBUG;
  }

  private static isProduction(): boolean {
    return process.env.NODE_ENV === "production";
  }

  private static isTesting(): boolean {
    return (
      process.env.NODE_ENV === "test" || (global as any).jest !== undefined
    );
  }
}
