import { TFile, App } from "obsidian";

export class RenameToUidService {
  constructor(private app: App) {}

  async renameToUid(file: TFile, metadata: Record<string, any>): Promise<void> {
    const uid = metadata.exo__Asset_uid;

    if (!uid) {
      throw new Error("Asset has no exo__Asset_uid property");
    }

    const currentBasename = file.basename;
    const targetBasename = uid;

    if (currentBasename === targetBasename) {
      throw new Error("File is already named according to UID");
    }

    const currentLabel = metadata.exo__Asset_label;
    const needsLabelUpdate = !currentLabel || currentLabel.trim() === "";

    if (needsLabelUpdate) {
      await this.updateLabel(file, currentBasename);
    }

    const folderPath = file.parent?.path || "";
    const newPath = folderPath ? `${folderPath}/${targetBasename}.md` : `${targetBasename}.md`;

    await this.app.fileManager.renameFile(file, newPath);
  }

  private async updateLabel(file: TFile, label: string): Promise<void> {
    await this.app.vault.process(file, (content) => {
      const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
      const match = content.match(frontmatterRegex);

      if (!match) {
        return content;
      }

      const frontmatterContent = match[1];
      const newFrontmatter = `${frontmatterContent}\nexo__Asset_label: ${label}`;

      return content.replace(frontmatterRegex, `---\n${newFrontmatter}\n---`);
    });
  }
}
