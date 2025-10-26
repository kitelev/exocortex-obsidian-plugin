export class LoggingService {
  private static isVerbose = false;

  static setVerbose(verbose: boolean): void {
    this.isVerbose = verbose;
  }

  static debug(message: string, context?: unknown): void {
    if (this.isVerbose) {
      console.debug(`[Exocortex] ${message}`, context ?? '');
    }
  }

  static info(message: string, context?: unknown): void {
    // eslint-disable-next-line no-console
    console.log(`[Exocortex] ${message}`, context ?? '');
  }

  static warn(message: string, context?: unknown): void {
    console.warn(`[Exocortex] ${message}`, context ?? '');
  }

  static error(message: string, error?: Error): void {
    console.error(`[Exocortex ERROR] ${message}`, error ?? '');
    if (error?.stack) {
      console.error(error.stack);
    }
  }
}
