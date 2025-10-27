import { TFile, Notice } from "obsidian";
import { ICommand } from "./ICommand";
import {
  CommandVisibilityContext,
  canPlanOnToday,
  TaskStatusService,
  LoggingService,
} from "@exocortex/core";

export class PlanOnTodayCommand implements ICommand {
  id = "plan-on-today";
  name = "Plan on today";

  constructor(private taskStatusService: TaskStatusService) {}

  checkCallback = (checking: boolean, file: TFile, context: CommandVisibilityContext | null): boolean => {
    if (!context || !canPlanOnToday(context)) return false;

    if (!checking) {
      this.execute(file).catch((error) => {
        new Notice(`Failed to plan on today: ${error.message}`);
        LoggingService.error("Plan on today error", error);
      });
    }

    return true;
  };

  private async execute(file: TFile): Promise<void> {
    await this.taskStatusService.planOnToday(file);
    new Notice(`Planned on today: ${file.basename}`);
  }
}
