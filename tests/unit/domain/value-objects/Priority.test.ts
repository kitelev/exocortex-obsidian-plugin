import { Priority, PriorityLevel } from '../../../../src/domain/value-objects/Priority';

describe('Priority', () => {
  describe('create', () => {
    it('should create priority with valid string', () => {
      const result = Priority.create('high');
      
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().toString()).toBe('high');
    });

    it('should create priority with enum value', () => {
      const result = Priority.create(PriorityLevel.URGENT);
      
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().getLevel()).toBe(PriorityLevel.URGENT);
    });

    it('should handle case insensitive input', () => {
      const result = Priority.create('HIGH');
      
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().toString()).toBe('high');
    });

    it('should reject invalid priority', () => {
      const result = Priority.create('invalid');
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Priority must be one of: low, medium, high, urgent');
    });

    it('should reject empty priority', () => {
      const result = Priority.create('');
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Priority cannot be empty');
    });
  });

  describe('static factory methods', () => {
    it('should create low priority', () => {
      const priority = Priority.low();
      expect(priority.getLevel()).toBe(PriorityLevel.LOW);
    });

    it('should create medium priority', () => {
      const priority = Priority.medium();
      expect(priority.getLevel()).toBe(PriorityLevel.MEDIUM);
    });

    it('should create high priority', () => {
      const priority = Priority.high();
      expect(priority.getLevel()).toBe(PriorityLevel.HIGH);
    });

    it('should create urgent priority', () => {
      const priority = Priority.urgent();
      expect(priority.getLevel()).toBe(PriorityLevel.URGENT);
    });
  });

  describe('comparison methods', () => {
    it('should compare priorities correctly', () => {
      const low = Priority.low();
      const medium = Priority.medium();
      const high = Priority.high();
      const urgent = Priority.urgent();

      expect(low.compare(medium)).toBeLessThan(0);
      expect(medium.compare(high)).toBeLessThan(0);
      expect(high.compare(urgent)).toBeLessThan(0);
      expect(urgent.compare(low)).toBeGreaterThan(0);
      expect(medium.compare(medium)).toBe(0);
    });

    it('should check if priority is higher', () => {
      const low = Priority.low();
      const high = Priority.high();

      expect(high.isHigherThan(low)).toBe(true);
      expect(low.isHigherThan(high)).toBe(false);
    });

    it('should check if priority is lower', () => {
      const low = Priority.low();
      const high = Priority.high();

      expect(low.isLowerThan(high)).toBe(true);
      expect(high.isLowerThan(low)).toBe(false);
    });
  });

  describe('numeric value', () => {
    it('should return correct numeric values', () => {
      expect(Priority.low().getNumericValue()).toBe(1);
      expect(Priority.medium().getNumericValue()).toBe(2);
      expect(Priority.high().getNumericValue()).toBe(3);
      expect(Priority.urgent().getNumericValue()).toBe(4);
    });
  });
});