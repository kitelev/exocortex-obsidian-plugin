import { TFile, MetadataCache, CachedMetadata } from "obsidian";
import { CommandVisibilityContext } from "../../domain/commands/CommandVisibility";

export class MetadataExtractor {
  constructor(private metadataCache: MetadataCache) {}

  extractMetadata(file: TFile | null): Record<string, any> {
    if (!file) return {};

    const cache = this.metadataCache.getFileCache(file);
    return cache?.frontmatter || {};
  }

  extractInstanceClass(metadata: Record<string, any>): string | string[] | null {
    return metadata.exo__Instance_class || null;
  }

  extractStatus(metadata: Record<string, any>): string | string[] | null {
    return metadata.ems__Effort_status || null;
  }

  extractIsArchived(metadata: Record<string, any>): boolean {
    const archived = metadata.exo__Asset_isArchived;
    if (archived === true || archived === 1) return true;
    if (typeof archived === "string") {
      const lowerValue = archived.toLowerCase();
      return lowerValue === "true" || lowerValue === "yes";
    }
    return false;
  }

  static extractIsDefinedBy(sourceMetadata: Record<string, any>): string {
    let isDefinedBy = sourceMetadata.exo__Asset_isDefinedBy || '""';
    if (Array.isArray(isDefinedBy)) {
      isDefinedBy = isDefinedBy[0] || '""';
    }
    return isDefinedBy;
  }

  extractExpectedFolder(metadata: Record<string, any>): string | null {
    const isDefinedBy = metadata.exo__Asset_isDefinedBy;
    if (!isDefinedBy) return null;

    const definedByValue = Array.isArray(isDefinedBy) ? isDefinedBy[0] : isDefinedBy;
    if (!definedByValue || typeof definedByValue !== "string") return null;

    const cleanValue = definedByValue.replace(/["'[\]]/g, "").trim();
    if (!cleanValue) return null;

    const parts = cleanValue.split("/");
    parts.pop();
    return parts.join("/");
  }

  extractCommandVisibilityContext(file: TFile): CommandVisibilityContext {
    const metadata = this.extractMetadata(file);
    const instanceClass = this.extractInstanceClass(metadata);
    const currentStatus = this.extractStatus(metadata);
    const isArchived = this.extractIsArchived(metadata);
    const currentFolder = file.parent?.path || "";
    const expectedFolder = this.extractExpectedFolder(metadata);

    return {
      instanceClass,
      currentStatus,
      metadata,
      isArchived,
      currentFolder,
      expectedFolder,
    };
  }

  extractCache(file: TFile | null): CachedMetadata | null {
    if (!file) return null;
    return this.metadataCache.getFileCache(file);
  }
}
