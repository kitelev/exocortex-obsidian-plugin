import { TFile, Notice } from "obsidian";
import { ICommand } from "./ICommand";
import {
  CommandVisibilityContext,
  canMoveToBacklog,
  TaskStatusService,
  LoggingService,
} from "@exocortex/core";

export class MoveToBacklogCommand implements ICommand {
  id = "move-to-backlog";
  name = "Move to backlog";

  constructor(private taskStatusService: TaskStatusService) {}

  checkCallback = (
    checking: boolean,
    file: TFile,
    context: CommandVisibilityContext | null,
  ): boolean => {
    if (!context || !canMoveToBacklog(context)) return false;

    if (!checking) {
      this.execute(file).catch((error) => {
        new Notice(`Failed to move to backlog: ${error.message}`);
        LoggingService.error("Move to backlog error", error);
      });
    }

    return true;
  };

  private async execute(file: TFile): Promise<void> {
    await this.taskStatusService.moveToBacklog(file);
    new Notice(`Moved to Backlog: ${file.basename}`);
  }
}
