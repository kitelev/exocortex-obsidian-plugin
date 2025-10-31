import { TFile } from "obsidian";

type ObsidianApp = any;

/**
 * Utility class for common file operations in commands
 */
export class CommandHelpers {
  // Maximum attempts to wait for file activation (20 × 100ms = 2 seconds total timeout)
  private static readonly MAX_FILE_ACTIVATION_ATTEMPTS = 20;
  private static readonly FILE_ACTIVATION_CHECK_INTERVAL_MS = 100;

  /**
   * Opens a file in a new tab and waits for it to become active
   * @param app - Obsidian app instance
   * @param file - File to open
   * @returns Promise that resolves when file is active (with 2 second timeout)
   */
  static async openFileInNewTab(app: ObsidianApp, file: TFile): Promise<void> {
    const leaf = app.workspace.getLeaf("tab");
    await leaf.openFile(file);
    app.workspace.setActiveLeaf(leaf, { focus: true });

    // Wait for the file to become active (with timeout)
    for (let i = 0; i < this.MAX_FILE_ACTIVATION_ATTEMPTS; i++) {
      if (app.workspace.getActiveFile()?.path === file.path) {
        break;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, this.FILE_ACTIVATION_CHECK_INTERVAL_MS),
      );
    }
  }
}
