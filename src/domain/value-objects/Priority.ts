import { Result } from "../core/Result";

export enum PriorityLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

type PriorityInput = string | PriorityLevel | null | undefined;

/**
 * Value object representing task priority
 * Immutable and self-validating with business rules
 * Follows Clean Architecture principles with comprehensive validation
 */
export class Priority {
  private static readonly VALID_LEVELS = new Set(Object.values(PriorityLevel));
  private static readonly LEVEL_CACHE = new Map<PriorityLevel, Priority>();
  private static readonly NUMERIC_VALUES = new Map<PriorityLevel, number>([
    [PriorityLevel.LOW, 1],
    [PriorityLevel.MEDIUM, 2],
    [PriorityLevel.HIGH, 3],
    [PriorityLevel.URGENT, 4],
  ]);

  private readonly level: PriorityLevel;

  private constructor(level: PriorityLevel) {
    this.level = level;
  }

  static create(value: PriorityInput): Result<Priority> {
    const validationResult = this.validateInput(value);
    if (!validationResult.isSuccess) {
      return Result.fail<Priority>(validationResult.getError());
    }

    const normalizedLevel = this.normalizeValue(
      value as string | PriorityLevel,
    );
    if (!this.isValidLevel(normalizedLevel)) {
      return Result.fail<Priority>(
        `Priority must be one of: ${Array.from(this.VALID_LEVELS).join(", ")}`,
      );
    }

    return Result.ok<Priority>(this.getOrCreateInstance(normalizedLevel));
  }

  private static validateInput(value: PriorityInput): Result<void> {
    if (value === null || value === undefined || value === "") {
      return Result.fail<void>("Priority cannot be empty");
    }
    return Result.ok<void>(undefined);
  }

  private static normalizeValue(value: string | PriorityLevel): string {
    return typeof value === "string" ? value.toLowerCase().trim() : value;
  }

  private static isValidLevel(value: string): value is PriorityLevel {
    return this.VALID_LEVELS.has(value as PriorityLevel);
  }

  private static getOrCreateInstance(level: PriorityLevel): Priority {
    if (!this.LEVEL_CACHE.has(level)) {
      this.LEVEL_CACHE.set(level, new Priority(level));
    }
    return this.LEVEL_CACHE.get(level)!;
  }

  static low(): Priority {
    return this.getOrCreateInstance(PriorityLevel.LOW);
  }

  static medium(): Priority {
    return this.getOrCreateInstance(PriorityLevel.MEDIUM);
  }

  static high(): Priority {
    return this.getOrCreateInstance(PriorityLevel.HIGH);
  }

  static urgent(): Priority {
    return this.getOrCreateInstance(PriorityLevel.URGENT);
  }

  static getAllLevels(): readonly PriorityLevel[] {
    return Object.values(PriorityLevel);
  }

  getLevel(): PriorityLevel {
    return this.level;
  }

  toString(): string {
    return this.level;
  }

  equals(other: Priority | null | undefined): boolean {
    return other !== null && other !== undefined && this.level === other.level;
  }

  /**
   * Returns hash code for use in collections
   */
  hashCode(): number {
    return this.getNumericValue();
  }

  /**
   * Returns numeric value for sorting (higher number = higher priority)
   * Uses cached values for optimal performance
   */
  getNumericValue(): number {
    return Priority.NUMERIC_VALUES.get(this.level)!;
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
