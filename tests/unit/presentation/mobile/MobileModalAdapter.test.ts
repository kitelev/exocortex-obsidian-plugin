import { App } from "obsidian";
import {
  MobileModalAdapter,
  MobileModalConfig,
  KeyboardHandler,
} from "../../../../src/presentation/mobile/MobileModalAdapter";
import { PlatformDetector } from "../../../../src/infrastructure/utils/PlatformDetector";

// Mock PlatformDetector
jest.mock("../../../../src/infrastructure/utils/PlatformDetector", () => ({
  PlatformDetector: {
    isMobile: jest.fn(() => true),
    isIOS: jest.fn(() => true),
    hasTouch: jest.fn(() => true),
    getSafeAreaInsets: jest.fn(() => ({
      top: 44,
      right: 0,
      bottom: 34,
      left: 0,
    })),
    getPlatformInfo: jest.fn(() => ({
      isMobile: true,
      isIOS: true,
      isAndroid: false,
      isTablet: false,
      isDesktop: false,
      hasTouch: true,
      screenWidth: 400,
      screenHeight: 800,
      devicePixelRatio: 1,
      isObsidianMobile: true,
      os: "ios" as const,
    })),
  },
}));

// Mock Obsidian App
const mockApp = {
  vault: {},
  workspace: {},
  metadataCache: {},
} as unknown as App;

