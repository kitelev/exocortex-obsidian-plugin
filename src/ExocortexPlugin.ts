import {
  App,
  MarkdownPostProcessorContext,
  Plugin,
  PluginSettingTab,
  Setting,
} from "obsidian";
import { UniversalLayoutRenderer } from "./presentation/renderers/UniversalLayoutRenderer";
import { ILogger } from "./infrastructure/logging/ILogger";
import { LoggerFactory } from "./infrastructure/logging/LoggerFactory";

interface ExocortexSettings {
  autoRenderEnabled: boolean;
}

const DEFAULT_SETTINGS: ExocortexSettings = {
  autoRenderEnabled: false,
};

/**
 * Exocortex Plugin - Simple layout rendering
 * Supports both code-block injection and automatic rendering
 */
export default class ExocortexPlugin extends Plugin {
  private logger: ILogger;
  private layoutRenderer: UniversalLayoutRenderer;
  settings: ExocortexSettings;

  async onload(): Promise<void> {
    try {
      this.logger = LoggerFactory.create("ExocortexPlugin");
      this.logger.info("Loading Exocortex Plugin");

      await this.loadSettings();

      this.layoutRenderer = new UniversalLayoutRenderer(this.app);

      this.registerEvent(
        this.app.metadataCache.on("resolved", () => {
          this.layoutRenderer.invalidateBacklinksCache();
        }),
      );

      // Code-block processor (always enabled)
      this.registerMarkdownCodeBlockProcessor(
        "exocortex",
        async (source, el, ctx) => {
          await this.layoutRenderer.render(source, el, ctx);
        },
      );

      // Auto-render on file open (optional)
      if (this.settings.autoRenderEnabled) {
        this.registerEvent(
          this.app.workspace.on("file-open", (file) => {
            if (file) {
              this.autoRenderLayout();
            }
          }),
        );

        this.registerEvent(
          this.app.workspace.on("active-leaf-change", () => {
            if (this.settings.autoRenderEnabled) {
              this.autoRenderLayout();
            }
          }),
        );

        // Initial render
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
          setTimeout(() => this.autoRenderLayout(), 100);
        }
      }

      this.addSettingTab(new ExocortexSettingTab(this.app, this));

      this.logger.info("Exocortex Plugin loaded successfully");
    } catch (error) {
      this.logger?.error("Failed to load Exocortex Plugin", error as Error);
      throw error;
    }
  }

  async onunload(): Promise<void> {
    this.removeAutoRenderedLayouts();
    this.logger?.info("Exocortex Plugin unloaded");
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private autoRenderLayout(): void {
    // Remove existing auto-rendered layouts
    this.removeAutoRenderedLayouts();

    // Only render in preview mode, not in source mode
    const previewContainers = document.querySelectorAll(
      ".markdown-preview-view",
    );
    if (previewContainers.length === 0) {
      return;
    }

    // Use the last preview container (active file)
    const previewContainer = previewContainers[
      previewContainers.length - 1
    ] as HTMLElement;

    // Find metadata container within this preview
    const metadataContainer = previewContainer.querySelector(
      ".metadata-container",
    ) as HTMLElement;

    if (!metadataContainer) {
      return;
    }

    // Create layout container
    const layoutContainer = document.createElement("div");
    layoutContainer.className = "exocortex-auto-layout";
    layoutContainer.style.cssText = `
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--background-modifier-border);
    `;

    // Insert after metadata container within the same preview container
    if (metadataContainer.parentElement) {
      metadataContainer.parentElement.insertBefore(
        layoutContainer,
        metadataContainer.nextSibling,
      );

      // Render layout
      this.layoutRenderer
        .render("", layoutContainer, {} as MarkdownPostProcessorContext)
        .catch((error) => {
          this.logger.error("Failed to auto-render layout", error);
        });
    }
  }

  private removeAutoRenderedLayouts(): void {
    document
      .querySelectorAll(".exocortex-auto-layout")
      .forEach((el) => el.remove());
  }
}

class ExocortexSettingTab extends PluginSettingTab {
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
      .setName("Auto-render layout")
      .setDesc(
        "Automatically display related assets table in all notes (below metadata). Requires reload.",
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoRenderEnabled)
          .onChange(async (value) => {
            this.plugin.settings.autoRenderEnabled = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}
