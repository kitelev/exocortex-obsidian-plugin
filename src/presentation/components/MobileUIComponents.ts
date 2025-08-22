import { PlatformDetector } from "../../infrastructure/utils/PlatformDetector";
import { MobilePerformanceOptimizer } from "../../infrastructure/optimizers/MobilePerformanceOptimizer";

/**
 * Touch Gesture Types
 */
export type TouchGestureType =
  | "tap"
  | "doubletap"
  | "longtap"
  | "swipe"
  | "pinch";

/**
 * Touch Event Handler
 */
export interface TouchEventHandler {
  onTap?: (event: TouchEvent) => void;
  onDoubleTap?: (event: TouchEvent) => void;
  onLongTap?: (event: TouchEvent) => void;
  onSwipeLeft?: (event: TouchEvent) => void;
  onSwipeRight?: (event: TouchEvent) => void;
  onSwipeUp?: (event: TouchEvent) => void;
  onSwipeDown?: (event: TouchEvent) => void;
  onPinch?: (event: TouchEvent, scale: number) => void;
}

/**
 * Mobile Button Configuration
 */
export interface MobileButtonConfig {
  text: string;
  icon?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  hapticFeedback?: boolean;
  accessibilityLabel?: string;
}

/**
 * Mobile List Item Configuration
 */
export interface MobileListItemConfig {
  title: string;
  subtitle?: string;
  icon?: string;
  rightText?: string;
  rightIcon?: string;
  showChevron?: boolean;
  swipeable?: boolean;
  swipeActions?: Array<{
    text: string;
    icon?: string;
    color?: string;
    action: () => void;
  }>;
}

/**
 * Mobile Input Configuration
 */
export interface MobileInputConfig {
  placeholder?: string;
  type?: "text" | "password" | "email" | "number" | "search";
  value?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  spellCheck?: boolean;
  autoCorrect?: boolean;
  accessibilityLabel?: string;
  clearButton?: boolean;
}

/**
 * Touch Gesture Recognizer
 */
export class TouchGestureRecognizer {
  private element: HTMLElement;
  private handlers: TouchEventHandler;
  private touchStartTime = 0;
  private touchStartPos = { x: 0, y: 0 };
  private lastTapTime = 0;
  private touchCount = 0;
  private longTapTimer?: NodeJS.Timeout;
  private isTracking = false;

