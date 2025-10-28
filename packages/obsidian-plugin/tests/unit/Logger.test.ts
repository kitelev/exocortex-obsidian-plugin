import { Logger } from "../../src/adapters/logging/Logger";
import { LoggerFactory } from "../../src/adapters/logging/LoggerFactory";
import { ILogger } from "../../src/adapters/logging/ILogger";

describe("Logger", () => {
  let logger: Logger;
  let consoleDebugSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on console methods
    consoleDebugSpy = jest.spyOn(console, "debug").mockImplementation();
    consoleInfoSpy = jest.spyOn(console, "info").mockImplementation();
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    logger = new Logger("TestContext");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should create logger with context", () => {
      const contextLogger = new Logger("MyContext");
      contextLogger.info("test");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[MyContext] test");
    });

    it("should handle empty context", () => {
      const emptyLogger = new Logger("");
      emptyLogger.info("test");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[] test");
    });

    it("should handle special characters in context", () => {
      const specialLogger = new Logger("Context-123:Test");
      specialLogger.info("test");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[Context-123:Test] test");
    });
  });

  describe("debug", () => {
    it("should log debug message with context", () => {
      logger.debug("Debug message");
      expect(consoleDebugSpy).toHaveBeenCalledWith("[TestContext] Debug message");
    });

    it("should log debug message with additional arguments", () => {
      const obj = { key: "value" };
      const num = 123;
      logger.debug("Debug with args", obj, num);
      expect(consoleDebugSpy).toHaveBeenCalledWith("[TestContext] Debug with args", obj, num);
    });

    it("should handle multiple arguments", () => {
      logger.debug("Multiple", "arg1", "arg2", "arg3", 4, true, { test: 1 });
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        "[TestContext] Multiple",
        "arg1",
        "arg2",
        "arg3",
        4,
        true,
        { test: 1 }
      );
    });

    it("should handle undefined arguments", () => {
      logger.debug("With undefined", undefined);
      expect(consoleDebugSpy).toHaveBeenCalledWith("[TestContext] With undefined", undefined);
    });

    it("should handle null arguments", () => {
      logger.debug("With null", null);
      expect(consoleDebugSpy).toHaveBeenCalledWith("[TestContext] With null", null);
    });
  });

  describe("info", () => {
    it("should log info message with context", () => {
      logger.info("Info message");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[TestContext] Info message");
    });

    it("should log info message with additional arguments", () => {
      const array = [1, 2, 3];
      logger.info("Info with array", array);
      expect(consoleInfoSpy).toHaveBeenCalledWith("[TestContext] Info with array", array);
    });

    it("should handle empty string message", () => {
      logger.info("");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[TestContext] ");
    });

    it("should handle multiline messages", () => {
      logger.info("Line 1\nLine 2\nLine 3");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[TestContext] Line 1\nLine 2\nLine 3");
    });
  });

  describe("warn", () => {
    it("should log warning message with context", () => {
      logger.warn("Warning message");
      expect(consoleWarnSpy).toHaveBeenCalledWith("[TestContext] Warning message");
    });

    it("should log warning with additional arguments", () => {
      const fn = () => "function";
      logger.warn("Warning with function", fn);
      expect(consoleWarnSpy).toHaveBeenCalledWith("[TestContext] Warning with function", fn);
    });

    it("should handle Symbol arguments", () => {
      const sym = Symbol("test");
      logger.warn("With symbol", sym);
      expect(consoleWarnSpy).toHaveBeenCalledWith("[TestContext] With symbol", sym);
    });
  });

  describe("error", () => {
    it("should log error message with context", () => {
      logger.error("Error message");
      expect(consoleErrorSpy).toHaveBeenCalledWith("[TestContext] Error message", undefined);
    });

    it("should log error with Error object", () => {
      const error = new Error("Test error");
      logger.error("Error occurred", error);
      expect(consoleErrorSpy).toHaveBeenCalledWith("[TestContext] Error occurred", error);
    });

    it("should log error with non-Error object", () => {
      const customError = { code: "ERR_001", message: "Custom error" };
      logger.error("Custom error occurred", customError);
      expect(consoleErrorSpy).toHaveBeenCalledWith("[TestContext] Custom error occurred", customError);
    });

    it("should handle string as error", () => {
      logger.error("Error message", "String error");
      expect(consoleErrorSpy).toHaveBeenCalledWith("[TestContext] Error message", "String error");
    });

    it("should handle number as error", () => {
      logger.error("Error code", 404);
      expect(consoleErrorSpy).toHaveBeenCalledWith("[TestContext] Error code", 404);
    });

    it("should handle Error with stack trace", () => {
      const errorWithStack = new Error("Stack error");
      errorWithStack.stack = "Error: Stack error\n    at test.js:1:1";
      logger.error("Stack trace error", errorWithStack);
      expect(consoleErrorSpy).toHaveBeenCalledWith("[TestContext] Stack trace error", errorWithStack);
    });

    it("should handle custom Error types", () => {
      class CustomError extends Error {
        code: string;
        constructor(message: string, code: string) {
          super(message);
          this.code = code;
        }
      }

      const customError = new CustomError("Custom", "CUSTOM_001");
      logger.error("Custom error type", customError);
      expect(consoleErrorSpy).toHaveBeenCalledWith("[TestContext] Custom error type", customError);
    });

    it("should handle null as error", () => {
      logger.error("Null error", null);
      expect(consoleErrorSpy).toHaveBeenCalledWith("[TestContext] Null error", null);
    });

    it("should handle undefined as error", () => {
      logger.error("Undefined error", undefined);
      expect(consoleErrorSpy).toHaveBeenCalledWith("[TestContext] Undefined error", undefined);
    });

    it("should handle error without second argument", () => {
      logger.error("Just a message");
      expect(consoleErrorSpy).toHaveBeenCalledWith("[TestContext] Just a message", undefined);
    });
  });

  describe("message formatting", () => {
    it("should preserve message formatting characters", () => {
      logger.info("Message with %s and %d", "string", 123);
      expect(consoleInfoSpy).toHaveBeenCalledWith("[TestContext] Message with %s and %d", "string", 123);
    });

    it("should handle messages with special characters", () => {
      logger.info("Special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[TestContext] Special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?");
    });

    it("should handle unicode characters", () => {
      logger.info("Unicode: 😀 🎉 ñ å ß");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[TestContext] Unicode: 😀 🎉 ñ å ß");
    });

    it("should handle very long messages", () => {
      const longMessage = "x".repeat(1000);
      logger.info(longMessage);
      expect(consoleInfoSpy).toHaveBeenCalledWith(`[TestContext] ${longMessage}`);
    });
  });

  describe("context variations", () => {
    it("should handle numeric context", () => {
      const numLogger = new Logger("123");
      numLogger.info("test");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[123] test");
    });

    it("should handle context with spaces", () => {
      const spacedLogger = new Logger("My Context");
      spacedLogger.info("test");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[My Context] test");
    });

    it("should handle very long context", () => {
      const longContext = "VeryLongContextName".repeat(10);
      const longLogger = new Logger(longContext);
      longLogger.info("test");
      expect(consoleInfoSpy).toHaveBeenCalledWith(`[${longContext}] test`);
    });
  });
});

