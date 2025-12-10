/**
 * UUIDIndex provides O(1) lookups for UUID-to-filepath mappings.
 *
 * Problem:
 * - SPARQL queries need to resolve UUIDs to file paths frequently
 * - Without an index, every UUID lookup requires scanning the filesystem (O(n))
 *
 * Solution:
 * - In-memory Map-based index for O(1) lookups
 * - Reverse index for path-to-UUID lookups (supports file rename/delete)
 * - Incremental updates when files change (no full rebuild)
 *
 * @example
 * ```typescript
 * const index = new UUIDIndex();
 *
 * // Build index from vault
 * index.buildFromVault('/path/to/vault');
 *
 * // O(1) lookups
 * const filepath = index.resolve('550e8400-e29b-41d4-a716-446655440000');
 * // => '/path/to/vault/03 Knowledge/550e8400-e29b-41d4-a716-446655440000.md'
 *
 * // Incremental updates
 * index.add('new-uuid', '/path/to/new-file.md');
 * index.removeByPath('/path/to/deleted-file.md');
 * ```
 */
export class UUIDIndex {
  /** UUID (lowercase) → filepath mapping for O(1) lookups */
  private index: Map<string, string>;

  /** filepath → UUID mapping for efficient deletion by path */
  private reverseIndex: Map<string, string>;

  /** Statistics for performance monitoring */
  private stats: {
    lookupCount: number;
    hitCount: number;
    buildTimeMs: number;
    lastBuildAt: Date | null;
  };

  constructor() {
    this.index = new Map();
    this.reverseIndex = new Map();
    this.stats = {
      lookupCount: 0,
      hitCount: 0,
      buildTimeMs: 0,
      lastBuildAt: null,
    };
  }

  /**
   * Add a UUID-to-filepath mapping to the index.
   *
   * @param uuid - The UUID to index (case-insensitive)
   * @param filepath - The absolute path to the file
   * @returns true if added, false if duplicate with different path (warning logged)
   */
  add(uuid: string, filepath: string): boolean {
    const normalizedUUID = uuid.toLowerCase();

    const existing = this.index.get(normalizedUUID);
    if (existing && existing !== filepath) {
      // Duplicate UUID with different path - this is a data integrity issue
      console.warn(
        `[UUIDIndex] Duplicate UUID ${uuid}: existing "${existing}", new "${filepath}"`,
      );
      // Update to the new path (most recent wins)
    }

    // Update both indexes
    this.index.set(normalizedUUID, filepath);
    this.reverseIndex.set(filepath, normalizedUUID);

    return true;
  }

  /**
   * Resolve a UUID to its filepath.
   * This is the primary O(1) lookup operation.
   *
   * @param uuid - The UUID to resolve (case-insensitive)
   * @returns The filepath if found, null otherwise
   */
  resolve(uuid: string): string | null {
    this.stats.lookupCount++;

    const normalizedUUID = uuid.toLowerCase();
    const filepath = this.index.get(normalizedUUID);

    if (filepath) {
      this.stats.hitCount++;
      return filepath;
    }

    return null;
  }

  /**
   * Resolve a partial UUID to all matching filepaths.
   * Uses O(n) scan - only use for partial matches.
   *
   * @param partialUuid - Partial UUID to match (case-insensitive)
   * @returns Array of matching filepaths
   */
  resolvePartial(partialUuid: string): string[] {
    const normalizedPartial = partialUuid.toLowerCase();
    const matches: string[] = [];

    for (const [uuid, filepath] of this.index) {
      if (uuid.includes(normalizedPartial)) {
        matches.push(filepath);
      }
    }

    return matches;
  }

  /**
   * Get the UUID for a given filepath.
   * Useful for reverse lookups during file operations.
   *
   * @param filepath - The filepath to look up
   * @returns The UUID if found, null otherwise
   */
  getUuidByPath(filepath: string): string | null {
    return this.reverseIndex.get(filepath) ?? null;
  }

  /**
   * Remove a file from the index by its path.
   * Use this when a file is deleted or renamed.
   *
   * @param filepath - The filepath to remove
   * @returns true if removed, false if not found
   */
  removeByPath(filepath: string): boolean {
    const uuid = this.reverseIndex.get(filepath);
    if (!uuid) {
      return false;
    }

    this.index.delete(uuid);
    this.reverseIndex.delete(filepath);
    return true;
  }

  /**
   * Remove a UUID from the index.
   *
   * @param uuid - The UUID to remove (case-insensitive)
   * @returns true if removed, false if not found
   */
  remove(uuid: string): boolean {
    const normalizedUUID = uuid.toLowerCase();
    const filepath = this.index.get(normalizedUUID);

    if (!filepath) {
      return false;
    }

    this.index.delete(normalizedUUID);
    this.reverseIndex.delete(filepath);
    return true;
  }

  /**
   * Check if a UUID exists in the index.
   *
   * @param uuid - The UUID to check (case-insensitive)
   * @returns true if exists, false otherwise
   */
  exists(uuid: string): boolean {
    return this.index.has(uuid.toLowerCase());
  }