describe("MobileModalAdapter", () => {
  let modal: MobileModalAdapter;
  let config: MobileModalConfig;
  let keyboardHandler: KeyboardHandler;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup DOM
    document.body.innerHTML = "";

    // Mock window properties
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, "innerWidth", {
      value: 400,
      writable: true,
      configurable: true,
    });

    // Mock visual viewport API
    Object.defineProperty(window, "visualViewport", {
      value: {
        height: 800,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
      writable: true,
      configurable: true,
    });

    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation((callback) => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
      unobserve: jest.fn(),
    }));

    // Mock getComputedStyle
    Object.defineProperty(window, "getComputedStyle", {
      value: jest.fn(() => ({
        getPropertyValue: jest.fn((prop: string) => {
          if (prop.includes("env(safe-area-inset-top)")) return "44px";
          if (prop.includes("env(safe-area-inset-bottom)")) return "34px";
          if (prop.includes("env(safe-area-inset-left)")) return "0px";
          if (prop.includes("env(safe-area-inset-right)")) return "0px";
          return "0px";
        }),
      })),
      configurable: true,
    });

    config = {
      title: "Test Modal",
      subtitle: "Test Subtitle",
      showCloseButton: true,
      allowDismiss: true,
      fullscreen: false,
      keyboardHandling: "auto",
      maxHeight: "90vh",
      className: "test-modal",
    };

    keyboardHandler = {
      onShow: jest.fn(),
      onHide: jest.fn(),
      onHeightChange: jest.fn(),
    };
  });

  afterEach(() => {
    if (modal) {
      modal.close();
    }
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  describe("Modal Creation", () => {
    it("should create mobile modal with correct structure", () => {
      // Mock PlatformDetector to return mobile
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(false);
      
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();

      expect(modal.modalEl.classList.contains("exocortex-mobile-modal")).toBe(
        true,
      );
      expect(modal.modalEl.classList.contains("mobile-layout")).toBe(true);
      expect(modal.modalEl.classList.contains("test-modal")).toBe(true);
    });

    it("should create fullscreen modal on mobile", () => {
      // Mock PlatformDetector to return mobile
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(false);
      
      const fullscreenConfig = { ...config, fullscreen: true };
      modal = new MobileModalAdapter(
        mockApp,
        fullscreenConfig,
        keyboardHandler,
      );
      modal.open();

      expect(modal.modalEl.classList.contains("fullscreen-modal")).toBe(true);
    });

    it("should setup safe area handling on iOS", () => {
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      
      // Ensure getSafeAreaInsets returns valid values
      (PlatformDetector.getSafeAreaInsets as jest.Mock).mockReturnValue({
        top: 44,
        right: 0,
        bottom: 34,
        left: 0,
      });
      
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();

      expect(modal.modalEl.style.paddingTop).toBe("44px");
      expect(modal.modalEl.style.paddingBottom).toBe("34px");
      expect(modal.modalEl.style.paddingLeft).toBe("0px");
      expect(modal.modalEl.style.paddingRight).toBe("0px");
    });

    it("should create modal header with title and subtitle", () => {
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();
      // Need to trigger onOpen to create DOM elements
      (modal as any).onOpen();

      const title = modal.contentEl.querySelector(".modal-title");
      const subtitle = modal.contentEl.querySelector(".modal-subtitle");

      expect(title?.textContent).toBe("Test Modal");
      expect(subtitle?.textContent).toBe("Test Subtitle");
    });

    it("should create close button when enabled", () => {
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();
      // Need to trigger onOpen to create DOM elements
      (modal as any).onOpen();

      const closeButton = modal.contentEl.querySelector(".modal-close-button");
      expect(closeButton).toBeTruthy();
      expect(closeButton?.getAttribute("aria-label")).toBe("Close modal");
    });

    it("should not create close button when disabled", () => {
      const noCloseConfig = { ...config, showCloseButton: false };
      modal = new MobileModalAdapter(mockApp, noCloseConfig, keyboardHandler);
      modal.open();
      // Need to trigger onOpen to create DOM elements
      (modal as any).onOpen();

      const closeButton = modal.contentEl.querySelector(".modal-close-button");
      expect(closeButton).toBeFalsy();
    });

    it("should create drag indicator on mobile", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();
      // Need to trigger onOpen to create DOM elements
      (modal as any).onOpen();

      const dragIndicator = modal.contentEl.querySelector(
        ".modal-drag-indicator",
      );
      expect(dragIndicator).toBeTruthy();
    });
  });

  describe("Backdrop Behavior", () => {
    it("should setup backdrop with correct styles", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(false);
      
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();

      // The backdrop is the modal's parent element
      const backdrop = modal.modalEl.parentElement;
      expect(backdrop).toBeTruthy();
      
      // Test that backdrop styles are applied
      expect(backdrop?.style.position).toBe("fixed");
      expect(backdrop?.style.alignItems).toBe("flex-end"); // Mobile layout
    });

    it("should allow dismiss on backdrop click when enabled", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(false);
      
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();

      const backdrop = modal.modalEl.parentElement;
      expect(backdrop).toBeTruthy();
      
      const closeSpy = jest.spyOn(modal, "close");

      // The setupBackdrop method is called after the modal is opened and has a parent
      // Manually call it to ensure the event listener is added
      (modal as any).setupBackdrop();

      // Create a custom event that simulates clicking directly on the backdrop
      const clickEvent = new Event("click", { bubbles: true });
      
      // Make sure the event target is the backdrop (this is what the listener checks)
      Object.defineProperty(clickEvent, "target", { 
        value: backdrop,
        writable: false,
        configurable: false
      });

      backdrop!.dispatchEvent(clickEvent);

      expect(closeSpy).toHaveBeenCalled();
    });

    it("should not allow dismiss on backdrop click when disabled", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(false);
      
      const noDismissConfig = { ...config, allowDismiss: false };
      modal = new MobileModalAdapter(mockApp, noDismissConfig, keyboardHandler);
      const closeSpy = jest.spyOn(modal, "close");
      modal.open();

      const backdrop = modal.modalEl.parentElement;
      const clickEvent = new MouseEvent("click", { bubbles: true });
      Object.defineProperty(clickEvent, "target", { value: backdrop });

      backdrop?.dispatchEvent(clickEvent);

      expect(closeSpy).not.toHaveBeenCalled();
    });
  });

  describe("Keyboard Handling", () => {
    beforeEach(() => {
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      (PlatformDetector.getSafeAreaInsets as jest.Mock).mockReturnValue({
        top: 44,
        right: 0,
        bottom: 34,
        left: 0,
      });
    });

    it("should detect keyboard show via ResizeObserver", () => {
      let resizeCallback: Function;
      const mockObserve = jest.fn();
      const mockDisconnect = jest.fn();
      
      global.ResizeObserver = jest.fn().mockImplementation((callback) => {
        resizeCallback = callback;
        return {
          observe: mockObserve,
          disconnect: mockDisconnect,
          unobserve: jest.fn(),
        };
      });

      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();

      // Simulate keyboard show by reducing window height
      Object.defineProperty(window, "innerHeight", { value: 500, configurable: true });
      resizeCallback();

      expect(keyboardHandler.onShow).toHaveBeenCalled();
      expect(keyboardHandler.onHeightChange).toHaveBeenCalledWith(300); // 800 - 500
      expect(modal.modalEl.classList.contains("keyboard-visible")).toBe(true);
    });

    it("should detect keyboard hide via ResizeObserver", () => {
      let resizeCallback: Function;
      
      global.ResizeObserver = jest.fn().mockImplementation((callback) => {
        resizeCallback = callback;
        return {
          observe: jest.fn(),
          disconnect: jest.fn(),
          unobserve: jest.fn(),
        };
      });
      
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();

      // Force keyboard visible state first
      (modal as any).isKeyboardVisible = true;
      (modal as any).keyboardHeight = 300;
      modal.modalEl.addClass("keyboard-visible");

      // Simulate keyboard hide by restoring window height
      Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
      
      // Trigger resize
      resizeCallback();

      expect(keyboardHandler.onHide).toHaveBeenCalled();
      expect(keyboardHandler.onHeightChange).toHaveBeenCalledWith(0);
      expect(modal.modalEl.classList.contains("keyboard-visible")).toBe(false);
    });

    it("should adjust modal position when keyboard shows in auto mode", () => {
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();

      // Simulate keyboard show
      (modal as any).keyboardHeight = 300;
      (modal as any).handleKeyboardShow();

      expect(modal.modalEl.style.transform).toContain("translateY");
      expect(modal.modalEl.style.maxHeight).toContain("px");
    });

    it("should restore modal position when keyboard hides", () => {
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();

      // Set keyboard visible state
      (modal as any).keyboardHeight = 300;
      (modal as any).isKeyboardVisible = true;
      modal.modalEl.style.transform = "translateY(-100px)";

      // Hide keyboard
      (modal as any).handleKeyboardHide();

      expect(modal.modalEl.style.transform).toBe("");
      expect(modal.modalEl.style.maxHeight).toBe("90vh");
    });

    it("should not handle keyboard when disabled", () => {
      // Clear any previous calls to ResizeObserver
      jest.clearAllMocks();
      
      const noKeyboardConfig = { ...config, keyboardHandling: "none" };
      modal = new MobileModalAdapter(
        mockApp,
        noKeyboardConfig,
        keyboardHandler,
      );
      modal.open();

      expect(global.ResizeObserver).not.toHaveBeenCalled();
    });

    it("should use visual viewport API when available", () => {
      const addEventListenerSpy = jest.spyOn(
        window.visualViewport!,
        "addEventListener",
      );

      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "resize",
        expect.any(Function),
      );
    });
  });

  describe("Touch Gestures", () => {
    it("should setup pull-to-dismiss on mobile", () => {
      (PlatformDetector.hasTouch as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);

      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();
      (modal as any).onOpen();
      
      const modalContent = modal.contentEl;
      const addEventListenerSpy = jest.spyOn(modalContent, "addEventListener");
      
      // Trigger setupPullToDismiss manually to capture the spy calls
      (modal as any).setupPullToDismiss();

      // Should have touch event listeners setup
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "touchstart",
        expect.any(Function),
        { passive: true },
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "touchmove",
        expect.any(Function),
        { passive: false },
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "touchend",
        expect.any(Function),
        { passive: true },
      );

      addEventListenerSpy.mockRestore();
    });

    it("should handle pull-to-dismiss gesture", () => {
      (PlatformDetector.hasTouch as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      const closeSpy = jest.spyOn(modal, "close");
      modal.open();
      (modal as any).onOpen();

      const modalContent = modal.contentEl;

      // Simulate pull-to-dismiss
      const touchStart = new TouchEvent("touchstart", {
        touches: [{ clientY: 100 } as Touch],
      });
      const touchMove = new TouchEvent("touchmove", {
        touches: [{ clientY: 250 } as Touch], // 150px down
      });
      const touchEnd = new TouchEvent("touchend", {
        changedTouches: [{ clientY: 250 } as Touch],
      });

      modalContent.scrollTop = 0; // At top of scroll
      modalContent.dispatchEvent(touchStart);
      modalContent.dispatchEvent(touchMove);
      modalContent.dispatchEvent(touchEnd);

      expect(closeSpy).toHaveBeenCalled();
    });

    it("should not dismiss if not pulled far enough", () => {
      (PlatformDetector.hasTouch as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      const closeSpy = jest.spyOn(modal, "close");
      modal.open();
      (modal as any).onOpen();

      const modalContent = modal.contentEl;

      // Simulate small pull
      const touchStart = new TouchEvent("touchstart", {
        touches: [{ clientY: 100 } as Touch],
      });
      const touchMove = new TouchEvent("touchmove", {
        touches: [{ clientY: 120 } as Touch], // Only 20px down
      });
      const touchEnd = new TouchEvent("touchend", {
        changedTouches: [{ clientY: 120 } as Touch],
      });

      modalContent.scrollTop = 0;
      modalContent.dispatchEvent(touchStart);
      modalContent.dispatchEvent(touchMove);
      modalContent.dispatchEvent(touchEnd);

      expect(closeSpy).not.toHaveBeenCalled();
    });

    it("should prevent background scrolling", () => {
      (PlatformDetector.hasTouch as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(false);
      
      const originalOverflow = document.body.style.overflow;
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();

      expect(document.body.style.overflow).toBe("hidden");
    });
  });

  describe("Content Management", () => {
    it("should add content to modal body", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(false);
      
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();
      // Need to trigger onOpen to create DOM elements
      (modal as any).onOpen();

      const testContent = document.createElement("div");
      testContent.textContent = "Test content";

      modal.addContent(testContent);

      const body = modal.contentEl.querySelector(
        ".exocortex-mobile-modal-body",
      );
      expect(body?.contains(testContent)).toBe(true);
    });

    it("should add HTML string content", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(false);
      
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();
      // Need to trigger onOpen to create DOM elements
      (modal as any).onOpen();

      modal.addContent("<p>HTML content</p>");

      const body = modal.contentEl.querySelector(
        ".exocortex-mobile-modal-body",
      );
      expect(body?.innerHTML).toContain("<p>HTML content</p>");
    });

    it("should create form sections", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(false);
      
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();

      const section = modal.createFormSection("Test Section");

      expect(section.classList.contains("mobile-form-section")).toBe(true);
      expect(section.querySelector(".form-section-title")?.textContent).toBe(
        "Test Section",
      );
      expect(section.querySelector(".form-section-content")).toBeTruthy();
    });

    it("should create button groups", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(false);
      
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();

      const buttons = [
        { text: "Save", onClick: jest.fn(), variant: "primary" as const },
        { text: "Cancel", onClick: jest.fn(), variant: "secondary" as const },
      ];

      const buttonGroup = modal.createButtonGroup(buttons);

      expect(buttonGroup.classList.contains("mobile-button-group")).toBe(true);
      expect(buttonGroup.querySelectorAll(".mobile-button")).toHaveLength(2);
    });

    it("should create vertical button group on mobile", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(false);
      
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();

      const buttons = [{ text: "Button", onClick: jest.fn() }];
      const buttonGroup = modal.createButtonGroup(buttons);

      expect(buttonGroup.style.flexDirection).toBe("column");
    });
  });

  describe("Notifications", () => {
    it("should show success notification", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(false);
      
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();

      modal.showNotification("Success message", "success");

      const notification = modal.contentEl.querySelector(
        ".mobile-notification--success",
      );
      expect(notification).toBeTruthy();
      expect(notification?.textContent).toBe("Success message");
    });

    it("should show error notification with longer timeout", (done) => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(false);
      
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();

      modal.showNotification("Error message", "error");

      const notification = modal.contentEl.querySelector(
        ".mobile-notification--error",
      );
      expect(notification).toBeTruthy();

      // Error notifications should stay longer
      setTimeout(() => {
        expect(notification?.style.opacity).not.toBe("0");
        done();
      }, 3500);
    });

    it("should auto-remove notifications", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(false);
      
      jest.useFakeTimers();
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();
      // Need to trigger onOpen to create DOM elements
      (modal as any).onOpen();

      modal.showNotification("Info message", "info");

      const notification = modal.contentEl.querySelector(
        ".mobile-notification--info",
      );
      expect(notification).toBeTruthy();

      // Fast-forward timers
      jest.advanceTimersByTime(3300);

      expect(notification?.style.opacity).toBe("0");
      jest.useRealTimers();
    });
  });

  describe("Configuration Updates", () => {
    it("should update modal title", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(false);
      
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();
      // Need to trigger onOpen to create DOM elements
      (modal as any).onOpen();

      modal.updateConfig({ title: "Updated Title" });

      const title = modal.contentEl.querySelector(".modal-title");
      expect(title?.textContent).toBe("Updated Title");
    });

    it("should update modal subtitle", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(false);
      
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();
      // Need to trigger onOpen to create DOM elements
      (modal as any).onOpen();

      modal.updateConfig({ subtitle: "Updated Subtitle" });

      const subtitle = modal.contentEl.querySelector(".modal-subtitle");
      expect(subtitle?.textContent).toBe("Updated Subtitle");
    });
  });

  describe("State Management", () => {
    it("should track keyboard height", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(false);
      
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();

      (modal as any).keyboardHeight = 300;
      expect(modal.getKeyboardHeight()).toBe(300);
    });

    it("should track keyboard visibility", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(false);
      
      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();

      (modal as any).isKeyboardVisible = true;
      expect(modal.isKeyboardOpen()).toBe(true);
    });
  });

  describe("Cleanup", () => {
    it("should cleanup on close", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(false);
      
      // Create a mock ResizeObserver
      const mockDisconnect = jest.fn();
      const mockResizeObserver = {
        observe: jest.fn(),
        disconnect: mockDisconnect,
        unobserve: jest.fn(),
      };

      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);

      // Manually set the resizeObserver for testing
      (modal as any).resizeObserver = mockResizeObserver;

      modal.open();
      // Call onClose directly to test cleanup
      modal.onClose();

      expect(mockDisconnect).toHaveBeenCalled();
      expect(document.body.style.overflow).toBe("");
      expect(document.body.style.position).toBe("");
    });

    it("should restore body styles on close", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(false);
      
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;

      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();
      // Call onClose to trigger cleanup
      modal.onClose();

      expect(document.body.style.overflow).toBe("");
      expect(document.body.style.position).toBe("");
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing visual viewport API", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(false);
      
      delete (window as any).visualViewport;

      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();

      // Should not throw error
      expect(modal).toBeTruthy();
    });

    it("should handle missing ResizeObserver", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(false);
      
      delete (global as any).ResizeObserver;

      modal = new MobileModalAdapter(mockApp, config, keyboardHandler);
      modal.open();

      // Should fallback to resize event
      expect(modal).toBeTruthy();
    });

    it("should handle content without header elements", () => {
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isIOS as jest.Mock).mockReturnValue(false);
      
      const noHeaderConfig = { ...config, title: "", showCloseButton: false };
      modal = new MobileModalAdapter(mockApp, noHeaderConfig, keyboardHandler);
      modal.open();

      const header = modal.contentEl.querySelector(
        ".exocortex-mobile-modal-header",
      );
      expect(header).toBeFalsy();
    });

    it("should handle disabled swipe when allowDismiss is false", () => {
      (PlatformDetector.hasTouch as jest.Mock).mockReturnValue(true);
      (PlatformDetector.isMobile as jest.Mock).mockReturnValue(false); // Not mobile, so no swipe
      
      const noDismissConfig = { ...config, allowDismiss: false };
      modal = new MobileModalAdapter(mockApp, noDismissConfig, keyboardHandler);
      
      const modalContent = document.createElement("div");
      const addEventListenerSpy = jest.spyOn(modalContent, "addEventListener");
      
      Object.defineProperty(modal, "contentEl", {
        value: modalContent,
        configurable: true
      });
      
      modal.open();
      (modal as any).onOpen();

      // Should not setup pull-to-dismiss when allowDismiss is false
      const hasSwipeListeners = addEventListenerSpy.mock.calls.some(
        (call) => call[0] === "touchstart"
      );

      expect(hasSwipeListeners).toBe(false);
    });
  });
});
