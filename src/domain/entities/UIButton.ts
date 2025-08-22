import { Entity } from "../core/Entity";
import { AssetId } from "../value-objects/AssetId";
import { Result } from "../core/Result";

/**
 * Domain Entity representing a UI Button
 * Following DDD principles - this is a domain entity with business logic
 */
export interface UIButtonProps {
  id: AssetId;
  label: string;
  commandId: AssetId;
  order?: number;
  isEnabled?: boolean;
  tooltip?: string;
}

export class UIButton extends Entity<UIButtonProps> {
  private constructor(props: UIButtonProps) {
    super(props, props.id.toString());
  }

  protected generateId(): string {
    return this.props.id.toString();
  }

  protected validate(): void {
    if (!this.props.id) {
      throw new Error("UIButton must have a valid ID");
    }
    
    if (!this.props.label || this.props.label.trim().length === 0) {
      throw new Error("UIButton must have a non-empty label");
    }
    
    if (!this.props.commandId) {
      throw new Error("UIButton must have a valid command ID");
    }
  }

  /**
   * Factory method following DDD pattern
   */
  public static create(props: UIButtonProps): Result<UIButton> {
    // Business rules validation
    if (!props.label || props.label.trim().length === 0) {
      return Result.fail<UIButton>("Button label cannot be empty");
    }

    if (props.label.length > 100) {
      return Result.fail<UIButton>("Button label cannot exceed 100 characters");
    }

    if (!props.commandId) {
      return Result.fail<UIButton>("Button must have an associated command");
    }

    return Result.ok<UIButton>(
      new UIButton({
        ...props,
        isEnabled: props.isEnabled ?? true,
        order: props.order ?? 0,
      }),
    );
  }

  // Getters following encapsulation principle
  get id(): AssetId {
    return this.props.id;
  }

  get label(): string {
    return this.props.label;
  }

  get commandId(): AssetId {
    return this.props.commandId;
  }

  get order(): number {
    return this.props.order ?? 0;
  }

  get isEnabled(): boolean {
    return this.props.isEnabled ?? true;
  }

  get tooltip(): string | undefined {
    return this.props.tooltip;
  }

  /**
   * Business logic - button can be clicked only if enabled
   */
  public canExecute(): boolean {
    return this.isEnabled;
  }

  /**
   * Domain event when button is clicked
   */
  public click(): Result<void> {
    if (!this.canExecute()) {
      return Result.fail<void>("Button is disabled and cannot be clicked");
    }

    // Domain event would be raised here
    this.addDomainEvent({
      aggregateId: this.id.toString(),
      eventType: "ButtonClicked",
      occurredOn: new Date(),
      eventData: {
        buttonId: this.id.toString(),
        commandId: this.commandId.toString(),
        label: this.label,
      },
    });

    return Result.ok<void>();
  }

  /**
   * Business logic to update button state
   */
  public enable(): void {
    this.props.isEnabled = true;
  }

  public disable(): void {
    this.props.isEnabled = false;
  }

  public updateLabel(newLabel: string): Result<void> {
    if (!newLabel || newLabel.trim().length === 0) {
      return Result.fail<void>("Button label cannot be empty");
    }

    if (newLabel.length > 100) {
      return Result.fail<void>("Button label cannot exceed 100 characters");
    }

    this.props.label = newLabel;
    return Result.ok<void>();
  }
}
