import { Result } from "../../domain/core/Result";
import {
  IDOMRenderer,
  IRenderContainer,
  ContainerOptions,
  IContainerFactory,
} from "../../domain/ports/IDOMRenderer";

export class ObsidianRenderContainer implements IRenderContainer {
  constructor(public readonly element: HTMLElement) {}

  setContent(content: string): void {
    this.element.textContent = content;
  }

  addClass(className: string): void {
    this.element.classList.add(className);
  }

  setAttribute(name: string, value: string): void {
    this.element.setAttribute(name, value);
  }

  appendChild(child: IRenderContainer): void {
    this.element.appendChild(child.element);
  }

  addEventListener(event: string, handler: () => void): void {
    this.element.addEventListener(event, handler);
  }

  toggleClass(className: string, force?: boolean): void {
    this.element.classList.toggle(className, force);
  }

  hasClass(className: string): boolean {
    return this.element.classList.contains(className);
  }
}

export class ObsidianDOMRenderer implements IDOMRenderer {
  createElement(tag: string, options: ContainerOptions = {}): IRenderContainer {
    const element = document.createElement(tag);

    if (options.className) {
      element.className = options.className;
    }

    if (options.text) {
      element.textContent = options.text;
    }

    if (options.attributes) {
      Object.entries(options.attributes).forEach(([name, value]) => {
        element.setAttribute(name, value);
      });
    }

    return new ObsidianRenderContainer(element);
  }

  attachToContainer(
    containerId: string,
    element: IRenderContainer,
  ): Result<void> {
    const container = document.getElementById(containerId);

    if (!container) {
      return Result.fail(`Container with id '${containerId}' not found`);
    }

    container.appendChild(element.element);
    return Result.ok();
  }

  createTextNode(text: string): IRenderContainer {
    const textNode = document.createTextNode(text);
    const wrapper = document.createElement("span");
    wrapper.appendChild(textNode);
    return new ObsidianRenderContainer(wrapper);
  }
}

export class ContainerFactory implements IContainerFactory {
  constructor(private domRenderer: IDOMRenderer) {}

  createBlockContainer(blockType: string, blockId: string): IRenderContainer {
    return this.domRenderer.createElement("div", {
      className: `exocortex-block exocortex-block-${blockType}`,
      attributes: { "data-block-id": blockId },
    });
  }

  createHeaderContainer(
    title: string,
    isCollapsible: boolean,
  ): IRenderContainer {
    const header = this.domRenderer.createElement("h3", {
      text: title,
      className: `exocortex-block-header${isCollapsible ? " is-collapsible" : ""}`,
    });

    return header;
  }

  createContentContainer(): IRenderContainer {
    return this.domRenderer.createElement("div", {
      className: "exocortex-block-content",
    });
  }
}
