import { ObsidianEventBus } from "../../../../src/infrastructure/di/ObsidianEventBus";

describe("ObsidianEventBus", () => {
  let eventBus: ObsidianEventBus;

  beforeEach(() => {
    eventBus = new ObsidianEventBus();
  });

  describe("subscribe and publish", () => {
    it("should call handler when event is published", () => {
      const handler = jest.fn();
      eventBus.subscribe("testEvent", handler);

      eventBus.publish("testEvent", { message: "hello" });

      expect(handler).toHaveBeenCalledWith({ message: "hello" });
    });

    it("should call multiple handlers for same event", () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventBus.subscribe("testEvent", handler1);
      eventBus.subscribe("testEvent", handler2);
      eventBus.publish("testEvent", "data");

      expect(handler1).toHaveBeenCalledWith("data");
      expect(handler2).toHaveBeenCalledWith("data");
    });

    it("should not call handlers for different events", () => {
      const handler = jest.fn();
      eventBus.subscribe("event1", handler);

      eventBus.publish("event2", "data");

      expect(handler).not.toHaveBeenCalled();
    });

    it("should return unsubscribe function", () => {
      const handler = jest.fn();
      const unsubscribe = eventBus.subscribe("testEvent", handler);

      unsubscribe();
      eventBus.publish("testEvent", "data");

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("unsubscribe", () => {
    it("should remove handler from event", () => {
      const handler = jest.fn();
      eventBus.subscribe("testEvent", handler);

      eventBus.unsubscribe("testEvent", handler);
      eventBus.publish("testEvent", "data");

      expect(handler).not.toHaveBeenCalled();
    });

    it("should remove event entry when last handler is removed", () => {
      const handler = jest.fn();
      eventBus.subscribe("testEvent", handler);
      expect(eventBus.getEventCount()).toBe(1);

      eventBus.unsubscribe("testEvent", handler);
      expect(eventBus.getEventCount()).toBe(0);
    });

    it("should not throw when unsubscribing from non-existent event", () => {
      const handler = jest.fn();
      expect(() => {
        eventBus.unsubscribe("nonExistent", handler);
      }).not.toThrow();
    });
  });

  describe("getHandlerCount", () => {
    it("should return 0 for new event bus", () => {
      expect(eventBus.getHandlerCount()).toBe(0);
    });

    it("should return correct count after subscribing", () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventBus.subscribe("event1", handler1);
      eventBus.subscribe("event2", handler2);

      expect(eventBus.getHandlerCount()).toBe(2);
    });

    it("should count multiple handlers per event", () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventBus.subscribe("testEvent", handler1);
      eventBus.subscribe("testEvent", handler2);

      expect(eventBus.getHandlerCount()).toBe(2);
    });

    it("should decrease after unsubscribe", () => {
      const handler = jest.fn();
      eventBus.subscribe("testEvent", handler);
      expect(eventBus.getHandlerCount()).toBe(1);

      eventBus.unsubscribe("testEvent", handler);
      expect(eventBus.getHandlerCount()).toBe(0);
    });
  });

  describe("getEventCount", () => {
    it("should return 0 for new event bus", () => {
      expect(eventBus.getEventCount()).toBe(0);
    });

    it("should return correct count of distinct events", () => {
      eventBus.subscribe("event1", jest.fn());
      eventBus.subscribe("event2", jest.fn());
      eventBus.subscribe("event1", jest.fn()); // Same event

      expect(eventBus.getEventCount()).toBe(2);
    });

    it("should decrease after all handlers for event removed", () => {
      const handler = jest.fn();
      eventBus.subscribe("event1", handler);
      eventBus.subscribe("event2", jest.fn());

      expect(eventBus.getEventCount()).toBe(2);

      eventBus.unsubscribe("event1", handler);
      expect(eventBus.getEventCount()).toBe(1);
    });
  });

  describe("cleanup", () => {
    it("should clear all handlers", () => {
      eventBus.subscribe("event1", jest.fn());
      eventBus.subscribe("event2", jest.fn());
      eventBus.subscribe("event1", jest.fn());

      expect(eventBus.getHandlerCount()).toBe(3);

      eventBus.cleanup();

      expect(eventBus.getHandlerCount()).toBe(0);
    });

    it("should clear all events", () => {
      eventBus.subscribe("event1", jest.fn());
      eventBus.subscribe("event2", jest.fn());

      expect(eventBus.getEventCount()).toBe(2);

      eventBus.cleanup();

      expect(eventBus.getEventCount()).toBe(0);
    });

    it("should allow subscribing after cleanup", () => {
      eventBus.subscribe("event1", jest.fn());
      eventBus.cleanup();

      const handler = jest.fn();
      eventBus.subscribe("newEvent", handler);
      eventBus.publish("newEvent", "data");

      expect(handler).toHaveBeenCalledWith("data");
    });

    it("should not call handlers after cleanup", () => {
      const handler = jest.fn();
      eventBus.subscribe("testEvent", handler);

      eventBus.cleanup();
      eventBus.publish("testEvent", "data");

      expect(handler).not.toHaveBeenCalled();
    });

    it("should be idempotent (multiple cleanups safe)", () => {
      eventBus.subscribe("testEvent", jest.fn());

      eventBus.cleanup();
      eventBus.cleanup();
      eventBus.cleanup();

      expect(eventBus.getHandlerCount()).toBe(0);
      expect(eventBus.getEventCount()).toBe(0);
    });
  });

  describe("error handling", () => {
    it("should continue calling other handlers if one throws", () => {
      const errorHandler = jest.fn(() => {
        throw new Error("Handler error");
      });
      const goodHandler = jest.fn();

      eventBus.subscribe("testEvent", errorHandler);
      eventBus.subscribe("testEvent", goodHandler);

      // Should not throw
      expect(() => {
        eventBus.publish("testEvent", "data");
      }).not.toThrow();

      expect(errorHandler).toHaveBeenCalled();
      expect(goodHandler).toHaveBeenCalled();
    });
  });
});
