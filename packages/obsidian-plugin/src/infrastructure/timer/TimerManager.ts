/**
 * TimerManager - Centralized lifecycle management for setTimeout/setInterval
 *
 * Provides:
 * - Automatic cleanup of all timers on dispose()
 * - AbortController integration for cancellable delays
 * - Named timers for better debugging
 * - Memory leak prevention by tracking all active timers
 *
 * Usage:
 * ```typescript
 * // In plugin constructor
 * this.timerManager = new TimerManager();
 *
 * // Create managed timers
 * this.timerManager.setTimeout("auto-layout", () => this.render(), 150);
 * this.timerManager.setInterval("polling", () => this.poll(), 1000);
 *
 * // Cancellable delay with AbortController
 * const controller = new AbortController();
 * await this.timerManager.delay(100, controller.signal);
 *
 * // In onunload()
 * this.timerManager.dispose();
 * ```
 */
export class TimerManager {
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private anonymousTimeouts: Set<NodeJS.Timeout> = new Set();
  private anonymousIntervals: Set<NodeJS.Timeout> = new Set();
  private isDisposed = false;

  /**
   * Creates a managed setTimeout with automatic cleanup tracking.
   *
   * @param name - Unique identifier for debugging (optional - use for named timers)
   * @param callback - Function to execute after delay
   * @param delayMs - Delay in milliseconds
   * @returns Timer ID or null if manager is disposed
   */
  setTimeout(name: string | null, callback: () => void, delayMs: number): NodeJS.Timeout | null {
    if (this.isDisposed) {
      return null;
    }

    const timerId = setTimeout(() => {
      if (name) {
        this.timeouts.delete(name);
      } else {
        this.anonymousTimeouts.delete(timerId);
      }

      if (!this.isDisposed) {
        callback();
      }
    }, delayMs);

    if (name) {
      // Clear existing timer with same name (like debouncing)
      const existing = this.timeouts.get(name);
      if (existing) {
        clearTimeout(existing);
      }
      this.timeouts.set(name, timerId);
    } else {
      this.anonymousTimeouts.add(timerId);
    }

    return timerId;
  }

  /**
   * Creates a managed setInterval with automatic cleanup tracking.
   *
   * @param name - Unique identifier for the interval (required for intervals)
   * @param callback - Function to execute repeatedly
   * @param intervalMs - Interval in milliseconds
   * @returns Timer ID or null if manager is disposed
   */
  setInterval(name: string, callback: () => void, intervalMs: number): NodeJS.Timeout | null {
    if (this.isDisposed) {
      return null;
    }

    // Clear existing interval with same name
    this.clearInterval(name);

    const timerId = setInterval(() => {
      if (!this.isDisposed) {
        callback();
      }
    }, intervalMs);

    this.intervals.set(name, timerId);
    return timerId;
  }

  /**
   * Clears a named timeout.
   *
   * @param name - Timer identifier
   */
  clearTimeout(name: string): void {
    const timerId = this.timeouts.get(name);
    if (timerId) {
      clearTimeout(timerId);
      this.timeouts.delete(name);
    }
  }

  /**
   * Clears a named interval.
   *
   * @param name - Interval identifier
   */
  clearInterval(name: string): void {
    const timerId = this.intervals.get(name);
    if (timerId) {
      clearInterval(timerId);
      this.intervals.delete(name);
    }
  }

  /**
   * Creates a Promise-based delay that can be cancelled via AbortSignal.
   *
   * @param delayMs - Delay in milliseconds
   * @param signal - Optional AbortSignal for cancellation
   * @returns Promise that resolves after delay or rejects if aborted
   *
   * @example
   * // With AbortController
   * const controller = new AbortController();
   * try {
   *   await timerManager.delay(100, controller.signal);
   *   // This runs after 100ms if not aborted
   * } catch (error) {
   *   if (error.name === "AbortError") {
   *     // Delay was cancelled
   *   }
   * }
   */
  delay(delayMs: number, signal?: AbortSignal): Promise<void> {
    if (this.isDisposed) {
      return Promise.reject(new DOMException("TimerManager disposed", "AbortError"));
    }

    return new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        reject(new DOMException("Delay aborted", "AbortError"));
        return;
      }

      const timerId = setTimeout(() => {
        this.anonymousTimeouts.delete(timerId);
        resolve();
      }, delayMs);

      this.anonymousTimeouts.add(timerId);

      if (signal) {
        const abortHandler = () => {
          clearTimeout(timerId);
          this.anonymousTimeouts.delete(timerId);
          reject(new DOMException("Delay aborted", "AbortError"));
        };

        signal.addEventListener("abort", abortHandler, { once: true });

        // Clean up abort listener when timer completes
        const originalCallback = () => {
          signal.removeEventListener("abort", abortHandler);
        };

        // Override resolve to include cleanup
        const originalResolve = resolve;
        resolve = () => {
          originalCallback();
          originalResolve();
        };
      }
    });
  }

  /**
   * Checks if a named timeout is currently active.
   */
  hasTimeout(name: string): boolean {
    return this.timeouts.has(name);
  }

  /**
   * Checks if a named interval is currently active.
   */
  hasInterval(name: string): boolean {
    return this.intervals.has(name);
  }

  /**
   * Returns the count of all active timers (for debugging/testing).
   */
  getActiveTimerCount(): number {
    return (
      this.timeouts.size +
      this.intervals.size +
      this.anonymousTimeouts.size +
      this.anonymousIntervals.size
    );
  }

  /**
   * Clears all timers and marks the manager as disposed.
   * Should be called in plugin's onunload() method.
   */
  dispose(): void {
    this.isDisposed = true;

    // Clear all named timeouts
    for (const timerId of this.timeouts.values()) {
      clearTimeout(timerId);
    }
    this.timeouts.clear();

    // Clear all named intervals
    for (const timerId of this.intervals.values()) {
      clearInterval(timerId);
    }
    this.intervals.clear();

    // Clear all anonymous timeouts
    for (const timerId of this.anonymousTimeouts) {
      clearTimeout(timerId);
    }
    this.anonymousTimeouts.clear();

    // Clear all anonymous intervals
    for (const timerId of this.anonymousIntervals) {
      clearInterval(timerId);
    }
    this.anonymousIntervals.clear();
  }

  /**
   * Checks if the manager has been disposed.
   */
  get disposed(): boolean {
    return this.isDisposed;
  }
}

/**
 * Creates an AbortController that automatically aborts after a timeout.
 * Useful for timing out operations that should have a maximum duration.
 *
 * @param timeoutMs - Timeout in milliseconds
 * @returns AbortController that will abort after timeout
 */
export function createTimeoutAbortController(timeoutMs: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
}
