import { App, TFile } from "obsidian";
import { Result } from "../../domain/core/Result";
import { IFileSystemAdapter } from "../../application/ports/IFileSystemAdapter";

/**
 * Obsidian implementation of file system adapter
 */
export class ObsidianFileSystemAdapter implements IFileSystemAdapter {
  constructor(private app: App) {}

  async readFile(path: string): Promise<Result<string>> {
    try {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (!file || !(file instanceof TFile)) {
        return Result.fail(`File not found: ${path}`);
      }

      const content = await this.app.vault.read(file);
      return Result.ok(content);
    } catch (error) {
      return Result.fail(`Failed to read file ${path}: ${error.message}`);
    }
  }

  async writeFile(path: string, content: string): Promise<Result<void>> {
    try {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file instanceof TFile) {
        await this.app.vault.modify(file, content);
      } else {
        await this.app.vault.create(path, content);
      }
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(`Failed to write file ${path}: ${error.message}`);
    }
  }

  async fileExists(path: string): Promise<boolean> {
    const file = this.app.vault.getAbstractFileByPath(path);
    return file instanceof TFile;
  }

  async listFiles(
    directory?: string,
    extension?: string,
  ): Promise<Result<TFile[]>> {
    try {
      let files = this.app.vault.getFiles();

      if (directory) {
        files = files.filter((file) => file.path.startsWith(directory));
      }

      if (extension) {
        files = files.filter((file) => file.extension === extension);
      }

      return Result.ok(files);
    } catch (error) {
      return Result.fail(`Failed to list files: ${error.message}`);
    }
  }

  generateFileName(baseName?: string, extension?: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const name = baseName || `export-${timestamp}`;
    return extension ? `${name}.${extension}` : name;
  }

  detectFormatFromExtension(fileName: string): string {
    const extension = fileName.split(".").pop()?.toLowerCase();
    const formatMap: Record<string, string> = {
      ttl: "turtle",
      nt: "n-triples",
      jsonld: "json-ld",
      rdf: "rdf-xml",
      xml: "rdf-xml",
    };
    return formatMap[extension || ""] || "turtle";
  }

  async ensureDirectory(path: string): Promise<Result<void>> {
    try {
      const exists = await this.app.vault.adapter.exists(path);
      if (!exists) {
        await this.app.vault.adapter.mkdir(path);
      }
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(
        `Failed to create directory ${path}: ${error.message}`,
      );
    }
  }
}
