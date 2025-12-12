import { App, TFile, Notice } from "obsidian";
import { ICommand } from "./ICommand";
import {
  CommandVisibilityContext,
  canCreateRelatedTask,
  TaskCreationService,
  LoggingService,
} from "@exocortex/core";
import { LabelInputModal, type LabelInputModalResult } from "../../presentation/modals/LabelInputModal";
import { ObsidianVaultAdapter } from "../../adapters/ObsidianVaultAdapter";
import { CommandHelpers } from "./helpers/CommandHelpers";

export class CreateRelatedTaskCommand implements ICommand {
  id = "create-related-task";
  name = "Create related task";

  constructor(
    private app: App,
    private taskCreationService: TaskCreationService,
    private vaultAdapter: ObsidianVaultAdapter,
  ) {}

  checkCallback = (checking: boolean, file: TFile, context: CommandVisibilityContext | null): boolean => {
    if (!context || !canCreateRelatedTask(context)) return false;

    if (!checking) {
      this.execute(file, context).catch((error) => {
        new Notice(`Failed to create related task: ${error.message}`);
        LoggingService.error("Create related task error", error);
      });
    }

    return true;
  };

  private async execute(file: TFile, _context: CommandVisibilityContext): Promise<void> {
    const result = await new Promise<LabelInputModalResult>((resolve) => {
      new LabelInputModal(this.app, resolve).open();
    });

    if (result.label === null) {
      return;
    }

    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};

    const createdFile = await this.taskCreationService.createRelatedTask(
      file,
      metadata,
      result.label,
      result.taskSize,
    );

    const tfile = this.vaultAdapter.toTFile(createdFile);

    // Use lifecycle-managed polling for file activation
    await CommandHelpers.openFile(this.app, tfile, result.openInNewTab ?? false);

    new Notice(`Related task created: ${createdFile.basename}`);
  }
}
