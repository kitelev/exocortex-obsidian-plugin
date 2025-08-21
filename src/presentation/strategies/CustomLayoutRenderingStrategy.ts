import { Result } from '../../domain/core/Result';
import { ClassLayout } from '../../domain/entities/ClassLayout';
import { ILayoutRenderingStrategy, LayoutRenderingContext } from './ILayoutRenderingStrategy';
import { IBlockRendererFactory, BlockRenderingContext } from '../factories/IBlockRendererFactory';

export class CustomLayoutRenderingStrategy implements ILayoutRenderingStrategy {
    constructor(
        private readonly blockRendererFactory: IBlockRendererFactory
    ) {}

    canHandle(layout: ClassLayout | null): boolean {
        return layout !== null && layout !== undefined;
    }

    async render(context: LayoutRenderingContext, layout?: ClassLayout): Promise<Result<void>> {
        if (!layout) {
            return Result.fail('Layout is required for custom rendering strategy');
        }

        if (!context.container) {
            return Result.fail('Container is required for rendering');
        }

        if (!context.metadata?.frontmatter) {
            this.renderError(context.container, 'No metadata available for this file');
            return Result.fail('No metadata available');
        }

        try {
            // Add layout info (hidden metadata)
            this.addLayoutInfo(context.container, layout);

            // Render each visible block
            const visibleBlocks = layout.getVisibleBlocks();
            
            for (const block of visibleBlocks) {
                const blockResult = await this.renderBlock(context, block, layout);
                if (blockResult.isFailure) {
                    console.error(`Failed to render block ${block.id}:`, blockResult.error);
                    // Continue with other blocks rather than failing completely
                }
            }

            return Result.ok();
        } catch (error) {
            return Result.fail(`Custom layout rendering failed: ${error}`);
        }
    }

    private addLayoutInfo(container: HTMLElement, layout: ClassLayout): void {
        const layoutInfo = document.createElement('div');
        layoutInfo.className = 'exocortex-layout-info';
        layoutInfo.style.display = 'none';
        layoutInfo.setAttribute('data-layout-id', layout.id.toString());
        layoutInfo.setAttribute('data-layout-class', layout.targetClass.value);
        container.appendChild(layoutInfo);
    }

    private async renderBlock(
        context: LayoutRenderingContext,
        block: any,
        layout: ClassLayout
    ): Promise<Result<void>> {
        try {
            // Create block container structure
            const blockContainer = document.createElement('div');
            blockContainer.className = `exocortex-block exocortex-block-${block.type}`;
            blockContainer.setAttribute('data-block-id', block.id);
            context.container.appendChild(blockContainer);
            
            // Add block header if title exists
            if (block.title) {
                const header = document.createElement('h3');
                header.textContent = block.title;
                header.className = 'exocortex-block-header';
                blockContainer.appendChild(header);
                
                // Add collapse toggle if collapsible
                if (block.isCollapsible) {
                    header.classList.add('is-collapsible');
                    header.addEventListener('click', () => {
                        blockContainer.classList.toggle('is-collapsed', !blockContainer.classList.contains('is-collapsed'));
                    });
                }
            }

            // Create content container
            const contentContainer = document.createElement('div');
            contentContainer.className = 'exocortex-block-content';
            blockContainer.appendChild(contentContainer);
            
            // Get appropriate renderer for block type
            const rendererResult = this.blockRendererFactory.createRenderer(block.type);
            if (rendererResult.isFailure) {
                return this.renderBlockError(contentContainer, `Unknown block type: ${block.type}`);
            }

            const renderer = rendererResult.getValue();
            
            // Create block rendering context
            const blockContext: BlockRenderingContext = {
                container: contentContainer,
                config: block.config,
                file: context.file,
                frontmatter: context.metadata.frontmatter,
                dataviewApi: context.dataviewApi
            };

            // Render block content
            const renderResult = await renderer.render(blockContext);
            if (renderResult.isFailure) {
                return this.renderBlockError(contentContainer, `Error rendering block: ${renderResult.error}`);
            }

            return Result.ok();

        } catch (error) {
            return Result.fail(`Block rendering failed: ${error}`);
        }
    }

    private renderError(container: HTMLElement, error: string): void {
        const errorDiv = document.createElement('div');
        errorDiv.textContent = `Layout Error: ${error}`;
        errorDiv.className = 'exocortex-error notice-error';
        container.appendChild(errorDiv);
    }

    private renderBlockError(container: HTMLElement, error: string): Result<void> {
        const errorP = document.createElement('p');
        errorP.textContent = error;
        errorP.className = 'exocortex-error';
        container.appendChild(errorP);
        return Result.ok(); // Return ok since we handled the error gracefully
    }
}