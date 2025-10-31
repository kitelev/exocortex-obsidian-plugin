import { TFile, Notice } from "obsidian";
import { ICommand } from "./ICommand";
import {
  CommandVisibilityContext,
  canShiftDayBackward,
  TaskStatusService,
  LoggingService,
} from "@exocortex/core";

export class ShiftDayBackwardCommand implements ICommand {
  id = "shift-day-backward";
  name = "Shift day backward";

  constructor(private taskStatusService: TaskStatusService) {}

  checkCallback = (
    checking: boolean,
    file: TFile,
    context: CommandVisibilityContext | null,
  ): boolean => {
    if (!context || !canShiftDayBackward(context)) return false;

    if (!checking) {
      this.execute(file).catch((error) => {
        new Notice(`Failed to shift day backward: ${error.message}`);
        LoggingService.error("Shift day backward error", error);
      });
    }

    return true;
  };

  private async execute(file: TFile): Promise<void> {
    await this.taskStatusService.shiftDayBackward(file);
    new Notice(`Day shifted backward: ${file.basename}`);
  }
}
