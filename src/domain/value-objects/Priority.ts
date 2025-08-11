import { Result } from '../core/Result';

export enum PriorityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Value object representing task priority
 * Immutable and self-validating with business rules
 */
export class Priority {
  private readonly level: PriorityLevel;

  private constructor(level: PriorityLevel) {
    this.level = level;
  }

  static create(value: string | PriorityLevel): Result<Priority> {
    if (!value) {
      return Result.fail<Priority>('Priority cannot be empty');
    }

    const normalizedValue = typeof value === 'string' ? value.toLowerCase() : value;
    
    if (!Object.values(PriorityLevel).includes(normalizedValue as PriorityLevel)) {
      return Result.fail<Priority>('Priority must be one of: low, medium, high, urgent');
    }

    return Result.ok<Priority>(new Priority(normalizedValue as PriorityLevel));
  }

  static low(): Priority {
    return new Priority(PriorityLevel.LOW);
  }

  static medium(): Priority {
    return new Priority(PriorityLevel.MEDIUM);
  }

  static high(): Priority {
    return new Priority(PriorityLevel.HIGH);
  }

  static urgent(): Priority {
    return new Priority(PriorityLevel.URGENT);
  }

  getLevel(): PriorityLevel {
    return this.level;
  }

  toString(): string {
    return this.level;
  }

  equals(other: Priority): boolean {
    return this.level === other.level;
  }

  /**
   * Returns numeric value for sorting (higher number = higher priority)
   */
  getNumericValue(): number {
    switch (this.level) {
      case PriorityLevel.LOW: return 1;
      case PriorityLevel.MEDIUM: return 2;
      case PriorityLevel.HIGH: return 3;
      case PriorityLevel.URGENT: return 4;
    }
  }

  /**
   * Compares priorities for sorting
   * Returns negative if this < other, positive if this > other, 0 if equal
   */
  compare(other: Priority): number {
    return this.getNumericValue() - other.getNumericValue();
  }

  isHigherThan(other: Priority): boolean {
    return this.getNumericValue() > other.getNumericValue();
  }

  isLowerThan(other: Priority): boolean {
    return this.getNumericValue() < other.getNumericValue();
  }
}