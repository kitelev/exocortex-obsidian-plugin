import { Entity, DomainEvent } from "../../../../src/domain/core/Entity";

/**
 * Enhanced test implementation to test more Entity branches
 */
class TestEntityWithValidation extends Entity<{ name: string; value: number }> {
  constructor(props: { name: string; value: number }, id?: any) {
    super(props, id);
  }

  protected validate(): void {
    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new Error("Name cannot be empty");
    }
    if (this.props.value < 0) {
      throw new Error("Value cannot be negative");
    }
  }

  protected generateId(): string {
    return `custom-${Date.now()}-${Math.random()}`;
  }

  // Expose protected methods for testing
  public testCreateDomainEvent(eventType: string, eventData: Record<string, any> = {}): DomainEvent {
    return this.createDomainEvent(eventType, eventData);
  }

  public testAddDomainEvent(event: DomainEvent): void {
    this.addDomainEvent(event);
  }

  public testValidate(): void {
    this.validate();
  }

  public getName(): string {
    return this.props.name;
  }

  public getValue(): number {
    return this.props.value;
  }
}

/**
 * Different entity type to test constructor type checking
 */
class DifferentEntity extends Entity<{ id: string }> {
  constructor(props: { id: string }, id?: any) {
    super(props, id);
  }

  getEntityId(): string {
    return this.props.id;
  }
}

