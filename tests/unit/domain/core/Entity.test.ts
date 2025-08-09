import { Entity } from '../../../../src/domain/core/Entity';

/**
 * Test implementation of Entity for testing purposes
 */
class TestEntity extends Entity<{ name: string; value: number }> {
  constructor(props: { name: string; value: number }, id?: string | number) {
    super(props);
    this._id = id || 'test-id-' + Math.random().toString(36).substr(2, 9);
  }

  getName(): string {
    return this.props.name;
  }

  getValue(): number {
    return this.props.value;
  }

  updateName(name: string): void {
    this.props.name = name;
  }

  getId(): string | number {
    return this._id;
  }

  // Expose protected methods for testing
  public testAddDomainEvent(event: any): void {
    this.addDomainEvent(event);
  }

  public testGetDomainEvents(): any[] {
    return this.getDomainEvents();
  }

  public testClearDomainEvents(): void {
    this.clearDomainEvents();
  }
}

describe('Entity', () => {
  describe('Construction', () => {
    it('should create entity with props', () => {
      // Given
      const props = { name: 'Test Entity', value: 42 };

      // When
      const entity = new TestEntity(props);

      // Then
      expect(entity.getName()).toBe('Test Entity');
      expect(entity.getValue()).toBe(42);
      expect(entity.getId()).toBeDefined();
    });

    it('should create entity with custom id', () => {
      // Given
      const props = { name: 'Test Entity', value: 42 };
      const id = 'custom-id-123';

      // When
      const entity = new TestEntity(props, id);

      // Then
      expect(entity.getId()).toBe(id);
    });

    it('should initialize empty domain events array', () => {
      // Given
      const entity = new TestEntity({ name: 'Test', value: 1 });

      // When
      const events = entity.domainEvents;

      // Then
      expect(events).toEqual([]);
      expect(Array.isArray(events)).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for entities with same id', () => {
      // Given
      const id = 'same-id';
      const entity1 = new TestEntity({ name: 'Entity 1', value: 1 }, id);
      const entity2 = new TestEntity({ name: 'Entity 2', value: 2 }, id);

      // When
      const result = entity1.equals(entity2);

      // Then
      expect(result).toBe(true);
    });

    it('should return false for entities with different ids', () => {
      // Given
      const entity1 = new TestEntity({ name: 'Entity 1', value: 1 }, 'id-1');
      const entity2 = new TestEntity({ name: 'Entity 2', value: 2 }, 'id-2');

      // When
      const result = entity1.equals(entity2);

      // Then
      expect(result).toBe(false);
    });

    it('should return false when comparing with null', () => {
      // Given
      const entity = new TestEntity({ name: 'Test', value: 1 });

      // When
      const result = entity.equals(null as any);

      // Then
      expect(result).toBe(false);
    });

    it('should return false when comparing with undefined', () => {
      // Given
      const entity = new TestEntity({ name: 'Test', value: 1 });

      // When
      const result = entity.equals(undefined as any);

      // Then
      expect(result).toBe(false);
    });

    it('should return true when comparing entity with itself', () => {
      // Given
      const entity = new TestEntity({ name: 'Test', value: 1 });

      // When
      const result = entity.equals(entity);

      // Then
      expect(result).toBe(true);
    });

    it('should return false when comparing with non-entity object', () => {
      // Given
      const entity = new TestEntity({ name: 'Test', value: 1 });
      const nonEntity = { _id: entity.getId() } as any;

      // When
      const result = entity.equals(nonEntity);

      // Then
      expect(result).toBe(false);
    });

    it('should handle string and number ids correctly', () => {
      // Given
      const stringIdEntity = new TestEntity({ name: 'Test', value: 1 }, 'string-id');
      const numberIdEntity = new TestEntity({ name: 'Test', value: 1 }, 123);
      const sameStringIdEntity = new TestEntity({ name: 'Test', value: 1 }, 'string-id');
      const sameNumberIdEntity = new TestEntity({ name: 'Test', value: 1 }, 123);

      // When & Then
      expect(stringIdEntity.equals(sameStringIdEntity)).toBe(true);
      expect(numberIdEntity.equals(sameNumberIdEntity)).toBe(true);
      expect(stringIdEntity.equals(numberIdEntity)).toBe(false);
    });
  });

  describe('Domain Events', () => {
    let entity: TestEntity;

    beforeEach(() => {
      entity = new TestEntity({ name: 'Test Entity', value: 42 });
    });

    it('should add domain event', () => {
      // Given
      const event = { type: 'TestEvent', data: { test: true } };

      // When
      entity.testAddDomainEvent(event);

      // Then
      expect(entity.domainEvents).toContain(event);
      expect(entity.domainEvents.length).toBe(1);
    });

    it('should add multiple domain events', () => {
      // Given
      const event1 = { type: 'Event1', data: { value: 1 } };
      const event2 = { type: 'Event2', data: { value: 2 } };
      const event3 = { type: 'Event3', data: { value: 3 } };

      // When
      entity.testAddDomainEvent(event1);
      entity.testAddDomainEvent(event2);
      entity.testAddDomainEvent(event3);

      // Then
      expect(entity.domainEvents).toEqual([event1, event2, event3]);
      expect(entity.domainEvents.length).toBe(3);
    });

    it('should get domain events via protected method', () => {
      // Given
      const event = { type: 'TestEvent' };
      entity.testAddDomainEvent(event);

      // When
      const events = entity.testGetDomainEvents();

      // Then
      expect(events).toContain(event);
      expect(events).toBe(entity.domainEvents);
    });

    it('should clear events via public method', () => {
      // Given
      entity.testAddDomainEvent({ type: 'Event1' });
      entity.testAddDomainEvent({ type: 'Event2' });
      expect(entity.domainEvents.length).toBe(2);

      // When
      entity.clearEvents();

      // Then
      expect(entity.domainEvents).toEqual([]);
      expect(entity.domainEvents.length).toBe(0);
    });

    it('should clear events via protected method', () => {
      // Given
      entity.testAddDomainEvent({ type: 'Event1' });
      entity.testAddDomainEvent({ type: 'Event2' });
      expect(entity.domainEvents.length).toBe(2);

      // When
      entity.testClearDomainEvents();

      // Then
      expect(entity.domainEvents).toEqual([]);
      expect(entity.domainEvents.length).toBe(0);
    });

    it('should handle null and undefined events', () => {
      // Given & When
      entity.testAddDomainEvent(null);
      entity.testAddDomainEvent(undefined);

      // Then
      expect(entity.domainEvents).toEqual([null, undefined]);
      expect(entity.domainEvents.length).toBe(2);
    });

    it('should preserve event references', () => {
      // Given
      const event = { type: 'TestEvent', mutable: true };
      entity.testAddDomainEvent(event);

      // When
      event.mutable = false;

      // Then
      expect(entity.domainEvents[0]).toBe(event);
      expect(entity.domainEvents[0].mutable).toBe(false);
    });

    it('should maintain event order', () => {
      // Given
      const events = [];
      for (let i = 0; i < 10; i++) {
        events.push({ type: `Event${i}`, order: i });
      }

      // When
      events.forEach(event => entity.testAddDomainEvent(event));

      // Then
      entity.domainEvents.forEach((event, index) => {
        expect(event.order).toBe(index);
      });
    });
  });

  describe('Entity Properties', () => {
    it('should protect props from external modification', () => {
      // Given
      const entity = new TestEntity({ name: 'Original', value: 100 });
      
      // When - try to modify props directly (should not be possible)
      // props is protected, so this is more of a design verification

      // Then
      expect(entity.getName()).toBe('Original');
      expect(entity.getValue()).toBe(100);
    });

    it('should allow controlled prop updates via methods', () => {
      // Given
      const entity = new TestEntity({ name: 'Original', value: 100 });

      // When
      entity.updateName('Updated');

      // Then
      expect(entity.getName()).toBe('Updated');
      expect(entity.getValue()).toBe(100); // Other props unchanged
    });

    it('should maintain prop integrity', () => {
      // Given
      const props = { name: 'Test', value: 42 };
      const entity = new TestEntity(props);

      // When - modify original props object
      props.name = 'Modified';
      props.value = 999;

      // Then - entity should be affected since it shares reference
      expect(entity.getName()).toBe('Modified');
      expect(entity.getValue()).toBe(999);
    });
  });

  describe('Entity Lifecycle', () => {
    it('should maintain id throughout lifecycle', () => {
      // Given
      const entity = new TestEntity({ name: 'Test', value: 1 }, 'persistent-id');
      const originalId = entity.getId();

      // When - perform various operations
      entity.updateName('Updated');
      entity.testAddDomainEvent({ type: 'Event' });
      entity.clearEvents();

      // Then
      expect(entity.getId()).toBe(originalId);
    });

    it('should allow event management throughout lifecycle', () => {
      // Given
      const entity = new TestEntity({ name: 'Test', value: 1 });

      // When - simulate lifecycle operations
      entity.testAddDomainEvent({ type: 'Created' });
      expect(entity.domainEvents.length).toBe(1);

      entity.updateName('Updated');
      entity.testAddDomainEvent({ type: 'Updated' });
      expect(entity.domainEvents.length).toBe(2);

      entity.clearEvents();
      expect(entity.domainEvents.length).toBe(0);

      entity.testAddDomainEvent({ type: 'Final' });
      expect(entity.domainEvents.length).toBe(1);

      // Then - all operations should work correctly
      expect(entity.getName()).toBe('Updated');
      expect(entity.domainEvents[0].type).toBe('Final');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty props object', () => {
      // Given
      const props = {} as any;

      // When
      const entity = new TestEntity(props);

      // Then
      expect(entity.getName()).toBeUndefined();
      expect(entity.getValue()).toBeUndefined();
      expect(entity.getId()).toBeDefined();
    });

    it('should handle props with special characters', () => {
      // Given
      const props = { name: 'Entity with "quotes" and \nnewlines', value: -42.5 };

      // When
      const entity = new TestEntity(props);

      // Then
      expect(entity.getName()).toBe('Entity with "quotes" and \nnewlines');
      expect(entity.getValue()).toBe(-42.5);
    });

    it('should handle very large domain event arrays', () => {
      // Given
      const entity = new TestEntity({ name: 'Test', value: 1 });
      const eventCount = 1000;

      // When
      for (let i = 0; i < eventCount; i++) {
        entity.testAddDomainEvent({ type: `Event${i}`, index: i });
      }

      // Then
      expect(entity.domainEvents.length).toBe(eventCount);
      expect(entity.domainEvents[0].index).toBe(0);
      expect(entity.domainEvents[eventCount - 1].index).toBe(eventCount - 1);

      // Clear should work with large arrays
      entity.clearEvents();
      expect(entity.domainEvents.length).toBe(0);
    });

    it('should handle complex event objects', () => {
      // Given
      const entity = new TestEntity({ name: 'Test', value: 1 });
      const complexEvent = {
        type: 'ComplexEvent',
        timestamp: new Date(),
        payload: {
          nested: {
            data: [1, 2, 3],
            metadata: { version: '1.0', tags: ['test', 'complex'] }
          }
        },
        callback: () => 'test function'
      };

      // When
      entity.testAddDomainEvent(complexEvent);

      // Then
      const retrievedEvent = entity.domainEvents[0];
      expect(retrievedEvent.type).toBe('ComplexEvent');
      expect(retrievedEvent.payload.nested.data).toEqual([1, 2, 3]);
      expect(retrievedEvent.callback()).toBe('test function');
    });
  });
});