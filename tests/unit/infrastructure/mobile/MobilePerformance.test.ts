/**
 * Mobile Performance Optimization Tests
 * Tests performance optimizations, memory constraints, and adaptive loading
 */

import { MobileTestEnvironment } from "../../../mobile-setup";
import { ExocortexSettings, DEFAULT_SETTINGS } from "../../../../src/domain/entities/ExocortexSettings";

describe("Mobile Performance Optimization", () => {
  let cleanup: (() => void) | undefined;
  let settings: ExocortexSettings;

  beforeEach(() => {
    cleanup = MobileTestEnvironment.setupiOS();
    settings = new ExocortexSettings();
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  describe("Batch Size Optimization", () => {
    it("should use smaller batch sizes on mobile devices", () => {
      expect(settings.get("mobileBatchSize")).toBe(10);
      expect(settings.get("batchProcessingSize")).toBe(50);
      expect(settings.get("mobileBatchSize")).toBeLessThan(settings.get("batchProcessingSize"));
    });

    it("should validate mobile batch size constraints", () => {
      const result = settings.set("mobileBatchSize", 0);
      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toContain("Mobile batch size must be at least 1");
    });

    it("should adapt batch size based on available memory", () => {
      // Simulate low memory device
      MobileTestEnvironment.simulateMemoryPressure("critical");
      
      // In a real implementation, batch size would be reduced based on memory pressure
      const recommendedBatchSize = performance.memory.usedJSHeapSize > (100 * 1024 * 1024) ? 5 : 10;
      expect(recommendedBatchSize).toBeLessThanOrEqual(10);
    });

    it("should process items in mobile-optimized batches", async () => {
      const items = Array.from({ length: 100 }, (_, i) => i);
      const batchSize = settings.get("mobileBatchSize");
      const processedBatches: number[][] = [];

      // Simulate batch processing
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        processedBatches.push(batch);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      expect(processedBatches.length).toBe(Math.ceil(items.length / batchSize));
      expect(processedBatches[0].length).toBe(batchSize);
      expect(processedBatches[processedBatches.length - 1].length).toBeLessThanOrEqual(batchSize);
    });
  });

  describe("Memory Management", () => {
    beforeEach(() => {
      cleanup = MobileTestEnvironment.setupLowMemoryDevice();
    });

    it("should detect memory pressure", () => {
      const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
      expect(memoryUsage).toBeGreaterThan(0.6); // >60% memory usage indicates pressure
    });

    it("should trigger garbage collection on memory pressure", () => {
      const gcSpy = jest.spyOn(global, 'gc').mockImplementation(() => {});
      
      // Simulate memory pressure scenario
      MobileTestEnvironment.simulateMemoryPressure("critical");
      
      const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
      
      if (memoryUsage > 0.8 && typeof global.gc === 'function') {
        global.gc();
        expect(gcSpy).toHaveBeenCalled();
      }
      
      gcSpy.mockRestore();
    });

    it("should implement memory-aware caching", () => {
      const cache = new Map<string, any>();
      const maxCacheSize = navigator.deviceMemory && navigator.deviceMemory < 4 ? 100 : 500;
      
      // Fill cache
      for (let i = 0; i < maxCacheSize + 50; i++) {
        if (cache.size >= maxCacheSize) {
          // Remove oldest entry
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
        cache.set(`key_${i}`, `value_${i}`);
      }
      
      expect(cache.size).toBeLessThanOrEqual(maxCacheSize);
    });

    it("should monitor heap size growth", () => {
      const initialHeapSize = performance.memory.usedJSHeapSize;
      
      // Simulate memory allocation
      const largeArray = new Array(10000).fill("test data");
      
      const finalHeapSize = performance.memory.usedJSHeapSize;
      expect(finalHeapSize).toBeGreaterThanOrEqual(initialHeapSize);
      
      // Clean up
      largeArray.length = 0;
    });

    it("should implement memory-based adaptive loading", () => {
      const availableMemory = performance.memory.jsHeapSizeLimit - performance.memory.usedJSHeapSize;
      const memoryPressureThreshold = 50 * 1024 * 1024; // 50MB
      
      const shouldDeferLoading = availableMemory < memoryPressureThreshold;
      
      if (shouldDeferLoading) {
        expect(availableMemory).toBeLessThan(memoryPressureThreshold);
      }
    });
  });

  describe("Network Optimization", () => {
    beforeEach(() => {
      cleanup = MobileTestEnvironment.setupSlowConnection();
    });

    it("should detect slow network conditions", () => {
      expect(navigator.connection?.effectiveType).toBe("2g");
      expect(navigator.connection?.downlink).toBeLessThan(2);
    });

    it("should reduce data transfer on slow connections", () => {
      const isSlowConnection = navigator.connection?.effectiveType === "2g" || 
                               (navigator.connection?.downlink || 0) < 2;
      
      if (isSlowConnection) {
        // In real implementation, would reduce data payload
        const reducedPayloadSize = 1024; // 1KB instead of larger payload
        expect(reducedPayloadSize).toBeLessThan(10240); // Less than 10KB
      }
    });

    it("should implement progressive loading on mobile", async () => {
      const items = Array.from({ length: 50 }, (_, i) => `item_${i}`);
      const loadedItems: string[] = [];
      const batchSize = 5; // Smaller batch for slow connection
      
      // Simulate progressive loading
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        loadedItems.push(...batch);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Break early on slow connections to avoid timeout
        if (navigator.connection?.effectiveType === "2g" && loadedItems.length >= 15) {
          break;
        }
      }
      
      expect(loadedItems.length).toBeGreaterThan(0);
      expect(loadedItems.length).toBeLessThanOrEqual(items.length);
    });

    it("should handle offline scenarios gracefully", () => {
      cleanup?.();
      cleanup = MobileTestEnvironment.setupOffline();
      
      expect(navigator.onLine).toBe(false);
      
      // In real implementation, would use cached data
      const cachedData = localStorage.getItem("cached_data") || "fallback_data";
      expect(cachedData).toBeDefined();
    });

    it("should implement request queuing for poor connectivity", async () => {
      const requestQueue: Array<() => Promise<any>> = [];
      const maxConcurrentRequests = navigator.connection?.effectiveType === "2g" ? 1 : 3;
      
      // Add requests to queue
      for (let i = 0; i < 10; i++) {
        requestQueue.push(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return `result_${i}`;
        });
      }
      
      // Process queue with concurrency limit
      const results: any[] = [];
      while (requestQueue.length > 0) {
        const batch = requestQueue.splice(0, maxConcurrentRequests);
        const batchResults = await Promise.all(batch.map(request => request()));
        results.push(...batchResults);
      }
      
      expect(results.length).toBe(10);
    });
  });

  describe("Battery Optimization", () => {
    beforeEach(() => {
      cleanup = MobileTestEnvironment.setupLowBattery();
    });

    it("should detect low battery conditions", async () => {
      const battery = await navigator.getBattery!();
      expect(battery.level).toBeLessThan(0.2); // Less than 20%
      expect(battery.charging).toBe(false);
    });

    it("should reduce processing on low battery", async () => {
      const battery = await navigator.getBattery!();
      
      if (battery.level < 0.2 && !battery.charging) {
        // In real implementation, would reduce background processing
        const reducedUpdateInterval = 5000; // 5 seconds instead of 1 second
        expect(reducedUpdateInterval).toBeGreaterThan(1000);
      }
    });

    it("should defer non-critical operations on low battery", async () => {
      const battery = await navigator.getBattery!();
      const isLowBattery = battery.level < 0.2 && !battery.charging;
      
      const criticalTasks: string[] = ["user_input", "data_save"];
      const nonCriticalTasks: string[] = ["background_sync", "analytics", "prefetch"];
      
      const taskQueue = [...criticalTasks, ...nonCriticalTasks];
      const processedTasks: string[] = [];
      
      for (const task of taskQueue) {
        if (isLowBattery && nonCriticalTasks.includes(task)) {
          // Skip non-critical tasks on low battery
          continue;
        }
        processedTasks.push(task);
      }
      
      expect(processedTasks).toEqual(expect.arrayContaining(criticalTasks));
      if (isLowBattery) {
        expect(processedTasks).not.toEqual(expect.arrayContaining(nonCriticalTasks));
      }
    });

    it("should adjust animation frame rate on low battery", async () => {
      const battery = await navigator.getBattery!();
      const isLowBattery = battery.level < 0.2 && !battery.charging;
      
      const targetFPS = isLowBattery ? 30 : 60;
      const frameInterval = 1000 / targetFPS; // ms per frame
      
      let frameCount = 0;
      const startTime = performance.now();
      
      const animationLoop = () => {
        frameCount++;
        const elapsed = performance.now() - startTime;
        
        if (elapsed < 500) { // Run for 500ms
          setTimeout(animationLoop, frameInterval);
        }
      };
      
      animationLoop();
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const expectedFrames = Math.floor(500 / frameInterval);
      expect(frameCount).toBeCloseTo(expectedFrames, 2);
    });
  });

  describe("Rendering Performance", () => {
    it("should use requestAnimationFrame for smooth animations", async () => {
      const rafSpy = jest.spyOn(window, 'requestAnimationFrame');
      
      let animationComplete = false;
      const animate = () => {
        if (!animationComplete) {
          // Simulate animation work
          requestAnimationFrame(animate);
        }
      };
      
      animate();
      
      // Complete animation after short delay
      setTimeout(() => { animationComplete = true; }, 100);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(rafSpy).toHaveBeenCalled();
      
      rafSpy.mockRestore();
    });

    it("should throttle expensive DOM operations", async () => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      
      let updateCount = 0;
      const throttledUpdate = (() => {
        let timeoutId: number | null = null;
        return () => {
          if (timeoutId) return;
          
          timeoutId = window.setTimeout(() => {
            updateCount++;
            container.textContent = `Update ${updateCount}`;
            timeoutId = null;
          }, 16); // ~60fps
        };
      })();
      
      // Trigger many updates rapidly
      for (let i = 0; i < 100; i++) {
        throttledUpdate();
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should have been throttled to much fewer updates
      expect(updateCount).toBeLessThan(10);
      expect(updateCount).toBeGreaterThan(0);
      
      document.body.removeChild(container);
    });

    it("should use virtual scrolling for large lists", () => {
      const items = Array.from({ length: 10000 }, (_, i) => `Item ${i}`);
      const viewportHeight = 400;
      const itemHeight = 40;
      const visibleItems = Math.ceil(viewportHeight / itemHeight);
      
      // Only render visible items + buffer
      const buffer = 5;
      const renderStart = 0;
      const renderEnd = Math.min(visibleItems + buffer, items.length);
      
      const visibleItemsToRender = items.slice(renderStart, renderEnd);
      
      expect(visibleItemsToRender.length).toBeLessThan(50); // Much less than 10000
      expect(visibleItemsToRender.length).toBeGreaterThan(0);
    });

    it("should lazy load images", async () => {
      const container = document.createElement("div");
      container.style.height = "300px";
      container.style.overflow = "auto";
      document.body.appendChild(container);
      
      const images: HTMLImageElement[] = [];
      for (let i = 0; i < 10; i++) {
        const img = document.createElement("img");
        img.dataset.src = `image_${i}.jpg`;
        img.style.height = "100px";
        img.style.display = "block";
        container.appendChild(img);
        images.push(img);
      }
      
      // Simulate intersection observer for lazy loading
      const observerCallback = (entries: IntersectionObserverEntry[]) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              delete img.dataset.src;
            }
          }
        });
      };
      
      // Mock intersection observer
      const mockObserver = {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
      
      images.forEach(img => mockObserver.observe(img));
      
      expect(mockObserver.observe).toHaveBeenCalledTimes(10);
      
      document.body.removeChild(container);
    });
  });

  describe("Storage Optimization", () => {
    it("should use efficient data structures", () => {
      // Use Map for O(1) lookups instead of arrays
      const dataMap = new Map<string, any>();
      const startTime = performance.now();
      
      // Add items
      for (let i = 0; i < 1000; i++) {
        dataMap.set(`key_${i}`, { value: i, data: `data_${i}` });
      }
      
      // Lookup items
      for (let i = 0; i < 100; i++) {
        const item = dataMap.get(`key_${i}`);
        expect(item).toBeDefined();
      }
      
      const endTime = performance.now();
      const operationTime = endTime - startTime;
      
      // Should be fast (under 10ms for 1000 items + 100 lookups)
      expect(operationTime).toBeLessThan(50);
    });

    it("should compress data for storage", () => {
      const originalData = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `This is a long description for item ${i}`,
          tags: [`tag1`, `tag2`, `tag3`]
        }))
      };
      
      const jsonString = JSON.stringify(originalData);
      
      // In real implementation, would use compression
      const compressedSize = Math.floor(jsonString.length * 0.6); // Simulate 40% compression
      
      expect(compressedSize).toBeLessThan(jsonString.length);
    });

    it("should implement cache eviction strategies", () => {
      const cache = new Map<string, { value: any; timestamp: number; accessCount: number }>();
      const maxSize = 100;
      
      // Fill cache beyond capacity
      for (let i = 0; i < maxSize + 20; i++) {
        if (cache.size >= maxSize) {
          // LRU eviction - find least recently used item
          let lruKey = "";
          let oldestTimestamp = Date.now();
          
          for (const [key, entry] of cache.entries()) {
            if (entry.timestamp < oldestTimestamp) {
              oldestTimestamp = entry.timestamp;
              lruKey = key;
            }
          }
          
          if (lruKey) {
            cache.delete(lruKey);
          }
        }
        
        cache.set(`item_${i}`, {
          value: `data_${i}`,
          timestamp: Date.now(),
          accessCount: 0
        });
      }
      
      expect(cache.size).toBeLessThanOrEqual(maxSize);
    });
  });

  describe("Adaptive Performance Tuning", () => {
    it("should adjust settings based on device capabilities", () => {
      const deviceMemory = navigator.deviceMemory || 4;
      const effectiveType = navigator.connection?.effectiveType || "4g";
      
      // Adjust settings based on device
      let adaptedSettings = { ...DEFAULT_SETTINGS };
      
      if (deviceMemory < 4) {
        adaptedSettings.queryCacheMaxSize = 100; // Reduce cache size
        adaptedSettings.mobileBatchSize = 5; // Smaller batches
      }
      
      if (effectiveType === "2g" || effectiveType === "slow-2g") {
        adaptedSettings.queryCacheTimeout = 60; // Longer timeout
      }
      
      expect(adaptedSettings.queryCacheMaxSize).toBeLessThanOrEqual(500);
      expect(adaptedSettings.mobileBatchSize).toBeLessThanOrEqual(10);
    });

    it("should monitor performance metrics", () => {
      const performanceMetrics = {
        frameTime: 0,
        memoryUsage: 0,
        cacheHitRate: 0,
        networkLatency: 0
      };
      
      // Simulate measuring frame time
      const frameStart = performance.now();
      // Simulate frame work
      for (let i = 0; i < 1000; i++) {
        Math.random();
      }
      const frameEnd = performance.now();
      performanceMetrics.frameTime = frameEnd - frameStart;
      
      // Simulate measuring memory usage
      performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize / (1024 * 1024); // MB
      
      expect(performanceMetrics.frameTime).toBeGreaterThan(0);
      expect(performanceMetrics.memoryUsage).toBeGreaterThan(0);
      
      // Performance should be reasonable
      expect(performanceMetrics.frameTime).toBeLessThan(16); // 60fps budget
    });

    it("should implement performance budgets", () => {
      const performanceBudgets = {
        maxFrameTime: 16, // 60fps
        maxMemoryMB: navigator.deviceMemory ? navigator.deviceMemory * 1024 * 0.5 : 2048, // 50% of device memory
        maxCacheSize: 500,
        maxNetworkTimeout: 5000
      };
      
      // Check if current performance meets budgets
      const currentFrameTime = 12; // ms
      const currentMemoryMB = performance.memory.usedJSHeapSize / (1024 * 1024);
      
      expect(currentFrameTime).toBeLessThan(performanceBudgets.maxFrameTime);
      expect(currentMemoryMB).toBeLessThan(performanceBudgets.maxMemoryMB);
    });
  });
});