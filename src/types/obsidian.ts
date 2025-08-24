/**
 * TypeScript type definitions for Obsidian API objects
 * These provide type safety for commonly used Obsidian interfaces
 */

export interface ObsidianFile {
  path: string;
  name: string;
  basename: string;
  extension: string;
  stat: {
    ctime: number;
    mtime: number;
    size: number;
  };
}

export interface ObsidianMetadata {
  frontmatter?: Record<string, unknown> | null;
  headings?: Array<{
    heading: string;
    level: number;
    position: {
      start: { line: number; col: number; offset: number };
      end: { line: number; col: number; offset: number };
    };
  }>;
  tags?: Array<{
    tag: string;
    position: {
      start: { line: number; col: number; offset: number };
      end: { line: number; col: number; offset: number };
    };
  }>;
  links?: Array<{
    link: string;
    original: string;
    position: {
      start: { line: number; col: number; offset: number };
      end: { line: number; col: number; offset: number };
    };
  }>;
}

export interface ObsidianApp {
  vault: ObsidianVault;
  metadataCache: ObsidianMetadataCache;
  workspace: ObsidianWorkspace;
}

export interface ObsidianVault {
  getFiles(): ObsidianFile[];
  getAbstractFileByPath(path: string): ObsidianFile | null;
  read(file: ObsidianFile): Promise<string>;
  modify(file: ObsidianFile, content: string): Promise<void>;
  create(path: string, content: string): Promise<ObsidianFile>;
  delete(file: ObsidianFile): Promise<void>;
}

export interface ObsidianMetadataCache {
  getFileCache(file: ObsidianFile): ObsidianMetadata | null;
  getFirstLinkpathDest(linkpath: string, sourcePath: string): ObsidianFile | null;
}

export interface ObsidianWorkspace {
  getActiveFile(): ObsidianFile | null;
  openLinkText(linktext: string, sourcePath: string, newLeaf?: boolean): Promise<void>;
}

export interface DataviewApi {
  pages(source?: string): DataviewPage[];
  page(path: string): DataviewPage | undefined;
  query(query: string): DataviewQueryResult;
}

export interface DataviewPage {
  file: {
    path: string;
    name: string;
    folder: string;
    link: DataviewLink;
    tags: string[];
    frontmatter: Record<string, unknown>;
  };
  [key: string]: unknown;
}

export interface DataviewLink {
  path: string;
  type: "file" | "folder";
  display?: string;
}

export interface DataviewQueryResult {
  successful: boolean;
  value?: {
    headers: string[];
    values: unknown[][];
  };
  error?: string;
}