import { MarkdownPostProcessorContext } from "obsidian";
import { UniversalLayoutRenderer } from "./UniversalLayoutRenderer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ObsidianApp = any;

/**
 * DynamicLayoutRenderer - Now equivalent to UniversalLayout
 * Simplified to remove ClassLayout configuration logic
 */
export class DynamicLayoutRenderer extends UniversalLayoutRenderer {
  constructor(app: ObsidianApp) {
    super(app);
  }

  /**
   * Render method - delegates to UniversalLayout
   */
  async render(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ): Promise<void> {
    await super.render(source, el, ctx);
  }
}
