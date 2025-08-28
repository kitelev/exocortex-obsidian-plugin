import { Asset } from "../entities/Asset";
import { ClassName } from "../value-objects/ClassName";
import { OntologyPrefix } from "../value-objects/OntologyPrefix";
import { PropertyValueType } from "../value-objects/PropertyValue";

/**
 * Specification pattern for asset queries
 * Encapsulates query logic in domain layer
 */
export abstract class AssetSpecification {
  abstract isSatisfiedBy(asset: Asset): boolean;

  and(other: AssetSpecification): AssetSpecification {
    return new AndSpecification(this, other);
  }

  or(other: AssetSpecification): AssetSpecification {
    return new OrSpecification(this, other);
  }

  not(): AssetSpecification {
    return new NotSpecification(this);
  }
}

/**
 * Composite specifications
 */
class AndSpecification extends AssetSpecification {
  constructor(
    private left: AssetSpecification,
    private right: AssetSpecification,
  ) {
    super();
  }

  isSatisfiedBy(asset: Asset): boolean {
    return this.left.isSatisfiedBy(asset) && this.right.isSatisfiedBy(asset);
  }
}

class OrSpecification extends AssetSpecification {
  constructor(
    private left: AssetSpecification,
    private right: AssetSpecification,
  ) {
    super();
  }

  isSatisfiedBy(asset: Asset): boolean {
    return this.left.isSatisfiedBy(asset) || this.right.isSatisfiedBy(asset);
  }
}

class NotSpecification extends AssetSpecification {
  constructor(private specification: AssetSpecification) {
    super();
  }

  isSatisfiedBy(asset: Asset): boolean {
    return !this.specification.isSatisfiedBy(asset);
  }
}

/**
 * Concrete specifications for common queries
 */

export class AssetsByClassSpecification extends AssetSpecification {
  constructor(private className: ClassName) {
    super();
  }

  isSatisfiedBy(asset: Asset): boolean {
    return asset.getClassName().equals(this.className);
  }
}

export class AssetsByOntologySpecification extends AssetSpecification {
  constructor(private ontology: OntologyPrefix) {
    super();
  }

  isSatisfiedBy(asset: Asset): boolean {
    return asset.getOntologyPrefix().toString() === this.ontology.toString();
  }
}

export class AssetsByTitlePatternSpecification extends AssetSpecification {
  constructor(private pattern: RegExp) {
    super();
  }

  isSatisfiedBy(asset: Asset): boolean {
    return this.pattern.test(asset.getTitle());
  }
}

export class AssetsWithPropertySpecification extends AssetSpecification {
  constructor(private propertyName: string) {
    super();
  }

  isSatisfiedBy(asset: Asset): boolean {
    return asset.hasProperty(this.propertyName);
  }
}

export class AssetsByPropertyValueSpecification extends AssetSpecification {
  constructor(
    private propertyName: string,
    private expectedValue: any,
  ) {
    super();
  }

  isSatisfiedBy(asset: Asset): boolean {
    const propertyValue = asset.getProperty(this.propertyName);
    if (!propertyValue) {
      return false;
    }

    const value = propertyValue.getValue();

    // Handle array values (e.g., tags)
    if (Array.isArray(value)) {
      return value.includes(this.expectedValue);
    }

    return value === this.expectedValue;
  }
}

export class AssetsByPropertyTypeSpecification extends AssetSpecification {
  constructor(
    private propertyName: string,
    private expectedType: PropertyValueType,
  ) {
    super();
  }

  isSatisfiedBy(asset: Asset): boolean {
    const propertyValue = asset.getProperty(this.propertyName);
    if (!propertyValue) {
      return false;
    }

    return propertyValue.getType() === this.expectedType;
  }
}

export class AssetsCreatedAfterSpecification extends AssetSpecification {
  constructor(private date: Date) {
    super();
  }

  isSatisfiedBy(asset: Asset): boolean {
    return asset.getCreatedAt() > this.date;
  }
}

export class AssetsUpdatedAfterSpecification extends AssetSpecification {
  constructor(private date: Date) {
    super();
  }

  isSatisfiedBy(asset: Asset): boolean {
    return asset.getUpdatedAt() > this.date;
  }
}

export class AssetsWithMinVersionSpecification extends AssetSpecification {
  constructor(private minVersion: number) {
    super();
  }

  isSatisfiedBy(asset: Asset): boolean {
    return asset.getVersion() >= this.minVersion;
  }
}

/**
 * Complex specifications for business queries
 */

export class ActiveAssetsSpecification extends AssetSpecification {
  isSatisfiedBy(asset: Asset): boolean {
    const status = asset.getPropertyValue("status");
    return status === "active" || status === "published";
  }
}

