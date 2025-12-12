import { TFile } from "obsidian";
import { ObsidianApp } from "../../../types";
import { getTimerManager } from "../../../infrastructure/lifecycle";

/**
 * Utility class for common file operations in commands
 */
export class CommandHelpers {
  // Maximum attempts to wait for file activation (20 × 100ms = 2 seconds total timeout)
  private static readonly MAX_FILE_ACTIVATION_ATTEMPTS = 20;
  private static readonly FILE_ACTIVATION_CHECK_INTERVAL_MS = 100;

  /**
   * Opens a file in a new tab and waits for it to become active.
   * Uses TimerManager for lifecycle-managed polling.
   *
   * @param app - Obsidian app instance
   * @param file - File to open
   * @param signal - Optional AbortSignal for cancellation
   * @returns Promise that resolves when file is active (with 2 second timeout)
   * @throws AbortError if signal is aborted during polling
   */
  static async openFileInNewTab(
    app: ObsidianApp,
    file: TFile,
    signal?: AbortSignal
  ): Promise<void> {
    const leaf = app.workspace.getLeaf("tab");
    await leaf.openFile(file);
    app.workspace.setActiveLeaf(leaf, { focus: true });

    // Use TimerManager for lifecycle-managed polling
    const timerManager = getTimerManager();
    await timerManager.pollUntil(
      () => app.workspace.getActiveFile()?.path === file.path,
      {
        signal,
        interval: this.FILE_ACTIVATION_CHECK_INTERVAL_MS,
        maxAttempts: this.MAX_FILE_ACTIVATION_ATTEMPTS,
      }
    );
  }

  /**
   * Opens a file in the specified leaf and waits for it to become active.
   * Uses TimerManager for lifecycle-managed polling.
   *
   * @param app - Obsidian app instance
   * @param file - File to open
   * @param openInNewTab - Whether to open in a new tab
   * @param signal - Optional AbortSignal for cancellation
   * @returns Promise that resolves when file is active (with 2 second timeout)
   * @throws AbortError if signal is aborted during polling
   */
  static async openFile(
    app: ObsidianApp,
    file: TFile,
    openInNewTab: boolean,
    signal?: AbortSignal
  ): Promise<void> {
    const leaf = openInNewTab
      ? app.workspace.getLeaf("tab")
      : app.workspace.getLeaf(false);
    await leaf.openFile(file);
    app.workspace.setActiveLeaf(leaf, { focus: true });

    // Use TimerManager for lifecycle-managed polling
    const timerManager = getTimerManager();
    await timerManager.pollUntil(
      () => app.workspace.getActiveFile()?.path === file.path,
      {
        signal,
        interval: this.FILE_ACTIVATION_CHECK_INTERVAL_MS,
        maxAttempts: this.MAX_FILE_ACTIVATION_ATTEMPTS,
      }
    );
  }
}
