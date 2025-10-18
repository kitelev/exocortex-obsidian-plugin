import { TFile, Vault } from "obsidian";
import { v4 as uuidv4 } from "uuid";

export class ProjectCreationService {
  constructor(private vault: Vault) {}

  private formatLocalTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  async createProject(
    sourceFile: TFile,
    sourceMetadata: Record<string, any>,
    label?: string,
  ): Promise<TFile> {
    const uid = uuidv4();
    const fileName = `${uid}.md`;
    const frontmatter = this.generateProjectFrontmatter(
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

  generateProjectFrontmatter(
    sourceMetadata: Record<string, any>,
    sourceName: string,
    label?: string,
    uid?: string,
  ): Record<string, any> {
    const now = new Date();
    const timestamp = this.formatLocalTimestamp(now);

    let isDefinedBy = sourceMetadata.exo__Asset_isDefinedBy || '""';
    if (Array.isArray(isDefinedBy)) {
      isDefinedBy = isDefinedBy[0] || '""';
    }

    const ensureQuoted = (value: string): string => {
      if (!value || value === '""') return '""';
      if (value.startsWith('"') && value.endsWith('"')) return value;
      return `"${value}"`;
    };

    const frontmatter: Record<string, any> = {};
    frontmatter["exo__Asset_isDefinedBy"] = ensureQuoted(isDefinedBy);
    frontmatter["exo__Asset_uid"] = uid || uuidv4();
    frontmatter["exo__Asset_createdAt"] = timestamp;
    frontmatter["exo__Instance_class"] = ['"[[ems__Project]]"'];
    frontmatter["ems__Effort_status"] = '"[[ems__EffortStatusDraft]]"';
    frontmatter["ems__Effort_area"] = `"[[${sourceName}]]"`;

    if (label && label.trim() !== "") {
      frontmatter["exo__Asset_label"] = label.trim();
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
