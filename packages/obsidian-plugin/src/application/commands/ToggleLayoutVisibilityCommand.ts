import { Notice } from "obsidian";
import { ICommand } from "./ICommand";
import { ExocortexPluginInterface } from "../../types";

export class ToggleLayoutVisibilityCommand implements ICommand {
  id = "toggle-layout-visibility";
  name = "Toggle layout visibility";

  constructor(private plugin: ExocortexPluginInterface) {}

  callback = async (): Promise<void> => {
    this.plugin.settings.layoutVisible = !this.plugin.settings.layoutVisible;
    await this.plugin.saveSettings();
    this.plugin.refreshLayout?.();
    new Notice(
      `Layout ${this.plugin.settings.layoutVisible ? "shown" : "hidden"}`,
    );
  };
}
