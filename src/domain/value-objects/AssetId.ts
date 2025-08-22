import { Result } from "../core/Result";

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
      return Result.fail<AssetId>("AssetId cannot be empty");
    }

    // Validate UUID format for asset IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value.trim())) {
      return Result.fail<AssetId>("AssetId must be a valid UUID format");
    }

    return Result.ok<AssetId>(new AssetId(value.trim()));
  }

  static generate(): AssetId {
    const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
    return new AssetId(uuid);
  }

  toString(): string {
    return this.value;
  }

  equals(other: AssetId): boolean {
    if (!other || !(other instanceof AssetId)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Get the UUID value
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Validate that this is a proper UUID
   */
  isValid(): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(this.value);
  }
}
