import { AggregateRoot } from "../core/AggregateRoot";
import { AssetId } from "../value-objects/AssetId";
import { ClassName } from "../value-objects/ClassName";
import { Result } from "../core/Result";

/**
 * Aggregate Root for Class View Configuration
 * This aggregate manages class display configuration
 */
export interface ClassViewProps {
  id: AssetId;
  className: ClassName;
  layoutTemplate?: string;
  displayOptions?: DisplayOptions;
}

export interface DisplayOptions {
  showProperties: boolean;
  showRelations: boolean;
  showBacklinks: boolean;
}

export class ClassView extends AggregateRoot<ClassViewProps> {

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

    // Set default display options
    const defaultDisplayOptions: DisplayOptions = {
      showProperties: true,
      showRelations: true,
      showBacklinks: true,
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


  get displayOptions(): DisplayOptions {
    return (
      this.props.displayOptions || {
        showProperties: true,
        showRelations: true,
        showBacklinks: true,
      }
    );
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



}
