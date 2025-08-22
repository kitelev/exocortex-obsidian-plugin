import { Result } from "./Result";
import {
  ExocortexError,
  ErrorBuilder,
  ErrorSeverity,
  ErrorCategory,
} from "../errors/ExocortexError";

export class EnhancedResult<T> {
  private _result: Result<T>;
  private _errorDetails?: ExocortexError;

  private constructor(result: Result<T>, errorDetails?: ExocortexError) {
    this._result = result;
    this._errorDetails = errorDetails;
  }

  get isSuccess(): boolean {
    return this._result.isSuccess;
  }

  get isFailure(): boolean {
    return this._result.isFailure;
  }

  get error(): string {
    return this._result.error;
  }

  public getValue(): T {
    return this._result.getValue();
  }

  public errorValue(): string {
    return this._result.errorValue();
  }

  public getErrorDetails(): ExocortexError | undefined {
    return this._errorDetails;
  }

  public static okEnhanced<U>(value?: U): EnhancedResult<U> {
    const result = Result.ok<U>(value);
    return new EnhancedResult(result);
  }

  public static failEnhanced<U>(
    error: string | ExocortexError,
  ): EnhancedResult<U> {
    let errorMessage: string;
    let errorDetails: ExocortexError | undefined;

    if (typeof error === "string") {
      errorMessage = error;
      errorDetails = ErrorBuilder.create()
        .withTitle("Operation Failed")
        .withMessage(error)
        .withSeverity(ErrorSeverity.ERROR)
        .withCategory(ErrorCategory.SYSTEM)
        .withContext({
          operation: "Unknown",
          timestamp: new Date(),
        })
        .build();
    } else {
      errorMessage = error.message;
      errorDetails = error;
    }

    const result = Result.fail<U>(errorMessage);
    return new EnhancedResult(result, errorDetails);
  }

  public mapError(
    fn: (error: ExocortexError) => ExocortexError,
  ): EnhancedResult<T> {
    if (this.isSuccess) {
      return this;
    }

    const currentError =
      this._errorDetails ||
      ErrorBuilder.create()
        .withMessage(this.error)
        .withSeverity(ErrorSeverity.ERROR)
        .withCategory(ErrorCategory.SYSTEM)
        .withContext({
          operation: "Unknown",
          timestamp: new Date(),
        })
        .build();

    const mappedError = fn(currentError);
    return EnhancedResult.failEnhanced<T>(mappedError);
  }

  public chain<U>(fn: (value: T) => EnhancedResult<U>): EnhancedResult<U> {
    if (this.isFailure) {
      return EnhancedResult.failEnhanced<U>(this._errorDetails || this.error);
    }
    return fn(this.getValue());
  }

  public static combineEnhanced(
    results: EnhancedResult<any>[],
  ): EnhancedResult<any> {
    const errors: ExocortexError[] = [];

    for (const result of results) {
      if (result.isFailure) {
        const errorDetails = result.getErrorDetails();
        if (errorDetails) {
          errors.push(errorDetails);
        }
      }
    }

    if (errors.length > 0) {
      const combinedError = ErrorBuilder.create()
        .withTitle("Multiple Errors Occurred")
        .withMessage(`${errors.length} error(s) occurred during operation`)
        .withSeverity(ErrorSeverity.ERROR)
        .withCategory(ErrorCategory.SYSTEM)
        .withContext({
          operation: "Combined Operation",
          timestamp: new Date(),
          metadata: {
            errorCount: errors.length,
            errors: errors.map((e) => ({ id: e.id, title: e.title })),
          },
        })
        .withInnerError(errors[0])
        .build();

      return EnhancedResult.failEnhanced(combinedError);
    }

    return EnhancedResult.okEnhanced();
  }

  public withContext(
    context: Partial<ExocortexError["context"]>,
  ): EnhancedResult<T> {
    if (this.isSuccess) {
      return this;
    }

    const currentError = this._errorDetails;
    if (!currentError) {
      return this;
    }

    const updatedError = {
      ...currentError,
      context: {
        ...currentError.context,
        ...context,
      },
    };

    return EnhancedResult.failEnhanced<T>(updatedError);
  }
}
