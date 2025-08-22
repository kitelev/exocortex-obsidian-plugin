import {
  ExocortexError,
  ErrorSeverity,
  ErrorCategory,
  FixSuggestion,
  ErrorBuilder,
} from "../../domain/errors/ExocortexError";
import { ErrorAnalyzer } from "../../domain/errors/ErrorAnalyzer";
import { EnhancedResult } from "../../domain/core/EnhancedResult";
import { INotificationService } from "../ports/INotificationService";

export interface ErrorHandlerOptions {
  showUserNotification?: boolean;
  logToConsole?: boolean;
  trackMetrics?: boolean;
  autoRecover?: boolean;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByCategory: Record<ErrorCategory, number>;
  averageResolutionTime: number;
  lastError?: ExocortexError;
}

export class ErrorHandlerService {
  private errorHistory: ExocortexError[] = [];
  private errorMetrics: ErrorMetrics = {
    totalErrors: 0,
    errorsBySeverity: {
      [ErrorSeverity.CRITICAL]: 0,
      [ErrorSeverity.ERROR]: 0,
      [ErrorSeverity.WARNING]: 0,
      [ErrorSeverity.INFO]: 0,
    },
    errorsByCategory: {
      [ErrorCategory.SYNTAX]: 0,
      [ErrorCategory.SEMANTIC]: 0,
      [ErrorCategory.VALIDATION]: 0,
      [ErrorCategory.SYSTEM]: 0,
      [ErrorCategory.NETWORK]: 0,
      [ErrorCategory.PERMISSION]: 0,
    },
    averageResolutionTime: 0,
  };
  private resolutionTimes: number[] = [];
  private maxHistorySize = 100;
  private errorStartTimes = new Map<string, number>();

  constructor(
    private options: ErrorHandlerOptions = {},
    private notificationService?: INotificationService,
  ) {
    this.options = {
      showUserNotification: true,
      logToConsole: true,
      trackMetrics: true,
      autoRecover: false,
      ...options,
    };
  }

  async handleError(
    error: Error | ExocortexError | string,
    context?: Partial<ExocortexError["context"]>,
  ): Promise<EnhancedResult<void>> {
    const startTime = Date.now();

    try {
      let exoError: ExocortexError;

      if (typeof error === "string") {
        exoError = ErrorAnalyzer.analyze(error);
      } else if (error instanceof Error) {
        exoError = ErrorAnalyzer.analyze(error);
      } else {
        exoError = error;
      }

      if (context) {
        exoError = {
          ...exoError,
          context: {
            ...exoError.context,
            ...context,
          },
        };
      }

      this.errorStartTimes.set(exoError.id, startTime);

      if (this.options.trackMetrics) {
        this.updateMetrics(exoError);
      }

      if (this.options.logToConsole) {
        this.logError(exoError);
      }

      if (this.options.showUserNotification) {
        this.showUserNotification(exoError);
      }

      this.addToHistory(exoError);

      if (this.options.autoRecover && exoError.recoverable) {
        await this.attemptRecovery(exoError);
      }

      return EnhancedResult.okEnhanced();
    } catch (handlingError) {
      console.error("Error in error handler:", handlingError);
      return EnhancedResult.failEnhanced(
        ErrorBuilder.create()
          .withTitle("Error Handler Failed")
          .withMessage("Failed to handle the error properly")
          .withSeverity(ErrorSeverity.CRITICAL)
          .withCategory(ErrorCategory.SYSTEM)
          .withContext({
            operation: "Error Handling",
            timestamp: new Date(),
          })
          .withTechnicalDetails(
            handlingError instanceof Error
              ? handlingError.message
              : String(handlingError),
          )
          .build(),
      );
    }
  }

