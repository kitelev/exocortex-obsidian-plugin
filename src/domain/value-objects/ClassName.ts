/**
 * Value object representing an asset class name
 * Ensures valid class naming conventions
 */
export class ClassName {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('ClassName cannot be empty');
    }
    
    // Remove wiki link brackets if present
    const cleaned = value.replace(/\[\[|\]\]/g, '');
    
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*(?:__[a-zA-Z][a-zA-Z0-9_]*)?$/.test(cleaned)) {
      throw new Error(`Invalid class name format: ${value}`);
    }
    
    this.value = cleaned;
  }

  toString(): string {
    return this.value;
  }

  toWikiLink(): string {
    return `[[${this.value}]]`;
  }

  getPrefix(): string {
    const parts = this.value.split('__');
    return parts.length > 1 ? parts[0] : '';
  }

  getName(): string {
    const parts = this.value.split('__');
    return parts.length > 1 ? parts[1] : parts[0];
  }

  equals(other: ClassName): boolean {
    return this.value === other.value;
  }
}