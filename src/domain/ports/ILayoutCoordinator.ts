import { Result } from '../core/Result';
import { ClassLayout } from '../entities/ClassLayout';
import { BlockRenderResult, RenderContext } from './IBlockRenderer';

export interface LayoutRenderResult {
    readonly layoutId: string;
    readonly blocksRendered: BlockRenderResult[];
    readonly totalRenderTime: number;
    readonly fallbackUsed: boolean;
}

export interface ILayoutCoordinator {
    coordinateLayout(
        layout: ClassLayout,
        context: RenderContext
    ): Promise<Result<LayoutRenderResult>>;

    coordinateDefaultLayout(
        context: RenderContext
    ): Promise<Result<LayoutRenderResult>>;
}