  /**
   * Get all indexed UUIDs.
   *
   * @returns Array of all UUIDs in the index
   */
  getAllUUIDs(): string[] {
    return Array.from(this.index.keys());
  }

  /**
   * Get all indexed filepaths.
   *
   * @returns Array of all filepaths in the index
   */
  getAllPaths(): string[] {
    return Array.from(this.reverseIndex.keys());
  }

  /**
   * Get the number of entries in the index.
   *
   * @returns Number of UUID-to-filepath mappings
   */
  size(): number {
    return this.index.size;
  }

  /**
   * Clear all entries from the index.
   */
  clear(): void {
    this.index.clear();
    this.reverseIndex.clear();
    this.resetStats();
  }

  /**
   * Build the index from a vault directory.
   * Recursively scans all markdown files and extracts UUIDs from filenames.
   *
   * @param vaultPath - Path to the Obsidian vault
   * @param options - Optional configuration
   * @returns Number of files indexed
   */
  buildFromVault(
    vaultPath: string,
    options: { excludePatterns?: RegExp[] } = {},
  ): number {
    const startTime = performance.now();
    this.clear();

    const count = this.scanDirectory(vaultPath, vaultPath, options.excludePatterns ?? []);

    this.stats.buildTimeMs = performance.now() - startTime;
    this.stats.lastBuildAt = new Date();

    return count;
  }

  /**
   * Recursively scan a directory for markdown files with UUIDs.
   */
  private scanDirectory(
    dir: string,
    vaultPath: string,
    excludePatterns: RegExp[],
  ): number {
    // Use dynamic import to avoid issues in environments without fs
    const fs = require("fs");
    const path = require("path");

    let count = 0;

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Check if path matches any exclude pattern
        const shouldExclude = excludePatterns.some((pattern) =>
          pattern.test(fullPath),
        );
        if (shouldExclude) {
          continue;
        }

        if (entry.isDirectory()) {
          // Skip hidden directories and node_modules
          if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
            count += this.scanDirectory(fullPath, vaultPath, excludePatterns);
          }
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          // Extract UUID from filename
          const uuid = this.extractUuidFromFilename(entry.name);
          if (uuid) {
            this.add(uuid, fullPath);
            count++;
          }
        }
      }
    } catch (error) {
      // Directory might not exist or be inaccessible
      console.warn(`[UUIDIndex] Error scanning directory ${dir}:`, error);
    }

    return count;
  }

  /**
   * Extract UUID from a filename.
   * Matches standard UUID v4 format at the start of the filename.
   *
   * @param filename - The filename to extract UUID from
   * @returns The UUID if found, null otherwise
   */
  private extractUuidFromFilename(filename: string): string | null {
    // Match UUID v4 pattern at start of filename
    const match = filename.match(
      /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
    );
    return match ? match[1].toLowerCase() : null;
  }

  /**
   * Reset statistics counters.
   */
  private resetStats(): void {
    this.stats.lookupCount = 0;
    this.stats.hitCount = 0;
  }

  /**
   * Get index statistics for monitoring.
   *
   * @returns Statistics object with lookup counts and build info
   */
  getStats(): {
    size: number;
    lookupCount: number;
    hitCount: number;
    hitRate: number;
    buildTimeMs: number;
    lastBuildAt: Date | null;
  } {
    return {
      size: this.index.size,
      lookupCount: this.stats.lookupCount,
      hitCount: this.stats.hitCount,
      hitRate:
        this.stats.lookupCount > 0
          ? this.stats.hitCount / this.stats.lookupCount
          : 0,
      buildTimeMs: this.stats.buildTimeMs,
      lastBuildAt: this.stats.lastBuildAt,
    };
  }

  /**
   * Export the index as a serializable object.
   * Useful for persistence to disk.
   *
   * @returns Object with entries array
   */
  toJSON(): { entries: Array<{ uuid: string; filepath: string }> } {
    const entries = Array.from(this.index.entries()).map(([uuid, filepath]) => ({
      uuid,
      filepath,
    }));
    return { entries };
  }

  /**
   * Import entries from a serialized object.
   * Useful for loading a persisted index.
   *
   * @param data - Object with entries array
   * @returns Number of entries imported
   */
  fromJSON(data: { entries: Array<{ uuid: string; filepath: string }> }): number {
    this.clear();
    let count = 0;
    for (const { uuid, filepath } of data.entries) {
      this.add(uuid, filepath);
      count++;
    }
    return count;
  }
}

/** UUID v4 pattern regex for external use */
export const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Extract all UUIDs from a string.
 *
 * @param text - Text to search for UUIDs
 * @returns Array of UUIDs found (lowercase)
 */
export function extractUuids(text: string): string[] {
  const matches = text.match(UUID_PATTERN);
  return matches ? matches.map((m) => m.toLowerCase()) : [];
}
