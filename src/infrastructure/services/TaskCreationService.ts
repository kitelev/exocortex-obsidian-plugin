import { TFile, Vault } from "obsidian";
import { v4 as uuidv4 } from "uuid";

/**
 * Mapping of source class to effort property name
 * Implements Strategy pattern for property selection
 */
const EFFORT_PROPERTY_MAP: Record<string, string> = {
  ems__Area: "ems__Effort_area",
  ems__Project: "ems__Effort_parent",
  ems__TaskPrototype: "ems__Effort_prototype",
  ems__MeetingPrototype: "ems__Effort_prototype",
};

/**
 * Service for creating Task assets from Area or Project assets
 * Handles frontmatter generation, file creation, and property inheritance
 */
export class TaskCreationService {
  constructor(private vault: Vault) {}

  /**
   * Format date as ISO 8601 string in local timezone (not UTC)
   * Format: YYYY-MM-DDTHH:mm:ss
   */
  private formatLocalTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  /**
   * Extract content of H2 section from markdown
   * @param content Full markdown content
   * @param heading H2 heading name (without ##)
   * @returns Section content or null if not found
   */
  private extractH2Section(content: string, heading: string): string | null {
    const lines = content.split("\n");
    const targetHeading = `## ${heading}`;
    let inSection = false;
    let sectionContent: string[] = [];

    for (const line of lines) {
      if (line.trim() === targetHeading) {
        inSection = true;
        continue;
      }

      if (inSection) {
        if (line.startsWith("## ") || line.startsWith("# ")) {
          break;
        }
        sectionContent.push(line);
      }
    }

    if (sectionContent.length === 0) {
      return null;
    }

    const content_text = sectionContent.join("\n").trim();
    return content_text || null;
  }

  /**
   * Create a new Task file from an Area or Project asset
   * @param sourceFile The source file (Area or Project) from which to create the Task
   * @param sourceMetadata Frontmatter metadata from the source
   * @param sourceClass The class of the source asset (ems__Area or ems__Project)
   * @param label Optional display label for the asset (exo__Asset_label)
   * @returns The created Task file
   */
  async createTask(
    sourceFile: TFile,
    sourceMetadata: Record<string, any>,
    sourceClass: string,
    label?: string,
  ): Promise<TFile> {
    const uid = uuidv4();
    const fileName = `${uid}.md`;
    const frontmatter = this.generateTaskFrontmatter(
      sourceMetadata,
      sourceFile.basename,
      sourceClass,
      label,
      uid,
    );

    // For TaskPrototype, extract Algorithm section
    let bodyContent = "";
    const cleanSourceClass = sourceClass.replace(/\[\[|\]\]/g, "").trim();
    if (cleanSourceClass === "ems__TaskPrototype") {
      const prototypeContent = await this.vault.read(sourceFile);
      const algorithmSection = this.extractH2Section(prototypeContent, "Algorithm");
      if (algorithmSection) {
        bodyContent = `## Algorithm\n\n${algorithmSection}`;
      }
    }

    const fileContent = this.buildFileContent(frontmatter, bodyContent);

    // Create file in same folder as source
    const folderPath = sourceFile.parent?.path || "";
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    const createdFile = await this.vault.create(filePath, fileContent);

    return createdFile;
  }

  /**
   * @deprecated Use createTask() instead
   * Backward compatibility wrapper for existing code
   */
  async createTaskFromArea(
    sourceFile: TFile,
    sourceMetadata: Record<string, any>,
  ): Promise<TFile> {
    return this.createTask(sourceFile, sourceMetadata, "ems__Area");
  }

  /**
   * Generate frontmatter for new Task
   * Inherits exo__Asset_isDefinedBy from source
   * Uses provided UUID and generates timestamp
   * Creates link to source via appropriate effort property based on source class
   * @param sourceMetadata Frontmatter metadata from source asset
   * @param sourceName Name of the source asset
   * @param sourceClass Class of source asset (determines effort property)
   * @param label Optional display label for the asset (exo__Asset_label)
   * @param uid UUID for the asset
   */
  generateTaskFrontmatter(
    sourceMetadata: Record<string, any>,
    sourceName: string,
    sourceClass: string,
    label?: string,
    uid?: string,
  ): Record<string, any> {
    const now = new Date();
    const timestamp = this.formatLocalTimestamp(now);

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

    // Get appropriate effort property name based on source class
    const cleanSourceClass = sourceClass.replace(/\[\[|\]\]/g, "").trim();
    const effortProperty =
      EFFORT_PROPERTY_MAP[cleanSourceClass] || "ems__Effort_area";

    const frontmatter: Record<string, any> = {};
    frontmatter["exo__Asset_isDefinedBy"] = ensureQuoted(isDefinedBy);
    frontmatter["exo__Asset_uid"] = uid || uuidv4();
    frontmatter["exo__Asset_createdAt"] = timestamp;
    frontmatter["exo__Instance_class"] = ['"[[ems__Task]]"'];
    frontmatter["ems__Effort_status"] = '"[[ems__EffortStatusDraft]]"';
    frontmatter[effortProperty] = `"[[${sourceName}]]"`;

    // Add label if provided and non-empty
    if (label && label.trim() !== "") {
      frontmatter["exo__Asset_label"] = label.trim();
    }

    return frontmatter;
  }

  /**
   * @deprecated No longer used - filename is now based on UUID
   * Generate filename for new Task using timestamp
   * Format: Task-2025-10-04T16-23-50.md
   */
  generateTaskFileName(): string {
    const now = new Date();
    const timestamp = this.formatLocalTimestamp(now).replace(/:/g, "-"); // Replace colons for filesystem compatibility

    return `Task-${timestamp}.md`;
  }

  /**
   * Build complete file content with frontmatter
   * Handles arrays in YAML format with proper indentation
   * @param frontmatter Frontmatter properties
   * @param bodyContent Optional body content to append after frontmatter
   */
  private buildFileContent(frontmatter: Record<string, any>, bodyContent?: string): string {
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

    const body = bodyContent ? `\n${bodyContent}\n` : "\n";
    return `---\n${frontmatterLines}\n---\n${body}`;
  }
}
