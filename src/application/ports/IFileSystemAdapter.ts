import { Result } from "../../domain/core/Result";

/**
 * Port interface for file system operations
 * Abstracts file operations from the infrastructure layer
 */
export interface IFileSystemAdapter {
  /**
   * Read file content
   */
  readFile(path: string): Promise<Result<string>>;

  /**
   * Write file content
   */
  writeFile(path: string, content: string): Promise<Result<void>>;

  /**
   * Check if file exists
   */
  fileExists(path: string): Promise<boolean>;

  /**
   * List files in a directory
   */
  listFiles(directory?: string, extension?: string): Promise<Result<any[]>>;

  /**
   * Generate file name with appropriate extension
   */
  generateFileName(baseName?: string, extension?: string): string;

  /**
   * Detect file format from extension
   */
  detectFormatFromExtension(fileName: string): string;

  /**
   * Create directory if it doesn't exist
   */
  ensureDirectory(path: string): Promise<Result<void>>;
}
