import { Result } from "../core/Result";

// Domain port for file system operations - framework agnostic
export interface IFileSystemPort {
  readFile(path: string): Promise<Result<string>>;
  writeFile(path: string, content: string): Promise<Result<void>>;
  fileExists(path: string): Promise<boolean>;
  listFiles(path: string, filter?: FileFilter): Promise<Result<FileInfo[]>>;
  getFileMetadata(path: string): Promise<Result<FileMetadata>>;
}

export interface FileInfo {
  readonly path: string;
  readonly name: string;
  readonly extension: string;
  readonly size: number;
  readonly lastModified: Date;
}

export interface FileMetadata {
  readonly frontmatter: Record<string, any>;
  readonly content: string;
  readonly tags: string[];
  readonly links: string[];
}

export interface FileFilter {
  extensions?: string[];
  pathPattern?: string;
  hasMetadata?: string[];
}
