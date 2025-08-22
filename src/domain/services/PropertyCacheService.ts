export class PropertyCacheService {
  private static instance: PropertyCacheService;
  private cache: Map<string, any> = new Map();

  constructor() {}

  static getInstance(): PropertyCacheService {
    if (!PropertyCacheService.instance) {
      PropertyCacheService.instance = new PropertyCacheService();
    }
    return PropertyCacheService.instance;
  }

  get(key: string): any {
    return this.cache.get(key);
  }

  set(key: string, value: any): void {
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  invalidate(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  getSize(): number {
    return this.cache.size;
  }
}