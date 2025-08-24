import { App, TFile } from "obsidian";

/**
 * Common file operation utilities to eliminate duplication across repositories
 * Implements DRY principle for file handling, YAML processing, and frontmatter operations
 */
export class FileOperationUtils {
  /**
   * Build YAML frontmatter with consistent formatting
   */
  static buildYamlFrontmatter(frontmatter: Record<string, any>): string[] {
    const yamlLines = ["---"];

    for (const [key, value] of Object.entries(frontmatter)) {
      if (value === undefined || value === null) continue;

      if (Array.isArray(value)) {
        yamlLines.push(`${key}:`);
        for (const item of value) {
          const itemStr = String(item);
          if (this.needsQuotes(itemStr)) {
            yamlLines.push(`  - "${this.escapeQuotes(itemStr)}"`);
          } else {
            yamlLines.push(`  - ${itemStr}`);
          }
        }
      } else if (typeof value === "object" && value !== null) {
        yamlLines.push(`${key}: ${JSON.stringify(value)}`);
      } else if (typeof value === "boolean" || typeof value === "number") {
        yamlLines.push(`${key}: ${value}`);
      } else {
        const valueStr = String(value);
        if (this.needsQuotes(valueStr)) {
          yamlLines.push(`${key}: "${this.escapeQuotes(valueStr)}"`);
        } else {
          yamlLines.push(`${key}: ${valueStr}`);
        }
      }
    }

    yamlLines.push("---");
    return yamlLines;
  }

  /**
   * Check if string value needs quotes in YAML
   */
  private static needsQuotes(valueStr: string): boolean {
    return (
      (valueStr.includes("[[") && valueStr.includes("]]")) ||
      valueStr.includes(":") ||
      valueStr.includes("#") ||
      valueStr.includes("[") ||
      valueStr.includes("]") ||
      valueStr.includes("{") ||
      valueStr.includes("}") ||
      valueStr.includes("|") ||
      valueStr.includes(">") ||
      valueStr.includes("@") ||
      valueStr.includes("`") ||
      valueStr.includes('"') ||
      valueStr.includes("'") ||
      valueStr.startsWith(" ") ||
      valueStr.endsWith(" ")
    );
  }

  /**
   * Escape quotes in string values
   */
  private static escapeQuotes(valueStr: string): string {
    return valueStr.replace(/"/g, '\\"');
  }

  /**
   * Extract body content from file, preserving content after frontmatter
   */
  static extractBodyContent(content: string): string {
    if (content.startsWith("---\n")) {
      const endOfFrontmatter = content.indexOf("\n---\n", 4);
      if (endOfFrontmatter !== -1) {
        return content.substring(endOfFrontmatter + 5);
      } else {
        // Malformed frontmatter, preserve original content
        return content;
      }
    } else {
      // No frontmatter, entire content is body
      return content;
    }
  }

  /**
   * Find file by multiple criteria with fallback logic
   */
  static findFileWithFallback(
    app: App,
    criteria: {
      uid?: string;
      storedPath?: string;
      filename?: string;
    },
  ): TFile | null {
    // First check if asset has a stored file path
    if (criteria.storedPath) {
      const file = app.vault.getAbstractFileByPath(criteria.storedPath);
      if (file instanceof TFile) {
        return file;
      }
    }

    // If not found by stored path, try by asset ID
    if (criteria.uid) {
      const files = app.vault.getMarkdownFiles();
      for (const file of files) {
        const cache = app.metadataCache.getFileCache(file);
        if (cache?.frontmatter?.["exo__Asset_uid"] === criteria.uid) {
          return file;
        }
      }
    }

    // If not found by ID, try by filename
    if (criteria.filename) {
      const fileName = criteria.filename.endsWith(".md")
        ? criteria.filename
        : `${criteria.filename}.md`;
      const file = app.vault.getAbstractFileByPath(fileName);
      if (file instanceof TFile) {
        return file;
      }
    }

    return null;
  }

  /**
   * Update file with new frontmatter and preserve body content
   */
  static async updateFileWithFrontmatter(
    app: App,
    file: TFile,
    frontmatter: Record<string, any>,
  ): Promise<void> {
    const existingContent = await app.vault.read(file);
    const bodyContent = this.extractBodyContent(existingContent);
    const yamlLines = this.buildYamlFrontmatter(frontmatter);
    const newContent = yamlLines.join("\n") + "\n" + bodyContent;

    await app.vault.modify(file, newContent);
  }

  /**
   * Create new file with frontmatter
   */
  static async createFileWithFrontmatter(
    app: App,
    filename: string,
    frontmatter: Record<string, any>,
  ): Promise<void> {
    const yamlLines = this.buildYamlFrontmatter(frontmatter);
    const content = yamlLines.join("\n") + "\n";
    await app.vault.create(filename, content);
  }

  /**
   * Get files filtered by frontmatter property
   */
  static getFilesWithProperty(
    app: App,
    propertyKey: string,
    propertyValue?: any,
  ): TFile[] {
    const files = app.vault.getMarkdownFiles();
    return files.filter((file) => {
      const cache = app.metadataCache.getFileCache(file);
      const frontmatter = cache?.frontmatter;

      if (!frontmatter || !frontmatter[propertyKey]) {
        return false;
      }

      if (propertyValue === undefined) {
        return true; // Just check property exists
      }

      return frontmatter[propertyKey] === propertyValue;
    });
  }

  /**
   * Merge frontmatter updates with existing frontmatter
   */
  static mergeFrontmatter(
    existing: Record<string, any>,
    updates: Record<string, any>,
  ): Record<string, any> {
    return { ...existing, ...updates };
  }

  /**
   * Check if reference matches current asset in various formats
   */
  static isReferencingAsset(referenceValue: any, assetName: string): boolean {
    if (!referenceValue) return false;

    // Handle both string and array formats
    const refs = Array.isArray(referenceValue)
      ? referenceValue
      : [referenceValue];

    return refs.some((ref) => {
      if (!ref) return false;
      
      const refStr = String(ref);
      const cleanRef = refStr.replace(/\[\[|\]\]/g, "");

      // Match against various possible reference formats
      return (
        cleanRef === assetName ||
        cleanRef === `${assetName}.md` ||
        refStr.includes(`[[${assetName}]]`) ||
        refStr.includes(assetName)
      );
    });
  }
}
