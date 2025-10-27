import { App, TFile } from "obsidian";
import { ExocortexPluginInterface } from "../../types";
import { CommandRegistry } from "../commands/CommandRegistry";
import { MetadataExtractor } from "@exocortex/core";
import { ObsidianVaultAdapter } from "../../adapters/ObsidianVaultAdapter";
import { CommandVisibilityContext } from "@exocortex/core";

export class CommandManager {
  private commandRegistry: CommandRegistry;
  private metadataExtractor: MetadataExtractor;
  private vaultAdapter: ObsidianVaultAdapter;

  constructor(private app: App) {
    this.vaultAdapter = new ObsidianVaultAdapter(
      app.vault,
      app.metadataCache,
      app,
    );
    this.metadataExtractor = new MetadataExtractor(this.vaultAdapter);
    this.commandRegistry = new CommandRegistry(app, {} as ExocortexPluginInterface);
  }

  registerAllCommands(
    plugin: ExocortexPluginInterface,
    reloadLayoutCallback?: () => void,
  ): void {
    this.commandRegistry = new CommandRegistry(this.app, plugin, reloadLayoutCallback);

    const commands = this.commandRegistry.getAllCommands();

    for (const command of commands) {
      if (command.checkCallback) {
        plugin.addCommand({
          id: command.id,
          name: command.name,
          checkCallback: (checking: boolean) => {
            const file = this.app.workspace.getActiveFile();
            if (!file) return false;

            const context = this.getContext(file);
            return command.checkCallback!(checking, file, context);
          },
        });
      } else if (command.callback) {
        plugin.addCommand({
          id: command.id,
          name: command.name,
          callback: command.callback,
        });
      }
    }
  }

  private getContext(file: TFile): CommandVisibilityContext | null {
    const context = this.metadataExtractor.extractCommandVisibilityContext(file);

    return {
      ...context,
      expectedFolder: null,
    };
  }
}
