import { Keymap } from "obsidian";
import { ObsidianApp } from '@plugin/types';

/**
 * Utility class for handling common Obsidian link interactions
 */
export class LinkHandlers {
  /**
   * Creates a link click handler that respects Obsidian's modifier key behavior
   * - With modifier (Cmd/Ctrl): Opens link in new tab
   * - Without modifier: Opens link in current pane
   */
  static createLinkClickHandler(
    app: ObsidianApp,
  ): (path: string, event: React.MouseEvent) => Promise<void> {
    return async (path: string, event: React.MouseEvent) => {
      const isModPressed = Keymap.isModEvent(event.nativeEvent as MouseEvent);

      if (isModPressed) {
        await app.workspace.openLinkText(path, "", "tab");
      } else {
        await app.workspace.openLinkText(path, "", false);
      }
    };
  }
}
