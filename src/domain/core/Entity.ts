/**
 * Domain Event interface for type safety
 */
export interface DomainEvent {
  readonly eventType: string;
  readonly aggregateId: string;
  readonly occurredOn: Date;
  readonly eventData: Record<string, any>;
}

/**
 * Base Entity class for Domain-Driven Design
 * Entities have identity and lifecycle
 */
export abstract class Entity<T> {
  protected readonly _id: any; // Allow flexible ID types including AssetId
  protected props: T;
  private _domainEvents: DomainEvent[] = [];

  protected constructor(props: T, id?: any) {
    this._id = id ?? this.generateId();
    this.props = props;
  }

  /**
   * Method for generating entity ID
   * Each entity can override this with its own ID generation strategy
   */
  protected generateId(): any {
    // Default implementation - can be overridden by subclasses
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Get the entity's unique identifier
   */
  public get id(): any {
    return this._id;
  }

  /**
   * Entities are equal if they have the same ID and type
   */
  public equals(object?: Entity<T>): boolean {
    if (object === null || object === undefined) {
      return false;
    }

    if (this === object) {
      return true;
    }

    if (!this.isEntity(object) || object.constructor !== this.constructor) {
      return false;
    }

    return this._id === object._id;
  }

  private isEntity(v: any): v is Entity<any> {
    return v instanceof Entity;
  }

  /**
   * Domain events for cross-aggregate communication
   */
  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  protected createDomainEvent(
    eventType: string,
    eventData: Record<string, any> = {},
  ): DomainEvent {
    return {
      eventType,
      aggregateId: this._id.toString(),
      occurredOn: new Date(),
      eventData,
    };
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }

  public get domainEvents(): DomainEvent[] {
    return [...this._domainEvents]; // Return copy to prevent mutation
  }

  protected getDomainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  protected clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Validation method that each entity can override
   */
  protected validate(): void {
    // Default implementation - subclasses should override for specific validation
  }

  /**
   * Check if entity is in a valid state
   */
  public isValid(): boolean {
    try {
      this.validate();
      return true;
    } catch {
      return false;
    }
  }
}
