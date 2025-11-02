import { App, Notice } from "obsidian";
import { ICommand } from "./ICommand";
import { ExocortexPluginInterface } from "../../types";
import {
  AreaSelectionModal,
  AreaSelectionModalResult,
} from "../../presentation/modals/AreaSelectionModal";

export class SetFocusAreaCommand implements ICommand {
  id = "set-focus-area";
  name = "Set Focus Area";

  constructor(
    private app: App,
    private plugin: ExocortexPluginInterface,
  ) {}

  callback = async (): Promise<void> => {
    const modal = new AreaSelectionModal(
      this.app,
      async (result: AreaSelectionModalResult) => {
        await this.handleAreaSelection(result);
      },
      this.plugin.settings.activeFocusArea || null,
    );

    modal.open();
  };

  private async handleAreaSelection(
    result: AreaSelectionModalResult,
  ): Promise<void> {
    const previousArea = this.plugin.settings.activeFocusArea;
    this.plugin.settings.activeFocusArea = result.selectedArea;

    await this.plugin.saveSettings();
    this.plugin.refreshLayout?.();

    if (result.selectedArea) {
      new Notice(`Focus area set to: ${result.selectedArea}`);
    } else {
      if (previousArea) {
        new Notice("Focus area cleared - showing all efforts");
      } else {
        new Notice("No focus area selected");
      }
    }
  }
}
