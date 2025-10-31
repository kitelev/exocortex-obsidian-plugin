import { TFile, Notice } from "obsidian";
import { ICommand } from "./ICommand";
import {
  CommandVisibilityContext,
  canPlanForEvening,
  TaskStatusService,
  LoggingService,
} from "@exocortex/core";

export class PlanForEveningCommand implements ICommand {
  id = "plan-for-evening";
  name = "Plan for evening (19:00)";

  constructor(private taskStatusService: TaskStatusService) {}

  checkCallback = (
    checking: boolean,
    file: TFile,
    context: CommandVisibilityContext | null,
  ): boolean => {
    if (!context || !canPlanForEvening(context)) return false;

    if (!checking) {
      this.execute(file).catch((error) => {
        new Notice(`Failed to plan for evening: ${error.message}`);
        LoggingService.error("Plan for evening error", error);
      });
    }

    return true;
  };

  private async execute(file: TFile): Promise<void> {
    await this.taskStatusService.planForEvening(file);
    new Notice(`Planned for evening (19:00): ${file.basename}`);
  }
}
