import { Result } from '../core/Result';

/**
 * Value object representing a unique asset identifier
 * Immutable and self-validating
 */
export class AssetId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Result<AssetId> {
    if (!value || value.trim().length === 0) {
      return Result.fail<AssetId>('AssetId cannot be empty');
    }
    return Result.ok<AssetId>(new AssetId(value));
  }

  static generate(): AssetId {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    return new AssetId(uuid);
  }

  toString(): string {
    return this.value;
  }

  equals(other: AssetId): boolean {
    return this.value === other.value;
  }
}