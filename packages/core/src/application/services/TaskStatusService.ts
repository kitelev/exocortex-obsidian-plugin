import { FrontmatterService } from "../../infrastructure/utilities/FrontmatterService";
import { DateFormatter } from "../../infrastructure/utilities/DateFormatter";
import { AssetClass, EffortStatus } from "../../domain/constants";
import { IFileSystemAdapter } from "../../infrastructure/interfaces/IFileSystemAdapter";

export class TaskStatusService {
  private frontmatterService: FrontmatterService;

  constructor(private fs: IFileSystemAdapter) {
    this.frontmatterService = new FrontmatterService();
  }

  async setDraftStatus(taskFilePath: string): Promise<void> {
    const content = await this.fs.readFile(taskFilePath);
    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_status",
      '"[[ems__EffortStatusDraft]]"',
    );
    await this.fs.updateFile(taskFilePath, updated);
  }

  async moveToBacklog(taskFilePath: string): Promise<void> {
    const content = await this.fs.readFile(taskFilePath);
    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_status",
      '"[[ems__EffortStatusBacklog]]"',
    );
    await this.fs.updateFile(taskFilePath, updated);
  }

  async moveToAnalysis(projectFilePath: string): Promise<void> {
    const content = await this.fs.readFile(projectFilePath);
    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_status",
      '"[[ems__EffortStatusAnalysis]]"',
    );
    await this.fs.updateFile(projectFilePath, updated);
  }

  async moveToToDo(projectFilePath: string): Promise<void> {
    const content = await this.fs.readFile(projectFilePath);
    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_status",
      '"[[ems__EffortStatusToDo]]"',
    );
    await this.fs.updateFile(projectFilePath, updated);
  }

  async startEffort(taskFilePath: string): Promise<void> {
    const content = await this.fs.readFile(taskFilePath);
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

    await this.fs.updateFile(taskFilePath, updated);
  }

  async markTaskAsDone(taskFilePath: string): Promise<void> {
    const content = await this.fs.readFile(taskFilePath);
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

    await this.fs.updateFile(taskFilePath, updated);
  }

  async syncEffortEndTimestamp(
    taskFilePath: string,
    date?: Date,
  ): Promise<void> {
    const content = await this.fs.readFile(taskFilePath);
    const targetDate = date || new Date();
    const timestamp = DateFormatter.toLocalTimestamp(targetDate);

    let updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_endTimestamp",
      timestamp,
    );
    updated = this.frontmatterService.updateProperty(
      updated,
      "ems__Effort_resolutionTimestamp",
      timestamp,
    );

    await this.fs.updateFile(taskFilePath, updated);
  }

  async trashEffort(taskFilePath: string): Promise<void> {
    const content = await this.fs.readFile(taskFilePath);
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

    await this.fs.updateFile(taskFilePath, updated);
  }

  async archiveTask(taskFilePath: string): Promise<void> {
    const content = await this.fs.readFile(taskFilePath);
    const updated = this.frontmatterService.updateProperty(
      content,
      "archived",
      "true",
    );
    await this.fs.updateFile(taskFilePath, updated);
  }

  async planOnToday(taskFilePath: string): Promise<void> {
    const content = await this.fs.readFile(taskFilePath);
    const todayWikilink = DateFormatter.getTodayWikilink();
    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_day",
      todayWikilink,
    );
    await this.fs.updateFile(taskFilePath, updated);
  }

  async planForEvening(taskFilePath: string): Promise<void> {
    const content = await this.fs.readFile(taskFilePath);
    const evening = new Date();
    evening.setHours(19, 0, 0, 0);
    const eveningTimestamp = DateFormatter.toLocalTimestamp(evening);

    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_plannedStartTimestamp",
      eveningTimestamp,
    );
    await this.fs.updateFile(taskFilePath, updated);
  }

  async shiftDayBackward(taskFilePath: string): Promise<void> {
    const content = await this.fs.readFile(taskFilePath);
    const currentEffortDay = this.extractEffortDay(content);

    if (!currentEffortDay) {
      throw new Error("ems__Effort_day property not found");
    }

    const currentDate = this.parseDateFromWikilink(currentEffortDay);

    if (!currentDate) {
      throw new Error("Invalid date format in ems__Effort_day");
    }

    const newDate = DateFormatter.addDays(currentDate, -1);
    const newWikilink = DateFormatter.toDateWikilink(newDate);

    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_day",
      newWikilink,
    );
    await this.fs.updateFile(taskFilePath, updated);
  }

  async shiftDayForward(taskFilePath: string): Promise<void> {
    const content = await this.fs.readFile(taskFilePath);
    const currentEffortDay = this.extractEffortDay(content);

    if (!currentEffortDay) {
      throw new Error("ems__Effort_day property not found");
    }

    const currentDate = this.parseDateFromWikilink(currentEffortDay);

    if (!currentDate) {
      throw new Error("Invalid date format in ems__Effort_day");
    }

    const newDate = DateFormatter.addDays(currentDate, 1);
    const newWikilink = DateFormatter.toDateWikilink(newDate);

    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_day",
      newWikilink,
    );
    await this.fs.updateFile(taskFilePath, updated);
  }

  async rollbackStatus(taskFilePath: string): Promise<void> {
    const content = await this.fs.readFile(taskFilePath);
    const currentStatus = this.extractCurrentStatus(content);
    const instanceClass = this.extractInstanceClass(content);

    if (!currentStatus) {
      throw new Error("No current status to rollback from");
    }

    const previousStatus = this.getPreviousStatusFromWorkflow(
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

    const normalizedStatus = currentStatus.replace(/["'[\]]/g, "").trim();

    if (normalizedStatus === EffortStatus.DONE) {
      updated = this.frontmatterService.removeProperty(
        updated,
        "ems__Effort_endTimestamp",
      );
      updated = this.frontmatterService.removeProperty(
        updated,
        "ems__Effort_resolutionTimestamp",
      );
    } else if (normalizedStatus === EffortStatus.DOING) {
      updated = this.frontmatterService.removeProperty(
        updated,
        "ems__Effort_startTimestamp",
      );
    }

    await this.fs.updateFile(taskFilePath, updated);
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

  private getPreviousStatusFromWorkflow(
    currentStatus: string,
    instanceClass: string | string[] | null,
  ): string | null | undefined {
    const normalizedStatus = currentStatus.replace(/["'[\]]/g, "").trim();

    if (normalizedStatus === EffortStatus.DRAFT) {
      return null;
    }

    if (normalizedStatus === EffortStatus.BACKLOG) {
      return `"[[${EffortStatus.DRAFT}]]"`;
    }

    if (normalizedStatus === EffortStatus.ANALYSIS) {
      return `"[[${EffortStatus.BACKLOG}]]"`;
    }

    if (normalizedStatus === EffortStatus.TODO) {
      return `"[[${EffortStatus.ANALYSIS}]]"`;
    }

    if (normalizedStatus === EffortStatus.DOING) {
      const isProject = this.hasInstanceClass(instanceClass, AssetClass.PROJECT);
      return isProject
        ? `"[[${EffortStatus.TODO}]]"`
        : `"[[${EffortStatus.BACKLOG}]]"`;
    }

    if (normalizedStatus === EffortStatus.DONE) {
      return `"[[${EffortStatus.DOING}]]"`;
    }

    return undefined;
  }

  private hasInstanceClass(
    instanceClass: string | string[] | null,
    targetClass: AssetClass,
  ): boolean {
    if (!instanceClass) return false;

    const classes = Array.isArray(instanceClass)
      ? instanceClass
      : [instanceClass];
    return classes.some(
      (cls) => cls.replace(/["'[\]]/g, "").trim() === targetClass,
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
