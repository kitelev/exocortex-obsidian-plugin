import { Platform } from 'obsidian';

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
            ...config
        };
        this.detectPlatform();
        this.setupMemoryMonitoring();
    }
    
    public static getInstance(config?: MobilePerformanceOptimizerConfig): MobilePerformanceOptimizer {
        if (!MobilePerformanceOptimizer.instance) {
            MobilePerformanceOptimizer.instance = new MobilePerformanceOptimizer(config);
        }
        return MobilePerformanceOptimizer.instance;
    }
    
    private detectPlatform(): void {
        // Use Obsidian's Platform API if available
        if (typeof Platform !== 'undefined' && Platform) {
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
        if (!this._isMobile && typeof navigator !== 'undefined') {
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
        if ('requestIdleCallback' in window) {
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
            this.memoryPressureCallbacks.forEach(callback => {
                try {
                    callback();
                } catch (error) {
                    console.error('Memory pressure callback error:', error);
                }
            });
        }
    }
    
    private isUnderMemoryPressure(): boolean {
        // Check performance.memory if available (Chrome/Edge)
        if ('memory' in performance) {
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
        if (!('IntersectionObserver' in window)) age += 2;
        if (!('ResizeObserver' in window)) age += 1;
        if (!('requestIdleCallback' in window)) age += 1;
        if (!('AbortController' in window)) age += 1;
        
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
        }
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
            ? items.filter(item => !options.priorityItems!.includes(item))
            : items;
        
        for (let i = 0; i < regularItems.length; i += batchSize) {
            const batch = regularItems.slice(i, i + batchSize);
            
            // Process batch in parallel
            const batchResults = await Promise.all(
                batch.map(item => processor(item))
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
            priority?: 'high' | 'normal' | 'low';
            cache?: boolean;
        }
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
        return new Promise(resolve => {
            if ('requestIdleCallback' in window) {
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
        wait?: number
    ): (...args: Parameters<T>) => void {
        const delay = wait ?? this.getDebounceMs();
        let timeoutId: NodeJS.Timeout;
        
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
        wait?: number
    ): (...args: Parameters<T>) => void {
        const delay = wait ?? this.getDebounceMs();
        let lastCall = 0;
        let timeoutId: NodeJS.Timeout | null = null;
        
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
                height: Math.min(viewportHeight * dpr, 1024)
            };
        }
        
        // Desktop can handle larger images
        return {
            width: 2048,
            height: 2048
        };
    }
    
    /**
     * Check if a feature should be enabled based on performance
     */
    public shouldEnableFeature(feature: 'animations' | 'shadows' | '3d' | 'transitions'): boolean {
        if (!this.isMobile()) return true;
        
        // Disable heavy features on mobile
        switch (feature) {
            case 'animations':
                return !this.isUnderMemoryPressure();
            case 'shadows':
                return false; // Always disable shadows on mobile
            case '3d':
                return this.isTablet(); // Only on tablets
            case 'transitions':
                return !this.isUnderMemoryPressure();
            default:
                return true;
        }
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
        
        // Clear static instance if this is the singleton
        if (MobilePerformanceOptimizer.instance === this) {
            MobilePerformanceOptimizer.instance = null as any;
        }
    }
}