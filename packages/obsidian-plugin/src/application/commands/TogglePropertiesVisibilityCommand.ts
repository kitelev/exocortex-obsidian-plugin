import { Notice } from "obsidian";
import { ICommand } from "./ICommand";
import { ExocortexPluginInterface } from "../../types";

export class TogglePropertiesVisibilityCommand implements ICommand {
  id = "toggle-properties-visibility";
  name = "Toggle properties visibility";

  constructor(private plugin: ExocortexPluginInterface) {}

  callback = async (): Promise<void> => {
    this.plugin.settings.showPropertiesSection = !this.plugin.settings.showPropertiesSection;
    await this.plugin.saveSettings();
    this.plugin.refreshLayout?.();
    new Notice(
      `Properties section ${this.plugin.settings.showPropertiesSection ? "shown" : "hidden"}`,
    );
  };
}
