import { ClassLayout } from '../entities/ClassLayout';
import { Result } from '../core/Result';

// Re-export core types from their new locations for backward compatibility
export type { RenderContext, BlockRenderResult } from './IBlockRenderer';
export type { LayoutRenderResult } from './ILayoutCoordinator';

// Import types for use in interface
import { RenderContext } from './IBlockRenderer';
import { LayoutRenderResult } from './ILayoutCoordinator';

// Simplified domain service port (ISP compliant)
export interface ILayoutRenderer {
    renderLayout(
        layout: ClassLayout,
        context: RenderContext
    ): Promise<Result<LayoutRenderResult>>;

    renderDefaultLayout(
        context: RenderContext
    ): Promise<Result<LayoutRenderResult>>;
}

// Legacy interfaces for backward compatibility - DEPRECATED
// @deprecated Use ILayoutCoordinator and IDOMRenderer instead
export interface IContainerRenderer {
    createElement(tag: string, options?: ElementOptions): IRenderElement;
    attachToContainer(containerId: string, element: IRenderElement): void;
}

// @deprecated Use IRenderContainer instead
export interface IRenderElement {
    setContent(content: string): void;
    addClass(className: string): void;
    setAttribute(name: string, value: string): void;
    appendChild(child: IRenderElement): void;
    addEventListener(event: string, handler: () => void): void;
}

export interface ElementOptions {
    text?: string;
    className?: string;
    attributes?: Record<string, string>;
}