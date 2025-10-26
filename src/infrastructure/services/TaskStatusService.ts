import { TFile, Vault } from "obsidian";
import { FrontmatterService } from "./FrontmatterService";
import { DateFormatter } from "../utilities/DateFormatter";
import { EffortStatusWorkflow } from "./EffortStatusWorkflow";
import { StatusTimestampService } from "./StatusTimestampService";

export class TaskStatusService {
  private frontmatterService: FrontmatterService;
  private workflow: EffortStatusWorkflow;
  private timestampService: StatusTimestampService;

  constructor(private vault: Vault) {
    this.frontmatterService = new FrontmatterService();
    this.workflow = new EffortStatusWorkflow();
    this.timestampService = new StatusTimestampService(vault);
  }

  async setDraftStatus(taskFile: TFile): Promise<void> {
    await this.updateStatus(taskFile, "ems__EffortStatusDraft");
  }

  async moveToBacklog(taskFile: TFile): Promise<void> {
    await this.updateStatus(taskFile, "ems__EffortStatusBacklog");
  }

  async moveToAnalysis(projectFile: TFile): Promise<void> {
    await this.updateStatus(projectFile, "ems__EffortStatusAnalysis");
  }

  async moveToToDo(projectFile: TFile): Promise<void> {
    await this.updateStatus(projectFile, "ems__EffortStatusToDo");
  }

  async startEffort(taskFile: TFile): Promise<void> {
    const content = await this.vault.read(taskFile);
    const timestamp = DateFormatter.toLocalTimestamp(new Date());

    let updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_status",
      '"[[ems__EffortStatusDoing]]"',
    );
    updated = this.frontmatterService.updateProperty(
      updated,
      "ems__Effort_startTimestamp",
      timestamp,
    );

