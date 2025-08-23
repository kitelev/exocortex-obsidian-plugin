import { Plugin } from "obsidian";
import { SimpleCreateAssetModal } from "./presentation/modals/SimpleCreateAssetModal";
import { SimpleLayoutRenderer } from "./presentation/renderers/SimpleLayoutRenderer";

export default class ExocortexPlugin extends Plugin {
  layoutRenderer: SimpleLayoutRenderer;

  async onload() {
    // Initialize layout renderer
    this.layoutRenderer = new SimpleLayoutRenderer(this.app);
    
    // Register the layout processor
    this.registerMarkdownCodeBlockProcessor("layout", async (source, el, ctx) => {
      await this.layoutRenderer.render(source, el, ctx);
    });
    
    // Add command to create new asset
    this.addCommand({
      id: "create-asset",
      name: "Create new asset",
      callback: () => {
        new SimpleCreateAssetModal(this.app).open();
      },
    });
    
    console.log("Exocortex plugin loaded - Simplified version");
  }

  async onunload() {
    console.log("Exocortex plugin unloaded");
  }
}