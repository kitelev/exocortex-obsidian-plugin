import { AssetId } from "../value-objects/AssetId";
import { ClassName } from "../value-objects/ClassName";
import { OntologyPrefix } from "../value-objects/OntologyPrefix";
import { Entity } from "../core/Entity";
import { Result } from "../core/Result";

interface AssetProps {
  id: AssetId;
  title: string;
  className: ClassName;
  ontology: OntologyPrefix;
  label?: string;
  description?: string;
  properties: Map<string, any>;
  createdAt: Date;
  updatedAt: Date;
  filePath?: string; // Store the actual file path
}

/**
 * Domain entity representing an Exocortex Asset
 * Core business logic and invariants
 */
export class Asset extends Entity<AssetProps> {
  private constructor(props: AssetProps) {
    super(props);
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

    const props: AssetProps = {
      id: params.id,
      title: params.label,
      className: params.className,
      ontology: params.ontology,
      label: params.label,
      description: params.description,
      properties: new Map(Object.entries(params.properties || {})),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return Result.ok<Asset>(new Asset(props));
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

  getProperties(): Map<string, any> {
    return new Map(this.props.properties);
  }

  getProperty(key: string): any {
    return this.props.properties.get(key);
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  updateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error("Asset title cannot be empty");
    }
    this.props.title = title;
    this.props.updatedAt = new Date();
  }

  setProperty(key: string, value: any): void {
    this.props.properties.set(key, value);
    this.props.updatedAt = new Date();
  }

  removeProperty(key: string): void {
    this.props.properties.delete(key);
    this.props.updatedAt = new Date();
  }

  changeClass(className: ClassName): void {
    this.props.className = className;
    this.props.updatedAt = new Date();
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
      exo__Instance_class: [this.props.className.toWikiLink()],
    };

    // Add custom properties
    for (const [key, value] of this.props.properties) {
      if (!frontmatter[key]) {
        frontmatter[key] = value;
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
        // Update timestamps with validated values
        (asset as any).props.createdAt = createdAt;
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
