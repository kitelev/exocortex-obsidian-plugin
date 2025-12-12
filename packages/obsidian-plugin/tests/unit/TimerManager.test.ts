import { TimerManager, createTimeoutAbortController } from "../../src/infrastructure/timer/TimerManager";

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

  describe("constructor", () => {
    it("should initialize with no active timers", () => {
      expect(timerManager.getActiveTimerCount()).toBe(0);
    });

    it("should initialize as not disposed", () => {
      expect(timerManager.disposed).toBe(false);
    });
  });

  describe("setTimeout", () => {
    it("should execute callback after delay", () => {
      const callback = jest.fn();
      timerManager.setTimeout("test-timer", callback, 100);

      expect(callback).not.toHaveBeenCalled();
      jest.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should return timer ID", () => {
      const callback = jest.fn();
      const timerId = timerManager.setTimeout("test-timer", callback, 100);

      expect(timerId).not.toBeNull();
    });

    it("should track named timeout", () => {
      timerManager.setTimeout("test-timer", jest.fn(), 100);

      expect(timerManager.hasTimeout("test-timer")).toBe(true);
      expect(timerManager.getActiveTimerCount()).toBe(1);
    });

    it("should remove timeout from tracking after execution", () => {
      timerManager.setTimeout("test-timer", jest.fn(), 100);

      jest.advanceTimersByTime(100);

      expect(timerManager.hasTimeout("test-timer")).toBe(false);
      expect(timerManager.getActiveTimerCount()).toBe(0);
    });

    it("should replace existing timer with same name (debounce behavior)", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      timerManager.setTimeout("debounce", callback1, 100);
      jest.advanceTimersByTime(50);
      timerManager.setTimeout("debounce", callback2, 100);

      jest.advanceTimersByTime(100);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it("should handle anonymous timeouts (null name)", () => {
      const callback = jest.fn();
      timerManager.setTimeout(null, callback, 100);

      expect(timerManager.getActiveTimerCount()).toBe(1);
      jest.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(timerManager.getActiveTimerCount()).toBe(0);
    });

    it("should return null if manager is disposed", () => {
      timerManager.dispose();

      const timerId = timerManager.setTimeout("test", jest.fn(), 100);

      expect(timerId).toBeNull();
    });

    it("should not execute callback if disposed before delay completes", () => {
      const callback = jest.fn();
      timerManager.setTimeout("test", callback, 100);

      jest.advanceTimersByTime(50);
      timerManager.dispose();
      jest.advanceTimersByTime(100);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("setInterval", () => {
    it("should execute callback repeatedly", () => {
      const callback = jest.fn();
      timerManager.setInterval("test-interval", callback, 100);

      jest.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it("should return timer ID", () => {
      const timerId = timerManager.setInterval("test-interval", jest.fn(), 100);

      expect(timerId).not.toBeNull();
    });

    it("should track named interval", () => {
      timerManager.setInterval("test-interval", jest.fn(), 100);

      expect(timerManager.hasInterval("test-interval")).toBe(true);
      expect(timerManager.getActiveTimerCount()).toBe(1);
    });

    it("should replace existing interval with same name", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      timerManager.setInterval("polling", callback1, 100);
      jest.advanceTimersByTime(150);
      timerManager.setInterval("polling", callback2, 100);

      jest.advanceTimersByTime(100);

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it("should return null if manager is disposed", () => {
      timerManager.dispose();

      const timerId = timerManager.setInterval("test", jest.fn(), 100);

      expect(timerId).toBeNull();
    });

    it("should not execute callback if disposed", () => {
      const callback = jest.fn();
      timerManager.setInterval("test", callback, 100);

      timerManager.dispose();
      jest.advanceTimersByTime(300);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("clearTimeout", () => {
    it("should cancel named timeout", () => {
      const callback = jest.fn();
      timerManager.setTimeout("test", callback, 100);

      timerManager.clearTimeout("test");
      jest.advanceTimersByTime(100);

      expect(callback).not.toHaveBeenCalled();
      expect(timerManager.hasTimeout("test")).toBe(false);
    });

    it("should do nothing for non-existent timer", () => {
      expect(() => timerManager.clearTimeout("non-existent")).not.toThrow();
    });
  });

  describe("clearInterval", () => {
    it("should stop named interval", () => {
      const callback = jest.fn();
      timerManager.setInterval("test", callback, 100);

      jest.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);

      timerManager.clearInterval("test");
      jest.advanceTimersByTime(300);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(timerManager.hasInterval("test")).toBe(false);
    });

    it("should do nothing for non-existent interval", () => {
      expect(() => timerManager.clearInterval("non-existent")).not.toThrow();
    });
  });

  describe("delay", () => {
    it("should resolve after specified delay", async () => {
      const delayPromise = timerManager.delay(100);

      jest.advanceTimersByTime(100);

      await expect(delayPromise).resolves.toBeUndefined();
    });

    it("should reject if aborted before delay completes", async () => {
      const controller = new AbortController();
      const delayPromise = timerManager.delay(100, controller.signal);

      controller.abort();

      await expect(delayPromise).rejects.toThrow("Delay aborted");
    });

    it("should reject immediately if signal is already aborted", async () => {
      const controller = new AbortController();
      controller.abort();

      const delayPromise = timerManager.delay(100, controller.signal);

      await expect(delayPromise).rejects.toThrow("Delay aborted");
    });

    it("should reject if manager is disposed", async () => {
      timerManager.dispose();

      const delayPromise = timerManager.delay(100);

      await expect(delayPromise).rejects.toThrow("TimerManager disposed");
    });

    it("should track delay as anonymous timeout", () => {
      timerManager.delay(100);

      expect(timerManager.getActiveTimerCount()).toBe(1);
    });

    it("should clean up on completion", async () => {
      const delayPromise = timerManager.delay(100);

      jest.advanceTimersByTime(100);
      await delayPromise;

      expect(timerManager.getActiveTimerCount()).toBe(0);
    });

    it("should clean up on abort", async () => {
      const controller = new AbortController();
      const delayPromise = timerManager.delay(100, controller.signal);

      controller.abort();

      try {
        await delayPromise;
      } catch {
        // Expected
      }

      expect(timerManager.getActiveTimerCount()).toBe(0);
    });
  });

  describe("hasTimeout", () => {
    it("should return true for existing timeout", () => {
      timerManager.setTimeout("exists", jest.fn(), 100);

      expect(timerManager.hasTimeout("exists")).toBe(true);
    });

    it("should return false for non-existent timeout", () => {
      expect(timerManager.hasTimeout("does-not-exist")).toBe(false);
    });

    it("should return false after timeout completes", () => {
      timerManager.setTimeout("test", jest.fn(), 100);

      jest.advanceTimersByTime(100);

      expect(timerManager.hasTimeout("test")).toBe(false);
    });
  });

  describe("hasInterval", () => {
    it("should return true for existing interval", () => {
      timerManager.setInterval("exists", jest.fn(), 100);

      expect(timerManager.hasInterval("exists")).toBe(true);
    });

    it("should return false for non-existent interval", () => {
      expect(timerManager.hasInterval("does-not-exist")).toBe(false);
    });

    it("should return true even after interval executes (intervals persist)", () => {
      timerManager.setInterval("test", jest.fn(), 100);

      jest.advanceTimersByTime(500);

      expect(timerManager.hasInterval("test")).toBe(true);
    });
  });

  describe("getActiveTimerCount", () => {
    it("should return 0 initially", () => {
      expect(timerManager.getActiveTimerCount()).toBe(0);
    });

    it("should count named timeouts", () => {
      timerManager.setTimeout("t1", jest.fn(), 100);
      timerManager.setTimeout("t2", jest.fn(), 100);

      expect(timerManager.getActiveTimerCount()).toBe(2);
    });

    it("should count named intervals", () => {
      timerManager.setInterval("i1", jest.fn(), 100);
      timerManager.setInterval("i2", jest.fn(), 100);

      expect(timerManager.getActiveTimerCount()).toBe(2);
    });

    it("should count anonymous timeouts", () => {
      timerManager.setTimeout(null, jest.fn(), 100);
      timerManager.setTimeout(null, jest.fn(), 100);

      expect(timerManager.getActiveTimerCount()).toBe(2);
    });

    it("should count all timer types together", () => {
      timerManager.setTimeout("named", jest.fn(), 100);
      timerManager.setTimeout(null, jest.fn(), 100);
      timerManager.setInterval("interval", jest.fn(), 100);

      expect(timerManager.getActiveTimerCount()).toBe(3);
    });

    it("should decrease after timers complete", () => {
      timerManager.setTimeout("t1", jest.fn(), 50);
      timerManager.setTimeout("t2", jest.fn(), 100);

      expect(timerManager.getActiveTimerCount()).toBe(2);

      jest.advanceTimersByTime(50);
      expect(timerManager.getActiveTimerCount()).toBe(1);

      jest.advanceTimersByTime(50);
      expect(timerManager.getActiveTimerCount()).toBe(0);
    });
  });

  describe("dispose", () => {
    it("should clear all named timeouts", () => {
      const callback = jest.fn();
      timerManager.setTimeout("t1", callback, 100);
      timerManager.setTimeout("t2", callback, 100);

      timerManager.dispose();
      jest.advanceTimersByTime(100);

      expect(callback).not.toHaveBeenCalled();
    });

    it("should clear all named intervals", () => {
      const callback = jest.fn();
      timerManager.setInterval("i1", callback, 100);
      timerManager.setInterval("i2", callback, 100);

      timerManager.dispose();
      jest.advanceTimersByTime(300);

      expect(callback).not.toHaveBeenCalled();
    });

    it("should clear all anonymous timeouts", () => {
      const callback = jest.fn();
      timerManager.setTimeout(null, callback, 100);
      timerManager.setTimeout(null, callback, 100);

      timerManager.dispose();
      jest.advanceTimersByTime(100);

      expect(callback).not.toHaveBeenCalled();
    });

    it("should set disposed flag", () => {
      expect(timerManager.disposed).toBe(false);

      timerManager.dispose();

      expect(timerManager.disposed).toBe(true);
    });

    it("should reset active timer count to 0", () => {
      timerManager.setTimeout("t1", jest.fn(), 100);
      timerManager.setInterval("i1", jest.fn(), 100);

      expect(timerManager.getActiveTimerCount()).toBe(2);

      timerManager.dispose();

      expect(timerManager.getActiveTimerCount()).toBe(0);
    });

    it("should be idempotent (safe to call multiple times)", () => {
      timerManager.setTimeout("test", jest.fn(), 100);

      timerManager.dispose();
      timerManager.dispose();
      timerManager.dispose();

      expect(timerManager.disposed).toBe(true);
      expect(timerManager.getActiveTimerCount()).toBe(0);
    });
  });

  describe("disposed getter", () => {
    it("should return false initially", () => {
      expect(timerManager.disposed).toBe(false);
    });

    it("should return true after dispose()", () => {
      timerManager.dispose();

      expect(timerManager.disposed).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle 0 delay timeout", () => {
      const callback = jest.fn();
      timerManager.setTimeout("zero-delay", callback, 0);

      jest.advanceTimersByTime(0);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple rapid timeouts with same name", () => {
      const callbacks = [jest.fn(), jest.fn(), jest.fn()];

      timerManager.setTimeout("rapid", callbacks[0], 100);
      timerManager.setTimeout("rapid", callbacks[1], 100);
      timerManager.setTimeout("rapid", callbacks[2], 100);

      jest.advanceTimersByTime(100);

      expect(callbacks[0]).not.toHaveBeenCalled();
      expect(callbacks[1]).not.toHaveBeenCalled();
      expect(callbacks[2]).toHaveBeenCalledTimes(1);
    });

    it("should handle very long delays", () => {
      const callback = jest.fn();
      timerManager.setTimeout("long", callback, 1000000);

      jest.advanceTimersByTime(999999);
      expect(callback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(callback).toHaveBeenCalledTimes(1);
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

  it("should create an AbortController", () => {
    const controller = createTimeoutAbortController(100);

    expect(controller).toBeInstanceOf(AbortController);
    expect(controller.signal.aborted).toBe(false);
  });

  it("should abort after specified timeout", () => {
    const controller = createTimeoutAbortController(100);

    expect(controller.signal.aborted).toBe(false);

    jest.advanceTimersByTime(100);

    expect(controller.signal.aborted).toBe(true);
  });

  it("should not abort before timeout", () => {
    const controller = createTimeoutAbortController(100);

    jest.advanceTimersByTime(99);

    expect(controller.signal.aborted).toBe(false);
  });

  it("should trigger abort event listeners", () => {
    const controller = createTimeoutAbortController(100);
    const abortHandler = jest.fn();

    controller.signal.addEventListener("abort", abortHandler);

    jest.advanceTimersByTime(100);

    expect(abortHandler).toHaveBeenCalledTimes(1);
  });

  it("should handle 0 timeout", () => {
    const controller = createTimeoutAbortController(0);

    jest.advanceTimersByTime(0);

    expect(controller.signal.aborted).toBe(true);
  });
});
