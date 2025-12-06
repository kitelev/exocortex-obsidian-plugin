import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { EventEmitter } from "events";

import {
  FileSystemWatcher,
  WatchEvent,
  FileSystemAdapter,
} from "../../../src/watchers/FileSystemWatcher.js";

describe("FileSystemWatcher", () => {
  const testVaultPath = "/test/vault";
  let mockFsWatcher: EventEmitter & { close: jest.Mock };
  let mockFsAdapter: FileSystemAdapter;

  beforeEach(() => {
    jest.useFakeTimers();

    // Create mock FSWatcher
    mockFsWatcher = new EventEmitter() as any;
    mockFsWatcher.close = jest.fn();

    // Create mock fs adapter
    mockFsAdapter = {
      watch: jest.fn(() => mockFsWatcher) as any,
      existsSync: jest.fn(() => true) as any,
      statSync: jest.fn(() => ({ birthtimeMs: Date.now() - 5000 })) as any,
      readFileSync: jest.fn(() => "") as any,
    };
  });

  // Helper to create watcher with pattern that matches all .md files
  const createWatcher = (options: Parameters<typeof FileSystemWatcher.prototype.constructor>[1] = {}) => {
    return new FileSystemWatcher(testVaultPath, {
      pattern: "*.md", // Use simpler pattern for tests
      fsAdapter: mockFsAdapter,
      ...options,
    });
  };

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("constructor", () => {
    it("should create watcher with default options", () => {
      const watcher = new FileSystemWatcher(testVaultPath, {
        fsAdapter: mockFsAdapter,
      });
      expect(watcher).toBeDefined();
      expect(watcher.isWatching()).toBe(false);
    });

    it("should accept custom options", () => {
      const watcher = new FileSystemWatcher(testVaultPath, {
        pattern: "*.md",
        assetType: "ems__Task",
        debounceMs: 200,
        recursive: false,
        fsAdapter: mockFsAdapter,
      });
      expect(watcher).toBeDefined();
    });
  });

  describe("start", () => {
    it("should start watching the vault directory", () => {
      const watcher = new FileSystemWatcher(testVaultPath, {
        fsAdapter: mockFsAdapter,
      });

      const startedSpy = jest.fn();
      watcher.on("started", startedSpy);

      watcher.start();

      expect(mockFsAdapter.watch).toHaveBeenCalledWith(
        expect.stringContaining(testVaultPath),
        { recursive: true },
        expect.any(Function),
      );
      expect(watcher.isWatching()).toBe(true);
      expect(startedSpy).toHaveBeenCalled();
    });

    it("should not start again if already running", () => {
      const watcher = new FileSystemWatcher(testVaultPath, {
        fsAdapter: mockFsAdapter,
      });

      watcher.start();
      watcher.start();

      expect(mockFsAdapter.watch).toHaveBeenCalledTimes(1);
    });

    it("should emit error events from underlying watcher", () => {
      const watcher = new FileSystemWatcher(testVaultPath, {
        fsAdapter: mockFsAdapter,
      });
      const errorSpy = jest.fn();
      watcher.on("error", errorSpy);

      watcher.start();

      const testError = new Error("Test error");
      mockFsWatcher.emit("error", testError);

      expect(errorSpy).toHaveBeenCalledWith(testError);
    });
  });

  describe("stop", () => {
    it("should stop watching and clean up", () => {
      const watcher = new FileSystemWatcher(testVaultPath, {
        fsAdapter: mockFsAdapter,
      });

      const stoppedSpy = jest.fn();
      watcher.on("stopped", stoppedSpy);

      watcher.start();
      expect(watcher.isWatching()).toBe(true);

      watcher.stop();

      expect(watcher.isWatching()).toBe(false);
      expect(mockFsWatcher.close).toHaveBeenCalled();
      expect(stoppedSpy).toHaveBeenCalled();
    });

    it("should not do anything if not running", () => {
      const watcher = new FileSystemWatcher(testVaultPath, {
        fsAdapter: mockFsAdapter,
      });
      const stoppedSpy = jest.fn();
      watcher.on("stopped", stoppedSpy);

      watcher.stop();

      expect(stoppedSpy).not.toHaveBeenCalled();
    });

    it("should clear pending debounce timers", () => {
      const watcher = new FileSystemWatcher(testVaultPath, {
        debounceMs: 500,
        fsAdapter: mockFsAdapter,
      });
      watcher.start();

      // Simulate a file change
      const callback = (mockFsAdapter.watch as jest.Mock).mock.calls[0][2] as Function;
      callback("change", "test.md");

      // Stop before debounce completes
      watcher.stop();

      // Advance timers - the event should NOT fire because we stopped
      const changeSpy = jest.fn();
      watcher.on("change", changeSpy);

      jest.advanceTimersByTime(1000);

      expect(changeSpy).not.toHaveBeenCalled();
    });
  });

  describe("file event handling", () => {
    it("should emit change event for file modification", () => {
      const watcher = createWatcher();
      const changeSpy = jest.fn();
      watcher.on("change", changeSpy);

      watcher.start();

      // Simulate file change
      const callback = (mockFsAdapter.watch as jest.Mock).mock.calls[0][2] as Function;
      callback("change", "test.md");

      // Fast-forward debounce timer
      jest.advanceTimersByTime(150);

      expect(changeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "modify",
          relativePath: "test.md",
          path: expect.stringContaining("test.md"),
          timestamp: expect.any(String),
        }),
      );
    });

    it("should emit delete event when file no longer exists", () => {
      (mockFsAdapter.existsSync as jest.Mock).mockReturnValue(false);

      const watcher = createWatcher();
      const changeSpy = jest.fn();
      watcher.on("change", changeSpy);

      watcher.start();

      const callback = (mockFsAdapter.watch as jest.Mock).mock.calls[0][2] as Function;
      callback("rename", "deleted.md");

      jest.advanceTimersByTime(150);

      expect(changeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "delete",
          relativePath: "deleted.md",
        }),
      );
    });

    it("should emit create event for newly created files", () => {
      // File exists and was just created (< 1 second ago)
      (mockFsAdapter.existsSync as jest.Mock).mockReturnValue(true);
      (mockFsAdapter.statSync as jest.Mock).mockReturnValue({
        birthtimeMs: Date.now() - 500, // Created 500ms ago
      });

      const watcher = createWatcher();
      const changeSpy = jest.fn();
      watcher.on("change", changeSpy);

      watcher.start();

      const callback = (mockFsAdapter.watch as jest.Mock).mock.calls[0][2] as Function;
      callback("rename", "new-file.md");

      jest.advanceTimersByTime(150);

      expect(changeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "create",
          relativePath: "new-file.md",
        }),
      );
    });
  });

  describe("debouncing", () => {
    it("should debounce rapid file changes", () => {
      const watcher = createWatcher({ debounceMs: 200 });
      const changeSpy = jest.fn();
      watcher.on("change", changeSpy);

      watcher.start();

      const callback = (mockFsAdapter.watch as jest.Mock).mock.calls[0][2] as Function;

      // Simulate rapid changes to the same file
      callback("change", "test.md");
      jest.advanceTimersByTime(50);
      callback("change", "test.md");
      jest.advanceTimersByTime(50);
      callback("change", "test.md");

      // Only 100ms passed, no event yet
      expect(changeSpy).not.toHaveBeenCalled();

      // Advance past debounce
      jest.advanceTimersByTime(200);

      // Should have received only one event
      expect(changeSpy).toHaveBeenCalledTimes(1);
    });

    it("should track debounce timers per file", () => {
      const watcher = createWatcher({ debounceMs: 200 });
      const changeSpy = jest.fn();
      watcher.on("change", changeSpy);

      watcher.start();

      const callback = (mockFsAdapter.watch as jest.Mock).mock.calls[0][2] as Function;

      // Change two different files
      callback("change", "file1.md");
      jest.advanceTimersByTime(50);
      callback("change", "file2.md");

      // Advance past first debounce but not second
      jest.advanceTimersByTime(160);

      expect(changeSpy).toHaveBeenCalledTimes(1);
      expect(changeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ relativePath: "file1.md" }),
      );

      // Advance past second debounce
      jest.advanceTimersByTime(100);

      expect(changeSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("asset type filtering", () => {
    it("should filter by asset type when configured", () => {
      // Mock a project file (not a task)
      (mockFsAdapter.readFileSync as jest.Mock).mockReturnValue(`---
exo__Instance_class: "[[ems__Project]]"
---
# Content
`);

      const watcher = createWatcher({ assetType: "ems__Task" });
      const changeSpy = jest.fn();
      watcher.on("change", changeSpy);

      watcher.start();

      const callback = (mockFsAdapter.watch as jest.Mock).mock.calls[0][2] as Function;
      callback("change", "project.md");

      jest.advanceTimersByTime(150);

      // Should NOT emit because asset type doesn't match
      expect(changeSpy).not.toHaveBeenCalled();
    });

    it("should emit event when asset type matches", () => {
      // Mock a task file
      (mockFsAdapter.readFileSync as jest.Mock).mockReturnValue(`---
exo__Instance_class: "[[ems__Task]]"
---
# Task content
`);

      const watcher = createWatcher({ assetType: "ems__Task" });
      const changeSpy = jest.fn();
      watcher.on("change", changeSpy);

      watcher.start();

      const callback = (mockFsAdapter.watch as jest.Mock).mock.calls[0][2] as Function;
      callback("change", "task.md");

      jest.advanceTimersByTime(150);

      expect(changeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          assetType: "ems__Task",
        }),
      );
    });

    it("should handle array format for exo__Instance_class", () => {
      // Mock a meeting file with array format
      (mockFsAdapter.readFileSync as jest.Mock).mockReturnValue(`---
exo__Instance_class: ["[[ems__Meeting]]"]
---
# Meeting notes
`);

      const watcher = createWatcher({ assetType: "ems__Meeting" });
      const changeSpy = jest.fn();
      watcher.on("change", changeSpy);

      watcher.start();

      const callback = (mockFsAdapter.watch as jest.Mock).mock.calls[0][2] as Function;
      callback("change", "meeting.md");

      jest.advanceTimersByTime(150);

      expect(changeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          assetType: "ems__Meeting",
        }),
      );
    });

    it("should handle missing frontmatter gracefully", () => {
      // Mock a file without frontmatter
      (mockFsAdapter.readFileSync as jest.Mock).mockReturnValue("# Just some content");

      const watcher = createWatcher();
      const changeSpy = jest.fn();
      watcher.on("change", changeSpy);

      watcher.start();

      const callback = (mockFsAdapter.watch as jest.Mock).mock.calls[0][2] as Function;
      callback("change", "plain.md");

      jest.advanceTimersByTime(150);

      expect(changeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          assetType: undefined,
        }),
      );
    });

    it("should handle file read errors gracefully", () => {
      // Mock a file that throws when read
      (mockFsAdapter.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error("ENOENT: no such file");
      });

      const watcher = createWatcher();
      const changeSpy = jest.fn();
      watcher.on("change", changeSpy);

      watcher.start();

      const callback = (mockFsAdapter.watch as jest.Mock).mock.calls[0][2] as Function;
      callback("change", "error.md");

      jest.advanceTimersByTime(150);

      // Should still emit event, just without assetType
      expect(changeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          relativePath: "error.md",
          assetType: undefined,
        }),
      );
    });
  });

  describe("WatchEvent structure", () => {
    it("should include all required fields in event", () => {
      const watcher = createWatcher();
      const changeSpy = jest.fn();
      watcher.on("change", changeSpy);

      watcher.start();

      const callback = (mockFsAdapter.watch as jest.Mock).mock.calls[0][2] as Function;
      callback("change", "test.md");

      jest.advanceTimersByTime(150);

      const event: WatchEvent = changeSpy.mock.calls[0][0] as WatchEvent;

      expect(event).toHaveProperty("type");
      expect(event).toHaveProperty("path");
      expect(event).toHaveProperty("relativePath");
      expect(event).toHaveProperty("timestamp");
      expect(["create", "modify", "delete"]).toContain(event.type);
      expect(event.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });
  });
});
