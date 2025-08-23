import { Platform } from "obsidian";

/**
 * Performance optimizer for mobile devices (iOS/Android).
 * Manages memory, batching, and lazy loading for optimal mobile performance.
 */
export interface MobilePerformanceOptimizerConfig {
  maxMemoryMB?: number;
  maxCacheEntries?: number;
  batchSize?: number;
  debounceMs?: number;
  enableGCHints?: boolean;
  enableLazyLoading?: boolean;
  virtualScrollThreshold?: number;
}

export interface OptimizationConfig {
  enableBatching?: boolean;
  enableCaching?: boolean;
  enableVirtualScrolling?: boolean;
  enableImageOptimization?: boolean;
  enableMemoryManagement?: boolean;
  batchSize?: number;
  cacheSize?: number;
  imageQuality?: number;
  memoryThreshold?: number;
  debounceDelay?: number;
}

export interface PerformanceMetrics {
  batchProcessingEnabled: boolean;
  effectiveBatchSize: number;
  cacheEnabled: boolean;
  effectiveCacheSize: number;
  virtualScrollingEnabled: boolean;
  imageOptimizationEnabled: boolean;
  memoryManagementEnabled: boolean;
  operations: Record<
    string,
    { count: number; totalTime: number; averageTime: number }
  >;
  cacheStats: Record<string, { hits: number; misses: number; size: number }>;
  memoryUsage: { used: number; total: number; percentage: number };
}

export class MobilePerformanceOptimizer {
  private static instance: MobilePerformanceOptimizer;

  // Performance thresholds
  private readonly MOBILE_BATCH_SIZE = 10;
  private readonly DESKTOP_BATCH_SIZE = 50;
  private readonly MOBILE_CACHE_SIZE = 50;
  private readonly DESKTOP_CACHE_SIZE = 200;
  private readonly MOBILE_DEBOUNCE_MS = 500;
  private readonly DESKTOP_DEBOUNCE_MS = 200;

  // Memory management
  private memoryPressureCallbacks: Set<() => void> = new Set();
  private lastMemoryCheck: number = 0;
  private memoryCheckInterval: number = 5000; // 5 seconds

  // Lazy loading state
  private loadingQueue: Map<string, () => Promise<any>> = new Map();
  private isProcessingQueue: boolean = false;

  // Platform detection
  private _isMobile: boolean;
  private _isIOS: boolean;
  private _isAndroid: boolean;
  private _isTablet: boolean;

  private config: MobilePerformanceOptimizerConfig;

  constructor(config?: MobilePerformanceOptimizerConfig) {
    this.config = {
      maxMemoryMB: 100,
      maxCacheEntries: 200,
      batchSize: 50,
      debounceMs: 300,
      enableGCHints: false,
      enableLazyLoading: true,
      virtualScrollThreshold: 100,
      ...config,
    };
    this.detectPlatform();
    this.setupMemoryMonitoring();
  }

  public static getInstance(
    config?: MobilePerformanceOptimizerConfig,
  ): MobilePerformanceOptimizer {
    if (!MobilePerformanceOptimizer.instance) {
      MobilePerformanceOptimizer.instance = new MobilePerformanceOptimizer(
        config,
      );
    }
    return MobilePerformanceOptimizer.instance;
  }

  private detectPlatform(): void {
    // Use Obsidian's Platform API if available
    if (typeof Platform !== "undefined" && Platform) {
      this._isMobile = Platform.isMobile || Platform.isMobileApp;
      this._isIOS = Platform.isIosApp;
      this._isAndroid = Platform.isAndroidApp;
      this._isTablet = Platform.isTablet;
    } else {
      // Fallback values for test environment
      this._isMobile = false;
      this._isIOS = false;
      this._isAndroid = false;
      this._isTablet = false;
    }

    // Fallback detection using user agent if Platform API is unavailable or values are false
    if (!this._isMobile && typeof navigator !== "undefined") {
      const userAgent = navigator.userAgent.toLowerCase();
      this._isMobile = /mobile|android|iphone|ipad|ipod/.test(userAgent);
      this._isIOS = /iphone|ipad|ipod/.test(userAgent);
      this._isAndroid = /android/.test(userAgent);
      this._isTablet = /ipad|tablet/.test(userAgent);
    }
  }

