import { Result } from '../../domain/core/Result';
import { ClassLayout } from '../../domain/entities/ClassLayout';
import { ILayoutRenderingStrategy, LayoutRenderingContext } from './ILayoutRenderingStrategy';
import { IBlockRendererFactory, BlockRenderingContext } from '../factories/IBlockRendererFactory';

export class DefaultLayoutRenderingStrategy implements ILayoutRenderingStrategy {
    constructor(
        private readonly blockRendererFactory: IBlockRendererFactory
    ) {}

    canHandle(layout: ClassLayout | null): boolean {
        return layout === null || layout === undefined;
    }

    async render(context: LayoutRenderingContext): Promise<Result<void>> {
        if (!context.container) {
            return Result.fail('Container is required for rendering');
        }

        if (!context.metadata?.frontmatter) {
            return this.renderError(context.container, 'No metadata available for this file');
        }

        try {
            const frontmatter = context.metadata.frontmatter;
            
            // Render only dynamic backlinks in simplified system
            await this.renderDynamicBacklinksBlock(context);

            return Result.ok();

        } catch (error) {
            return Result.fail(`Default layout rendering failed: ${error}`);
        }
    }

    private async renderDynamicBacklinksBlock(context: LayoutRenderingContext): Promise<void> {
        const backlinksContainer = context.container.createDiv({ 
            cls: 'exocortex-block exocortex-block-dynamic-backlinks' 
        });
        const backlinksContent = backlinksContainer.createDiv({ cls: 'exocortex-block-content' });
        
        const rendererResult = this.blockRendererFactory.createRenderer('dynamic-backlinks');
        if (rendererResult.isSuccess) {
            const renderer = rendererResult.getValue();
            const blockContext: BlockRenderingContext = {
                container: backlinksContent,
                config: { 
                    type: 'dynamic-backlinks',
                    excludeProperties: ['exo__Asset_id', 'exo__Instance_class'],
                    showEmptyProperties: false
                },
                file: context.file,
                frontmatter: context.metadata.frontmatter,
                dataviewApi: context.dataviewApi
            };
            
            await renderer.render(blockContext);
        }
    }




    private renderError(container: HTMLElement, error: string): Result<void> {
        container.createEl('div', { 
            text: `Layout Error: ${error}`,
            cls: 'exocortex-error notice-error'
        });
        return Result.fail(error);
    }

    private cleanClassName(className: any): string {
        if (!className) return '';
        const str = Array.isArray(className) ? className[0] : className;
        return str?.toString().replace(/\[\[|\]\]/g, '') || '';
    }
}