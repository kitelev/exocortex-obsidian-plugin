/* eslint-disable no-console */
import { Logger } from "../../src/adapters/logging/Logger";
import { ILogger } from "../../src/adapters/logging/ILogger";

describe("Logger", () => {
  let logger: ILogger;
  let originalDebug: typeof console.debug;
  let originalInfo: typeof console.info;
  let originalWarn: typeof console.warn;
  let originalError: typeof console.error;

  beforeEach(() => {
    // Save original console methods
    originalDebug = console.debug;
    originalInfo = console.info;
    originalWarn = console.warn;
    originalError = console.error;

    // Mock console methods
    console.debug = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();

    // Create logger instance
    logger = new Logger("TestContext");
  });

  afterEach(() => {
    // Restore original console methods
    console.debug = originalDebug;
    console.info = originalInfo;
    console.warn = originalWarn;
    console.error = originalError;
  });

  describe("constructor", () => {
    it("should create logger with context", () => {
      const customLogger = new Logger("CustomContext");
      customLogger.debug("test");
      expect(console.debug).toHaveBeenCalledWith("[CustomContext] test");
    });

    it("should handle empty context", () => {
      const emptyLogger = new Logger("");
      emptyLogger.info("message");
      expect(console.info).toHaveBeenCalledWith("[] message");
    });

    it("should handle special characters in context", () => {
      const specialLogger = new Logger("Context:With:Colons[And]Brackets");
      specialLogger.debug("test");
      expect(console.debug).toHaveBeenCalledWith(
        "[Context:With:Colons[And]Brackets] test"
      );
    });
  });

  describe("debug", () => {
    it("should log debug message with context", () => {
      logger.debug("Debug message");
      expect(console.debug).toHaveBeenCalledWith("[TestContext] Debug message");
    });

    it("should pass additional arguments", () => {
      const obj = { key: "value" };
      const arr = [1, 2, 3];
      logger.debug("Debug with args", obj, arr, 123);
      expect(console.debug).toHaveBeenCalledWith(
        "[TestContext] Debug with args",
        obj,
        arr,
        123
      );
    });

    it("should handle empty message", () => {
      logger.debug("");
      expect(console.debug).toHaveBeenCalledWith("[TestContext] ");
    });

    it("should handle null and undefined arguments", () => {
      logger.debug("Message", null, undefined);
      expect(console.debug).toHaveBeenCalledWith(
        "[TestContext] Message",
        null,
        undefined
      );
    });

    it("should handle many arguments", () => {
      const args = Array(100).fill("arg");
      logger.debug("Many args", ...args);
      expect(console.debug).toHaveBeenCalledWith("[TestContext] Many args", ...args);
    });
  });

  describe("info", () => {
    it("should log info message with context", () => {
      logger.info("Info message");
      expect(console.info).toHaveBeenCalledWith("[TestContext] Info message");
    });

    it("should pass additional arguments", () => {
      const date = new Date();
      const func = () => {};
      logger.info("Info with args", date, func, true, false);
      expect(console.info).toHaveBeenCalledWith(
        "[TestContext] Info with args",
        date,
        func,
        true,
        false
      );
    });

    it("should handle template literals", () => {
      const value = 42;
      logger.info(`The value is ${value}`);
      expect(console.info).toHaveBeenCalledWith("[TestContext] The value is 42");
    });

    it("should handle complex objects", () => {
      const complexObj = {
        nested: { deeply: { nested: { value: "test" } } },
        array: [1, [2, [3]]],
        circular: {} as any,
      };
      complexObj.circular.ref = complexObj;

      logger.info("Complex object", complexObj);
      expect(console.info).toHaveBeenCalledWith("[TestContext] Complex object", complexObj);
    });
  });

  describe("warn", () => {
    it("should log warning message with context", () => {
      logger.warn("Warning message");
      expect(console.warn).toHaveBeenCalledWith("[TestContext] Warning message");
    });

    it("should pass additional arguments", () => {
      const warning = { type: "deprecated", code: "W001" };
      logger.warn("Deprecation warning", warning);
      expect(console.warn).toHaveBeenCalledWith(
        "[TestContext] Deprecation warning",
        warning
      );
    });

    it("should handle multiline messages", () => {
      logger.warn("Line 1\nLine 2\nLine 3");
      expect(console.warn).toHaveBeenCalledWith("[TestContext] Line 1\nLine 2\nLine 3");
    });

    it("should handle symbols and bigints", () => {
      const sym = Symbol("test");
      const bigInt = BigInt(9007199254740991);
      logger.warn("Special types", sym, bigInt);
      expect(console.warn).toHaveBeenCalledWith(
        "[TestContext] Special types",
        sym,
        bigInt
      );
    });
  });

  describe("error", () => {
    it("should log error message with context", () => {
      logger.error("Error message");
      expect(console.error).toHaveBeenCalledWith("[TestContext] Error message", undefined);
    });

    it("should log error message with Error object", () => {
      const error = new Error("Test error");
      logger.error("Error occurred", error);
      expect(console.error).toHaveBeenCalledWith("[TestContext] Error occurred", error);
    });

    it("should handle error with stack trace", () => {
      const error = new Error("Stack trace error");
      error.stack = "Error: Stack trace error\n    at test.js:10:15";
      logger.error("Stack error", error);
      expect(console.error).toHaveBeenCalledWith("[TestContext] Stack error", error);
    });

    it("should handle custom error types", () => {
      class CustomError extends Error {
        code: string;
        constructor(message: string, code: string) {
          super(message);
          this.code = code;
        }
      }

      const customError = new CustomError("Custom error", "CUST_001");
      logger.error("Custom error occurred", customError);
      expect(console.error).toHaveBeenCalledWith(
        "[TestContext] Custom error occurred",
        customError
      );
    });

    it("should handle non-Error error parameter", () => {
      logger.error("String error", "This is a string error");
      expect(console.error).toHaveBeenCalledWith(
        "[TestContext] String error",
        "This is a string error"
      );

      logger.error("Number error", 404);
      expect(console.error).toHaveBeenCalledWith("[TestContext] Number error", 404);

      logger.error("Object error", { code: "ERR", message: "Failed" });
      expect(console.error).toHaveBeenCalledWith(
        "[TestContext] Object error",
        { code: "ERR", message: "Failed" }
      );
    });

    it("should handle null error", () => {
      logger.error("Null error", null);
      expect(console.error).toHaveBeenCalledWith("[TestContext] Null error", null);
    });

    it("should handle undefined error explicitly passed", () => {
      logger.error("Undefined error", undefined);
      expect(console.error).toHaveBeenCalledWith("[TestContext] Undefined error", undefined);
    });

    it("should handle error-like objects", () => {
      const errorLike = {
        name: "FakeError",
        message: "This looks like an error",
        toString: () => "FakeError: This looks like an error",
      };
      logger.error("Error-like object", errorLike);
      expect(console.error).toHaveBeenCalledWith(
        "[TestContext] Error-like object",
        errorLike
      );
    });

    it("should handle aggregate errors", () => {
      const errors = [
        new Error("First error"),
        new Error("Second error"),
        new Error("Third error"),
      ];
      const aggregateError = new AggregateError(errors, "Multiple errors occurred");
      logger.error("Aggregate error", aggregateError);
      expect(console.error).toHaveBeenCalledWith(
        "[TestContext] Aggregate error",
        aggregateError
      );
    });
  });

  describe("multiple loggers", () => {
    it("should maintain separate contexts", () => {
      const logger1 = new Logger("Context1");
      const logger2 = new Logger("Context2");
      const logger3 = new Logger("Context3");

      logger1.debug("Message from 1");
      logger2.info("Message from 2");
      logger3.warn("Message from 3");

      expect(console.debug).toHaveBeenCalledWith("[Context1] Message from 1");
      expect(console.info).toHaveBeenCalledWith("[Context2] Message from 2");
      expect(console.warn).toHaveBeenCalledWith("[Context3] Message from 3");
    });

    it("should handle nested contexts", () => {
      const parentLogger = new Logger("Parent");
      const childLogger = new Logger("Parent:Child");
      const grandchildLogger = new Logger("Parent:Child:Grandchild");

      parentLogger.info("Parent log");
      childLogger.info("Child log");
      grandchildLogger.info("Grandchild log");

      expect(console.info).toHaveBeenNthCalledWith(1, "[Parent] Parent log");
      expect(console.info).toHaveBeenNthCalledWith(2, "[Parent:Child] Child log");
      expect(console.info).toHaveBeenNthCalledWith(3, "[Parent:Child:Grandchild] Grandchild log");
    });
  });

  describe("edge cases", () => {
    it("should handle very long messages", () => {
      const longMessage = "a".repeat(10000);
      logger.debug(longMessage);
      expect(console.debug).toHaveBeenCalledWith(`[TestContext] ${longMessage}`);
    });

    it("should handle unicode and emoji in messages", () => {
      logger.info("Unicode: 你好世界 🌍 🚀 ✨");
      expect(console.info).toHaveBeenCalledWith(
        "[TestContext] Unicode: 你好世界 🌍 🚀 ✨"
      );
    });

    it("should handle special console formatting", () => {
      logger.debug("%c Styled text", "color: red; font-weight: bold");
      expect(console.debug).toHaveBeenCalledWith(
        "[TestContext] %c Styled text",
        "color: red; font-weight: bold"
      );
    });

    it("should handle functions in arguments", () => {
      const testFunc = () => "test";
      const asyncFunc = async () => "async";
      const generatorFunc = function* () {
        yield 1;
      };

      logger.info("Functions", testFunc, asyncFunc, generatorFunc);
      expect(console.info).toHaveBeenCalledWith(
        "[TestContext] Functions",
        testFunc,
        asyncFunc,
        generatorFunc
      );
    });

    it("should handle Promises and async values", () => {
      const promise = Promise.resolve("resolved value");
      const rejectedPromise = Promise.reject("rejected value");

      // Prevent unhandled rejection warning
      rejectedPromise.catch(() => {});

      logger.debug("Promises", promise, rejectedPromise);
      expect(console.debug).toHaveBeenCalledWith(
        "[TestContext] Promises",
        promise,
        rejectedPromise
      );
    });

    it("should handle WeakMap and WeakSet", () => {
      const weakMap = new WeakMap();
      const weakSet = new WeakSet();
      const obj = {};

      weakMap.set(obj, "value");
      weakSet.add(obj);

      logger.info("Weak collections", weakMap, weakSet);
      expect(console.info).toHaveBeenCalledWith(
        "[TestContext] Weak collections",
        weakMap,
        weakSet
      );
    });

    it("should handle typed arrays", () => {
      const uint8Array = new Uint8Array([1, 2, 3, 4, 5]);
      const float32Array = new Float32Array([1.1, 2.2, 3.3]);
      const buffer = new ArrayBuffer(16);

      logger.debug("Typed arrays", uint8Array, float32Array, buffer);
      expect(console.debug).toHaveBeenCalledWith(
        "[TestContext] Typed arrays",
        uint8Array,
        float32Array,
        buffer
      );
    });

    it("should handle RegExp and Date objects", () => {
      const regex = /test.*pattern/gi;
      const date = new Date("2024-01-01T00:00:00Z");

      logger.info("Special objects", regex, date);
      expect(console.info).toHaveBeenCalledWith(
        "[TestContext] Special objects",
        regex,
        date
      );
    });

    it("should handle Map and Set collections", () => {
      const map = new Map([
        ["key1", "value1"],
        ["key2", "value2"],
      ]);
      const set = new Set([1, 2, 3, 4, 5]);

      logger.debug("Collections", map, set);
      expect(console.debug).toHaveBeenCalledWith("[TestContext] Collections", map, set);
    });
  });

  describe("performance", () => {
    it("should handle rapid successive calls", () => {
      for (let i = 0; i < 1000; i++) {
        logger.debug(`Message ${i}`);
      }

      expect(console.debug).toHaveBeenCalledTimes(1000);
      expect(console.debug).toHaveBeenNthCalledWith(1, "[TestContext] Message 0");
      expect(console.debug).toHaveBeenNthCalledWith(1000, "[TestContext] Message 999");
    });

    it("should handle mixed log levels", () => {
      logger.debug("Debug");
      logger.info("Info");
      logger.warn("Warn");
      logger.error("Error");
      logger.debug("Debug again");

      expect(console.debug).toHaveBeenCalledTimes(2);
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledTimes(1);
    });
  });
});