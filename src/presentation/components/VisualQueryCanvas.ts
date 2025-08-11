import { VisualQueryNode, NodeType, NodePosition } from '../../domain/visual/VisualQueryNode';
import { VisualQueryEdge, EdgeType } from '../../domain/visual/VisualQueryEdge';
import { SPARQLProcessor } from '../processors/SPARQLProcessor';
import { Notice } from 'obsidian';
import { QueryTemplate } from '../../domain/visual/QueryTemplate';
import { TemplateSelectionPanel } from './TemplateSelectionPanel';
import { TemplateParameterModal } from '../modals/TemplateParameterModal';
import { SaveTemplateModal } from '../modals/SaveTemplateModal';
import { QueryTemplateUseCase } from '../../application/use-cases/QueryTemplateUseCase';

export interface CanvasOptions {
    width?: number;
    height?: number;
    gridSize?: number;
    showGrid?: boolean;
    zoomMin?: number;
    zoomMax?: number;
    zoomStep?: number;
    onQueryChange?: (sparql: string) => void;
    onExecute?: (sparql: string) => void;
    enableTemplates?: boolean;
    templateUseCase?: QueryTemplateUseCase;
    appInstance?: any; // For modal creation
    // Test-specific callbacks
    allowPan?: boolean;
    minZoom?: number;
    maxZoom?: number;
    onNodeSelect?: (node: VisualQueryNode) => void;
    onEdgeSelect?: (edge: VisualQueryEdge) => void;
    onNodeEdit?: (node: VisualQueryNode) => void;
    onEdgeEdit?: (edge: VisualQueryEdge) => void;
    onQueryGenerated?: (sparql: string) => void;
    onExecuteQuery?: () => void;
}

export class VisualQueryCanvas {
    private container: HTMLDivElement;
    private svg: SVGElement;
    private nodesGroup: SVGGElement;
    private edgesGroup: SVGGElement;
    private gridGroup: SVGGElement;
    private overlayGroup: SVGGElement;
    
    private nodes: Map<string, VisualQueryNode> = new Map();
    private edges: Map<string, VisualQueryEdge> = new Map();
    private selectedNodes: Set<string> = new Set();
    private selectedEdges: Set<string> = new Set();
    
    private isDragging = false;
    private isPanning = false;
    private isConnecting = false;
    private dragStartPosition?: NodePosition;
    private currentMousePosition: NodePosition = { x: 0, y: 0 };
    private connectionSourceNode?: string;
    private tempConnectionLine?: SVGLineElement;
    
    private viewportX = 0;
    private viewportY = 0;
    private zoom = 1;
    
    private readonly defaultOptions: Required<CanvasOptions> = {
        width: 800,
        height: 600,
        gridSize: 20,
        showGrid: true,
        zoomMin: 0.1,
        zoomMax: 5,
        zoomStep: 0.1,
        onQueryChange: () => {},
        onExecute: () => {},
        enableTemplates: true,
        templateUseCase: undefined as any,
        appInstance: undefined as any,
        allowPan: true,
        minZoom: 0.1,
        maxZoom: 5,
        onNodeSelect: () => {},
        onEdgeSelect: () => {},
        onNodeEdit: () => {},
        onEdgeEdit: () => {},
        onQueryGenerated: () => {},
        onExecuteQuery: () => {}
    };
    
    private options: Required<CanvasOptions>;
    private sparqlProcessor?: SPARQLProcessor;

    constructor(
        private readonly parentElement: HTMLElement,
        optionsOrSparqlProcessor?: CanvasOptions | SPARQLProcessor,
        sparqlProcessorOrOptions?: SPARQLProcessor | CanvasOptions
    ) {
        // Handle multiple constructor signatures for backward compatibility
        let options: CanvasOptions = {};
        let sparqlProcessor: SPARQLProcessor | undefined;
        
        if (optionsOrSparqlProcessor) {
            // Check if first param is SPARQLProcessor (old signature)
            if (typeof optionsOrSparqlProcessor === 'object' && 'executeQuery' in optionsOrSparqlProcessor) {
                sparqlProcessor = optionsOrSparqlProcessor as SPARQLProcessor;
                options = (sparqlProcessorOrOptions as CanvasOptions) || {};
            } 
            // Check if first param is options (new signature: parentElement, options, sparqlProcessor)
            else if (typeof optionsOrSparqlProcessor === 'object') {
                options = optionsOrSparqlProcessor as CanvasOptions;
                if (sparqlProcessorOrOptions && 'executeQuery' in sparqlProcessorOrOptions) {
                    sparqlProcessor = sparqlProcessorOrOptions as SPARQLProcessor;
                }
            }
        }
        
        this.options = { ...this.defaultOptions, ...options };
        this.sparqlProcessor = sparqlProcessor;
        this.createCanvas();
        this.attachEventListeners();
        this.render();
    }

    private createCanvas(): void {
        this.container = document.createElement('div');
        this.container.className = 'exocortex-visual-query-canvas';
        this.container.style.cssText = `
            position: relative;
            width: ${this.options.width}px;
            height: ${this.options.height}px;
            border: 2px solid var(--background-modifier-border);
            border-radius: var(--radius-m);
            background: var(--background-primary);
            overflow: hidden;
            user-select: none;
        `;
        
        const svgNS = 'http://www.w3.org/2000/svg';
        this.svg = document.createElementNS(svgNS, 'svg') as SVGElement;
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.style.cssText = 'cursor: grab;';
        
        this.gridGroup = document.createElementNS(svgNS, 'g') as SVGGElement;
        this.gridGroup.setAttribute('class', 'grid-group');
        this.svg.appendChild(this.gridGroup);
        
        this.edgesGroup = document.createElementNS(svgNS, 'g') as SVGGElement;
        this.edgesGroup.setAttribute('class', 'edges-group');
        this.svg.appendChild(this.edgesGroup);
        
        this.nodesGroup = document.createElementNS(svgNS, 'g') as SVGGElement;
        this.nodesGroup.setAttribute('class', 'nodes-group');
        this.svg.appendChild(this.nodesGroup);
        
        this.overlayGroup = document.createElementNS(svgNS, 'g') as SVGGElement;
        this.overlayGroup.setAttribute('class', 'overlay-group');
        this.svg.appendChild(this.overlayGroup);
        
        this.container.appendChild(this.svg);
        this.createControls();
        this.parentElement.appendChild(this.container);
        
        if (this.options.showGrid) {
            this.drawGrid();
        }
    }