export class RecentlyModifiedAssetsSpecification extends AssetSpecification {
  constructor(private daysBack: number = 7) {
    super();
  }

  isSatisfiedBy(asset: Asset): boolean {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.daysBack);
    return asset.getUpdatedAt() > cutoffDate;
  }
}

export class AssetsWithTagSpecification extends AssetSpecification {
  constructor(private tag: string) {
    super();
  }

  isSatisfiedBy(asset: Asset): boolean {
    const tags = asset.getPropertyValue("tags");
    return Array.isArray(tags) && tags.includes(this.tag);
  }
}

export class AssetsWithAnyTagSpecification extends AssetSpecification {
  constructor(private tags: string[]) {
    super();
  }

  isSatisfiedBy(asset: Asset): boolean {
    const assetTags = asset.getPropertyValue("tags");
    if (!Array.isArray(assetTags)) {
      return false;
    }

    return this.tags.some((tag) => assetTags.includes(tag));
  }
}

export class AssetsWithAllTagsSpecification extends AssetSpecification {
  constructor(private tags: string[]) {
    super();
  }

  isSatisfiedBy(asset: Asset): boolean {
    const assetTags = asset.getPropertyValue("tags");
    if (!Array.isArray(assetTags)) {
      return false;
    }

    return this.tags.every((tag) => assetTags.includes(tag));
  }
}

export class AssetsByPrioritySpecification extends AssetSpecification {
  constructor(private priorities: string[]) {
    super();
  }

  isSatisfiedBy(asset: Asset): boolean {
    const priority = asset.getPropertyValue("priority");
    return this.priorities.includes(priority);
  }
}

export class HighPriorityAssetsSpecification extends AssetSpecification {
  isSatisfiedBy(asset: Asset): boolean {
    const priority = asset.getPropertyValue("priority");
    return priority === "high" || priority === "critical";
  }
}

/**
 * Factory for creating common specifications
 */
export class AssetSpecificationFactory {
  static byClass(className: ClassName): AssetSpecification {
    return new AssetsByClassSpecification(className);
  }

  static byOntology(ontology: OntologyPrefix): AssetSpecification {
    return new AssetsByOntologySpecification(ontology);
  }

  static withProperty(propertyName: string): AssetSpecification {
    return new AssetsWithPropertySpecification(propertyName);
  }

  static byPropertyValue(propertyName: string, value: any): AssetSpecification {
    return new AssetsByPropertyValueSpecification(propertyName, value);
  }

  static byPropertyType(
    propertyName: string,
    type: PropertyValueType,
  ): AssetSpecification {
    return new AssetsByPropertyTypeSpecification(propertyName, type);
  }

  static createdAfter(date: Date): AssetSpecification {
    return new AssetsCreatedAfterSpecification(date);
  }

  static updatedAfter(date: Date): AssetSpecification {
    return new AssetsUpdatedAfterSpecification(date);
  }

  static withMinVersion(version: number): AssetSpecification {
    return new AssetsWithMinVersionSpecification(version);
  }

  static active(): AssetSpecification {
    return new ActiveAssetsSpecification();
  }

  static recentlyModified(daysBack?: number): AssetSpecification {
    return new RecentlyModifiedAssetsSpecification(daysBack);
  }

  static withTag(tag: string): AssetSpecification {
    return new AssetsWithTagSpecification(tag);
  }

  static withAnyTag(tags: string[]): AssetSpecification {
    return new AssetsWithAnyTagSpecification(tags);
  }

  static withAllTags(tags: string[]): AssetSpecification {
    return new AssetsWithAllTagsSpecification(tags);
  }

  static byPriority(priorities: string[]): AssetSpecification {
    return new AssetsByPrioritySpecification(priorities);
  }

  static highPriority(): AssetSpecification {
    return new HighPriorityAssetsSpecification();
  }

  static titleMatches(pattern: string | RegExp): AssetSpecification {
    const regex =
      typeof pattern === "string" ? new RegExp(pattern, "i") : pattern;
    return new AssetsByTitlePatternSpecification(regex);
  }

  /**
   * Combine multiple specifications with AND logic
   */
  static all(...specifications: AssetSpecification[]): AssetSpecification {
    if (specifications.length === 0) {
      throw new Error("At least one specification required");
    }

    return specifications.reduce((combined, spec) => combined.and(spec));
  }

  /**
   * Combine multiple specifications with OR logic
   */
  static any(...specifications: AssetSpecification[]): AssetSpecification {
    if (specifications.length === 0) {
      throw new Error("At least one specification required");
    }

    return specifications.reduce((combined, spec) => combined.or(spec));
  }
}
