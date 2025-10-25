import { TFile, Vault } from "obsidian";
import { v4 as uuidv4 } from "uuid";
import { DateFormatter } from "../utilities/DateFormatter";
import { WikiLinkHelpers } from "../utilities/WikiLinkHelpers";
import { MetadataExtractor } from "../utilities/MetadataExtractor";
import { MetadataHelpers } from "../utilities/MetadataHelpers";
import { AssetClass } from "../../domain/constants";

/**
 * Mapping of source class to effort property name
 * Implements Strategy pattern for property selection
 */
const EFFORT_PROPERTY_MAP: Record<string, string> = {
  [AssetClass.AREA]: "ems__Effort_area",
  [AssetClass.PROJECT]: "ems__Effort_parent",
  [AssetClass.TASK_PROTOTYPE]: "ems__Effort_prototype",
  [AssetClass.MEETING_PROTOTYPE]: "ems__Effort_prototype",
};

/**
 * Mapping of source class to target instance class
 * Determines what type of instance is created from each source
 */
const INSTANCE_CLASS_MAP: Record<string, string> = {
  [AssetClass.AREA]: AssetClass.TASK,
  [AssetClass.PROJECT]: AssetClass.TASK,
  [AssetClass.TASK_PROTOTYPE]: AssetClass.TASK,
  [AssetClass.MEETING_PROTOTYPE]: AssetClass.MEETING,
};

/**
 * Service for creating Task assets from Area or Project assets
 * Handles frontmatter generation, file creation, and property inheritance
 */
export class TaskCreationService {
  constructor(private vault: Vault) {}

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
    const sectionContent: string[] = [];

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
   * @param taskSize Optional task size (ems__Task_size)
   * @returns The created Task file
   */
  async createTask(
    sourceFile: TFile,
    sourceMetadata: Record<string, any>,
    sourceClass: string,
    label?: string,
    taskSize?: string | null,
  ): Promise<TFile> {
    const uid = uuidv4();
    const fileName = `${uid}.md`;
    const frontmatter = this.generateTaskFrontmatter(
      sourceMetadata,
      sourceFile.basename,
      sourceClass,
      label,
      uid,
      taskSize,
    );

    // For TaskPrototype, extract Algorithm section
    let bodyContent = "";
    const cleanSourceClass = WikiLinkHelpers.normalize(sourceClass);
    if (cleanSourceClass === AssetClass.TASK_PROTOTYPE) {
      const prototypeContent = await this.vault.read(sourceFile);
      const algorithmSection = this.extractH2Section(prototypeContent, "Algorithm");
      if (algorithmSection) {
        bodyContent = `## Algorithm\n\n${algorithmSection}`;
      }
    }

    const fileContent = MetadataHelpers.buildFileContent(frontmatter, bodyContent);

    // Create file in same folder as source
    const folderPath = sourceFile.parent?.path || "";
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    const createdFile = await this.vault.create(filePath, fileContent);

    return createdFile;
  }

  /**
   * Create a new related Task with bidirectional exo__Asset_relates links
   * @param sourceFile The source Task file to create a related task from
   * @param sourceMetadata Frontmatter metadata from the source
   * @param label Optional display label for the new task
   * @param taskSize Optional task size (ems__Task_size)
   * @returns The created related Task file
   */
  async createRelatedTask(
    sourceFile: TFile,
    sourceMetadata: Record<string, any>,
    label?: string,
    taskSize?: string | null,
  ): Promise<TFile> {
    const uid = uuidv4();
    const fileName = `${uid}.md`;

    // Generate frontmatter with exo__Asset_relates pointing to source
    const frontmatter = this.generateRelatedTaskFrontmatter(
      sourceMetadata,
      sourceFile.basename,
      label,
      uid,
      taskSize,
    );

    const fileContent = MetadataHelpers.buildFileContent(frontmatter);

    // Create file in same folder as source
    const folderPath = sourceFile.parent?.path || "";
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    const createdFile = await this.vault.create(filePath, fileContent);

    // Update source file to add bidirectional exo__Asset_relates link
    await this.addRelationToSourceFile(sourceFile, uid);

    return createdFile;
  }

  /**
   * Generate frontmatter for related Task
   * Similar to generateTaskFrontmatter but uses exo__Asset_relates instead of ems__Effort_parent
   * @param sourceMetadata Frontmatter metadata from source task
   * @param sourceName Name of the source task
   * @param label Optional display label for the asset
   * @param uid UUID for the asset
   * @param taskSize Optional task size (ems__Task_size)
   */
  private generateRelatedTaskFrontmatter(
    sourceMetadata: Record<string, any>,
    sourceName: string,
    label?: string,
    uid?: string,
    taskSize?: string | null,
  ): Record<string, any> {
    const now = new Date();
    const timestamp = DateFormatter.toLocalTimestamp(now);

    const isDefinedBy = MetadataExtractor.extractIsDefinedBy(sourceMetadata);

    const frontmatter: Record<string, any> = {};
    frontmatter["exo__Asset_isDefinedBy"] = MetadataHelpers.ensureQuoted(isDefinedBy);
    frontmatter["exo__Asset_uid"] = uid || uuidv4();
    frontmatter["exo__Asset_createdAt"] = timestamp;
    frontmatter["exo__Instance_class"] = [`"[[${AssetClass.TASK}]]"`];
    frontmatter["ems__Effort_status"] = '"[[ems__EffortStatusDraft]]"';
    frontmatter["exo__Asset_relates"] = [`"[[${sourceName}]]"`];

    // Add label if provided
    if (label && label.trim() !== "") {
      const trimmedLabel = label.trim();
      frontmatter["exo__Asset_label"] = trimmedLabel;
      frontmatter["aliases"] = [trimmedLabel];
    }

    if (taskSize) {
      frontmatter["ems__Task_size"] = taskSize;
    }

    return frontmatter;
  }

