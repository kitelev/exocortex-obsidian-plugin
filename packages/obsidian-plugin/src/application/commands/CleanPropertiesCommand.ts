import { TFile, Notice } from "obsidian";
import { ICommand } from "./ICommand";
import {
  CommandVisibilityContext,
  canCleanProperties,
  PropertyCleanupService,
  LoggingService,
} from "@exocortex/core";

export class CleanPropertiesCommand implements ICommand {
  id = "clean-properties";
  name = "Clean empty properties";

  constructor(private propertyCleanupService: PropertyCleanupService) {}

  checkCallback = (
    checking: boolean,
    file: TFile,
    context: CommandVisibilityContext | null,
  ): boolean => {
    if (!context || !canCleanProperties(context)) return false;

    if (!checking) {
      this.execute(file).catch((error) => {
        new Notice(`Failed to clean properties: ${error.message}`);
        LoggingService.error("Clean properties error", error);
      });
    }

    return true;
  };

  private async execute(file: TFile): Promise<void> {
    await this.propertyCleanupService.cleanEmptyProperties(file);
    new Notice(`Cleaned empty properties: ${file.basename}`);
  }
}
