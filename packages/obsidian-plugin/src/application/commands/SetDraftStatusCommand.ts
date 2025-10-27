import { TFile, Notice } from "obsidian";
import { ICommand } from "./ICommand";
import {
  CommandVisibilityContext,
  canSetDraftStatus,
  TaskStatusService,
  LoggingService,
} from "@exocortex/core";

export class SetDraftStatusCommand implements ICommand {
  id = "set-draft-status";
  name = "Set draft status";

  constructor(private taskStatusService: TaskStatusService) {}

  checkCallback = (checking: boolean, file: TFile, context: CommandVisibilityContext | null): boolean => {
    if (!context || !canSetDraftStatus(context)) return false;

    if (!checking) {
      this.execute(file).catch((error) => {
        new Notice(`Failed to set draft status: ${error.message}`);
        LoggingService.error("Set draft status error", error);
      });
    }

    return true;
  };

  private async execute(file: TFile): Promise<void> {
    await this.taskStatusService.setDraftStatus(file);
    new Notice(`Set Draft status: ${file.basename}`);
  }
}
