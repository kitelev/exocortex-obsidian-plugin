import { Entity } from "../core/Entity";
import { Result } from "../core/Result";

export interface SimplifiedLayoutBlockProps {
  targetClass: string;
  displayProperties: string[]; // Array of property references like "[[ems__Effort_status]]"
  enabled: boolean;
  priority: number;
}

export class SimplifiedLayoutBlock extends Entity<SimplifiedLayoutBlockProps> {
  get targetClass(): string {
    return this.props.targetClass;
  }

  get displayProperties(): string[] {
    return this.props.displayProperties;
  }

  get priority(): number {
    return this.props.priority;
  }

  get enabled(): boolean {
    return this.props.enabled;
  }

  public static create(
    props: SimplifiedLayoutBlockProps,
    id?: string,
  ): Result<SimplifiedLayoutBlock> {
    if (!props.targetClass || props.targetClass.trim().length === 0) {
      return Result.fail<SimplifiedLayoutBlock>("Target class is required");
    }

    if (!props.displayProperties || props.displayProperties.length === 0) {
      return Result.fail<SimplifiedLayoutBlock>(
        "At least one display property is required",
      );
    }

    // Validate property references format
    for (const prop of props.displayProperties) {
      if (!this.isValidPropertyReference(prop)) {
        return Result.fail<SimplifiedLayoutBlock>(
          `Invalid property reference format: ${prop}. Use [[property_name]] format`,
        );
      }
    }

    const layoutBlock = new SimplifiedLayoutBlock(props, id);
    return Result.ok<SimplifiedLayoutBlock>(layoutBlock);
  }

  private static isValidPropertyReference(reference: string): boolean {
    // Check if it's in [[property_name]] format
    const wikiLinkPattern = /^\[\[[\w_]+\]\]$/;
    return wikiLinkPattern.test(reference);
  }

  public extractPropertyName(reference: string): string {
    // Extract property name from [[property_name]] format
    return reference.replace(/\[\[|\]\]/g, "");
  }

  public getPropertyNames(): string[] {
    return this.displayProperties.map((ref) => this.extractPropertyName(ref));
  }

  public addProperty(propertyReference: string): Result<void> {
    if (!SimplifiedLayoutBlock.isValidPropertyReference(propertyReference)) {
      return Result.fail<void>("Invalid property reference format");
    }

    if (this.props.displayProperties.includes(propertyReference)) {
      return Result.fail<void>("Property already exists in display list");
    }

    this.props.displayProperties.push(propertyReference);
    return Result.ok<void>();
  }

  public removeProperty(propertyReference: string): Result<void> {
    const index = this.props.displayProperties.indexOf(propertyReference);

    if (index === -1) {
      return Result.fail<void>("Property not found in display list");
    }

    this.props.displayProperties.splice(index, 1);
    return Result.ok<void>();
  }

  public reorderProperties(newOrder: string[]): Result<void> {
    // Validate that all properties are present
    if (newOrder.length !== this.props.displayProperties.length) {
      return Result.fail<void>(
        "New order must contain all existing properties",
      );
    }

    for (const prop of newOrder) {
      if (!this.props.displayProperties.includes(prop)) {
        return Result.fail<void>(`Property ${prop} not found in current list`);
      }
    }

    this.props.displayProperties = newOrder;
    return Result.ok<void>();
  }

  public setPriority(priority: number): Result<void> {
    if (priority < 0) {
      return Result.fail<void>("Priority must be non-negative");
    }

    this.props.priority = priority;
    return Result.ok<void>();
  }

  public setEnabled(enabled: boolean): void {
    this.props.enabled = enabled;
  }

  // Determine format type based on property name
  public inferFormatType(propertyName: string): string {
    const lowerName = propertyName.toLowerCase();

    if (lowerName.includes("status") || lowerName.includes("state")) {
      return "status-badge";
    }

    if (lowerName.includes("date") || lowerName.includes("time")) {
      return "date";
    }

    if (
      lowerName.includes("assignee") ||
      lowerName.includes("owner") ||
      lowerName.includes("user")
    ) {
      return "link";
    }

    return "raw";
  }
}
