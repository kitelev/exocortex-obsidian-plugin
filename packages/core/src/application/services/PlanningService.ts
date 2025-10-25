import { FrontmatterService } from "../../infrastructure/utilities/FrontmatterService";
import { DateFormatter } from "../../infrastructure/utilities/DateFormatter";
import { IFileSystemAdapter } from "../../infrastructure/interfaces/IFileSystemAdapter";

export class PlanningService {
  private frontmatterService: FrontmatterService;

  constructor(private fs: IFileSystemAdapter) {
    this.frontmatterService = new FrontmatterService();
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

  async planOnDate(taskFilePath: string, date: Date): Promise<void> {
    const content = await this.fs.readFile(taskFilePath);
    const dateWikilink = DateFormatter.toDateWikilink(date);
    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_day",
      dateWikilink,
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
}
