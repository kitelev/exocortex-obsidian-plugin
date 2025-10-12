import { TFile, Vault } from "obsidian";

export class TaskStatusService {
  constructor(private vault: Vault) {}

  async startEffort(taskFile: TFile): Promise<void> {
    const fileContent = await this.vault.read(taskFile);
    const updatedContent = this.updateFrontmatterWithDoingStatus(fileContent);
    await this.vault.modify(taskFile, updatedContent);
  }

  private updateFrontmatterWithDoingStatus(content: string): string {
    const now = new Date();
    const timestamp = now.toISOString().split(".")[0];

    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      const newFrontmatter = `---
ems__Effort_status: "[[ems__EffortStatusDoing]]"
ems__Effort_startTimestamp: ${timestamp}
---
${content}`;
      return newFrontmatter;
    }

    const frontmatterContent = match[1];
    let updatedFrontmatter = frontmatterContent;

    if (updatedFrontmatter.includes("ems__Effort_status:")) {
      updatedFrontmatter = updatedFrontmatter.replace(
        /ems__Effort_status:.*$/m,
        'ems__Effort_status: "[[ems__EffortStatusDoing]]"',
      );
    } else {
      updatedFrontmatter += '\nems__Effort_status: "[[ems__EffortStatusDoing]]"';
    }

    if (updatedFrontmatter.includes("ems__Effort_startTimestamp:")) {
      updatedFrontmatter = updatedFrontmatter.replace(
        /ems__Effort_startTimestamp:.*$/m,
        `ems__Effort_startTimestamp: ${timestamp}`,
      );
    } else {
      updatedFrontmatter += `\nems__Effort_startTimestamp: ${timestamp}`;
    }

    return content.replace(
      frontmatterRegex,
      `---\n${updatedFrontmatter}\n---`,
    );
  }

  async markTaskAsDone(taskFile: TFile): Promise<void> {
    const fileContent = await this.vault.read(taskFile);
    const updatedContent = this.updateFrontmatterWithDoneStatus(fileContent);
    await this.vault.modify(taskFile, updatedContent);
  }

  private updateFrontmatterWithDoneStatus(content: string): string {
    const now = new Date();
    const timestamp = now.toISOString().split(".")[0];

    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      const newFrontmatter = `---
ems__Effort_status: "[[ems__EffortStatusDone]]"
ems__Effort_endTimestamp: ${timestamp}
---
${content}`;
      return newFrontmatter;
    }

    const frontmatterContent = match[1];
    let updatedFrontmatter = frontmatterContent;

    if (updatedFrontmatter.includes("ems__Effort_status:")) {
      updatedFrontmatter = updatedFrontmatter.replace(
        /ems__Effort_status:.*$/m,
        'ems__Effort_status: "[[ems__EffortStatusDone]]"',
      );
    } else {
      updatedFrontmatter += '\nems__Effort_status: "[[ems__EffortStatusDone]]"';
    }

    if (updatedFrontmatter.includes("ems__Effort_endTimestamp:")) {
      updatedFrontmatter = updatedFrontmatter.replace(
        /ems__Effort_endTimestamp:.*$/m,
        `ems__Effort_endTimestamp: ${timestamp}`,
      );
    } else {
      updatedFrontmatter += `\nems__Effort_endTimestamp: ${timestamp}`;
    }

    return content.replace(
      frontmatterRegex,
      `---\n${updatedFrontmatter}\n---`,
    );
  }

  async archiveTask(taskFile: TFile): Promise<void> {
    const fileContent = await this.vault.read(taskFile);
    const updatedContent = this.updateFrontmatterWithArchived(fileContent);
    await this.vault.modify(taskFile, updatedContent);
  }

  private updateFrontmatterWithArchived(content: string): string {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      const newFrontmatter = `---
archived: true
---
${content}`;
      return newFrontmatter;
    }

    const frontmatterContent = match[1];
    let updatedFrontmatter = frontmatterContent;

    if (updatedFrontmatter.includes("archived:")) {
      updatedFrontmatter = updatedFrontmatter.replace(
        /archived:.*$/m,
        "archived: true",
      );
    } else {
      updatedFrontmatter += "\narchived: true";
    }

    return content.replace(
      frontmatterRegex,
      `---\n${updatedFrontmatter}\n---`,
    );
  }
}
