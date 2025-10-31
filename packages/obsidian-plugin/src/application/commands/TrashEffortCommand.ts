import { TFile, Notice } from "obsidian";
import { ICommand } from "./ICommand";
import {
  CommandVisibilityContext,
  canTrashEffort,
  TaskStatusService,
  LoggingService,
} from "@exocortex/core";

export class TrashEffortCommand implements ICommand {
  id = "trash-effort";
  name = "Trash";

  constructor(private taskStatusService: TaskStatusService) {}

  checkCallback = (
    checking: boolean,
    file: TFile,
    context: CommandVisibilityContext | null,
  ): boolean => {
    if (!context || !canTrashEffort(context)) return false;

    if (!checking) {
      this.execute(file).catch((error) => {
        new Notice(`Failed to trash effort: ${error.message}`);
        LoggingService.error("Trash effort error", error);
      });
    }

    return true;
  };

  private async execute(file: TFile): Promise<void> {
    await this.taskStatusService.trashEffort(file);
    new Notice(`Trashed: ${file.basename}`);
  }
}
