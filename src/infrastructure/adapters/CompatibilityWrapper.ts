import { App } from "obsidian";
import { IUIAdapter } from "../../application/ports/IUIAdapter";
import { ObsidianUIAdapter } from "./ObsidianUIAdapter";

/**
 * Temporary compatibility wrapper to help with the transition
 * TODO: Remove once all renderers are properly refactored
 */
export class CompatibilityWrapper {
  static wrapAppAsUIAdapter(app: App): IUIAdapter {
    return new ObsidianUIAdapter(app);
  }
}