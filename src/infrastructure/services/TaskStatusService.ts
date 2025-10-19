import { TFile, Vault } from "obsidian";

export class TaskStatusService {
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
   * Format date as YYYY-MM-DD wikilink for ems__Effort_day property
   * Format: [[YYYY-MM-DD]]
   */
  private formatDateAsWikilink(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `"[[${year}-${month}-${day}]]"`;
  }

  async setDraftStatus(taskFile: TFile): Promise<void> {
    const fileContent = await this.vault.read(taskFile);
    const updatedContent = this.updateFrontmatterWithDraftStatus(fileContent);
    await this.vault.modify(taskFile, updatedContent);
  }

  private updateFrontmatterWithDraftStatus(content: string): string {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      const newFrontmatter = `---
ems__Effort_status: "[[ems__EffortStatusDraft]]"
---
${content}`;
      return newFrontmatter;
    }

    const frontmatterContent = match[1];
    let updatedFrontmatter = frontmatterContent;

    if (updatedFrontmatter.includes("ems__Effort_status:")) {
      updatedFrontmatter = updatedFrontmatter.replace(
        /ems__Effort_status:.*$/m,
        'ems__Effort_status: "[[ems__EffortStatusDraft]]"',
      );
    } else {
      updatedFrontmatter += '\nems__Effort_status: "[[ems__EffortStatusDraft]]"';
    }

