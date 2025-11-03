import { App, PluginSettingTab, Setting } from "obsidian";
import type ExocortexPlugin from "../../ExocortexPlugin";

export class ExocortexSettingTab extends PluginSettingTab {
  plugin: ExocortexPlugin;

  constructor(app: App, plugin: ExocortexPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  private getOntologyAssets(): Array<{ path: string; basename: string }> {
    const files = this.app.vault.getMarkdownFiles();
    const ontologyAssets: Array<{ path: string; basename: string }> = [];

    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      const frontmatter = cache?.frontmatter;

      if (!frontmatter) continue;

      // Check if file has exo__Instance_class containing exo__Ontology
      const instanceClass = frontmatter.exo__Instance_class;
      if (!instanceClass) continue;

      const classArray = Array.isArray(instanceClass)
        ? instanceClass
        : [instanceClass];

      const hasOntologyClass = classArray.some(
        (cls: string) =>
          cls === "exo__Ontology" ||
          cls === '"[[exo__Ontology]]"' ||
          cls === "[[exo__Ontology]]",
      );

      if (hasOntologyClass) {
        ontologyAssets.push({
          path: file.path,
          basename: file.basename,
        });
      }
    }

    return ontologyAssets.sort((a, b) => a.basename.localeCompare(b.basename));
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Default ontology asset")
      .setDesc("Select the ontology asset (exo__Ontology class) to use as isDefinedBy for created events")
      .addDropdown((dropdown) => {
        // Get all files with exo__Ontology class
        const ontologyAssets = this.getOntologyAssets();
        
        dropdown.addOption("", "None (use Events folder)");
        
        ontologyAssets.forEach((asset) => {
          dropdown.addOption(asset.basename, asset.basename);
        });
        
        dropdown
          .setValue(this.plugin.settings.defaultOntologyAsset || "")
          .onChange(async (value) => {
            this.plugin.settings.defaultOntologyAsset = value || null;
            await this.plugin.saveSettings();
          });
      });

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
      .setDesc(
        "Display archived assets in relations table with visual distinction",
      )
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
