import { TFile, Notice } from "obsidian";
import { ICommand } from "./ICommand";
import {
  CommandVisibilityContext,
  canMarkDone,
  TaskStatusService,
  LoggingService,
} from "@exocortex/core";

export class MarkDoneCommand implements ICommand {
  id = "mark-done";
  name = "Mark as done";

  constructor(private taskStatusService: TaskStatusService) {}

  checkCallback = (checking: boolean, file: TFile, context: CommandVisibilityContext | null): boolean => {
    if (!context || !canMarkDone(context)) return false;

    if (!checking) {
      this.execute(file).catch((error) => {
        new Notice(`Failed to mark as done: ${error.message}`);
        LoggingService.error("Mark done error", error);
      });
    }

    return true;
  };

  private async execute(file: TFile): Promise<void> {
    await this.taskStatusService.markTaskAsDone(file);
    new Notice(`Marked as done: ${file.basename}`);
  }
}
