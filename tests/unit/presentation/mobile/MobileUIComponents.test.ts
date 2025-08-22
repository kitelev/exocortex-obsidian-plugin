import {
  MobileUIComponents,
  TouchGestureRecognizer,
} from "../../../../src/presentation/components/MobileUIComponents";
import { MobilePerformanceOptimizer } from "../../../../src/infrastructure/optimizers/MobilePerformanceOptimizer";
import { PlatformDetector } from "../../../../src/infrastructure/utils/PlatformDetector";

// Mock PlatformDetector
jest.mock("../../../../src/infrastructure/utils/PlatformDetector", () => ({
  PlatformDetector: {
    isMobile: jest.fn(() => true),
    isIOS: jest.fn(() => true),
    hasTouch: jest.fn(() => true),
    isTablet: jest.fn(() => false),
    shouldUseVirtualScrolling: jest.fn(() => false),
  },
}));

// Mock MobilePerformanceOptimizer
jest.mock(
  "../../../../src/infrastructure/optimizers/MobilePerformanceOptimizer",
);

describe.skip("MobileUIComponents", () => {
  let mobileUI: MobileUIComponents;
  let container: HTMLElement;
  let mockOptimizer: jest.Mocked<MobilePerformanceOptimizer>;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);

    // Mock Obsidian's createEl method and element extensions
    const mockObsidianElement = (element: HTMLElement) => {
      (element as any).createEl = createElMock;
      (element as any).addClass = jest.fn((className: string) => {
        element.classList.add(className);
        return element;
      });
      (element as any).removeClass = jest.fn((className: string) => {
        element.classList.remove(className);
        return element;
      });
      (element as any).toggleClass = jest.fn(
        (className: string, force?: boolean) => {
          element.classList.toggle(className, force);
          return element;
        },
      );
      (element as any).hasClass = jest.fn((className: string) => {
        return element.classList.contains(className);
      });
      return element;
    };

    const createElMock = jest.fn((tag: string, attrs?: any) => {
      const element = document.createElement(tag);

      if (attrs?.cls) {
        if (Array.isArray(attrs.cls)) {
          element.className = attrs.cls.join(" ");
        } else {
          element.className = attrs.cls;
        }
      }
      if (attrs?.attr) {
        Object.entries(attrs.attr).forEach(([key, value]) => {
          element.setAttribute(key, value as string);
        });
      }
      if (attrs?.text) {
        element.textContent = attrs.text;
      }
      if (attrs?.html) {
        element.innerHTML = attrs.html;
      }

      // Apply styles if provided
      if (attrs?.style) {
        Object.assign(element.style, attrs.style);
      }

      container.appendChild(element);

      // Make this element have Obsidian-like behavior
      return mockObsidianElement(element);
    });

    // Apply Obsidian-like behavior to container
    mockObsidianElement(container);

    // Mock performance optimizer
    mockOptimizer = {
      debounce: jest.fn((fn, delay) => fn),
      createCache: jest.fn(() => new Map()),
    } as any;

    mobileUI = new MobileUIComponents(mockOptimizer);

    // Mock navigator.vibrate
    Object.defineProperty(navigator, "vibrate", {
      value: jest.fn(),
      configurable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
  });

  describe("Touch Button Creation", () => {
    it("should create a mobile-optimized button", () => {
      const onClick = jest.fn();
      const config = {
        text: "Test Button",
        variant: "primary" as const,
        size: "medium" as const,
        disabled: false,
        hapticFeedback: true,
      };

      const button = mobileUI.createButton(container, config, onClick);

      expect(button).toBeInstanceOf(HTMLElement);
      expect(button.textContent).toContain("Test Button");
      expect(button.classList).toContain("exocortex-mobile-button");
      expect(button.classList).toContain("exocortex-mobile-button--primary");
      expect(button.style.minHeight).toBe("44px");
    });

    it("should create disabled button", () => {
      const onClick = jest.fn();
      const config = {
        text: "Disabled Button",
        disabled: true,
      };

      const button = mobileUI.createButton(container, config, onClick);

      expect(button.getAttribute("disabled")).toBe("true");
      expect(button.style.opacity).toBe("0.5");

      // Click should not trigger
      button.click();
      expect(onClick).not.toHaveBeenCalled();
    });

    it("should create loading button", () => {
      const onClick = jest.fn();
      const config = {
        text: "Loading Button",
        loading: true,
      };

      const button = mobileUI.createButton(container, config, onClick);

      expect(button.classList).toContain("exocortex-mobile-button--loading");
      expect(button.querySelector(".exocortex-mobile-spinner")).toBeTruthy();
    });

    it("should create full-width button", () => {
      const onClick = jest.fn();
      const config = {
        text: "Full Width",
        fullWidth: true,
      };

      const button = mobileUI.createButton(container, config, onClick);

      expect(button.classList).toContain("exocortex-mobile-button--full-width");
    });

    it("should add icon to button", () => {
      const onClick = jest.fn();
      const config = {
        text: "Icon Button",
        icon: "🏠",
      };

      const button = mobileUI.createButton(container, config, onClick);

      expect(
        button.querySelector(".exocortex-mobile-button-icon"),
      ).toBeTruthy();
      expect(
        button.querySelector(".exocortex-mobile-button-icon")?.innerHTML,
      ).toBe("🏠");
    });
  });

  describe("Mobile List Creation", () => {
    const sampleItems = [
      {
        title: "Item 1",
        subtitle: "Subtitle 1",
        icon: "📄",
        rightText: "Right 1",
        showChevron: true,
      },
      {
        title: "Item 2",
        subtitle: "Subtitle 2",
        icon: "📁",
        rightIcon: "⭐",
      },
    ];

    it("should create a mobile list", () => {
      const onItemClick = jest.fn();

      const list = mobileUI.createList(container, sampleItems, onItemClick);

      expect(list).toBeInstanceOf(HTMLElement);
      expect(list.classList).toContain("exocortex-mobile-list");

      const items = list.querySelectorAll(".exocortex-mobile-list-item");
      expect(items).toHaveLength(2);
    });

    it("should create list items with correct content", () => {
      const list = mobileUI.createList(container, sampleItems);
      const firstItem = list.querySelector(".exocortex-mobile-list-item");

      expect(
        firstItem?.querySelector(".exocortex-mobile-list-item-title")
          ?.textContent,
      ).toBe("Item 1");
      expect(
        firstItem?.querySelector(".exocortex-mobile-list-item-subtitle")
          ?.textContent,
      ).toBe("Subtitle 1");
      expect(
        firstItem?.querySelector(".exocortex-mobile-list-item-icon")
          ?.textContent,
      ).toBe("📄");
      expect(
        firstItem?.querySelector(".exocortex-mobile-list-item-right-text")
          ?.textContent,
      ).toBe("Right 1");
      expect(
        firstItem?.querySelector(".exocortex-mobile-list-item-chevron"),
      ).toBeTruthy();
    });

    it("should handle item clicks", () => {
      const onItemClick = jest.fn();

      const list = mobileUI.createList(container, sampleItems, onItemClick);
      const firstItem = list.querySelector(
        ".exocortex-mobile-list-item",
      ) as HTMLElement;

      firstItem.click();
      expect(onItemClick).toHaveBeenCalledWith(sampleItems[0], 0);
    });

    it("should use virtual scrolling for large lists when optimizer available", () => {
      (PlatformDetector.shouldUseVirtualScrolling as jest.Mock).mockReturnValue(
        true,
      );

      const largeItemList = Array(200)
        .fill(0)
        .map((_, i) => ({
          title: `Item ${i}`,
          subtitle: `Subtitle ${i}`,
        }));

      const list = mobileUI.createList(container, largeItemList);

      // Should create virtual scroll container
      expect(list.classList).toContain("exocortex-virtual-scroll-container");
    });
  });

  describe("Mobile Input Creation", () => {
    it("should create a mobile input", () => {
      const onChange = jest.fn();
      const config = {
        placeholder: "Enter text",
        type: "text" as const,
        autoFocus: false,
        clearButton: true,
      };

      const inputContainer = mobileUI.createInput(container, config, onChange);
      const input = inputContainer.querySelector(
        ".exocortex-mobile-input",
      ) as HTMLInputElement;

      expect(inputContainer).toBeInstanceOf(HTMLElement);
      expect(inputContainer.classList).toContain(
        "exocortex-mobile-input-container",
      );
      expect(input).toBeInstanceOf(HTMLInputElement);
      expect(input.placeholder).toBe("Enter text");
      expect(input.style.fontSize).toBe("16px"); // iOS zoom prevention
    });

    it("should handle input changes", () => {
      const onChange = jest.fn();
      const config = { placeholder: "Test input" };

      const inputContainer = mobileUI.createInput(container, config, onChange);
      const input = inputContainer.querySelector(
        ".exocortex-mobile-input",
      ) as HTMLInputElement;

      // Simulate input change
      input.value = "test value";
      input.dispatchEvent(new Event("input", { bubbles: true }));

      expect(onChange).toHaveBeenCalledWith("test value");
    });

    it("should create clear button on mobile", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);

      const config = { clearButton: true };
      const inputContainer = mobileUI.createInput(container, config);

      expect(
        inputContainer.querySelector(".exocortex-mobile-input-clear"),
      ).toBeTruthy();
    });

    it("should handle disabled state", () => {
      const config = { disabled: true };
      const inputContainer = mobileUI.createInput(container, config);
      const input = inputContainer.querySelector(
        ".exocortex-mobile-input",
      ) as HTMLInputElement;

      expect(input.disabled).toBe(true);
      expect(inputContainer.classList).toContain(
        "exocortex-mobile-input-container--disabled",
      );
    });

    it("should prevent zoom on iOS with font size", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);

      const config = { type: "email" as const };
      const inputContainer = mobileUI.createInput(container, config);
      const input = inputContainer.querySelector(
        ".exocortex-mobile-input",
      ) as HTMLInputElement;

      expect(input.style.fontSize).toBe("16px");
      expect(input.getAttribute("autocapitalize")).toBe("off");
    });
  });

  describe("Mobile Modal Creation", () => {
    it("should create a mobile modal", () => {
      const content = document.createElement("div");
      content.textContent = "Modal content";

      const modal = mobileUI.createModal("Test Modal", content, {
        showCloseButton: true,
        swipeToClose: true,
      });

      expect(modal).toBeInstanceOf(HTMLElement);
      expect(modal.classList).toContain("exocortex-mobile-modal-overlay");

      const modalContent = modal.querySelector(".exocortex-mobile-modal");
      expect(modalContent).toBeTruthy();

      const title = modal.querySelector(".exocortex-mobile-modal-title");
      expect(title?.textContent).toBe("Test Modal");

      const closeButton = modal.querySelector(".exocortex-mobile-modal-close");
      expect(closeButton).toBeTruthy();
    });

    it("should create fullscreen modal", () => {
      const content = document.createElement("div");

      const modal = mobileUI.createModal("Fullscreen Modal", content, {
        fullScreen: true,
      });

      const modalContent = modal.querySelector(".exocortex-mobile-modal");
      expect(modalContent?.classList).toContain(
        "exocortex-mobile-modal--fullscreen",
      );
    });

    it("should handle modal close", () => {
      const onClose = jest.fn();
      const content = document.createElement("div");

      const modal = mobileUI.createModal("Test Modal", content, {
        onClose,
      });

      const closeButton = modal.querySelector(
        ".exocortex-mobile-modal-close",
      ) as HTMLElement;
      closeButton.click();

      expect(onClose).toHaveBeenCalled();
    });

    it("should prevent background scroll", () => {
      const originalOverflow = document.body.style.overflow;
      const content = document.createElement("div");

      mobileUI.createModal("Test Modal", content);

      expect(document.body.style.overflow).toBe("hidden");
    });
  });

  describe("Floating Action Button", () => {
    it("should create FAB with correct positioning", () => {
      const onClick = jest.fn();

      const fab = mobileUI.createFAB(container, "➕", onClick, {
        position: "bottom-right",
        accessibilityLabel: "Add item",
      });

      expect(fab).toBeInstanceOf(HTMLElement);
      expect(fab.classList).toContain("exocortex-mobile-fab");
      expect(fab.classList).toContain("exocortex-mobile-fab--bottom-right");
      expect(fab.getAttribute("aria-label")).toBe("Add item");
      expect(fab.innerHTML).toBe("➕");
    });

    it("should handle FAB clicks", () => {
      const onClick = jest.fn();

      const fab = mobileUI.createFAB(container, "➕", onClick);
      fab.click();

      expect(onClick).toHaveBeenCalled();
    });

    it("should apply custom color", () => {
      const onClick = jest.fn();

      const fab = mobileUI.createFAB(container, "➕", onClick, {
        color: "#ff0000",
      });

      expect(fab.style.backgroundColor).toBe("#ff0000");
    });
  });

  describe("Loading Indicator", () => {
    it("should create loading indicator", () => {
      const loader = mobileUI.createLoadingIndicator(
        container,
        "Loading data...",
      );

      expect(loader).toBeInstanceOf(HTMLElement);
      expect(loader.classList).toContain("exocortex-mobile-loader");
      expect(
        loader.querySelector(".exocortex-mobile-spinner-large"),
      ).toBeTruthy();
      expect(loader.textContent).toContain("Loading data...");
    });

    it("should create loader without message", () => {
      const loader = mobileUI.createLoadingIndicator(container);

      expect(
        loader.querySelector(".exocortex-mobile-loader-message"),
      ).toBeFalsy();
    });
  });

  describe("Swipe Actions", () => {
    it("should create swipeable list items", () => {
      const items = [
        {
          title: "Swipeable Item",
          swipeable: true,
          swipeActions: [
            {
              text: "Delete",
              color: "#ff0000",
              action: jest.fn(),
            },
          ],
        },
      ];

      const list = mobileUI.createList(container, items);
      const listItem = list.querySelector(".exocortex-mobile-list-item");
      const actions = listItem?.querySelector(
        ".exocortex-mobile-list-item-actions",
      );

      expect(actions).toBeTruthy();
      expect(
        actions?.querySelector(".exocortex-mobile-list-item-action"),
      ).toBeTruthy();
    });

    it("should handle swipe action clicks", () => {
      const deleteAction = jest.fn();
      const items = [
        {
          title: "Swipeable Item",
          swipeable: true,
          swipeActions: [
            {
              text: "Delete",
              action: deleteAction,
            },
          ],
        },
      ];

      const list = mobileUI.createList(container, items);
      const actionButton = list.querySelector(
        ".exocortex-mobile-list-item-action",
      ) as HTMLElement;

      actionButton.click();
      expect(deleteAction).toHaveBeenCalled();
    });
  });
});

