import { Logger } from "../../../../src/infrastructure/logging/Logger";
import { LoggerFactory } from "../../../../src/infrastructure/logging/LoggerFactory";
import {
  LogLevel,
  ILogger,
} from "../../../../src/infrastructure/logging/ILogger";
import { LoggerConfig } from "../../../../src/infrastructure/logging/LoggerConfig";

// Mock console methods
const originalConsole = { ...console };
const consoleMock = {
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

beforeEach(() => {
  Object.assign(console, consoleMock);
  Object.keys(consoleMock).forEach((key) =>
    (consoleMock as any)[key].mockClear(),
  );
});

afterEach(() => {
  Object.assign(console, originalConsole);
});

describe("Logger", () => {
  describe("constructor", () => {
    it("should create logger with default config", () => {
      const logger = new Logger();
      expect(logger).toBeDefined();
      expect(logger.getLevel()).toBeDefined();
    });

    it("should create logger with custom config", () => {
      const config: LoggerConfig = {
        level: LogLevel.ERROR,
        enabledInProduction: true,
        enabledInDevelopment: true,
        formatJson: false,
        includeStackTrace: false,
        maxLogSize: 500,
        performanceThreshold: 50,
        sensitiveKeys: ["secret"],
      };

      const logger = new Logger(config);
      expect(logger.getLevel()).toBe(LogLevel.ERROR);
    });
  });

  describe("logging methods", () => {
    let logger: ILogger;
    const config: LoggerConfig = {
      level: LogLevel.DEBUG,
      enabledInProduction: false,
      enabledInDevelopment: true,
      formatJson: false,
      includeStackTrace: true,
      maxLogSize: 1000,
      performanceThreshold: 100,
      sensitiveKeys: ["password", "secret"],
    };

    beforeEach(() => {
      // Mock NODE_ENV to development
      process.env.NODE_ENV = "development";
      logger = new Logger(config);
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
    });

    it("should log debug messages", () => {
      logger.debug("Test debug message", { key: "value" });
      expect(consoleMock.debug).toHaveBeenCalled();
    });

    it("should log info messages", () => {
      logger.info("Test info message", { operation: "test" });
      expect(consoleMock.info).toHaveBeenCalled();
    });

    it("should log warn messages", () => {
      logger.warn("Test warn message", { warning: "test" });
      expect(consoleMock.warn).toHaveBeenCalled();
    });

    it("should log error messages", () => {
      const error = new Error("Test error");
      logger.error("Test error message", { error: "test" }, error);
      expect(consoleMock.error).toHaveBeenCalled();
    });

    it("should respect log levels", () => {
      logger.setLevel(LogLevel.WARN);

      logger.debug("Should not log");
      logger.info("Should not log");
      logger.warn("Should log");
      logger.error("Should log");

      expect(consoleMock.debug).not.toHaveBeenCalled();
      expect(consoleMock.info).not.toHaveBeenCalled();
      expect(consoleMock.warn).toHaveBeenCalled();
      expect(consoleMock.error).toHaveBeenCalled();
    });
  });

  describe("performance timing", () => {
    let logger: ILogger;
    const config: LoggerConfig = {
      level: LogLevel.DEBUG,
      enabledInProduction: false,
      enabledInDevelopment: true,
      formatJson: false,
      includeStackTrace: false,
      maxLogSize: 1000,
      performanceThreshold: 50, // 50ms threshold
      sensitiveKeys: [],
    };

    beforeEach(() => {
      process.env.NODE_ENV = "development";
      logger = new Logger(config);
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
    });

    it("should track timing operations", () => {
      logger.startTiming("test-operation");
      logger.endTiming("test-operation");

      expect(consoleMock.debug).toHaveBeenCalledWith(
        expect.stringContaining("Timer started: test-operation"),
      );
      expect(consoleMock.debug).toHaveBeenCalledWith(
        expect.stringContaining("Timer ended: test-operation"),
      );
    });

    it("should warn on slow operations", (done) => {
      logger.startTiming("slow-operation");

      // Simulate slow operation
      setTimeout(() => {
        logger.endTiming("slow-operation");

        // Should have called warn due to exceeding threshold
        expect(consoleMock.warn).toHaveBeenCalledWith(
          expect.stringContaining("Slow operation: slow-operation"),
        );
        done();
      }, 60); // 60ms > 50ms threshold
    });

    it("should warn when timer not found", () => {
      logger.endTiming("non-existent-timer");
      expect(consoleMock.warn).toHaveBeenCalledWith(
        expect.stringContaining("Timer not found: non-existent-timer"),
      );
    });
  });

  describe("correlation IDs", () => {
    let logger: ILogger;

    beforeEach(() => {
      process.env.NODE_ENV = "development";
      logger = new Logger();
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
    });

    it("should generate correlation ID if not set", () => {
      const correlationId = logger.getCorrelationId();
      expect(correlationId).toBeDefined();
    });

    it("should use provided correlation ID", () => {
      const testId = "test-correlation-id";
      logger.setCorrelationId(testId);
      expect(logger.getCorrelationId()).toBe(testId);
    });

    it("should include correlation ID in log output", () => {
      const testId = "test-correlation-id";
      logger.setCorrelationId(testId);
      logger.info("Test message");

      // Check that the console output includes the correlation ID
      expect(consoleMock.info).toHaveBeenCalledWith(
        expect.stringContaining("test-cor"), // First 8 chars
      );
    });
  });

  describe("child loggers", () => {
    let parentLogger: ILogger;
    let childLogger: ILogger;

    beforeEach(() => {
      process.env.NODE_ENV = "development";
      parentLogger = new Logger();
      parentLogger.setCorrelationId("parent-id");
      childLogger = parentLogger.createChildLogger({ component: "child" });
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
    });

    it("should inherit correlation ID from parent", () => {
      expect(childLogger.getCorrelationId()).toBe("parent-id");
    });

    it("should include persistent context in child logger", () => {
      childLogger.info("Child message");
      expect(consoleMock.info).toHaveBeenCalled();
    });
  });

  describe("sensitive data sanitization", () => {
    let logger: ILogger;
    const config: LoggerConfig = {
      level: LogLevel.DEBUG,
      enabledInProduction: false,
      enabledInDevelopment: true,
      formatJson: false,
      includeStackTrace: false,
      maxLogSize: 1000,
      performanceThreshold: 100,
      sensitiveKeys: ["password", "secret", "token"],
    };

    beforeEach(() => {
      process.env.NODE_ENV = "development";
      logger = new Logger(config);
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
    });

    it("should redact sensitive keys", () => {
      logger.info("Test message", {
        username: "testuser",
        password: "secret123",
        token: "abc123",
      });

      const logCall = consoleMock.info.mock.calls[0][0];
      expect(logCall).toContain("username");
      expect(logCall).toContain("[REDACTED]");
      expect(logCall).not.toContain("secret123");
      expect(logCall).not.toContain("abc123");
    });

    it("should redact nested sensitive data", () => {
      logger.info("Test message", {
        user: {
          name: "testuser",
          password: "secret123",
        },
      });

      const logCall = consoleMock.info.mock.calls[0][0];
      expect(logCall).toContain("name");
      expect(logCall).toContain("[REDACTED]");
      expect(logCall).not.toContain("secret123");
    });
  });

  describe("JSON formatting", () => {
    let logger: ILogger;
    const config: LoggerConfig = {
      level: LogLevel.DEBUG,
      enabledInProduction: true,
      enabledInDevelopment: true,
      formatJson: true,
      includeStackTrace: false,
      maxLogSize: 1000,
      performanceThreshold: 100,
      sensitiveKeys: [],
    };

    beforeEach(() => {
      process.env.NODE_ENV = "production";
      logger = new Logger(config);
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
    });

    it("should output JSON format in production", () => {
      logger.info("Test message", { key: "value" });

      const logCall = consoleMock.log.mock.calls[0][0];
      expect(() => JSON.parse(logCall)).not.toThrow();

      const parsed = JSON.parse(logCall);
      expect(parsed.message).toBe("Test message");
      expect(parsed.level).toBe(LogLevel.INFO);
      expect(parsed.context.key).toBe("value");
    });
  });

  describe("LoggerFactory", () => {
    beforeEach(() => {
      LoggerFactory.clearAll();
    });

    it("should create logger without name", () => {
      const logger = LoggerFactory.create();
      expect(logger).toBeDefined();
    });

    it("should create named logger", () => {
      const logger = LoggerFactory.create("TestLogger");
      expect(logger).toBeDefined();
    });

    it("should reuse existing named loggers", () => {
      const logger1 = LoggerFactory.create("TestLogger");
      const logger2 = LoggerFactory.create("TestLogger");
      expect(logger1).toBe(logger2);
    });

    it("should create logger for class", () => {
      class TestClass {}
      const logger = LoggerFactory.createForClass(TestClass);
      expect(logger).toBeDefined();
    });

    it("should create logger with context", () => {
      const logger = LoggerFactory.createWithContext("TestLogger", {
        service: "test",
      });
      expect(logger).toBeDefined();
    });

    it("should get existing logger", () => {
      const logger = LoggerFactory.create("TestLogger");
      const retrieved = LoggerFactory.getLogger("TestLogger");
      expect(retrieved).toBe(logger);
    });

    it("should return undefined for non-existent logger", () => {
      const retrieved = LoggerFactory.getLogger("NonExistent");
      expect(retrieved).toBeUndefined();
    });

    it("should clear all loggers", () => {
      LoggerFactory.create("Test1");
      LoggerFactory.create("Test2");

      expect(LoggerFactory.getAllLoggers().size).toBe(2);

      LoggerFactory.clearAll();
      expect(LoggerFactory.getAllLoggers().size).toBe(0);
    });
  });
});
