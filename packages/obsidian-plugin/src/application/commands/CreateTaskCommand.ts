import { App, TFile, Notice } from "obsidian";
import { ICommand } from "./ICommand";
import {
  CommandVisibilityContext,
  canCreateTask,
  TaskCreationService,
  WikiLinkHelpers,
  LoggingService,
} from "@exocortex/core";
import { LabelInputModal, type LabelInputModalResult } from "../../presentation/modals/LabelInputModal";
import { DynamicAssetCreationModal, type DynamicAssetCreationResult } from "../../presentation/modals/DynamicAssetCreationModal";
import { ObsidianVaultAdapter } from "../../adapters/ObsidianVaultAdapter";
import { ExocortexPluginInterface } from "../../types";
import { CommandHelpers } from "./helpers/CommandHelpers";

export class CreateTaskCommand implements ICommand {
  id = "create-task";
  name = "Create task";

  constructor(
    private app: App,
    private taskCreationService: TaskCreationService,
    private vaultAdapter: ObsidianVaultAdapter,
    private plugin: ExocortexPluginInterface,
  ) {}

  checkCallback = (checking: boolean, file: TFile, context: CommandVisibilityContext | null): boolean => {
    if (!context || !canCreateTask(context)) return false;

    if (!checking) {
      this.execute(file, context).catch((error) => {
        new Notice(`Failed to create task: ${error.message}`);
        LoggingService.error("Create task error", error);
      });
    }

    return true;
  };

  private async execute(file: TFile, context: CommandVisibilityContext): Promise<void> {
    const useDynamicFields = this.plugin.settings.useDynamicPropertyFields ?? false;

    const result = await this.showModal(useDynamicFields);

    if (result.label === null) {
      return;
    }

    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};

    const instanceClass = context.instanceClass;
    const classes = Array.isArray(instanceClass) ? instanceClass : [instanceClass];
    const firstClass = classes[0] || "";
    const sourceClass = WikiLinkHelpers.normalize(firstClass);

    const createdFile = await this.taskCreationService.createTask(
      file,
      metadata,
      sourceClass,
      result.label,
      result.taskSize,
    );

    const tfile = this.vaultAdapter.toTFile(createdFile);

    // Use lifecycle-managed polling for file activation
    await CommandHelpers.openFile(this.app, tfile, result.openInNewTab ?? false);

    new Notice(`Task created: ${createdFile.basename}`);
  }

  /**
   * Shows the appropriate modal based on the useDynamicPropertyFields setting.
   * @param useDynamicFields - If true, shows DynamicAssetCreationModal; otherwise LabelInputModal
   * @returns Promise resolving to the modal result
   */
  private showModal(useDynamicFields: boolean): Promise<LabelInputModalResult> {
    if (useDynamicFields) {
      return new Promise<DynamicAssetCreationResult>((resolve) => {
        new DynamicAssetCreationModal(
          this.app,
          "ems__Task",
          resolve,
        ).open();
      });
    }

    return new Promise<LabelInputModalResult>((resolve) => {
      new LabelInputModal(this.app, resolve).open();
    });
  }
}
