import { v4 as uuidv4 } from "uuid";
import { WikiLinkHelpers } from "../../infrastructure/utilities/WikiLinkHelpers";
import { AssetClass } from "../../domain/constants";
import { DateFormatter } from "../../infrastructure/utilities/DateFormatter";
import { MetadataHelpers } from "../../infrastructure/utilities/MetadataHelpers";
import { IFileSystemAdapter } from "../../infrastructure/interfaces/IFileSystemAdapter";

const EFFORT_PROPERTY_MAP: Record<string, string> = {
  [AssetClass.AREA]: "ems__Effort_area",
  [AssetClass.INITIATIVE]: "ems__Effort_parent",
  [AssetClass.PROJECT]: "ems__Effort_parent",
};

export class ProjectCreationService {
  constructor(private fs: IFileSystemAdapter) {}

  async createProject(
    sourceFilePath: string,
    sourceMetadata: Record<string, any>,
    sourceClass: string,
    label?: string,
  ): Promise<string> {
    const uid = uuidv4();
    const fileName = `${uid}.md`;

    const sourceFileBasename = sourceFilePath.split('/').pop()?.replace('.md', '') || '';

    const frontmatter = this.generateProjectFrontmatter(
      sourceMetadata,
      sourceFileBasename,
      sourceClass,
      label,
      uid,
    );
    const fileContent = MetadataHelpers.buildFileContent(frontmatter);

    const folderPath = sourceFilePath.substring(0, sourceFilePath.lastIndexOf('/'));
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    const createdPath = await this.fs.createFile(filePath, fileContent);

    return createdPath;
  }

  generateProjectFrontmatter(
    sourceMetadata: Record<string, any>,
    sourceName: string,
    sourceClass: string,
    label?: string,
    uid?: string,
  ): Record<string, any> {
    const now = new Date();
    const timestamp = DateFormatter.toLocalTimestamp(now);

    const isDefinedBy = this.extractIsDefinedBy(sourceMetadata);

    const cleanSourceClass = WikiLinkHelpers.normalize(sourceClass);
    const effortProperty =
      EFFORT_PROPERTY_MAP[cleanSourceClass] || "ems__Effort_area";

    const frontmatter: Record<string, any> = {};
    frontmatter["exo__Asset_isDefinedBy"] = MetadataHelpers.ensureQuoted(isDefinedBy);
    frontmatter["exo__Asset_uid"] = uid || uuidv4();
    frontmatter["exo__Asset_createdAt"] = timestamp;
    frontmatter["exo__Instance_class"] = [`"[[${AssetClass.PROJECT}]]"`];
    frontmatter["ems__Effort_status"] = '"[[ems__EffortStatusDraft]]"';
    frontmatter[effortProperty] = `"[[${sourceName}]]"`;

    if (label && label.trim() !== "") {
      const trimmedLabel = label.trim();
      frontmatter["exo__Asset_label"] = trimmedLabel;
      frontmatter["aliases"] = [trimmedLabel];
    }

    return frontmatter;
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
