import { App, TextComponent } from 'obsidian';
import { PlatformDetector } from '../../infrastructure/utils/PlatformDetector';
import { MobileModalAdapter } from './MobileModalAdapter';

interface TouchTreeNode {
    className: string;
    label: string;
    ontology: string;
    children: TouchTreeNode[];
    isExpanded: boolean;
    isSelected: boolean;
    isRecursion: boolean;
    hasMultipleParents: boolean;
    level: number;
    parent?: TouchTreeNode;
}

interface TreeNodeElement {
    node: TouchTreeNode;
    element: HTMLElement;
    contentElement: HTMLElement;
    childrenContainer?: HTMLElement;
}

/**
 * Touch-optimized class tree modal for mobile devices
 * Implements iOS-friendly tree navigation with collapsible sections
 */
export class TouchClassTreeModal extends MobileModalAdapter {
    private treeData: TouchTreeNode[];
    private expandedNodes: Set<string> = new Set();
    private selectedClass: string;
    private onSelect: (className: string) => void;
    private searchInput?: TextComponent;
    private treeContainer?: HTMLElement;
    private filteredTree: TouchTreeNode[] | null = null;
    private searchTerm: string = '';
    private nodeElements: Map<string, TreeNodeElement> = new Map();
    private virtualScrolling: boolean = false;
    private visibleNodes: TouchTreeNode[] = [];
    private scrollTop: number = 0;
    private nodeHeight: number = 60; // iOS-friendly height
    private containerHeight: number = 0;
    private hapticFeedback?: any;

    constructor(
        app: App,
        treeData: any[],
        currentClass: string,
        onSelect: (className: string) => void
    ) {
        super(app, {
            title: 'Select Class',
            subtitle: 'Choose a class for your asset',
            fullscreen: PlatformDetector.isMobile(),
            keyboardHandling: 'auto',
            className: 'touch-class-tree-modal'
        });

        this.selectedClass = currentClass;
        this.onSelect = onSelect;
        this.treeData = this.convertToTouchTreeNodes(treeData);
        
        this.initializeHapticFeedback();
        this.expandToSelected(currentClass);
        
        // Enable virtual scrolling for large trees on mobile
        this.virtualScrolling = PlatformDetector.isMobile() && this.countTotalNodes() > 50;
    }

    /**
     * Initialize haptic feedback for iOS
     */
    private initializeHapticFeedback(): void {
        if (PlatformDetector.isIOS() && 'vibrate' in navigator) {
            this.hapticFeedback = {
                selection: () => navigator.vibrate?.(5),
                impact: () => navigator.vibrate?.(15)
            };
        }
    }

    /**
     * Convert tree data to touch-optimized nodes
     */
    private convertToTouchTreeNodes(data: any[], level: number = 0, parent?: TouchTreeNode): TouchTreeNode[] {
        return data.map(item => {
            const node: TouchTreeNode = {
                className: item.className,
                label: item.label,
                ontology: item.ontology,
                children: [],
                isExpanded: this.expandedNodes.has(item.className),
                isSelected: item.className === this.selectedClass,
                isRecursion: item.isRecursion || false,
                hasMultipleParents: false,
                level: level,
                parent: parent
            };

            if (item.children && item.children.length > 0) {
                node.children = this.convertToTouchTreeNodes(item.children, level + 1, node);
            }

            return node;
        });
    }

    /**
     * Count total nodes for virtual scrolling decision
     */
    private countTotalNodes(): number {
        const countNodes = (nodes: TouchTreeNode[]): number => {
            return nodes.reduce((count, node) => {
                return count + 1 + countNodes(node.children);
            }, 0);
        };
        return countNodes(this.treeData);
    }

    /**
     * Expand path to selected node
     */
    private expandToSelected(className: string): void {
        const findPath = (nodes: TouchTreeNode[], target: string, path: string[] = []): string[] | null => {
            for (const node of nodes) {
                if (node.className === target) {
                    return path;
                }
                if (node.children && node.children.length > 0) {
                    const childPath = findPath(node.children, target, [...path, node.className]);
                    if (childPath) {
                        return childPath;
                    }
                }
            }
            return null;
        };

        const path = findPath(this.treeData, className);
        if (path) {
            path.forEach(nodeClass => this.expandedNodes.add(nodeClass));
        }
    }

    /**
     * Override onOpen to setup mobile-specific content
     */
    onOpen(): void {
        super.onOpen();
        
        const body = this.contentEl.querySelector('.exocortex-mobile-modal-body') as HTMLElement;
        if (!body) return;

        this.setupSearchSection(body);
        this.setupTreeContainer(body);
        this.renderTree();

        // Setup keyboard handling for search
        if (this.searchInput) {
            this.searchInput.inputEl.focus();
        }
    }

