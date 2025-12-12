import { App, TFile, Notice } from "obsidian";
import { ICommand } from "./ICommand";
import {
  CommandVisibilityContext,
  canCreateInstance,
  TaskCreationService,
  WikiLinkHelpers,
  AssetClass,
  LoggingService,
} from "@exocortex/core";
import { LabelInputModal, type LabelInputModalResult } from "../../presentation/modals/LabelInputModal";
import { DynamicAssetCreationModal, type DynamicAssetCreationResult } from "../../presentation/modals/DynamicAssetCreationModal";
import { ObsidianVaultAdapter } from "../../adapters/ObsidianVaultAdapter";
import { ExocortexPluginInterface } from "../../types";

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
      this.execute(file, context).catch((error) => {
        new Notice(`Failed to create instance: ${error.message}`);
        LoggingService.error("Create instance error", error);
      });
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

    const maxAttempts = 20;
    const targetPath = tfile.path;
    for (let i = 0; i < maxAttempts; i++) {
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile?.path === targetPath) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    new Notice(`Instance created: ${createdFile.basename}`);
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
