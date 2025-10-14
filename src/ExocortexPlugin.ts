import {
  App,
  MarkdownPostProcessorContext,
  Plugin,
} from "obsidian";
import { UniversalLayoutRenderer } from "./presentation/renderers/UniversalLayoutRenderer";
import { ILogger } from "./infrastructure/logging/ILogger";
import { LoggerFactory } from "./infrastructure/logging/LoggerFactory";
import { CommandManager } from "./application/services/CommandManager";

/**
 * Exocortex Plugin - Automatic layout rendering
 * Automatically displays related assets table in all notes (below metadata in reading mode)
 * Provides Command Palette integration for all asset commands
 */
export default class ExocortexPlugin extends Plugin {
  private logger: ILogger;
  private layoutRenderer: UniversalLayoutRenderer;
  private commandManager: CommandManager;

  async onload(): Promise<void> {
    try {
      this.logger = LoggerFactory.create("ExocortexPlugin");
      this.logger.info("Loading Exocortex Plugin");

      this.layoutRenderer = new UniversalLayoutRenderer(this.app);

      // Initialize CommandManager and register all commands
      this.commandManager = new CommandManager(this.app);
      this.commandManager.registerAllCommands(
        this,
        () => this.autoRenderLayout(),
      );

      this.registerEvent(
        this.app.metadataCache.on("resolved", () => {
          this.layoutRenderer.invalidateBacklinksCache();
        }),
      );

      // AutoLayout: Automatic rendering on file open
      this.registerEvent(
        this.app.workspace.on("file-open", (file) => {
          if (file) {
            setTimeout(() => this.autoRenderLayout(), 100);
          }
        }),
      );

      this.registerEvent(
        this.app.workspace.on("active-leaf-change", () => {
          setTimeout(() => this.autoRenderLayout(), 100);
        }),
      );

      this.registerEvent(
        this.app.workspace.on("layout-change", () => {
          setTimeout(() => this.autoRenderLayout(), 100);
        }),
      );

      // Initial render
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile) {
        setTimeout(() => this.autoRenderLayout(), 100);
      }

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

    // Insert after metadata container using insertAdjacentElement
    // This ensures it always goes right after the metadata, not before
    metadataContainer.insertAdjacentElement("afterend", layoutContainer);

    // Render layout
    this.layoutRenderer
      .render("", layoutContainer, {} as MarkdownPostProcessorContext)
      .catch((error) => {
        this.logger.error("Failed to auto-render layout", error);
      });
  }

  private removeAutoRenderedLayouts(): void {
    document
      .querySelectorAll(".exocortex-auto-layout")
      .forEach((el) => el.remove());
  }
}
