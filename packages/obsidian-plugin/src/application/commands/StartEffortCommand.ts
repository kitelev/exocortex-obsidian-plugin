import { TFile, Notice } from "obsidian";
import { ICommand } from "./ICommand";
import {
  CommandVisibilityContext,
  canStartEffort,
  TaskStatusService,
  LoggingService,
} from "@exocortex/core";

export class StartEffortCommand implements ICommand {
  id = "start-effort";
  name = "Start effort";

  constructor(private taskStatusService: TaskStatusService) {}

  checkCallback = (
    checking: boolean,
    file: TFile,
    context: CommandVisibilityContext | null,
  ): boolean => {
    if (!context || !canStartEffort(context)) return false;

    if (!checking) {
      this.execute(file).catch((error) => {
        new Notice(`Failed to start effort: ${error.message}`);
        LoggingService.error("Start effort error", error);
      });
    }

    return true;
  };

  private async execute(file: TFile): Promise<void> {
    await this.taskStatusService.startEffort(file);
    new Notice(`Started effort: ${file.basename}`);
  }
}
