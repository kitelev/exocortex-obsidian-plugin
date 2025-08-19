/**
 * Mobile Test Environment Setup
 * Configures Jest environment for mobile testing scenarios
 */

import { MobileTestUtils } from './__mocks__/obsidian';

// Memory-optimized mobile test setup
beforeAll(() => {
    // Skip mobile setup in CI to save memory
    if (process.env.CI && !process.env.FORCE_MOBILE_TESTS) {
        console.log('Skipping mobile setup in CI for memory optimization');
        return;
    }
    
    // Set default mobile environment for mobile tests only
    if (process.env.JEST_WORKER_ID && !process.env.TEST_PLATFORM) {
        process.env.TEST_PLATFORM = 'mobile';
    }
    
    // Minimal DOM setup for mobile (only if needed)
    if (typeof TextEncoder !== 'undefined') {
        Object.defineProperty(global, 'TextEncoder', {
            value: TextEncoder,
            configurable: true
        });
    }
    
    if (typeof TextDecoder !== 'undefined') {
        Object.defineProperty(global, 'TextDecoder', {
            value: TextDecoder,
            configurable: true
        });
    }
    
    // Lightweight RAF mock
    if (!global.requestAnimationFrame) {
        global.requestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
            return setTimeout(() => callback(Date.now()), 16);
        }) as any;
    }
    
    if (!global.cancelAnimationFrame) {
        global.cancelAnimationFrame = jest.fn((id: number) => {
            clearTimeout(id);
        });
    }
    
    // Lightweight performance.now mock
    if (!global.performance?.now) {
        if (!global.performance) global.performance = {} as any;
        global.performance.now = jest.fn(() => Date.now());
    }
    
    // Mock requestIdleCallback and cancelIdleCallback
    if (!global.requestIdleCallback) {
        global.requestIdleCallback = jest.fn((callback: IdleRequestCallback, options?: IdleRequestOptions) => {
            const id = setTimeout(() => {
                callback({
                    timeRemaining: () => options?.timeout ? Math.max(0, options.timeout - 50) : 5,
                    didTimeout: false
                });
            }, 0);
            return id;
        }) as any;
    }
    
    if (!global.cancelIdleCallback) {
        global.cancelIdleCallback = jest.fn((id: number) => {
            clearTimeout(id);
        });
    }
    
    // Mock File API for mobile image optimization tests
    if (!global.File) {
        global.File = class MockFile {
            name: string;
            type: string;
            size: number;
            lastModified: number;
            
            constructor(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag) {
                this.name = fileName;
                this.type = options?.type || '';
                this.size = fileBits.reduce((total, part) => {
                    if (typeof part === 'string') return total + part.length;
                    if (part instanceof ArrayBuffer) return total + part.byteLength;
                    return total + part.size;
                }, 0);
                this.lastModified = options?.lastModified || Date.now();
            }
        } as any;
    }
    
    // Mock Blob API
    if (!global.Blob) {
        global.Blob = class MockBlob {
            size: number;
            type: string;
            
            constructor(blobParts?: BlobPart[], options?: BlobPropertyBag) {
                this.type = options?.type || '';
                this.size = blobParts?.reduce((total, part) => {
                    if (typeof part === 'string') return total + part.length;
                    if (part instanceof ArrayBuffer) return total + part.byteLength;
                    return total;
                }, 0) || 0;
            }
        } as any;
    }
    
    // Enable garbage collection if available for memory tests
    if (typeof global.gc === 'function') {
        global.gc();
    }
});

// Enhanced mobile test helpers
export class MobileTestEnvironment {
    private static originalEnv: { [key: string]: any } = {};
    