    await this.vault.modify(taskFile, updated);
  }

  async markTaskAsDone(taskFile: TFile): Promise<void> {
    const content = await this.vault.read(taskFile);
    const timestamp = DateFormatter.toLocalTimestamp(new Date());

    let updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_status",
      '"[[ems__EffortStatusDone]]"',
    );
    updated = this.frontmatterService.updateProperty(
      updated,
      "ems__Effort_endTimestamp",
      timestamp,
    );
    updated = this.frontmatterService.updateProperty(
      updated,
      "ems__Effort_resolutionTimestamp",
      timestamp,
    );

    await this.vault.modify(taskFile, updated);
  }

  async syncEffortEndTimestamp(
    taskFile: TFile,
    date?: Date,
  ): Promise<void> {
    await this.timestampService.addEndAndResolutionTimestamps(taskFile, date);
  }

  async trashEffort(taskFile: TFile): Promise<void> {
    const content = await this.vault.read(taskFile);
    const timestamp = DateFormatter.toLocalTimestamp(new Date());

    let updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_status",
      '"[[ems__EffortStatusTrashed]]"',
    );
    updated = this.frontmatterService.updateProperty(
      updated,
      "ems__Effort_resolutionTimestamp",
      timestamp,
    );

    await this.vault.modify(taskFile, updated);
  }

  async archiveTask(taskFile: TFile): Promise<void> {
    const content = await this.vault.read(taskFile);
    const updated = this.frontmatterService.updateProperty(
      content,
      "archived",
      "true",
    );
    await this.vault.modify(taskFile, updated);
  }

  async planOnToday(taskFile: TFile): Promise<void> {
    const content = await this.vault.read(taskFile);
    const todayWikilink = DateFormatter.getTodayWikilink();
    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_day",
      todayWikilink,
    );
    await this.vault.modify(taskFile, updated);
  }

  async planForEvening(taskFile: TFile): Promise<void> {
    const content = await this.vault.read(taskFile);
    const evening = new Date();
    evening.setHours(19, 0, 0, 0);
    const eveningTimestamp = DateFormatter.toLocalTimestamp(evening);

    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_plannedStartTimestamp",
      eveningTimestamp,
    );
    await this.vault.modify(taskFile, updated);
  }

  async shiftDayBackward(taskFile: TFile): Promise<void> {
    await this.shiftDay(taskFile, -1);
  }

  async shiftDayForward(taskFile: TFile): Promise<void> {
    await this.shiftDay(taskFile, 1);
  }

  async rollbackStatus(taskFile: TFile): Promise<void> {
    const content = await this.vault.read(taskFile);
    const currentStatus = this.extractCurrentStatus(content);
    const instanceClass = this.extractInstanceClass(content);

    if (!currentStatus) {
      throw new Error("No current status to rollback from");
    }

    const previousStatus = this.workflow.getPreviousStatus(
      currentStatus,
      instanceClass,
    );

    if (previousStatus === undefined) {
      throw new Error("Cannot rollback from current status");
    }

    let updated = content;

    if (previousStatus === null) {
      updated = this.frontmatterService.removeProperty(
        updated,
        "ems__Effort_status",
      );
    } else {
      updated = this.frontmatterService.updateProperty(
        updated,
        "ems__Effort_status",
        previousStatus,
      );
    }

    const normalizedStatus = this.workflow.normalizeStatus(currentStatus);

    if (normalizedStatus === "ems__EffortStatusDone") {
      updated = this.frontmatterService.removeProperty(
        updated,
        "ems__Effort_endTimestamp",
      );
      updated = this.frontmatterService.removeProperty(
        updated,
        "ems__Effort_resolutionTimestamp",
      );
    } else if (normalizedStatus === "ems__EffortStatusDoing") {
      updated = this.frontmatterService.removeProperty(
        updated,
        "ems__Effort_startTimestamp",
      );
    }

    await this.vault.modify(taskFile, updated);
  }

  private async updateStatus(
    taskFile: TFile,
    statusValue: string,
  ): Promise<void> {
    const content = await this.vault.read(taskFile);
    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_status",
      `"[[${statusValue}]]"`,
    );
    await this.vault.modify(taskFile, updated);
  }

  private async shiftDay(taskFile: TFile, days: number): Promise<void> {
    const content = await this.vault.read(taskFile);
    const currentEffortDay = this.extractEffortDay(content);

    if (!currentEffortDay) {
      throw new Error("ems__Effort_day property not found");
    }

    const currentDate = this.parseDateFromWikilink(currentEffortDay);

    if (!currentDate) {
      throw new Error("Invalid date format in ems__Effort_day");
    }

    const newDate = DateFormatter.addDays(currentDate, days);
    const newWikilink = DateFormatter.toDateWikilink(newDate);

    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_day",
      newWikilink,
    );
    await this.vault.modify(taskFile, updated);
  }

  private parseDateFromWikilink(wikilink: string): Date | null {
    const cleanValue = wikilink.replace(/["'[\]]/g, "").trim();
    const date = new Date(cleanValue);

    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  }

  private extractEffortDay(content: string): string | null {
    const parsed = this.frontmatterService.parse(content);
    if (!parsed.exists) return null;

    return this.frontmatterService.getPropertyValue(
      parsed.content,
      "ems__Effort_day",
    );
  }

  private extractCurrentStatus(content: string): string | null {
    const parsed = this.frontmatterService.parse(content);
    if (!parsed.exists) return null;

    return this.frontmatterService.getPropertyValue(
      parsed.content,
      "ems__Effort_status",
    );
  }

  private extractInstanceClass(content: string): string | string[] | null {
    const parsed = this.frontmatterService.parse(content);
    if (!parsed.exists) return null;

    const arrayMatch = parsed.content.match(
      /exo__Instance_class:\s*\n((?:\s*-\s*.*\n?)+)/,
    );

    if (arrayMatch) {
      const lines = arrayMatch[1].split("\n").filter(l => l.trim());
      return lines.map((line) => line.replace(/^\s*-\s*/, "").trim());
    }

    return this.frontmatterService.getPropertyValue(
      parsed.content,
      "exo__Instance_class",
    );
  }
}
