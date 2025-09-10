export class ErrorBoundary {
  static wrap<T>(fn: () => T, fallback: T, onError?: (e: unknown) => void): T {
    try {
      return fn();
    } catch (e) {
      try {
        onError?.(e);
      } catch (_) {
        // ignore secondary errors
      }
      return fallback;
    }
  }

  static async wrapAsync<T>(
    fn: () => Promise<T>,
    fallback: T,
    onError?: (e: unknown) => void,
  ): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      try {
        onError?.(e);
      } catch (_) {
        // ignore secondary errors
      }
      return fallback;
    }
  }
}
