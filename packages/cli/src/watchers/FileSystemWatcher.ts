import fs from "fs";
import path from "path";
import { EventEmitter } from "events";
import { minimatch } from "minimatch";

/**
 * Event types emitted by the file system watcher
 */
export type WatchEventType = "create" | "modify" | "delete";

/**
 * Structured event emitted when a file changes
 */
export interface WatchEvent {
  /** Event type: create, modify, or delete */
  type: WatchEventType;
  /** Absolute path to the file */
  path: string;
  /** Path relative to vault root */
  relativePath: string;
  /** ISO 8601 timestamp of the event */
  timestamp: string;
  /** Asset type from frontmatter (if available, only for .md files) */
  assetType?: string;
}

/**
 * File system abstraction for dependency injection in tests
 */
export interface FileSystemAdapter {
  watch: typeof fs.watch;
  existsSync: typeof fs.existsSync;
  statSync: typeof fs.statSync;
  readFileSync: typeof fs.readFileSync;
}

/** Default fs adapter using Node.js fs module */
export const defaultFsAdapter: FileSystemAdapter = {
  watch: fs.watch.bind(fs),
  existsSync: fs.existsSync.bind(fs),
  statSync: fs.statSync.bind(fs),
  readFileSync: fs.readFileSync.bind(fs),
};

/**
 * Options for configuring the file system watcher
 */
export interface WatcherOptions {
  /** Glob pattern to filter files (e.g., "*.md", "tasks/**") */
  pattern?: string;
  /** Asset type filter (e.g., "ems__Task", "ems__Project") */
  assetType?: string;
  /** Debounce interval in milliseconds (default: 100ms) */
  debounceMs?: number;
  /** Whether to emit events recursively for subdirectories (default: true) */
  recursive?: boolean;
  /** Custom fs adapter for testing */
  fsAdapter?: FileSystemAdapter;
}

/**
 * File system watcher for MCP resource subscriptions
 *
 * Monitors vault files for changes and emits structured events.
 * Supports filtering by glob pattern and asset type, with debouncing
 * to prevent event storms.
 *
 * @example
 * ```typescript
 * const watcher = new FileSystemWatcher("/path/to/vault", {
 *   pattern: "*.md",
 *   debounceMs: 200,
 * });
 *
 * watcher.on("change", (event: WatchEvent) => {
 *   console.log(JSON.stringify(event));
 * });
 *
 * watcher.start();
 * // ... later
 * watcher.stop();
 * ```
 */
export class FileSystemWatcher extends EventEmitter {
  private vaultPath: string;
  private options: Required<Omit<WatcherOptions, "fsAdapter">>;
  private fsAdapter: FileSystemAdapter;
  private watcher: fs.FSWatcher | null = null;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  constructor(vaultPath: string, options: WatcherOptions = {}) {
    super();
    this.vaultPath = path.resolve(vaultPath);
    this.fsAdapter = options.fsAdapter ?? defaultFsAdapter;
    this.options = {
      pattern: options.pattern ?? "**/*.md",
      assetType: options.assetType ?? "",
      debounceMs: options.debounceMs ?? 100,
      recursive: options.recursive ?? true,
    };
  }

  /**
   * Starts watching the vault for file changes
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.watcher = this.fsAdapter.watch(
      this.vaultPath,
      { recursive: this.options.recursive },
      (eventType, filename) => {
        if (filename) {
          this.handleFileEvent(eventType, filename.toString());
        }
      },
    );

    this.watcher.on("error", (error) => {
      this.emit("error", error);
    });

    this.isRunning = true;
    this.emit("started");
  }

  /**
   * Stops watching and cleans up resources
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    // Clear all pending debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Close the watcher
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    this.isRunning = false;
    this.emit("stopped");
  }

  /**
   * Returns whether the watcher is currently running
   */
  isWatching(): boolean {
    return this.isRunning;
  }

  /**
   * Handles raw file system events with debouncing
   */
  private handleFileEvent(eventType: string, filename: string): void {
    const absolutePath = path.join(this.vaultPath, filename);
    const relativePath = filename;

    // Apply pattern filter
    if (!this.matchesPattern(relativePath)) {
      return;
    }

    // Clear existing debounce timer for this file
    const existingTimer = this.debounceTimers.get(absolutePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounce timer
    const timer = setTimeout(() => {
      this.debounceTimers.delete(absolutePath);
      this.processFileEvent(absolutePath, relativePath);
    }, this.options.debounceMs);

    this.debounceTimers.set(absolutePath, timer);
  }

  /**
   * Processes a file event after debouncing
   */
  private processFileEvent(absolutePath: string, relativePath: string): void {
    const exists = this.fsAdapter.existsSync(absolutePath);
    let watchEventType: WatchEventType;

    if (!exists) {
      watchEventType = "delete";
    } else {
      // Check if file was created or modified
      // We use a simple heuristic: if file is very new (< 1 second), it's a create
      const stats = this.fsAdapter.statSync(absolutePath);
      const ageMs = Date.now() - stats.birthtimeMs;
      watchEventType = ageMs < 1000 ? "create" : "modify";
    }

    // Extract asset type for markdown files (only if filter is applied or for info)
    let assetType: string | undefined;
    if (exists && absolutePath.endsWith(".md")) {
      assetType = this.extractAssetType(absolutePath);
    }

    // Apply asset type filter
    if (this.options.assetType && assetType !== this.options.assetType) {
      return;
    }

    const event: WatchEvent = {
      type: watchEventType,
      path: absolutePath,
      relativePath,
      timestamp: new Date().toISOString(),
      assetType,
    };

    this.emit("change", event);
  }

  /**
   * Checks if a path matches the configured glob pattern
   */
  private matchesPattern(relativePath: string): boolean {
    if (!this.options.pattern) {
      return true;
    }
    return minimatch(relativePath, this.options.pattern);
  }

  /**
   * Extracts asset type from markdown frontmatter
   */
  private extractAssetType(absolutePath: string): string | undefined {
    try {
      const content = this.fsAdapter.readFileSync(absolutePath, "utf-8");
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

      if (!frontmatterMatch) {
        return undefined;
      }

      // Simple YAML parsing for exo__Instance_class
      const frontmatter = frontmatterMatch[1];

      // Match both array and string formats:
      // exo__Instance_class: "[[ems__Task]]"
      // exo__Instance_class: ["[[ems__Task]]"]
      const classMatch = frontmatter.match(
        /exo__Instance_class:\s*(?:\[?"?\[\[([^\]]+)\]\]"?\]?|"?\[\[([^\]]+)\]\]"?)/,
      );

      if (classMatch) {
        return classMatch[1] || classMatch[2];
      }

      return undefined;
    } catch {
      return undefined;
    }
  }
}
