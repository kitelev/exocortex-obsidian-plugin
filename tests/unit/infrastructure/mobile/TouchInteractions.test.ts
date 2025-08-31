/**
 * Comprehensive Touch Interaction Tests
 * Tests touch events, gestures, and mobile-specific interactions
 */

import { MobileTestEnvironment } from "../../../mobile-setup";

describe("Touch Interactions", () => {
  let testElement: HTMLElement;
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    cleanup = MobileTestEnvironment.setupiOS();
    testElement = document.createElement("div");
    testElement.style.width = "300px";
    testElement.style.height = "300px";
    testElement.style.position = "absolute";
    testElement.style.top = "0";
    testElement.style.left = "0";
    document.body.appendChild(testElement);
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    if (testElement.parentNode) {
      testElement.parentNode.removeChild(testElement);
    }
  });

  describe("Basic Touch Events", () => {
    it("should create and dispatch touchstart event", () => {
      const touchStartSpy = jest.fn();
      testElement.addEventListener("touchstart", touchStartSpy);

      const touchEvent = MobileTestEnvironment.createTouchEvent(
        "touchstart",
        [{ x: 150, y: 150 }],
        testElement
      );

      testElement.dispatchEvent(touchEvent);

      expect(touchStartSpy).toHaveBeenCalled();
      expect(touchEvent.type).toBe("touchstart");
      expect(touchEvent.touches.length).toBe(1);
      expect(touchEvent.touches[0].clientX).toBe(150);
      expect(touchEvent.touches[0].clientY).toBe(150);
    });

    it("should create and dispatch touchmove event", () => {
      const touchMoveSpy = jest.fn();
      testElement.addEventListener("touchmove", touchMoveSpy);

      const touchEvent = MobileTestEnvironment.createTouchEvent(
        "touchmove",
        [{ x: 200, y: 200 }],
        testElement
      );

      testElement.dispatchEvent(touchEvent);

      expect(touchMoveSpy).toHaveBeenCalled();
      expect(touchEvent.type).toBe("touchmove");
      expect(touchEvent.touches[0].clientX).toBe(200);
      expect(touchEvent.touches[0].clientY).toBe(200);
    });

    it("should create and dispatch touchend event", () => {
      const touchEndSpy = jest.fn();
      testElement.addEventListener("touchend", touchEndSpy);

      const touchEvent = MobileTestEnvironment.createTouchEvent(
        "touchend",
        [{ x: 150, y: 150 }],
        testElement
      );

      testElement.dispatchEvent(touchEvent);

      expect(touchEndSpy).toHaveBeenCalled();
      expect(touchEvent.type).toBe("touchend");
      expect(touchEvent.touches.length).toBe(0); // TouchEnd should have empty touches
      expect(touchEvent.changedTouches.length).toBe(1);
    });

    it("should handle multi-touch events", () => {
      const touchStartSpy = jest.fn();
      testElement.addEventListener("touchstart", touchStartSpy);

      const touchEvent = MobileTestEnvironment.createTouchEvent(
        "touchstart",
        [
          { x: 100, y: 100, id: 0 },
          { x: 200, y: 200, id: 1 }
        ],
        testElement
      );

      testElement.dispatchEvent(touchEvent);

      expect(touchStartSpy).toHaveBeenCalled();
      expect(touchEvent.touches.length).toBe(2);
      expect(touchEvent.touches[0].identifier).toBe(0);
      expect(touchEvent.touches[1].identifier).toBe(1);
    });

    it("should prevent default and stop propagation", () => {
      const touchStartSpy = jest.fn((event: TouchEvent) => {
        event.preventDefault();
        event.stopPropagation();
      });

      testElement.addEventListener("touchstart", touchStartSpy);

      const touchEvent = MobileTestEnvironment.createTouchEvent(
        "touchstart",
        [{ x: 150, y: 150 }],
        testElement
      );

      testElement.dispatchEvent(touchEvent);

      expect(touchEvent.preventDefault).toHaveBeenCalled();
      expect(touchEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe("Gesture Recognition", () => {
    let gestureSequence: ReturnType<typeof MobileTestEnvironment.createGestureSequence>;

    beforeEach(() => {
      gestureSequence = MobileTestEnvironment.createGestureSequence(testElement);
    });

    it("should perform tap gesture", async () => {
      const tapSpy = jest.fn();
      testElement.addEventListener("touchstart", tapSpy);
      testElement.addEventListener("touchend", tapSpy);

      await gestureSequence.tap(150, 150);

      expect(tapSpy).toHaveBeenCalledTimes(2); // touchstart + touchend
    });

    it("should perform double tap gesture", async () => {
      const touchStartSpy = jest.fn();
      const touchEndSpy = jest.fn();
      testElement.addEventListener("touchstart", touchStartSpy);
      testElement.addEventListener("touchend", touchEndSpy);

      await gestureSequence.doubleTap(150, 150);

      expect(touchStartSpy).toHaveBeenCalledTimes(2);
      expect(touchEndSpy).toHaveBeenCalledTimes(2);
    });

    it("should perform long press gesture", async () => {
      const touchStartSpy = jest.fn();
      const touchEndSpy = jest.fn();
      testElement.addEventListener("touchstart", touchStartSpy);
      testElement.addEventListener("touchend", touchEndSpy);

      const startTime = Date.now();
      await gestureSequence.longPress(150, 150, 600);
      const endTime = Date.now();

      expect(touchStartSpy).toHaveBeenCalledTimes(1);
      expect(touchEndSpy).toHaveBeenCalledTimes(1);
      expect(endTime - startTime).toBeGreaterThanOrEqual(600);
    });

    it("should perform pinch gesture", async () => {
      const touchStartSpy = jest.fn();
      const touchMoveSpy = jest.fn();
      const touchEndSpy = jest.fn();
      
      testElement.addEventListener("touchstart", touchStartSpy);
      testElement.addEventListener("touchmove", touchMoveSpy);
      testElement.addEventListener("touchend", touchEndSpy);

      await gestureSequence.pinch(100, 200, 150, 150);

      expect(touchStartSpy).toHaveBeenCalledTimes(1);
      expect(touchMoveSpy).toHaveBeenCalledTimes(1);
      expect(touchEndSpy).toHaveBeenCalledTimes(1);

      // Verify pinch gesture had two touch points
      const startEvent = touchStartSpy.mock.calls[0][0] as TouchEvent;
      expect(startEvent.touches.length).toBe(2);
    });

    it("should perform pan gesture", async () => {
      const touchStartSpy = jest.fn();
      const touchMoveSpy = jest.fn();
      const touchEndSpy = jest.fn();
      
      testElement.addEventListener("touchstart", touchStartSpy);
      testElement.addEventListener("touchmove", touchMoveSpy);
      testElement.addEventListener("touchend", touchEndSpy);

      await gestureSequence.pan(100, 100, 200, 200);

      expect(touchStartSpy).toHaveBeenCalledTimes(1);
      expect(touchMoveSpy).toHaveBeenCalledTimes(1);
      expect(touchEndSpy).toHaveBeenCalledTimes(1);

      // Verify pan coordinates
      const moveEvent = touchMoveSpy.mock.calls[0][0] as TouchEvent;
      expect(moveEvent.touches[0].clientX).toBe(200);
      expect(moveEvent.touches[0].clientY).toBe(200);
    });
  });

  describe("Touch Event Properties", () => {
    it("should have correct touch properties", () => {
      const touchEvent = MobileTestEnvironment.createTouchEvent(
        "touchstart",
        [{ x: 150, y: 150, id: 5 }],
        testElement
      );

      expect(touchEvent.bubbles).toBe(true);
      expect(touchEvent.cancelable).toBe(true);
      expect(touchEvent.touches[0]).toEqual(
        expect.objectContaining({
          identifier: 5,
          clientX: 150,
          clientY: 150,
          pageX: 150,
          pageY: 150,
          screenX: 150,
          screenY: 150,
          target: testElement
        })
      );
    });

    it("should distinguish between touches, changedTouches, and targetTouches", () => {
      const touchStartEvent = MobileTestEnvironment.createTouchEvent(
        "touchstart",
        [{ x: 100, y: 100 }, { x: 200, y: 200 }],
        testElement
      );

      const touchEndEvent = MobileTestEnvironment.createTouchEvent(
        "touchend",
        [{ x: 100, y: 100 }],
        testElement
      );

      // Touch start should have all touches active
      expect(touchStartEvent.touches.length).toBe(2);
      expect(touchStartEvent.changedTouches.length).toBe(2);
      expect(touchStartEvent.targetTouches.length).toBe(2);

      // Touch end should have no active touches but changedTouches
      expect(touchEndEvent.touches.length).toBe(0);
      expect(touchEndEvent.changedTouches.length).toBe(1);
      expect(touchEndEvent.targetTouches.length).toBe(0);
    });
  });

  describe("Touch Target Validation", () => {
    it("should validate minimum touch target size (44x44px)", () => {
      const smallButton = document.createElement("button");
      smallButton.style.width = "30px";
      smallButton.style.height = "30px";
      testElement.appendChild(smallButton);

      const rect = smallButton.getBoundingClientRect();
      expect(rect.width).toBeLessThan(44);
      expect(rect.height).toBeLessThan(44);

      // Should recommend increasing touch target size
      expect(rect.width < 44 || rect.height < 44).toBe(true);
    });

    it("should validate adequate touch target size", () => {
      const adequateButton = document.createElement("button");
      adequateButton.style.width = "48px";
      adequateButton.style.height = "48px";
      testElement.appendChild(adequateButton);

      const rect = adequateButton.getBoundingClientRect();
      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeGreaterThanOrEqual(44);
    });

    it("should handle touch events on properly sized targets", async () => {
      const button = document.createElement("button");
      button.style.width = "48px";
      button.style.height = "48px";
      button.style.position = "absolute";
      button.style.top = "10px";
      button.style.left = "10px";
      testElement.appendChild(button);

      const clickSpy = jest.fn();
      button.addEventListener("touchstart", clickSpy);

      const gestureSequence = MobileTestEnvironment.createGestureSequence(button);
      await gestureSequence.tap(34, 34); // Center of 48px button at (10,10)

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe("Touch Event Timing", () => {
    it("should measure touch duration", async () => {
      const touchStartSpy = jest.fn();
      const touchEndSpy = jest.fn();
      
      testElement.addEventListener("touchstart", touchStartSpy);
      testElement.addEventListener("touchend", touchEndSpy);

      const startTime = performance.now();
      
      const touchStart = MobileTestEnvironment.createTouchEvent(
        "touchstart",
        [{ x: 150, y: 150 }],
        testElement
      );
      testElement.dispatchEvent(touchStart);

      await new Promise(resolve => setTimeout(resolve, 100));

      const touchEnd = MobileTestEnvironment.createTouchEvent(
        "touchend",
        [{ x: 150, y: 150 }],
        testElement
      );
      testElement.dispatchEvent(touchEnd);

      const endTime = performance.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
      expect(touchStartSpy).toHaveBeenCalled();
      expect(touchEndSpy).toHaveBeenCalled();
    });

    it("should handle rapid successive touches", async () => {
      const touchSpy = jest.fn();
      testElement.addEventListener("touchstart", touchSpy);

      const gestureSequence = MobileTestEnvironment.createGestureSequence(testElement);
      
      // Rapid taps
      await gestureSequence.tap(150, 150);
      await new Promise(resolve => setTimeout(resolve, 50));
      await gestureSequence.tap(150, 150);
      await new Promise(resolve => setTimeout(resolve, 50));
      await gestureSequence.tap(150, 150);

      expect(touchSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe("Touch Event Coordinates", () => {
    it("should handle coordinate transformations", () => {
      testElement.style.transform = "translate(50px, 50px)";
      
      const touchEvent = MobileTestEnvironment.createTouchEvent(
        "touchstart",
        [{ x: 100, y: 100 }],
        testElement
      );

      expect(touchEvent.touches[0].clientX).toBe(100);
      expect(touchEvent.touches[0].clientY).toBe(100);
      expect(touchEvent.touches[0].pageX).toBe(100);
      expect(touchEvent.touches[0].pageY).toBe(100);
    });

    it("should handle viewport coordinates", () => {
      const touchEvent = MobileTestEnvironment.createTouchEvent(
        "touchstart",
        [{ x: 375, y: 667 }], // iPhone dimensions
        testElement
      );

      expect(touchEvent.touches[0].clientX).toBeLessThanOrEqual(window.innerWidth);
      expect(touchEvent.touches[0].clientY).toBeLessThanOrEqual(window.innerHeight);
    });
  });

  describe("Touch Event Performance", () => {
    it("should handle high-frequency touch events", async () => {
      const touchMoveSpy = jest.fn();
      testElement.addEventListener("touchmove", touchMoveSpy);

      // Simulate 60fps touch events
      const startTime = performance.now();
      for (let i = 0; i < 60; i++) {
        const touchEvent = MobileTestEnvironment.createTouchEvent(
          "touchmove",
          [{ x: 150 + i, y: 150 }],
          testElement
        );
        testElement.dispatchEvent(touchEvent);
        await new Promise(resolve => setTimeout(resolve, 16)); // 16ms = ~60fps
      }
      const endTime = performance.now();

      expect(touchMoveSpy).toHaveBeenCalledTimes(60);
      expect(endTime - startTime).toBeGreaterThanOrEqual(960); // ~1 second
    });

    it("should measure touch event processing time", () => {
      const processingTimes: number[] = [];
      
      testElement.addEventListener("touchstart", () => {
        const startTime = performance.now();
        // Simulate processing work
        for (let i = 0; i < 1000; i++) {
          Math.random();
        }
        const endTime = performance.now();
        processingTimes.push(endTime - startTime);
      });

      for (let i = 0; i < 10; i++) {
        const touchEvent = MobileTestEnvironment.createTouchEvent(
          "touchstart",
          [{ x: 150, y: 150 }],
          testElement
        );
        testElement.dispatchEvent(touchEvent);
      }

      expect(processingTimes.length).toBe(10);
      expect(processingTimes.every(time => time < 16)).toBe(true); // Should be under 16ms for 60fps
    });
  });

  describe("Cross-Platform Touch Consistency", () => {
    const platforms = ["ios", "android", "tablet"] as const;

    platforms.forEach(platform => {
      it(`should work consistently on ${platform}`, () => {
        cleanup?.();
        
        if (platform === "ios") cleanup = MobileTestEnvironment.setupiOS();
        else if (platform === "android") cleanup = MobileTestEnvironment.setupAndroid();
        else cleanup = MobileTestEnvironment.setupTablet();

        const touchSpy = jest.fn();
        testElement.addEventListener("touchstart", touchSpy);

        const touchEvent = MobileTestEnvironment.createTouchEvent(
          "touchstart",
          [{ x: 150, y: 150 }],
          testElement
        );

        testElement.dispatchEvent(touchEvent);

        expect(touchSpy).toHaveBeenCalled();
        expect(touchEvent.type).toBe("touchstart");
        expect(touchEvent.touches.length).toBe(1);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid touch coordinates gracefully", () => {
      expect(() => {
        const touchEvent = MobileTestEnvironment.createTouchEvent(
          "touchstart",
          [{ x: -100, y: -100 }],
          testElement
        );
        testElement.dispatchEvent(touchEvent);
      }).not.toThrow();
    });

    it("should handle missing touch target", () => {
      expect(() => {
        const touchEvent = MobileTestEnvironment.createTouchEvent(
          "touchstart",
          [{ x: 150, y: 150 }]
        );
        testElement.dispatchEvent(touchEvent);
      }).not.toThrow();
    });

    it("should handle empty touch array", () => {
      expect(() => {
        const touchEvent = MobileTestEnvironment.createTouchEvent(
          "touchstart",
          [],
          testElement
        );
        testElement.dispatchEvent(touchEvent);
      }).not.toThrow();
    });
  });

  describe("Accessibility", () => {
    it("should support assistive touch navigation", async () => {
      const button = document.createElement("button");
      button.textContent = "Accessible Button";
      button.setAttribute("aria-label", "Test Button");
      testElement.appendChild(button);

      const gestureSequence = MobileTestEnvironment.createGestureSequence(button);
      const clickSpy = jest.fn();
      button.addEventListener("touchstart", clickSpy);

      await gestureSequence.tap(0, 0); // Touch at button location

      expect(clickSpy).toHaveBeenCalled();
      expect(button.getAttribute("aria-label")).toBe("Test Button");
    });

    it("should support keyboard navigation fallback", () => {
      const button = document.createElement("button");
      button.textContent = "Keyboard Accessible";
      testElement.appendChild(button);

      const keydownSpy = jest.fn();
      button.addEventListener("keydown", keydownSpy);

      // Simulate keyboard activation
      const keyEvent = new KeyboardEvent("keydown", { key: "Enter" });
      button.dispatchEvent(keyEvent);

      expect(keydownSpy).toHaveBeenCalled();
    });
  });
});