  markErrorResolved(errorId: string): void {
    const startTime = this.errorStartTimes.get(errorId);
    if (startTime) {
      const resolutionTime = Date.now() - startTime;
      this.resolutionTimes.push(resolutionTime);

      if (this.resolutionTimes.length > 100) {
        this.resolutionTimes.shift();
      }

      this.errorMetrics.averageResolutionTime =
        this.resolutionTimes.reduce((a, b) => a + b, 0) /
        this.resolutionTimes.length;

      this.errorStartTimes.delete(errorId);
    }
  }

  private updateMetrics(error: ExocortexError): void {
    this.errorMetrics.totalErrors++;
    this.errorMetrics.errorsBySeverity[error.severity]++;
    this.errorMetrics.errorsByCategory[error.category]++;
    this.errorMetrics.lastError = error;
  }

  private logError(error: ExocortexError): void {
    const logLevel = this.getLogLevel(error.severity);
    const logMessage = this.formatErrorForConsole(error);

    switch (logLevel) {
      case "error":
        console.error(logMessage, error);
        break;
      case "warn":
        console.warn(logMessage, error);
        break;
      case "info":
        console.info(logMessage, error);
        break;
      default:
        console.log(logMessage, error);
    }
  }

  private getLogLevel(
    severity: ErrorSeverity,
  ): "error" | "warn" | "info" | "log" {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.ERROR:
        return "error";
      case ErrorSeverity.WARNING:
        return "warn";
      case ErrorSeverity.INFO:
        return "info";
      default:
        return "log";
    }
  }

  private formatErrorForConsole(error: ExocortexError): string {
    const parts = [
      `[${error.severity.toUpperCase()}]`,
      `[${error.category}]`,
      error.title,
      "-",
      error.message,
    ];

    if (error.context.location) {
      if (
        typeof error.context.location === "object" &&
        "line" in error.context.location
      ) {
        parts.push(
          `(Line ${error.context.location.line}:${error.context.location.column})`,
        );
      }
    }

    return parts.join(" ");
  }

  private showUserNotification(error: ExocortexError): void {
    const duration = this.getNotificationDuration(error.severity);
    const message = this.formatErrorForUser(error);

    this.notificationService?.showError(message, duration);
  }

  private getNotificationDuration(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 10000;
      case ErrorSeverity.ERROR:
        return 7000;
      case ErrorSeverity.WARNING:
        return 5000;
      case ErrorSeverity.INFO:
        return 3000;
      default:
        return 5000;
    }
  }

  private formatErrorForUser(error: ExocortexError): string {
    let message = `${error.title}: ${error.message}`;

    if (error.suggestions && error.suggestions.length > 0) {
      const topSuggestion = error.suggestions[0];
      message += `\n\n💡 ${topSuggestion.title}`;
    }

    return message;
  }

  private addToHistory(error: ExocortexError): void {
    this.errorHistory.unshift(error);

    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.pop();
    }
  }

  private async attemptRecovery(error: ExocortexError): Promise<void> {
    if (!error.suggestions || error.suggestions.length === 0) {
      return;
    }

    const autoFixSuggestion = error.suggestions.find(
      (s) => s.confidence && s.confidence > 0.9 && s.action,
    );

    if (autoFixSuggestion && autoFixSuggestion.action) {
      try {
        await autoFixSuggestion.action.handler();
        this.notificationService?.showSuccess(
          `Auto-recovery: ${autoFixSuggestion.title}`,
          3000,
        );
      } catch (recoveryError) {
        console.error("Auto-recovery failed:", recoveryError);
      }
    }
  }

  getMetrics(): ErrorMetrics {
    return { ...this.errorMetrics };
  }

  getErrorHistory(): ExocortexError[] {
    return [...this.errorHistory];
  }

  clearHistory(): void {
    this.errorHistory = [];
    this.errorStartTimes.clear();
  }

  getSuggestions(error: Error | string): FixSuggestion[] {
    const exoError = ErrorAnalyzer.analyze(error);
    return exoError.suggestions || [];
  }

  analyzeError(error: Error | string): ExocortexError {
    return ErrorAnalyzer.analyze(error);
  }
}
