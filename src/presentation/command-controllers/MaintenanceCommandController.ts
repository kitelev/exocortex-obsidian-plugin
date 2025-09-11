import { Notice, Plugin } from "obsidian";
import { ICommandController } from "../../application/ports/ICommandController";
import ExocortexPlugin from "../../main";
import { StatusModal } from "../modals/StatusModal";

export class MaintenanceCommandController implements ICommandController {
  constructor(private readonly plugin: Plugin) {}

  async registerCommands(): Promise<void> {
    const exo = this.plugin as unknown as ExocortexPlugin;

    // Refresh rendered views
    this.plugin.addCommand({
      id: "exocortex-refresh-views",
      name: "Exocortex: Refresh Views",
      callback: async () => {
        try {
          await exo.refreshViews();
          new Notice("🔄 Exocortex views refreshed");
        } catch (e) {
          new Notice("Failed to refresh views");
        }
      },
    });

    // Toggle verbose logging on/off
    this.plugin.addCommand({
      id: "exocortex-toggle-debug-logging",
      name: "Exocortex: Toggle Debug Logging",
      callback: async () => {
        const current = exo.settings.get("enableVerboseLogging");
        const next = !current;
        const result = exo.settings.set("enableVerboseLogging", next);
        if (result.isFailure) {
          new Notice(`Settings error: ${result.getError()}`);
          return;
        }
        // Also enable debug mode when verbose logging is turned on
        if (next) {
          exo.settings.set("enableDebugMode", true);
        }
        await exo.saveSettings();
        exo.applyLoggingConfigFromSettings();
        new Notice(`🪵 Debug logging ${next ? "enabled" : "disabled"}`);
      },
    });

    // Show quick status modal
    this.plugin.addCommand({
      id: "exocortex-show-status",
      name: "Exocortex: Show Status",
      callback: async () => {
        const diagnostics = await exo.getDiagnostics();
        new StatusModal(this.plugin.app, diagnostics).open();
      },
    });
  }

  async cleanup(): Promise<void> {
    // No extra cleanup
  }

  getControllerId(): string {
    return "MaintenanceCommandController";
  }
}
