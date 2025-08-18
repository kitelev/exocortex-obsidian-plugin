/**
 * Advanced Mobile Integration Tests
 * Comprehensive mobile platform testing scenarios
 */

import { PlatformDetector } from '../../../src/infrastructure/utils/PlatformDetector';
import { MobilePerformanceOptimizer } from '../../../src/infrastructure/optimizers/MobilePerformanceOptimizer';
import { TouchGraphController } from '../../../src/presentation/mobile/TouchGraphController';
import { MobileModalAdapter } from '../../../src/presentation/mobile/MobileModalAdapter';

// Mock implementations for testing
class MockObsidianApp {
    isMobile = true;
    platform = 'mobile';
}

class MockVault {
    adapter = {
        fs: {
            promises: {
                readFile: jest.fn(),
                writeFile: jest.fn(),
                unlink: jest.fn()
            }
        }
    };
}

describe('Advanced Mobile Integration Tests', () => {
    let platformDetector: PlatformDetector;
    let performanceOptimizer: MobilePerformanceOptimizer;
    let touchController: TouchGraphController;
    let modalAdapter: MobileModalAdapter;
    let mockApp: MockObsidianApp;
    let mockVault: MockVault;

    beforeEach(() => {
        mockApp = new MockObsidianApp();
        mockVault = new MockVault();
        
        platformDetector = new PlatformDetector();
        performanceOptimizer = new MobilePerformanceOptimizer();
        
        // Mock DOM element for touch controller
        const mockElement = document.createElement('div');
        document.body.appendChild(mockElement);
        
        touchController = new TouchGraphController(mockElement, {
            onTap: jest.fn(),
            onDoubleTap: jest.fn(),
            onLongPress: jest.fn(),
            onPinchStart: jest.fn(),
            onPinchMove: jest.fn(),
            onPinchEnd: jest.fn(),
            onPanStart: jest.fn(),
            onPanMove: jest.fn(),
            onPanEnd: jest.fn()
        });
        
        modalAdapter = new MobileModalAdapter(mockApp as any);
    });

    afterEach(() => {
        touchController?.destroy();
        document.body.innerHTML = '';
    });

    describe('Platform Detection Scenarios', () => {
        it('should detect iOS devices correctly', () => {
            // Mock iOS user agent
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
                configurable: true
            });
            
            Object.defineProperty(navigator, 'platform', {
                value: 'iPhone',
                configurable: true
            });
            
            const result = platformDetector.detectPlatform();
            expect(result.isSuccess).toBe(true);
            
            const platform = result.getValue();
            expect(platform.isMobile).toBe(true);
            expect(platform.platform).toBe('ios');
            expect(platform.capabilities.touchSupport).toBe(true);
            expect(platform.capabilities.hapticFeedback).toBe(true);
        });

        it('should detect Android devices correctly', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 Chrome/96.0.4664.45 Mobile Safari/537.36',
                configurable: true
            });
            
            Object.defineProperty(navigator, 'platform', {
                value: 'Linux armv8l',
                configurable: true
            });
            
            const result = platformDetector.detectPlatform();
            expect(result.isSuccess).toBe(true);
            
            const platform = result.getValue();
            expect(platform.isMobile).toBe(true);
            expect(platform.platform).toBe('android');
            expect(platform.capabilities.touchSupport).toBe(true);
        });

        it('should detect tablet-specific optimizations', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
                configurable: true
            });
            
            // Mock screen size for tablet
            Object.defineProperty(screen, 'width', { value: 1024, configurable: true });
            Object.defineProperty(screen, 'height', { value: 768, configurable: true });
            
            const result = platformDetector.detectPlatform();
            expect(result.isSuccess).toBe(true);
            
            const platform = result.getValue();
            expect(platform.isMobile).toBe(true);
            expect(platform.formFactor).toBe('tablet');
            expect(platform.screenSize).toBe('large');
        });

        it('should handle device orientation changes', (done) => {
            let orientationChangeCount = 0;
            
            const orientationCallback = (orientation: string) => {
                orientationChangeCount++;
                expect(['portrait', 'landscape']).toContain(orientation);
                
                if (orientationChangeCount === 2) {
                    done();
                }
            };
            
            platformDetector.onOrientationChange(orientationCallback);
            
            // Simulate orientation changes
            Object.defineProperty(screen, 'orientation', {
                value: { angle: 90 },
                configurable: true
            });
            
            window.dispatchEvent(new Event('orientationchange'));
            
            setTimeout(() => {
                Object.defineProperty(screen, 'orientation', {
                    value: { angle: 0 },
                    configurable: true
                });
                
                window.dispatchEvent(new Event('orientationchange'));
            }, 100);
        });

        it('should detect available device features', async () => {
            // Mock various device capabilities
            Object.defineProperty(navigator, 'vibrate', {
                value: jest.fn(() => true),
                configurable: true
            });
            
            Object.defineProperty(navigator, 'geolocation', {
                value: {
                    getCurrentPosition: jest.fn()
                },
                configurable: true
            });
            
            const capabilities = await platformDetector.getDeviceCapabilities();
            expect(capabilities.isSuccess).toBe(true);
            
            const caps = capabilities.getValue();
            expect(caps.vibration).toBe(true);
            expect(caps.geolocation).toBe(true);
            expect(caps.localStorage).toBe(true);
        });
    });

    describe('Touch Gesture Sequence Testing', () => {
        it('should handle complex multi-touch sequences', (done) => {
            const gestures: string[] = [];
            
            const callbacks = {
                onTap: () => gestures.push('tap'),
                onDoubleTap: () => gestures.push('double-tap'),
                onLongPress: () => gestures.push('long-press'),
                onPinchStart: () => gestures.push('pinch-start'),
                onPinchMove: () => gestures.push('pinch-move'),
                onPinchEnd: () => gestures.push('pinch-end'),
                onPanStart: () => gestures.push('pan-start'),
                onPanMove: () => gestures.push('pan-move'),
                onPanEnd: () => gestures.push('pan-end')
            };
            
            // Create new controller with tracking callbacks
            const element = document.createElement('div');
            const controller = new TouchGraphController(element, callbacks);
            
            // Simulate complex gesture sequence
            const executeGestureSequence = async () => {
                // 1. Single tap
                const tap = new TouchEvent('touchstart', {
                    touches: [{ clientX: 100, clientY: 100 } as Touch]
                });
                element.dispatchEvent(tap);
                
                await new Promise(resolve => setTimeout(resolve, 50));
                
                const tapEnd = new TouchEvent('touchend', { touches: [] });
                element.dispatchEvent(tapEnd);
                
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // 2. Pinch gesture
                const pinchStart = new TouchEvent('touchstart', {
                    touches: [
                        { clientX: 100, clientY: 100 } as Touch,
                        { clientX: 200, clientY: 200 } as Touch
                    ]
                });
                element.dispatchEvent(pinchStart);
                
                await new Promise(resolve => setTimeout(resolve, 50));
                
                const pinchMove = new TouchEvent('touchmove', {
                    touches: [
                        { clientX: 90, clientY: 90 } as Touch,
                        { clientX: 210, clientY: 210 } as Touch
                    ]
                });
                element.dispatchEvent(pinchMove);
                
                await new Promise(resolve => setTimeout(resolve, 50));
                
                const pinchEnd = new TouchEvent('touchend', { touches: [] });
                element.dispatchEvent(pinchEnd);
                
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Verify gesture sequence was detected
                expect(gestures.length).toBeGreaterThan(0);
                controller.destroy();
                done();
            };
            
            executeGestureSequence();
        });

        it('should handle rapid gesture switching', async () => {
            const gestureTransitions: Array<{from: string, to: string}> = [];
            let currentGesture = 'none';
            
            const trackingCallbacks = {
                onTap: () => {
                    gestureTransitions.push({from: currentGesture, to: 'tap'});
                    currentGesture = 'tap';
                },
                onPinchStart: () => {
                    gestureTransitions.push({from: currentGesture, to: 'pinch'});
                    currentGesture = 'pinch';
                },
                onPanStart: () => {
                    gestureTransitions.push({from: currentGesture, to: 'pan'});
                    currentGesture = 'pan';
                },
                onPinchEnd: () => {
                    gestureTransitions.push({from: currentGesture, to: 'none'});
                    currentGesture = 'none';
                },
                onPanEnd: () => {
                    gestureTransitions.push({from: currentGesture, to: 'none'});
                    currentGesture = 'none';
                },
                onDoubleTap: jest.fn(),
                onLongPress: jest.fn(),
                onPinchMove: jest.fn(),
                onPanMove: jest.fn()
            };
            
            const element = document.createElement('div');
            const controller = new TouchGraphController(element, trackingCallbacks);
            
            // Rapid sequence: tap -> pinch -> pan -> tap
            const rapidSequence = [
                // Quick tap
                { type: 'touchstart', touches: [{ clientX: 100, clientY: 100 }] },
                { type: 'touchend', touches: [] },
                
                // Immediate pinch
                { type: 'touchstart', touches: [
                    { clientX: 100, clientY: 100 },
                    { clientX: 200, clientY: 200 }
                ]},
                { type: 'touchend', touches: [] },
                
                // Quick pan
                { type: 'touchstart', touches: [{ clientX: 150, clientY: 150 }] },
                { type: 'touchmove', touches: [{ clientX: 200, clientY: 200 }] },
                { type: 'touchend', touches: [] }
            ];
            
            for (const event of rapidSequence) {
                const touchEvent = new TouchEvent(event.type as any, {
                    touches: event.touches as any
                });
                element.dispatchEvent(touchEvent);
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            // Should have tracked multiple gesture transitions
            expect(gestureTransitions.length).toBeGreaterThan(0);
            
            controller.destroy();
        });

        it('should handle edge cases in touch events', () => {
            const errorEvents: string[] = [];
            
            const robustCallbacks = {
                onTap: jest.fn(),
                onDoubleTap: jest.fn(),
                onLongPress: jest.fn(),
                onPinchStart: jest.fn(),
                onPinchMove: jest.fn(),
                onPinchEnd: jest.fn(),
                onPanStart: jest.fn(),
                onPanMove: jest.fn(),
                onPanEnd: jest.fn()
            };
            
            const element = document.createElement('div');
            const controller = new TouchGraphController(element, robustCallbacks);
            
            // Test edge cases that shouldn't crash the controller
            const edgeCases = [
                // No touches array
                new TouchEvent('touchstart'),
                
                // Empty touches
                new TouchEvent('touchstart', { touches: [] }),
                
                // Invalid touch coordinates
                new TouchEvent('touchstart', {
                    touches: [{ clientX: NaN, clientY: NaN } as Touch]
                }),
                
                // Extremely large coordinates
                new TouchEvent('touchstart', {
                    touches: [{ clientX: Number.MAX_VALUE, clientY: Number.MAX_VALUE } as Touch]
                }),
                
                // Negative coordinates
                new TouchEvent('touchstart', {
                    touches: [{ clientX: -1000, clientY: -1000 } as Touch]
                })
            ];
            
            edgeCases.forEach((event, index) => {
                try {
                    element.dispatchEvent(event);
                } catch (error) {
                    errorEvents.push(`Edge case ${index}: ${error.message}`);
                }
            });
            
            // Controller should handle all edge cases gracefully
            expect(errorEvents.length).toBe(0);
            
            controller.destroy();
        });
    });

    describe('Performance Optimization Triggers', () => {
        it('should optimize for low memory conditions', async () => {
            // Mock memory API
            Object.defineProperty(performance, 'memory', {
                value: {
                    usedJSHeapSize: 50 * 1024 * 1024,  // 50MB
                    totalJSHeapSize: 100 * 1024 * 1024, // 100MB  
                    jsHeapSizeLimit: 120 * 1024 * 1024  // 120MB
                },
                configurable: true
            });
            
            const memoryStatus = await performanceOptimizer.checkMemoryStatus();
            expect(memoryStatus.isSuccess).toBe(true);
            
            const status = memoryStatus.getValue();
            expect(status.pressure).toBe('moderate');
            
            // Should trigger optimizations
            const optimizationResult = await performanceOptimizer.optimizeForMemory();
            expect(optimizationResult.isSuccess).toBe(true);
            
            const optimizations = optimizationResult.getValue();
            expect(optimizations.actionsPerformed).toContain('reduced_cache_size');
        });

        it('should handle CPU throttling scenarios', async () => {
            const startTime = performance.now();
            
            // Simulate CPU-intensive operation
            const intensiveTask = () => {
                let result = 0;
                for (let i = 0; i < 1000000; i++) {
                    result += Math.random();
                }
                return result;
            };
            
            const result = await performanceOptimizer.executeWithThrottling(intensiveTask);
            const endTime = performance.now();
            
            expect(result.isSuccess).toBe(true);
            expect(typeof result.getValue()).toBe('number');
            
            // Should complete within reasonable time even under throttling
            expect(endTime - startTime).toBeLessThan(5000);
        });

        it('should adapt query processing for mobile constraints', async () => {
            const complexQuery = `
                SELECT * WHERE {
                    ?s1 ex:relates ?s2 .
                    ?s2 ex:relates ?s3 .
                    ?s3 ex:relates ?s4 .
                    ?s4 ex:relates ?s5 .
                    OPTIONAL { ?s1 ex:hasProperty ?prop1 }
                    OPTIONAL { ?s2 ex:hasProperty ?prop2 }
                    OPTIONAL { ?s3 ex:hasProperty ?prop3 }
                }
            `;
            
            // Should adapt the query for mobile execution
            const adaptationResult = await performanceOptimizer.adaptQueryForMobile(complexQuery);
            expect(adaptationResult.isSuccess).toBe(true);
            
            const adaptedQuery = adaptationResult.getValue();
            
            // Adapted query should have optimizations
            expect(adaptedQuery.query).toContain('LIMIT');
            expect(adaptedQuery.optimizations).toContain('added_limit');
            expect(adaptedQuery.estimatedComplexity).toBeLessThan(100);
        });

        it('should handle battery optimization triggers', async () => {
            // Mock battery API
            Object.defineProperty(navigator, 'getBattery', {
                value: () => Promise.resolve({
                    level: 0.15,           // 15% battery
                    charging: false,
                    chargingTime: Infinity,
                    dischargingTime: 3600  // 1 hour remaining
                }),
                configurable: true
            });
            
            const batteryStatus = await performanceOptimizer.checkBatteryStatus();
            expect(batteryStatus.isSuccess).toBe(true);
            
            const status = batteryStatus.getValue();
            expect(status.level).toBe(0.15);
            expect(status.powerSavingMode).toBe(true);
            
            // Should apply power-saving optimizations
            const optimizations = await performanceOptimizer.applyPowerSavingMode();
            expect(optimizations.isSuccess).toBe(true);
            
            const applied = optimizations.getValue();
            expect(applied.reducedAnimations).toBe(true);
            expect(applied.limitedBackgroundProcessing).toBe(true);
        });
    });

    describe('Memory Management on Mobile', () => {
        it('should implement effective garbage collection strategies', async () => {
            // Create memory-intensive objects
            const largeObjects = [];
            for (let i = 0; i < 1000; i++) {
                largeObjects.push({
                    id: i,
                    data: new Array(1000).fill(`test-data-${i}`)
                });
            }
            
            const initialMemory = performance.memory?.usedJSHeapSize || 0;
            
            // Trigger cleanup
            const cleanupResult = await performanceOptimizer.performMemoryCleanup();
            expect(cleanupResult.isSuccess).toBe(true);
            
            // Clear references and force GC
            largeObjects.length = 0;
            
            if (global.gc) {
                global.gc();
            }
            
            const finalMemory = performance.memory?.usedJSHeapSize || 0;
            const cleanup = cleanupResult.getValue();
            
            expect(cleanup.itemsCleared).toBeGreaterThan(0);
            expect(cleanup.memoryFreed).toBeGreaterThan(0);
        });

        it('should handle memory pressure warnings', async () => {
            let memoryWarningTriggered = false;
            
            performanceOptimizer.onMemoryPressure((level: string) => {
                memoryWarningTriggered = true;
                expect(['low', 'moderate', 'critical']).toContain(level);
            });
            
            // Simulate memory pressure
            const mockMemoryPressure = {
                usedJSHeapSize: 90 * 1024 * 1024,   // 90MB
                totalJSHeapSize: 100 * 1024 * 1024, // 100MB
                jsHeapSizeLimit: 100 * 1024 * 1024  // 100MB limit
            };
            
            Object.defineProperty(performance, 'memory', {
                value: mockMemoryPressure,
                configurable: true
            });
            
            await performanceOptimizer.checkMemoryStatus();
            
            // Should have triggered memory pressure handling
            expect(memoryWarningTriggered).toBe(true);
        });

        it('should implement cache eviction policies for mobile', async () => {
            // Fill cache with test data
            const cacheData = new Map();
            for (let i = 0; i < 100; i++) {
                cacheData.set(`key-${i}`, {
                    data: `value-${i}`,
                    timestamp: Date.now() - (i * 1000), // Vary timestamps
                    size: 1024 // 1KB each
                });
            }
            
            const evictionResult = await performanceOptimizer.evictCacheForMobile(
                cacheData,
                50 * 1024 // Target: 50KB max
            );
            
            expect(evictionResult.isSuccess).toBe(true);
            
            const eviction = evictionResult.getValue();
            expect(eviction.evictedItems).toBeGreaterThan(0);
            expect(eviction.finalCacheSize).toBeLessThanOrEqual(50 * 1024);
            expect(eviction.strategy).toBe('lru'); // Least Recently Used
        });

        it('should handle out-of-memory conditions gracefully', async () => {
            const oomHandler = jest.fn();
            performanceOptimizer.onOutOfMemory(oomHandler);
            
            try {
                // Simulate OOM by creating large objects
                const memoryEaters = [];
                for (let i = 0; i < 10000; i++) {
                    memoryEaters.push(new Array(100000).fill(i));
                }
                
                // This might trigger OOM handling
                await performanceOptimizer.handleLargeDataSet(memoryEaters);
                
            } catch (error) {
                // OOM might manifest as an exception
                if (error.message.includes('memory') || error.message.includes('heap')) {
                    expect(oomHandler).toHaveBeenCalled();
                }
            }
        });
    });

    describe('Mobile UI Adaptation', () => {
        it('should adapt modal sizes for different screen sizes', () => {
            const screenSizes = [
                { width: 320, height: 568, name: 'iPhone SE' },
                { width: 375, height: 667, name: 'iPhone 8' },
                { width: 414, height: 896, name: 'iPhone XR' },
                { width: 768, height: 1024, name: 'iPad' }
            ];
            
            screenSizes.forEach(screen => {
                Object.defineProperty(window, 'innerWidth', {
                    value: screen.width,
                    configurable: true
                });
                Object.defineProperty(window, 'innerHeight', {
                    value: screen.height,
                    configurable: true
                });
                
                const adaptedDimensions = modalAdapter.adaptModalDimensions({
                    width: 600,
                    height: 400
                });
                
                expect(adaptedDimensions.width).toBeLessThanOrEqual(screen.width * 0.9);
                expect(adaptedDimensions.height).toBeLessThanOrEqual(screen.height * 0.8);
                
                // Tablet should have larger modals than phones
                if (screen.name === 'iPad') {
                    expect(adaptedDimensions.width).toBeGreaterThan(400);
                }
            });
        });

        it('should handle safe area insets on iOS', () => {
            // Mock CSS global for browser environment
            const mockCSS = {
                supports: (property: string) => property.includes('safe-area')
            };
            
            Object.defineProperty(global, 'CSS', {
                value: mockCSS,
                configurable: true
            });
            
            const mockComputedStyle = {
                getPropertyValue: (prop: string) => {
                    const safeAreaMap: {[key: string]: string} = {
                        'env(safe-area-inset-top)': '44px',
                        'env(safe-area-inset-bottom)': '34px',
                        'env(safe-area-inset-left)': '0px',
                        'env(safe-area-inset-right)': '0px'
                    };
                    return safeAreaMap[prop] || '0px';
                }
            };
            
            Object.defineProperty(window, 'getComputedStyle', {
                value: () => mockComputedStyle,
                configurable: true
            });
            
            const safeAreaInsets = modalAdapter.getSafeAreaInsets();
            
            expect(safeAreaInsets.top).toBe(44);
            expect(safeAreaInsets.bottom).toBe(34);
            expect(safeAreaInsets.left).toBe(0);
            expect(safeAreaInsets.right).toBe(0);
            
            // Modal positioning should account for safe areas
            const adjustedPosition = modalAdapter.adjustForSafeArea({
                top: 0,
                left: 0,
                width: 300,
                height: 200
            });
            
            expect(adjustedPosition.top).toBeGreaterThanOrEqual(44);
        });

        it('should implement responsive touch targets', () => {
            const touchTargets = [
                { size: 32, expected: 44 },  // Should increase to minimum
                { size: 44, expected: 44 },  // Already at minimum
                { size: 60, expected: 60 }   // Already above minimum
            ];
            
            touchTargets.forEach(({ size, expected }) => {
                const adjustedSize = modalAdapter.ensureMinimumTouchTarget(size);
                expect(adjustedSize).toBeGreaterThanOrEqual(expected);
            });
        });
    });

    describe('Network Optimization for Mobile', () => {
        it('should implement adaptive loading based on connection', async () => {
            // Mock different connection types
            const connections = [
                { type: '4g', downlink: 10, effectiveType: '4g' },
                { type: '3g', downlink: 1.5, effectiveType: '3g' },
                { type: '2g', downlink: 0.25, effectiveType: '2g' }
            ];
            
            for (const conn of connections) {
                Object.defineProperty(navigator, 'connection', {
                    value: conn,
                    configurable: true
                });
                
                const loadingStrategy = await performanceOptimizer.getLoadingStrategy();
                expect(loadingStrategy.isSuccess).toBe(true);
                
                const strategy = loadingStrategy.getValue();
                
                if (conn.effectiveType === '2g') {
                    expect(strategy.preloadImages).toBe(false);
                    expect(strategy.batchSize).toBeLessThanOrEqual(5);
                } else if (conn.effectiveType === '4g') {
                    expect(strategy.preloadImages).toBe(true);
                    expect(strategy.batchSize).toBeGreaterThan(10);
                }
            }
        });

        it('should handle offline scenarios', async () => {
            // Mock offline state
            Object.defineProperty(navigator, 'onLine', {
                value: false,
                configurable: true
            });
            
            const offlineStrategy = await performanceOptimizer.handleOfflineMode();
            expect(offlineStrategy.isSuccess).toBe(true);
            
            const strategy = offlineStrategy.getValue();
            expect(strategy.cacheFirst).toBe(true);
            expect(strategy.queueRequests).toBe(true);
            expect(strategy.showOfflineUI).toBe(true);
        });
    });
});