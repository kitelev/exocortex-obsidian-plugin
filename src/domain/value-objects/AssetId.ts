/**
 * Value object representing a unique asset identifier
 * Immutable and self-validating
 */
export class AssetId {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('AssetId cannot be empty');
    }
    this.value = value;
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