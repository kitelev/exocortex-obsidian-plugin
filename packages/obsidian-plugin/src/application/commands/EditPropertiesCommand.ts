import { App, TFile, Notice } from "obsidian";
import { ICommand } from "./ICommand";
import { CommandVisibilityContext, canEditProperties, LoggingService } from "@exocortex/core";
import { PropertyEditorModal } from "../../presentation/modals/PropertyEditorModal";

export class EditPropertiesCommand implements ICommand {
  id = "edit-properties";
  name = "Edit properties";

  constructor(private app: App) {}

  checkCallback = (
    checking: boolean,
    file: TFile,
    context: CommandVisibilityContext | null,
  ): boolean => {
    if (!context || !canEditProperties(context)) return false;

    if (!checking) {
      this.execute(file).catch((error) => {
        new Notice(`Failed to edit properties: ${error.message}`);
        LoggingService.error("Edit properties error", error);
      });
    }

    return true;
  };

  private async execute(file: TFile): Promise<void> {
    const modal = new PropertyEditorModal(this.app, file, (result) => {
      if (!result.cancelled) {
        const changedCount = Object.keys(result.properties).length;
        new Notice(`Properties updated: ${file.basename} (${changedCount} properties)`);
      }
    });
    modal.open();
  }
}
