import { Plugin } from "obsidian";
import { UniversalLayoutRenderer } from "./presentation/renderers/UniversalLayoutRenderer";
import { DynamicLayoutRenderer } from "./presentation/renderers/DynamicLayoutRenderer";
import { ILogger } from "./infrastructure/logging/ILogger";
import { LoggerFactory } from "./infrastructure/logging/LoggerFactory";

/**
 * Simplified Exocortex Plugin - UniversalLayout and DynamicLayout only
 */
export default class ExocortexPlugin extends Plugin {
  private logger: ILogger;
  private universalLayoutRenderer: UniversalLayoutRenderer;
  private dynamicLayoutRenderer: DynamicLayoutRenderer;

  async onload(): Promise<void> {
    try {
      // Initialize logger first
      this.logger = LoggerFactory.create("ExocortexPlugin");
      this.logger.info("Loading Exocortex Plugin - Simplified version");

      // Initialize renderers
      this.universalLayoutRenderer = new UniversalLayoutRenderer(this.app);
      this.dynamicLayoutRenderer = new DynamicLayoutRenderer(this.app);

      // Register the markdown code block processor for UniversalLayout
      this.registerMarkdownCodeBlockProcessor(
        "exocortex",
        async (source, el, ctx) => {
          // Parse the source to determine the view type
          const viewType = this.parseViewType(source);

          if (viewType === "DynamicLayout") {
            await this.dynamicLayoutRenderer.render(source, el, ctx);
          } else {
            // Default to UniversalLayout
            await this.universalLayoutRenderer.render(source, el, ctx);
          }
        },
      );

      this.logger.info("Exocortex Plugin loaded successfully", {
        renderers: ["UniversalLayout", "DynamicLayout"],
      });
    } catch (error) {
      this.logger?.error(
        "Failed to load Exocortex Plugin",
        error as Error,
      );
      throw error;
    }
  }

  async onunload(): Promise<void> {
    this.logger?.info("Exocortex Plugin unloaded");
  }

  /**
   * Parse the view type from the source
   */
  private parseViewType(source: string): string {
    const lines = source.trim().split("\n");
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine === "DynamicLayout") {
        return "DynamicLayout";
      }
    }
    return "UniversalLayout";
  }
}