    private createControls(): void {
        const controls = document.createElement('div');
        controls.className = 'canvas-toolbar';
        controls.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            display: flex;
            gap: 8px;
            padding: 8px;
            background: var(--background-secondary);
            border-radius: var(--radius-s);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            flex-wrap: wrap;
            max-width: 300px;
        `;
        
        // Template controls (if enabled)
        if (this.options.enableTemplates && this.options.templateUseCase) {
            const templatesBtn = this.createControlButton('Templates', () => this.showTemplateSelection());
            const saveTemplateBtn = this.createControlButton('Save Template', () => this.showSaveTemplateModal());
            controls.appendChild(templatesBtn);
            controls.appendChild(saveTemplateBtn);
            
            const templateSeparator = document.createElement('div');
            templateSeparator.style.cssText = 'width: 1px; background: var(--background-modifier-border); margin: 0 4px;';
            controls.appendChild(templateSeparator);
        }
        
        const addEntityBtn = this.createControlButton('Entity', () => this.addNode(NodeType.ENTITY));
        const addVariableBtn = this.createControlButton('Variable', () => this.addNode(NodeType.VARIABLE));
        const addLiteralBtn = this.createControlButton('Literal', () => this.addNode(NodeType.LITERAL));
        const addFilterBtn = this.createControlButton('Filter', () => this.addNode(NodeType.FILTER));
        const generateBtn = this.createControlButton('Generate', () => this.generateSPARQL());
        const executeBtn = this.createControlButton('Execute', () => this.executeQuery(), true);
        const clearBtn = this.createControlButton('Clear', () => this.clearCanvas());
        
        controls.appendChild(addEntityBtn);
        controls.appendChild(addVariableBtn);
        controls.appendChild(addLiteralBtn);
        controls.appendChild(addFilterBtn);
        controls.appendChild(generateBtn);
        controls.appendChild(executeBtn);
        controls.appendChild(clearBtn);
        
        this.container.appendChild(controls);
        
        const zoomControls = document.createElement('div');
        zoomControls.className = 'zoom-controls';
        zoomControls.style.cssText = `
            position: absolute;
            bottom: 10px;
            right: 10px;
            display: flex;
            gap: 4px;
            padding: 4px;
            background: var(--background-secondary);
            border-radius: var(--radius-s);
        `;
        
        const zoomInBtn = this.createZoomButton('+', () => this.zoomIn());
        const zoomOutBtn = this.createZoomButton('-', () => this.zoomOut());
        const zoomResetBtn = this.createZoomButton('⟲', () => this.resetZoom());
        
        zoomControls.appendChild(zoomOutBtn);
        zoomControls.appendChild(zoomResetBtn);
        zoomControls.appendChild(zoomInBtn);
        
        this.container.appendChild(zoomControls);
    }

    private createControlButton(label: string, onClick: () => void, primary = false): HTMLButtonElement {
        const button = document.createElement('button');
        button.textContent = label;
        button.className = primary ? 'mod-cta' : '';
        button.style.cssText = `
            padding: 6px 12px;
            border: none;
            border-radius: var(--radius-s);
            background: ${primary ? 'var(--interactive-accent)' : 'var(--interactive-normal)'};
            color: ${primary ? 'var(--text-on-accent)' : 'var(--text-normal)'};
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: background-color 0.15s ease;
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.background = primary ? 'var(--interactive-accent-hover)' : 'var(--interactive-hover)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.background = primary ? 'var(--interactive-accent)' : 'var(--interactive-normal)';
        });
        
        button.addEventListener('click', onClick);
        return button;
    }

    private createZoomButton(label: string, onClick: () => void): HTMLButtonElement {
        const button = document.createElement('button');
        button.textContent = label;
        button.style.cssText = `
            width: 24px;
            height: 24px;
            border: none;
            border-radius: var(--radius-s);
            background: var(--interactive-normal);
            color: var(--text-normal);
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.15s ease;
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.background = 'var(--interactive-hover)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.background = 'var(--interactive-normal)';
        });
        
        button.addEventListener('click', onClick);
        return button;
    }

    private drawGrid(): void {
        const svgNS = 'http://www.w3.org/2000/svg';
        this.gridGroup.innerHTML = '';
        
        const pattern = document.createElementNS(svgNS, 'pattern') as SVGPatternElement;
        pattern.setAttribute('id', 'grid-pattern');
        pattern.setAttribute('width', this.options.gridSize.toString());
        pattern.setAttribute('height', this.options.gridSize.toString());
        pattern.setAttribute('patternUnits', 'userSpaceOnUse');
        
        const line1 = document.createElementNS(svgNS, 'line') as SVGLineElement;
        line1.setAttribute('x1', '0');
        line1.setAttribute('y1', '0');
        line1.setAttribute('x2', this.options.gridSize.toString());
        line1.setAttribute('y2', '0');
        line1.setAttribute('stroke', 'var(--background-modifier-border)');
        line1.setAttribute('stroke-width', '0.5');
        line1.setAttribute('opacity', '0.3');
        
        const line2 = document.createElementNS(svgNS, 'line') as SVGLineElement;
        line2.setAttribute('x1', '0');
        line2.setAttribute('y1', '0');
        line2.setAttribute('x2', '0');
        line2.setAttribute('y2', this.options.gridSize.toString());
        line2.setAttribute('stroke', 'var(--background-modifier-border)');
        line2.setAttribute('stroke-width', '0.5');
        line2.setAttribute('opacity', '0.3');
        
        pattern.appendChild(line1);
        pattern.appendChild(line2);
        
        const defs = document.createElementNS(svgNS, 'defs') as SVGDefsElement;
        defs.appendChild(pattern);
        this.svg.insertBefore(defs, this.svg.firstChild);
        
        const rect = document.createElementNS(svgNS, 'rect') as SVGRectElement;
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('fill', 'url(#grid-pattern)');
        this.gridGroup.appendChild(rect);
    }

    private attachEventListeners(): void {
        this.svg.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.svg.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.svg.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.svg.addEventListener('wheel', this.handleWheel.bind(this));
        this.svg.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    private handleMouseDown(e: MouseEvent): void {
        e.preventDefault();
        const point = this.getMousePosition(e);
        this.dragStartPosition = point;
        
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            this.isPanning = true;
            this.svg.style.cursor = 'grabbing';
            return;
        }
        
        const clickedNode = this.getNodeAt(point);
        const clickedEdge = this.getEdgeAt(point);
        
        if (e.button === 0) {
            if (clickedNode) {
                if (e.ctrlKey) {
                    this.toggleNodeSelection(clickedNode);
                } else if (e.altKey) {
                    this.startConnection(clickedNode);
                } else {
                    if (!this.selectedNodes.has(clickedNode)) {
                        this.clearSelection();
                        this.selectNode(clickedNode);
                    }
                    this.isDragging = true;
                }
            } else if (clickedEdge) {
                this.clearSelection();
                this.selectEdge(clickedEdge);
            } else {
                this.clearSelection();
            }
        }
    }

    private handleMouseMove(e: MouseEvent): void {
        const point = this.getMousePosition(e);
        this.currentMousePosition = point;
        
        if (this.isPanning && this.dragStartPosition) {
            const dx = point.x - this.dragStartPosition.x;
            const dy = point.y - this.dragStartPosition.y;
            this.viewportX += dx / this.zoom;
            this.viewportY += dy / this.zoom;
            this.dragStartPosition = point;
            this.updateTransform();
        } else if (this.isDragging && this.dragStartPosition) {
            const dx = (point.x - this.dragStartPosition.x) / this.zoom;
            const dy = (point.y - this.dragStartPosition.y) / this.zoom;
            
            this.selectedNodes.forEach(nodeId => {
                const node = this.nodes.get(nodeId);
                if (node) {
                    const pos = node.getPosition();
                    node.setPosition({
                        x: pos.x + dx,
                        y: pos.y + dy
                    });
                }
            });
            
            this.dragStartPosition = point;
            this.render();
        } else if (this.isConnecting && this.tempConnectionLine) {
            const svgPoint = this.getSVGPoint(point);
            this.tempConnectionLine.setAttribute('x2', svgPoint.x.toString());
            this.tempConnectionLine.setAttribute('y2', svgPoint.y.toString());
        }
    }

    private handleMouseUp(e: MouseEvent): void {
        if (this.isConnecting) {
            const point = this.getMousePosition(e);
            const targetNode = this.getNodeAt(point);
            
            if (targetNode && targetNode !== this.connectionSourceNode) {
                this.createEdge(this.connectionSourceNode!, targetNode);
            }
            
            this.endConnection();
        }
        
        this.isDragging = false;
        this.isPanning = false;
        this.dragStartPosition = undefined;
        this.svg.style.cursor = 'grab';
    }

    private handleWheel(e: WheelEvent): void {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? -this.options.zoomStep : this.options.zoomStep;
        const newZoom = Math.max(this.options.zoomMin, Math.min(this.options.zoomMax, this.zoom + delta));
        
        if (newZoom !== this.zoom) {
            const point = this.getMousePosition(e);
            const scaleFactor = newZoom / this.zoom;
            
            this.viewportX = point.x - (point.x - this.viewportX) * scaleFactor;
            this.viewportY = point.y - (point.y - this.viewportY) * scaleFactor;
            
            this.zoom = newZoom;
            this.updateTransform();
        }
    }

    private handleContextMenu(e: MouseEvent): void {
        e.preventDefault();
        const point = this.getMousePosition(e);
        const clickedNode = this.getNodeAt(point);
        const clickedEdge = this.getEdgeAt(point);
        
        if (clickedNode) {
            this.showNodeContextMenu(clickedNode, point);
        } else if (clickedEdge) {
            this.showEdgeContextMenu(clickedEdge, point);
        }
    }

    private handleKeyDown(e: KeyboardEvent): void {
        if (!this.container.contains(document.activeElement)) return;
        
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            this.deleteSelected();
        } else if (e.key === 'a' && e.ctrlKey) {
            e.preventDefault();
            this.selectAll();
        } else if (e.key === 'Escape') {
            this.clearSelection();
        }
    }

    private getMousePosition(e: MouseEvent): NodePosition {
        const rect = this.svg.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    private getSVGPoint(point: NodePosition): NodePosition {
        return {
            x: (point.x - this.viewportX) / this.zoom,
            y: (point.y - this.viewportY) / this.zoom
        };
    }

    private getNodeAt(point: NodePosition): string | null {
        const svgPoint = this.getSVGPoint(point);
        
        for (const [id, node] of this.nodes) {
            if (node.containsPoint(svgPoint.x, svgPoint.y)) {
                return id;
            }
        }
        
        return null;
    }

    private getEdgeAt(point: NodePosition): string | null {
        const svgPoint = this.getSVGPoint(point);
        const threshold = 5;
        
        for (const [id, edge] of this.edges) {
            const source = this.nodes.get(edge.getSourceNodeId());
            const target = this.nodes.get(edge.getTargetNodeId());
            
            if (source && target) {
                const labelPos = edge.getLabelPosition(source, target);
                const distance = Math.sqrt(
                    Math.pow(svgPoint.x - labelPos.x, 2) +
                    Math.pow(svgPoint.y - labelPos.y, 2)
                );
                
                if (distance < threshold) {
                    return id;
                }
            }
        }
        
        return null;
    }

    private startConnection(nodeId: string): void {
        this.isConnecting = true;
        this.connectionSourceNode = nodeId;
        
        const node = this.nodes.get(nodeId);
        if (!node) return;
        
        const svgNS = 'http://www.w3.org/2000/svg';
        this.tempConnectionLine = document.createElementNS(svgNS, 'line') as SVGLineElement;
        
        const sourcePoint = node.getConnectionPoints().right;
        this.tempConnectionLine.setAttribute('x1', sourcePoint.x.toString());
        this.tempConnectionLine.setAttribute('y1', sourcePoint.y.toString());
        this.tempConnectionLine.setAttribute('x2', sourcePoint.x.toString());
        this.tempConnectionLine.setAttribute('y2', sourcePoint.y.toString());
        this.tempConnectionLine.setAttribute('stroke', 'var(--text-accent)');
        this.tempConnectionLine.setAttribute('stroke-width', '2');
        this.tempConnectionLine.setAttribute('stroke-dasharray', '5,5');
        this.tempConnectionLine.setAttribute('opacity', '0.6');
        
        this.overlayGroup.appendChild(this.tempConnectionLine);
    }

    private endConnection(): void {
        this.isConnecting = false;
        this.connectionSourceNode = undefined;
        
        if (this.tempConnectionLine) {
            this.tempConnectionLine.remove();
            this.tempConnectionLine = undefined;
        }
    }

    private createEdge(sourceId: string, targetId: string): void {
        const edge = VisualQueryEdge.createProperty(
            sourceId,
            targetId,
            'property',
            undefined
        );
        
        this.edges.set(edge.getId(), edge);
        this.render();
        this.updateQuery();
    }

    private selectNode(nodeId: string): void {
        this.selectedNodes.add(nodeId);
        const node = this.nodes.get(nodeId);
        if (node) {
            node.setSelected(true);
        }
        this.render();
    }

    private selectEdge(edgeId: string): void {
        this.selectedEdges.add(edgeId);
        const edge = this.edges.get(edgeId);
        if (edge) {
            edge.setSelected(true);
        }
        this.render();
    }

    private toggleNodeSelection(nodeId: string): void {
        if (this.selectedNodes.has(nodeId)) {
            this.selectedNodes.delete(nodeId);
            const node = this.nodes.get(nodeId);
            if (node) {
                node.setSelected(false);
            }
        } else {
            this.selectNode(nodeId);
        }
        this.render();
    }

    private clearSelection(): void {
        this.selectedNodes.forEach(id => {
            const node = this.nodes.get(id);
            if (node) node.setSelected(false);
        });
        this.selectedEdges.forEach(id => {
            const edge = this.edges.get(id);
            if (edge) edge.setSelected(false);
        });
        
        this.selectedNodes.clear();
        this.selectedEdges.clear();
        this.render();
    }

    private selectAll(): void {
        this.nodes.forEach((node, id) => {
            this.selectedNodes.add(id);
            node.setSelected(true);
        });
        this.edges.forEach((edge, id) => {
            this.selectedEdges.add(id);
            edge.setSelected(true);
        });
        this.render();
    }

    private deleteSelected(): void {
        this.selectedEdges.forEach(id => {
            this.edges.delete(id);
        });
        
        this.selectedNodes.forEach(id => {
            this.edges.forEach((edge, edgeId) => {
                if (edge.getSourceNodeId() === id || edge.getTargetNodeId() === id) {
                    this.edges.delete(edgeId);
                }
            });
            this.nodes.delete(id);
        });
        
        this.clearSelection();
        this.render();
        this.updateQuery();
    }

    private showNodeContextMenu(nodeId: string, position: NodePosition): void {
        const node = this.nodes.get(nodeId);
        if (!node) return;
        
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.cssText = `
            position: absolute;
            left: ${position.x}px;
            top: ${position.y}px;
            background: var(--background-secondary);
            border: 1px solid var(--background-modifier-border);
            border-radius: var(--radius-s);
            padding: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            z-index: 1000;
        `;
        
        const editOption = this.createMenuOption('Edit Label', () => {
            const newLabel = prompt('Enter new label:', node.getLabel());
            if (newLabel) {
                node.setLabel(newLabel);
                this.render();
                this.updateQuery();
            }
            menu.remove();
        });
        
        const deleteOption = this.createMenuOption('Delete', () => {
            this.nodes.delete(nodeId);
            this.edges.forEach((edge, id) => {
                if (edge.getSourceNodeId() === nodeId || edge.getTargetNodeId() === nodeId) {
                    this.edges.delete(id);
                }
            });
            this.render();
            this.updateQuery();
            menu.remove();
        });
        
        menu.appendChild(editOption);
        menu.appendChild(deleteOption);
        this.container.appendChild(menu);
        
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 10);
    }

    private showEdgeContextMenu(edgeId: string, position: NodePosition): void {
        const edge = this.edges.get(edgeId);
        if (!edge) return;
        
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.cssText = `
            position: absolute;
            left: ${position.x}px;
            top: ${position.y}px;
            background: var(--background-secondary);
            border: 1px solid var(--background-modifier-border);
            border-radius: var(--radius-s);
            padding: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            z-index: 1000;
        `;
        
        const editOption = this.createMenuOption('Edit Property', () => {
            const newLabel = prompt('Enter property name:', edge.getLabel());
            if (newLabel) {
                edge.setLabel(newLabel);
                this.render();
                this.updateQuery();
            }
            menu.remove();
        });
        
        const toggleOptionalOption = this.createMenuOption(
            edge.isOptional() ? 'Make Required' : 'Make Optional',
            () => {
                const newEdge = edge.isOptional()
                    ? VisualQueryEdge.createProperty(
                        edge.getSourceNodeId(),
                        edge.getTargetNodeId(),
                        edge.getLabel(),
                        edge.getPropertyUri()
                    )
                    : VisualQueryEdge.createOptional(
                        edge.getSourceNodeId(),
                        edge.getTargetNodeId(),
                        edge.getLabel(),
                        edge.getPropertyUri()
                    );
                
                this.edges.delete(edgeId);
                this.edges.set(newEdge.getId(), newEdge);
                this.render();
                this.updateQuery();
                menu.remove();
            }
        );
        
        const deleteOption = this.createMenuOption('Delete', () => {
            this.edges.delete(edgeId);
            this.render();
            this.updateQuery();
            menu.remove();
        });
        
        menu.appendChild(editOption);
        menu.appendChild(toggleOptionalOption);
        menu.appendChild(deleteOption);
        this.container.appendChild(menu);
        
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 10);
    }

    private createMenuOption(label: string, onClick: () => void): HTMLDivElement {
        const option = document.createElement('div');
        option.textContent = label;
        option.style.cssText = `
            padding: 6px 12px;
            cursor: pointer;
            border-radius: var(--radius-s);
            font-size: 12px;
            transition: background-color 0.15s ease;
        `;
        
        option.addEventListener('mouseenter', () => {
            option.style.background = 'var(--background-modifier-hover)';
        });
        
        option.addEventListener('mouseleave', () => {
            option.style.background = '';
        });
        
        option.addEventListener('click', onClick);
        return option;
    }

    private updateTransform(): void {
        const transform = `translate(${this.viewportX}px, ${this.viewportY}px) scale(${this.zoom})`;
        this.nodesGroup.style.transform = transform;
        this.edgesGroup.style.transform = transform;
        this.gridGroup.style.transform = transform;
    }

    private render(): void {
        this.renderEdges();
        this.renderNodes();
    }

    private renderNodes(): void {
        const svgNS = 'http://www.w3.org/2000/svg';
        this.nodesGroup.innerHTML = '';
        
        this.nodes.forEach(node => {
            const g = document.createElementNS(svgNS, 'g') as SVGGElement;
            g.setAttribute('class', 'query-node');
            
            const pos = node.getPosition();
            const dims = node.getDimensions();
            
            const rect = document.createElementNS(svgNS, 'rect') as SVGRectElement;
            rect.setAttribute('x', pos.x.toString());
            rect.setAttribute('y', pos.y.toString());
            rect.setAttribute('width', dims.width.toString());
            rect.setAttribute('height', dims.height.toString());
            rect.setAttribute('rx', '4');
            rect.setAttribute('ry', '4');
            
            const colors = this.getNodeColors(node.getType());
            rect.setAttribute('fill', colors.fill);
            rect.setAttribute('stroke', node.isSelected() ? 'var(--text-accent)' : colors.stroke);
            rect.setAttribute('stroke-width', node.isSelected() ? '2' : '1');
            
            const text = document.createElementNS(svgNS, 'text') as SVGTextElement;
            text.setAttribute('x', (pos.x + dims.width / 2).toString());
            text.setAttribute('y', (pos.y + dims.height / 2 + 4).toString());
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', colors.text);
            text.setAttribute('font-size', '12');
            text.setAttribute('font-weight', '500');
            text.textContent = node.getLabel();
            
            g.appendChild(rect);
            g.appendChild(text);
            
            this.nodesGroup.appendChild(g);
        });
    }

    private renderEdges(): void {
        const svgNS = 'http://www.w3.org/2000/svg';
        this.edgesGroup.innerHTML = '';
        
        this.edges.forEach(edge => {
            const source = this.nodes.get(edge.getSourceNodeId());
            const target = this.nodes.get(edge.getTargetNodeId());
            
            if (!source || !target) return;
            
            const g = document.createElementNS(svgNS, 'g') as SVGGElement;
            g.setAttribute('class', 'query-edge');
            
            const path = document.createElementNS(svgNS, 'path') as SVGPathElement;
            path.setAttribute('d', edge.calculatePath(source, target));
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', edge.isSelected() ? 'var(--text-accent)' : 'var(--text-muted)');
            path.setAttribute('stroke-width', edge.isSelected() ? '2' : '1');
            
            if (edge.isOptional()) {
                path.setAttribute('stroke-dasharray', '5,5');
            }
            
            const labelPos = edge.getLabelPosition(source, target);
            const labelBg = document.createElementNS(svgNS, 'rect') as SVGRectElement;
            const labelText = document.createElementNS(svgNS, 'text') as SVGTextElement;
            
            labelText.setAttribute('x', labelPos.x.toString());
            labelText.setAttribute('y', labelPos.y.toString());
            labelText.setAttribute('text-anchor', 'middle');
            labelText.setAttribute('fill', 'var(--text-normal)');
            labelText.setAttribute('font-size', '10');
            labelText.textContent = edge.getLabel();
            
            const bbox = { width: edge.getLabel().length * 6 + 8, height: 16 };
            labelBg.setAttribute('x', (labelPos.x - bbox.width / 2).toString());
            labelBg.setAttribute('y', (labelPos.y - bbox.height / 2).toString());
            labelBg.setAttribute('width', bbox.width.toString());
            labelBg.setAttribute('height', bbox.height.toString());
            labelBg.setAttribute('fill', 'var(--background-primary)');
            labelBg.setAttribute('rx', '2');
            
            g.appendChild(path);
            g.appendChild(labelBg);
            g.appendChild(labelText);
            
            this.edgesGroup.appendChild(g);
        });
    }

    private getNodeColors(type: NodeType): { fill: string; stroke: string; text: string } {
        const isDark = document.body.classList.contains('theme-dark');
        
        const lightColors = {
            [NodeType.ENTITY]: { fill: '#e3f2fd', stroke: '#1976d2', text: '#0d47a1' },
            [NodeType.VARIABLE]: { fill: '#fff3e0', stroke: '#f57c00', text: '#e65100' },
            [NodeType.LITERAL]: { fill: '#f3e5f5', stroke: '#7b1fa2', text: '#4a148c' },
            [NodeType.FILTER]: { fill: '#e8f5e8', stroke: '#388e3c', text: '#1b5e20' }
        };
        
        const darkColors = {
            [NodeType.ENTITY]: { fill: 'rgba(33, 150, 243, 0.2)', stroke: '#2196f3', text: '#90caf9' },
            [NodeType.VARIABLE]: { fill: 'rgba(255, 152, 0, 0.2)', stroke: '#ff9800', text: '#ffb74d' },
            [NodeType.LITERAL]: { fill: 'rgba(156, 39, 176, 0.2)', stroke: '#9c27b0', text: '#ce93d8' },
            [NodeType.FILTER]: { fill: 'rgba(76, 175, 80, 0.2)', stroke: '#4caf50', text: '#81c784' }
        };
        
        return isDark ? darkColors[type] : lightColors[type];
    }

    // Overloaded method for adding nodes
    addNode(node: VisualQueryNode): void;
    addNode(type: NodeType): void;
    addNode(nodeOrType: VisualQueryNode | NodeType): void {
        if (typeof nodeOrType === 'object' && 'getId' in nodeOrType) {
            // Direct node addition for testing/programmatic use
            const node = nodeOrType as VisualQueryNode;
            this.nodes.set(node.getId(), node);
            this.options.onNodeSelect?.(node);
            this.render();
            this.updateQuery();
            return;
        }
        
        // Interactive node creation
        const type = nodeOrType as NodeType;
        const centerX = (this.options.width / 2 - this.viewportX) / this.zoom;
        const centerY = (this.options.height / 2 - this.viewportY) / this.zoom;
        
        let node: VisualQueryNode;
        
        switch (type) {
            case NodeType.ENTITY:
                const entityName = prompt('Enter entity name:');
                if (!entityName) return;
                node = VisualQueryNode.createEntity(entityName, undefined, { x: centerX, y: centerY });
                break;
            case NodeType.VARIABLE:
                const varName = prompt('Enter variable name (without ?):');
                if (!varName) return;
                node = VisualQueryNode.createVariable(varName, { x: centerX, y: centerY });
                break;
            case NodeType.LITERAL:
                const literalValue = prompt('Enter literal value:');
                if (!literalValue) return;
                node = VisualQueryNode.createLiteral(literalValue, { x: centerX, y: centerY });
                break;
            case NodeType.FILTER:
                const filterExpr = prompt('Enter filter expression:');
                if (!filterExpr) return;
                node = VisualQueryNode.createFilter(filterExpr, { x: centerX, y: centerY });
                break;
            default:
                return;
        }
        
        this.nodes.set(node.getId(), node);
        this.render();
        this.updateQuery();
    }

    addEdge(edge: VisualQueryEdge): void {
        // Validate that both source and target nodes exist
        const sourceExists = this.nodes.has(edge.getSourceNodeId());
        const targetExists = this.nodes.has(edge.getTargetNodeId());
        
        if (!sourceExists || !targetExists) {
            console.warn('Cannot add edge: source or target node not found');
            return;
        }
        
        this.edges.set(edge.getId(), edge);
        this.options.onEdgeSelect?.(edge);
        this.render();
        this.updateQuery();
    }

    getSelectedNodes(): string[] {
        return Array.from(this.selectedNodes);
    }

    getSelectedEdges(): string[] {
        return Array.from(this.selectedEdges);
    }


    exportToSVG(): string {
        const serializer = new XMLSerializer();
        return serializer.serializeToString(this.svg);
    }

    private updateQuery(): void {
        const sparql = this.generateSPARQL();
        this.options.onQueryChange(sparql);
        if ((this.options as any).onQueryGenerated) {
            (this.options as any).onQueryGenerated(sparql);
        }
    }

    generateSPARQL(): string {
        if (this.nodes.size === 0) {
            const query = 'SELECT *\nWHERE {\n  ?s ?p ?o .\n}';
            this.options.onQueryGenerated?.(query);
            return query;
        }
        
        const variables = new Set<string>();
        const patterns: string[] = [];
        const filters: string[] = [];
        const optionalPatterns: string[] = [];
        
        this.nodes.forEach(node => {
            if (node.getType() === NodeType.VARIABLE) {
                variables.add(node.toSPARQLElement());
            } else if (node.getType() === NodeType.FILTER) {
                filters.push(`FILTER (${node.getLabel()})`);
            }
        });
        
        this.edges.forEach(edge => {
            const source = this.nodes.get(edge.getSourceNodeId());
            const target = this.nodes.get(edge.getTargetNodeId());
            
            if (source && target) {
                const pattern = `${source.toSPARQLElement()} ${edge.toSPARQLPredicate()} ${target.toSPARQLElement()}`;
                
                if (edge.isOptional()) {
                    optionalPatterns.push(pattern);
                } else {
                    patterns.push(pattern);
                }
                
                if (source.getType() === NodeType.VARIABLE) {
                    variables.add(source.toSPARQLElement());
                }
                if (target.getType() === NodeType.VARIABLE) {
                    variables.add(target.toSPARQLElement());
                }
            }
        });
        
        if (variables.size === 0 && patterns.length === 0) {
            return '';
        }
        
        let query = `SELECT ${variables.size > 0 ? Array.from(variables).join(' ') : '*'}\n`;
        query += 'WHERE {\n';
        
        patterns.forEach(pattern => {
            query += `  ${pattern} .\n`;
        });
        
        optionalPatterns.forEach(pattern => {
            query += `  OPTIONAL { ${pattern} }\n`;
        });
        
        filters.forEach(filter => {
            query += `  ${filter}\n`;
        });
        
        query += '}';
        
        this.options.onQueryGenerated?.(query);
        return query;
    }

    async executeQuery(): Promise<void> {
        const sparql = this.generateSPARQL();
        
        if (!sparql) {
            new Notice('Please create a query first');
            return;
        }

        // Call the execute query callback
        this.options.onExecuteQuery?.();
        
        if (this.sparqlProcessor) {
            try {
                const result = await this.sparqlProcessor.executeQuery(sparql);
                this.options.onExecute(sparql);
                new Notice(`Query executed: ${result.results.length} results`);
            } catch (error: any) {
                new Notice(`Query error: ${error.message}`);
            }
        } else {
            this.options.onExecute(sparql);
        }
    }

    clearCanvas(): void {
        this.nodes.clear();
        this.edges.clear();
        this.clearSelection();
        this.render();
        this.updateQuery();
    }

    private zoomIn(): void {
        this.zoom = Math.min(this.options.zoomMax, this.zoom + this.options.zoomStep);
        this.updateTransform();
    }

    private zoomOut(): void {
        this.zoom = Math.max(this.options.zoomMin, this.zoom - this.options.zoomStep);
        this.updateTransform();
    }

    private resetZoom(): void {
        this.zoom = 1;
        this.viewportX = 0;
        this.viewportY = 0;
        this.updateTransform();
    }

    private showTemplateSelection(): void {
        if (!this.options.templateUseCase) {
            new Notice('Template functionality not available');
            return;
        }

        const modalContainer = document.createElement('div');
        modalContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;

        const templatePanel = new TemplateSelectionPanel(
            modalContainer,
            this.options.templateUseCase.getTemplateRepository(),
            {
                showPreview: true,
                allowCustomTemplates: true,
                onTemplateSelect: (template) => {
                    this.loadTemplate(template);
                    modalContainer.remove();
                },
                onClose: () => {
                    modalContainer.remove();
                }
            }
        );

        document.body.appendChild(modalContainer);

        // Close on background click
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                modalContainer.remove();
            }
        });
    }

    private async loadTemplate(template: QueryTemplate): Promise<void> {
        try {
            if (template.getParameters().length > 0) {
                // Show parameter input modal
                if (!this.options.appInstance) {
                    new Notice('Cannot configure template parameters - app instance not available');
                    return;
                }

                const parameterModal = new TemplateParameterModal(
                    this.options.appInstance,
                    template,
                    {
                        onSubmit: async (configuredTemplate, parameterValues) => {
                            await this.instantiateTemplate(configuredTemplate);
                        },
                        onCancel: () => {
                            // User cancelled parameter configuration
                        }
                    }
                );

                parameterModal.open();
            } else {
                // Template has no parameters, instantiate directly
                await this.instantiateTemplate(template);
            }
        } catch (error) {
            console.error('Failed to load template:', error);
            new Notice(`Failed to load template: ${error.message}`);
        }
    }

    private async instantiateTemplate(template: QueryTemplate): Promise<void> {
        try {
            const { nodes, edges } = await this.options.templateUseCase!.instantiateTemplate(template);
            
            // Clear current canvas
            this.clearCanvas();
            
            // Add nodes to canvas
            nodes.forEach(node => {
                this.nodes.set(node.getId(), node);
            });
            
            // Add edges to canvas
            edges.forEach(edge => {
                this.edges.set(edge.getId(), edge);
            });
            
            // Update display
            this.render();
            this.updateQuery();
            
            new Notice(`Template "${template.getMetadata().name}" loaded successfully`);
        } catch (error) {
            console.error('Failed to instantiate template:', error);
            new Notice(`Failed to apply template: ${error.message}`);
        }
    }

    private showSaveTemplateModal(): void {
        if (!this.options.templateUseCase || !this.options.appInstance) {
            new Notice('Template functionality not available');
            return;
        }

        if (this.nodes.size === 0) {
            new Notice('Create a query first before saving as template');
            return;
        }

        const saveModal = new SaveTemplateModal(
            this.options.appInstance,
            {
                nodes: this.nodes,
                edges: this.edges,
                viewport: {
                    x: this.viewportX,
                    y: this.viewportY,
                    zoom: this.zoom
                },
                sparqlQuery: this.generateSPARQL(),
                onSave: async (templateData) => {
                    try {
                        const template = await this.options.templateUseCase!.createCustomTemplate(
                            this.nodes,
                            this.edges,
                            {
                                x: this.viewportX,
                                y: this.viewportY,
                                zoom: this.zoom
                            },
                            templateData.name,
                            templateData.description,
                            templateData.category,
                            templateData.tags
                        );
                        
                        new Notice(`Template "${template.getMetadata().name}" saved successfully`);
                    } catch (error) {
                        console.error('Failed to save template:', error);
                        new Notice(`Failed to save template: ${error.message}`);
                    }
                },
                onCancel: () => {
                    // User cancelled save
                }
            }
        );

        saveModal.open();
    }

    loadFromTemplate(template: QueryTemplate): void {
        this.loadTemplate(template);
    }

    getCurrentCanvasState(): {
        nodes: Map<string, VisualQueryNode>;
        edges: Map<string, VisualQueryEdge>;
        viewport: { x: number; y: number; zoom: number };
    } {
        return {
            nodes: new Map(this.nodes),
            edges: new Map(this.edges),
            viewport: {
                x: this.viewportX,
                y: this.viewportY,
                zoom: this.zoom
            }
        };
    }

    // Public getters for testing and external access
    getNodes(): Map<string, VisualQueryNode> {
        return new Map(this.nodes);
    }

    getEdges(): Map<string, VisualQueryEdge> {
        return new Map(this.edges);
    }

    removeNode(nodeId: string): void {
        // Remove associated edges first
        this.edges.forEach((edge, edgeId) => {
            if (edge.getSourceNodeId() === nodeId || edge.getTargetNodeId() === nodeId) {
                this.edges.delete(edgeId);
            }
        });
        
        // Remove the node
        this.nodes.delete(nodeId);
        
        // Update selection
        this.selectedNodes.delete(nodeId);
        
        // Re-render and update query
        this.render();
        this.updateQuery();
    }

    removeEdge(edgeId: string): void {
        this.edges.delete(edgeId);
        this.selectedEdges.delete(edgeId);
        this.render();
        this.updateQuery();
    }

    zoomToFit(): void {
        if (this.nodes.size === 0) {
            this.resetZoom();
            return;
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        this.nodes.forEach(node => {
            const pos = node.getPosition();
            const dims = node.getDimensions();
            minX = Math.min(minX, pos.x);
            minY = Math.min(minY, pos.y);
            maxX = Math.max(maxX, pos.x + dims.width);
            maxY = Math.max(maxY, pos.y + dims.height);
        });

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        const centerX = minX + contentWidth / 2;
        const centerY = minY + contentHeight / 2;

        // Calculate zoom to fit with padding
        const padding = 50;
        const availableWidth = this.options.width - 2 * padding;
        const availableHeight = this.options.height - 2 * padding;
        const scaleX = availableWidth / contentWidth;
        const scaleY = availableHeight / contentHeight;
        const newZoom = Math.min(scaleX, scaleY, this.options.zoomMax);

        // Set new zoom and center viewport
        this.zoom = Math.max(this.options.zoomMin, newZoom);
        this.viewportX = this.options.width / 2 - centerX * this.zoom;
        this.viewportY = this.options.height / 2 - centerY * this.zoom;
        
        this.updateTransform();
    }

    exportToJSON(): string {
        const canvasData = {
            version: '1.0',
            nodes: Array.from(this.nodes.entries()).map(([id, node]) => ({
                id,
                type: node.getType(),
                label: node.getLabel(),
                position: node.getPosition(),
                uri: (node as any).getEntityUri ? (node as any).getEntityUri() : undefined
            })),
            edges: Array.from(this.edges.entries()).map(([id, edge]) => ({
                id,
                sourceNodeId: edge.getSourceNodeId(),
                targetNodeId: edge.getTargetNodeId(),
                label: edge.getLabel(),
                type: edge.getType(),
                optional: edge.isOptional(),
                propertyUri: edge.getPropertyUri()
            })),
            viewport: {
                x: this.viewportX,
                y: this.viewportY,
                zoom: this.zoom
            }
        };
        return JSON.stringify(canvasData, null, 2);
    }

    importFromJSON(jsonString: string): boolean {
        try {
            const data = JSON.parse(jsonString);
            
            // Validate format
            if (!data.nodes || !data.edges) {
                console.warn('Invalid canvas data format');
                return false;
            }

            // Clear current content
            this.clearCanvas();

            // Import nodes
            data.nodes.forEach((nodeData: any) => {
                try {
                    let node: VisualQueryNode;
                    switch (nodeData.type) {
                        case NodeType.ENTITY:
                            node = VisualQueryNode.createEntity(
                                nodeData.label,
                                nodeData.uri,
                                nodeData.position
                            );
                            break;
                        case NodeType.VARIABLE:
                            node = VisualQueryNode.createVariable(
                                nodeData.label,
                                nodeData.position
                            );
                            break;
                        case NodeType.LITERAL:
                            node = VisualQueryNode.createLiteral(
                                nodeData.label,
                                nodeData.position
                            );
                            break;
                        case NodeType.FILTER:
                            node = VisualQueryNode.createFilter(
                                nodeData.label,
                                nodeData.position
                            );
                            break;
                        default:
                            console.warn(`Unknown node type: ${nodeData.type}`);
                            return;
                    }
                    this.nodes.set(nodeData.id, node);
                } catch (error) {
                    console.warn(`Failed to import node ${nodeData.id}:`, error);
                }
            });

            // Import edges
            data.edges.forEach((edgeData: any) => {
                try {
                    let edge: VisualQueryEdge;
                    if (edgeData.optional) {
                        edge = VisualQueryEdge.createOptional(
                            edgeData.sourceNodeId,
                            edgeData.targetNodeId,
                            edgeData.label,
                            edgeData.propertyUri
                        );
                    } else {
                        edge = VisualQueryEdge.createProperty(
                            edgeData.sourceNodeId,
                            edgeData.targetNodeId,
                            edgeData.label,
                            edgeData.propertyUri
                        );
                    }
                    this.edges.set(edgeData.id, edge);
                } catch (error) {
                    console.warn(`Failed to import edge ${edgeData.id}:`, error);
                }
            });

            // Restore viewport
            if (data.viewport) {
                this.viewportX = data.viewport.x || 0;
                this.viewportY = data.viewport.y || 0;
                this.zoom = data.viewport.zoom || 1;
                this.updateTransform();
            }

            // Re-render
            this.render();
            this.updateQuery();
            
            return true;
        } catch (error) {
            console.warn('Failed to import canvas data:', error);
            return false;
        }
    }

    destroy(): void {
        this.svg.removeEventListener('mousedown', this.handleMouseDown.bind(this));
        this.svg.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        this.svg.removeEventListener('mouseup', this.handleMouseUp.bind(this));
        this.svg.removeEventListener('wheel', this.handleWheel.bind(this));
        this.svg.removeEventListener('contextmenu', this.handleContextMenu.bind(this));
        
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Clear all nodes and edges to ensure cleanup
        this.nodes.clear();
        this.edges.clear();
        this.clearSelection();
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}