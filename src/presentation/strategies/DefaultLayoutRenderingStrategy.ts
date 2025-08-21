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
            
            // Render default layout blocks
            await this.renderPropertiesBlock(context, frontmatter);
            await this.renderRelationsBlock(context, frontmatter);
            await this.renderChildrenEffortsBlock(context);
            await this.renderBacklinksBlock(context);

            return Result.ok();

        } catch (error) {
            return Result.fail(`Default layout rendering failed: ${error}`);
        }
    }

    private async renderPropertiesBlock(
        context: LayoutRenderingContext,
        frontmatter: Record<string, any>
    ): Promise<void> {
        const propsContainer = context.container.createDiv({ 
            cls: 'exocortex-block exocortex-block-properties' 
        });
        propsContainer.createEl('h3', { text: '📝 Properties' });
        const propsContent = propsContainer.createDiv({ cls: 'exocortex-block-content' });
        
        const rendererResult = this.blockRendererFactory.createRenderer('properties');
        if (rendererResult.isSuccess) {
            const renderer = rendererResult.getValue();
            const blockContext: BlockRenderingContext = {
                container: propsContent,
                config: { 
                    type: 'properties',
                    editableProperties: Object.keys(frontmatter).filter(k => !k.startsWith('exo__'))
                },
                file: context.file,
                frontmatter,
                dataviewApi: context.dataviewApi
            };
            
            await renderer.render(blockContext);
        }
    }

    private async renderRelationsBlock(
        context: LayoutRenderingContext,
        frontmatter: Record<string, any>
    ): Promise<void> {
        if (!frontmatter['exo__Asset_relates']) return;
        
        const relContainer = context.container.createDiv({ 
            cls: 'exocortex-block exocortex-block-relations' 
        });
        relContainer.createEl('h3', { text: '🔗 Related Assets' });
        const relContent = relContainer.createDiv({ cls: 'exocortex-block-content' });
        
        const relates = Array.isArray(frontmatter['exo__Asset_relates']) 
            ? frontmatter['exo__Asset_relates'] 
            : [frontmatter['exo__Asset_relates']];
        
        const list = relContent.createEl('ul');
        relates.forEach((rel: string) => {
            const item = list.createEl('li');
            const link = this.cleanClassName(rel);
            item.createEl('a', { 
                text: link,
                href: link,
                cls: 'internal-link'
            });
        });
    }

    private async renderChildrenEffortsBlock(context: LayoutRenderingContext): Promise<void> {
        const childrenContainer = context.container.createDiv({ 
            cls: 'exocortex-block exocortex-block-children-efforts' 
        });
        childrenContainer.createEl('h3', { text: '👶 Children Efforts' });
        const childrenContent = childrenContainer.createDiv({ cls: 'exocortex-block-content' });
        
        const rendererResult = this.blockRendererFactory.createRenderer('children-efforts');
        if (rendererResult.isSuccess) {
            const renderer = rendererResult.getValue();
            const blockContext: BlockRenderingContext = {
                container: childrenContent,
                config: { type: 'children-efforts' },
                file: context.file,
                frontmatter: context.metadata.frontmatter,
                dataviewApi: context.dataviewApi
            };
            
            await renderer.render(blockContext);
        }
    }

    private async renderBacklinksBlock(context: LayoutRenderingContext): Promise<void> {
        const backlinksContainer = context.container.createDiv({ 
            cls: 'exocortex-block exocortex-block-backlinks' 
        });
        backlinksContainer.createEl('h3', { text: '📎 Referenced By' });
        const backlinksContent = backlinksContainer.createDiv({ cls: 'exocortex-block-content' });
        
        const rendererResult = this.blockRendererFactory.createRenderer('backlinks');
        if (rendererResult.isSuccess) {
            const renderer = rendererResult.getValue();
            const blockContext: BlockRenderingContext = {
                container: backlinksContent,
                config: { type: 'backlinks' },
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