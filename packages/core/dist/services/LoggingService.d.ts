export declare class LoggingService {
  private static isVerbose;
  static setVerbose(verbose: boolean): void;
  static debug(message: string, context?: unknown): void;
  static info(message: string, context?: unknown): void;
  static warn(message: string, context?: unknown): void;
  static error(message: string, error?: Error): void;
}
//# sourceMappingURL=LoggingService.d.ts.map
