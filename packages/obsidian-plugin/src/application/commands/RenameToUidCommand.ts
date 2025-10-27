import { TFile, Notice } from "obsidian";
import { ICommand } from "./ICommand";
import {
  CommandVisibilityContext,
  canRenameToUid,
  RenameToUidService,
  LoggingService,
} from "@exocortex/core";

export class RenameToUidCommand implements ICommand {
  id = "rename-to-uid";
  name = "Rename to uid";

  constructor(private renameToUidService: RenameToUidService) {}

  checkCallback = (checking: boolean, file: TFile, context: CommandVisibilityContext | null): boolean => {
    if (!context || !canRenameToUid(context, file.basename)) return false;

    if (!checking) {
      this.execute(file, context.metadata).catch((error) => {
        new Notice(`Failed to rename: ${error.message}`);
        LoggingService.error("Rename to UID error", error);
      });
    }

    return true;
  };

  private async execute(file: TFile, metadata: Record<string, any>): Promise<void> {
    const oldName = file.basename;
    const uid = metadata.exo__Asset_uid;

    await this.renameToUidService.renameToUid(file, metadata);

    new Notice(`Renamed "${oldName}" to "${uid}"`);
  }
}