    return content.replace(
      frontmatterRegex,
      `---\n${updatedFrontmatter}\n---`,
    );
  }

  async moveToBacklog(taskFile: TFile): Promise<void> {
    const fileContent = await this.vault.read(taskFile);
    const updatedContent = this.updateFrontmatterWithBacklogStatus(fileContent);
    await this.vault.modify(taskFile, updatedContent);
  }

  private updateFrontmatterWithBacklogStatus(content: string): string {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      const newFrontmatter = `---
ems__Effort_status: "[[ems__EffortStatusBacklog]]"
---
${content}`;
      return newFrontmatter;
    }

    const frontmatterContent = match[1];
    let updatedFrontmatter = frontmatterContent;

    if (updatedFrontmatter.includes("ems__Effort_status:")) {
      updatedFrontmatter = updatedFrontmatter.replace(
        /ems__Effort_status:.*$/m,
        'ems__Effort_status: "[[ems__EffortStatusBacklog]]"',
      );
    } else {
      updatedFrontmatter += '\nems__Effort_status: "[[ems__EffortStatusBacklog]]"';
    }

    return content.replace(
      frontmatterRegex,
      `---\n${updatedFrontmatter}\n---`,
    );
  }

  async moveToAnalysis(projectFile: TFile): Promise<void> {
    const fileContent = await this.vault.read(projectFile);
    const updatedContent = this.updateFrontmatterWithAnalysisStatus(fileContent);
    await this.vault.modify(projectFile, updatedContent);
  }

  private updateFrontmatterWithAnalysisStatus(content: string): string {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      const newFrontmatter = `---
ems__Effort_status: "[[ems__EffortStatusAnalysis]]"
---
${content}`;
      return newFrontmatter;
    }

    const frontmatterContent = match[1];
    let updatedFrontmatter = frontmatterContent;

    if (updatedFrontmatter.includes("ems__Effort_status:")) {
      updatedFrontmatter = updatedFrontmatter.replace(
        /ems__Effort_status:.*$/m,
        'ems__Effort_status: "[[ems__EffortStatusAnalysis]]"',
      );
    } else {
      updatedFrontmatter += '\nems__Effort_status: "[[ems__EffortStatusAnalysis]]"';
    }

    return content.replace(
      frontmatterRegex,
      `---\n${updatedFrontmatter}\n---`,
    );
  }

  async moveToToDo(projectFile: TFile): Promise<void> {
    const fileContent = await this.vault.read(projectFile);
    const updatedContent = this.updateFrontmatterWithToDoStatus(fileContent);
    await this.vault.modify(projectFile, updatedContent);
  }

  private updateFrontmatterWithToDoStatus(content: string): string {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      const newFrontmatter = `---
ems__Effort_status: "[[ems__EffortStatusToDo]]"
---
${content}`;
      return newFrontmatter;
    }

    const frontmatterContent = match[1];
    let updatedFrontmatter = frontmatterContent;

    if (updatedFrontmatter.includes("ems__Effort_status:")) {
      updatedFrontmatter = updatedFrontmatter.replace(
        /ems__Effort_status:.*$/m,
        'ems__Effort_status: "[[ems__EffortStatusToDo]]"',
      );
    } else {
      updatedFrontmatter += '\nems__Effort_status: "[[ems__EffortStatusToDo]]"';
    }

    return content.replace(
      frontmatterRegex,
      `---\n${updatedFrontmatter}\n---`,
    );
  }

  async startEffort(taskFile: TFile): Promise<void> {
    const fileContent = await this.vault.read(taskFile);
    const updatedContent = this.updateFrontmatterWithDoingStatus(fileContent);
    await this.vault.modify(taskFile, updatedContent);
  }

  private updateFrontmatterWithDoingStatus(content: string): string {
    const now = new Date();
    const timestamp = this.formatLocalTimestamp(now);

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
    const timestamp = this.formatLocalTimestamp(now);

    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      const newFrontmatter = `---
ems__Effort_status: "[[ems__EffortStatusDone]]"
ems__Effort_endTimestamp: ${timestamp}
ems__Effort_resolutionTimestamp: ${timestamp}
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

    if (updatedFrontmatter.includes("ems__Effort_resolutionTimestamp:")) {
      updatedFrontmatter = updatedFrontmatter.replace(
        /ems__Effort_resolutionTimestamp:.*$/m,
        `ems__Effort_resolutionTimestamp: ${timestamp}`,
      );
    } else {
      updatedFrontmatter += `\nems__Effort_resolutionTimestamp: ${timestamp}`;
    }

    return content.replace(
      frontmatterRegex,
      `---\n${updatedFrontmatter}\n---`,
    );
  }

  async trashEffort(taskFile: TFile): Promise<void> {
    const fileContent = await this.vault.read(taskFile);
    const updatedContent = this.updateFrontmatterWithTrashedStatus(fileContent);
    await this.vault.modify(taskFile, updatedContent);
  }

  private updateFrontmatterWithTrashedStatus(content: string): string {
    const now = new Date();
    const timestamp = this.formatLocalTimestamp(now);

    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      const newFrontmatter = `---
ems__Effort_status: "[[ems__EffortStatusTrashed]]"
ems__Effort_resolutionTimestamp: ${timestamp}
---
${content}`;
      return newFrontmatter;
    }

    const frontmatterContent = match[1];
    let updatedFrontmatter = frontmatterContent;

    if (updatedFrontmatter.includes("ems__Effort_status:")) {
      updatedFrontmatter = updatedFrontmatter.replace(
        /ems__Effort_status:.*$/m,
        'ems__Effort_status: "[[ems__EffortStatusTrashed]]"',
      );
    } else {
      updatedFrontmatter += '\nems__Effort_status: "[[ems__EffortStatusTrashed]]"';
    }

    if (updatedFrontmatter.includes("ems__Effort_resolutionTimestamp:")) {
      updatedFrontmatter = updatedFrontmatter.replace(
        /ems__Effort_resolutionTimestamp:.*$/m,
        `ems__Effort_resolutionTimestamp: ${timestamp}`,
      );
    } else {
      updatedFrontmatter += `\nems__Effort_resolutionTimestamp: ${timestamp}`;
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

  async planOnToday(taskFile: TFile): Promise<void> {
    const fileContent = await this.vault.read(taskFile);
    const updatedContent = this.updateFrontmatterWithTodayDate(fileContent);
    await this.vault.modify(taskFile, updatedContent);
  }

  async planForEvening(taskFile: TFile): Promise<void> {
    const fileContent = await this.vault.read(taskFile);
    const updatedContent = this.updateFrontmatterWithEveningTimestamp(fileContent);
    await this.vault.modify(taskFile, updatedContent);
  }

  private updateFrontmatterWithEveningTimestamp(content: string): string {
    const now = new Date();
    now.setHours(19, 0, 0, 0);
    const eveningTimestamp = this.formatLocalTimestamp(now);

    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      const newFrontmatter = `---
ems__Effort_plannedStartTimestamp: ${eveningTimestamp}
---
${content}`;
      return newFrontmatter;
    }

    const frontmatterContent = match[1];
    let updatedFrontmatter = frontmatterContent;

    if (updatedFrontmatter.includes("ems__Effort_plannedStartTimestamp:")) {
      updatedFrontmatter = updatedFrontmatter.replace(
        /ems__Effort_plannedStartTimestamp:.*$/m,
        `ems__Effort_plannedStartTimestamp: ${eveningTimestamp}`,
      );
    } else {
      updatedFrontmatter += `\nems__Effort_plannedStartTimestamp: ${eveningTimestamp}`;
    }

    return content.replace(
      frontmatterRegex,
      `---\n${updatedFrontmatter}\n---`,
    );
  }

  private updateFrontmatterWithTodayDate(content: string): string {
    const now = new Date();
    const todayWikilink = this.formatDateAsWikilink(now);

    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      const newFrontmatter = `---
ems__Effort_day: ${todayWikilink}
---
${content}`;
      return newFrontmatter;
    }

    const frontmatterContent = match[1];
    let updatedFrontmatter = frontmatterContent;

    if (updatedFrontmatter.includes("ems__Effort_day:")) {
      updatedFrontmatter = updatedFrontmatter.replace(
        /ems__Effort_day:.*$/m,
        `ems__Effort_day: ${todayWikilink}`,
      );
    } else {
      updatedFrontmatter += `\nems__Effort_day: ${todayWikilink}`;
    }

    return content.replace(
      frontmatterRegex,
      `---\n${updatedFrontmatter}\n---`,
    );
  }

  private parseDateFromWikilink(wikilink: string): Date | null {
    const cleanValue = wikilink.replace(/["'\[\]]/g, "").trim();
    const date = new Date(cleanValue);

    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  }

  private extractEffortDay(content: string): string | null {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) return null;

    const frontmatterContent = match[1];
    const effortDayMatch = frontmatterContent.match(/ems__Effort_day:\s*(.+)$/m);

    if (!effortDayMatch) return null;

    return effortDayMatch[1].trim();
  }

  async shiftDayBackward(taskFile: TFile): Promise<void> {
    const fileContent = await this.vault.read(taskFile);
    const currentEffortDay = this.extractEffortDay(fileContent);

    if (!currentEffortDay) {
      throw new Error("ems__Effort_day property not found");
    }

    const currentDate = this.parseDateFromWikilink(currentEffortDay);

    if (!currentDate) {
      throw new Error("Invalid date format in ems__Effort_day");
    }

    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);

    const updatedContent = this.updateFrontmatterWithDate(fileContent, newDate);
    await this.vault.modify(taskFile, updatedContent);
  }

  async shiftDayForward(taskFile: TFile): Promise<void> {
    const fileContent = await this.vault.read(taskFile);
    const currentEffortDay = this.extractEffortDay(fileContent);

    if (!currentEffortDay) {
      throw new Error("ems__Effort_day property not found");
    }

    const currentDate = this.parseDateFromWikilink(currentEffortDay);

    if (!currentDate) {
      throw new Error("Invalid date format in ems__Effort_day");
    }

    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);

    const updatedContent = this.updateFrontmatterWithDate(fileContent, newDate);
    await this.vault.modify(taskFile, updatedContent);
  }

  private updateFrontmatterWithDate(content: string, date: Date): string {
    const dateWikilink = this.formatDateAsWikilink(date);

    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      const newFrontmatter = `---
ems__Effort_day: ${dateWikilink}
---
${content}`;
      return newFrontmatter;
    }

    const frontmatterContent = match[1];
    let updatedFrontmatter = frontmatterContent;

    if (updatedFrontmatter.includes("ems__Effort_day:")) {
      updatedFrontmatter = updatedFrontmatter.replace(
        /ems__Effort_day:.*$/m,
        `ems__Effort_day: ${dateWikilink}`,
      );
    } else {
      updatedFrontmatter += `\nems__Effort_day: ${dateWikilink}`;
    }

    return content.replace(
      frontmatterRegex,
      `---\n${updatedFrontmatter}\n---`,
    );
  }
}
