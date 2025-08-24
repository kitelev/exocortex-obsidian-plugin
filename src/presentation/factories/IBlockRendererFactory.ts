import { BlockType } from "../../domain/entities/LayoutBlock";
import { Result } from "../../domain/core/Result";
import {
  ConfigData,
  FrontmatterData,
  ObsidianFile,
  DataviewApi,
} from "../../types";

export interface BlockRenderingContext {
  readonly container: HTMLElement;
  readonly config: ConfigData;
  readonly file: ObsidianFile;
  readonly frontmatter: FrontmatterData;
  readonly dataviewApi?: DataviewApi;
}

export interface IBlockRenderer {
  render(context: BlockRenderingContext): Promise<Result<void>>;
}

export interface IBlockRendererFactory {
  createRenderer(blockType: BlockType): Result<IBlockRenderer>;
  getSupportedBlockTypes(): BlockType[];
}
