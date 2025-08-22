/**
 * Base Entity class for Domain-Driven Design
 * Entities have identity and lifecycle
 */
export abstract class Entity<T> {
  protected readonly _id: string | number;
  protected props: T;
  private _domainEvents: any[] = [];

  protected constructor(props: T) {
    this.props = props;
  }

  /**
   * Entities are equal if they have the same ID
   */
  public equals(object?: Entity<T>): boolean {
    if (object === null || object === undefined) {
      return false;
    }

    if (this === object) {
      return true;
    }

    if (!this.isEntity(object)) {
      return false;
    }

    return this._id === object._id;
  }

  private isEntity(v: any): v is Entity<any> {
    return v instanceof Entity;
  }

  /**
   * Domain events
   */
  protected addDomainEvent(domainEvent: any): void {
    this._domainEvents.push(domainEvent);
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }

  public get domainEvents(): any[] {
    return this._domainEvents;
  }

  protected getDomainEvents(): any[] {
    return this._domainEvents;
  }

  protected clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
