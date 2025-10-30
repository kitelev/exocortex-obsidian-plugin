import { TFile } from "obsidian";

type ObsidianApp = any;

/**
 * Utility class for common file operations in commands
 */
export class CommandHelpers {
  /**
   * Opens a file in a new tab and waits for it to become active
   * @param app - Obsidian app instance
   * @param file - File to open
   * @returns Promise that resolves when file is active
   */
  static async openFileInNewTab(app: ObsidianApp, file: TFile): Promise<void> {
    const leaf = app.workspace.getLeaf("tab");
    await leaf.openFile(file);
    app.workspace.setActiveLeaf(leaf, { focus: true });

    // Wait for the file to become active (with timeout)
    const maxAttempts = 20;
    for (let i = 0; i < maxAttempts; i++) {
      if (app.workspace.getActiveFile()?.path === file.path) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}
