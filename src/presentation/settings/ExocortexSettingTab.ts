import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import {
  ExocortexSettings,
  ExocortexSettingsData,
} from "../../domain/entities/ExocortexSettings";
import ExocortexPlugin from "../../main";

/**
 * Exocortex Settings Tab - Simplified Version
 * Provides only essential debug and reset options for the plugin
 */
export class ExocortexSettingTab extends PluginSettingTab {
  plugin: ExocortexPlugin;
  private settings: ExocortexSettings;

  constructor(app: App, plugin: ExocortexPlugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.settings = plugin.settings;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Header
    containerEl.createEl("h1", { text: "Exocortex Settings" });
    containerEl.createEl("p", {
      text: "Essential settings for the Exocortex plugin.",
      cls: "setting-item-description",
    });

    // Debug Section
    this.addDebugSection(containerEl);

    // Reset Section
    this.addResetSection(containerEl);
  }

  private addDebugSection(containerEl: HTMLElement): void {
    containerEl.createEl("h2", { text: "Debug Settings" });
    containerEl.createEl("p", {
      text: "Debug options for troubleshooting plugin issues.",
      cls: "setting-item-description",
    });

    new Setting(containerEl)
      .setName("Enable debug mode")
      .setDesc("Enable extended logging and debug features")
      .addToggle((toggle) =>
        toggle
          .setValue(this.settings.get("enableDebugMode"))
          .onChange(async (value) => {
            await this.updateSetting("enableDebugMode", value);
          }),
      );

    new Setting(containerEl)
      .setName("Enable performance tracking")
      .setDesc("Track and log performance metrics")
      .addToggle((toggle) =>
        toggle
          .setValue(this.settings.get("enablePerformanceMetrics"))
          .onChange(async (value) => {
            await this.updateSetting("enablePerformanceMetrics", value);
          }),
      );

    new Setting(containerEl)
      .setName("Show console logs")
      .setDesc("Display detailed logs in the developer console")
      .addToggle((toggle) =>
        toggle
          .setValue(this.settings.get("enableVerboseLogging"))
          .onChange(async (value) => {
            await this.updateSetting("enableVerboseLogging", value);
          }),
      );
  }

  private addResetSection(containerEl: HTMLElement): void {
    containerEl.createEl("h2", { text: "Reset Settings" });
    
    const warningEl = containerEl.createEl("p", {
      text: "⚠️ Warning: Resetting will restore all settings to their default values. This action cannot be undone.",
      cls: "setting-item-description mod-warning",
    });
    warningEl.style.color = "var(--text-error)";

    new Setting(containerEl)
      .setName("Reset to defaults")
      .setDesc("Reset all plugin settings to their default values")
      .addButton((button) =>
        button
          .setButtonText("Reset to Defaults")
          .setWarning()
          .onClick(async () => {
            const confirmed = await this.confirmReset();
            if (confirmed) {
              await this.resetAllSettings();
            }
          }),
      );
  }

  private async updateSetting<K extends keyof ExocortexSettingsData>(
    key: K,
    value: ExocortexSettingsData[K],
  ): Promise<void> {
    const result = this.settings.set(key, value);

    if (result.isFailure) {
      new Notice(`Settings error: ${result.getError()}`);
      return;
    }

    await this.plugin.saveSettings();

    // Trigger settings update in DI container
    if (this.plugin.updateContainer) {
      this.plugin.updateContainer();
    }
  }

  private async confirmReset(): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = document.createElement("div");
      modal.className = "modal";
      modal.innerHTML = `
                <div class="modal-bg"></div>
                <div class="modal-content">
                    <div class="modal-title">Reset Settings</div>
                    <div class="modal-text">
                        Are you sure you want to reset all settings to their default values?
                        <br><br>
                        This will restore:
                        <ul>
                            <li>Debug mode (disabled)</li>
                            <li>Performance tracking (disabled)</li>
                            <li>Console logging (disabled)</li>
                        </ul>
                        <br>
                        This action cannot be undone.
                    </div>
                    <div class="modal-button-container">
                        <button class="mod-warning" id="confirm-reset">Reset to Defaults</button>
                        <button id="cancel-reset">Cancel</button>
                    </div>
                </div>
            `;

      document.body.appendChild(modal);

      const confirmBtn = modal.querySelector(
        "#confirm-reset",
      ) as HTMLButtonElement;
      const cancelBtn = modal.querySelector(
        "#cancel-reset",
      ) as HTMLButtonElement;
      const modalBg = modal.querySelector(".modal-bg") as HTMLElement;

      const cleanup = () => {
        document.body.removeChild(modal);
      };

      confirmBtn.onclick = () => {
        cleanup();
        resolve(true);
      };

      cancelBtn.onclick = () => {
        cleanup();
        resolve(false);
      };

      modalBg.onclick = () => {
        cleanup();
        resolve(false);
      };
    });
  }

  private async resetAllSettings(): Promise<void> {
    this.settings.resetToDefaults();
    await this.plugin.saveSettings();

    // Trigger settings update in DI container
    if (this.plugin.updateContainer) {
      this.plugin.updateContainer();
    }

    // Refresh the settings display
    this.display();

    new Notice("✅ All settings have been reset to defaults");
  }
}