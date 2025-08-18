import { PlatformDetector } from '../../../../src/infrastructure/utils/PlatformDetector';

// Mock global objects and functions
const mockUserAgent = (ua: string) => {
    Object.defineProperty(navigator, 'userAgent', {
        value: ua,
        configurable: true
    });
};

const mockPlatform = (platform: string) => {
    Object.defineProperty(navigator, 'platform', {
        value: platform,
        configurable: true
    });
};

const mockWindow = (properties: Partial<Window>) => {
    Object.assign(window, properties);
};

const mockMatchMedia = (matches: boolean) => {
    // Remove existing property first if it exists
    if ('matchMedia' in window) {
        delete (window as any).matchMedia;
    }
    
    // Use a more robust approach to set matchMedia
    const mockFn = jest.fn(() => ({
        matches,
        media: '',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
    }));
    
    try {
        Object.defineProperty(window, 'matchMedia', {
            value: mockFn,
            configurable: true,
            writable: true
        });
    } catch (error) {
        // Fallback: direct assignment
        (window as any).matchMedia = mockFn;
    }
};

describe('PlatformDetector', () => {
    const originalUserAgent = navigator.userAgent;
    const originalPlatform = navigator.platform;
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    const originalMatchMedia = window.matchMedia;

    beforeEach(() => {
        // Reset cached info before each test
        PlatformDetector.refresh();
        
        // Reset window dimensions
        Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
        Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true });
        
        // Remove any existing matchMedia before setting new one
        delete (window as any).matchMedia;
        
        // Reset matchMedia
        mockMatchMedia(false);
    });

    afterEach(() => {
        // Restore original values
        Object.defineProperty(navigator, 'userAgent', { value: originalUserAgent, configurable: true });
        Object.defineProperty(navigator, 'platform', { value: originalPlatform, configurable: true });
        Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, configurable: true });
        Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, configurable: true });
        
        // Restore original matchMedia if it existed
        if (originalMatchMedia) {
            (window as any).matchMedia = originalMatchMedia;
        } else {
            delete (window as any).matchMedia;
        }
    });

    describe('iOS detection', () => {
        it('should detect iPhone', () => {
            mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15');
            PlatformDetector.refresh();
            
            const info = PlatformDetector.getPlatformInfo();
            expect(info.isIOS).toBe(true);
            expect(info.isMobile).toBe(true);
            expect(info.os).toBe('ios');
        });

        it('should detect iPad', () => {
            mockUserAgent('Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1 tablet');
            Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
            Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true });
            // Remove mobile indicators
            delete (window as any).ontouchstart;
            Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true });
            PlatformDetector.refresh();
            
            const info = PlatformDetector.getPlatformInfo();
            expect(info.isIOS).toBe(true);
            expect(info.isTablet).toBe(true);
            expect(info.os).toBe('ios');
        });

        it('should detect iPod', () => {
            mockUserAgent('Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15');
            PlatformDetector.refresh();
            
            const info = PlatformDetector.getPlatformInfo();
            expect(info.isIOS).toBe(true);
            expect(info.isMobile).toBe(true);
            expect(info.os).toBe('ios');
        });
    });

    describe('Android detection', () => {
        it('should detect Android phone', () => {
            mockUserAgent('Mozilla/5.0 (Linux; Android 11; SM-G973F) AppleWebKit/537.36');
            PlatformDetector.refresh();
            
            const info = PlatformDetector.getPlatformInfo();
            expect(info.isAndroid).toBe(true);
            expect(info.isMobile).toBe(true);
            expect(info.os).toBe('android');
        });

        it('should detect Android tablet', () => {
            mockUserAgent('Mozilla/5.0 (Linux; Android 11; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Safari/537.36 tablet');
            Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
            Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true });
            // Remove mobile indicators
            delete (window as any).ontouchstart;
            Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true });
            PlatformDetector.refresh();
            
            const info = PlatformDetector.getPlatformInfo();
            expect(info.isAndroid).toBe(true);
            expect(info.isTablet).toBe(true);
            expect(info.os).toBe('android');
        });
    });

    describe('Desktop OS detection', () => {
        it('should detect macOS', () => {
            mockUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
            mockPlatform('MacIntel');
            Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true });
            Object.defineProperty(window, 'innerHeight', { value: 1080, configurable: true });
            // Remove touch capabilities for desktop
            delete (window as any).ontouchstart;
            Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true });
            PlatformDetector.refresh();
            
            const info = PlatformDetector.getPlatformInfo();
            expect(info.os).toBe('macos');
            expect(info.isDesktop).toBe(true);
            expect(info.isMobile).toBe(false);
        });

        it('should detect Windows', () => {
            mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            mockPlatform('Win32');
            Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true });
            Object.defineProperty(window, 'innerHeight', { value: 1080, configurable: true });
            // Remove touch capabilities for desktop
            delete (window as any).ontouchstart;
            Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true });
            PlatformDetector.refresh();
            
            const info = PlatformDetector.getPlatformInfo();
            expect(info.os).toBe('windows');
            expect(info.isDesktop).toBe(true);
        });

        it('should detect Linux', () => {
            mockUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36');
            mockPlatform('Linux x86_64');
            Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true });
            Object.defineProperty(window, 'innerHeight', { value: 1080, configurable: true });
            // Remove touch capabilities for desktop
            delete (window as any).ontouchstart;
            Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true });
            PlatformDetector.refresh();
            
            const info = PlatformDetector.getPlatformInfo();
            expect(info.os).toBe('linux');
            expect(info.isDesktop).toBe(true);
        });
    });

    describe('Touch detection', () => {
        it('should detect touch support via ontouchstart', () => {
            Object.defineProperty(window, 'ontouchstart', { value: null, configurable: true });
            PlatformDetector.refresh();
            
            const info = PlatformDetector.getPlatformInfo();
            expect(info.hasTouch).toBe(true);
        });

        it('should detect touch support via maxTouchPoints', () => {
            Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, configurable: true });
            PlatformDetector.refresh();
            
            const info = PlatformDetector.getPlatformInfo();
            expect(info.hasTouch).toBe(true);
        });

        it('should detect no touch support', () => {
            // Ensure no touch properties are set
            delete (window as any).ontouchstart;
            Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true });
            PlatformDetector.refresh();
            
            const info = PlatformDetector.getPlatformInfo();
            expect(info.hasTouch).toBe(false);
        });
    });

    describe('Screen size detection', () => {
        it('should detect small screen as mobile', () => {
            Object.defineProperty(window, 'innerWidth', { value: 320, configurable: true });
            Object.defineProperty(window, 'innerHeight', { value: 568, configurable: true });
            Object.defineProperty(window, 'ontouchstart', { value: null, configurable: true });
            PlatformDetector.refresh();
            
            const info = PlatformDetector.getPlatformInfo();
            expect(info.isMobile).toBe(true);
            expect(info.screenWidth).toBe(320);
            expect(info.screenHeight).toBe(568);
        });

        it('should detect large screen as desktop', () => {
            Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true });
            Object.defineProperty(window, 'innerHeight', { value: 1080, configurable: true });
            PlatformDetector.refresh();
            
            const info = PlatformDetector.getPlatformInfo();
            expect(info.isDesktop).toBe(true);
            expect(info.screenWidth).toBe(1920);
            expect(info.screenHeight).toBe(1080);
        });
    });

    describe('Obsidian Mobile detection', () => {
        it('should detect Capacitor', () => {
            (window as any).Capacitor = {};
            PlatformDetector.refresh();
            
            const info = PlatformDetector.getPlatformInfo();
            expect(info.isObsidianMobile).toBe(true);
            
            delete (window as any).Capacitor;
        });

        it('should detect ObsidianMobile flag', () => {
            (window as any).ObsidianMobile = true;
            PlatformDetector.refresh();
            
            const info = PlatformDetector.getPlatformInfo();
            expect(info.isObsidianMobile).toBe(true);
            
            delete (window as any).ObsidianMobile;
        });

        it('should detect Obsidian mobile user agent', () => {
            mockUserAgent('Mozilla/5.0 (Linux; Android 11) obsidian mobile app');
            PlatformDetector.refresh();
            
            const info = PlatformDetector.getPlatformInfo();
            expect(info.isObsidianMobile).toBe(true);
        });

        it('should detect standalone mode on mobile', () => {
            mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)');
            
            // Remove existing matchMedia first
            delete (window as any).matchMedia;
            
            // Set up matchMedia for standalone mode test
            const mockFn = jest.fn((query: string) => ({
                matches: query.includes('standalone'),
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn()
            }));
            
            (window as any).matchMedia = mockFn;
            PlatformDetector.refresh();
            
            const info = PlatformDetector.getPlatformInfo();
            expect(info.isObsidianMobile).toBe(true);
        });
    });

    describe('Memory detection', () => {
        it('should detect device memory', () => {
            Object.defineProperty(navigator, 'deviceMemory', { value: 4, configurable: true });
            PlatformDetector.refresh();
            
            const info = PlatformDetector.getPlatformInfo();
            expect(info.memory).toBe(4);
        });

        it('should detect memory from performance API', () => {
            delete (navigator as any).deviceMemory;
            (performance as any).memory = { jsHeapSizeLimit: 4 * 1024 * 1024 * 1024 }; // 4GB in bytes
            PlatformDetector.refresh();
            
            const info = PlatformDetector.getPlatformInfo();
            expect(info.memory).toBe(4 * 1024 * 1024 * 1024); // Should be raw value
        });
    });

    describe('Connection detection', () => {
        it('should detect connection type', () => {
            (navigator as any).connection = { effectiveType: '4g' };
            PlatformDetector.refresh();
            
            const info = PlatformDetector.getPlatformInfo();
            expect(info.connection).toBe('4g');
            
            delete (navigator as any).connection;
        });

        it('should detect webkit connection', () => {
            (navigator as any).webkitConnection = { type: 'wifi' };
            PlatformDetector.refresh();
            
            const info = PlatformDetector.getPlatformInfo();
            expect(info.connection).toBe('wifi');
            
            delete (navigator as any).webkitConnection;
        });
    });

    describe('Utility methods', () => {
        it('should detect mobile correctly', () => {
            mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)');
            PlatformDetector.refresh();
            
            expect(PlatformDetector.isMobile()).toBe(true);
        });

        it('should detect iOS correctly', () => {
            mockUserAgent('Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)');
            PlatformDetector.refresh();
            
            expect(PlatformDetector.isIOS()).toBe(true);
        });

        it('should detect Android correctly', () => {
            mockUserAgent('Mozilla/5.0 (Linux; Android 11; SM-G973F)');
            PlatformDetector.refresh();
            
            expect(PlatformDetector.isAndroid()).toBe(true);
        });

        it('should detect touch correctly', () => {
            Object.defineProperty(window, 'ontouchstart', { value: null, configurable: true });
            PlatformDetector.refresh();
            
            expect(PlatformDetector.hasTouch()).toBe(true);
        });

        it('should detect limited memory', () => {
            Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });
            mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)');
            PlatformDetector.refresh();
            
            expect(PlatformDetector.hasLimitedMemory()).toBe(true);
        });

        it('should recommend mobile optimizations', () => {
            mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)');
            PlatformDetector.refresh();
            
            expect(PlatformDetector.shouldUseMobileOptimizations()).toBe(true);
        });
    });

    describe('Recommendation methods', () => {
        it('should recommend smaller batch size for mobile', () => {
            mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)');
            PlatformDetector.refresh();
            
            const batchSize = PlatformDetector.getRecommendedBatchSize();
            expect(batchSize).toBe(25);
        });

        it('should recommend larger batch size for desktop', () => {
            mockUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
            mockPlatform('MacIntel');
            Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true });
            Object.defineProperty(window, 'innerHeight', { value: 1080, configurable: true });
            // Remove touch capabilities for desktop
            delete (window as any).ontouchstart;
            Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true });
            // Set high memory to qualify for 100 batch size
            Object.defineProperty(navigator, 'deviceMemory', { value: 8, configurable: true }); // 8GB = 8192MB
            PlatformDetector.refresh();
            
            const batchSize = PlatformDetector.getRecommendedBatchSize();
            expect(batchSize).toBe(100);
        });

        it('should recommend smaller cache size for mobile', () => {
            mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)');
            PlatformDetector.refresh();
            
            const cacheSize = PlatformDetector.getRecommendedCacheSize();
            expect(cacheSize).toBe(100);
        });

        it('should recommend virtual scrolling for large lists on mobile', () => {
            mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)');
            PlatformDetector.refresh();
            
            expect(PlatformDetector.shouldUseVirtualScrolling(100)).toBe(true);
            expect(PlatformDetector.shouldUseVirtualScrolling(25)).toBe(false);
        });
    });

    describe('Media queries', () => {
        it('should provide mobile media query', () => {
            const query = PlatformDetector.getMobileMediaQuery();
            expect(query).toContain('max-width');
            expect(query).toContain('pointer: coarse');
        });

        it('should provide touch media query', () => {
            const query = PlatformDetector.getTouchMediaQuery();
            expect(query).toBe('(pointer: coarse)');
        });

        it('should detect reduced motion preference', () => {
            delete (window as any).matchMedia;
            
            const mockFn = jest.fn((query: string) => ({
                matches: query.includes('prefers-reduced-motion'),
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn()
            }));
            
            (window as any).matchMedia = mockFn;
            
            expect(PlatformDetector.prefersReducedMotion()).toBe(true);
        });

        it('should detect dark mode preference', () => {
            delete (window as any).matchMedia;
            
            const mockFn = jest.fn((query: string) => ({
                matches: query.includes('prefers-color-scheme: dark'),
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn()
            }));
            
            (window as any).matchMedia = mockFn;
            
            expect(PlatformDetector.prefersDarkMode()).toBe(true);
        });
    });

    describe('Safe area insets', () => {
        it('should get safe area insets', () => {
            // Mock getComputedStyle
            Object.defineProperty(window, 'getComputedStyle', {
                value: jest.fn(() => ({
                    getPropertyValue: jest.fn((prop: string) => {
                        if (prop.includes('safe-area-inset-top')) return '44px';
                        if (prop.includes('safe-area-inset-bottom')) return '34px';
                        if (prop.includes('safe-area-inset-left')) return '0px';
                        if (prop.includes('safe-area-inset-right')) return '0px';
                        return '0px';
                    })
                })),
                configurable: true
            });
            
            const insets = PlatformDetector.getSafeAreaInsets();
            expect(insets).toEqual({
                top: 44,
                right: 0,
                bottom: 34,
                left: 0
            });
        });
    });

    describe('Platform listener', () => {
        it('should create and cleanup platform listener', () => {
            const callback = jest.fn();
            const cleanup = PlatformDetector.createPlatformListener(callback);
            
            expect(typeof cleanup).toBe('function');
            
            // Cleanup should not throw
            expect(() => cleanup()).not.toThrow();
        });
    });

    describe('Caching', () => {
        it('should cache platform info', () => {
            const info1 = PlatformDetector.getPlatformInfo();
            const info2 = PlatformDetector.getPlatformInfo();
            
            expect(info1).toBe(info2); // Should be the same object reference
        });

        it('should refresh cached info', () => {
            const info1 = PlatformDetector.getPlatformInfo();
            PlatformDetector.refresh();
            const info2 = PlatformDetector.getPlatformInfo();
            
            expect(info1).not.toBe(info2); // Should be different object references
        });
    });
});