    /**
     * Setup search section with mobile-optimized input
     */
    private setupSearchSection(container: HTMLElement): void {
        const searchSection = this.createFormSection('Search Classes');
        container.appendChild(searchSection);

        const searchContainer = searchSection.querySelector('.form-section-content') as HTMLElement;
        
        // Create search input wrapper
        const inputWrapper = searchContainer.createDiv({ cls: 'touch-search-wrapper' });
        
        const searchInputEl = inputWrapper.createEl('input', {
            type: 'text',
            cls: 'touch-input touch-search-input',
            placeholder: 'Type to search classes...'
        });

        // Add search icon
        const searchIcon = inputWrapper.createSpan({
            cls: 'touch-search-icon',
            text: '🔍'
        });

        // Add clear button
        const clearButton = this.createSearchClearButton(() => {
            searchInputEl.value = '';
            this.handleSearchChange('');
        });
        inputWrapper.appendChild(clearButton);

        // Style the wrapper
        inputWrapper.style.cssText = `
            position: relative;
            display: flex;
            align-items: center;
        `;

        searchIcon.style.cssText = `
            position: absolute;
            left: 12px;
            z-index: 1;
            color: var(--text-muted);
            pointer-events: none;
        `;

        searchInputEl.style.paddingLeft = '40px';
        searchInputEl.style.paddingRight = '40px';

        // Handle search input
        searchInputEl.addEventListener('input', (e) => {
            const value = (e.target as HTMLInputElement).value;
            this.handleSearchChange(value);
            
            // Show/hide clear button
            clearButton.style.display = value ? 'flex' : 'none';
        });

        // Prevent search from closing modal on Enter
        searchInputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.selectFirstVisibleNode();
            }
        });
    }

    /**
     * Create search clear button
     */
    private createSearchClearButton(onClick: () => void): HTMLElement {
        const button = document.createElement('button');
        button.className = 'touch-search-clear';
        button.innerHTML = '✕';
        button.style.cssText = `
            position: absolute;
            right: 8px;
            width: 32px;
            height: 32px;
            border: none;
            background: none;
            color: var(--text-muted);
            border-radius: 50%;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s ease;
            -webkit-tap-highlight-color: transparent;
        `;

        button.addEventListener('click', onClick);

        // Touch feedback
        if (PlatformDetector.hasTouch()) {
            button.addEventListener('touchstart', () => {
                button.style.backgroundColor = 'var(--background-modifier-hover)';
            }, { passive: true });

            button.addEventListener('touchend', () => {
                setTimeout(() => {
                    button.style.backgroundColor = '';
                }, 150);
            }, { passive: true });
        }

        return button;
    }

    /**
     * Setup tree container with virtual scrolling support
     */
    private setupTreeContainer(container: HTMLElement): void {
        const treeSection = container.createDiv({ cls: 'touch-tree-section' });
        
        this.treeContainer = treeSection.createDiv({ 
            cls: `touch-tree-container ${this.virtualScrolling ? 'virtual-scroll' : ''}` 
        });

        this.treeContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            max-height: 400px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 8px;
            background: var(--background-primary);
        `;

        if (this.virtualScrolling) {
            this.setupVirtualScrolling();
        }
    }

    /**
     * Setup virtual scrolling for large trees
     */
    private setupVirtualScrolling(): void {
        if (!this.treeContainer) return;

        this.treeContainer.addEventListener('scroll', () => {
            this.scrollTop = this.treeContainer!.scrollTop;
            this.updateVisibleNodes();
        });

        // Observe container size changes
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                this.containerHeight = entry.contentRect.height;
                this.updateVisibleNodes();
            }
        });

        resizeObserver.observe(this.treeContainer);
    }

    /**
     * Handle search input changes
     */
    private handleSearchChange(value: string): void {
        this.searchTerm = value.toLowerCase();
        
        if (!value) {
            this.filteredTree = null;
        } else {
            this.filteredTree = this.filterTreeNodes(this.treeData, value);
        }
        
        this.renderTree();
    }

    /**
     * Filter tree nodes based on search term
     */
    private filterTreeNodes(nodes: TouchTreeNode[], searchTerm: string): TouchTreeNode[] {
        const filtered: TouchTreeNode[] = [];
        
        for (const node of nodes) {
            const matchesSearch = node.className.toLowerCase().includes(searchTerm) ||
                                 node.label.toLowerCase().includes(searchTerm) ||
                                 node.ontology.toLowerCase().includes(searchTerm);
            
            const filteredChildren = this.filterTreeNodes(node.children, searchTerm);
            
            if (matchesSearch || filteredChildren.length > 0) {
                filtered.push({
                    ...node,
                    children: filteredChildren,
                    isExpanded: true // Auto-expand when searching
                });
            }
        }
        
        return filtered;
    }

    /**
     * Select first visible node (for Enter key handling)
     */
    private selectFirstVisibleNode(): void {
        const nodes = this.filteredTree || this.treeData;
        const firstNode = this.findFirstSelectableNode(nodes);
        
        if (firstNode) {
            this.triggerHaptic('selection');
            this.selectClass(firstNode.className);
        }
    }

    /**
     * Find first selectable node
     */
    private findFirstSelectableNode(nodes: TouchTreeNode[]): TouchTreeNode | null {
        for (const node of nodes) {
            if (!node.isRecursion) {
                return node;
            }
            if (node.isExpanded && node.children.length > 0) {
                const childResult = this.findFirstSelectableNode(node.children);
                if (childResult) return childResult;
            }
        }
        return null;
    }

    /**
     * Render the tree with touch optimizations
     */
    private renderTree(): void {
        if (!this.treeContainer) return;

        this.nodeElements.clear();
        this.treeContainer.empty();
        
        const nodes = this.filteredTree || this.treeData;
        
        if (nodes.length === 0) {
            this.renderEmptyState();
            return;
        }

        if (this.virtualScrolling) {
            this.renderVirtualTree(nodes);
        } else {
            this.renderRegularTree(nodes);
        }
    }

    /**
     * Render empty state
     */
    private renderEmptyState(): void {
        if (!this.treeContainer) return;

        const emptyEl = this.treeContainer.createDiv({ cls: 'touch-tree-empty' });
        emptyEl.style.cssText = `
            padding: 40px 20px;
            text-align: center;
            color: var(--text-muted);
        `;

        emptyEl.createEl('div', {
            text: '🔍',
            cls: 'empty-icon'
        }).style.fontSize = '48px';

        emptyEl.createEl('h3', {
            text: 'No classes found',
            cls: 'empty-title'
        }).style.margin = '16px 0 8px 0';

        emptyEl.createEl('p', {
            text: this.searchTerm ? 'Try adjusting your search terms' : 'No classes available',
            cls: 'empty-description'
        });
    }

    /**
     * Render regular tree (non-virtual)
     */
    private renderRegularTree(nodes: TouchTreeNode[]): void {
        if (!this.treeContainer) return;

        const treeEl = this.treeContainer.createDiv({ cls: 'touch-tree' });
        this.renderTreeNodes(nodes, treeEl);
    }

    /**
     * Render virtual tree for performance
     */
    private renderVirtualTree(nodes: TouchTreeNode[]): void {
        // Flatten tree for virtual scrolling
        this.visibleNodes = this.flattenTree(nodes);
        this.updateVisibleNodes();
    }

    /**
     * Flatten tree structure for virtual scrolling
     */
    private flattenTree(nodes: TouchTreeNode[]): TouchTreeNode[] {
        const flattened: TouchTreeNode[] = [];
        
        const addNode = (node: TouchTreeNode) => {
            flattened.push(node);
            if (node.isExpanded && node.children.length > 0) {
                node.children.forEach(addNode);
            }
        };
        
        nodes.forEach(addNode);
        return flattened;
    }

    /**
     * Update visible nodes for virtual scrolling
     */
    private updateVisibleNodes(): void {
        if (!this.treeContainer || !this.virtualScrolling) return;

        const startIndex = Math.floor(this.scrollTop / this.nodeHeight);
        const visibleCount = Math.ceil(this.containerHeight / this.nodeHeight) + 2; // Buffer
        const endIndex = Math.min(startIndex + visibleCount, this.visibleNodes.length);

        // Clear container
        this.treeContainer.empty();

        // Create virtual container with proper height
        const totalHeight = this.visibleNodes.length * this.nodeHeight;
        const virtualContainer = this.treeContainer.createDiv({ cls: 'virtual-tree-container' });
        virtualContainer.style.height = `${totalHeight}px`;
        virtualContainer.style.position = 'relative';

        // Render visible nodes
        for (let i = startIndex; i < endIndex; i++) {
            const node = this.visibleNodes[i];
            if (node) {
                const nodeEl = this.createTouchTreeNode(node);
                nodeEl.style.position = 'absolute';
                nodeEl.style.top = `${i * this.nodeHeight}px`;
                nodeEl.style.width = '100%';
                virtualContainer.appendChild(nodeEl);
            }
        }
    }

    /**
     * Render tree nodes recursively
     */
    private renderTreeNodes(nodes: TouchTreeNode[], container: HTMLElement): void {
        nodes.forEach(node => {
            if (node.isRecursion) {
                this.renderRecursionNode(node, container);
            } else {
                this.renderTouchTreeNode(node, container);
            }
        });
    }

    /**
     * Render recursion warning node
     */
    private renderRecursionNode(node: TouchTreeNode, container: HTMLElement): void {
        const nodeEl = container.createDiv({ cls: 'touch-tree-node touch-tree-recursion' });
        
        const contentEl = this.createNodeContent(nodeEl, node);
        contentEl.style.paddingLeft = `${(node.level * 20) + 20}px`;
        
        const warningIcon = contentEl.createSpan({
            text: '⚠️',
            cls: 'recursion-warning-icon'
        });
        
        contentEl.createSpan({
            text: ` ${node.className} (circular reference)`,
            cls: 'recursion-warning-text'
        });
    }

    /**
     * Render touch-optimized tree node
     */
    private renderTouchTreeNode(node: TouchTreeNode, container: HTMLElement): void {
        const nodeEl = this.createTouchTreeNode(node);
        container.appendChild(nodeEl);

        // Store reference
        const elementData: TreeNodeElement = {
            node,
            element: nodeEl,
            contentElement: nodeEl.querySelector('.touch-tree-node-content') as HTMLElement
        };

        this.nodeElements.set(node.className, elementData);

        // Render children if expanded
        if (node.isExpanded && node.children.length > 0) {
            const childContainer = nodeEl.createDiv({ cls: 'touch-tree-children' });
            elementData.childrenContainer = childContainer;
            this.renderTreeNodes(node.children, childContainer);
        }
    }

    /**
     * Create touch-optimized tree node element
     */
    private createTouchTreeNode(node: TouchTreeNode): HTMLElement {
        const nodeEl = document.createElement('div');
        nodeEl.className = `touch-tree-node ${node.isSelected ? 'is-selected' : ''}`;
        
        const contentEl = this.createNodeContent(nodeEl, node);
        const indentLevel = Math.max(0, node.level);
        contentEl.style.paddingLeft = `${indentLevel * 20 + 16}px`;

        // Add expand/collapse functionality
        if (node.children && node.children.length > 0) {
            this.addExpandCollapseFunctionality(contentEl, node);
        }

        // Add selection functionality
        this.addSelectionFunctionality(contentEl, node);

        return nodeEl;
    }

    /**
     * Create node content structure
     */
    private createNodeContent(nodeEl: HTMLElement, node: TouchTreeNode): HTMLElement {
        const contentEl = nodeEl.createDiv({ cls: 'touch-tree-node-content' });
        
        contentEl.style.cssText = `
            display: flex;
            align-items: center;
            min-height: ${this.nodeHeight}px;
            padding: 12px 16px;
            cursor: pointer;
            transition: background-color 0.2s ease;
            -webkit-tap-highlight-color: transparent;
            border-bottom: 1px solid var(--background-modifier-border);
        `;

        // Expand/collapse icon
        if (node.children && node.children.length > 0) {
            const expandIcon = contentEl.createSpan({
                cls: 'touch-tree-expand-icon',
                text: node.isExpanded ? '▼' : '▶'
            });
            
            expandIcon.style.cssText = `
                margin-right: 12px;
                font-size: 12px;
                color: var(--text-muted);
                transition: transform 0.2s ease;
                min-width: 16px;
            `;
        } else {
            const spacer = contentEl.createSpan({
                cls: 'touch-tree-expand-spacer'
            });
            spacer.style.minWidth = '28px';
        }

        // Class icon
        const classIcon = contentEl.createSpan({
            cls: 'touch-tree-class-icon',
            text: '📦'
        });
        
        classIcon.style.cssText = `
            margin-right: 12px;
            font-size: 16px;
        `;

        // Text content
        const textContainer = contentEl.createDiv({ cls: 'touch-tree-text-container' });
        textContainer.style.cssText = `
            flex: 1;
            min-width: 0;
        `;

        const className = textContainer.createDiv({
            text: node.className,
            cls: 'touch-tree-class-name'
        });
        
        className.style.cssText = `
            font-weight: 500;
            font-size: 16px;
            color: var(--text-normal);
            margin-bottom: 2px;
            word-break: break-word;
        `;

        if (node.label && node.label !== node.className) {
            const label = textContainer.createDiv({
                text: node.label,
                cls: 'touch-tree-class-label'
            });
            
            label.style.cssText = `
                font-size: 14px;
                color: var(--text-muted);
                word-break: break-word;
            `;
        }

        // Ontology badge
        const ontologyBadge = contentEl.createSpan({
            text: node.ontology,
            cls: 'touch-tree-ontology-badge'
        });
        
        ontologyBadge.style.cssText = `
            padding: 4px 8px;
            background: var(--background-secondary);
            color: var(--text-muted);
            font-size: 12px;
            border-radius: 4px;
            margin-left: 12px;
            flex-shrink: 0;
        `;

        // Highlight search term
        if (this.searchTerm) {
            this.highlightSearchTerm(className, node.className);
            if (node.label && node.label !== node.className) {
                const labelEl = textContainer.querySelector('.touch-tree-class-label');
                if (labelEl) {
                    this.highlightSearchTerm(labelEl as HTMLElement, node.label);
                }
            }
        }

        return contentEl;
    }

    /**
     * Add expand/collapse functionality
     */
    private addExpandCollapseFunctionality(contentEl: HTMLElement, node: TouchTreeNode): void {
        const expandIcon = contentEl.querySelector('.touch-tree-expand-icon') as HTMLElement;
        
        if (expandIcon) {
            expandIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNodeExpansion(node);
            });
        }
    }

    /**
     * Add selection functionality
     */
    private addSelectionFunctionality(contentEl: HTMLElement, node: TouchTreeNode): void {
        contentEl.addEventListener('click', () => {
            if (!node.isRecursion) {
                this.triggerHaptic('selection');
                this.selectClass(node.className);
            }
        });

        // Touch feedback
        if (PlatformDetector.hasTouch()) {
            contentEl.addEventListener('touchstart', () => {
                contentEl.style.backgroundColor = 'var(--background-modifier-hover)';
            }, { passive: true });

            contentEl.addEventListener('touchend', () => {
                setTimeout(() => {
                    if (!node.isSelected) {
                        contentEl.style.backgroundColor = '';
                    }
                }, 150);
            }, { passive: true });
        }

        // Hover effects for non-touch devices
        if (!PlatformDetector.hasTouch()) {
            contentEl.addEventListener('mouseenter', () => {
                if (!node.isSelected) {
                    contentEl.style.backgroundColor = 'var(--background-modifier-hover)';
                }
            });

            contentEl.addEventListener('mouseleave', () => {
                if (!node.isSelected) {
                    contentEl.style.backgroundColor = '';
                }
            });
        }

        // Update selection state
        if (node.isSelected) {
            contentEl.style.backgroundColor = 'var(--background-modifier-active-hover)';
        }
    }

    /**
     * Toggle node expansion
     */
    private toggleNodeExpansion(node: TouchTreeNode): void {
        this.triggerHaptic('impact');
        
        node.isExpanded = !node.isExpanded;
        
        if (node.isExpanded) {
            this.expandedNodes.add(node.className);
        } else {
            this.expandedNodes.delete(node.className);
        }
        
        // Update in tree data
        this.updateNodeInTree(this.treeData, node.className, node.isExpanded);
        
        // Re-render tree
        this.renderTree();
    }

    /**
     * Update node expansion state in tree data
     */
    private updateNodeInTree(nodes: TouchTreeNode[], className: string, isExpanded: boolean): boolean {
        for (const node of nodes) {
            if (node.className === className) {
                node.isExpanded = isExpanded;
                return true;
            }
            if (node.children && this.updateNodeInTree(node.children, className, isExpanded)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Highlight search term in text
     */
    private highlightSearchTerm(element: HTMLElement, text: string): void {
        if (!this.searchTerm) return;
        
        element.innerHTML = '';
        
        const regex = new RegExp(`(${this.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        
        parts.forEach((part, index) => {
            if (index % 2 === 1 && part.toLowerCase() === this.searchTerm.toLowerCase()) {
                const mark = document.createElement('mark');
                mark.textContent = part;
                mark.style.cssText = `
                    background: var(--text-accent);
                    color: var(--text-on-accent);
                    padding: 1px 2px;
                    border-radius: 2px;
                `;
                element.appendChild(mark);
            } else if (part) {
                element.appendChild(document.createTextNode(part));
            }
        });
    }

    /**
     * Select class and close modal
     */
    private selectClass(className: string): void {
        this.selectedClass = className;
        this.onSelect(className);
        this.close();
    }

    /**
     * Trigger haptic feedback
     */
    private triggerHaptic(type: 'selection' | 'impact'): void {
        if (this.hapticFeedback && this.hapticFeedback[type]) {
            this.hapticFeedback[type]();
        }
    }

    /**
     * Override onClose for cleanup
     */
    onClose(): void {
        this.nodeElements.clear();
        this.visibleNodes = [];
        super.onClose();
    }
}