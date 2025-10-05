import { TFile, Vault } from "obsidian";
import { v4 as uuidv4 } from "uuid";

/**
 * Service for creating Task assets from Area assets
 * Handles frontmatter generation, file creation, and property inheritance
 */
export class TaskCreationService {
  constructor(private vault: Vault) {}

  /**
   * Create a new Task file from an Area asset
   * @param sourceFile The Area file from which to create the Task
   * @param sourceMetadata Frontmatter metadata from the Area
   * @returns The created Task file
   */
  async createTaskFromArea(
    sourceFile: TFile,
    sourceMetadata: Record<string, any>,
  ): Promise<TFile> {
    const fileName = this.generateTaskFileName();
    const frontmatter = this.generateTaskFrontmatter(
      sourceMetadata,
      sourceFile.basename,
    );
    const fileContent = this.buildFileContent(frontmatter);

    // Create file in same folder as source Area
    const folderPath = sourceFile.parent?.path || "";
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    const createdFile = await this.vault.create(filePath, fileContent);

    return createdFile;
  }

  /**
   * Generate frontmatter for new Task
   * Inherits exo__Asset_isDefinedBy from source Area
   * Generates new UUID and timestamp
   * Creates link to source Area via ems__Effort_area
   */
  generateTaskFrontmatter(
    sourceMetadata: Record<string, any>,
    areaName: string,
  ): Record<string, any> {
    const now = new Date();
    const timestamp = now.toISOString().split(".")[0]; // Remove milliseconds

    // Extract isDefinedBy - handle both string and array formats
    let isDefinedBy = sourceMetadata.exo__Asset_isDefinedBy || '""';
    if (Array.isArray(isDefinedBy)) {
      isDefinedBy = isDefinedBy[0] || '""';
    }

    // Ensure wiki-links are quoted
    const ensureQuoted = (value: string): string => {
      if (!value || value === '""') return '""';
      // If already quoted, return as is
      if (value.startsWith('"') && value.endsWith('"')) return value;
      // Add quotes around wiki-link
      return `"${value}"`;
    };

    return {
      exo__Instance_class: ['"[[ems__Task]]"'],
      exo__Asset_isDefinedBy: ensureQuoted(isDefinedBy),
      exo__Asset_uid: uuidv4(),
      exo__Asset_createdAt: timestamp,
      ems__Effort_area: `"[[${areaName}]]"`,
    };
  }

  /**
   * Generate filename for new Task using timestamp
   * Format: Task-2025-10-04T16-23-50.md
   */
  generateTaskFileName(): string {
    const now = new Date();
    const timestamp = now
      .toISOString()
      .split(".")[0] // Remove milliseconds
      .replace(/:/g, "-"); // Replace colons for filesystem compatibility

    return `Task-${timestamp}.md`;
  }

  /**
   * Build complete file content with frontmatter
   * Handles arrays in YAML format with proper indentation
   */
  private buildFileContent(frontmatter: Record<string, any>): string {
    const frontmatterLines = Object.entries(frontmatter)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          // YAML array format with indentation
          const arrayItems = value.map((item) => `  - ${item}`).join("\n");
          return `${key}:\n${arrayItems}`;
        }
        return `${key}: ${value}`;
      })
      .join("\n");

    return `---\n${frontmatterLines}\n---\n\n`;
  }
}
