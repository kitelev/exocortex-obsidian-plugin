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

    const leaf = result.openInNewTab
      ? this.app.workspace.getLeaf("tab")
      : this.app.workspace.getLeaf(false);
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

    new Notice(`Area created: ${createdFile.basename}`);
  }
}
