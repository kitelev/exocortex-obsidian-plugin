import { App, TFile, Notice } from "obsidian";
import { ICommand } from "./ICommand";
import {
  CommandVisibilityContext,
  canCreateTask,
  TaskCreationService,
  WikiLinkHelpers,
  LoggingService,
} from "@exocortex/core";
import {
  LabelInputModal,
  type LabelInputModalResult,
} from "../../presentation/modals/LabelInputModal";
import { ObsidianVaultAdapter } from "../../adapters/ObsidianVaultAdapter";

export class CreateTaskCommand implements ICommand {
  id = "create-task";
  name = "Create task";

  constructor(
    private app: App,
    private taskCreationService: TaskCreationService,
    private vaultAdapter: ObsidianVaultAdapter,
  ) {}

  checkCallback = (
    checking: boolean,
    file: TFile,
    context: CommandVisibilityContext | null,
  ): boolean => {
    if (!context || !canCreateTask(context)) return false;

    if (!checking) {
      this.execute(file, context).catch((error) => {
        new Notice(`Failed to create task: ${error.message}`);
        LoggingService.error("Create task error", error);
      });
    }

    return true;
  };

  private async execute(
    file: TFile,
    context: CommandVisibilityContext,
  ): Promise<void> {
    const result = await new Promise<LabelInputModalResult>((resolve) => {
      new LabelInputModal(this.app, resolve).open();
    });

    if (result.label === null) {
      return;
    }

    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};

    const instanceClass = context.instanceClass;
    const classes = Array.isArray(instanceClass)
      ? instanceClass
      : [instanceClass];
    const firstClass = classes[0] || "";
    const sourceClass = WikiLinkHelpers.normalize(firstClass);

    const createdFile = await this.taskCreationService.createTask(
      file,
      metadata,
      sourceClass,
      result.label,
      result.taskSize,
    );

    const leaf = this.app.workspace.getLeaf("tab");
    const tfile = this.vaultAdapter.toTFile(createdFile);
    await leaf.openFile(tfile);

    this.app.workspace.setActiveLeaf(leaf, { focus: true });

    const maxAttempts = 20;
    for (let i = 0; i < maxAttempts; i++) {
      if (this.app.workspace.getActiveFile()?.path === tfile.path) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    new Notice(`Task created: ${createdFile.basename}`);
  }
}
