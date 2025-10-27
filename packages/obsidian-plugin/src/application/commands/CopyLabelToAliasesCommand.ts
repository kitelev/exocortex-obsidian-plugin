import { TFile, Notice } from "obsidian";
import { ICommand } from "./ICommand";
import {
  CommandVisibilityContext,
  canCopyLabelToAliases,
  LabelToAliasService,
  LoggingService,
} from "@exocortex/core";

export class CopyLabelToAliasesCommand implements ICommand {
  id = "copy-label-to-aliases";
  name = "Copy label to aliases";

  constructor(private labelToAliasService: LabelToAliasService) {}

  checkCallback = (checking: boolean, file: TFile, context: CommandVisibilityContext | null): boolean => {
    if (!context || !canCopyLabelToAliases(context)) return false;

    if (!checking) {
      this.execute(file).catch((error) => {
        new Notice(`Failed to copy label: ${error.message}`);
        LoggingService.error("Copy label to aliases error", error);
      });
    }

    return true;
  };

  private async execute(file: TFile): Promise<void> {
    await this.labelToAliasService.copyLabelToAliases(file);
    new Notice("Label copied to aliases");
  }
}
