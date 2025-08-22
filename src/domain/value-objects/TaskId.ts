import { Result } from "../core/Result";

/**
 * Value object representing a unique task identifier
 * Immutable and self-validating UUID-based identifier
 */
export class TaskId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Result<TaskId> {
    if (!value || value.trim().length === 0) {
      return Result.fail<TaskId>("TaskId cannot be empty");
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      return Result.fail<TaskId>("TaskId must be a valid UUID");
    }

    return Result.ok<TaskId>(new TaskId(value));
  }

  static generate(): TaskId {
    const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
    return new TaskId(uuid);
  }

  toString(): string {
    return this.value;
  }

  equals(other: TaskId): boolean {
    return this.value === other.value;
  }
}
