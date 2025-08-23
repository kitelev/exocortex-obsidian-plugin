export enum NodeType {
  ENTITY = "entity",
  VARIABLE = "variable",
  LITERAL = "literal",
  FILTER = "filter",
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeDimensions {
  width: number;
  height: number;
}

export class VisualQueryNode {
  private readonly id: string;
  private readonly type: NodeType;
  private label: string;
  private variableName?: string;
  private uri?: string;
  private position: NodePosition;
  private dimensions: NodeDimensions;
  private selected: boolean = false;
  private valid: boolean = true;
  private errors: string[] = [];

  constructor(params: {
    id: string;
    type: NodeType;
    label: string;
    position: NodePosition;
    variableName?: string;
    uri?: string;
    dimensions?: NodeDimensions;
  }) {
    this.id = params.id;
    this.type = params.type;
    this.label = params.label;
    this.position = params.position;
    this.variableName = params.variableName;
    this.uri = params.uri;
    this.dimensions = params.dimensions || { width: 150, height: 60 };
    Object.freeze(this.id);
    Object.freeze(this.type);
  }

  getId(): string {
    return this.id;
  }

  getType(): NodeType {
    return this.type;
  }

  getLabel(): string {
    return this.label;
  }

  setLabel(label: string): void {
    this.label = label;
  }

  getVariableName(): string | undefined {
    return this.variableName;
  }

  setVariableName(name: string): void {
    this.variableName = name;
  }

  getUri(): string | undefined {
    return this.uri;
  }

  setUri(uri: string): void {
    this.uri = uri;
  }

  getPosition(): NodePosition {
    return { ...this.position };
  }

  setPosition(position: NodePosition): void {
    this.position = { ...position };
  }

  getDimensions(): NodeDimensions {
    return { ...this.dimensions };
  }

  setDimensions(dimensions: NodeDimensions): void {
    this.dimensions = { ...dimensions };
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

  containsPoint(x: number, y: number): boolean {
    return (
      x >= this.position.x &&
      x <= this.position.x + this.dimensions.width &&
      y >= this.position.y &&
      y <= this.position.y + this.dimensions.height
    );
  }

  getConnectionPoints(): {
    top: NodePosition;
    right: NodePosition;
    bottom: NodePosition;
    left: NodePosition;
  } {
    return {
      top: {
        x: this.position.x + this.dimensions.width / 2,
        y: this.position.y,
      },
      right: {
        x: this.position.x + this.dimensions.width,
        y: this.position.y + this.dimensions.height / 2,
      },
      bottom: {
        x: this.position.x + this.dimensions.width / 2,
        y: this.position.y + this.dimensions.height,
      },
      left: {
        x: this.position.x,
        y: this.position.y + this.dimensions.height / 2,
      },
    };
  }

  toQueryElement(): string {
    switch (this.type) {
      case NodeType.ENTITY:
        if (this.uri) {
          return `<${this.uri}>`;
        } else if (this.variableName) {
          return `?${this.variableName}`;
        } else {
          return `?${this.label.toLowerCase().replace(/\s+/g, "_")}`;
        }
      case NodeType.VARIABLE:
        return `?${this.variableName || this.label.toLowerCase().replace(/\s+/g, "_")}`;
      case NodeType.LITERAL:
        return `"${this.label}"`;
      case NodeType.FILTER:
        return this.label;
      default:
        return "?unknown";
    }
  }

  clone(): VisualQueryNode {
    return new VisualQueryNode({
      id: `${this.id}_clone_${Date.now()}`,
      type: this.type,
      label: this.label,
      position: { ...this.position },
      variableName: this.variableName,
      uri: this.uri,
      dimensions: { ...this.dimensions },
    });
  }

  static createEntity(
    label: string,
    uri?: string,
    position?: NodePosition,
  ): VisualQueryNode {
    return new VisualQueryNode({
      id: `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: NodeType.ENTITY,
      label,
      uri,
      position: position || { x: 0, y: 0 },
    });
  }

  static createVariable(
    name: string,
    position?: NodePosition,
  ): VisualQueryNode {
    return new VisualQueryNode({
      id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: NodeType.VARIABLE,
      label: name,
      variableName: name,
      position: position || { x: 0, y: 0 },
    });
  }

  static createLiteral(
    value: string,
    position?: NodePosition,
  ): VisualQueryNode {
    return new VisualQueryNode({
      id: `literal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: NodeType.LITERAL,
      label: value,
      position: position || { x: 0, y: 0 },
    });
  }

  static createFilter(
    expression: string,
    position?: NodePosition,
  ): VisualQueryNode {
    return new VisualQueryNode({
      id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: NodeType.FILTER,
      label: expression,
      position: position || { x: 0, y: 0 },
      dimensions: { width: 200, height: 80 },
    });
  }
}
