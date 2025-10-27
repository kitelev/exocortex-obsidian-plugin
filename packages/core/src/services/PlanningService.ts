import { IVaultAdapter, IFile } from "../interfaces/IVaultAdapter";
import { FrontmatterService } from "../utilities/FrontmatterService";
import { DateFormatter } from "../utilities/DateFormatter";

export class PlanningService {
  private frontmatterService: FrontmatterService;

  constructor(private vault: IVaultAdapter) {
    this.frontmatterService = new FrontmatterService();
  }

  async planOnToday(taskPath: string): Promise<void> {
    const file = this.vault.getAbstractFileByPath(taskPath);

    if (!file || !this.isFile(file)) {
      throw new Error(`File not found: ${taskPath}`);
    }

    const content = await this.vault.read(file);
    const todayWikilink = DateFormatter.getTodayWikilink();
    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_day",
      todayWikilink,
    );
    await this.vault.modify(file, updated);
  }

  private isFile(file: any): file is IFile {
    return "basename" in file;
  }
}
