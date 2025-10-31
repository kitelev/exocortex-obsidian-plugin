import { TFile, Notice } from "obsidian";
import { ICommand } from "./ICommand";
import {
  CommandVisibilityContext,
  canConvertTaskToProject,
  AssetConversionService,
  LoggingService,
} from "@exocortex/core";
import { ObsidianVaultAdapter } from "../../adapters/ObsidianVaultAdapter";

export class ConvertTaskToProjectCommand implements ICommand {
  id = "convert-task-to-project";
  name = "Convert Task to Project";

  constructor(private conversionService: AssetConversionService) {}

  checkCallback = (
    checking: boolean,
    file: TFile,
    context: CommandVisibilityContext | null,
  ): boolean => {
    if (!context || !canConvertTaskToProject(context)) return false;

    if (!checking) {
      this.execute(file).catch((error) => {
        new Notice(`Failed to convert Task to Project: ${error.message}`);
        LoggingService.error("Convert Task to Project error", error);
      });
    }

    return true;
  };

  private async execute(file: TFile): Promise<void> {
    await this.conversionService.convertTaskToProject(file);
    new Notice(`Converted to Project: ${file.basename}`);
  }
}
