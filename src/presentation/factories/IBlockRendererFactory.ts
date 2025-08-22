import { BlockType } from "../../domain/entities/LayoutBlock";
import { Result } from "../../domain/core/Result";

export interface BlockRenderingContext {
  readonly container: HTMLElement;
  readonly config: Record<string, any>;
  readonly file: any;
  readonly frontmatter: Record<string, any>;
  readonly dataviewApi?: any;
}

export interface IBlockRenderer {
  render(context: BlockRenderingContext): Promise<Result<void>>;
}

export interface IBlockRendererFactory {
  createRenderer(blockType: BlockType): Result<IBlockRenderer>;
  getSupportedBlockTypes(): BlockType[];
}
