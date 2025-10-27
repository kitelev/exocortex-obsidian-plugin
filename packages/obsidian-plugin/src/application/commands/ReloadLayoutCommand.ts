import { Notice } from "obsidian";
import { ICommand } from "./ICommand";

export class ReloadLayoutCommand implements ICommand {
  id = "reload-layout";
  name = "Reload layout";

  constructor(private reloadLayoutCallback?: () => void) {}

  callback = (): void => {
    if (this.reloadLayoutCallback) {
      this.reloadLayoutCallback();
      new Notice("Layout reloaded");
    } else {
      new Notice("Failed to reload layout");
    }
  };
}
