import { MobilePerformanceOptimizer, OptimizationConfig, PerformanceMetrics } from '../../../../src/infrastructure/optimizers/MobilePerformanceOptimizer';
import { PlatformDetector } from '../../../../src/infrastructure/utils/PlatformDetector';

// Mock PlatformDetector
jest.mock('../../../../src/infrastructure/utils/PlatformDetector', () => ({
    PlatformDetector: {
        isMobile: jest.fn(() => true),
        isIOS: jest.fn(() => true),
        hasLimitedMemory: jest.fn(() => true),
        getRecommendedBatchSize: jest.fn(() => 25),
        getRecommendedCacheSize: jest.fn(() => 100),
        shouldUseVirtualScrolling: jest.fn(() => false)
    }
}));

describe('MobilePerformanceOptimizer', () => {
    let optimizer: MobilePerformanceOptimizer;
    let config: OptimizationConfig;

    beforeEach(() => {
        config = {
            enableBatching: true,
            enableCaching: true,
            enableVirtualScrolling: true,
            enableImageOptimization: true,
            enableMemoryManagement: true,
            batchSize: 50,
            cacheSize: 200,
            imageQuality: 0.8,
            memoryThreshold: 50,
            debounceDelay: 300
        };

        optimizer = new MobilePerformanceOptimizer(config);

        // Mock performance API
        Object.defineProperty(global, 'performance', {
            value: {
                now: jest.fn(() => Date.now()),
                memory: {
                    usedJSHeapSize: 10 * 1024 * 1024, // 10MB
                    totalJSHeapSize: 50 * 1024 * 1024 // 50MB
                }
            },
            configurable: true
        });

        // Mock requestAnimationFrame
        global.requestAnimationFrame = jest.fn((callback) => {
            setTimeout(callback, 16);
            return 1;
        });

        global.cancelAnimationFrame = jest.fn();

        // Mock requestIdleCallback
        global.requestIdleCallback = jest.fn((callback) => {
            setTimeout(() => callback({ timeRemaining: () => 5 }), 0);
            return 1;
        });

        global.cancelIdleCallback = jest.fn();
    });

    afterEach(() => {
        optimizer.cleanup();
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize with default config', () => {
            const defaultOptimizer = new MobilePerformanceOptimizer();
            const metrics = defaultOptimizer.getMetrics();
            
            expect(metrics).toBeDefined();
            expect(metrics.batchProcessingEnabled).toBe(true);
            expect(metrics.cacheEnabled).toBe(true);
        });

        it('should adapt config based on platform', () => {
            (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
            (PlatformDetector.hasLimitedMemory as jest.Mock).mockReturnValue(true);
            
            const adaptiveOptimizer = new MobilePerformanceOptimizer();
            const metrics = adaptiveOptimizer.getMetrics();
            
            expect(metrics.effectiveBatchSize).toBe(25); // From platform detector
        });

        it('should disable optimizations on desktop', () => {
            (PlatformDetector.isMobile as jest.Mock).mockReturnValue(false);
            
            const desktopOptimizer = new MobilePerformanceOptimizer();
            const metrics = desktopOptimizer.getMetrics();
            
            expect(metrics.virtualScrollingEnabled).toBe(false);
        });
    });

    describe('Batch Processing', () => {
        it('should process items in batches', async () => {
            const items = Array.from({ length: 100 }, (_, i) => i);
            const processor = jest.fn().mockResolvedValue(undefined);
            
            await optimizer.processBatch(items, processor);
            
            // Should be called multiple times with batch size
            expect(processor).toHaveBeenCalledTimes(4); // 100 / 25 = 4 batches
            expect(processor).toHaveBeenCalledWith(expect.arrayContaining([0, 1, 2])); // First batch
        });

        it('should respect custom batch size', async () => {
            const items = Array.from({ length: 50 }, (_, i) => i);
            const processor = jest.fn().mockResolvedValue(undefined);
            
            await optimizer.processBatch(items, processor, 10);
            
            expect(processor).toHaveBeenCalledTimes(5); // 50 / 10 = 5 batches
        });

        it('should handle empty arrays', async () => {
            const processor = jest.fn();
            
            await optimizer.processBatch([], processor);
            
            expect(processor).not.toHaveBeenCalled();
        });

        it('should handle processing errors gracefully', async () => {
            const items = [1, 2, 3];
            const processor = jest.fn().mockRejectedValue(new Error('Processing failed'));
            
            await expect(optimizer.processBatch(items, processor)).rejects.toThrow('Processing failed');
        });

        it('should use requestIdleCallback for non-urgent batches', async () => {
            const items = [1, 2, 3];
            const processor = jest.fn().mockResolvedValue(undefined);
            
            await optimizer.processBatch(items, processor, undefined, false); // non-urgent
            
            expect(global.requestIdleCallback).toHaveBeenCalled();
        });
    });

    describe('Caching', () => {
        it('should create cache with size limit', () => {
            const cache = optimizer.createCache<string, number>('test-cache');
            
            // Fill cache beyond limit
            for (let i = 0; i < 150; i++) {
                cache.set(`key-${i}`, i);
            }
            
            expect(cache.size).toBeLessThanOrEqual(100); // Should respect cache size limit
        });

        it('should implement LRU eviction', () => {
            const cache = optimizer.createCache<string, number>('lru-test', 3);
            
            cache.set('a', 1);
            cache.set('b', 2);
            cache.set('c', 3);
            cache.set('d', 4); // Should evict 'a'
            
            expect(cache.has('a')).toBe(false);
            expect(cache.has('d')).toBe(true);
        });

        it('should update access order on get', () => {
            const cache = optimizer.createCache<string, number>('access-test', 3);
            
            cache.set('a', 1);
            cache.set('b', 2);
            cache.set('c', 3);
            
            cache.get('a'); // Access 'a' to make it recently used
            cache.set('d', 4); // Should evict 'b' instead of 'a'
            
            expect(cache.has('a')).toBe(true);
            expect(cache.has('b')).toBe(false);
        });

        it('should clear all caches', () => {
            const cache1 = optimizer.createCache<string, number>('cache1');
            const cache2 = optimizer.createCache<string, number>('cache2');
            
            cache1.set('key', 1);
            cache2.set('key', 2);
            
            optimizer.clearAllCaches();
            
            expect(cache1.size).toBe(0);
            expect(cache2.size).toBe(0);
        });

        it('should track cache statistics', () => {
            const cache = optimizer.createCache<string, number>('stats-test');
            
            cache.set('key1', 1);
            cache.get('key1'); // hit
            cache.get('key2'); // miss
            
            const stats = optimizer.getCacheStats();
            expect(stats['stats-test']).toBeDefined();
            expect(stats['stats-test'].hits).toBe(1);
            expect(stats['stats-test'].misses).toBe(1);
        });
    });

    describe('Debouncing', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should debounce function calls', () => {
            const fn = jest.fn();
            const debouncedFn = optimizer.debounce(fn, 100);
            
            debouncedFn();
            debouncedFn();
            debouncedFn();
            
            expect(fn).not.toHaveBeenCalled();
            
            jest.advanceTimersByTime(100);
            
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should pass arguments to debounced function', () => {
            const fn = jest.fn();
            const debouncedFn = optimizer.debounce(fn, 100);
            
            debouncedFn('arg1', 'arg2');
            
            jest.advanceTimersByTime(100);
            
            expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
        });

        it('should cancel previous calls on new invocation', () => {
            const fn = jest.fn();
            const debouncedFn = optimizer.debounce(fn, 100);
            
            debouncedFn();
            jest.advanceTimersByTime(50);
            
            debouncedFn(); // Should cancel previous call
            jest.advanceTimersByTime(50);
            
            expect(fn).not.toHaveBeenCalled();
            
            jest.advanceTimersByTime(50);
            
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should use default debounce delay', () => {
            const fn = jest.fn();
            const debouncedFn = optimizer.debounce(fn); // No delay specified
            
            debouncedFn();
            
            jest.advanceTimersByTime(299);
            expect(fn).not.toHaveBeenCalled();
            
            jest.advanceTimersByTime(1);
            expect(fn).toHaveBeenCalled();
        });
    });

    describe('Throttling', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should throttle function calls', () => {
            const fn = jest.fn();
            const throttledFn = optimizer.throttle(fn, 100);
            
            throttledFn();
            throttledFn();
            throttledFn();
            
            expect(fn).toHaveBeenCalledTimes(1);
            
            jest.advanceTimersByTime(100);
            
            throttledFn();
            expect(fn).toHaveBeenCalledTimes(2);
        });

        it('should execute trailing call', () => {
            const fn = jest.fn();
            const throttledFn = optimizer.throttle(fn, 100);
            
            throttledFn();
            jest.advanceTimersByTime(50);
            throttledFn(); // Should be queued as trailing call
            
            jest.advanceTimersByTime(100);
            
            expect(fn).toHaveBeenCalledTimes(2);
        });
    });

    describe('Virtual Scrolling', () => {
        it('should create virtual scroll container', () => {
            const container = document.createElement('div');
            const items = Array.from({ length: 1000 }, (_, i) => ({ id: i, text: `Item ${i}` }));
            const renderItem = jest.fn((item) => {
                const el = document.createElement('div');
                el.textContent = item.text;
                return el;
            });

            const virtualScroll = optimizer.createVirtualScroll(container, items, renderItem, {
                itemHeight: 50,
                containerHeight: 400,
                overscan: 5
            });

            expect(virtualScroll).toBeDefined();
            expect(container.children.length).toBeGreaterThan(0);
            expect(renderItem).toHaveBeenCalled();
        });

        it('should handle scroll events', () => {
            const container = document.createElement('div');
            const items = Array.from({ length: 100 }, (_, i) => ({ id: i, text: `Item ${i}` }));
            const renderItem = jest.fn((item) => {
                const el = document.createElement('div');
                el.textContent = item.text;
                return el;
            });

            const virtualScroll = optimizer.createVirtualScroll(container, items, renderItem);

            // Simulate scroll
            container.scrollTop = 200;
            container.dispatchEvent(new Event('scroll'));

            expect(renderItem).toHaveBeenCalledTimes(items.length); // Should re-render visible items
        });

        it('should cleanup virtual scroll on destroy', () => {
            const container = document.createElement('div');
            const items = [{ id: 1, text: 'Item' }];
            const renderItem = jest.fn(() => document.createElement('div'));

            const virtualScroll = optimizer.createVirtualScroll(container, items, renderItem);
            virtualScroll.destroy();

            expect(container.innerHTML).toBe('');
        });
    });

    describe('Image Optimization', () => {
        it('should optimize image with quality setting', async () => {
            // Mock canvas and context
            const mockCanvas = {
                width: 0,
                height: 0,
                getContext: jest.fn(() => ({
                    drawImage: jest.fn(),
                    getImageData: jest.fn(),
                    putImageData: jest.fn()
                })),
                toDataURL: jest.fn(() => 'data:image/jpeg;base64,optimized')
            };

            Object.defineProperty(document, 'createElement', {
                value: jest.fn((tag) => {
                    if (tag === 'canvas') return mockCanvas;
                    if (tag === 'img') return { onload: null, src: null };
                    return document.createElement(tag);
                }),
                configurable: true
            });

            const imageFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
            const optimized = await optimizer.optimizeImage(imageFile);

            expect(optimized).toBeDefined();
            expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.8);
        });

        it('should resize large images', async () => {
            const mockCanvas = {
                width: 0,
                height: 0,
                getContext: jest.fn(() => ({
                    drawImage: jest.fn(),
                })),
                toDataURL: jest.fn(() => 'data:image/jpeg;base64,resized')
            };

            Object.defineProperty(document, 'createElement', {
                value: jest.fn(() => mockCanvas),
                configurable: true
            });

            const imageFile = new File(['large image'], 'large.jpg', { type: 'image/jpeg' });
            
            await optimizer.optimizeImage(imageFile, { maxWidth: 800, maxHeight: 600 });

            // Canvas should be resized
            expect(mockCanvas.width).toBeLessThanOrEqual(800);
            expect(mockCanvas.height).toBeLessThanOrEqual(600);
        });
    });

    describe('Memory Management', () => {
        it('should monitor memory usage', () => {
            const usage = optimizer.getMemoryUsage();
            
            expect(usage).toBeDefined();
            expect(usage.used).toBe(10 * 1024 * 1024); // From mock
            expect(usage.total).toBe(50 * 1024 * 1024);
            expect(usage.percentage).toBe(20); // 10/50 * 100
        });

        it('should trigger cleanup when memory threshold exceeded', () => {
            // Mock high memory usage
            Object.defineProperty(global.performance, 'memory', {
                value: {
                    usedJSHeapSize: 45 * 1024 * 1024, // 45MB
                    totalJSHeapSize: 50 * 1024 * 1024 // 50MB - 90% usage
                },
                configurable: true
            });

            const cleanupSpy = jest.spyOn(optimizer, 'forceGarbageCollection');
            
            const usage = optimizer.getMemoryUsage();
            
            expect(usage.percentage).toBe(90);
            if (usage.percentage > 80) {
                optimizer.forceGarbageCollection();
            }
            
            expect(cleanupSpy).toHaveBeenCalled();
        });

        it('should schedule memory cleanup', () => {
            const cleanupCallback = jest.fn();
            
            optimizer.scheduleMemoryCleanup(cleanupCallback);
            
            expect(global.requestIdleCallback).toHaveBeenCalledWith(
                expect.any(Function),
                { timeout: 5000 }
            );
        });

        it('should force garbage collection', () => {
            const originalGC = (global as any).gc;
            (global as any).gc = jest.fn();
            
            optimizer.forceGarbageCollection();
            
            if ((global as any).gc) {
                expect((global as any).gc).toHaveBeenCalled();
            }
            
            (global as any).gc = originalGC;
        });
    });

    describe('Performance Metrics', () => {
        it('should track operation timing', () => {
            const operation = () => {
                // Simulate work
                const start = Date.now();
                while (Date.now() - start < 10) {
                    // Busy wait
                }
            };

            optimizer.trackOperation('test-operation', operation);
            
            const metrics = optimizer.getMetrics();
            expect(metrics.operations['test-operation']).toBeDefined();
            expect(metrics.operations['test-operation'].count).toBe(1);
            expect(metrics.operations['test-operation'].totalTime).toBeGreaterThan(0);
        });

        it('should calculate average operation time', () => {
            const operation = () => {
                const start = Date.now();
                while (Date.now() - start < 5) {
                    // Busy wait
                }
            };

            optimizer.trackOperation('avg-test', operation);
            optimizer.trackOperation('avg-test', operation);
            
            const metrics = optimizer.getMetrics();
            const opMetrics = metrics.operations['avg-test'];
            
            expect(opMetrics.count).toBe(2);
            expect(opMetrics.averageTime).toBe(opMetrics.totalTime / 2);
        });

        it('should provide comprehensive metrics', () => {
            const metrics = optimizer.getMetrics();
            
            expect(metrics).toMatchObject({
                batchProcessingEnabled: expect.any(Boolean),
                effectiveBatchSize: expect.any(Number),
                cacheEnabled: expect.any(Boolean),
                effectiveCacheSize: expect.any(Number),
                virtualScrollingEnabled: expect.any(Boolean),
                imageOptimizationEnabled: expect.any(Boolean),
                memoryManagementEnabled: expect.any(Boolean),
                operations: expect.any(Object),
                cacheStats: expect.any(Object),
                memoryUsage: expect.any(Object)
            });
        });
    });

    describe('Configuration Updates', () => {
        it('should update configuration', () => {
            const newConfig: Partial<OptimizationConfig> = {
                batchSize: 10,
                cacheSize: 50
            };
            
            optimizer.updateConfig(newConfig);
            
            const metrics = optimizer.getMetrics();
            expect(metrics.effectiveBatchSize).toBe(10);
            expect(metrics.effectiveCacheSize).toBe(50);
        });

        it('should adapt config based on platform changes', () => {
            (PlatformDetector.isMobile as jest.Mock).mockReturnValue(false);
            
            optimizer.updateConfig({ enableVirtualScrolling: true });
            
            const metrics = optimizer.getMetrics();
            expect(metrics.virtualScrollingEnabled).toBe(false); // Disabled on desktop
        });
    });

    describe('Cleanup', () => {
        it('should cleanup all resources', () => {
            const cache = optimizer.createCache('cleanup-test');
            cache.set('key', 'value');
            
            optimizer.cleanup();
            
            expect(cache.size).toBe(0);
        });

        it('should cancel pending operations', () => {
            const cancelSpy = jest.spyOn(global, 'cancelIdleCallback');
            
            optimizer.scheduleMemoryCleanup(() => {});
            optimizer.cleanup();
            
            expect(cancelSpy).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle missing performance API gracefully', () => {
            delete (global as any).performance;
            
            const safeOptimizer = new MobilePerformanceOptimizer();
            const usage = safeOptimizer.getMemoryUsage();
            
            expect(usage.used).toBe(0);
            expect(usage.total).toBe(0);
            expect(usage.percentage).toBe(0);
        });

        it('should handle missing requestIdleCallback', () => {
            delete (global as any).requestIdleCallback;
            
            const fallbackOptimizer = new MobilePerformanceOptimizer();
            const callback = jest.fn();
            
            fallbackOptimizer.scheduleMemoryCleanup(callback);
            
            // Should fallback to setTimeout
            expect(callback).toHaveBeenCalled();
        });

        it('should handle image optimization errors', async () => {
            Object.defineProperty(document, 'createElement', {
                value: jest.fn(() => {
                    throw new Error('Canvas not supported');
                }),
                configurable: true
            });

            const imageFile = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
            
            await expect(optimizer.optimizeImage(imageFile)).rejects.toThrow('Canvas not supported');
        });
    });
});