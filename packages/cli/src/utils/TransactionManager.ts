import fs from "fs-extra";
import path from "path";
import crypto from "crypto";

/**
 * Transaction manager for atomic file operations with rollback support
 *
 * Provides backup/restore mechanism to ensure files can be restored
 * to their original state if an error occurs during modification.
 */
export class TransactionManager {
  private backups: Map<string, string> = new Map();
  private fileHashes: Map<string, string> = new Map();

  /**
   * Begins a transaction by creating a backup of the file
   *
   * @param filepath - Absolute path to file to backup
   * @throws Error if backup fails
   */
  async begin(filepath: string): Promise<void> {
    if (!fs.existsSync(filepath)) {
      throw new Error(`Cannot backup non-existent file: ${filepath}`);
    }

    // Read original content
    const content = await fs.readFile(filepath, "utf-8");

    // Calculate hash for concurrent modification detection
    const hash = crypto.createHash("sha256").update(content).digest("hex");
    this.fileHashes.set(filepath, hash);

    // Create backup with timestamp
    const backupPath = `${filepath}.backup.${Date.now()}`;
    await fs.writeFile(backupPath, content, "utf-8");

    this.backups.set(filepath, backupPath);
  }

  /**
   * Verifies file hasn't been modified by another process
   *
   * @param filepath - File to verify
   * @returns true if file unchanged, false if modified
   */
  async verify(filepath: string): Promise<boolean> {
    const originalHash = this.fileHashes.get(filepath);
    if (!originalHash) {
      // No hash stored means no transaction began
      return true;
    }

    if (!fs.existsSync(filepath)) {
      // File deleted - definitely modified
      return false;
    }

    const currentContent = await fs.readFile(filepath, "utf-8");
    const currentHash = crypto
      .createHash("sha256")
      .update(currentContent)
      .digest("hex");

    return currentHash === originalHash;
  }

  /**
   * Commits the transaction by removing backup files
   */
  async commit(): Promise<void> {
    for (const backupPath of this.backups.values()) {
      if (fs.existsSync(backupPath)) {
        await fs.remove(backupPath);
      }
    }

    this.backups.clear();
    this.fileHashes.clear();
  }

  /**
   * Rolls back the transaction by restoring files from backups
   */
  async rollback(): Promise<void> {
    for (const [filepath, backupPath] of this.backups.entries()) {
      if (fs.existsSync(backupPath)) {
        await fs.copy(backupPath, filepath, { overwrite: true });
        await fs.remove(backupPath);
      }
    }

    this.backups.clear();
    this.fileHashes.clear();
  }

  /**
   * Gets list of files in current transaction
   */
  getTrackedFiles(): string[] {
    return Array.from(this.backups.keys());
  }
}
