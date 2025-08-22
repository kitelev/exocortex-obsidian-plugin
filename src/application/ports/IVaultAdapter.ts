/**
 * Port interface for vault operations
 * Abstracts the file system / vault operations
 */
export interface IVaultAdapter {
  /**
   * Create a new file in the vault
   */
  create(path: string, content: string): Promise<void>;

  /**
   * Read a file from the vault
   */
  read(path: string): Promise<string>;

  /**
   * Update an existing file
   */
  update(path: string, content: string): Promise<void>;

  /**
   * Delete a file from the vault
   */
  delete(path: string): Promise<void>;

  /**
   * Check if a file exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * List all files matching a pattern
   */
  list(pattern?: string): Promise<string[]>;

  /**
   * Get file metadata
   */
  getMetadata(path: string): Promise<Record<string, any> | null>;

  /**
   * Get all files in the vault
   */
  getFiles(): Promise<any[]>;

  /**
   * Get metadata for a specific file object
   */
  getFileMetadata(file: any): Promise<any>;
}
