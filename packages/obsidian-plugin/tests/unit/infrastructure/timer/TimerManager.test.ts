/**
 * TimerManager Unit Tests
 *
 * Tests lifecycle management for setTimeout/setInterval:
 * - Named and anonymous timers
 * - Automatic cleanup on dispose
 * - AbortController integration for cancellable delays
 * - Memory leak prevention
 */
import { TimerManager, createTimeoutAbortController } from "../../../../src/infrastructure/timer";

describe("TimerManager", () => {
  let timerManager: TimerManager;

  beforeEach(() => {
    timerManager = new TimerManager();
    jest.useFakeTimers();
  });

  afterEach(() => {
    timerManager.dispose();
    jest.useRealTimers();
  });

  describe("setTimeout", () => {
    it("should execute callback after specified delay", () => {
      const callback = jest.fn();

      timerManager.setTimeout("test", callback, 100);

      expect(callback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should return timer ID", () => {
      const callback = jest.fn();
      const timerId = timerManager.setTimeout("test", callback, 100);

      expect(timerId).toBeTruthy();
    });

    it("should support anonymous timers (null name)", () => {
      const callback = jest.fn();

      timerManager.setTimeout(null, callback, 100);

      jest.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should replace existing timer with same name (debounce behavior)", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      timerManager.setTimeout("debounced", callback1, 100);
      jest.advanceTimersByTime(50);

      timerManager.setTimeout("debounced", callback2, 100);
      jest.advanceTimersByTime(100);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it("should not execute callback if disposed before timeout", () => {
      const callback = jest.fn();

      timerManager.setTimeout("test", callback, 100);
      timerManager.dispose();
      jest.advanceTimersByTime(100);

      expect(callback).not.toHaveBeenCalled();
    });

    it("should return null if manager is already disposed", () => {
      const callback = jest.fn();
      timerManager.dispose();

      const result = timerManager.setTimeout("test", callback, 100);

      expect(result).toBeNull();
    });
  });

  describe("setInterval", () => {
    it("should execute callback repeatedly at specified interval", () => {
      const callback = jest.fn();

      timerManager.setInterval("polling", callback, 100);

      jest.advanceTimersByTime(350);

      expect(callback).toHaveBeenCalledTimes(3);
    });

    it("should stop when dispose is called", () => {
      const callback = jest.fn();

      timerManager.setInterval("polling", callback, 100);
      jest.advanceTimersByTime(250);

      expect(callback).toHaveBeenCalledTimes(2);

      timerManager.dispose();
      jest.advanceTimersByTime(200);

      expect(callback).toHaveBeenCalledTimes(2); // No additional calls
    });

    it("should replace existing interval with same name", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      timerManager.setInterval("polling", callback1, 100);
      jest.advanceTimersByTime(150);

      timerManager.setInterval("polling", callback2, 100);
      jest.advanceTimersByTime(150);

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe("clearTimeout", () => {
    it("should cancel a named timeout", () => {
      const callback = jest.fn();

      timerManager.setTimeout("test", callback, 100);
      timerManager.clearTimeout("test");
      jest.advanceTimersByTime(100);

      expect(callback).not.toHaveBeenCalled();
    });

    it("should not throw when clearing non-existent timeout", () => {
      expect(() => timerManager.clearTimeout("non-existent")).not.toThrow();
    });
  });

  describe("clearInterval", () => {
    it("should cancel a named interval", () => {
      const callback = jest.fn();

      timerManager.setInterval("polling", callback, 100);
      jest.advanceTimersByTime(150);

      timerManager.clearInterval("polling");
      jest.advanceTimersByTime(200);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should not throw when clearing non-existent interval", () => {
      expect(() => timerManager.clearInterval("non-existent")).not.toThrow();
    });
  });

  describe("delay (Promise-based)", () => {
    it("should resolve after specified delay", async () => {
      const promise = timerManager.delay(100);

      jest.advanceTimersByTime(100);

      await expect(promise).resolves.toBeUndefined();
    });

    it("should reject when aborted via AbortSignal", async () => {
      const controller = new AbortController();
      const promise = timerManager.delay(100, controller.signal);

      controller.abort();

      await expect(promise).rejects.toMatchObject({
        name: "AbortError",
        message: "Delay aborted",
      });
    });

    it("should reject immediately if signal is already aborted", async () => {
      const controller = new AbortController();
      controller.abort();

      const promise = timerManager.delay(100, controller.signal);

      await expect(promise).rejects.toMatchObject({
        name: "AbortError",
        message: "Delay aborted",
      });
    });

    it("should reject if manager is disposed", async () => {
      timerManager.dispose();

      const promise = timerManager.delay(100);

      await expect(promise).rejects.toMatchObject({
        name: "AbortError",
        message: "TimerManager disposed",
      });
    });
  });

  describe("hasTimeout / hasInterval", () => {
    it("should return true for active timeout", () => {
      timerManager.setTimeout("test", jest.fn(), 100);

      expect(timerManager.hasTimeout("test")).toBe(true);
    });

    it("should return false after timeout completes", () => {
      timerManager.setTimeout("test", jest.fn(), 100);
      jest.advanceTimersByTime(100);

      expect(timerManager.hasTimeout("test")).toBe(false);
    });

    it("should return true for active interval", () => {
      timerManager.setInterval("polling", jest.fn(), 100);

      expect(timerManager.hasInterval("polling")).toBe(true);
    });

    it("should return false after interval is cleared", () => {
      timerManager.setInterval("polling", jest.fn(), 100);
      timerManager.clearInterval("polling");

      expect(timerManager.hasInterval("polling")).toBe(false);
    });
  });

  describe("getActiveTimerCount", () => {
    it("should count all active timers", () => {
      timerManager.setTimeout("timeout1", jest.fn(), 100);
      timerManager.setTimeout("timeout2", jest.fn(), 100);
      timerManager.setTimeout(null, jest.fn(), 100); // anonymous
      timerManager.setInterval("interval1", jest.fn(), 100);

      expect(timerManager.getActiveTimerCount()).toBe(4);
    });

    it("should decrease count as timers complete", () => {
      timerManager.setTimeout("test", jest.fn(), 100);

      expect(timerManager.getActiveTimerCount()).toBe(1);

      jest.advanceTimersByTime(100);

      expect(timerManager.getActiveTimerCount()).toBe(0);
    });
  });

  describe("dispose", () => {
    it("should clear all timers", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      timerManager.setTimeout("timeout", callback1, 100);
      timerManager.setTimeout(null, callback2, 100);
      timerManager.setInterval("interval", callback3, 100);

      timerManager.dispose();
      jest.advanceTimersByTime(200);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).not.toHaveBeenCalled();
    });

    it("should set disposed flag", () => {
      expect(timerManager.disposed).toBe(false);

      timerManager.dispose();

      expect(timerManager.disposed).toBe(true);
    });

    it("should reset timer counts to zero", () => {
      timerManager.setTimeout("test", jest.fn(), 100);
      timerManager.setInterval("polling", jest.fn(), 100);

      timerManager.dispose();

      expect(timerManager.getActiveTimerCount()).toBe(0);
    });
  });
});

describe("createTimeoutAbortController", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should abort after specified timeout", () => {
    const controller = createTimeoutAbortController(1000);

    expect(controller.signal.aborted).toBe(false);

    jest.advanceTimersByTime(1000);

    expect(controller.signal.aborted).toBe(true);
  });

  it("should not abort before timeout", () => {
    const controller = createTimeoutAbortController(1000);

    jest.advanceTimersByTime(500);

    expect(controller.signal.aborted).toBe(false);
  });
});
