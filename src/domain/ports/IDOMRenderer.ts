import { Result } from "../core/Result";

export interface ContainerOptions {
  className?: string;
  text?: string;
  attributes?: Record<string, string>;
}

export interface IRenderContainer {
  setContent(content: string): void;
  addClass(className: string): void;
  setAttribute(name: string, value: string): void;
  appendChild(child: IRenderContainer): void;
  addEventListener(event: string, handler: () => void): void;
  toggleClass(className: string, force?: boolean): void;
  hasClass(className: string): boolean;
  element: HTMLElement; // For Obsidian compatibility
}

export interface IDOMRenderer {
  createElement(tag: string, options?: ContainerOptions): IRenderContainer;
  attachToContainer(
    containerId: string,
    element: IRenderContainer,
  ): Result<void>;
  createTextNode(text: string): IRenderContainer;
}

export interface IContainerFactory {
  createBlockContainer(blockType: string, blockId: string): IRenderContainer;
  createHeaderContainer(
    title: string,
    isCollapsible: boolean,
  ): IRenderContainer;
  createContentContainer(): IRenderContainer;
}
