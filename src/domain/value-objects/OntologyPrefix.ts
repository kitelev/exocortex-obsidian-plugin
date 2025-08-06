/**
 * Value object representing an ontology prefix
 * Validates prefix format and ensures uniqueness
 */
export class OntologyPrefix {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('OntologyPrefix cannot be empty');
    }
    
    if (!/^[a-z][a-z0-9]*$/.test(value)) {
      throw new Error(`Invalid ontology prefix format: ${value}. Must be lowercase alphanumeric starting with a letter`);
    }
    
    this.value = value;
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