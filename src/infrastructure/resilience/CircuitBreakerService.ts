export class CircuitBreakerService {
  private static instance: CircuitBreakerService;
  private failures: Map<string, number> = new Map();
  private lastFailureTime: Map<string, number> = new Map();
  private circuitOpen: Map<string, boolean> = new Map();

  private readonly threshold: number = 5;
  private readonly timeout: number = 60000; // 1 minute

  constructor() {}

  static getInstance(): CircuitBreakerService {
    if (!CircuitBreakerService.instance) {
      CircuitBreakerService.instance = new CircuitBreakerService();
    }
    return CircuitBreakerService.instance;
  }

  async execute<T>(key: string, operation: () => Promise<T>): Promise<T> {
    if (this.isOpen(key)) {
      throw new Error(`Circuit breaker is open for ${key}`);
    }

    try {
      const result = await operation();
      this.onSuccess(key);
      return result;
    } catch (error) {
      this.onFailure(key);
      throw error;
    }
  }

  private isOpen(key: string): boolean {
    if (!this.circuitOpen.get(key)) {
      return false;
    }

    const lastFailure = this.lastFailureTime.get(key) || 0;
    const now = Date.now();

    if (now - lastFailure > this.timeout) {
      this.reset(key);
      return false;
    }

    return true;
  }

  private onSuccess(key: string): void {
    this.failures.delete(key);
    this.circuitOpen.set(key, false);
  }

  private onFailure(key: string): void {
    const count = (this.failures.get(key) || 0) + 1;
    this.failures.set(key, count);
    this.lastFailureTime.set(key, Date.now());

    if (count >= this.threshold) {
      this.circuitOpen.set(key, true);
    }
  }

  private reset(key: string): void {
    this.failures.delete(key);
    this.lastFailureTime.delete(key);
    this.circuitOpen.set(key, false);
  }

  getStatus(key: string): { isOpen: boolean; failures: number } {
    return {
      isOpen: this.circuitOpen.get(key) || false,
      failures: this.failures.get(key) || 0,
    };
  }
}
