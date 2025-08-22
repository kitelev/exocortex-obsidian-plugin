import { AggregateRoot } from "../core/AggregateRoot";
import { AssetId } from "../value-objects/AssetId";
import { ClassName } from "../value-objects/ClassName";
import { Result } from "../core/Result";
import { UIButton } from "../entities/UIButton";

/**
 * Aggregate Root for Class View Configuration
 * This aggregate manages the relationship between classes and their UI buttons
 */
export interface ClassViewProps {
  id: AssetId;
  className: ClassName;
  buttons: UIButton[];
  layoutTemplate?: string;
  displayOptions?: DisplayOptions;
}

export interface DisplayOptions {
  showProperties: boolean;
  showRelations: boolean;
  showBacklinks: boolean;
  showButtons: boolean;
  buttonPosition: "top" | "bottom" | "floating";
}

export class ClassView extends AggregateRoot<ClassViewProps> {
  private static readonly MAX_BUTTONS_PER_VIEW = 20;

  private constructor(props: ClassViewProps) {
    super(props);
  }

  /**
   * Factory method with business rules validation
   */
  public static create(props: ClassViewProps): Result<ClassView> {
    // Validate class name
    if (!props.className) {
      return Result.fail<ClassView>(
        "Class view must be associated with a class",
      );
    }

    // Validate button count
    if (props.buttons.length > ClassView.MAX_BUTTONS_PER_VIEW) {
      return Result.fail<ClassView>(
        `Class view cannot have more than ${ClassView.MAX_BUTTONS_PER_VIEW} buttons`,
      );
    }

    // Check for duplicate button orders
    const orders = props.buttons.map((b) => b.order);
    const uniqueOrders = new Set(orders);
    if (uniqueOrders.size !== orders.length) {
      return Result.fail<ClassView>(
        "Buttons cannot have duplicate order values",
      );
    }

    // Set default display options
    const defaultDisplayOptions: DisplayOptions = {
      showProperties: true,
      showRelations: true,
      showBacklinks: true,
      showButtons: true,
      buttonPosition: "top",
    };

    return Result.ok<ClassView>(
      new ClassView({
        ...props,
        displayOptions: props.displayOptions || defaultDisplayOptions,
      }),
    );
  }

  // Getters
  get id(): AssetId {
    return this.props.id;
  }

  get className(): ClassName {
    return this.props.className;
  }

  get buttons(): UIButton[] {
    // Return sorted by order
    return [...this.props.buttons].sort((a, b) => a.order - b.order);
  }

  get displayOptions(): DisplayOptions {
    return (
      this.props.displayOptions || {
        showProperties: true,
        showRelations: true,
        showBacklinks: true,
        showButtons: true,
        buttonPosition: "top",
      }
    );
  }

  /**
   * Add a button to the view
   */
  public addButton(button: UIButton): Result<void> {
    // Check max buttons limit
    if (this.props.buttons.length >= ClassView.MAX_BUTTONS_PER_VIEW) {
      return Result.fail<void>(
        `Cannot add more buttons. Maximum of ${ClassView.MAX_BUTTONS_PER_VIEW} reached`,
      );
    }

    // Check for duplicate button
    if (this.props.buttons.some((b) => b.id.equals(button.id))) {
      return Result.fail<void>("Button already exists in this view");
    }

    // Check for order conflict
    if (this.props.buttons.some((b) => b.order === button.order)) {
      return Result.fail<void>(
        `Button with order ${button.order} already exists`,
      );
    }

    this.props.buttons.push(button);

    // Raise domain event
    this.addDomainEvent({
      aggregateId: this.id.toString(),
      eventType: "ButtonAddedToClassView",
      occurredOn: new Date(),
      eventData: {
        classViewId: this.id.toString(),
        className: this.className.value,
        buttonId: button.id.toString(),
        buttonLabel: button.label,
      },
    });

    return Result.ok<void>();
  }

  /**
   * Remove a button from the view
   */
  public removeButton(buttonId: AssetId): Result<void> {
    const buttonIndex = this.props.buttons.findIndex((b) =>
      b.id.equals(buttonId),
    );

    if (buttonIndex === -1) {
      return Result.fail<void>("Button not found in this view");
    }

    const removedButton = this.props.buttons.splice(buttonIndex, 1)[0];

    // Raise domain event
    this.addDomainEvent({
      aggregateId: this.id.toString(),
      eventType: "ButtonRemovedFromClassView",
      occurredOn: new Date(),
      eventData: {
        classViewId: this.id.toString(),
        className: this.className.value,
        buttonId: removedButton.id.toString(),
      },
    });

    return Result.ok<void>();
  }

  /**
   * Reorder buttons
   */
  public reorderButtons(buttonOrders: Map<string, number>): Result<void> {
    // Validate all buttons are present
    for (const button of this.props.buttons) {
      if (!buttonOrders.has(button.id.toString())) {
        return Result.fail<void>(
          `Missing order for button ${button.id.toString()}`,
        );
      }
    }

    // Check for duplicate orders
    const orders = Array.from(buttonOrders.values());
    const uniqueOrders = new Set(orders);
    if (uniqueOrders.size !== orders.length) {
      return Result.fail<void>("Duplicate order values not allowed");
    }

    // Apply new orders
    for (const button of this.props.buttons) {
      const newOrder = buttonOrders.get(button.id.toString());
      if (newOrder !== undefined) {
        // This would normally update the button's order
        // but we need to maintain immutability
        Object.defineProperty(button, "order", { value: newOrder });
      }
    }

    // Raise domain event
    this.addDomainEvent({
      aggregateId: this.id.toString(),
      eventType: "ButtonsReordered",
      occurredOn: new Date(),
      eventData: {
        classViewId: this.id.toString(),
        className: this.className.value,
        newOrder: Array.from(buttonOrders.entries()),
      },
    });

    return Result.ok<void>();
  }

  /**
   * Update display options
   */
  public updateDisplayOptions(options: Partial<DisplayOptions>): Result<void> {
    this.props.displayOptions = {
      ...this.displayOptions,
      ...options,
    };

    // Raise domain event
    this.addDomainEvent({
      aggregateId: this.id.toString(),
      eventType: "DisplayOptionsUpdated",
      occurredOn: new Date(),
      eventData: {
        classViewId: this.id.toString(),
        className: this.className.value,
        displayOptions: this.props.displayOptions,
      },
    });

    return Result.ok<void>();
  }

  /**
   * Get enabled buttons only
   */
  public getEnabledButtons(): UIButton[] {
    return this.buttons.filter((b) => b.isEnabled);
  }

  /**
   * Check if view has any executable buttons
   */
  public hasExecutableButtons(): boolean {
    return (
      this.getEnabledButtons().length > 0 && this.displayOptions.showButtons
    );
  }

  /**
   * Find button by ID
   */
  public findButton(buttonId: AssetId): UIButton | undefined {
    return this.props.buttons.find((b) => b.id.equals(buttonId));
  }
}
