import { FrontmatterService } from "../utilities/FrontmatterService";
import { DateFormatter } from "../utilities/DateFormatter";
import { IVaultAdapter, IFile } from "../interfaces/IVaultAdapter";

export class StatusTimestampService {
  private frontmatterService: FrontmatterService;

  constructor(private vault: IVaultAdapter) {
    this.frontmatterService = new FrontmatterService();
  }

  async addStartTimestamp(taskFile: IFile): Promise<void> {
    const content = await this.vault.read(taskFile);
    const timestamp = DateFormatter.toLocalTimestamp(new Date());

    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_startTimestamp",
      timestamp,
    );

    await this.vault.modify(taskFile, updated);
  }

  async addEndTimestamp(taskFile: IFile, date?: Date): Promise<void> {
    const content = await this.vault.read(taskFile);
    const targetDate = date || new Date();
    const timestamp = DateFormatter.toLocalTimestamp(targetDate);

    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_endTimestamp",
      timestamp,
    );

    await this.vault.modify(taskFile, updated);
  }

  async addResolutionTimestamp(taskFile: IFile): Promise<void> {
    const content = await this.vault.read(taskFile);
    const timestamp = DateFormatter.toLocalTimestamp(new Date());

    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_resolutionTimestamp",
      timestamp,
    );

    await this.vault.modify(taskFile, updated);
  }

  async addEndAndResolutionTimestamps(
    taskFile: IFile,
    date?: Date,
  ): Promise<void> {
    const content = await this.vault.read(taskFile);
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

    await this.vault.modify(taskFile, updated);
  }

  async removeStartTimestamp(taskFile: IFile): Promise<void> {
    const content = await this.vault.read(taskFile);
    const updated = this.frontmatterService.removeProperty(
      content,
      "ems__Effort_startTimestamp",
    );
    await this.vault.modify(taskFile, updated);
  }

  async removeEndTimestamp(taskFile: IFile): Promise<void> {
    const content = await this.vault.read(taskFile);
    const updated = this.frontmatterService.removeProperty(
      content,
      "ems__Effort_endTimestamp",
    );
    await this.vault.modify(taskFile, updated);
  }

  async removeResolutionTimestamp(taskFile: IFile): Promise<void> {
    const content = await this.vault.read(taskFile);
    const updated = this.frontmatterService.removeProperty(
      content,
      "ems__Effort_resolutionTimestamp",
    );
    await this.vault.modify(taskFile, updated);
  }

  async removeEndAndResolutionTimestamps(taskFile: IFile): Promise<void> {
    const content = await this.vault.read(taskFile);
    let updated = this.frontmatterService.removeProperty(
      content,
      "ems__Effort_endTimestamp",
    );
    updated = this.frontmatterService.removeProperty(
      updated,
      "ems__Effort_resolutionTimestamp",
    );
    await this.vault.modify(taskFile, updated);
  }
}
