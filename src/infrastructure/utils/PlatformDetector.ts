/**
 * Platform Information
 */
export interface PlatformInfo {
    /** Is running on mobile device */
    isMobile: boolean;
    /** Is running on iOS */
    isIOS: boolean;
    /** Is running on Android */
    isAndroid: boolean;
    /** Is running on tablet */
    isTablet: boolean;
    /** Is running on desktop */
    isDesktop: boolean;
    /** Is touch-enabled device */
    hasTouch: boolean;
    /** Screen width in pixels */
    screenWidth: number;
    /** Screen height in pixels */
    screenHeight: number;
    /** Device pixel ratio */
    devicePixelRatio: number;
    /** Available memory (if supported) */
    memory?: number;
    /** Connection type (if supported) */
    connection?: string;
    /** Is running in Obsidian mobile app */
    isObsidianMobile: boolean;
    /** Operating system */
    os: 'ios' | 'android' | 'macos' | 'windows' | 'linux' | 'unknown';
}

/**
 * Platform Detector
 * Detects device capabilities and platform-specific features
 */
export class PlatformDetector {
    private static cachedInfo?: PlatformInfo;

    /**
     * Get platform information with caching
     */
    public static getPlatformInfo(): PlatformInfo {
        if (!this.cachedInfo) {
            this.cachedInfo = this.detectPlatform();
        }
        return this.cachedInfo;
    }

    /**
     * Check if running on mobile device
     */
    public static isMobile(): boolean {
        return this.getPlatformInfo().isMobile;
    }

    /**
     * Check if running on iOS
     */
    public static isIOS(): boolean {
        return this.getPlatformInfo().isIOS;
    }

    /**
     * Check if running on Android
     */
    public static isAndroid(): boolean {
        return this.getPlatformInfo().isAndroid;
    }

    /**
     * Check if touch is available
     */
    public static hasTouch(): boolean {
        return this.getPlatformInfo().hasTouch;
    }

    /**
     * Check if running in Obsidian mobile app
     */
    public static isObsidianMobile(): boolean {
        return this.getPlatformInfo().isObsidianMobile;
    }

    /**
     * Check if running on tablet device
     */
    public static isTablet(): boolean {
        return this.getPlatformInfo().isTablet;
    }

    /**
     * Check if device has limited memory
     */
    public static hasLimitedMemory(): boolean {
        const info = this.getPlatformInfo();
        return info.isMobile || (info.memory !== undefined && info.memory < 4096); // < 4GB
    }

    /**
     * Check if should use mobile optimizations
     */
    public static shouldUseMobileOptimizations(): boolean {
        const info = this.getPlatformInfo();
        return info.isMobile || info.isTablet || this.hasLimitedMemory();
    }

    /**
     * Get recommended batch size based on device capabilities
     */
    public static getRecommendedBatchSize(): number {
        const info = this.getPlatformInfo();
        
        if (info.isMobile) {
            return 25; // Small batches for mobile
        }
        
        if (info.isTablet) {
            return 50; // Medium batches for tablets
        }
        
        if (info.memory && info.memory < 8192) { // < 8GB
            return 75;
        }
        
        return 100; // Large batches for powerful devices
    }

    /**
     * Get recommended cache size based on memory constraints
     */
    public static getRecommendedCacheSize(): number {
        const info = this.getPlatformInfo();
        
        if (info.isMobile) {
            return 100; // Small cache for mobile
        }
        
        if (info.isTablet) {
            return 250; // Medium cache for tablets
        }
        
        if (info.memory && info.memory < 8192) {
            return 500;
        }
        
        return 1000; // Large cache for powerful devices
    }

    /**
     * Check if virtual scrolling should be enabled
     */
    public static shouldUseVirtualScrolling(itemCount: number): boolean {
        const info = this.getPlatformInfo();
        
        if (info.isMobile && itemCount > 50) {
            return true;
        }
        
        if (info.isTablet && itemCount > 100) {
            return true;
        }
        
        return itemCount > 200;
    }

    /**
     * Force refresh of platform detection
     */
    public static refresh(): void {
        this.cachedInfo = undefined;
    }

