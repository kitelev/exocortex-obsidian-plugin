export class MetadataHelpers {
  static findAllReferencingProperties(
    metadata: Record<string, any>,
    currentFileName: string,
  ): string[] {
    const properties: string[] = [];
    for (const [key, value] of Object.entries(metadata)) {
      if (this.containsReference(value, currentFileName)) {
        properties.push(key);
      }
    }
    return properties;
  }

  static findReferencingProperty(
    metadata: Record<string, any>,
    currentFileName: string,
  ): string | undefined {
    for (const [key, value] of Object.entries(metadata)) {
      if (this.containsReference(value, currentFileName)) {
        return key;
      }
    }
    return undefined;
  }

  static containsReference(value: any, fileName: string): boolean {
    if (!value) return false;

    const cleanName = fileName.replace(/\.md$/, "");

    if (typeof value === "string") {
      return value.includes(`[[${cleanName}]]`) || value.includes(cleanName);
    }

    if (Array.isArray(value)) {
      return value.some((v) => this.containsReference(v, fileName));
    }

    return false;
  }

  static isAssetArchived(metadata: Record<string, any>): boolean {
    if (metadata?.exo__Asset_isArchived === true) {
      return true;
    }

    const archivedValue = metadata?.archived;

    if (archivedValue === undefined || archivedValue === null) {
      return false;
    }

    if (typeof archivedValue === "boolean") {
      return archivedValue;
    }

    if (typeof archivedValue === "number") {
      return archivedValue !== 0;
    }

    if (typeof archivedValue === "string") {
      const normalized = archivedValue.toLowerCase().trim();
      return (
        normalized === "true" || normalized === "yes" || normalized === "1"
      );
    }

    return false;
  }

  static getPropertyValue(
    relation: { title: string; created: number; modified: number; path: string; metadata?: Record<string, any> },
    propertyName: string,
  ): any {
    if (propertyName === "Name") return relation.title;
    if (propertyName === "title") return relation.title;
    if (propertyName === "created") return relation.created;
    if (propertyName === "modified") return relation.modified;
    if (propertyName === "path") return relation.path;
    return relation.metadata?.[propertyName];
  }
}
