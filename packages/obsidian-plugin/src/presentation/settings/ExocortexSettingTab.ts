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

    new Setting(containerEl)
      .setName("Show layout")
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
      .setName("Show properties section")
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

    new Setting(containerEl)
      .setName("Show archived assets")
      .setDesc("Display archived assets in relations table with visual distinction")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showArchivedAssets)
          .onChange(async (value) => {
            this.plugin.settings.showArchivedAssets = value;
            await this.plugin.saveSettings();
            this.plugin.refreshLayout();
          }),
      );
  }
}