    /**
     * Set up iOS testing environment
     */
    static setupiOS() {
        MobileTestUtils.setPlatform('ios');
        
        // Mock iOS-specific APIs
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
            configurable: true
        });
        
        // Mock haptic feedback
        Object.defineProperty(navigator, 'vibrate', {
            value: jest.fn(() => true),
            configurable: true,
            writable: true
        });
        
        // Mock safe area support
        if (window.CSS) {
            window.CSS.supports = jest.fn((property: string) => 
                property.includes('safe-area') || property.includes('env(')
            );
        }
        
        return this.createCleanupFunction();
    }
    
    /**
     * Set up Android testing environment
     */
    static setupAndroid() {
        MobileTestUtils.setPlatform('android');
        
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 Chrome/96.0.4664.45 Mobile Safari/537.36',
            configurable: true
        });
        
        // Mock Android-specific capabilities
        MobileTestUtils.mockDeviceCapabilities({
            vibration: true,
            geolocation: true,
            memory: 4
        });
        
        return this.createCleanupFunction();
    }
    
    /**
     * Set up tablet testing environment
     */
    static setupTablet() {
        MobileTestUtils.setPlatform('tablet');
        
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
            configurable: true
        });
        
        // Mock larger screen dimensions
        Object.defineProperty(window, 'innerWidth', {
            value: 768,
            configurable: true
        });
        Object.defineProperty(window, 'innerHeight', {
            value: 1024,
            configurable: true
        });
        
        return this.createCleanupFunction();
    }
    
    /**
     * Set up low-memory device for testing performance optimizations
     */
    static setupLowMemoryDevice() {
        // Mock low memory conditions
        Object.defineProperty(performance, 'memory', {
            value: {
                usedJSHeapSize: 80 * 1024 * 1024,   // 80MB used
                totalJSHeapSize: 100 * 1024 * 1024, // 100MB total
                jsHeapSizeLimit: 128 * 1024 * 1024  // 128MB limit
            },
            configurable: true
        });
        
        MobileTestUtils.mockDeviceCapabilities({
            memory: 2 // 2GB device memory
        });
        
        return this.createCleanupFunction();
    }
    
    /**
     * Set up slow network connection for testing adaptive loading
     */
    static setupSlowConnection() {
        MobileTestUtils.mockDeviceCapabilities({
            connection: '2g'
        });
        
        Object.defineProperty(navigator, 'onLine', {
            value: true,
            configurable: true
        });
        
        return this.createCleanupFunction();
    }
    
    /**
     * Set up offline environment
     */
    static setupOffline() {
        Object.defineProperty(navigator, 'onLine', {
            value: false,
            configurable: true
        });
        
        // Mock failed network requests
        global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
        
        return this.createCleanupFunction();
    }
    
    /**
     * Mock battery API for power-saving tests
     */
    static setupLowBattery() {
        Object.defineProperty(navigator, 'getBattery', {
            value: () => Promise.resolve({
                level: 0.15,           // 15% battery
                charging: false,
                chargingTime: Infinity,
                dischargingTime: 3600  // 1 hour remaining
            }),
            configurable: true
        });
        
        return this.createCleanupFunction();
    }
    
    /**
     * Create a cleanup function that restores original environment
     */
    private static createCleanupFunction() {
        const currentState = { ...process.env };
        
        return () => {
            // Restore environment variables
            Object.keys(process.env).forEach(key => {
                if (!(key in currentState)) {
                    delete process.env[key];
                } else {
                    process.env[key] = currentState[key];
                }
            });
            
            // Reset mobile test utils
            MobileTestUtils.reset();
            
            // Restore mocked functions
            jest.restoreAllMocks();
        };
    }
    
    /**
     * Simulate device orientation change
     */
    static simulateOrientationChange(orientation: 'portrait' | 'landscape') {
        const angle = orientation === 'portrait' ? 0 : 90;
        
        if (screen.orientation) {
            Object.defineProperty(screen.orientation, 'angle', {
                value: angle,
                configurable: true
            });
            
            Object.defineProperty(screen.orientation, 'type', {
                value: orientation === 'portrait' ? 'portrait-primary' : 'landscape-primary',
                configurable: true
            });
        }
        
        // Swap dimensions for landscape
        if (orientation === 'landscape') {
            const width = window.innerHeight;
            const height = window.innerWidth;
            
            Object.defineProperty(window, 'innerWidth', {
                value: width,
                configurable: true
            });
            Object.defineProperty(window, 'innerHeight', {
                value: height,
                configurable: true
            });
        }
        
        // Dispatch orientation change event
        const event = new Event('orientationchange');
        window.dispatchEvent(event);
    }
    
    /**
     * Mock touch event creation with proper touch list
     */
    static createTouchEvent(
        type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel',
        touches: Array<{ x: number; y: number; id?: number }>,
        target?: Element
    ): TouchEvent {
        return MobileTestUtils.createTouchEvent(type, touches, target);
    }
    
    /**
     * Wait for animation frame with timeout
     */
    static waitForAnimationFrame(maxWait = 1000): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Animation frame timeout'));
            }, maxWait);
            
            requestAnimationFrame(() => {
                clearTimeout(timeout);
                resolve();
            });
        });
    }
    
    /**
     * Simulate memory pressure
     */
    static simulateMemoryPressure(pressureLevel: 'low' | 'moderate' | 'critical' = 'moderate') {
        const memoryLevels = {
            low: {
                usedJSHeapSize: 60 * 1024 * 1024,
                totalJSHeapSize: 100 * 1024 * 1024,
                jsHeapSizeLimit: 128 * 1024 * 1024
            },
            moderate: {
                usedJSHeapSize: 90 * 1024 * 1024,
                totalJSHeapSize: 100 * 1024 * 1024,
                jsHeapSizeLimit: 128 * 1024 * 1024
            },
            critical: {
                usedJSHeapSize: 110 * 1024 * 1024,
                totalJSHeapSize: 120 * 1024 * 1024,
                jsHeapSizeLimit: 128 * 1024 * 1024
            }
        };
        
        Object.defineProperty(performance, 'memory', {
            value: memoryLevels[pressureLevel],
            configurable: true
        });
    }
    
    /**
     * Create a gesture sequence for testing complex interactions
     */
    static createGestureSequence(element: Element) {
        return {
            /**
             * Simulate a tap gesture
             */
            async tap(x: number, y: number) {
                const touchStart = this.createTouchEvent('touchstart', [{ x, y }], element);
                const touchEnd = this.createTouchEvent('touchend', [{ x, y }], element);
                
                element.dispatchEvent(touchStart);
                await new Promise(resolve => setTimeout(resolve, 50));
                element.dispatchEvent(touchEnd);
            },
            
            /**
             * Simulate a double tap gesture
             */
            async doubleTap(x: number, y: number) {
                await this.tap(x, y);
                await new Promise(resolve => setTimeout(resolve, 100));
                await this.tap(x, y);
            },
            
            /**
             * Simulate a long press gesture
             */
            async longPress(x: number, y: number, duration = 600) {
                const touchStart = this.createTouchEvent('touchstart', [{ x, y }], element);
                element.dispatchEvent(touchStart);
                
                await new Promise(resolve => setTimeout(resolve, duration));
                
                const touchEnd = this.createTouchEvent('touchend', [{ x, y }], element);
                element.dispatchEvent(touchEnd);
            },
            
            /**
             * Simulate a pinch gesture
             */
            async pinch(startDistance: number, endDistance: number, centerX = 150, centerY = 150) {
                const halfStart = startDistance / 2;
                const halfEnd = endDistance / 2;
                
                const touchStart = this.createTouchEvent('touchstart', [
                    { x: centerX - halfStart, y: centerY, id: 0 },
                    { x: centerX + halfStart, y: centerY, id: 1 }
                ], element);
                
                element.dispatchEvent(touchStart);
                await new Promise(resolve => setTimeout(resolve, 50));
                
                const touchMove = this.createTouchEvent('touchmove', [
                    { x: centerX - halfEnd, y: centerY, id: 0 },
                    { x: centerX + halfEnd, y: centerY, id: 1 }
                ], element);
                
                element.dispatchEvent(touchMove);
                await new Promise(resolve => setTimeout(resolve, 50));
                
                const touchEnd = this.createTouchEvent('touchend', [], element);
                element.dispatchEvent(touchEnd);
            },
            
            /**
             * Simulate a pan gesture
             */
            async pan(startX: number, startY: number, endX: number, endY: number) {
                const touchStart = this.createTouchEvent('touchstart', [{ x: startX, y: startY }], element);
                element.dispatchEvent(touchStart);
                
                await new Promise(resolve => setTimeout(resolve, 50));
                
                const touchMove = this.createTouchEvent('touchmove', [{ x: endX, y: endY }], element);
                element.dispatchEvent(touchMove);
                
                await new Promise(resolve => setTimeout(resolve, 50));
                
                const touchEnd = this.createTouchEvent('touchend', [], element);
                element.dispatchEvent(touchEnd);
            },
            
            createTouchEvent: MobileTestEnvironment.createTouchEvent
        };
    }
}

