import { AssetId } from "../value-objects/AssetId";
import { ClassName } from "../value-objects/ClassName";
import { OntologyPrefix } from "../value-objects/OntologyPrefix";
import { PropertyValue } from "../value-objects/PropertyValue";
import { Entity, DomainEvent } from "../core/Entity";
import { Result } from "../core/Result";

interface AssetProps {
  id: AssetId;
  title: string;
  className: ClassName;
  ontology: OntologyPrefix;
  label?: string;
  description?: string;
  properties: Map<string, PropertyValue>;
  createdAt: Date;
  updatedAt: Date;
  filePath?: string;
  version: number; // For optimistic locking
}

/**
 * Domain entity representing an Exocortex Asset
 * Core business logic and invariants
 */
export class Asset extends Entity<AssetProps> {
  private constructor(props: AssetProps, id?: string) {
    super(props, props.id.toString());
  }

  protected generateId(): string {
    return this.props.id.toString();
  }

  protected validate(): void {
    if (!this.props.id) {
      throw new Error("Asset must have a valid ID");
    }

    if (!this.props.title || this.props.title.trim().length === 0) {
      throw new Error("Asset must have a non-empty title");
    }

    if (this.props.title.length > 200) {
      throw new Error("Asset title cannot exceed 200 characters");
    }

    if (!this.props.className) {
      throw new Error("Asset must have a valid class name");
    }

    if (!this.props.ontology) {
      throw new Error("Asset must belong to a valid ontology");
    }

    // Validate all property values
    for (const [key, propertyValue] of this.props.properties) {
      if (!(propertyValue instanceof PropertyValue)) {
        throw new Error(`Property '${key}' must be a PropertyValue instance`);
      }
    }
  }

  static create(params: {
    id: AssetId;
    className: ClassName;
    ontology: OntologyPrefix;
    label: string;
    description?: string;
    properties?: Record<string, any>;
  }): Result<Asset> {
    if (!params.label || params.label.trim().length === 0) {
      return Result.fail<Asset>("Asset label cannot be empty");
    }

    if (params.label.length > 200) {
      return Result.fail<Asset>("Asset label cannot exceed 200 characters");
    }

    // Convert properties to PropertyValue objects
    const propertyMap = new Map<string, PropertyValue>();
    if (params.properties) {
      for (const [key, value] of Object.entries(params.properties)) {
        const propertyValueResult = PropertyValue.create(value);
        if (!propertyValueResult.isSuccess) {
          return Result.fail<Asset>(
            `Invalid property '${key}': ${propertyValueResult.getError()}`,
          );
        }
        propertyMap.set(key, propertyValueResult.getValue()!);
      }
    }

    const props: AssetProps = {
      id: params.id,
      title: params.label.trim(),
      className: params.className,
      ontology: params.ontology,
      label: params.label.trim(),
      description: params.description?.trim(),
      properties: propertyMap,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };

    try {
      const asset = new Asset(props);
      asset.validate();

      // Add domain event for asset creation
      asset.addDomainEvent(
        asset.createDomainEvent("AssetCreated", {
          assetId: params.id.toString(),
          className: params.className.toString(),
          ontology: params.ontology.toString(),
        }),
      );

      return Result.ok<Asset>(asset);
    } catch (error) {
      return Result.fail<Asset>(`Asset creation failed: ${error}`);
    }
  }

  // Getters
  getId(): AssetId {
    return this.props.id;
  }

  getTitle(): string {
    return this.props.title;
  }

  getClassName(): ClassName {
    return this.props.className;
  }

  getOntologyPrefix(): OntologyPrefix {
    return this.props.ontology;
  }

  getProperties(): Map<string, PropertyValue> {
    return new Map(this.props.properties);
  }

  getProperty(key: string): PropertyValue | undefined {
    return this.props.properties.get(key);
  }

  getPropertyValue(key: string): any {
    const propertyValue = this.props.properties.get(key);
    return propertyValue ? propertyValue.getValue() : undefined;
  }

  hasProperty(key: string): boolean {
    return this.props.properties.has(key);
  }

