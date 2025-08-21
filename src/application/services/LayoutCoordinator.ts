import { Result } from '../../domain/core/Result';
import { ClassLayout } from '../../domain/entities/ClassLayout';
import { LayoutBlock } from '../../domain/entities/LayoutBlock';
import { 
    ILayoutCoordinator,
    LayoutRenderResult 
} from '../../domain/ports/ILayoutCoordinator';
import { 
    RenderContext, 
    BlockRenderResult 
} from '../../domain/ports/IBlockRenderer';
import { 
    IDOMRenderer,
    IContainerFactory 
} from '../../domain/ports/IDOMRenderer';
import { BlockRenderingService } from './BlockRenderingService';

export class LayoutCoordinator implements ILayoutCoordinator {
    constructor(
        private blockRenderingService: BlockRenderingService,
        private domRenderer: IDOMRenderer,
        private containerFactory: IContainerFactory
    ) {}

    async coordinateLayout(
        layout: ClassLayout,
        context: RenderContext
    ): Promise<Result<LayoutRenderResult>> {
        const startTime = performance.now();
        const blocksRendered: BlockRenderResult[] = [];

        try {
            // Add layout info container (hidden)
            const layoutInfo = this.domRenderer.createElement('div', {
                className: 'exocortex-layout-info',
                attributes: {
                    'data-layout-id': layout.id.toString(),
                    'data-layout-class': layout.targetClass.value,
                    'style': 'display: none'
                }
            });

            const attachResult = this.domRenderer.attachToContainer(context.containerId, layoutInfo);
            if (attachResult.isFailure) {
                return Result.fail(`Failed to attach layout info: ${attachResult.error}`);
            }

            // Render each visible block
            const visibleBlocks = layout.getVisibleBlocks()
                .map(blockConfig => LayoutBlock.create({
                    id: blockConfig.id,
                    type: blockConfig.type,
                    title: blockConfig.title,
                    order: blockConfig.order,
                    config: blockConfig.config as any, // Cast to handle union type
                    isVisible: blockConfig.isVisible,
                    isCollapsible: blockConfig.isCollapsible,
                    isCollapsed: blockConfig.isCollapsed
                }))
                .filter(result => result.isSuccess)
                .map(result => result.getValue());

            for (const block of visibleBlocks) {
                const blockResult = await this.renderBlock(block, context);
                
                if (blockResult.isSuccess) {
                    blocksRendered.push(blockResult.getValue());
                } else {
                    // Log error but continue with other blocks
                    blocksRendered.push({
                        blockId: block.id,
                        renderTime: 0,
                        success: false,
                        error: blockResult.error
                    });
                }
            }

            return Result.ok({
                layoutId: layout.id.toString(),
                blocksRendered,
                totalRenderTime: performance.now() - startTime,
                fallbackUsed: false
            });

        } catch (error) {
            return Result.fail(`Layout coordination failed: ${error}`);
        }
    }

    async coordinateDefaultLayout(
        context: RenderContext
    ): Promise<Result<LayoutRenderResult>> {
        const startTime = performance.now();
        const blocksRendered: BlockRenderResult[] = [];

        try {
            // Create default blocks
            const defaultBlocks = this.createDefaultBlocks();

            for (const block of defaultBlocks) {
                const blockResult = await this.renderBlock(block, context);
                
                if (blockResult.isSuccess) {
                    blocksRendered.push(blockResult.getValue());
                } else {
                    blocksRendered.push({
                        blockId: block.id,
                        renderTime: 0,
                        success: false,
                        error: blockResult.error
                    });
                }
            }

            return Result.ok({
                layoutId: 'default',
                blocksRendered,
                totalRenderTime: performance.now() - startTime,
                fallbackUsed: true
            });

        } catch (error) {
            return Result.fail(`Default layout coordination failed: ${error}`);
        }
    }

    private async renderBlock(
        block: LayoutBlock,
        context: RenderContext
    ): Promise<Result<BlockRenderResult>> {
        try {
            // Create block container structure
            const blockContainer = this.containerFactory.createBlockContainer(block.type, block.id);
            
            // Add header if title exists
            if (block.title) {
                const header = this.containerFactory.createHeaderContainer(block.title, block.isCollapsible);
                
                if (block.isCollapsible) {
                    header.addEventListener('click', () => {
                        blockContainer.toggleClass('is-collapsed', !blockContainer.hasClass('is-collapsed'));
                    });
                }
                
                blockContainer.appendChild(header);
            }

            // Create content container
            const contentContainer = this.containerFactory.createContentContainer();
            blockContainer.appendChild(contentContainer);

            // Attach to main container
            const attachResult = this.domRenderer.attachToContainer(context.containerId, blockContainer);
            if (attachResult.isFailure) {
                return Result.fail(`Failed to attach block container: ${attachResult.error}`);
            }

            // Update context for content rendering
            const contentContext: RenderContext = {
                ...context,
                containerId: context.containerId // Content will be rendered inside contentContainer
            };

            // Render block content using strategy pattern
            return await this.blockRenderingService.renderBlock(block, contentContext);

        } catch (error) {
            return Result.fail(`Block rendering failed: ${error}`);
        }
    }

    private createDefaultBlocks(): LayoutBlock[] {
        const blocks: Array<{ result: Result<LayoutBlock> }> = [
            { 
                result: LayoutBlock.create({
                    id: 'default-dynamic-backlinks',
                    type: 'dynamic-backlinks',
                    title: '🔗 Property-based Backlinks',
                    order: 1,
                    config: { 
                        type: 'dynamic-backlinks',
                        excludeProperties: ['exo__Asset_id', 'exo__Instance_class'],
                        showEmptyProperties: false
                    },
                    isVisible: true
                })
            }
        ];

        return blocks
            .filter(({ result }) => result.isSuccess)
            .map(({ result }) => result.getValue());
    }
}