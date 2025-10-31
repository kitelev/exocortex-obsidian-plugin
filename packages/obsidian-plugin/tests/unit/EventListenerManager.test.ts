import { EventListenerManager } from "../../src/adapters/events/EventListenerManager";

describe("EventListenerManager", () => {
  let manager: EventListenerManager;
  let mockElement: HTMLElement;
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    manager = new EventListenerManager();

    // Create a mock HTML element
    mockElement = document.createElement("div");
    addEventListenerSpy = jest.spyOn(mockElement, "addEventListener");
    removeEventListenerSpy = jest.spyOn(mockElement, "removeEventListener");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with zero listeners", () => {
      expect(manager.getListenerCount()).toBe(0);
    });

    it("should create independent instances", () => {
      const manager1 = new EventListenerManager();
      const manager2 = new EventListenerManager();

      const element = document.createElement("button");
      const handler = jest.fn();

      manager1.register(element, "click", handler);

      expect(manager1.getListenerCount()).toBe(1);
      expect(manager2.getListenerCount()).toBe(0);
    });
  });

  describe("register", () => {
    it("should register a click event listener", () => {
      const handler = jest.fn();

      manager.register(mockElement, "click", handler);

      expect(addEventListenerSpy).toHaveBeenCalledWith("click", handler);
      expect(manager.getListenerCount()).toBe(1);
    });

    it("should register multiple event listeners", () => {
      const clickHandler = jest.fn();
      const mouseoverHandler = jest.fn();
      const keydownHandler = jest.fn();

      manager.register(mockElement, "click", clickHandler);
      manager.register(mockElement, "mouseover", mouseoverHandler);
      manager.register(mockElement, "keydown", keydownHandler);

      expect(addEventListenerSpy).toHaveBeenCalledTimes(3);
      expect(addEventListenerSpy).toHaveBeenCalledWith("click", clickHandler);
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "mouseover",
        mouseoverHandler,
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        keydownHandler,
      );
      expect(manager.getListenerCount()).toBe(3);
    });

    it("should register listeners on different elements", () => {
      const element1 = document.createElement("button");
      const element2 = document.createElement("input");
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      const spy1 = jest.spyOn(element1, "addEventListener");
      const spy2 = jest.spyOn(element2, "addEventListener");

      manager.register(element1, "click", handler1);
      manager.register(element2, "change", handler2);

      expect(spy1).toHaveBeenCalledWith("click", handler1);
      expect(spy2).toHaveBeenCalledWith("change", handler2);
      expect(manager.getListenerCount()).toBe(2);
    });

    it("should allow registering the same handler multiple times", () => {
      const handler = jest.fn();

      manager.register(mockElement, "click", handler);
      manager.register(mockElement, "click", handler);

      expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
      expect(manager.getListenerCount()).toBe(2);
    });

    it("should register different event types on the same element", () => {
      const clickHandler = jest.fn();
      const focusHandler = jest.fn();

      manager.register(mockElement, "click", clickHandler);
      manager.register(mockElement, "focus", focusHandler);

      expect(addEventListenerSpy).toHaveBeenCalledWith("click", clickHandler);
      expect(addEventListenerSpy).toHaveBeenCalledWith("focus", focusHandler);
      expect(manager.getListenerCount()).toBe(2);
    });

    it("should handle custom event types", () => {
      const handler = jest.fn();

      manager.register(mockElement, "customEvent", handler);

      expect(addEventListenerSpy).toHaveBeenCalledWith("customEvent", handler);
      expect(manager.getListenerCount()).toBe(1);
    });

    it("should handle arrow function handlers", () => {
      const handler = () => console.log("clicked");

      manager.register(mockElement, "click", handler);

      expect(addEventListenerSpy).toHaveBeenCalledWith("click", handler);
      expect(manager.getListenerCount()).toBe(1);
    });

    it("should handle bound function handlers", () => {
      const obj = {
        name: "test",
        handler: function () {
          return this.name;
        },
      };
      const boundHandler = obj.handler.bind(obj);

      manager.register(mockElement, "click", boundHandler);

      expect(addEventListenerSpy).toHaveBeenCalledWith("click", boundHandler);
      expect(manager.getListenerCount()).toBe(1);
    });
  });

  describe("cleanup", () => {
    it("should remove all registered event listeners", () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      manager.register(mockElement, "click", handler1);
      manager.register(mockElement, "mouseover", handler2);

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
      expect(removeEventListenerSpy).toHaveBeenCalledWith("click", handler1);
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "mouseover",
        handler2,
      );
      expect(manager.getListenerCount()).toBe(0);
    });

    it("should handle cleanup with no listeners", () => {
      manager.cleanup();

      expect(removeEventListenerSpy).not.toHaveBeenCalled();
      expect(manager.getListenerCount()).toBe(0);
    });

    it("should cleanup listeners from multiple elements", () => {
      const element1 = document.createElement("button");
      const element2 = document.createElement("input");
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      const removeSpy1 = jest.spyOn(element1, "removeEventListener");
      const removeSpy2 = jest.spyOn(element2, "removeEventListener");

      manager.register(element1, "click", handler1);
      manager.register(element2, "change", handler2);

      manager.cleanup();

      expect(removeSpy1).toHaveBeenCalledWith("click", handler1);
      expect(removeSpy2).toHaveBeenCalledWith("change", handler2);
      expect(manager.getListenerCount()).toBe(0);
    });

    it("should allow registering new listeners after cleanup", () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      manager.register(mockElement, "click", handler1);
      manager.cleanup();

      manager.register(mockElement, "mouseover", handler2);

      expect(manager.getListenerCount()).toBe(1);
      expect(removeEventListenerSpy).toHaveBeenCalledWith("click", handler1);
      expect(addEventListenerSpy).toHaveBeenCalledWith("mouseover", handler2);
    });

    it("should cleanup duplicate registrations correctly", () => {
      const handler = jest.fn();

      manager.register(mockElement, "click", handler);
      manager.register(mockElement, "click", handler);

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
      expect(removeEventListenerSpy).toHaveBeenCalledWith("click", handler);
      expect(manager.getListenerCount()).toBe(0);
    });

    it("should handle multiple cleanups", () => {
      const handler = jest.fn();

      manager.register(mockElement, "click", handler);
      manager.cleanup();
      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
      expect(manager.getListenerCount()).toBe(0);
    });

    it("should cleanup listeners with the exact handler reference", () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      manager.register(mockElement, "click", handler1);
      manager.register(mockElement, "click", handler2);

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith("click", handler1);
      expect(removeEventListenerSpy).toHaveBeenCalledWith("click", handler2);
    });
  });

  describe("getListenerCount", () => {
    it("should return the correct count of listeners", () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler3 = jest.fn();

      expect(manager.getListenerCount()).toBe(0);

      manager.register(mockElement, "click", handler1);
      expect(manager.getListenerCount()).toBe(1);

      manager.register(mockElement, "mouseover", handler2);
      expect(manager.getListenerCount()).toBe(2);

      manager.register(mockElement, "keydown", handler3);
      expect(manager.getListenerCount()).toBe(3);

      manager.cleanup();
      expect(manager.getListenerCount()).toBe(0);
    });

    it("should track count across different elements", () => {
      const elements = [
        document.createElement("button"),
        document.createElement("input"),
        document.createElement("div"),
      ];
      const handler = jest.fn();

      elements.forEach((el) => {
        manager.register(el, "click", handler);
      });

      expect(manager.getListenerCount()).toBe(3);
    });

    it("should track count for different event types", () => {
      const handler = jest.fn();
      const events = ["click", "mouseover", "mouseout", "focus", "blur"];

      events.forEach((event) => {
        manager.register(mockElement, event, handler);
      });

      expect(manager.getListenerCount()).toBe(5);
    });
  });

  describe("integration scenarios", () => {
    it("should handle a typical UI component lifecycle", () => {
      // Simulating a component mounting
      const container = document.createElement("div");
      const button = document.createElement("button");
      const input = document.createElement("input");

      container.appendChild(button);
      container.appendChild(input);

      const buttonClickHandler = jest.fn();
      const inputChangeHandler = jest.fn();
      const containerClickHandler = jest.fn();

      // Register event listeners
      manager.register(button, "click", buttonClickHandler);
      manager.register(input, "change", inputChangeHandler);
      manager.register(container, "click", containerClickHandler);

      expect(manager.getListenerCount()).toBe(3);

      // Simulate component unmounting
      manager.cleanup();

      expect(manager.getListenerCount()).toBe(0);
    });

    it("should handle dynamic element addition", () => {
      const handlers: (() => void)[] = [];
      const elements: HTMLElement[] = [];

      // Dynamically add elements and register listeners
      for (let i = 0; i < 10; i++) {
        const element = document.createElement("div");
        const handler = jest.fn();

        elements.push(element);
        handlers.push(handler);

        manager.register(element, "click", handler);
      }

      expect(manager.getListenerCount()).toBe(10);

      // Cleanup all
      manager.cleanup();

      expect(manager.getListenerCount()).toBe(0);

      // Verify all listeners were removed
      elements.forEach((element, index) => {
        const spy = jest.spyOn(element, "removeEventListener");
        manager.register(element, "click", handlers[index]);
        manager.cleanup();
        expect(spy).toHaveBeenCalled();
      });
    });

    it("should handle mixed event types on multiple elements", () => {
      const form = document.createElement("form");
      const submitButton = document.createElement("button");
      const resetButton = document.createElement("button");
      const textInput = document.createElement("input");

      const formSubmitHandler = jest.fn();
      const submitClickHandler = jest.fn();
      const resetClickHandler = jest.fn();
      const inputHandler = jest.fn();
      const focusHandler = jest.fn();
      const blurHandler = jest.fn();

      manager.register(form, "submit", formSubmitHandler);
      manager.register(submitButton, "click", submitClickHandler);
      manager.register(resetButton, "click", resetClickHandler);
      manager.register(textInput, "input", inputHandler);
      manager.register(textInput, "focus", focusHandler);
      manager.register(textInput, "blur", blurHandler);

      expect(manager.getListenerCount()).toBe(6);

      manager.cleanup();

      expect(manager.getListenerCount()).toBe(0);
    });

    it("should handle event delegation pattern", () => {
      const parentElement = document.createElement("ul");

      // Event delegation - single listener on parent for all children
      const delegatedHandler = jest.fn((e: Event) => {
        const target = e.target as HTMLElement;
        if (target.tagName === "LI") {
          // Handle list item click
        }
      });

      manager.register(parentElement, "click", delegatedHandler);

      expect(manager.getListenerCount()).toBe(1);

      manager.cleanup();

      expect(manager.getListenerCount()).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("should handle null or undefined elements gracefully", () => {
      // This test depends on TypeScript's type checking
      // In a real scenario, TypeScript would prevent this
      // But we test runtime behavior if it somehow happens
      const handler = jest.fn();

      // Type assertion to bypass TypeScript checking for this test
      expect(() => {
        manager.register(null as any, "click", handler);
      }).toThrow();
    });

    it("should handle empty event type string", () => {
      const handler = jest.fn();

      manager.register(mockElement, "", handler);

      expect(addEventListenerSpy).toHaveBeenCalledWith("", handler);
      expect(manager.getListenerCount()).toBe(1);
    });

    it("should handle very long event type names", () => {
      const handler = jest.fn();
      const longEventName = "a".repeat(1000);

      manager.register(mockElement, longEventName, handler);

      expect(addEventListenerSpy).toHaveBeenCalledWith(longEventName, handler);
      expect(manager.getListenerCount()).toBe(1);
    });

    it("should maintain correct count after partial cleanup failures", () => {
      const element1 = document.createElement("button");
      const element2 = document.createElement("input");
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      // Make one removeEventListener throw an error
      jest.spyOn(element1, "removeEventListener").mockImplementation(() => {
        throw new Error("Remove failed");
      });
      jest.spyOn(element2, "removeEventListener");

      manager.register(element1, "click", handler1);
      manager.register(element2, "change", handler2);

      expect(() => manager.cleanup()).toThrow("Remove failed");

      // When cleanup fails, the internal array is not reset
      // because the error interrupts the cleanup process
      expect(manager.getListenerCount()).toBe(2);
    });
  });

  describe("memory management", () => {
    it("should not leak memory when registering many listeners", () => {
      const handlers: (() => void)[] = [];

      // Register many listeners
      for (let i = 0; i < 1000; i++) {
        const handler = jest.fn();
        handlers.push(handler);
        manager.register(mockElement, "click", handler);
      }

      expect(manager.getListenerCount()).toBe(1000);

      // Cleanup should free all references
      manager.cleanup();

      expect(manager.getListenerCount()).toBe(0);
    });

    it("should clear internal array on cleanup", () => {
      const handler = jest.fn();

      manager.register(mockElement, "click", handler);
      manager.register(mockElement, "mouseover", handler);

      expect(manager.getListenerCount()).toBe(2);

      manager.cleanup();

      // After cleanup, internal array should be empty
      expect(manager.getListenerCount()).toBe(0);

      // Registering new listeners should start fresh
      manager.register(mockElement, "focus", handler);
      expect(manager.getListenerCount()).toBe(1);
    });
  });
});
