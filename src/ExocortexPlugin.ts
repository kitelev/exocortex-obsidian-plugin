import { Plugin } from "obsidian";
import { UniversalLayoutRenderer } from "./presentation/renderers/UniversalLayoutRenderer";
import { DynamicLayoutRenderer } from "./presentation/renderers/DynamicLayoutRenderer";
import { ILogger } from "./infrastructure/logging/ILogger";
import { LoggerFactory } from "./infrastructure/logging/LoggerFactory";

/**
 * Simplified Exocortex Plugin - Layout rendering only
 * Both UniversalLayout and DynamicLayout now behave identically
 */
export default class ExocortexPlugin extends Plugin {
  private logger: ILogger;
  private universalLayoutRenderer: UniversalLayoutRenderer;
  private dynamicLayoutRenderer: DynamicLayoutRenderer;

  async onload(): Promise<void> {
    try {
      this.logger = LoggerFactory.create("ExocortexPlugin");
      this.logger.info("Loading Exocortex Plugin - Layout rendering only");

      this.universalLayoutRenderer = new UniversalLayoutRenderer(this.app);
      this.dynamicLayoutRenderer = new DynamicLayoutRenderer(this.app);

      this.registerEvent(
        this.app.metadataCache.on("resolved", () => {
          this.universalLayoutRenderer.invalidateBacklinksCache();
        }),
      );

      this.registerMarkdownCodeBlockProcessor(
        "exocortex",
        async (source, el, ctx) => {
          const viewType = this.parseViewType(source);

          if (viewType === "DynamicLayout") {
            await this.dynamicLayoutRenderer.render(source, el, ctx);
          } else {
            await this.universalLayoutRenderer.render(source, el, ctx);
          }
        },
      );

      this.logger.info("Exocortex Plugin loaded successfully");
    } catch (error) {
      this.logger?.error("Failed to load Exocortex Plugin", error as Error);
      throw error;
    }
  }

  async onunload(): Promise<void> {
    this.logger?.info("Exocortex Plugin unloaded");
  }

  private parseViewType(source: string): string {
    const lines = source.trim().split("\n");
    if (lines.length > 0 && lines[0].trim() === "DynamicLayout") {
      return "DynamicLayout";
    }
    return "UniversalLayout";
  }
}