    private static detectPlatform(): PlatformInfo {
        const userAgent = navigator.userAgent.toLowerCase();
        const platform = navigator.platform?.toLowerCase() || '';
        
        // Detect operating system
        let os: PlatformInfo['os'] = 'unknown';
        if (/iphone|ipad|ipod/.test(userAgent)) {
            os = 'ios';
        } else if (/android/.test(userAgent)) {
            os = 'android';
        } else if (/mac/.test(platform)) {
            os = 'macos';
        } else if (/win/.test(platform)) {
            os = 'windows';
        } else if (/linux/.test(platform)) {
            os = 'linux';
        }

        // Detect mobile devices
        const isMobileUA = /mobile|android|iphone|ipad|phone|blackberry|opera mini|iemobile|wpdesktop/.test(userAgent);
        const isTabletUA = /tablet|ipad|playbook|silk/.test(userAgent);
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0;
        
        // More sophisticated mobile detection
        const isSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 768;
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);
        
        // Detect if running in mobile app (heuristics)
        const isObsidianMobile = this.detectObsidianMobile();
        
        const isMobile = isMobileUA || (isSmallScreen && isTouchDevice) || isObsidianMobile;
        const isTablet = isTabletUA && !isMobile;
        const isDesktop = !isMobile && !isTablet;

        // Get memory information if available
        let memory: number | undefined;
        const memoryInfo = (navigator as any).deviceMemory || (performance as any).memory?.jsHeapSizeLimit;
        if (memoryInfo) {
            memory = typeof memoryInfo === 'number' ? memoryInfo : memoryInfo / 1024 / 1024;
        }

        // Get connection information if available
        let connection: string | undefined;
        const connectionInfo = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        if (connectionInfo) {
            connection = connectionInfo.effectiveType || connectionInfo.type;
        }

        return {
            isMobile,
            isIOS,
            isAndroid,
            isTablet,
            isDesktop,
            hasTouch: isTouchDevice,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio || 1,
            memory,
            connection,
            isObsidianMobile,
            os
        };
    }

    private static detectObsidianMobile(): boolean {
        // Check for Obsidian mobile app indicators
        
        // Check for Capacitor (which Obsidian mobile uses)
        if ((window as any).Capacitor) {
            return true;
        }
        
        // Check for mobile-specific Obsidian APIs
        if ((window as any).ObsidianMobile) {
            return true;
        }
        
        // Check user agent for Obsidian mobile
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('obsidian') && (userAgent.includes('mobile') || userAgent.includes('ios') || userAgent.includes('android'))) {
            return true;
        }
        
        // Check for file system access patterns typical of mobile apps
        const hasFileSystemAccess = 'showOpenFilePicker' in window || 'webkitRequestFileSystem' in window;
        const isMobileEnvironment = /mobile|android|iphone|ipad/.test(userAgent);
        
        if (!hasFileSystemAccess && isMobileEnvironment) {
            return true;
        }
        
        // Check for specific mobile app characteristics
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
        
        if ((isStandalone || isFullscreen) && isMobileEnvironment) {
            return true;
        }
        
        return false;
    }

    /**
     * Get CSS media query for mobile detection
     */
    public static getMobileMediaQuery(): string {
        return '(max-width: 768px), (pointer: coarse)';
    }

    /**
     * Get CSS media query for touch detection
     */
    public static getTouchMediaQuery(): string {
        return '(pointer: coarse)';
    }

    /**
     * Check if reduced motion is preferred
     */
    public static prefersReducedMotion(): boolean {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Check if dark mode is preferred
     */
    public static prefersDarkMode(): boolean {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    /**
     * Get safe area insets (for devices with notches)
     */
    public static getSafeAreaInsets(): {
        top: number;
        right: number;
        bottom: number;
        left: number;
    } {
        const style = getComputedStyle(document.documentElement);
        
        return {
            top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0', 10),
            right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0', 10),
            bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0', 10),
            left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0', 10)
        };
    }

    /**
     * Create a media query listener for platform changes
     */
    public static createPlatformListener(callback: (info: PlatformInfo) => void): () => void {
        const mediaQueries = [
            window.matchMedia('(max-width: 768px)'),
            window.matchMedia('(orientation: portrait)'),
            window.matchMedia('(pointer: coarse)')
        ];

        const handleChange = () => {
            this.refresh();
            callback(this.getPlatformInfo());
        };

        mediaQueries.forEach(mq => mq.addEventListener('change', handleChange));

        // Return cleanup function
        return () => {
            mediaQueries.forEach(mq => mq.removeEventListener('change', handleChange));
        };
    }
}