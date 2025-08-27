import { App, TFile } from "obsidian";
import { Result } from "../core/Result";

/**
 * Property metadata interface following semantic web standards
 */
export interface PropertyMetadata {
  name: string;
  label: string;
  description?: string;
  type: "ObjectProperty" | "DatatypeProperty";
  domain: string | string[];
  range: string;
  isRequired: boolean;
  options?: string[];
  defaultValue?: any;
}

/**
 * Service for discovering properties based on semantic relationships
 * Follows SOLID principles with single responsibility for property discovery
 */
export class SemanticPropertyDiscoveryService {
  constructor(private app: App) {}

  /**
   * Discover all properties applicable to a class including inherited from superclasses
   * Performance optimized with early returns and efficient filtering
   */
  async discoverPropertiesForClass(
    className: string,
  ): Promise<Result<PropertyMetadata[]>> {
    const startTime = Date.now();
    try {
      // Get all classes in hierarchy (including superclasses)
      const classHierarchy = await this.getClassHierarchy(className);
      const properties: PropertyMetadata[] = [];
      const seen = new Set<string>();

      // Scan all property files in vault
      const files = this.app.vault.getMarkdownFiles();

      for (const file of files) {
        const cache = this.app.metadataCache.getFileCache(file);
        if (!cache?.frontmatter) continue;

        // Check if this is a property definition
        if (!this.isPropertyDefinition(cache.frontmatter)) continue;

        // Check if property domain matches any class in hierarchy
        const domain = this.extractDomain(cache.frontmatter);
        if (!this.domainMatchesClassHierarchy(domain, classHierarchy)) continue;

        const propertyName = file.basename;
        if (seen.has(propertyName)) continue;
        seen.add(propertyName);

        // Extract property metadata
        const metadata = this.extractPropertyMetadata(file, cache.frontmatter);
        properties.push(metadata);
      }

      // Add core properties that every asset should have
      this.addCoreProperties(properties, seen);

      // Sort properties: required first, then alphabetical
      properties.sort((a, b) => {
        if (a.isRequired !== b.isRequired) {
          return a.isRequired ? -1 : 1;
        }
        return a.label.localeCompare(b.label);
      });

      const duration = Date.now() - startTime;
      console.log(
        `Property discovery completed in ${duration}ms. Found ${properties.length} properties.`,
      );

      return Result.ok(properties);
    } catch (error) {
      return Result.fail(
        `Failed to discover properties: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get class hierarchy including all superclasses
   */
  private async getClassHierarchy(className: string): Promise<string[]> {
    const hierarchy = [className];
    const visited = new Set<string>([className]);

    let currentClass = className;
    while (currentClass) {
      const classFile = this.findClassFile(currentClass);
      if (!classFile) break;

      const cache = this.app.metadataCache.getFileCache(classFile);
      if (!cache?.frontmatter) break;

      const superClass = this.extractValue(
        cache.frontmatter["rdfs__subClassOf"] ||
          cache.frontmatter["exo__Class_superClass"],
      );
      if (!superClass || visited.has(superClass)) break;

      hierarchy.push(superClass);
      visited.add(superClass);
      currentClass = superClass;
    }

    return hierarchy;
  }

  /**
   * Find instances of a class for ObjectProperty dropdowns
   */
  async getInstancesOfClass(
    className: string,
  ): Promise<Result<Array<{ label: string; value: string; file: TFile }>>> {
    try {
      const instances: Array<{ label: string; value: string; file: TFile }> =
        [];
      const files = this.app.vault.getMarkdownFiles();

      for (const file of files) {
        const cache = this.app.metadataCache.getFileCache(file);
        if (!cache?.frontmatter) continue;

        const instanceClass = this.extractValue(
          cache.frontmatter["exo__Instance_class"],
        );
        if (instanceClass !== className) continue;

        const label =
          cache.frontmatter["rdfs__label"] ||
          cache.frontmatter["exo__Asset_label"] ||
          file.basename;
        const value = `[[${file.basename}]]`;

        instances.push({ label, value, file });
      }

      // Sort instances alphabetically by label
      instances.sort((a, b) => a.label.localeCompare(b.label));

      return Result.ok(instances);
    } catch (error) {
      return Result.fail(
        `Failed to get instances: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Check if frontmatter represents a property definition
   */
  private isPropertyDefinition(frontmatter: Record<string, any>): boolean {
    const instanceClass = this.extractValue(frontmatter["exo__Instance_class"]);
    const rdfType = this.extractValue(frontmatter["rdf__type"]);

    return (
      instanceClass === "exo__Property" ||
      rdfType === "exo__ObjectProperty" ||
      rdfType === "exo__DatatypeProperty" ||
      rdfType === "rdf__Property"
    );
  }

  /**
   * Extract property metadata from file and frontmatter
   */
  private extractPropertyMetadata(
    file: TFile,
    frontmatter: Record<string, any>,
  ): PropertyMetadata {
    const name = file.basename;
    const type = this.determinePropertyType(frontmatter);

    return {
      name,
      label: frontmatter["rdfs__label"] || this.humanizePropertyName(name),
      description: frontmatter["rdfs__comment"],
      type,
      domain: this.extractDomain(frontmatter),
      range: this.extractValue(
        frontmatter["rdfs__range"] ||
          frontmatter["exo__Property_range"] ||
          "string",
      ),
      isRequired: frontmatter["exo__Property_isRequired"] === true,
      options: frontmatter["exo__Property_options"],
      defaultValue: frontmatter["exo__Property_defaultValue"],
    };
  }

  /**
   * Determine if property is ObjectProperty or DatatypeProperty
   */
  private determinePropertyType(
    frontmatter: Record<string, any>,
  ): "ObjectProperty" | "DatatypeProperty" {
    const rdfType = this.extractValue(frontmatter["rdf__type"]);

    if (rdfType === "exo__ObjectProperty" || rdfType === "owl__ObjectProperty")
      return "ObjectProperty";

    if (
      rdfType === "exo__DatatypeProperty" ||
      rdfType === "owl__DatatypeProperty"
    )
      return "DatatypeProperty";

    // Infer from range - if it looks like a class name, assume ObjectProperty
    const range = this.extractValue(frontmatter["rdfs__range"]);
    if (range && this.looksLikeClassName(range)) {
      return "ObjectProperty";
    }

    return "DatatypeProperty";
  }

  /**
   * Check if a string looks like a class name (starts with uppercase or contains __)
   */
  private looksLikeClassName(value: string): boolean {
    const cleanValue = this.extractValue(value);
    return (
      /^[A-Z]/.test(cleanValue) ||
      cleanValue.includes("__") ||
      cleanValue.includes("::")
    );
  }

  /**
   * Extract domain from frontmatter (handles various formats)
   */
  private extractDomain(frontmatter: Record<string, any>): string | string[] {
    const domain =
      frontmatter["rdfs__domain"] ||
      frontmatter["exo__Property_domain"] ||
      frontmatter["domain"];

    if (Array.isArray(domain)) {
      return domain.map((d) => this.extractValue(d));
    }

    return this.extractValue(domain) || "";
  }

  /**
   * Check if domain matches any class in hierarchy
   */
  private domainMatchesClassHierarchy(
    domain: string | string[],
    hierarchy: string[],
  ): boolean {
    const domains = Array.isArray(domain) ? domain : [domain];

    for (const d of domains) {
      const cleanDomain = this.extractValue(d);
      if (hierarchy.includes(cleanDomain)) return true;
    }

    return false;
  }

  /**
   * Extract clean value from wikilink or plain string
   */
  private extractValue(value: any): string {
    if (!value) return "";
    const str = String(value);
    // Remove [[ and ]] if present
    return str.replace(/^\[\[|\]\]$/g, "");
  }

  /**
   * Find class file by name
   */
  private findClassFile(className: string): TFile | null {
    const files = this.app.vault.getMarkdownFiles();
    return files.find((f) => f.basename === className) || null;
  }

  /**
   * Add core properties that every asset should have
   */
  private addCoreProperties(
    properties: PropertyMetadata[],
    seen: Set<string>,
  ): void {
    const coreProps: PropertyMetadata[] = [
      {
        name: "exo__Asset_uid",
        label: "Unique ID",
        type: "DatatypeProperty",
        domain: "exo__Asset",
        range: "string",
        isRequired: true,
        description: "Unique identifier for this asset (auto-generated)",
      },
      {
        name: "exo__Asset_isDefinedBy",
        label: "Defined By",
        type: "ObjectProperty",
        domain: "exo__Asset",
        range: "exo__Ontology",
        isRequired: true,
        description: "The ontology that defines this asset",
      },
      {
        name: "exo__Instance_class",
        label: "Instance Class",
        type: "ObjectProperty",
        domain: "exo__Asset",
        range: "exo__Class",
        isRequired: true,
        description: "The class of this instance",
      },
    ];

    for (const prop of coreProps) {
      if (!seen.has(prop.name)) {
        properties.unshift(prop); // Add at beginning
        seen.add(prop.name);
      }
    }
  }

  /**
   * Convert property name to human-readable label
   */
  private humanizePropertyName(name: string): string {
    // Remove prefix if present (e.g., "exo__Asset_label" -> "label")
    const withoutPrefix = name.split("_").pop() || name;

    // Convert camelCase or snake_case to Title Case
    return withoutPrefix
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .trim();
  }
}