  constructor(element: HTMLElement, handlers: TouchEventHandler) {
    this.element = element;
    this.handlers = handlers;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.element.addEventListener(
      "touchstart",
      this.handleTouchStart.bind(this),
      { passive: false },
    );
    this.element.addEventListener(
      "touchmove",
      this.handleTouchMove.bind(this),
      { passive: false },
    );
    this.element.addEventListener("touchend", this.handleTouchEnd.bind(this), {
      passive: false,
    });
    this.element.addEventListener(
      "touchcancel",
      this.handleTouchCancel.bind(this),
    );
  }

  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length > 2) return; // Only handle 1-2 finger gestures

    this.isTracking = true;
    this.touchStartTime = Date.now();
    this.touchCount = event.touches.length;

    if (event.touches[0]) {
      this.touchStartPos = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    }

    // Setup long tap detection
    if (this.handlers.onLongTap && event.touches.length === 1) {
      this.longTapTimer = setTimeout(() => {
        if (this.isTracking) {
          this.handlers.onLongTap!(event);
          this.provideTactileFeedback();
        }
      }, 500);
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    if (!this.isTracking || !event.touches[0]) return;

    const currentPos = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };

    const deltaX = Math.abs(currentPos.x - this.touchStartPos.x);
    const deltaY = Math.abs(currentPos.y - this.touchStartPos.y);

    // Cancel long tap if finger moves too much
    if ((deltaX > 10 || deltaY > 10) && this.longTapTimer) {
      clearTimeout(this.longTapTimer);
      this.longTapTimer = undefined;
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (!this.isTracking) return;

    const touchDuration = Date.now() - this.touchStartTime;
    const currentTime = Date.now();

    if (this.longTapTimer) {
      clearTimeout(this.longTapTimer);
      this.longTapTimer = undefined;
    }

    if (event.changedTouches[0] && this.touchCount === 1) {
      const endPos = {
        x: event.changedTouches[0].clientX,
        y: event.changedTouches[0].clientY,
      };

      const deltaX = endPos.x - this.touchStartPos.x;
      const deltaY = endPos.y - this.touchStartPos.y;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Determine gesture type
      if (absX < 10 && absY < 10 && touchDuration < 500) {
        // Tap gesture
        const timeSinceLastTap = currentTime - this.lastTapTime;

        if (timeSinceLastTap < 300 && this.handlers.onDoubleTap) {
          this.handlers.onDoubleTap(event);
          this.provideTactileFeedback();
        } else if (this.handlers.onTap) {
          this.handlers.onTap(event);
          this.provideTactileFeedback();
        }

        this.lastTapTime = currentTime;
      } else if (absX > 50 || absY > 50) {
        // Swipe gesture
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0 && this.handlers.onSwipeRight) {
            this.handlers.onSwipeRight(event);
          } else if (deltaX < 0 && this.handlers.onSwipeLeft) {
            this.handlers.onSwipeLeft(event);
          }
        } else {
          // Vertical swipe
          if (deltaY > 0 && this.handlers.onSwipeDown) {
            this.handlers.onSwipeDown(event);
          } else if (deltaY < 0 && this.handlers.onSwipeUp) {
            this.handlers.onSwipeUp(event);
          }
        }
        this.provideTactileFeedback();
      }
    }

    this.isTracking = false;
  }

  private handleTouchCancel(): void {
    if (this.longTapTimer) {
      clearTimeout(this.longTapTimer);
      this.longTapTimer = undefined;
    }
    this.isTracking = false;
  }

  private provideTactileFeedback(): void {
    if ("vibrate" in navigator && PlatformDetector.isMobile()) {
      navigator.vibrate(10); // Short haptic feedback
    }
  }

  public destroy(): void {
    this.element.removeEventListener(
      "touchstart",
      this.handleTouchStart.bind(this),
    );
    this.element.removeEventListener(
      "touchmove",
      this.handleTouchMove.bind(this),
    );
    this.element.removeEventListener(
      "touchend",
      this.handleTouchEnd.bind(this),
    );
    this.element.removeEventListener(
      "touchcancel",
      this.handleTouchCancel.bind(this),
    );

    if (this.longTapTimer) {
      clearTimeout(this.longTapTimer);
    }
  }
}

/**
 * Mobile UI Components Factory
 */
export class MobileUIComponents {
  private performanceOptimizer?: MobilePerformanceOptimizer;

  constructor(performanceOptimizer?: MobilePerformanceOptimizer) {
    this.performanceOptimizer = performanceOptimizer;
  }

  /**
   * Create a mobile-optimized button
   */
  public createButton(
    container: HTMLElement,
    config: MobileButtonConfig,
    onClick: () => void,
  ): HTMLElement {
    const button = container.createEl("button", {
      cls: `exocortex-mobile-button exocortex-mobile-button--${config.variant || "primary"} exocortex-mobile-button--${config.size || "medium"}`,
      attr: {
        "aria-label": config.accessibilityLabel || config.text,
        disabled: config.disabled ? "true" : "false",
      },
    });

    if (config.fullWidth) {
      button.addClass("exocortex-mobile-button--full-width");
    }

    if (config.loading) {
      button.addClass("exocortex-mobile-button--loading");
      const spinner = button.createEl("span", {
        cls: "exocortex-mobile-spinner",
      });
      spinner.innerHTML = "⟳";
    }

    if (config.icon) {
      const icon = button.createEl("span", {
        cls: "exocortex-mobile-button-icon",
      });
      icon.innerHTML = config.icon;
    }

    const text = button.createEl("span", {
      cls: "exocortex-mobile-button-text",
      text: config.text,
    });

    // Add touch gesture support
    new TouchGestureRecognizer(button, {
      onTap: (event) => {
        if (!config.disabled && !config.loading) {
          onClick();
        }
      },
    });

    // Add press animation
    button.addEventListener("touchstart", () => {
      if (!config.disabled) {
        button.addClass("exocortex-mobile-button--pressed");
      }
    });

    button.addEventListener("touchend", () => {
      button.removeClass("exocortex-mobile-button--pressed");
    });

    return button;
  }