  getVersion(): number {
    return this.props.version;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  updateTitle(title: string): Result<void> {
    if (!title || title.trim().length === 0) {
      return Result.fail<void>("Asset title cannot be empty");
    }

    if (title.length > 200) {
      return Result.fail<void>("Asset title cannot exceed 200 characters");
    }

    const oldTitle = this.props.title;
    this.props.title = title.trim();
    this.props.label = title.trim();
    this.props.updatedAt = new Date();
    this.props.version += 1;

    this.addDomainEvent(
      this.createDomainEvent("AssetTitleUpdated", {
        assetId: this.props.id.toString(),
        oldTitle,
        newTitle: title.trim(),
      }),
    );

    return Result.ok<void>();
  }

  setProperty(key: string, value: any): Result<void> {
    if (!key || key.trim().length === 0) {
      return Result.fail<void>("Property key cannot be empty");
    }

    const propertyValueResult = PropertyValue.create(value);
    if (!propertyValueResult.isSuccess) {
      return Result.fail<void>(
        `Invalid property value: ${propertyValueResult.getError()}`,
      );
    }

    const oldValue = this.props.properties.get(key);
    this.props.properties.set(key, propertyValueResult.getValue()!);
    this.props.updatedAt = new Date();
    this.props.version += 1;

    this.addDomainEvent(
      this.createDomainEvent("AssetPropertyUpdated", {
        assetId: this.props.id.toString(),
        propertyKey: key,
        oldValue: oldValue?.getValue(),
        newValue: value,
      }),
    );

    return Result.ok<void>();
  }

  removeProperty(key: string): Result<void> {
    if (!this.props.properties.has(key)) {
      return Result.fail<void>(`Property '${key}' does not exist`);
    }

    const oldValue = this.props.properties.get(key);
    this.props.properties.delete(key);
    this.props.updatedAt = new Date();
    this.props.version += 1;

    this.addDomainEvent(
      this.createDomainEvent("AssetPropertyRemoved", {
        assetId: this.props.id.toString(),
        propertyKey: key,
        removedValue: oldValue?.getValue(),
      }),
    );

    return Result.ok<void>();
  }

  changeClass(className: ClassName): Result<void> {
    if (!className) {
      return Result.fail<void>("Class name cannot be null");
    }

    const oldClassName = this.props.className;
    this.props.className = className;
    this.props.updatedAt = new Date();
    this.props.version += 1;

    this.addDomainEvent(
      this.createDomainEvent("AssetClassChanged", {
        assetId: this.props.id.toString(),
        oldClassName: oldClassName.toString(),
        newClassName: className.toString(),
      }),
    );

    return Result.ok<void>();
  }

  updateDescription(description: string): Result<void> {
    if (description && description.length > 2000) {
      return Result.fail<void>("Description cannot exceed 2000 characters");
    }

    const oldDescription = this.props.description;
    this.props.description = description?.trim();
    this.props.updatedAt = new Date();
    this.props.version += 1;

    this.addDomainEvent(
      this.createDomainEvent("AssetDescriptionUpdated", {
        assetId: this.props.id.toString(),
        oldDescription,
        newDescription: description?.trim(),
      }),
    );

    return Result.ok<void>();
  }

  /**
   * Apply bulk property updates atomically
   */
  updateProperties(updates: Record<string, any>): Result<void> {
    const validatedProperties = new Map<string, PropertyValue>();

    // Validate all properties first
    for (const [key, value] of Object.entries(updates)) {
      if (!key || key.trim().length === 0) {
        return Result.fail<void>("Property key cannot be empty");
      }

      const propertyValueResult = PropertyValue.create(value);
      if (!propertyValueResult.isSuccess) {
        return Result.fail<void>(
          `Invalid property '${key}': ${propertyValueResult.getError()}`,
        );
      }

      validatedProperties.set(key, propertyValueResult.getValue()!);
    }

    // Apply all updates atomically
    const oldProperties = new Map(this.props.properties);
    for (const [key, propertyValue] of validatedProperties) {
      this.props.properties.set(key, propertyValue);
    }

    this.props.updatedAt = new Date();
    this.props.version += 1;

    this.addDomainEvent(
      this.createDomainEvent("AssetPropertiesUpdated", {
        assetId: this.props.id.toString(),
        updatedProperties: Object.keys(updates),
        changeCount: validatedProperties.size,
      }),
    );

    return Result.ok<void>();
  }

  /**
   * Check if asset can be deleted (business rules)
   */
  canDelete(): { canDelete: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // Add business rules for deletion
    // For example: cannot delete if it has dependent assets

    return {
      canDelete: reasons.length === 0,
      reasons,
    };
  }

  /**
   * Mark asset as deleted (soft delete)
   */
  markAsDeleted(): Result<void> {
    const deleteCheck = this.canDelete();
    if (!deleteCheck.canDelete) {
      return Result.fail<void>(
        `Cannot delete asset: ${deleteCheck.reasons.join(", ")}`,
      );
    }

    this.addDomainEvent(
      this.createDomainEvent("AssetDeleted", {
        assetId: this.props.id.toString(),
        className: this.props.className.toString(),
        title: this.props.title,
      }),
    );

    return Result.ok<void>();
  }

  toFrontmatter(): Record<string, any> {
    // Always ensure mandatory fields are present with proper formats
    const frontmatter: Record<string, any> = {
      exo__Asset_uid: this.props.id.toString(),
      exo__Asset_label: this.props.title,
      exo__Asset_isDefinedBy: `[[!${this.props.ontology.toString()}]]`,
      exo__Asset_createdAt: this.props.createdAt
        .toISOString()
        .replace(/\.\d{3}Z$/, ""), // Remove milliseconds for cleaner format
      exo__Asset_updatedAt: this.props.updatedAt
        .toISOString()
        .replace(/\.\d{3}Z$/, ""),
      exo__Asset_version: this.props.version,
      exo__Instance_class: [this.props.className.toWikiLink()],
    };

    // Add description if present
    if (this.props.description) {
      frontmatter.exo__Asset_description = this.props.description;
    }

    // Add custom properties with proper value extraction
    for (const [key, propertyValue] of this.props.properties) {
      if (!frontmatter[key]) {
        frontmatter[key] = propertyValue.getValue();
      }
    }

    return frontmatter;
  }

  /**
   * Validates if an asset has all mandatory properties for creation
   * @param frontmatter The frontmatter to validate
   * @returns ValidationResult indicating success or failure with details
   */
  private static validateMandatoryProperties(
    frontmatter: Record<string, any>,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for mandatory exo__Asset_uid (UUID format)
    const uid = frontmatter["exo__Asset_uid"];
    if (!uid) {
      errors.push("Missing mandatory field: exo__Asset_uid");
    } else {
      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(uid.toString())) {
        errors.push("exo__Asset_uid must be a valid UUID format");
      }
    }

    // Check for mandatory exo__Asset_isDefinedBy (ontology reference)
    const isDefinedBy = frontmatter["exo__Asset_isDefinedBy"];
    if (!isDefinedBy) {
      errors.push("Missing mandatory field: exo__Asset_isDefinedBy");
    } else {
      // Validate format like "[[Ontology - Exocortex]]" or "[[!exo]]"
      const ontologyRegex = /^\[\[(!?[a-zA-Z][a-zA-Z0-9_\- ]*)\]\]$/;
      if (!ontologyRegex.test(isDefinedBy.toString())) {
        errors.push(
          "exo__Asset_isDefinedBy must be in format [[Ontology Name]] or [[!prefix]]",
        );
      }
    }

    // Check for mandatory exo__Asset_createdAt (ISO timestamp)
    const createdAt = frontmatter["exo__Asset_createdAt"];
    if (!createdAt) {
      errors.push("Missing mandatory field: exo__Asset_createdAt");
    } else {
      // Validate ISO timestamp format (YYYY-MM-DDTHH:mm:ss or with milliseconds and timezone)
      const isoRegex =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/;
      if (!isoRegex.test(createdAt.toString())) {
        errors.push(
          "exo__Asset_createdAt must be in ISO timestamp format (YYYY-MM-DDTHH:mm:ss)",
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static fromFrontmatter(
    frontmatter: Record<string, any>,
    fileName: string,
  ): Asset | null {
    // Validate mandatory properties first
    const validation = Asset.validateMandatoryProperties(frontmatter);
    if (!validation.isValid) {
      console.warn(
        `Asset validation failed for ${fileName}:`,
        validation.errors,
      );
      return null; // Silently ignore invalid assets
    }

    try {
      const idResult = AssetId.create(frontmatter["exo__Asset_uid"]);
      if (!idResult.isSuccess) {
        console.warn(`Invalid Asset ID for ${fileName}:`, idResult.getError());
        return null;
      }
      const id = idResult.getValue()!;

      const label =
        frontmatter["exo__Asset_label"] || fileName.replace(".md", "");

      const classValue = Array.isArray(frontmatter["exo__Instance_class"])
        ? frontmatter["exo__Instance_class"][0]
        : frontmatter["exo__Instance_class"];
      const classNameResult = ClassName.create(classValue || "exo__Asset");
      const className = classNameResult.isSuccess
        ? classNameResult.getValue()
        : ClassName.create("exo__Asset").getValue()!;

      const ontologyValue =
        frontmatter["exo__Asset_isDefinedBy"]?.replace(/\[\[!?|\]\]/g, "") ||
        "exo";
      const ontologyResult = OntologyPrefix.create(ontologyValue);
      const ontology = ontologyResult.isSuccess
        ? ontologyResult.getValue()
        : OntologyPrefix.create("exo").getValue()!;

      const createdAt = new Date(frontmatter["exo__Asset_createdAt"]);
      if (isNaN(createdAt.getTime())) {
        console.warn(`Invalid createdAt timestamp for ${fileName}`);
        return null;
      }

      const properties: Record<string, any> = {};
      for (const [key, value] of Object.entries(frontmatter)) {
        if (
          !key.startsWith("exo__Asset_") &&
          !key.startsWith("exo__Instance_")
        ) {
          properties[key] = value;
        }
      }

      // Use the factory method instead of constructor
      const result = Asset.create({
        id,
        label,
        className,
        ontology,
        properties,
      });

      if (result.isSuccess) {
        const asset = result.getValue()!;
        // Update timestamps and version with validated values
        (asset as any).props.createdAt = createdAt;
        (asset as any).props.version = frontmatter["exo__Asset_version"] || 1;

        const updatedAt = frontmatter["exo__Asset_updatedAt"];
        if (updatedAt) {
          const updatedAtDate = new Date(updatedAt);
          if (!isNaN(updatedAtDate.getTime())) {
            (asset as any).props.updatedAt = updatedAtDate;
          }
        }

        return asset;
      } else {
        console.warn(
          "Failed to create asset from frontmatter:",
          result.getError(),
        );
      }

      return null;
    } catch (error) {
      console.warn("Failed to create asset from frontmatter:", error);
      return null;
    }
  }
}
