import { App, TFile, Notice } from "obsidian";
import { ICommand } from "./ICommand";
import {
  CommandVisibilityContext,
  canCreateProject,
  ProjectCreationService,
  LoggingService,
} from "@exocortex/core";
import { LabelInputModal, type LabelInputModalResult } from "../../presentation/modals/LabelInputModal";
import { ObsidianVaultAdapter } from "../../adapters/ObsidianVaultAdapter";
import { CommandHelpers } from "./helpers/CommandHelpers";

export class CreateProjectCommand implements ICommand {
  id = "create-project";
  name = "Create project";

  constructor(
    private app: App,
    private projectCreationService: ProjectCreationService,
    private vaultAdapter: ObsidianVaultAdapter,
  ) {}

  checkCallback = (checking: boolean, file: TFile, context: CommandVisibilityContext | null): boolean => {
    if (!context || !canCreateProject(context)) return false;

    if (!checking) {
      this.execute(file, context).catch((error) => {
        new Notice(`Failed to create project: ${error.message}`);
        LoggingService.error("Create project error", error);
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
    const instanceClass = metadata.exo__Instance_class;

    const sourceClass = Array.isArray(instanceClass) ? instanceClass[0] : instanceClass;

    const createdFile = await this.projectCreationService.createProject(
      file,
      metadata,
      sourceClass,
      result.label,
    );

    const tfile = this.vaultAdapter.toTFile(createdFile);

    // Use lifecycle-managed polling for file activation
    await CommandHelpers.openFile(this.app, tfile, result.openInNewTab ?? false);

    new Notice(`Project created: ${createdFile.basename}`);
  }
}
