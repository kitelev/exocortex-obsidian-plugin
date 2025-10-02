import { Result } from "../core/Result";

/**
 * Value object representing an ontology prefix
 * Validates prefix format and ensures uniqueness
 */
export class OntologyPrefix {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Result<OntologyPrefix> {
    if (!value || value.trim().length === 0) {
      return Result.fail<OntologyPrefix>("OntologyPrefix cannot be empty");
    }

    if (!/^[a-z][a-z0-9]*$/.test(value)) {
      return Result.fail<OntologyPrefix>(
        `Invalid ontology prefix format: ${value}. Must be lowercase alphanumeric starting with a letter`,
      );
    }

    return Result.ok<OntologyPrefix>(new OntologyPrefix(value));
  }

  toString(): string {
    return this.value;
  }

  toFileName(): string {
    return `!${this.value}`;
  }

  equals(other: OntologyPrefix): boolean {
    return this.value === other.value;
  }
}
