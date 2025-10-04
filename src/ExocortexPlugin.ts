import { Plugin } from "obsidian";
import { UniversalLayoutRenderer } from "./presentation/renderers/UniversalLayoutRenderer";
import { ILogger } from "./infrastructure/logging/ILogger";
import { LoggerFactory } from "./infrastructure/logging/LoggerFactory";

/**
 * Exocortex Plugin - Simple layout rendering
 * Any code-block with type "exocortex" renders the layout
 */
export default class ExocortexPlugin extends Plugin {
  private logger: ILogger;
  private layoutRenderer: UniversalLayoutRenderer;

  async onload(): Promise<void> {
    try {
      this.logger = LoggerFactory.create("ExocortexPlugin");
      this.logger.info("Loading Exocortex Plugin");

      this.layoutRenderer = new UniversalLayoutRenderer(this.app);

      this.registerEvent(
        this.app.metadataCache.on("resolved", () => {
          this.layoutRenderer.invalidateBacklinksCache();
        }),
      );

      this.registerMarkdownCodeBlockProcessor(
        "exocortex",
        async (source, el, ctx) => {
          await this.layoutRenderer.render(source, el, ctx);
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
}