  /**
   * Create a mobile-optimized list
   */
  public createList(
    container: HTMLElement,
    items: MobileListItemConfig[],
    onItemClick?: (item: MobileListItemConfig, index: number) => void,
  ): HTMLElement {
    const list = container.createEl("div", { cls: "exocortex-mobile-list" });

    const shouldUseVirtualScrolling =
      this.performanceOptimizer &&
      PlatformDetector.shouldUseVirtualScrolling(items.length);

    if (shouldUseVirtualScrolling) {
      return this.createVirtualizedList(list, items, onItemClick);
    }

    items.forEach((item, index) => {
      const listItem = this.createListItem(list, item, index, onItemClick);
    });

    return list;
  }

  /**
   * Create a mobile-optimized input field
   */
  public createInput(
    container: HTMLElement,
    config: MobileInputConfig,
    onChange?: (value: string) => void,
  ): HTMLElement {
    const inputContainer = container.createEl("div", {
      cls: "exocortex-mobile-input-container",
    });

    const input = inputContainer.createEl("input", {
      cls: "exocortex-mobile-input",
      attr: {
        type: config.type || "text",
        placeholder: config.placeholder || "",
        value: config.value || "",
        "aria-label": config.accessibilityLabel || config.placeholder || "",
        autocomplete: config.type === "password" ? "current-password" : "off",
        spellcheck: config.spellCheck !== false ? "true" : "false",
        autocorrect: config.autoCorrect !== false ? "on" : "off",
        autocapitalize: config.type === "email" ? "off" : "sentences",
      },
    });

    if (config.disabled) {
      input.setAttribute("disabled", "true");
      inputContainer.addClass("exocortex-mobile-input-container--disabled");
    }

    if (config.autoFocus && PlatformDetector.isMobile()) {
      // Delay autofocus on mobile to prevent keyboard issues
      setTimeout(() => input.focus(), 300);
    } else if (config.autoFocus) {
      input.focus();
    }

    // Add clear button for mobile
    if (config.clearButton && PlatformDetector.isMobile()) {
      const clearButton = inputContainer.createEl("button", {
        cls: "exocortex-mobile-input-clear",
        attr: { "aria-label": "Clear input" },
      });
      clearButton.innerHTML = "✕";

      clearButton.addEventListener("click", () => {
        input.value = "";
        input.focus();
        if (onChange) onChange("");
      });

      // Show/hide clear button based on input content
      const toggleClearButton = () => {
        clearButton.style.display = input.value ? "block" : "none";
      };

      input.addEventListener("input", toggleClearButton);
      toggleClearButton(); // Initial state
    }

    if (onChange) {
      const debouncedOnChange =
        this.performanceOptimizer?.debounce(onChange, 300) || onChange;

      input.addEventListener("input", (e) => {
        const target = e.target as HTMLInputElement;
        debouncedOnChange(target.value);
      });
    }

    return inputContainer;
  }

