import { TFile } from "obsidian";

/**
 * Shared utilities for asset relation operations
 * Implements DRY principle by centralizing common functionality
 */
export class AssetRelationUtils {
  /**
   * Check if an asset is archived based on frontmatter property
   * Handles various truthy values (true, "true", "yes", 1) gracefully
   */
  static isAssetArchived(metadata: Record<string, any>): boolean {
    const archived = metadata?.archived;

    // Handle undefined/null
    if (archived === undefined || archived === null) {
      return false;
    }

    // Handle boolean
    if (typeof archived === "boolean") {
      return archived;
    }

    // Handle string values (case-insensitive)
    if (typeof archived === "string") {
      const lowerValue = archived.toLowerCase().trim();
      return (
        lowerValue === "true" || lowerValue === "yes" || lowerValue === "1"
      );
    }

    // Handle numeric values
    if (typeof archived === "number") {
      return archived !== 0;
    }

    // Default to false for any other type
    return false;
  }

  /**
   * Find which frontmatter property contains a reference to the target file
   * Handles both regular [[Link]] and piped [[Link|Alias]] formats
   */
  static findReferencingProperty(
    metadata: Record<string, any>,
    targetBasename: string,
    targetPath: string,
  ): string | undefined {
    for (const [key, value] of Object.entries(metadata)) {
      if (!value) continue;

      const valueStr = String(value);
      // Check for wiki-link format [[FileName]] or [[path/to/file]]
      if (
        valueStr.includes(`[[${targetBasename}]]`) ||
        valueStr.includes(`[[${targetPath}]]`) ||
        valueStr.includes(`[[${targetPath.replace(".md", "")}]]`)
      ) {
        return key;
      }

      // Check for piped links - [[Target|Alias]] format
      if (
        valueStr.includes(`[[${targetBasename}|`) ||
        valueStr.includes(`[[${targetPath}|`) ||
        valueStr.includes(`[[${targetPath.replace(".md", "")}|`)
      ) {
        return key;
      }

      // Check for array values (e.g., tags, related, etc.)
      if (Array.isArray(value)) {
        for (const item of value) {
          const itemStr = String(item);
          if (
            itemStr.includes(`[[${targetBasename}]]`) ||
            itemStr.includes(`[[${targetPath}]]`) ||
            itemStr.includes(`[[${targetPath.replace(".md", "")}]]`)
          ) {
            return key;
          }

          // Check for piped links - [[Target|Alias]] format
          if (
            itemStr.includes(`[[${targetBasename}|`) ||
            itemStr.includes(`[[${targetPath}|`) ||
            itemStr.includes(`[[${targetPath.replace(".md", "")}|`)
          ) {
            return key;
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Get a property value from a relation object or its metadata
   * Supports nested property access using dot notation
   */
  static getPropertyValue(relation: any, property: string): any {
    // Check frontmatter/metadata first
    if (relation.metadata && relation.metadata[property] !== undefined) {
      return relation.metadata[property];
    }

    // Check direct properties
    if (relation[property] !== undefined) {
      return relation[property];
    }

    // Check nested properties using dot notation
    const parts = property.split(".");
    let value: any = relation;
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) break;
    }

    return value;
  }

  /**
   * Sort relations array based on column and order
   * Handles Name, exo__Instance_class, and custom properties
   */
  static sortRelations(
    relations: any[],
    column: string,
    order: 'asc' | 'desc'
  ): any[] {
    return [...relations].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (column === 'Name') {
        aValue = String(a.title || '').toLowerCase();
        bValue = String(b.title || '').toLowerCase();
      } else if (column === 'exo__Instance_class') {
        // Safely convert to string, handling arrays and other types
        const aClass = a.metadata?.exo__Instance_class || a.metadata?.['exo__Instance_class'] || '';
        const bClass = b.metadata?.exo__Instance_class || b.metadata?.['exo__Instance_class'] || '';
        aValue = String(Array.isArray(aClass) ? aClass[0] || '' : aClass).toLowerCase();
        bValue = String(Array.isArray(bClass) ? bClass[0] || '' : bClass).toLowerCase();
      } else {
        // For other columns, use the generic property getter
        const aRaw = AssetRelationUtils.getPropertyValue(a, column);
        const bRaw = AssetRelationUtils.getPropertyValue(b, column);
        
        // Safely convert to string for comparison
        if (aRaw !== undefined && aRaw !== null) {
          aValue = String(Array.isArray(aRaw) ? aRaw[0] || '' : aRaw).toLowerCase();
        }
        if (bRaw !== undefined && bRaw !== null) {
          bValue = String(Array.isArray(bRaw) ? bRaw[0] || '' : bRaw).toLowerCase();
        }
      }

      // Handle undefined/null values - put them at the end
      if (aValue === undefined || aValue === null || aValue === '') return 1;
      if (bValue === undefined || bValue === null || bValue === '') return -1;

      // Compare values
      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }
}