import { Result } from '../../src/domain/core/Result';
import { 
    IDOMRenderer,
    IRenderContainer,
    ContainerOptions,
    IContainerFactory 
} from '../../src/domain/ports/IDOMRenderer';

export class FakeRenderContainer implements IRenderContainer {
    public content: string = '';
    public classes: Set<string> = new Set();
    public attributes: Map<string, string> = new Map();
    public children: FakeRenderContainer[] = [];
    public eventListeners: Map<string, () => void> = new Map();
    public element: HTMLElement;

    constructor(
        public readonly tag: string = 'div',
        options: ContainerOptions = {}
    ) {
        // Create a real DOM element for compatibility
        this.element = document.createElement(tag);
        
        if (options.className) {
            this.addClass(options.className);
        }
        if (options.text) {
            this.setContent(options.text);
        }
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([name, value]) => {
                this.setAttribute(name, value);
            });
        }
    }

    setContent(content: string): void {
        this.content = content;
        this.element.textContent = content;
    }

    addClass(className: string): void {
        this.classes.add(className);
        this.element.classList.add(className);
    }

    setAttribute(name: string, value: string): void {
        this.attributes.set(name, value);
        this.element.setAttribute(name, value);
    }

    appendChild(child: IRenderContainer): void {
        if (child instanceof FakeRenderContainer) {
            this.children.push(child);
        }
        this.element.appendChild(child.element);
    }

    addEventListener(event: string, handler: () => void): void {
        this.eventListeners.set(event, handler);
        this.element.addEventListener(event, handler);
    }

    toggleClass(className: string, force?: boolean): void {
        if (force === undefined) {
            if (this.classes.has(className)) {
                this.classes.delete(className);
            } else {
                this.classes.add(className);
            }
        } else if (force) {
            this.classes.add(className);
        } else {
            this.classes.delete(className);
        }
        this.element.classList.toggle(className, force);
    }

    hasClass(className: string): boolean {
        return this.classes.has(className);
    }

    // Test inspection methods
    getChildrenByClass(className: string): FakeRenderContainer[] {
        return this.children.filter(child => child.hasClass(className));
    }

    findChildById(id: string): FakeRenderContainer | null {
        const found = this.children.find(child => child.attributes.get('data-block-id') === id);
        if (found) return found;
        
        for (const child of this.children) {
            const nested = child.findChildById(id);
            if (nested) return nested;
        }
        
        return null;
    }

    getAllClasses(): string[] {
        return Array.from(this.classes);
    }

    getAllAttributes(): Record<string, string> {
        return Object.fromEntries(this.attributes);
    }
}

export class FakeDOMRenderer implements IDOMRenderer {
    private containers: Map<string, FakeRenderContainer> = new Map();
    private createdElements: FakeRenderContainer[] = [];

    createElement(tag: string, options: ContainerOptions = {}): IRenderContainer {
        const container = new FakeRenderContainer(tag, options);
        this.createdElements.push(container);
        return container;
    }

    attachToContainer(containerId: string, element: IRenderContainer): Result<void> {
        const container = this.containers.get(containerId);
        if (!container) {
            return Result.fail(`Container with id '${containerId}' not found`);
        }

        container.appendChild(element);
        return Result.ok();
    }

    createTextNode(text: string): IRenderContainer {
        const container = new FakeRenderContainer('span');
        container.setContent(text);
        return container;
    }

    // Test setup methods
    registerContainer(id: string, container?: FakeRenderContainer): void {
        this.containers.set(id, container || new FakeRenderContainer('div'));
    }

    getContainer(id: string): FakeRenderContainer | null {
        return this.containers.get(id) || null;
    }

    getCreatedElements(): FakeRenderContainer[] {
        return [...this.createdElements];
    }

    clear(): void {
        this.containers.clear();
        this.createdElements = [];
    }
}

export class FakeContainerFactory implements IContainerFactory {
    constructor(private domRenderer: IDOMRenderer) {}

    createBlockContainer(blockType: string, blockId: string): IRenderContainer {
        return this.domRenderer.createElement('div', {
            className: `exocortex-block exocortex-block-${blockType}`,
            attributes: { 'data-block-id': blockId }
        });
    }

    createHeaderContainer(title: string, isCollapsible: boolean): IRenderContainer {
        return this.domRenderer.createElement('h3', {
            text: title,
            className: `exocortex-block-header${isCollapsible ? ' is-collapsible' : ''}`
        });
    }

    createContentContainer(): IRenderContainer {
        return this.domRenderer.createElement('div', {
            className: 'exocortex-block-content'
        });
    }
}