describe("Entity - Comprehensive Branch Coverage", () => {
  describe("Constructor - ID Generation Branches", () => {
    it("should use provided id when given", () => {
      const customId = "custom-id-123";
      const entity = new TestEntityWithValidation(
        { name: "Test", value: 1 },
        customId
      );
      
      expect(entity.id).toBe(customId);
    });

    it("should generate id when not provided", () => {
      const entity = new TestEntityWithValidation({ name: "Test", value: 1 });
      
      expect(entity.id).toBeDefined();
      expect(typeof entity.id).toBe("string");
      expect(entity.id).toMatch(/^custom-\d+-/); // Custom generation pattern
    });

    it("should generate id when null is provided (nullish coalescing)", () => {
      const entity = new TestEntityWithValidation(
        { name: "Test", value: 1 },
        null
      );
      
      expect(entity.id).toBeDefined();
      expect(typeof entity.id).toBe("string");
    });

    it("should use undefined as id when explicitly provided", () => {
      const entity = new TestEntityWithValidation(
        { name: "Test", value: 1 },
        undefined
      );
      
      expect(entity.id).toBeDefined(); // Should trigger generateId()
    });

    it("should use 0 as id when provided", () => {
      const entity = new TestEntityWithValidation(
        { name: "Test", value: 1 },
        0
      );
      
      expect(entity.id).toBe(0);
    });

    it("should use empty string as id when provided", () => {
      const entity = new TestEntityWithValidation(
        { name: "Test", value: 1 },
        ""
      );
      
      expect(entity.id).toBe("");
    });
  });

  describe("equals - All Branch Conditions", () => {
    let entity1: TestEntityWithValidation;
    let entity2: TestEntityWithValidation;

    beforeEach(() => {
      entity1 = new TestEntityWithValidation({ name: "Test1", value: 1 }, "id-1");
      entity2 = new TestEntityWithValidation({ name: "Test2", value: 2 }, "id-2");
    });

    it("should return false for null input", () => {
      expect(entity1.equals(null as any)).toBe(false);
    });

    it("should return false for undefined input", () => {
      expect(entity1.equals(undefined as any)).toBe(false);
    });

    it("should return true for same object reference", () => {
      expect(entity1.equals(entity1)).toBe(true);
    });

    it("should return false for non-entity object", () => {
      const nonEntity = { id: "id-1", _id: "id-1" };
      expect(entity1.equals(nonEntity as any)).toBe(false);
    });

    it("should return false for different entity constructor", () => {
      const differentEntity = new DifferentEntity({ id: "test" }, "id-1");
      expect(entity1.equals(differentEntity as any)).toBe(false);
    });

    it("should return true for same id and constructor", () => {
      const sameIdEntity = new TestEntityWithValidation(
        { name: "Different", value: 999 },
        "id-1"
      );
      expect(entity1.equals(sameIdEntity)).toBe(true);
    });

    it("should return false for different id but same constructor", () => {
      expect(entity1.equals(entity2)).toBe(false);
    });

    it("should handle complex id types", () => {
      const objectId = { uuid: "123", version: 1 };
      const entity1 = new TestEntityWithValidation(
        { name: "Test", value: 1 },
        objectId
      );
      const entity2 = new TestEntityWithValidation(
        { name: "Test", value: 1 },
        objectId
      );
      const entity3 = new TestEntityWithValidation(
        { name: "Test", value: 1 },
        { uuid: "123", version: 1 }
      );
      
      expect(entity1.equals(entity2)).toBe(true); // Same reference
      expect(entity1.equals(entity3)).toBe(false); // Different reference, same content
    });
  });

  describe("isValid - Validation Branch Testing", () => {
    it("should return true for valid entity", () => {
      const entity = new TestEntityWithValidation({ name: "Valid", value: 1 });
      expect(entity.isValid()).toBe(true);
    });

    it("should return false when validation throws error", () => {
      const entity = new TestEntityWithValidation({ name: "", value: 1 });
      expect(entity.isValid()).toBe(false);
    });

    it("should return false for negative value", () => {
      const entity = new TestEntityWithValidation({ name: "Test", value: -1 });
      expect(entity.isValid()).toBe(false);
    });

    it("should return false for empty name", () => {
      const entity = new TestEntityWithValidation({ name: "   ", value: 1 });
      expect(entity.isValid()).toBe(false);
    });

    it("should handle validation exceptions gracefully", () => {
      // Create entity with invalid state
      const entity = new TestEntityWithValidation({ name: "", value: -1 });
      
      // isValid should catch exception and return false, not throw
      expect(() => entity.isValid()).not.toThrow();
      expect(entity.isValid()).toBe(false);
    });
  });

  describe("Domain Events - createDomainEvent Branches", () => {
    let entity: TestEntityWithValidation;

    beforeEach(() => {
      entity = new TestEntityWithValidation({ name: "Test", value: 1 }, "test-id");
    });

    it("should create domain event with default empty eventData", () => {
      const event = entity.testCreateDomainEvent("TestEvent");
      
      expect(event.eventType).toBe("TestEvent");
      expect(event.aggregateId).toBe("test-id");
      expect(event.eventData).toEqual({});
      expect(event.occurredOn).toBeInstanceOf(Date);
    });

    it("should create domain event with provided eventData", () => {
      const eventData = { key: "value", count: 42 };
      const event = entity.testCreateDomainEvent("TestEvent", eventData);
      
      expect(event.eventType).toBe("TestEvent");
      expect(event.aggregateId).toBe("test-id");
      expect(event.eventData).toBe(eventData);
      expect(event.occurredOn).toBeInstanceOf(Date);
    });

    it("should handle complex aggregateId toString conversion", () => {
      const complexId = { 
        toString: () => "complex-id-representation" 
      };
      const complexEntity = new TestEntityWithValidation(
        { name: "Test", value: 1 }, 
        complexId
      );
      
      const event = complexEntity.testCreateDomainEvent("TestEvent");
      expect(event.aggregateId).toBe("complex-id-representation");
    });

    it("should handle id without toString method", () => {
      const primitiveId = 12345;
      const entity = new TestEntityWithValidation(
        { name: "Test", value: 1 }, 
        primitiveId
      );
      
      const event = entity.testCreateDomainEvent("TestEvent");
      expect(event.aggregateId).toBe("12345");
    });
  });

  describe("Domain Events - Array Management Branches", () => {
    let entity: TestEntityWithValidation;

    beforeEach(() => {
      entity = new TestEntityWithValidation({ name: "Test", value: 1 });
    });

    it("should return empty array copy for new entity", () => {
      const events = entity.domainEvents;
      
      expect(events).toEqual([]);
      expect(Array.isArray(events)).toBe(true);
      expect(events).not.toBe((entity as any)._domainEvents); // Should be copy
    });

    it("should return copy of events to prevent external mutation", () => {
      const event = entity.testCreateDomainEvent("TestEvent");
      entity.testAddDomainEvent(event);
      
      const events = entity.domainEvents;
      events.push(entity.testCreateDomainEvent("ShouldNotAppear"));
      
      expect(entity.domainEvents).toHaveLength(1);
      expect(entity.domainEvents[0]).toBe(event);
    });

    it("should handle clearEvents when no events exist", () => {
      expect(entity.domainEvents).toHaveLength(0);
      
      entity.clearEvents();
      
      expect(entity.domainEvents).toHaveLength(0);
    });

    it("should handle clearEvents when events exist", () => {
      entity.testAddDomainEvent(entity.testCreateDomainEvent("Event1"));
      entity.testAddDomainEvent(entity.testCreateDomainEvent("Event2"));
      expect(entity.domainEvents).toHaveLength(2);
      
      entity.clearEvents();
      
      expect(entity.domainEvents).toHaveLength(0);
    });
  });

  describe("generateId - Default Implementation Branch", () => {
    class DefaultIdEntity extends Entity<{ data: string }> {
      constructor(props: { data: string }) {
        super(props); // Uses default generateId
      }
      
      public getData(): string {
        return this.props.data;
      }
    }

    it("should generate random id using default implementation", () => {
      const entity = new DefaultIdEntity({ data: "test" });
      
      expect(entity.id).toBeDefined();
      expect(typeof entity.id).toBe("string");
      expect(entity.id.length).toBeGreaterThan(0);
    });

    it("should generate different ids for different instances", () => {
      const entity1 = new DefaultIdEntity({ data: "test1" });
      const entity2 = new DefaultIdEntity({ data: "test2" });
      
      expect(entity1.id).not.toBe(entity2.id);
    });

    it("should generate id with expected format", () => {
      const entity = new DefaultIdEntity({ data: "test" });
      
      // Default implementation uses Math.random().toString(36).substring(2, 15)
      expect(entity.id).toMatch(/^[a-z0-9]+$/);
      expect(entity.id.length).toBeLessThanOrEqual(13);
    });
  });

  describe("validate - Default Implementation Branch", () => {
    class NoValidationEntity extends Entity<{ data: string }> {
      constructor(props: { data: string }, id?: any) {
        super(props, id);
      }
      
      public getData(): string {
        return this.props.data;
      }
    }

    it("should pass validation with default implementation", () => {
      const entity = new NoValidationEntity({ data: "test" });
      
      expect(entity.isValid()).toBe(true);
    });

    it("should handle isValid with default validate implementation", () => {
      const entity = new NoValidationEntity({ data: "test" });
      
      // Default validate() does nothing, so isValid should always return true
      expect(() => entity.isValid()).not.toThrow();
      expect(entity.isValid()).toBe(true);
    });
  });

  describe("Edge Cases - Property Access", () => {
    it("should handle entity with minimal props", () => {
      const entity = new TestEntityWithValidation({ name: "a", value: 0 });
      
      expect(entity.getName()).toBe("a");
      expect(entity.getValue()).toBe(0);
      expect(entity.isValid()).toBe(true);
    });

    it("should handle entity with boundary validation values", () => {
      // Test exactly at validation boundaries
      const validEntity = new TestEntityWithValidation({ name: "a", value: 0 });
      expect(validEntity.isValid()).toBe(true);
      
      const invalidNameEntity = new TestEntityWithValidation({ name: "", value: 1 });
      expect(invalidNameEntity.isValid()).toBe(false);
      
      const invalidValueEntity = new TestEntityWithValidation({ name: "test", value: -1 });
      expect(invalidValueEntity.isValid()).toBe(false);
    });
  });

  describe("isEntity Private Method Branch", () => {
    it("should correctly identify Entity instances", () => {
      const entity = new TestEntityWithValidation({ name: "Test", value: 1 });
      const anotherEntity = new DifferentEntity({ id: "test" });
      const nonEntity = { _id: "fake-id" };
      
      // Test through equals method which uses isEntity internally
      expect(entity.equals(anotherEntity as any)).toBe(false); // Different constructor
      expect(entity.equals(nonEntity as any)).toBe(false); // Not an entity
    });

    it("should handle inheritance hierarchy correctly", () => {
      class ExtendedEntity extends TestEntityWithValidation {
        constructor(props: { name: string; value: number }, id?: any) {
          super(props, id);
        }
      }
      
      const baseEntity = new TestEntityWithValidation({ name: "Base", value: 1 }, "same-id");
      const extendedEntity = new ExtendedEntity({ name: "Extended", value: 2 }, "same-id");
      
      // Should be false because different constructors
      expect(baseEntity.equals(extendedEntity)).toBe(false);
      expect(extendedEntity.equals(baseEntity)).toBe(false);
    });
  });

  describe("Domain Events - Array Operations", () => {
    let entity: TestEntityWithValidation;

    beforeEach(() => {
      entity = new TestEntityWithValidation({ name: "Test", value: 1 });
    });

    it("should maintain event order when adding multiple events", () => {
      const events = [
        entity.testCreateDomainEvent("First", { order: 1 }),
        entity.testCreateDomainEvent("Second", { order: 2 }),
        entity.testCreateDomainEvent("Third", { order: 3 }),
      ];
      
      events.forEach(event => entity.testAddDomainEvent(event));
      
      const retrievedEvents = entity.domainEvents;
      expect(retrievedEvents).toHaveLength(3);
      expect(retrievedEvents[0].eventData.order).toBe(1);
      expect(retrievedEvents[1].eventData.order).toBe(2);
      expect(retrievedEvents[2].eventData.order).toBe(3);
    });

    it("should handle event with complex eventData", () => {
      const complexEventData = {
        nested: {
          level1: {
            level2: [1, 2, 3],
            metadata: new Date(),
          }
        },
        callback: () => "test",
        nullValue: null,
        undefinedValue: undefined,
      };
      
      const event = entity.testCreateDomainEvent("ComplexEvent", complexEventData);
      entity.testAddDomainEvent(event);
      
      const retrievedEvent = entity.domainEvents[0];
      expect(retrievedEvent.eventData).toBe(complexEventData);
      expect(retrievedEvent.eventData.nested.level1.level2).toEqual([1, 2, 3]);
    });

    it("should handle events with empty eventType", () => {
      const event = entity.testCreateDomainEvent("", { test: true });
      entity.testAddDomainEvent(event);
      
      const retrievedEvent = entity.domainEvents[0];
      expect(retrievedEvent.eventType).toBe("");
      expect(retrievedEvent.eventData.test).toBe(true);
    });

    it("should handle events with special character eventType", () => {
      const specialEventType = "Event/With\\Special:Characters!@#$%";
      const event = entity.testCreateDomainEvent(specialEventType);
      entity.testAddDomainEvent(event);
      
      const retrievedEvent = entity.domainEvents[0];
      expect(retrievedEvent.eventType).toBe(specialEventType);
    });
  });

  describe("Props Access and Mutation", () => {
    it("should allow props modification through protected access", () => {
      const entity = new TestEntityWithValidation({ name: "Original", value: 100 });
      
      // Verify original state
      expect(entity.getName()).toBe("Original");
      expect(entity.getValue()).toBe(100);
      
      // Modify props directly (simulating internal mutation)
      (entity as any).props.name = "Modified";
      (entity as any).props.value = 200;
      
      // Verify changes
      expect(entity.getName()).toBe("Modified");
      expect(entity.getValue()).toBe(200);
    });

    it("should handle props reference sharing", () => {
      const sharedProps = { name: "Shared", value: 42 };
      const entity = new TestEntityWithValidation(sharedProps);
      
      // Modify original props object
      sharedProps.name = "Modified";
      sharedProps.value = 99;
      
      // Entity should reflect changes (since it shares reference)
      expect(entity.getName()).toBe("Modified");
      expect(entity.getValue()).toBe(99);
    });
  });

  describe("ID Edge Cases", () => {
    it("should handle various falsy id values", () => {
      const falsyIds = [null, undefined, 0, "", false, NaN];
      
      falsyIds.forEach((id, index) => {
        const entity = new TestEntityWithValidation(
          { name: `Test${index}`, value: index },
          id
        );
        
        if (id === undefined || id === null) {
          // null and undefined should trigger generateId due to nullish coalescing
          expect(entity.id).toBeDefined();
          expect(typeof entity.id).toBe("string");
        } else {
          expect(entity.id).toBe(id);
        }
      });
    });

    it("should handle complex object ids", () => {
      const complexIds = [
        { type: "uuid", value: "123-456" },
        [1, 2, 3],
        new Date(),
        () => "function-id",
      ];
      
      complexIds.forEach((id) => {
        const entity = new TestEntityWithValidation(
          { name: "Test", value: 1 },
          id
        );
        
        expect(entity.id).toBe(id);
      });
    });
  });

  describe("Memory and Performance Edge Cases", () => {
    it("should handle large number of domain events", () => {
      const entity = new TestEntityWithValidation({ name: "Test", value: 1 });
      const eventCount = 1000;
      
      // Add many events
      for (let i = 0; i < eventCount; i++) {
        const event = entity.testCreateDomainEvent(`Event${i}`, { index: i });
        entity.testAddDomainEvent(event);
      }
      
      // Verify all events are stored
      expect(entity.domainEvents).toHaveLength(eventCount);
      
      // Verify event integrity
      const firstEvent = entity.domainEvents[0];
      const lastEvent = entity.domainEvents[eventCount - 1];
      expect(firstEvent.eventData.index).toBe(0);
      expect(lastEvent.eventData.index).toBe(eventCount - 1);
      
      // Clear should handle large arrays
      entity.clearEvents();
      expect(entity.domainEvents).toHaveLength(0);
    });

    it("should handle rapid event creation and clearing", () => {
      const entity = new TestEntityWithValidation({ name: "Test", value: 1 });
      
      // Rapid creation and clearing cycles
      for (let cycle = 0; cycle < 10; cycle++) {
        for (let i = 0; i < 10; i++) {
          const event = entity.testCreateDomainEvent(`Cycle${cycle}Event${i}`);
          entity.testAddDomainEvent(event);
        }
        expect(entity.domainEvents).toHaveLength(10);
        
        entity.clearEvents();
        expect(entity.domainEvents).toHaveLength(0);
      }
    });
  });

  describe("Type System and Inheritance", () => {
    it("should maintain type safety across inheritance", () => {
      class SpecializedEntity extends TestEntityWithValidation {
        constructor(props: { name: string; value: number }, id?: any) {
          super(props, id);
        }
        
        getSpecializedData(): string {
          return `${this.getName()}-${this.getValue()}`;
        }
      }
      
      const specialized = new SpecializedEntity({ name: "Special", value: 42 }, "special-id");
      const base = new TestEntityWithValidation({ name: "Base", value: 10 }, "special-id");
      
      // Same id but different types - should not be equal
      expect(specialized.equals(base)).toBe(false);
      expect(base.equals(specialized)).toBe(false);
    });

    it("should handle abstract entity functionality", () => {
      // Test that all abstract methods work correctly
      const entity = new TestEntityWithValidation({ name: "Abstract Test", value: 1 });
      
      expect(entity.id).toBeDefined();
      expect(entity.domainEvents).toEqual([]);
      expect(entity.isValid()).toBe(true);
      
      const event = entity.testCreateDomainEvent("AbstractTest");
      expect(event.eventType).toBe("AbstractTest");
      expect(event.aggregateId).toBe(entity.id.toString());
    });
  });
});