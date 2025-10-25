import { v4 as uuidv4 } from "uuid";
import { DateFormatter } from "../../infrastructure/utilities/DateFormatter";
import { WikiLinkHelpers } from "../../infrastructure/utilities/WikiLinkHelpers";
import { MetadataHelpers } from "../../infrastructure/utilities/MetadataHelpers";
import { AssetClass } from "../../domain/constants";
import { IFileSystemAdapter } from "../../infrastructure/interfaces/IFileSystemAdapter";

const EFFORT_PROPERTY_MAP: Record<string, string> = {
  [AssetClass.AREA]: "ems__Effort_area",
  [AssetClass.PROJECT]: "ems__Effort_parent",
  [AssetClass.TASK_PROTOTYPE]: "ems__Effort_prototype",
  [AssetClass.MEETING_PROTOTYPE]: "ems__Effort_prototype",
};

const INSTANCE_CLASS_MAP: Record<string, string> = {
  [AssetClass.AREA]: AssetClass.TASK,
  [AssetClass.PROJECT]: AssetClass.TASK,
  [AssetClass.TASK_PROTOTYPE]: AssetClass.TASK,
  [AssetClass.MEETING_PROTOTYPE]: AssetClass.MEETING,
};

export class TaskCreationService {
  constructor(private fs: IFileSystemAdapter) {}

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

  async createTask(
    sourceFilePath: string,
    sourceMetadata: Record<string, any>,
    sourceClass: string,
    label?: string,
    taskSize?: string | null,
  ): Promise<string> {
    const uid = uuidv4();
    const fileName = `${uid}.md`;

    const sourceFileBasename = sourceFilePath.split('/').pop()?.replace('.md', '') || '';

    const frontmatter = this.generateTaskFrontmatter(
      sourceMetadata,
      sourceFileBasename,
      sourceClass,
      label,
      uid,
      taskSize,
    );

    let bodyContent = "";
    const cleanSourceClass = WikiLinkHelpers.normalize(sourceClass);
    if (cleanSourceClass === AssetClass.TASK_PROTOTYPE) {
      const prototypeContent = await this.fs.readFile(sourceFilePath);
      const algorithmSection = this.extractH2Section(prototypeContent, "Algorithm");
      if (algorithmSection) {
        bodyContent = `## Algorithm\n\n${algorithmSection}`;
      }
    }

    const fileContent = MetadataHelpers.buildFileContent(frontmatter, bodyContent);

    const folderPath = sourceFilePath.substring(0, sourceFilePath.lastIndexOf('/'));
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    const createdPath = await this.fs.createFile(filePath, fileContent);

    return createdPath;
  }

  async createTaskFromArea(
    sourceFilePath: string,
    sourceMetadata: Record<string, any>,
  ): Promise<string> {
    return this.createTask(sourceFilePath, sourceMetadata, AssetClass.AREA);
  }

  async createRelatedTask(
    sourceFilePath: string,
    sourceMetadata: Record<string, any>,
    label?: string,
    taskSize?: string | null,
  ): Promise<string> {
    const uid = uuidv4();
    const fileName = `${uid}.md`;

    const sourceFileBasename = sourceFilePath.split('/').pop()?.replace('.md', '') || '';

    const frontmatter = this.generateRelatedTaskFrontmatter(
      sourceMetadata,
      sourceFileBasename,
      label,
      uid,
      taskSize,
    );

    const fileContent = MetadataHelpers.buildFileContent(frontmatter);

    const folderPath = sourceFilePath.substring(0, sourceFilePath.lastIndexOf('/'));
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    const createdPath = await this.fs.createFile(filePath, fileContent);

    await this.addRelationToSourceFile(sourceFilePath, uid);

    return createdPath;
  }

  private generateRelatedTaskFrontmatter(
    sourceMetadata: Record<string, any>,
    sourceName: string,
    label?: string,
    uid?: string,
    taskSize?: string | null,
  ): Record<string, any> {
    const now = new Date();
    const timestamp = DateFormatter.toLocalTimestamp(now);

    const isDefinedBy = this.extractIsDefinedBy(sourceMetadata);

    const frontmatter: Record<string, any> = {};
    frontmatter["exo__Asset_isDefinedBy"] = MetadataHelpers.ensureQuoted(isDefinedBy);
    frontmatter["exo__Asset_uid"] = uid || uuidv4();
    frontmatter["exo__Asset_createdAt"] = timestamp;
    frontmatter["exo__Instance_class"] = [`"[[${AssetClass.TASK}]]"`];
    frontmatter["ems__Effort_status"] = '"[[ems__EffortStatusDraft]]"';
    frontmatter["exo__Asset_relates"] = [`"[[${sourceName}]]"`];

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

  private async addRelationToSourceFile(
    sourceFilePath: string,
    newTaskUid: string,
  ): Promise<void> {
    const content = await this.fs.readFile(sourceFilePath);
    const updatedContent = this.addRelationToFrontmatter(content, newTaskUid);
    await this.fs.updateFile(sourceFilePath, updatedContent);
  }

  private addRelationToFrontmatter(
    content: string,
    relatedTaskUid: string,
  ): string {
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = content.match(frontmatterRegex);

    const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';

    if (!match) {
      const newFrontmatter = `---${lineEnding}exo__Asset_relates:${lineEnding}  - "[[${relatedTaskUid}]]"${lineEnding}---${lineEnding}${content}`;
      return newFrontmatter;
    }

    const frontmatterContent = match[1];
    let updatedFrontmatter = frontmatterContent;

    if (updatedFrontmatter.includes("exo__Asset_relates:")) {
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
      updatedFrontmatter += `${lineEnding}exo__Asset_relates:${lineEnding}  - "[[${relatedTaskUid}]]"`;
    }

    return content.replace(
      frontmatterRegex,
      `---${lineEnding}${updatedFrontmatter}${lineEnding}---`,
    );
  }

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

    const isDefinedBy = this.extractIsDefinedBy(sourceMetadata);

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

    let finalLabel = label;
    if (instanceClass === AssetClass.MEETING && (!label || label.trim() === "")) {
      const baseLabel = sourceMetadata.exo__Asset_label || sourceName;
      const dateStr = DateFormatter.toDateString(now);
      finalLabel = `${baseLabel} ${dateStr}`;
    }

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

  generateTaskFileName(): string {
    const now = new Date();
    const timestamp = DateFormatter.toLocalTimestamp(now).replace(/:/g, "-");
    return `Task-${timestamp}.md`;
  }

  private extractIsDefinedBy(metadata: Record<string, any>): string {
    const value = metadata.exo__Asset_isDefinedBy;
    if (!value) return "";

    if (Array.isArray(value)) {
      return value[0] || "";
    }

    return String(value);
  }
}
