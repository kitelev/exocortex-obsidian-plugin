export enum ErrorSeverity {
  CRITICAL = 'critical',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export enum ErrorCategory {
  SYNTAX = 'syntax',
  SEMANTIC = 'semantic',
  VALIDATION = 'validation',
  SYSTEM = 'system',
  NETWORK = 'network',
  PERMISSION = 'permission'
}

export interface ErrorLocation {
  line?: number;
  column?: number;
  file?: string;
  context?: string;
}

export interface ErrorContext {
  operation: string;
  timestamp: Date;
  location?: ErrorLocation | string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface FixSuggestion {
  title: string;
  description: string;
  confidence?: number;
  action?: {
    label: string;
    handler: () => void | Promise<void>;
  };
  learnMore?: {
    url: string;
    title: string;
  };
}

export interface ExocortexError {
  id: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  title: string;
  message: string;
  context: ErrorContext;
  technicalDetails?: string;
  suggestions?: FixSuggestion[];
  recoverable?: boolean;
  stackTrace?: string;
  innerError?: ExocortexError;
}

export class ErrorBuilder {
  private error: Partial<ExocortexError> = {};

  static create(): ErrorBuilder {
    return new ErrorBuilder();
  }

  withId(id: string): ErrorBuilder {
    this.error.id = id;
    return this;
  }

  withSeverity(severity: ErrorSeverity): ErrorBuilder {
    this.error.severity = severity;
    return this;
  }

  withCategory(category: ErrorCategory): ErrorBuilder {
    this.error.category = category;
    return this;
  }

  withTitle(title: string): ErrorBuilder {
    this.error.title = title;
    return this;
  }

  withMessage(message: string): ErrorBuilder {
    this.error.message = message;
    return this;
  }

  withContext(context: ErrorContext): ErrorBuilder {
    this.error.context = context;
    return this;
  }

  withLocation(location: ErrorLocation): ErrorBuilder {
    if (!this.error.context) {
      this.error.context = {
        operation: 'Unknown',
        timestamp: new Date()
      };
    }
    this.error.context.location = location;
    return this;
  }

  withTechnicalDetails(details: string): ErrorBuilder {
    this.error.technicalDetails = details;
    return this;
  }

  withSuggestions(suggestions: FixSuggestion[]): ErrorBuilder {
    this.error.suggestions = suggestions;
    return this;
  }

  withRecoverable(recoverable: boolean): ErrorBuilder {
    this.error.recoverable = recoverable;
    return this;
  }

  withStackTrace(stackTrace: string): ErrorBuilder {
    this.error.stackTrace = stackTrace;
    return this;
  }

  withInnerError(innerError: ExocortexError): ErrorBuilder {
    this.error.innerError = innerError;
    return this;
  }

  build(): ExocortexError {
    if (!this.error.id) {
      this.error.id = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    if (!this.error.severity) {
      this.error.severity = ErrorSeverity.ERROR;
    }
    if (!this.error.category) {
      this.error.category = ErrorCategory.SYSTEM;
    }
    if (!this.error.title) {
      this.error.title = 'Error';
    }
    if (!this.error.message) {
      this.error.message = 'An error occurred';
    }
    if (!this.error.context) {
      this.error.context = {
        operation: 'Unknown',
        timestamp: new Date()
      };
    }

    return this.error as ExocortexError;
  }
}