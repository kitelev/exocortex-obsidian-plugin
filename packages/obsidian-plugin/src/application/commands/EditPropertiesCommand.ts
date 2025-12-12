import { App, TFile, Notice } from "obsidian";
import { ICommand } from "./ICommand";
import type ExocortexPlugin from "../../ExocortexPlugin";
import { PropertyEditorModal } from "../../presentation/modals/PropertyEditorModal";
import type { CommandVisibilityContext } from "@exocortex/core";

export class EditPropertiesCommand implements ICommand {
  id = "edit-properties";
  name = "edit properties";

  constructor(
    private app: App,
    private plugin: ExocortexPlugin,
  ) {}

  checkCallback = (
    checking: boolean,
    file: TFile,
    _context: CommandVisibilityContext | null,
  ): boolean | void => {
    const cache = this.app.metadataCache.getFileCache(file);
    const hasFrontmatter = cache?.frontmatter !== undefined;

    if (checking) {
      return hasFrontmatter;
    }

    if (hasFrontmatter && cache?.frontmatter) {
      const modal = new PropertyEditorModal(
        this.app,
        this.plugin,
        file,
        cache.frontmatter as Record<string, unknown>,
      );
      modal.open();
    } else {
      new Notice("This file has no frontmatter properties to edit");
    }
  };
}
