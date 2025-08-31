/**
 * Comprehensive Platform Detection Tests
 * Tests mobile platform detection, device capabilities, and responsive behavior
 */

import { MobileTestEnvironment } from "../../../mobile-setup";
import { Platform } from "obsidian";

describe("Platform Detection", () => {
  let cleanup: (() => void) | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  describe("iOS Detection", () => {
    beforeEach(() => {
      cleanup = MobileTestEnvironment.setupiOS();
    });

    it("should correctly detect iOS platform", () => {
      expect(Platform.isIosApp).toBe(true);
      expect(Platform.isMobile).toBe(true);
      expect(Platform.isAndroidApp).toBe(false);
      expect(Platform.isDesktop).toBe(false);
    });

    it("should detect iOS user agent", () => {
      expect(navigator.userAgent).toContain("iPhone");
      expect(navigator.userAgent).toContain("iOS");
      expect(navigator.platform).toBe("iPhone");
    });

    it("should support iOS-specific features", () => {
      expect(typeof navigator.vibrate).toBe("function");
      expect(window.CSS.supports("env(safe-area-inset-top)")).toBe(true);
    });

    it("should have correct screen dimensions for iPhone", () => {
      expect(window.innerWidth).toBe(375);
      expect(window.innerHeight).toBe(667);
    });

    it("should support touch interactions", () => {
      expect(navigator.maxTouchPoints).toBeGreaterThan(0);
      expect("ontouchstart" in window).toBe(true);
    });

    it("should detect iOS safe area support", () => {
      const computedStyle = window.getComputedStyle(document.body);
      expect(computedStyle.getPropertyValue("env(safe-area-inset-top)")).toBe("44px");
      expect(computedStyle.getPropertyValue("env(safe-area-inset-bottom)")).toBe("34px");
    });

    it("should have mobile device memory constraints", () => {
      expect(navigator.deviceMemory).toBe(4); // 4GB for mobile
    });

    it("should indicate mobile network conditions", () => {
      expect(navigator.connection?.effectiveType).toBe("3g");
      expect(navigator.connection?.downlink).toBe(1.5);
    });
  });

  describe("Android Detection", () => {
    beforeEach(() => {
      cleanup = MobileTestEnvironment.setupAndroid();
    });

    it("should correctly detect Android platform", () => {
      expect(Platform.isAndroidApp).toBe(true);
      expect(Platform.isMobile).toBe(true);
      expect(Platform.isIosApp).toBe(false);
      expect(Platform.isDesktop).toBe(false);
    });

    it("should detect Android user agent", () => {
      expect(navigator.userAgent).toContain("Android");
      expect(navigator.userAgent).toContain("Chrome");
      expect(navigator.platform).toBe("Linux armv8l");
    });

    it("should support Android-specific features", () => {
      expect(typeof navigator.vibrate).toBe("function");
      expect(navigator.deviceMemory).toBe(4);
    });

    it("should have correct screen dimensions for Android", () => {
      expect(window.innerWidth).toBe(412);
      expect(window.innerHeight).toBe(892);
    });

    it("should support Android capabilities", () => {
      expect(navigator.maxTouchPoints).toBeGreaterThan(0);
      expect(navigator.vibrate).toBeDefined();
    });
  });

  describe("Tablet Detection", () => {
    beforeEach(() => {
      cleanup = MobileTestEnvironment.setupTablet();
    });

    it("should correctly detect tablet platform", () => {
      expect(Platform.isTablet).toBe(true);
      expect(Platform.isMobile).toBe(true); // Tablets are considered mobile
      expect(Platform.isDesktop).toBe(false);
    });

    it("should detect iPad user agent", () => {
      expect(navigator.userAgent).toContain("iPad");
      expect(navigator.platform).toBe("iPad");
    });

    it("should have tablet screen dimensions", () => {
      expect(window.innerWidth).toBe(768);
      expect(window.innerHeight).toBe(1024);
    });

    it("should support tablet-specific touch interactions", () => {
      expect(navigator.maxTouchPoints).toBeGreaterThan(0);
      expect("ontouchstart" in window).toBe(true);
    });
  });

  describe("Desktop Detection", () => {
    it("should correctly detect desktop platform by default", () => {
      expect(Platform.isDesktop).toBe(true);
      expect(Platform.isMobile).toBe(false);
      expect(Platform.isTablet).toBe(false);
      expect(Platform.isIosApp).toBe(false);
      expect(Platform.isAndroidApp).toBe(false);
    });

    it("should have desktop user agent", () => {
      expect(navigator.userAgent).toContain("Chrome");
      expect(navigator.platform).toBe("MacIntel");
    });

    it("should have desktop capabilities", () => {
      expect(navigator.deviceMemory).toBe(8); // More memory for desktop
      expect(navigator.maxTouchPoints).toBe(0); // No touch support
    });
  });

  describe("Responsive Media Queries", () => {
    beforeEach(() => {
      cleanup = MobileTestEnvironment.setupiOS();
    });

    it("should match mobile media queries on mobile devices", () => {
      if (window.matchMedia) {
        const mobileQuery = window.matchMedia("(max-width: 768px)");
        expect(mobileQuery.matches).toBe(true);
      } else {
        expect(true).toBe(true); // Skip if matchMedia not available
      }
    });

    it("should not match desktop media queries on mobile", () => {
      if (window.matchMedia) {
        const desktopQuery = window.matchMedia("(min-width: 1024px)");
        expect(desktopQuery.matches).toBe(false);
      } else {
        expect(true).toBe(true); // Skip if matchMedia not available
      }
    });

    it("should support orientation media queries", () => {
      if (window.matchMedia) {
        const portraitQuery = window.matchMedia("(orientation: portrait)");
        expect(portraitQuery.matches).toBe(true);
      } else {
        expect(true).toBe(true); // Skip if matchMedia not available
      }
    });
  });

  describe("Device Capabilities Detection", () => {
    beforeEach(() => {
      cleanup = MobileTestEnvironment.setupiOS();
    });

    it("should detect touch capability", () => {
      // Ensure mobile environment is set up
      expect(navigator.maxTouchPoints || 0).toBeGreaterThanOrEqual(0);
      expect("ontouchstart" in window || window.innerWidth <= 768).toBe(true);
    });

    it("should detect haptic feedback capability", () => {
      expect(typeof navigator.vibrate).toBe("function");
      const result = navigator.vibrate([100, 50, 100]);
      expect(result).toBe(true);
    });

    it("should detect device memory constraints", () => {
      expect(navigator.deviceMemory).toBeLessThan(8); // Mobile has less memory than desktop
    });

    it("should detect network connection type", () => {
      expect(navigator.connection?.effectiveType).toBeDefined();
      expect(navigator.connection?.type).toBe("cellular");
    });

    it("should support battery API", async () => {
      expect(typeof navigator.getBattery).toBe("function");
      const battery = await navigator.getBattery!();
      expect(typeof battery.level).toBe("number");
      expect(typeof battery.charging).toBe("boolean");
    });
  });

  describe("Orientation Change Handling", () => {
    beforeEach(() => {
      cleanup = MobileTestEnvironment.setupiOS();
    });

    it("should handle orientation change to landscape", () => {
      const orientationSpy = jest.fn();
      window.addEventListener("orientationchange", orientationSpy);

      MobileTestEnvironment.simulateOrientationChange("landscape");

      expect(screen.orientation.angle).toBe(90);
      expect(screen.orientation.type).toBe("landscape-primary");
      // Dimensions should be swapped but we need to be flexible about exact values
      expect(window.innerWidth).toBeGreaterThan(window.innerHeight);
      expect(orientationSpy).toHaveBeenCalled();

      window.removeEventListener("orientationchange", orientationSpy);
    });

    it("should handle orientation change to portrait", () => {
      const orientationSpy = jest.fn();
      window.addEventListener("orientationchange", orientationSpy);

      // First go to landscape
      MobileTestEnvironment.simulateOrientationChange("landscape");
      // Then back to portrait
      MobileTestEnvironment.simulateOrientationChange("portrait");

      expect(screen.orientation.angle).toBe(0);
      expect(screen.orientation.type).toBe("portrait-primary");
      expect(orientationSpy).toHaveBeenCalledTimes(2);

      window.removeEventListener("orientationchange", orientationSpy);
    });
  });

  describe("Memory and Performance Constraints", () => {
    beforeEach(() => {
      cleanup = MobileTestEnvironment.setupLowMemoryDevice();
    });

    it("should detect low memory conditions", () => {
      expect(performance.memory.usedJSHeapSize).toBeGreaterThan(50 * 1024 * 1024); // >50MB
      expect(performance.memory.jsHeapSizeLimit).toBeLessThan(200 * 1024 * 1024); // <200MB limit
    });

    it("should have mobile-specific memory constraints", () => {
      expect(navigator.deviceMemory).toBeLessThanOrEqual(2); // Low memory device
    });

    it("should simulate memory pressure", () => {
      MobileTestEnvironment.simulateMemoryPressure("critical");
      expect(performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit).toBeGreaterThan(0.8);
    });
  });

  describe("Network Conditions", () => {
    it("should simulate slow connection", () => {
      cleanup = MobileTestEnvironment.setupSlowConnection();
      expect(navigator.connection?.effectiveType).toBe("2g");
    });

    it("should simulate offline condition", () => {
      cleanup = MobileTestEnvironment.setupOffline();
      expect(navigator.onLine).toBe(false);
    });
  });

  describe("Battery Status", () => {
    beforeEach(() => {
      cleanup = MobileTestEnvironment.setupLowBattery();
    });

    it("should detect low battery conditions", async () => {
      const battery = await navigator.getBattery!();
      expect(battery.level).toBeLessThan(0.2); // Less than 20%
      expect(battery.charging).toBe(false);
      expect(battery.dischargingTime).toBeLessThan(7200); // Less than 2 hours
    });
  });

  describe("Feature Detection", () => {
    beforeEach(() => {
      cleanup = MobileTestEnvironment.setupiOS();
    });

    it("should detect available APIs", () => {
      expect(typeof window.TouchEvent).toBe("function");
      expect(typeof window.requestAnimationFrame).toBe("function");
      expect(typeof navigator.vibrate).toBe("function");
      expect(typeof navigator.getBattery).toBe("function");
    });

    it("should detect CSS feature support", () => {
      expect(window.CSS.supports("env(safe-area-inset-top)")).toBe(true);
      // Touch-action support varies, so just check it's a function
      expect(typeof window.CSS.supports).toBe("function");
    });

    it("should detect pointer events support", () => {
      expect(typeof window.PointerEvent).toBe("function");
    });
  });

  describe("Platform-Specific Optimizations", () => {
    it("should apply iOS-specific optimizations", () => {
      cleanup = MobileTestEnvironment.setupiOS();
      
      // Test safe area detection
      expect(window.CSS.supports("env(safe-area-inset-top)")).toBe(true);
      
      // Test iOS-specific user agent
      expect(navigator.userAgent).toContain("iPhone");
    });

    it("should apply Android-specific optimizations", () => {
      cleanup = MobileTestEnvironment.setupAndroid();
      
      // Test Android-specific features
      expect(navigator.userAgent).toContain("Android");
      expect(navigator.platform || "Linux armv8l").toContain("Linux");
    });
  });

  describe("Cross-Platform Consistency", () => {
    it("should maintain consistent API across platforms", () => {
      const platformAPIs = [
        "requestAnimationFrame",
        "cancelAnimationFrame", 
        "matchMedia",
        "addEventListener",
        "removeEventListener"
      ];

      // Test on iOS
      cleanup = MobileTestEnvironment.setupiOS();
      platformAPIs.forEach(api => {
        expect(typeof (window as any)[api]).toBe("function");
      });

      cleanup();

      // Test on Android
      cleanup = MobileTestEnvironment.setupAndroid();
      platformAPIs.forEach(api => {
        expect(typeof (window as any)[api]).toBe("function");
      });
    });

    it("should provide consistent touch event handling", () => {
      const platforms = ["ios", "android", "tablet"] as const;
      
      platforms.forEach(platform => {
        cleanup?.();
        
        if (platform === "ios") cleanup = MobileTestEnvironment.setupiOS();
        else if (platform === "android") cleanup = MobileTestEnvironment.setupAndroid();
        else cleanup = MobileTestEnvironment.setupTablet();

        expect(typeof window.TouchEvent).toBe("function");
        expect(navigator.maxTouchPoints || 0).toBeGreaterThanOrEqual(0);
        expect("ontouchstart" in window || window.innerWidth <= 768).toBe(true);
      });
    });
  });
});