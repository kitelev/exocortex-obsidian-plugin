import { App, PluginSettingTab, Setting } from "obsidian";
import type ExocortexPlugin from "../../ExocortexPlugin";

export class ExocortexSettingTab extends PluginSettingTab {
  plugin: ExocortexPlugin;

  constructor(app: App, plugin: ExocortexPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h2", { text: "Exocortex Settings" });

    new Setting(containerEl)
      .setName("Show Layout")
      .setDesc("Display the automatic layout below metadata in reading mode")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.layoutVisible)
          .onChange(async (value) => {
            this.plugin.settings.layoutVisible = value;
            await this.plugin.saveSettings();
            this.plugin.refreshLayout();
          }),
      );

    new Setting(containerEl)
      .setName("Show Properties Section")
      .setDesc("Display the properties table in the layout")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showPropertiesSection)
          .onChange(async (value) => {
            this.plugin.settings.showPropertiesSection = value;
            await this.plugin.saveSettings();
            this.plugin.refreshLayout();
          }),
      );
  }
}