  private setupMemoryMonitoring(): void {
    if (!this.isMobile()) return;

    // Monitor memory pressure on mobile
    if ("requestIdleCallback" in window) {
      const checkMemory = () => {
        window.requestIdleCallback(() => {
          this.checkMemoryPressure();
          setTimeout(checkMemory, this.memoryCheckInterval);
        });
      };
      checkMemory();
    }
  }

  private checkMemoryPressure(): void {
    const now = Date.now();
    if (now - this.lastMemoryCheck < this.memoryCheckInterval) return;

    this.lastMemoryCheck = now;

    // Check if we're under memory pressure
    if (this.isUnderMemoryPressure()) {
      // Notify all registered callbacks
      this.memoryPressureCallbacks.forEach((callback) => {
        try {
          callback();
        } catch (error) {
          console.error("Memory pressure callback error:", error);
        }
      });
    }
  }

  private isUnderMemoryPressure(): boolean {
    // Check performance.memory if available (Chrome/Edge)
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      return usageRatio > 0.8; // 80% memory usage threshold
    }

    // Fallback: assume memory pressure on older devices
    if (this.isMobile()) {
      // Simple heuristic based on device age
      const deviceAge = this.estimateDeviceAge();
      return deviceAge > 3; // Assume pressure on devices older than 3 years
    }