describe("LoggerFactory", () => {
  let consoleInfoSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleInfoSpy = jest.spyOn(console, "info").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("create", () => {
    it("should create a Logger instance", () => {
      const logger = LoggerFactory.create("TestFactory");
      expect(logger).toBeDefined();
      expect(logger).toHaveProperty("debug");
      expect(logger).toHaveProperty("info");
      expect(logger).toHaveProperty("warn");
      expect(logger).toHaveProperty("error");
    });

    it("should create Logger with correct context", () => {
      const logger = LoggerFactory.create("FactoryContext");
      logger.info("Factory test");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[FactoryContext] Factory test");
    });

    it("should implement ILogger interface", () => {
      const logger: ILogger = LoggerFactory.create("Interface");
      expect(typeof logger.debug).toBe("function");
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.error).toBe("function");
    });

    it("should create multiple independent loggers", () => {
      const logger1 = LoggerFactory.create("Context1");
      const logger2 = LoggerFactory.create("Context2");

      logger1.info("Message 1");
      logger2.info("Message 2");

      expect(consoleInfoSpy).toHaveBeenCalledWith("[Context1] Message 1");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[Context2] Message 2");
    });

    it("should handle empty context", () => {
      const logger = LoggerFactory.create("");
      logger.info("Empty context");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[] Empty context");
    });

    it("should create new instance each time", () => {
      const logger1 = LoggerFactory.create("Same");
      const logger2 = LoggerFactory.create("Same");
      expect(logger1).not.toBe(logger2);
    });
  });
});