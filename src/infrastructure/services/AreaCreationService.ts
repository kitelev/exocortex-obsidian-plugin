import { TFile, Vault } from "obsidian";
import { v4 as uuidv4 } from "uuid";
import { AssetClass } from "../../domain/constants";
import { DateFormatter } from "../utilities/DateFormatter";
import { MetadataHelpers } from "../utilities/MetadataHelpers";

export class AreaCreationService {
  constructor(private vault: Vault) {}

  async createChildArea(
    sourceFile: TFile,
    sourceMetadata: Record<string, any>,
    label?: string,
  ): Promise<TFile> {
    const uid = uuidv4();
    const fileName = `${uid}.md`;
    const frontmatter = this.generateChildAreaFrontmatter(
      sourceMetadata,
      sourceFile.basename,
      label,
      uid,
    );
    const fileContent = this.buildFileContent(frontmatter);

    const folderPath = sourceFile.parent?.path || "";
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    const createdFile = await this.vault.create(filePath, fileContent);

    return createdFile;
  }

  generateChildAreaFrontmatter(
    sourceMetadata: Record<string, any>,
    sourceName: string,
    label?: string,
    uid?: string,
  ): Record<string, any> {
    const now = new Date();
    const timestamp = DateFormatter.toLocalTimestamp(now);

    let isDefinedBy = sourceMetadata.exo__Asset_isDefinedBy || '""';
    if (Array.isArray(isDefinedBy)) {
      isDefinedBy = isDefinedBy[0] || '""';
    }

    const frontmatter: Record<string, any> = {};
    frontmatter["exo__Asset_isDefinedBy"] = MetadataHelpers.ensureQuoted(isDefinedBy);
    frontmatter["exo__Asset_uid"] = uid || uuidv4();
    frontmatter["exo__Asset_createdAt"] = timestamp;
    frontmatter["exo__Instance_class"] = [`"[[${AssetClass.AREA}]]"`];
    frontmatter["ems__Area_parent"] = `"[[${sourceName}]]"`;

    if (label && label.trim() !== "") {
      const trimmedLabel = label.trim();
      frontmatter["exo__Asset_label"] = trimmedLabel;
      frontmatter["aliases"] = [trimmedLabel];
    }

    return frontmatter;
  }

  private buildFileContent(frontmatter: Record<string, any>): string {
    const frontmatterLines = Object.entries(frontmatter)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          const arrayItems = value.map((item) => `  - ${item}`).join("\n");
          return `${key}:\n${arrayItems}`;
        }
        return `${key}: ${value}`;
      })
      .join("\n");

    return `---\n${frontmatterLines}\n---\n\n`;
  }
}
