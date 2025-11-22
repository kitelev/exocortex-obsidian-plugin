import path from "path";
import fs from "fs-extra";

/**
 * Resolves and validates file paths for CLI commands
 *
 * Handles both relative paths (resolved from vault root) and absolute paths
 * (validated to be within vault boundaries).
 */
export class PathResolver {
  constructor(private vaultRoot: string) {}

  /**
   * Resolves a filepath to an absolute path
   *
   * @param filepath - Relative or absolute file path
   * @returns Absolute path resolved from vault root
   * @throws Error if absolute path is outside vault boundaries
   *
   * @example
   * // Relative path
   * resolver.resolve("03 Knowledge/tasks/task.md")
   * // => "/vault/03 Knowledge/tasks/task.md"
   *
   * // Absolute path within vault
   * resolver.resolve("/vault/03 Knowledge/tasks/task.md")
   * // => "/vault/03 Knowledge/tasks/task.md"
   *
   * // Absolute path outside vault (throws)
   * resolver.resolve("/other/path/task.md")
   * // => Error: File path /other/path/task.md is outside vault root
   */
  resolve(filepath: string): string {
    // Handle relative paths
    if (!path.isAbsolute(filepath)) {
      return path.resolve(this.vaultRoot, filepath);
    }

    // Validate absolute path is within vault
    const resolved = path.resolve(filepath);
    const normalizedVault = path.resolve(this.vaultRoot);

    if (!resolved.startsWith(normalizedVault)) {
      throw new Error(
        `File path ${filepath} is outside vault root ${this.vaultRoot}`,
      );
    }

    return resolved;
  }

  /**
   * Validates that a file exists and is a markdown file
   *
   * @param filepath - Absolute file path to validate
   * @throws Error if file doesn't exist, is not a file, or not markdown
   *
   * @example
   * resolver.validate("/vault/task.md") // OK
   * resolver.validate("/vault/nonexistent.md") // => Error: File not found
   * resolver.validate("/vault/") // => Error: Not a file
   * resolver.validate("/vault/file.txt") // => Error: Not a Markdown file
   */
  validate(filepath: string): void {
    if (!fs.existsSync(filepath)) {
      throw new Error(`File not found: ${filepath}`);
    }

    const stats = fs.statSync(filepath);
    if (!stats.isFile()) {
      throw new Error(`Not a file: ${filepath}`);
    }

    if (!filepath.endsWith(".md")) {
      throw new Error(`Not a Markdown file: ${filepath}`);
    }
  }

  /**
   * Gets the vault root path
   */
  getVaultRoot(): string {
    return this.vaultRoot;
  }
}
