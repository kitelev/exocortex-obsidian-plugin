import { Notice } from "obsidian";
import { ICommand } from "./ICommand";
import { ExocortexPluginInterface } from "../../types";

export class ToggleArchivedAssetsCommand implements ICommand {
  id = "toggle-archived-assets-visibility";
  name = "Toggle archived assets visibility";

  constructor(private plugin: ExocortexPluginInterface) {}

  callback = async (): Promise<void> => {
    this.plugin.settings.showArchivedAssets =
      !this.plugin.settings.showArchivedAssets;
    await this.plugin.saveSettings();
    this.plugin.refreshLayout?.();
    new Notice(
      `Archived assets ${this.plugin.settings.showArchivedAssets ? "shown" : "hidden"}`,
    );
  };
}
