import { App } from "obsidian";
import { BlockType } from "../../domain/entities/LayoutBlock";
import { Result } from "../../domain/core/Result";
import {
  IBlockRendererFactory,
  IBlockRenderer,
  BlockRenderingContext,
} from "./IBlockRendererFactory";
import { DynamicBacklinksBlockRenderer } from "../renderers/DynamicBacklinksBlockRenderer";
import { ButtonsBlockRenderer } from "../renderers/ButtonsBlockRenderer";

// Adapter pattern to bridge old block renderers to new interface
class BlockRendererAdapter implements IBlockRenderer {
  constructor(
    private readonly legacyRenderer: any,
    private readonly blockType: BlockType,
  ) {}

  async render(context: BlockRenderingContext): Promise<Result<void>> {
    try {
      // Adapt new context to legacy renderer interface
      await this.legacyRenderer.render(
        context.container,
        context.config,
        context.file,
        context.frontmatter,
        context.dataviewApi,
      );
      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Block rendering failed for ${this.blockType}: ${error}`,
      );
    }
  }
}

export class BlockRendererFactory implements IBlockRendererFactory {
  private readonly renderers: Map<BlockType, any> = new Map();

  constructor(private readonly app: App) {
    // Initialize supported block renderers
    this.renderers.set(
      "dynamic-backlinks",
      new DynamicBacklinksBlockRenderer(app),
    );
    this.renderers.set("Buttons", new ButtonsBlockRenderer(app));
  }

  createRenderer(blockType: BlockType): Result<IBlockRenderer> {
    const legacyRenderer = this.renderers.get(blockType);

    if (!legacyRenderer) {
      return Result.fail(`No renderer found for block type: ${blockType}`);
    }

    // Wrap legacy renderer with adapter
    const adapter = new BlockRendererAdapter(legacyRenderer, blockType);
    return Result.ok(adapter);
  }

  getSupportedBlockTypes(): BlockType[] {
    return Array.from(this.renderers.keys());
  }

  // Allow runtime registration of custom renderers
  registerRenderer(blockType: BlockType, renderer: any): void {
    this.renderers.set(blockType, renderer);
  }

  // Remove renderer (useful for testing)
  unregisterRenderer(blockType: BlockType): boolean {
    return this.renderers.delete(blockType);
  }
}
