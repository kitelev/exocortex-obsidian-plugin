import {
  TimerManager,
  initTimerManager,
  disposeTimerManager,
  getTimerManager,
} from "../../../../src/infrastructure/lifecycle/TimerManager";

describe("TimerManager", () => {
  let timerManager: TimerManager;

  beforeEach(() => {
    jest.useFakeTimers();
    timerManager = new TimerManager();
  });

  afterEach(() => {
    timerManager.dispose();
    jest.useRealTimers();
  });

  describe("setTimeout", () => {
    it("should execute callback after specified delay", () => {
      const callback = jest.fn();
      timerManager.setTimeout(callback, 1000);

      expect(callback).not.toHaveBeenCalled();
      jest.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should track active timers", () => {
      timerManager.setTimeout(() => {}, 1000);
      timerManager.setTimeout(() => {}, 2000);

      expect(timerManager.activeTimerCount).toBe(2);

      jest.advanceTimersByTime(1000);
      expect(timerManager.activeTimerCount).toBe(1);

      jest.advanceTimersByTime(1000);
      expect(timerManager.activeTimerCount).toBe(0);
    });

    it("should throw if manager is disposed", () => {
      timerManager.dispose();

      expect(() => timerManager.setTimeout(() => {}, 1000)).toThrow(
        "TimerManager has been disposed"
      );
    });
  });

  describe("clearTimeout", () => {
    it("should cancel a specific timeout", () => {
      const callback = jest.fn();
      const id = timerManager.setTimeout(callback, 1000);

      timerManager.clearTimeout(id);
      jest.advanceTimersByTime(1000);

      expect(callback).not.toHaveBeenCalled();
      expect(timerManager.activeTimerCount).toBe(0);
    });
  });

  describe("setInterval", () => {
    it("should execute callback at each interval", () => {
      const callback = jest.fn();
      timerManager.setInterval(callback, 500);

      jest.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it("should track interval as active timer", () => {
      timerManager.setInterval(() => {}, 500);

      expect(timerManager.activeTimerCount).toBe(1);

      // Interval stays active
      jest.advanceTimersByTime(5000);
      expect(timerManager.activeTimerCount).toBe(1);
    });

    it("should throw if manager is disposed", () => {
      timerManager.dispose();

      expect(() => timerManager.setInterval(() => {}, 500)).toThrow(
        "TimerManager has been disposed"
      );
    });
  });

  describe("clearInterval", () => {
    it("should stop interval execution", () => {
      const callback = jest.fn();
      const id = timerManager.setInterval(callback, 500);

      jest.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(1);

      timerManager.clearInterval(id);

      jest.advanceTimersByTime(5000);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(timerManager.activeTimerCount).toBe(0);
    });
  });

  describe("delay", () => {
    beforeEach(() => {
      jest.useRealTimers();
    });

    it("should resolve after specified delay", async () => {
      const start = Date.now();
      await timerManager.delay(50);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(40);
      expect(elapsed).toBeLessThan(200);
    });

    it("should reject when aborted", async () => {
      const controller = new AbortController();

      const delayPromise = timerManager.delay(5000, { signal: controller.signal });

      // Abort immediately
      setTimeout(() => controller.abort(), 10);

      await expect(delayPromise).rejects.toThrow("Aborted");
    });

    it("should reject immediately if signal is already aborted", async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(
        timerManager.delay(1000, { signal: controller.signal })
      ).rejects.toThrow("Aborted");
    });

    it("should throw if manager is disposed", async () => {
      timerManager.dispose();

      await expect(timerManager.delay(100)).rejects.toThrow(
        "TimerManager has been disposed"
      );
    });
  });

  describe("pollUntil", () => {
    beforeEach(() => {
      jest.useRealTimers();
    });

    it("should resolve true when condition is met", async () => {
      let counter = 0;
      const condition = () => {
        counter++;
        return counter >= 3;
      };

      const result = await timerManager.pollUntil(condition, {
        interval: 10,
        maxAttempts: 10,
      });

      expect(result).toBe(true);
      expect(counter).toBe(3);
    });

    it("should resolve false when max attempts reached", async () => {
      const condition = () => false;

      const result = await timerManager.pollUntil(condition, {
        interval: 10,
        maxAttempts: 5,
      });

      expect(result).toBe(false);
    });

    it("should reject when aborted", async () => {
      const controller = new AbortController();
      const condition = () => false;

      const pollPromise = timerManager.pollUntil(condition, {
        signal: controller.signal,
        interval: 50,
        maxAttempts: 100,
      });

      // Abort after a few polls
      setTimeout(() => controller.abort(), 75);

      await expect(pollPromise).rejects.toThrow("Aborted");
    });

    it("should support async condition functions", async () => {
      let counter = 0;
      const condition = async () => {
        counter++;
        await new Promise((r) => setTimeout(r, 5));
        return counter >= 3;
      };

      const result = await timerManager.pollUntil(condition, {
        interval: 10,
        maxAttempts: 10,
      });

      expect(result).toBe(true);
      expect(counter).toBe(3);
    });

    it("should use default options", async () => {
      let callCount = 0;
      const condition = () => {
        callCount++;
        return callCount >= 2;
      };

      const result = await timerManager.pollUntil(condition);

      expect(result).toBe(true);
      expect(callCount).toBe(2);
    });

    it("should throw if manager is disposed", async () => {
      timerManager.dispose();

      await expect(timerManager.pollUntil(() => true)).rejects.toThrow(
        "TimerManager has been disposed"
      );
    });
  });

  describe("dispose", () => {
    it("should clear all active timers", () => {
      const timeoutCb = jest.fn();
      const intervalCb = jest.fn();

      timerManager.setTimeout(timeoutCb, 1000);
      timerManager.setInterval(intervalCb, 500);

      expect(timerManager.activeTimerCount).toBe(2);

      timerManager.dispose();

      expect(timerManager.activeTimerCount).toBe(0);
      expect(timerManager.isDisposed).toBe(true);

      jest.advanceTimersByTime(5000);
      expect(timeoutCb).not.toHaveBeenCalled();
      expect(intervalCb).not.toHaveBeenCalled();
    });

    it("should be idempotent", () => {
      timerManager.setTimeout(() => {}, 1000);
      timerManager.dispose();
      timerManager.dispose();

      expect(timerManager.isDisposed).toBe(true);
      expect(timerManager.activeTimerCount).toBe(0);
    });
  });

  describe("isDisposed", () => {
    it("should return false for new manager", () => {
      expect(timerManager.isDisposed).toBe(false);
    });

    it("should return true after dispose", () => {
      timerManager.dispose();
      expect(timerManager.isDisposed).toBe(true);
    });
  });
});

describe("Global TimerManager functions", () => {
  afterEach(() => {
    disposeTimerManager();
  });

  describe("initTimerManager", () => {
    it("should create and return a TimerManager", () => {
      const manager = initTimerManager();

      expect(manager).toBeInstanceOf(TimerManager);
      expect(manager.isDisposed).toBe(false);
    });

    it("should return same instance if already initialized", () => {
      const first = initTimerManager();
      const second = initTimerManager();

      expect(second).toBe(first);
    });

    it("should create new instance after dispose", () => {
      const first = initTimerManager();
      disposeTimerManager();

      const second = initTimerManager();

      expect(second).not.toBe(first);
      expect(second.isDisposed).toBe(false);
    });
  });

  describe("getTimerManager", () => {
    it("should return initialized manager", () => {
      initTimerManager();
      const manager = getTimerManager();

      expect(manager).toBeInstanceOf(TimerManager);
    });

    it("should throw if not initialized", () => {
      expect(() => getTimerManager()).toThrow(
        "TimerManager not initialized. Call initTimerManager() first."
      );
    });

    it("should throw after dispose", () => {
      initTimerManager();
      disposeTimerManager();

      expect(() => getTimerManager()).toThrow(
        "TimerManager not initialized. Call initTimerManager() first."
      );
    });
  });

  describe("disposeTimerManager", () => {
    it("should dispose the global manager", () => {
      const manager = initTimerManager();
      disposeTimerManager();

      expect(manager.isDisposed).toBe(true);
    });

    it("should be safe to call multiple times", () => {
      initTimerManager();
      disposeTimerManager();
      disposeTimerManager();

      expect(() => getTimerManager()).toThrow();
    });

    it("should be safe to call without initialization", () => {
      disposeTimerManager();

      expect(() => getTimerManager()).toThrow();
    });
  });
});