// Global cleanup after each test
afterEach(() => {
    // Clean up any hanging timers or animations
    jest.clearAllTimers();
    
    // Reset DOM to clean state
    if (document.body) {
        document.body.innerHTML = '';
    }
    
    // Clear any global event listeners
    if (window.removeEventListener) {
        ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'orientationchange'].forEach(eventType => {
            // Remove all listeners of this type (simplified approach for testing)
            const element = document.createElement('div');
            try {
                element.addEventListener(eventType, () => {});
                element.removeEventListener(eventType, () => {});
            } catch (e) {
                // Ignore errors in cleanup
            }
        });
    }
    
    // Reset mobile test environment
    MobileTestUtils.reset();
    
    // Clear animation frames
    if (typeof cancelAnimationFrame !== 'undefined') {
        // Clear any pending animation frames
        for (let i = 0; i < 100; i++) {
            try {
                cancelAnimationFrame(i);
            } catch (e) {
                // Ignore errors
            }
        }
    }
    
    // Clear idle callbacks
    if (typeof cancelIdleCallback !== 'undefined') {
        for (let i = 0; i < 100; i++) {
            try {
                cancelIdleCallback(i);
            } catch (e) {
                // Ignore errors
            }
        }
    }
    
    // Force garbage collection in tests if available
    if (typeof global.gc === 'function' && !process.env.CI) {
        try {
            global.gc();
        } catch (e) {
            // Ignore GC errors
        }
    }
});

// Export for use in tests
export { MobileTestUtils };