import { Result } from '../core/Result';

/**
 * Value object representing an asset class name
 * Ensures valid class naming conventions
 */
export class ClassName {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Result<ClassName> {
    if (!value || value.trim().length === 0) {
      return Result.fail<ClassName>('ClassName cannot be empty');
    }
    
    // Remove wiki link brackets if present
    const cleaned = value.replace(/\[\[|\]\]/g, '');
    
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*(?:__[a-zA-Z][a-zA-Z0-9_]*)?$/.test(cleaned)) {
      return Result.fail<ClassName>(`Invalid class name format: ${value}`);
    }
    
    return Result.ok<ClassName>(new ClassName(cleaned));
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