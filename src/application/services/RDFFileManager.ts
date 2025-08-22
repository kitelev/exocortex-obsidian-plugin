import { App, TFile, Notice } from "obsidian";
import { Result } from "../../domain/core/Result";
import { RDFFormat } from "./RDFSerializer";

export interface FileOperationResult {
  filePath: string;
  success: boolean;
  message?: string;
}

export class RDFFileManager {
  constructor(private app: App) {}

  async saveToVault(
    content: string,
    filePath: string,
  ): Promise<Result<FileOperationResult>> {
    try {
      const file = this.app.vault.getAbstractFileByPath(filePath);

      if (file instanceof TFile) {
        await this.app.vault.modify(file, content);
      } else {
        const folderPath = filePath.substring(0, filePath.lastIndexOf("/"));
        if (folderPath && !this.app.vault.getAbstractFileByPath(folderPath)) {
          await this.app.vault.createFolder(folderPath);
        }
        await this.app.vault.create(filePath, content);
      }

      return Result.ok({
        filePath,
        success: true,
        message: `File saved successfully to ${filePath}`,
      });
    } catch (error) {
      return Result.fail(`Failed to save file: ${error.message}`);
    }
  }

  async readFromVault(filePath: string): Promise<Result<string>> {
    try {
      const file = this.app.vault.getAbstractFileByPath(filePath);

      if (!(file instanceof TFile)) {
        return Result.fail(`File not found: ${filePath}`);
      }

      const content = await this.app.vault.read(file);
      return Result.ok(content);
    } catch (error) {
      return Result.fail(`Failed to read file: ${error.message}`);
    }
  }

  async deleteFromVault(filePath: string): Promise<Result<void>> {
    try {
      const file = this.app.vault.getAbstractFileByPath(filePath);

      if (!(file instanceof TFile)) {
        return Result.fail(`File not found: ${filePath}`);
      }

      await this.app.vault.delete(file);
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to delete file: ${error.message}`);
    }
  }

  generateFileName(baseName: string | undefined, format: RDFFormat): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const extension = this.getFileExtension(format);

    if (baseName) {
      const nameWithoutExt = baseName.replace(/\.[^/.]+$/, "");
      return `${nameWithoutExt}.${extension}`;
    }

    return `export_${timestamp}.${extension}`;
  }

  getFileExtension(format: RDFFormat): string {
    const extensions: Record<RDFFormat, string> = {
      turtle: "ttl",
      "n-triples": "nt",
      "json-ld": "jsonld",
      "rdf-xml": "rdf",
    };

    return extensions[format] || "rdf";
  }

  detectFormatFromExtension(filePath: string): RDFFormat | undefined {
    const extension = filePath.split(".").pop()?.toLowerCase();

    const formatMap: Record<string, RDFFormat> = {
      ttl: "turtle",
      turtle: "turtle",
      nt: "n-triples",
      ntriples: "n-triples",
      jsonld: "json-ld",
      json: "json-ld",
      rdf: "rdf-xml",
      xml: "rdf-xml",
    };

    return extension ? formatMap[extension] : undefined;
  }

  async listRDFFiles(folder?: string): Promise<Result<TFile[]>> {
    try {
      const files = this.app.vault.getFiles();
      const rdfExtensions = ["ttl", "nt", "jsonld", "rdf", "xml"];

      const rdfFiles = files.filter((file) => {
        const extension = file.extension.toLowerCase();
        const inCorrectFolder = !folder || file.path.startsWith(folder);
        return rdfExtensions.includes(extension) && inCorrectFolder;
      });

      return Result.ok(rdfFiles);
    } catch (error) {
      return Result.fail(`Failed to list RDF files: ${error.message}`);
    }
  }

  async ensureFolderExists(folderPath: string): Promise<Result<void>> {
    try {
      if (!this.app.vault.getAbstractFileByPath(folderPath)) {
        await this.app.vault.createFolder(folderPath);
      }
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to create folder: ${error.message}`);
    }
  }

  getFileInfo(file: TFile): { size: number; modified: Date; created: Date } {
    return {
      size: file.stat.size,
      modified: new Date(file.stat.mtime),
      created: new Date(file.stat.ctime),
    };
  }
}
