/**
 * TimerManager - Centralized lifecycle management for setTimeout/setInterval
 *
 * Provides cancellable timer operations with automatic cleanup on plugin unload.
 * Uses AbortController pattern for async operations.
 *
 * @example
 * ```typescript
 * const timerManager = new TimerManager();
 *
 * // Set a timeout that can be cancelled
 * const timeoutId = timerManager.setTimeout(() => console.log('done'), 1000);
 *
 * // Cancel specific timeout
 * timerManager.clearTimeout(timeoutId);
 *
 * // Cancellable polling with AbortController
 * const controller = new AbortController();
 * await timerManager.pollUntil(
 *   () => someCondition(),
 *   { signal: controller.signal, interval: 100, maxAttempts: 20 }
 * );
 *
 * // Clear all timers on plugin unload
 * timerManager.dispose();
 * ```
 */
export class TimerManager {
  private timeoutIds: Set<ReturnType<typeof setTimeout>> = new Set();
  private intervalIds: Set<ReturnType<typeof setInterval>> = new Set();
  private disposed = false;

  /**
   * Creates a cancellable timeout that is automatically tracked.
   * @param callback Function to execute after delay
   * @param delay Delay in milliseconds
   * @returns Timeout ID for manual cancellation
   */
  setTimeout(callback: () => void, delay: number): ReturnType<typeof setTimeout> {
    if (this.disposed) {
      throw new Error("TimerManager has been disposed");
    }

    const id = setTimeout(() => {
      this.timeoutIds.delete(id);
      callback();
    }, delay);

    this.timeoutIds.add(id);
    return id;
  }

  /**
   * Clears a specific timeout created by this manager.
   * @param id Timeout ID returned from setTimeout
   */
  clearTimeout(id: ReturnType<typeof setTimeout>): void {
    clearTimeout(id);
    this.timeoutIds.delete(id);
  }

  /**
   * Creates a cancellable interval that is automatically tracked.
   * @param callback Function to execute at each interval
   * @param delay Interval in milliseconds
   * @returns Interval ID for manual cancellation
   */
  setInterval(callback: () => void, delay: number): ReturnType<typeof setInterval> {
    if (this.disposed) {
      throw new Error("TimerManager has been disposed");
    }

    const id = setInterval(callback, delay);
    this.intervalIds.add(id);
    return id;
  }

  /**
   * Clears a specific interval created by this manager.
   * @param id Interval ID returned from setInterval
   */
  clearInterval(id: ReturnType<typeof setInterval>): void {
    clearInterval(id);
    this.intervalIds.delete(id);
  }

  /**
   * Creates a delay that can be aborted via AbortSignal.
   * @param ms Delay in milliseconds
   * @param options Options including AbortSignal
   * @throws AbortError if signal is aborted during delay
   */
  async delay(ms: number, options?: { signal?: AbortSignal }): Promise<void> {
    if (this.disposed) {
      throw new Error("TimerManager has been disposed");
    }

    return new Promise((resolve, reject) => {
      if (options?.signal?.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }

      const timeoutId = this.setTimeout(resolve, ms);

      options?.signal?.addEventListener("abort", () => {
        this.clearTimeout(timeoutId);
        reject(new DOMException("Aborted", "AbortError"));
      }, { once: true });
    });
  }

  /**
   * Polls a condition until it returns true or max attempts reached.
   * Supports cancellation via AbortSignal.
   *
   * @param condition Function that returns true when polling should stop
   * @param options Polling options
   * @returns true if condition was met, false if max attempts reached
   * @throws AbortError if signal is aborted during polling
   */
  async pollUntil(
    condition: () => boolean | Promise<boolean>,
    options: {
      signal?: AbortSignal;
      interval?: number;
      maxAttempts?: number;
    } = {}
  ): Promise<boolean> {
    const { signal, interval = 100, maxAttempts = 20 } = options;

    if (this.disposed) {
      throw new Error("TimerManager has been disposed");
    }

    for (let i = 0; i < maxAttempts; i++) {
      // Check abort before each iteration
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      const result = await Promise.resolve(condition());
      if (result) {
        return true;
      }

      // Don't delay after the last attempt
      if (i < maxAttempts - 1) {
        await this.delay(interval, { signal });
      }
    }

    return false;
  }

  /**
   * Clears all tracked timers and intervals.
   * Should be called in plugin's onunload().
   */
  dispose(): void {
    this.disposed = true;

    for (const id of this.timeoutIds) {
      clearTimeout(id);
    }
    this.timeoutIds.clear();

    for (const id of this.intervalIds) {
      clearInterval(id);
    }
    this.intervalIds.clear();
  }

  /**
   * Returns the count of active timers (for testing/debugging).
   */
  get activeTimerCount(): number {
    return this.timeoutIds.size + this.intervalIds.size;
  }

  /**
   * Returns whether the manager has been disposed.
   */
  get isDisposed(): boolean {
    return this.disposed;
  }
}

/**
 * Singleton instance for plugin-wide timer management.
 * Must be initialized with init() and disposed with dispose().
 */
let globalTimerManager: TimerManager | null = null;

/**
 * Gets the global TimerManager instance.
 * @throws Error if not initialized
 */
export function getTimerManager(): TimerManager {
  if (!globalTimerManager) {
    throw new Error("TimerManager not initialized. Call initTimerManager() first.");
  }
  return globalTimerManager;
}

/**
 * Initializes the global TimerManager.
 * Should be called in plugin's onload().
 */
export function initTimerManager(): TimerManager {
  if (globalTimerManager && !globalTimerManager.isDisposed) {
    // Return existing instance if not disposed
    return globalTimerManager;
  }
  globalTimerManager = new TimerManager();
  return globalTimerManager;
}

/**
 * Disposes the global TimerManager.
 * Should be called in plugin's onunload().
 */
export function disposeTimerManager(): void {
  if (globalTimerManager) {
    globalTimerManager.dispose();
    globalTimerManager = null;
  }
}
