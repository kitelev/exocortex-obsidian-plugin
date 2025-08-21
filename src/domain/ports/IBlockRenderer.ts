import { Result } from '../core/Result';
import { BlockConfig } from '../entities/LayoutBlock';

export interface RenderContext {
    readonly containerId: string;
    readonly assetPath: string;
    readonly metadata: Record<string, any>;
    readonly frontmatter: Record<string, any>;
}

export interface BlockRenderResult {
    readonly blockId: string;
    readonly renderTime: number;
    readonly success: boolean;
    readonly error?: string;
}

export interface IBlockRenderer<TConfig extends BlockConfig = BlockConfig> {
    render(
        context: RenderContext,
        config: TConfig
    ): Promise<Result<BlockRenderResult>>;
}

export interface IBlockRenderStrategy {
    canHandle(blockType: string): boolean;
    render(
        context: RenderContext,
        config: BlockConfig
    ): Promise<Result<BlockRenderResult>>;
}