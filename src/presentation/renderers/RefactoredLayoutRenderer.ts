import { ClassLayout } from '../../domain/entities/ClassLayout';
import { Result } from '../../domain/core/Result';
import { 
    ILayoutRenderer, 
    RenderContext, 
    LayoutRenderResult 
} from '../../domain/ports/ILayoutRenderer';
import { ILayoutCoordinator } from '../../domain/ports/ILayoutCoordinator';

/**
 * Refactored Layout Renderer implementing SOLID principles
 * 
 * SRP: Single responsibility - delegates to coordinator
 * OCP: Open for extension through strategy pattern in coordinator  
 * LSP: Proper interface implementation
 * ISP: Segregated interface (removed block rendering)
 * DIP: Depends on abstractions (ILayoutCoordinator)
 */
export class RefactoredLayoutRenderer implements ILayoutRenderer {
    constructor(
        private readonly layoutCoordinator: ILayoutCoordinator
    ) {}

    async renderLayout(
        layout: ClassLayout,
        context: RenderContext
    ): Promise<Result<LayoutRenderResult>> {
        if (!layout) {
            return Result.fail('Layout cannot be null or undefined');
        }

        if (!context || !context.containerId) {
            return Result.fail('Valid render context with containerId is required');
        }

        try {
            return await this.layoutCoordinator.coordinateLayout(layout, context);
        } catch (error) {
            return Result.fail(`Layout rendering failed: ${error}`);
        }
    }

    async renderDefaultLayout(
        context: RenderContext
    ): Promise<Result<LayoutRenderResult>> {
        if (!context || !context.containerId) {
            return Result.fail('Valid render context with containerId is required');
        }

        try {
            return await this.layoutCoordinator.coordinateDefaultLayout(context);
        } catch (error) {
            return Result.fail(`Default layout rendering failed: ${error}`);
        }
    }
}

/**
 * Facade for simplified external access
 * Implements Facade pattern for KISS principle compliance
 */
export class LayoutRenderingFacade {
    constructor(
        private readonly layoutRenderer: ILayoutRenderer,
        private readonly defaultAssetPath: string = ''
    ) {}

    async renderToContainer(
        containerId: string, 
        layout: ClassLayout | null,
        metadata: Record<string, any> = {},
        assetPath?: string
    ): Promise<Result<LayoutRenderResult>> {
        const context: RenderContext = {
            containerId,
            assetPath: assetPath || this.defaultAssetPath,
            metadata,
            frontmatter: metadata.frontmatter || {}
        };

        if (layout) {
            return await this.layoutRenderer.renderLayout(layout, context);
        } else {
            return await this.layoutRenderer.renderDefaultLayout(context);
        }
    }
}