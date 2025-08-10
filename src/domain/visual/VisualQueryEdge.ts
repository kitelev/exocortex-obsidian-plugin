import { VisualQueryNode } from './VisualQueryNode';

export enum EdgeType {
    PROPERTY = 'property',
    OPTIONAL = 'optional',
    UNION = 'union',
    FILTER_CONDITION = 'filter_condition'
}

export class VisualQueryEdge {
    private readonly id: string;
    private readonly sourceNodeId: string;
    private readonly targetNodeId: string;
    private readonly type: EdgeType;
    private label: string;
    private propertyUri?: string;
    private selected: boolean = false;
    private valid: boolean = true;
    private errors: string[] = [];

    constructor(params: {
        id: string;
        sourceNodeId: string;
        targetNodeId: string;
        type: EdgeType;
        label: string;
        propertyUri?: string;
    }) {
        this.id = params.id;
        this.sourceNodeId = params.sourceNodeId;
        this.targetNodeId = params.targetNodeId;
        this.type = params.type;
        this.label = params.label;
        this.propertyUri = params.propertyUri;
        Object.freeze(this.id);
        Object.freeze(this.sourceNodeId);
        Object.freeze(this.targetNodeId);
        Object.freeze(this.type);
    }

    getId(): string {
        return this.id;
    }

    getSourceNodeId(): string {
        return this.sourceNodeId;
    }

    getTargetNodeId(): string {
        return this.targetNodeId;
    }

    getType(): EdgeType {
        return this.type;
    }

    getLabel(): string {
        return this.label;
    }

    setLabel(label: string): void {
        this.label = label;
    }

    getPropertyUri(): string | undefined {
        return this.propertyUri;
    }

    setPropertyUri(uri: string): void {
        this.propertyUri = uri;
    }

    isSelected(): boolean {
        return this.selected;
    }

    setSelected(selected: boolean): void {
        this.selected = selected;
    }

    isValid(): boolean {
        return this.valid;
    }

    setValid(valid: boolean, errors?: string[]): void {
        this.valid = valid;
        this.errors = errors || [];
    }

    getErrors(): string[] {
        return [...this.errors];
    }

    isOptional(): boolean {
        return this.type === EdgeType.OPTIONAL;
    }

    toSPARQLPredicate(): string {
        if (this.propertyUri) {
            return `<${this.propertyUri}>`;
        }
        
        if (this.label.startsWith('?')) {
            return this.label;
        }
        
        if (this.label.includes(':')) {
            return this.label;
        }
        
        return `?${this.label.toLowerCase().replace(/\s+/g, '_')}`;
    }

    calculatePath(sourceNode: VisualQueryNode, targetNode: VisualQueryNode): string {
        const sourcePoint = sourceNode.getConnectionPoints();
        const targetPoint = targetNode.getConnectionPoints();
        
        // Simple direct path for now - can be enhanced with curved paths
        const sx = sourcePoint.right.x;
        const sy = sourcePoint.right.y;
        const tx = targetPoint.left.x;
        const ty = targetPoint.left.y;
        
        // Calculate control points for smooth curve
        const dx = tx - sx;
        const dy = ty - sy;
        const cx1 = sx + dx * 0.5;
        const cy1 = sy;
        const cx2 = sx + dx * 0.5;
        const cy2 = ty;
        
        return `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`;
    }

    getLabelPosition(sourceNode: VisualQueryNode, targetNode: VisualQueryNode): { x: number; y: number } {
        const sourcePoint = sourceNode.getConnectionPoints().right;
        const targetPoint = targetNode.getConnectionPoints().left;
        
        return {
            x: (sourcePoint.x + targetPoint.x) / 2,
            y: (sourcePoint.y + targetPoint.y) / 2
        };
    }

    clone(): VisualQueryEdge {
        return new VisualQueryEdge({
            id: `${this.id}_clone_${Date.now()}`,
            sourceNodeId: this.sourceNodeId,
            targetNodeId: this.targetNodeId,
            type: this.type,
            label: this.label,
            propertyUri: this.propertyUri
        });
    }

    static createProperty(
        sourceNodeId: string,
        targetNodeId: string,
        label: string,
        propertyUri?: string
    ): VisualQueryEdge {
        return new VisualQueryEdge({
            id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sourceNodeId,
            targetNodeId,
            type: EdgeType.PROPERTY,
            label,
            propertyUri
        });
    }

    static createOptional(
        sourceNodeId: string,
        targetNodeId: string,
        label: string,
        propertyUri?: string
    ): VisualQueryEdge {
        return new VisualQueryEdge({
            id: `optional_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sourceNodeId,
            targetNodeId,
            type: EdgeType.OPTIONAL,
            label,
            propertyUri
        });
    }

    static createFilterCondition(
        sourceNodeId: string,
        targetNodeId: string,
        label: string
    ): VisualQueryEdge {
        return new VisualQueryEdge({
            id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sourceNodeId,
            targetNodeId,
            type: EdgeType.FILTER_CONDITION,
            label
        });
    }
}