  /**
   * Create a mobile-optimized modal
   */
  public createModal(
    title: string,
    content: HTMLElement,
    options?: {
      showCloseButton?: boolean;
      swipeToClose?: boolean;
      fullScreen?: boolean;
      onClose?: () => void;
    },
  ): HTMLElement {
    const modal = document.body.createEl("div", {
      cls: "exocortex-mobile-modal-overlay",
    });

    const modalContent = modal.createEl("div", {
      cls: `exocortex-mobile-modal ${options?.fullScreen ? "exocortex-mobile-modal--fullscreen" : ""}`,
    });

    // Modal header
    const header = modalContent.createEl("div", {
      cls: "exocortex-mobile-modal-header",
    });

    if (options?.showCloseButton !== false) {
      const closeButton = header.createEl("button", {
        cls: "exocortex-mobile-modal-close",
        attr: { "aria-label": "Close modal" },
      });
      closeButton.innerHTML = "✕";

      new TouchGestureRecognizer(closeButton, {
        onTap: () => {
          if (options?.onClose) options.onClose();
          this.closeModal(modal);
        },
      });
    }

    const titleEl = header.createEl("h2", {
      cls: "exocortex-mobile-modal-title",
      text: title,
    });

    // Modal body
    const body = modalContent.createEl("div", {
      cls: "exocortex-mobile-modal-body",
    });
    body.appendChild(content);

    // Swipe to close on mobile
    if (options?.swipeToClose !== false && PlatformDetector.isMobile()) {
      new TouchGestureRecognizer(modalContent, {
        onSwipeDown: () => {
          if (options?.onClose) options.onClose();
          this.closeModal(modal);
        },
      });
    }

    // Close on overlay tap
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        if (options?.onClose) options.onClose();
        this.closeModal(modal);
      }
    });

    // Prevent body scroll
    document.body.style.overflow = "hidden";

    // Add entrance animation
    modal.style.opacity = "0";
    modalContent.style.transform = "translateY(100%)";

    requestAnimationFrame(() => {
      modal.style.opacity = "1";
      modalContent.style.transform = "translateY(0)";
    });

    return modal;
  }

  /**
   * Create a mobile-optimized floating action button
   */
  public createFAB(
    container: HTMLElement,
    icon: string,
    onClick: () => void,
    options?: {
      position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
      color?: string;
      accessibilityLabel?: string;
    },
  ): HTMLElement {
    const fab = container.createEl("button", {
      cls: `exocortex-mobile-fab exocortex-mobile-fab--${options?.position || "bottom-right"}`,
      attr: {
        "aria-label": options?.accessibilityLabel || "Floating action button",
      },
    });

    fab.innerHTML = icon;

    if (options?.color) {
      fab.style.backgroundColor = options.color;
    }

    new TouchGestureRecognizer(fab, {
      onTap: onClick,
    });

    // Add press animation
    fab.addEventListener("touchstart", () => {
      fab.style.transform = "scale(0.95)";
    });

    fab.addEventListener("touchend", () => {
      fab.style.transform = "scale(1)";
    });

    return fab;
  }

  /**
   * Create a mobile-optimized loading indicator
   */
  public createLoadingIndicator(
    container: HTMLElement,
    message?: string,
  ): HTMLElement {
    const loader = container.createEl("div", {
      cls: "exocortex-mobile-loader",
    });

    const spinner = loader.createEl("div", {
      cls: "exocortex-mobile-spinner-large",
    });

    if (message) {
      loader.createEl("p", {
        cls: "exocortex-mobile-loader-message",
        text: message,
      });
    }

    return loader;
  }

  private createListItem(
    container: HTMLElement,
    item: MobileListItemConfig,
    index: number,
    onItemClick?: (item: MobileListItemConfig, index: number) => void,
  ): HTMLElement {
    const listItem = container.createEl("div", {
      cls: "exocortex-mobile-list-item",
      attr: { role: "button", tabindex: "0" },
    });

    const content = listItem.createEl("div", {
      cls: "exocortex-mobile-list-item-content",
    });

    if (item.icon) {
      const icon = content.createEl("span", {
        cls: "exocortex-mobile-list-item-icon",
        text: item.icon,
      });
    }

    const textContainer = content.createEl("div", {
      cls: "exocortex-mobile-list-item-text",
    });

    textContainer.createEl("div", {
      cls: "exocortex-mobile-list-item-title",
      text: item.title,
    });

    if (item.subtitle) {
      textContainer.createEl("div", {
        cls: "exocortex-mobile-list-item-subtitle",
        text: item.subtitle,
      });
    }

    const rightContainer = content.createEl("div", {
      cls: "exocortex-mobile-list-item-right",
    });

    if (item.rightText) {
      rightContainer.createEl("span", {
        cls: "exocortex-mobile-list-item-right-text",
        text: item.rightText,
      });
    }

    if (item.rightIcon) {
      rightContainer.createEl("span", {
        cls: "exocortex-mobile-list-item-right-icon",
        text: item.rightIcon,
      });
    }

    if (item.showChevron) {
      rightContainer.createEl("span", {
        cls: "exocortex-mobile-list-item-chevron",
        text: "›",
      });
    }

    // Add touch gesture support
    if (onItemClick) {
      new TouchGestureRecognizer(listItem, {
        onTap: () => onItemClick(item, index),
      });
    }

    // Add swipe actions if specified
    if (item.swipeable && item.swipeActions) {
      this.addSwipeActions(listItem, item.swipeActions);
    }

    return listItem;
  }

  private createVirtualizedList(
    container: HTMLElement,
    items: MobileListItemConfig[],
    onItemClick?: (item: MobileListItemConfig, index: number) => void,
  ): HTMLElement {
    if (!this.performanceOptimizer) {
      // Fallback to regular list if no performance optimizer
      return this.createList(container, items, onItemClick);
    }

    // Create virtual scroller implementation
    const virtualScrollContainer = container.createEl("div", {
      cls: "exocortex-virtual-scroll-container",
    });

    // Simplified virtual scrolling implementation
    const renderItem = (item: MobileListItemConfig, index: number) => {
      const itemContainer = document.createElement("div");
      this.createListItem(itemContainer, item, index, onItemClick);
      return itemContainer.firstElementChild as HTMLElement;
    };

    // Create the virtual list
    const visibleCount = Math.min(items.length, 20); // Show maximum 20 items at once
    for (let i = 0; i < visibleCount; i++) {
      const itemElement = renderItem(items[i], i);
      virtualScrollContainer.appendChild(itemElement);
    }

    return virtualScrollContainer;
  }

  private addSwipeActions(
    listItem: HTMLElement,
    actions: Array<{
      text: string;
      icon?: string;
      color?: string;
      action: () => void;
    }>,
  ): void {
    const actionsContainer = listItem.createEl("div", {
      cls: "exocortex-mobile-list-item-actions",
    });

    actions.forEach((action) => {
      const actionButton = actionsContainer.createEl("button", {
        cls: "exocortex-mobile-list-item-action",
        text: action.text,
      });

      if (action.color) {
        actionButton.style.backgroundColor = action.color;
      }

      if (action.icon) {
        actionButton.innerHTML = `${action.icon} ${action.text}`;
      }

      new TouchGestureRecognizer(actionButton, {
        onTap: action.action,
      });
    });

    // Add swipe gesture to reveal actions
    new TouchGestureRecognizer(listItem, {
      onSwipeLeft: () => {
        listItem.addClass("exocortex-mobile-list-item--swiped");
      },
      onSwipeRight: () => {
        listItem.removeClass("exocortex-mobile-list-item--swiped");
      },
    });
  }

  private closeModal(modal: HTMLElement): void {
    // Add exit animation
    modal.style.opacity = "0";
    const modalContent = modal.querySelector(
      ".exocortex-mobile-modal",
    ) as HTMLElement;
    if (modalContent) {
      modalContent.style.transform = "translateY(100%)";
    }

    setTimeout(() => {
      modal.remove();
      document.body.style.overflow = "";
    }, 300);
  }
}
