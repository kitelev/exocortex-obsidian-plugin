import { App, TFile, Notice } from "obsidian";
import { ICommand } from "./ICommand";
import {
  CommandVisibilityContext,
  canCreateChildArea,
  AreaCreationService,
  LoggingService,
} from "@exocortex/core";
import { LabelInputModal, type LabelInputModalResult } from "../../presentation/modals/LabelInputModal";
import { ObsidianVaultAdapter } from "../../adapters/ObsidianVaultAdapter";
import { CommandHelpers } from "./helpers/CommandHelpers";

export class CreateAreaCommand implements ICommand {
  id = "create-area";
  name = "Create area";

  constructor(
    private app: App,
    private areaCreationService: AreaCreationService,
    private vaultAdapter: ObsidianVaultAdapter,
  ) {}

  checkCallback = (checking: boolean, file: TFile, context: CommandVisibilityContext | null): boolean => {
    if (!context || !canCreateChildArea(context)) return false;

    if (!checking) {
      this.execute(file, context).catch((error) => {
        new Notice(`Failed to create area: ${error.message}`);
        LoggingService.error("Create area error", error);
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

    const createdFile = await this.areaCreationService.createChildArea(
      file,
      metadata,
      result.label,
    );

    const tfile = this.vaultAdapter.toTFile(createdFile);

    // Use lifecycle-managed polling for file activation
    await CommandHelpers.openFile(this.app, tfile, result.openInNewTab ?? false);

    new Notice(`Area created: ${createdFile.basename}`);
  }
}
