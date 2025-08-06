import { Entity } from './Entity';

/**
 * Aggregate Root base class for Domain-Driven Design
 * Aggregate roots are the entry points to aggregates
 */
export abstract class AggregateRoot<T> extends Entity<T> {

    protected constructor(props: T) {
        super(props);
    }

    /**
     * Get all domain events (inherits from Entity)
     */
    public getUncommittedEvents(): any[] {
        return this.getDomainEvents();
    }

    /**
     * Mark domain event for dispatch
     */
    private markDomainEventForDispatch(domainEvent: any): void {
        // This would integrate with an event bus in a full implementation
        // For now, we just mark it as ready for dispatch
        const markedEvent = {
            ...domainEvent,
            dateTimeOccurred: new Date(),
            aggregateId: this._id
        };
        
        // In a real implementation, this would be sent to a domain event dispatcher
        console.log('Domain event marked for dispatch:', markedEvent);
    }

    /**
     * Commit events
     */
    public markEventsAsCommitted(): void {
        this.clearDomainEvents();
    }
}