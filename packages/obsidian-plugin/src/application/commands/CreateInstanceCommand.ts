import { App, TFile, Notice, EventRef } from "obsidian";
import { ICommand } from "./ICommand";
import {
  CommandVisibilityContext,
  canCreateInstance,
  TaskCreationService,
  WikiLinkHelpers,
  AssetClass,
  LoggingService,
} from "@exocortex/core";
import { LabelInputModal, type LabelInputModalResult } from '@plugin/presentation/modals/LabelInputModal';
import { DynamicAssetCreationModal, type DynamicAssetCreationResult } from '@plugin/presentation/modals/DynamicAssetCreationModal';
import { ObsidianVaultAdapter } from '@plugin/adapters/ObsidianVaultAdapter';
import { ExocortexPluginInterface } from '@plugin/types';

/** Default timeout for waiting for file to become active (in milliseconds) */
const FILE_ACTIVATION_TIMEOUT_MS = 5000;

export class CreateInstanceCommand implements ICommand {
  id = "create-instance";
  name = "Create instance";

  constructor(
    private app: App,
    private taskCreationService: TaskCreationService,
    private vaultAdapter: ObsidianVaultAdapter,
    private plugin: ExocortexPluginInterface,
  ) {}

  checkCallback = (checking: boolean, file: TFile, context: CommandVisibilityContext | null): boolean => {
    if (!context || !canCreateInstance(context)) return false;

    if (!checking) {
      void (async () => {
        try {
          await this.execute(file, context);
        } catch (error) {
          new Notice(`Failed to create instance: ${error instanceof Error ? error.message : String(error)}`);
          LoggingService.error("Create instance error", error instanceof Error ? error : undefined);
        }
      })();
    }

    return true;
  };

  private async execute(file: TFile, context: CommandVisibilityContext): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};

    const instanceClass = context.instanceClass;
    const classes = Array.isArray(instanceClass) ? instanceClass : [instanceClass];
    const firstClass = classes[0] || "";
    const sourceClass = WikiLinkHelpers.normalize(firstClass);

    const useDynamicFields = this.plugin.settings.useDynamicPropertyFields ?? false;
    const showTaskSize = sourceClass !== AssetClass.MEETING_PROTOTYPE;

    const result = await this.showModal(useDynamicFields, sourceClass, showTaskSize);

    if (result.label === null) {
      return;
    }

    const createdFile = await this.taskCreationService.createTask(
      file,
      metadata,
      sourceClass,
      result.label,
      result.taskSize,
    );

    const leaf = result.openInNewTab
      ? this.app.workspace.getLeaf("tab")
      : this.app.workspace.getLeaf(false);
    const tfile = this.vaultAdapter.toTFile(createdFile);
    if (!tfile) {
      throw new Error(`Failed to convert created file to TFile: ${createdFile.path}`);
    }
    await leaf.openFile(tfile);

    this.app.workspace.setActiveLeaf(leaf, { focus: true });

    await this.waitForFileActivation(tfile.path);

    new Notice(`Instance created: ${createdFile.basename}`);
  }

  /**
   * Waits for a file to become the active file using event listeners instead of polling.
   * This is more efficient and doesn't block the UI.
   *
   * @param targetPath - The path of the file to wait for
   * @param timeoutMs - Timeout in milliseconds (default: 5000ms)
   * @returns Promise that resolves when the file becomes active or times out
   */
  private waitForFileActivation(targetPath: string, timeoutMs: number = FILE_ACTIVATION_TIMEOUT_MS): Promise<void> {
    return new Promise<void>((resolve) => {
      // Check if file is already active
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile?.path === targetPath) {
        resolve();
        return;
      }

      let eventRef: EventRef | null = null;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const cleanup = (): void => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (eventRef !== null) {
          this.app.workspace.offref(eventRef);
          eventRef = null;
        }
      };

      // Set up timeout
      timeoutId = setTimeout(() => {
        cleanup();
        // Resolve even on timeout - the file was created successfully,
        // we just couldn't confirm it became active
        resolve();
      }, timeoutMs);

      // Listen for file-open event
      eventRef = this.app.workspace.on("file-open", (openedFile: TFile | null) => {
        if (openedFile?.path === targetPath) {
          cleanup();
          resolve();
        }
      });
    });
  }

  /**
   * Shows the appropriate modal based on the useDynamicPropertyFields setting.
   * @param useDynamicFields - If true, shows DynamicAssetCreationModal; otherwise LabelInputModal
   * @param className - The class name for dynamic modal (e.g., 'ems__Task', 'ems__Effort')
   * @param showTaskSize - Whether to show task size in LabelInputModal (fallback)
   * @returns Promise resolving to the modal result
   */
  private showModal(
    useDynamicFields: boolean,
    className: string,
    showTaskSize: boolean,
  ): Promise<LabelInputModalResult> {
    if (useDynamicFields) {
      return new Promise<DynamicAssetCreationResult>((resolve) => {
        new DynamicAssetCreationModal(
          this.app,
          className,
          resolve,
        ).open();
      });
    }

    return new Promise<LabelInputModalResult>((resolve) => {
      new LabelInputModal(this.app, resolve, "", showTaskSize).open();
    });
  }
}
