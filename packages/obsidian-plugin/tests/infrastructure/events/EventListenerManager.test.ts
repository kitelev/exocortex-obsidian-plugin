import { EventListenerManager } from "../../../src/adapters/events/EventListenerManager";

describe("EventListenerManager", () => {
  let manager: EventListenerManager;
  let mockElement: HTMLElement;

  beforeEach(() => {
    manager = new EventListenerManager();
    mockElement = document.createElement("div");
  });

  describe("register", () => {
    it("should register event listener on element", () => {
      const handler = jest.fn();
      const addEventListenerSpy = jest.spyOn(mockElement, "addEventListener");

      manager.register(mockElement, "click", handler);

      expect(addEventListenerSpy).toHaveBeenCalledWith("click", handler);
      expect(manager.getListenerCount()).toBe(1);
    });

    it("should track multiple listeners", () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const element2 = document.createElement("button");

      manager.register(mockElement, "click", handler1);
      manager.register(element2, "mouseover", handler2);

      expect(manager.getListenerCount()).toBe(2);
    });

    it("should register same handler multiple times if called multiple times", () => {
      const handler = jest.fn();

      manager.register(mockElement, "click", handler);
      manager.register(mockElement, "click", handler);

      expect(manager.getListenerCount()).toBe(2);
    });

    it("should track different event types on same element", () => {
      const clickHandler = jest.fn();
      const mouseoverHandler = jest.fn();

      manager.register(mockElement, "click", clickHandler);
      manager.register(mockElement, "mouseover", mouseoverHandler);

      expect(manager.getListenerCount()).toBe(2);
    });
  });

  describe("cleanup", () => {
    it("should remove all registered listeners", () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const element2 = document.createElement("button");

      const removeEventListenerSpy1 = jest.spyOn(
        mockElement,
        "removeEventListener",
      );
      const removeEventListenerSpy2 = jest.spyOn(
        element2,
        "removeEventListener",
      );

      manager.register(mockElement, "click", handler1);
      manager.register(element2, "mouseover", handler2);

      manager.cleanup();

      expect(removeEventListenerSpy1).toHaveBeenCalledWith("click", handler1);
      expect(removeEventListenerSpy2).toHaveBeenCalledWith(
        "mouseover",
        handler2,
      );
      expect(manager.getListenerCount()).toBe(0);
    });

    it("should clear internal listener array", () => {
      const handler = jest.fn();

      manager.register(mockElement, "click", handler);
      expect(manager.getListenerCount()).toBe(1);

      manager.cleanup();
      expect(manager.getListenerCount()).toBe(0);
    });

    it("should handle cleanup when no listeners registered", () => {
      expect(() => manager.cleanup()).not.toThrow();
      expect(manager.getListenerCount()).toBe(0);
    });

    it("should allow re-registration after cleanup", () => {
      const handler = jest.fn();

      manager.register(mockElement, "click", handler);
      manager.cleanup();

      manager.register(mockElement, "click", handler);
      expect(manager.getListenerCount()).toBe(1);
    });

    it("should handle multiple cleanups", () => {
      const handler = jest.fn();
      const removeEventListenerSpy = jest.spyOn(
        mockElement,
        "removeEventListener",
      );

      manager.register(mockElement, "click", handler);
      manager.cleanup();
      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
      expect(manager.getListenerCount()).toBe(0);
    });
  });

  describe("getListenerCount", () => {
    it("should return 0 initially", () => {
      expect(manager.getListenerCount()).toBe(0);
    });

    it("should return correct count after registrations", () => {
      const handler = jest.fn();

      manager.register(mockElement, "click", handler);
      expect(manager.getListenerCount()).toBe(1);

      manager.register(mockElement, "mouseover", handler);
      expect(manager.getListenerCount()).toBe(2);

      manager.register(mockElement, "mouseout", handler);
      expect(manager.getListenerCount()).toBe(3);
    });

    it("should return 0 after cleanup", () => {
      const handler = jest.fn();

      manager.register(mockElement, "click", handler);
      manager.register(mockElement, "mouseover", handler);

      manager.cleanup();
      expect(manager.getListenerCount()).toBe(0);
    });
  });

  describe("integration scenarios", () => {
    it("should handle complex registration and cleanup cycle", () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler3 = jest.fn();
      const element2 = document.createElement("button");
      const element3 = document.createElement("input");

      manager.register(mockElement, "click", handler1);
      manager.register(element2, "mouseover", handler2);
      manager.register(element3, "focus", handler3);

      expect(manager.getListenerCount()).toBe(3);

      manager.cleanup();

      expect(manager.getListenerCount()).toBe(0);

      manager.register(mockElement, "keydown", handler1);
      expect(manager.getListenerCount()).toBe(1);
    });

    it("should handle same element with multiple handlers", () => {
      const clickHandler = jest.fn();
      const mouseoverHandler = jest.fn();
      const mouseoutHandler = jest.fn();

      manager.register(mockElement, "click", clickHandler);
      manager.register(mockElement, "mouseover", mouseoverHandler);
      manager.register(mockElement, "mouseout", mouseoutHandler);

      expect(manager.getListenerCount()).toBe(3);

      manager.cleanup();

      mockElement.dispatchEvent(new Event("click"));
      mockElement.dispatchEvent(new Event("mouseover"));
      mockElement.dispatchEvent(new Event("mouseout"));

      expect(clickHandler).not.toHaveBeenCalled();
      expect(mouseoverHandler).not.toHaveBeenCalled();
      expect(mouseoutHandler).not.toHaveBeenCalled();
    });
  });

  describe("unregister", () => {
    it("should remove a specific listener", () => {
      const handler = jest.fn();
      const removeEventListenerSpy = jest.spyOn(mockElement, "removeEventListener");

      manager.register(mockElement, "click", handler);
      const result = manager.unregister(mockElement, "click", handler);

      expect(result).toBe(true);
      expect(manager.getListenerCount()).toBe(0);
      expect(removeEventListenerSpy).toHaveBeenCalledWith("click", handler);
    });

    it("should return false when listener not found", () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      manager.register(mockElement, "click", handler1);
      const result = manager.unregister(mockElement, "click", handler2);

      expect(result).toBe(false);
      expect(manager.getListenerCount()).toBe(1);
    });
  });

  describe("unsubscribe function", () => {
    it("should return unsubscribe function from register", () => {
      const handler = jest.fn();

      const unsubscribe = manager.register(mockElement, "click", handler);

      expect(typeof unsubscribe).toBe("function");
    });

    it("should remove listener when unsubscribe called", () => {
      const handler = jest.fn();

      const unsubscribe = manager.register(mockElement, "click", handler);
      expect(manager.getListenerCount()).toBe(1);

      unsubscribe();

      expect(manager.getListenerCount()).toBe(0);
    });

    it("should prevent memory leaks over multiple cycles", () => {
      for (let cycle = 0; cycle < 5; cycle++) {
        const handler = jest.fn();
        manager.register(mockElement, "click", handler);
        expect(manager.getListenerCount()).toBe(1);

        manager.cleanup();
        expect(manager.getListenerCount()).toBe(0);
      }
    });
  });
});
