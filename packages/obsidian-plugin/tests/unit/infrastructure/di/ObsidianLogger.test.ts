import { ObsidianLogger } from "../../../../src/infrastructure/di/ObsidianLogger";
import { Plugin } from "obsidian";

describe("ObsidianLogger", () => {
  let mockPlugin: Plugin;
  let logger: ObsidianLogger;
  let consoleSpy: {
    debug: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  beforeEach(() => {
    mockPlugin = {
      manifest: { id: "exocortex" },
    } as Plugin;

    logger = new ObsidianLogger(mockPlugin);

    consoleSpy = {
      debug: jest.spyOn(console, "debug").mockImplementation(),
      warn: jest.spyOn(console, "warn").mockImplementation(),
      error: jest.spyOn(console, "error").mockImplementation(),
    };
  });

  afterEach(() => {
    consoleSpy.debug.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe("debug", () => {
    it("should log debug message with plugin id prefix", () => {
      logger.debug("test message");

      expect(consoleSpy.debug).toHaveBeenCalledWith(
        "[exocortex]",
        "test message",
        ""
      );
    });

    it("should log debug message with context", () => {
      const context = { key: "value", count: 42 };
      logger.debug("test message", context);

      expect(consoleSpy.debug).toHaveBeenCalledWith(
        "[exocortex]",
        "test message",
        context
      );
    });

    it("should handle undefined context gracefully", () => {
      logger.debug("test message", undefined);

      expect(consoleSpy.debug).toHaveBeenCalledWith(
        "[exocortex]",
        "test message",
        ""
      );
    });
  });

  describe("info", () => {
    it("should log info message with plugin id and INFO tag", () => {
      logger.info("info message");

      expect(consoleSpy.debug).toHaveBeenCalledWith(
        "[exocortex] [INFO]",
        "info message",
        ""
      );
    });

    it("should log info message with context", () => {
      const context = { operation: "create" };
      logger.info("info message", context);

      expect(consoleSpy.debug).toHaveBeenCalledWith(
        "[exocortex] [INFO]",
        "info message",
        context
      );
    });
  });

  describe("warn", () => {
    it("should log warning message with plugin id prefix", () => {
      logger.warn("warning message");

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        "[exocortex]",
        "warning message",
        ""
      );
    });

    it("should log warning message with context", () => {
      const context = { deprecated: true };
      logger.warn("warning message", context);

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        "[exocortex]",
        "warning message",
        context
      );
    });
  });

  describe("error", () => {
    it("should log error message with plugin id prefix", () => {
      logger.error("error message");

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "[exocortex]",
        "error message",
        "",
        ""
      );
    });

    it("should log error message with Error object", () => {
      const error = new Error("test error");
      logger.error("error message", error);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "[exocortex]",
        "error message",
        error,
        ""
      );
    });

    it("should log error message with context", () => {
      const context = { filePath: "/test/file.md" };
      logger.error("error message", undefined, context);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "[exocortex]",
        "error message",
        "",
        context
      );
    });

    it("should log error message with both error and context", () => {
      const error = new Error("test error");
      const context = { filePath: "/test/file.md" };
      logger.error("error message", error, context);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "[exocortex]",
        "error message",
        error,
        context
      );
    });
  });

  describe("with different plugin ids", () => {
    it("should use the actual plugin manifest id", () => {
      const customPlugin = {
        manifest: { id: "custom-plugin-id" },
      } as Plugin;
      const customLogger = new ObsidianLogger(customPlugin);

      customLogger.debug("test");

      expect(consoleSpy.debug).toHaveBeenCalledWith(
        "[custom-plugin-id]",
        "test",
        ""
      );
    });
  });
});
