import { App, TFile } from "obsidian";
import { Result } from "../core/Result";
import { globalPropertyPerformanceMonitor } from "./PropertyDiscoveryPerformanceMonitor";

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
   * Performance optimized with monitoring, caching, and efficient filtering
   */
  async discoverPropertiesForClass(
    className: string,
  ): Promise<Result<PropertyMetadata[]>> {
    // Start performance monitoring
    const files = this.app.vault.getMarkdownFiles();
    const operationId = globalPropertyPerformanceMonitor.startOperation(
      className,
      files.length,
    );
    const errors: string[] = [];

    try {
      // Check cache first for better performance
      const cacheKey = `properties_${className}`;
      const cached = this.getFromCache<PropertyMetadata[]>(cacheKey);
      if (cached) {
        globalPropertyPerformanceMonitor.completeOperation(
          operationId,
          cached.length,
          true,
        );
        return Result.ok(cached);
      }

      // Get all classes in hierarchy (including superclasses)
      const classHierarchy = await this.getClassHierarchy(className);
      const properties: PropertyMetadata[] = [];
      const seen = new Set<string>();

      // Performance optimization: batch process files
      const propertyFiles = this.filterPropertyFiles(files);

      for (const file of propertyFiles) {
        try {
          const cache = this.app.metadataCache.getFileCache(file);
          if (!cache?.frontmatter) continue;

          // Check if property domain matches any class in hierarchy
          const domain = this.extractDomain(cache.frontmatter);
          if (!this.domainMatchesClassHierarchy(domain, classHierarchy))
            continue;

          const propertyName = file.basename;
          if (seen.has(propertyName)) continue;
          seen.add(propertyName);

          // Extract property metadata
          const metadata = this.extractPropertyMetadata(
            file,
            cache.frontmatter,
          );
          properties.push(metadata);
        } catch (fileError) {
          const errorMsg = `Error processing property file ${file.basename}: ${fileError instanceof Error ? fileError.message : String(fileError)}`;
          errors.push(errorMsg);
          console.warn(`[PropertyDiscovery] ${errorMsg}`);
        }
      }

      // Core properties are handled automatically by the Asset entity and use case
      // They should not be displayed as user-editable fields in the modal

      // Sort properties: required first, then alphabetical
      properties.sort((a, b) => {
        if (a.isRequired !== b.isRequired) {
          return a.isRequired ? -1 : 1;
        }
        return a.label.localeCompare(b.label);
      });

      // Cache the result for future use
      this.setCache(cacheKey, properties);

      // Complete performance monitoring
      globalPropertyPerformanceMonitor.completeOperation(
        operationId,
        properties.length,
        false,
        errors,
      );

      return Result.ok(properties);
    } catch (error) {
      const errorMessage = `Failed to discover properties: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMessage);

      // Complete monitoring with error
      globalPropertyPerformanceMonitor.completeOperation(
        operationId,
        0,
        false,
        errors,
      );

      return Result.fail(errorMessage);
    }
  }

  /**
   * Filter files to only property definitions for performance optimization
   */
  private filterPropertyFiles(files: TFile[]): TFile[] {
    const propertyFiles: TFile[] = [];

    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (cache?.frontmatter && this.isPropertyDefinition(cache.frontmatter)) {
        propertyFiles.push(file);
      }
    }

    return propertyFiles;
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
   * Performance optimized with caching and monitoring
   */
  async getInstancesOfClass(
    className: string,
  ): Promise<Result<Array<{ label: string; value: string; file: TFile }>>> {
    // Start performance monitoring
    const files = this.app.vault.getMarkdownFiles();
    const operationId = globalPropertyPerformanceMonitor.startOperation(
      `instances_${className}`,
      files.length,
    );

    try {
      // Check cache first
      const cacheKey = `instances_${className}`;
      const cached =
        this.getFromCache<Array<{ label: string; value: string; file: TFile }>>(
          cacheKey,
        );
      if (cached) {
        globalPropertyPerformanceMonitor.completeOperation(
          operationId,
          cached.length,
          true,
        );
        return Result.ok(cached);
      }

      const instances: Array<{ label: string; value: string; file: TFile }> =
        [];

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

      // Cache the result
      this.setCache(cacheKey, instances);

      // Complete monitoring
      globalPropertyPerformanceMonitor.completeOperation(
        operationId,
        instances.length,
        false,
      );

      return Result.ok(instances);
    } catch (error) {
      const errorMessage = `Failed to get instances: ${error instanceof Error ? error.message : String(error)}`;
      globalPropertyPerformanceMonitor.completeOperation(
        operationId,
        0,
        false,
        [errorMessage],
      );
      return Result.fail(errorMessage);
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
   * Core properties are automatically handled by the Asset entity and CreateAssetUseCase.
   * They are not included in user-editable properties to prevent duplication and confusion.
   * 
   * Core properties that are auto-generated:
   * - exo__Asset_uid: Unique identifier (UUID)
   * - exo__Asset_isDefinedBy: Ontology reference 
   * - exo__Instance_class: Asset class
   * - exo__Asset_createdAt: Creation timestamp
   * - exo__Asset_updatedAt: Last update timestamp
   * - exo__Asset_version: Version number for optimistic locking
   */
  private addCorePropertiesDocumentation(): void {
    // This method exists solely for documentation purposes.
    // Core properties are handled automatically by the domain layer.
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

  /**
   * Simple in-memory cache for performance optimization
   */
  private cache = new Map<string, any>();
  private cacheTimestamps = new Map<string, number>();
  private readonly cacheMaxAge = 5 * 60 * 1000; // 5 minutes

  private getFromCache<T>(key: string): T | null {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp || Date.now() - timestamp > this.cacheMaxAge) {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
      return null;
    }

    return this.cache.get(key) || null;
  }

  private setCache<T>(key: string, value: T): void {
    this.cache.set(key, value);
    this.cacheTimestamps.set(key, Date.now());

    // Clean up old cache entries if cache is getting too large
    if (this.cache.size > 100) {
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, timestamp] of this.cacheTimestamps.entries()) {
      if (now - timestamp > this.cacheMaxAge) {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
      }
    }
  }

  /**
   * Clear the cache (useful for testing or when vault changes)
   */
  public clearCache(): void {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  public getCacheStats(): {
    size: number;
    hitRate: number;
    oldestEntry: number;
  } {
    const now = Date.now();
    let oldestTimestamp = now;

    for (const timestamp of this.cacheTimestamps.values()) {
      if (timestamp < oldestTimestamp) {
        oldestTimestamp = timestamp;
      }
    }

    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses for accurate calculation
      oldestEntry: oldestTimestamp,
    };
  }
}