  /**
   * Add bidirectional exo__Asset_relates link to source file
   * Handles both creating new property and appending to existing array
   * @param sourceFile The source Task file to update
   * @param newTaskUid UID of the newly created related task
   */
  private async addRelationToSourceFile(
    sourceFile: TFile,
    newTaskUid: string,
  ): Promise<void> {
    const content = await this.vault.read(sourceFile);
    const updatedContent = this.addRelationToFrontmatter(content, newTaskUid);
    await this.vault.modify(sourceFile, updatedContent);
  }

  /**
   * Add exo__Asset_relates link to frontmatter
   * Creates property if it doesn't exist, or appends to array if it does
   * @param content Original file content
   * @param relatedTaskUid UID of the related task to link
   * @returns Updated file content
   */
  private addRelationToFrontmatter(
    content: string,
    relatedTaskUid: string,
  ): string {
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = content.match(frontmatterRegex);

    // Detect line ending style from original content
    const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';

    if (!match) {
      // No frontmatter - create it with exo__Asset_relates
      const newFrontmatter = `---${lineEnding}exo__Asset_relates:${lineEnding}  - "[[${relatedTaskUid}]]"${lineEnding}---${lineEnding}${content}`;
      return newFrontmatter;
    }

    const frontmatterContent = match[1];
    let updatedFrontmatter = frontmatterContent;

    // Check if exo__Asset_relates already exists
    if (updatedFrontmatter.includes("exo__Asset_relates:")) {
      // Property exists - add new item to array
      // Find the exo__Asset_relates property and add new item
      const relatesMatch = updatedFrontmatter.match(/exo__Asset_relates:\r?\n((?: {2}- .*\r?\n)*)/);
      if (relatesMatch) {
        const existingItems = relatesMatch[1];
        const newItem = `  - "[[${relatedTaskUid}]]"${lineEnding}`;
        updatedFrontmatter = updatedFrontmatter.replace(
          /exo__Asset_relates:\r?\n((?: {2}- .*\r?\n)*)/,
          `exo__Asset_relates:${lineEnding}${existingItems}${newItem}`,
        );
      }
    } else {
      // Property doesn't exist - add it
      updatedFrontmatter += `${lineEnding}exo__Asset_relates:${lineEnding}  - "[[${relatedTaskUid}]]"`;
    }

    return content.replace(
      frontmatterRegex,
      `---${lineEnding}${updatedFrontmatter}${lineEnding}---`,
    );
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
   * @param taskSize Optional task size (ems__Task_size)
   */
  generateTaskFrontmatter(
    sourceMetadata: Record<string, any>,
    sourceName: string,
    sourceClass: string,
    label?: string,
    uid?: string,
    taskSize?: string | null,
  ): Record<string, any> {
    const now = new Date();
    const timestamp = DateFormatter.toLocalTimestamp(now);

    const isDefinedBy = MetadataExtractor.extractIsDefinedBy(sourceMetadata);

    // Get appropriate effort property name and instance class based on source class
    const cleanSourceClass = WikiLinkHelpers.normalize(sourceClass);
    const effortProperty =
      EFFORT_PROPERTY_MAP[cleanSourceClass] || "ems__Effort_area";
    const instanceClass =
      INSTANCE_CLASS_MAP[cleanSourceClass] || AssetClass.TASK;

    const frontmatter: Record<string, any> = {};
    frontmatter["exo__Asset_isDefinedBy"] = MetadataHelpers.ensureQuoted(isDefinedBy);
    frontmatter["exo__Asset_uid"] = uid || uuidv4();
    frontmatter["exo__Asset_createdAt"] = timestamp;
    frontmatter["exo__Instance_class"] = [`"[[${instanceClass}]]"`];
    frontmatter["ems__Effort_status"] = '"[[ems__EffortStatusDraft]]"';
    frontmatter[effortProperty] = `"[[${sourceName}]]"`;

    // Auto-generate label for ems__Meeting instances if not provided
    let finalLabel = label;
    if (instanceClass === AssetClass.MEETING && (!label || label.trim() === "")) {
      // Use exo__Asset_label from source metadata if available, otherwise use sourceName
      const baseLabel = sourceMetadata.exo__Asset_label || sourceName;
      const dateStr = DateFormatter.toDateString(now);
      finalLabel = `${baseLabel} ${dateStr}`;
    }

    // Add label if provided or auto-generated
    if (finalLabel && finalLabel.trim() !== "") {
      const trimmedLabel = finalLabel.trim();
      frontmatter["exo__Asset_label"] = trimmedLabel;
      frontmatter["aliases"] = [trimmedLabel];
    }

    if (taskSize) {
      frontmatter["ems__Task_size"] = taskSize;
    }

    return frontmatter;
  }
}