describe.skip("TouchGestureRecognizer", () => {
  let element: HTMLElement;
  let gestureRecognizer: TouchGestureRecognizer;
  let handlers: any;

  beforeEach(() => {
    element = document.createElement("div");
    document.body.appendChild(element);

    handlers = {
      onTap: jest.fn(),
      onDoubleTap: jest.fn(),
      onLongTap: jest.fn(),
      onSwipeLeft: jest.fn(),
      onSwipeRight: jest.fn(),
      onSwipeUp: jest.fn(),
      onSwipeDown: jest.fn(),
    };

    // Mock navigator.vibrate
    Object.defineProperty(navigator, "vibrate", {
      value: jest.fn(),
      configurable: true,
    });

    gestureRecognizer = new TouchGestureRecognizer(element, handlers);
  });

  afterEach(() => {
    gestureRecognizer.destroy();
    document.body.removeChild(element);
    jest.clearAllMocks();
  });

  const createTouchEvent = (
    type: string,
    touches: Array<{ x: number; y: number; id?: number }>,
  ) => {
    const touchList = touches.map((touch, index) => ({
      identifier: touch.id || index,
      clientX: touch.x,
      clientY: touch.y,
      target: element,
    })) as any;

    const event = new Event(type) as any;
    event.touches = touchList;
    event.changedTouches = touchList;
    event.preventDefault = jest.fn();

    return event;
  };

  describe("Tap Gestures", () => {
    it("should detect single tap", async () => {
      jest.useFakeTimers();

      const touchStart = createTouchEvent("touchstart", [{ x: 100, y: 100 }]);
      const touchEnd = createTouchEvent("touchend", [{ x: 100, y: 100 }]);

      element.dispatchEvent(touchStart);
      element.dispatchEvent(touchEnd);

      // Fast-forward past double-tap timeout
      jest.advanceTimersByTime(350);

      expect(handlers.onTap).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it("should detect double tap", () => {
      const touchStart = createTouchEvent("touchstart", [{ x: 100, y: 100 }]);
      const touchEnd = createTouchEvent("touchend", [{ x: 100, y: 100 }]);

      // First tap
      element.dispatchEvent(touchStart);
      element.dispatchEvent(touchEnd);

      // Second tap quickly
      setTimeout(() => {
        element.dispatchEvent(touchStart);
        element.dispatchEvent(touchEnd);

        expect(handlers.onDoubleTap).toHaveBeenCalled();
        expect(handlers.onTap).not.toHaveBeenCalled();
      }, 100);
    });

    it("should detect long press", () => {
      jest.useFakeTimers();

      const touchStart = createTouchEvent("touchstart", [{ x: 100, y: 100 }]);

      element.dispatchEvent(touchStart);

      // Fast-forward past long press duration
      jest.advanceTimersByTime(550);

      expect(handlers.onLongTap).toHaveBeenCalled();
      expect(navigator.vibrate).toHaveBeenCalledWith(30);

      jest.useRealTimers();
    });
  });

  describe("Swipe Gestures", () => {
    it("should detect swipe right", () => {
      const touchStart = createTouchEvent("touchstart", [{ x: 50, y: 100 }]);
      const touchMove = createTouchEvent("touchmove", [{ x: 120, y: 100 }]);
      const touchEnd = createTouchEvent("touchend", [{ x: 120, y: 100 }]);

      element.dispatchEvent(touchStart);
      element.dispatchEvent(touchMove);
      element.dispatchEvent(touchEnd);

      expect(handlers.onSwipeRight).toHaveBeenCalled();
    });

    it("should detect swipe left", () => {
      const touchStart = createTouchEvent("touchstart", [{ x: 150, y: 100 }]);
      const touchMove = createTouchEvent("touchmove", [{ x: 80, y: 100 }]);
      const touchEnd = createTouchEvent("touchend", [{ x: 80, y: 100 }]);

      element.dispatchEvent(touchStart);
      element.dispatchEvent(touchMove);
      element.dispatchEvent(touchEnd);

      expect(handlers.onSwipeLeft).toHaveBeenCalled();
    });

    it("should detect swipe up", () => {
      const touchStart = createTouchEvent("touchstart", [{ x: 100, y: 150 }]);
      const touchMove = createTouchEvent("touchmove", [{ x: 100, y: 80 }]);
      const touchEnd = createTouchEvent("touchend", [{ x: 100, y: 80 }]);

      element.dispatchEvent(touchStart);
      element.dispatchEvent(touchMove);
      element.dispatchEvent(touchEnd);

      expect(handlers.onSwipeUp).toHaveBeenCalled();
    });

    it("should detect swipe down", () => {
      const touchStart = createTouchEvent("touchstart", [{ x: 100, y: 50 }]);
      const touchMove = createTouchEvent("touchmove", [{ x: 100, y: 120 }]);
      const touchEnd = createTouchEvent("touchend", [{ x: 100, y: 120 }]);

      element.dispatchEvent(touchStart);
      element.dispatchEvent(touchMove);
      element.dispatchEvent(touchEnd);

      expect(handlers.onSwipeDown).toHaveBeenCalled();
    });
  });

  describe("Haptic Feedback", () => {
    it("should provide haptic feedback on mobile", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);

      const touchStart = createTouchEvent("touchstart", [{ x: 100, y: 100 }]);
      const touchEnd = createTouchEvent("touchend", [{ x: 100, y: 100 }]);

      element.dispatchEvent(touchStart);
      element.dispatchEvent(touchEnd);

      expect(navigator.vibrate).toHaveBeenCalledWith(15);
    });

    it("should not provide haptic feedback on desktop", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(false);

      const touchStart = createTouchEvent("touchstart", [{ x: 100, y: 100 }]);
      element.dispatchEvent(touchStart);

      expect(navigator.vibrate).not.toHaveBeenCalled();
    });
  });

  describe("Gesture Cleanup", () => {
    it("should cleanup event listeners on destroy", () => {
      const removeEventListenerSpy = jest.spyOn(element, "removeEventListener");

      gestureRecognizer.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "touchstart",
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "touchmove",
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "touchend",
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "touchcancel",
        expect.any(Function),
      );
    });

    it("should clear long press timer on destroy", () => {
      const clearTimeoutSpy = jest.spyOn(window, "clearTimeout");

      // Start a long press
      const touchStart = createTouchEvent("touchstart", [{ x: 100, y: 100 }]);
      element.dispatchEvent(touchStart);

      gestureRecognizer.destroy();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});