    return false;
  }

  private estimateDeviceAge(): number {
    // Estimate device age based on capabilities
    let age = 0;

    // Check for modern features
    if (!("IntersectionObserver" in window)) age += 2;
    if (!("ResizeObserver" in window)) age += 1;
    if (!("requestIdleCallback" in window)) age += 1;
    if (!("AbortController" in window)) age += 1;

    return age;
  }

  // Public API

  public isMobile(): boolean {
    return this._isMobile;
  }

  public isIOS(): boolean {
    return this._isIOS;
  }

  public isAndroid(): boolean {
    return this._isAndroid;
  }

  public isTablet(): boolean {
    return this._isTablet;
  }

  public getBatchSize(): number {
    if (this.config.batchSize) {
      return this.config.batchSize;
    }
    return this.isMobile() ? this.MOBILE_BATCH_SIZE : this.DESKTOP_BATCH_SIZE;
  }

  public getCacheSize(): number {
    if (this.config.maxCacheEntries) {
      return this.config.maxCacheEntries;
    }
    return this.isMobile() ? this.MOBILE_CACHE_SIZE : this.DESKTOP_CACHE_SIZE;
  }

  public getDebounceMs(): number {
    if (this.config.debounceMs) {
      return this.config.debounceMs;
    }
    return this.isMobile() ? this.MOBILE_DEBOUNCE_MS : this.DESKTOP_DEBOUNCE_MS;
  }

  /**
   * Register a callback to be called when memory pressure is detected
   */
  public onMemoryPressure(callback: () => void): () => void {
    this.memoryPressureCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.memoryPressureCallbacks.delete(callback);
    };
  }

  /**
   * Process data in optimized batches
   */
  public async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options?: {
      onProgress?: (processed: number, total: number) => void;
      priorityItems?: T[];
    },
  ): Promise<R[]> {
    const batchSize = this.getBatchSize();
    const results: R[] = [];

    // Process priority items first if provided
    if (options?.priorityItems) {
      for (const item of options.priorityItems) {
        results.push(await processor(item));
      }
    }

    // Process remaining items in batches
    const regularItems = options?.priorityItems
      ? items.filter((item) => !options.priorityItems!.includes(item))
      : items;

    for (let i = 0; i < regularItems.length; i += batchSize) {
      const batch = regularItems.slice(i, i + batchSize);

      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map((item) => processor(item)),
      );

      results.push(...batchResults);

      // Report progress
      if (options?.onProgress) {
        options.onProgress(results.length, items.length);
      }

      // Yield to UI thread on mobile
      if (this.isMobile() && i + batchSize < regularItems.length) {
        await this.yieldToUI();
      }
    }

    return results;
  }

  /**
   * Lazy load data with queue management
   */
  public async lazyLoad<T>(
    key: string,
    loader: () => Promise<T>,
    options?: {
      priority?: "high" | "normal" | "low";
      cache?: boolean;
    },
  ): Promise<T> {
    // Check if already loading
    if (this.loadingQueue.has(key)) {
      return this.loadingQueue.get(key)!() as Promise<T>;
    }

    // Create loading promise
    const loadPromise = async () => {
      try {
        const result = await loader();

        // Remove from queue when done
        this.loadingQueue.delete(key);

        return result;
      } catch (error) {
        this.loadingQueue.delete(key);
        throw error;
      }
    };

    // Add to queue
    this.loadingQueue.set(key, loadPromise);

    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processLoadingQueue();
    }

    return loadPromise();
  }

  private async processLoadingQueue(): Promise<void> {
    if (this.isProcessingQueue || this.loadingQueue.size === 0) return;

    this.isProcessingQueue = true;

    while (this.loadingQueue.size > 0) {
      // Get next item from queue
      const [key, loader] = this.loadingQueue.entries().next().value;

      try {
        await loader();
      } catch (error) {
        console.error(`Failed to lazy load ${key}:`, error);
      }

      // Yield to UI thread
      await this.yieldToUI();
    }

    this.isProcessingQueue = false;
  }

  /**
   * Yield control back to the UI thread
   */
  public async yieldToUI(): Promise<void> {
    return new Promise((resolve) => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(() => resolve());
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  /**
   * Debounce function optimized for platform
   */
  public debounce<T extends (...args: any[]) => any>(
    func: T,
    wait?: number,
  ): (...args: Parameters<T>) => void {
    const delay = wait ?? this.getDebounceMs();
    let timeoutId: ReturnType<typeof setTimeout>;

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  /**
   * Throttle function optimized for platform
   */
  public throttle<T extends (...args: any[]) => any>(
    func: T,
    wait?: number,
  ): (...args: Parameters<T>) => void {
    const delay = wait ?? this.getDebounceMs();
    let lastCall = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCall;

      if (timeSinceLastCall >= delay) {
        lastCall = now;
        func(...args);
      } else if (!timeoutId) {
        timeoutId = setTimeout(() => {
          lastCall = Date.now();
          timeoutId = null;
          func(...args);
        }, delay - timeSinceLastCall);
      }
    };
  }

  /**
   * Create an LRU cache optimized for platform
   */
  public createCache<K, V>(options?: {
    maxSize?: number;
    ttl?: number;
  }): Map<K, V> {
    const maxSize = options?.maxSize ?? this.getCacheSize();

    // Use a simple Map with size limit for mobile
    const cache = new Map<K, V>();

    // Override set method to enforce size limit
    const originalSet = cache.set.bind(cache);
    cache.set = (key: K, value: V) => {
      // Remove oldest entry if at capacity
      if (cache.size >= maxSize && !cache.has(key)) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }

      return originalSet(key, value);
    };

    return cache;
  }

  /**
   * Optimize image loading for mobile
   */
  public getOptimalImageSize(): { width: number; height: number } {
    if (this.isMobile()) {
      // Get device pixel ratio
      const dpr = window.devicePixelRatio || 1;

      // Get viewport size
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate optimal size based on viewport and DPR
      return {
        width: Math.min(viewportWidth * dpr, 1024),
        height: Math.min(viewportHeight * dpr, 1024),
      };
    }

    // Desktop can handle larger images
    return {
      width: 2048,
      height: 2048,
    };
  }

  /**
   * Check if a feature should be enabled based on performance
   */
  public shouldEnableFeature(
    feature: "animations" | "shadows" | "3d" | "transitions",
  ): boolean {
    if (!this.isMobile()) return true;

    // Disable heavy features on mobile
    switch (feature) {
      case "animations":
        return !this.isUnderMemoryPressure();
      case "shadows":
        return false; // Always disable shadows on mobile
      case "3d":
        return this.isTablet(); // Only on tablets
      case "transitions":
        return !this.isUnderMemoryPressure();
      default:
        return true;
    }
  }

  // Performance tracking
  private operations: Map<string, { count: number; totalTime: number }> =
    new Map();
  private caches: Map<string, Map<any, any>> = new Map();
  private cacheStats: Map<string, { hits: number; misses: number }> = new Map();
  private pendingCallbacks: Set<number> = new Set();

  /**
   * Clear all managed caches
   */
  public clearAllCaches(): void {
    this.caches.forEach((cache) => cache.clear());
    this.cacheStats.forEach((stats) => {
      stats.hits = 0;
      stats.misses = 0;
    });
  }

  /**
   * Get cache statistics for all caches
   */
  public getCacheStats(): Record<
    string,
    { hits: number; misses: number; size: number }
  > {
    const stats: Record<
      string,
      { hits: number; misses: number; size: number }
    > = {};

    this.cacheStats.forEach((stat, name) => {
      const cache = this.caches.get(name);
      stats[name] = {
        ...stat,
        size: cache?.size || 0,
      };
    });

    return stats;
  }

  /**
   * Track operation timing
   */
  public trackOperation<T>(name: string, operation: () => T): T {
    const start = performance.now();
    const result = operation();
    const duration = performance.now() - start;

    const existing = this.operations.get(name) || { count: 0, totalTime: 0 };
    this.operations.set(name, {
      count: existing.count + 1,
      totalTime: existing.totalTime + duration,
    });

    return result;
  }

  /**
   * Create virtual scroll container
   */
  public createVirtualScroll<T>(
    container: HTMLElement,
    items: T[],
    renderItem: (item: T) => HTMLElement,
    options?: {
      itemHeight?: number;
      containerHeight?: number;
      overscan?: number;
    },
  ): { destroy: () => void } {
    const itemHeight = options?.itemHeight || 50;
    const containerHeight = options?.containerHeight || 400;
    const overscan = options?.overscan || 5;

    container.style.height = `${containerHeight}px`;
    container.style.overflow = "auto";

    let startIndex = 0;
    let endIndex = Math.min(
      items.length,
      Math.ceil(containerHeight / itemHeight) + overscan,
    );

    const render = () => {
      container.innerHTML = "";
      for (let i = startIndex; i < endIndex; i++) {
        if (items[i]) {
          const element = renderItem(items[i]);
          container.appendChild(element);
        }
      }
    };

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      endIndex = Math.min(
        items.length,
        startIndex + Math.ceil(containerHeight / itemHeight) + 2 * overscan,
      );
      render();
    };

    container.addEventListener("scroll", handleScroll);
    render();

    return {
      destroy: () => {
        container.removeEventListener("scroll", handleScroll);
        container.innerHTML = "";
      },
    };
  }

  /**
   * Optimize image file
   */
  public async optimizeImage(
    file: File,
    options?: { maxWidth?: number; maxHeight?: number; quality?: number },
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = document.createElement("img");

      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }

      img.onload = () => {
        const maxWidth = options?.maxWidth || 1024;
        const maxHeight = options?.maxHeight || 1024;
        const quality =
          options?.quality || (this.config as any).imageQuality || 0.8;

        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Schedule memory cleanup during idle time
   */
  public scheduleMemoryCleanup(callback: () => void): void {
    const scheduleCallback = (global as any).requestIdleCallback || setTimeout;
    const callbackId = scheduleCallback(callback, { timeout: 5000 });
    this.pendingCallbacks.add(callbackId);
  }

  /**
   * Force garbage collection if available
   */
  public forceGarbageCollection(): void {
    if ((global as any).gc) {
      (global as any).gc();
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get comprehensive performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    const operationMetrics: Record<
      string,
      { count: number; totalTime: number; averageTime: number }
    > = {};

    this.operations.forEach((data, name) => {
      operationMetrics[name] = {
        ...data,
        averageTime: data.totalTime / data.count,
      };
    });

    return {
      batchProcessingEnabled: true,
      effectiveBatchSize: this.getBatchSize(),
      cacheEnabled: true,
      effectiveCacheSize: this.getCacheSize(),
      virtualScrollingEnabled: this.config.enableLazyLoading || false,
      imageOptimizationEnabled: true,
      memoryManagementEnabled: this.isMobile(),
      operations: operationMetrics,
      cacheStats: this.getCacheStats(),
      memoryUsage: this.getMemoryUsage(),
    };
  }

  /**
   * Get current memory usage statistics
   */
  public getMemoryUsage(): { used: number; total: number; percentage: number } {
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize || 0,
        total: memory.totalJSHeapSize || 0,
        percentage: memory.totalJSHeapSize
          ? Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
          : 0,
      };
    }

    return { used: 0, total: 0, percentage: 0 };
  }

  /**
   * Clean up resources (alias for destroy for test compatibility)
   */
  public cleanup(): void {
    this.destroy();
  }

  /**
   * Clean up resources and stop monitoring
   */
  public destroy(): void {
    // Clear all callbacks
    this.memoryPressureCallbacks.clear();

    // Clear loading queue
    this.loadingQueue.clear();
    this.isProcessingQueue = false;

    // Cancel pending callbacks
    this.pendingCallbacks.forEach((id) => {
      const cancelCallback = (global as any).cancelIdleCallback || clearTimeout;
      cancelCallback(id);
    });
    this.pendingCallbacks.clear();

    // Clear caches
    this.clearAllCaches();

    // Clear operation tracking
    this.operations.clear();

    // Clear static instance if this is the singleton
    if (MobilePerformanceOptimizer.instance === this) {
      MobilePerformanceOptimizer.instance = null as any;
    }
  }

  /**
   * Register out-of-memory handler
   */
  onOutOfMemory(handler: () => void): void {
    this.oomHandler = handler;
  }

  private oomHandler?: () => void;

  /**
   * Get loading strategy based on connection and device capabilities
   */
  async getLoadingStrategy(): Promise<{
    isSuccess: boolean;
    getValue: () => any;
  }> {
    try {
      const strategy = {
        batchSize: Platform.isMobile
          ? this.MOBILE_BATCH_SIZE
          : this.DESKTOP_BATCH_SIZE,
        useVirtualScrolling: Platform.isMobile,
        enableImageOptimization: Platform.isMobile,
        enableBackgroundLoading: !Platform.isMobile,
        adaptiveLoading: Platform.isMobile,
      };

      return {
        isSuccess: true,
        getValue: () => strategy,
      };
    } catch (error) {
      return {
        isSuccess: false,
        getValue: () => null,
      };
    }
  }

  /**
   * Handle offline mode scenarios
   */
  async handleOfflineMode(): Promise<{
    isSuccess: boolean;
    getValue: () => any;
  }> {
    try {
      const offlineStrategy = {
        enableCaching: true,
        cacheSize: Platform.isMobile
          ? this.MOBILE_CACHE_SIZE
          : this.DESKTOP_CACHE_SIZE,
        enableOfflineStorage: true,
        enableQueuedOperations: true,
        enableDegradedMode: true,
      };

      return {
        isSuccess: true,
        getValue: () => offlineStrategy,
      };
    } catch (error) {
      return {
        isSuccess: false,
        getValue: () => null,
      };
    }
  }
}
