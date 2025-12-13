import { App, TFile, Notice } from "obsidian";
import { ICommand } from "./ICommand";
import {
  CommandVisibilityContext,
  canTrashEffort,
  TaskStatusService,
  LoggingService,
  IVaultAdapter,
} from "@exocortex/core";
import { TrashReasonModal, TrashReasonModalResult } from "@plugin/presentation/modals/TrashReasonModal";

export class TrashEffortCommand implements ICommand {
  id = "trash-effort";
  name = "Trash";

  constructor(
    private app: App,
    private taskStatusService: TaskStatusService,
    private vaultAdapter: IVaultAdapter,
  ) {}

  checkCallback = (checking: boolean, file: TFile, context: CommandVisibilityContext | null): boolean => {
    if (!context || !canTrashEffort(context)) return false;

    if (!checking) {
      void (async () => {
        try {
          await this.execute(file);
        } catch (error) {
          new Notice(`Failed to trash effort: ${error instanceof Error ? error.message : String(error)}`);
          LoggingService.error("Trash effort error", error instanceof Error ? error : undefined);
        }
      })();
    }

    return true;
  };

  private async execute(file: TFile): Promise<void> {
    // Show modal to get reason
    const result = await new Promise<TrashReasonModalResult>((resolve) => {
      new TrashReasonModal(this.app, resolve).open();
    });

    // If user cancelled, don't trash
    if (!result.confirmed) {
      return;
    }

    // Append reason to note body if provided
    if (result.reason) {
      await this.appendTrashReason(file, result.reason);
    }

    // Perform trash operation
    await this.taskStatusService.trashEffort(file);
    new Notice(`Trashed: ${file.basename}`);
  }

  /**
   * Appends trash reason to the note body under "## Trash Reason" header.
   * Adds the reason text on the line after the header.
   */
  private async appendTrashReason(file: TFile, reason: string): Promise<void> {
    const ifile = { path: file.path, basename: file.basename, name: file.name, parent: file.parent };
    const content = await this.vaultAdapter.read(ifile);

    const trashReasonSection = `\n\n## Trash Reason\n\n${reason}`;
    const updatedContent = content + trashReasonSection;

    await this.vaultAdapter.modify(ifile, updatedContent);
  }
}
