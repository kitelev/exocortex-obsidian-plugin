import { MarkdownPostProcessorContext } from "obsidian";
import { UniversalLayoutRenderer } from "./UniversalLayoutRenderer";

/**
 * DynamicLayoutRenderer - Now equivalent to UniversalLayout
 * Simplified to remove ClassLayout configuration logic
 */
export class DynamicLayoutRenderer extends UniversalLayoutRenderer {
  constructor(app: any) {
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
