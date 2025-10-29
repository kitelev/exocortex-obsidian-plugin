import { TFile } from "obsidian";

type ObsidianApp = any;

export class AssetMetadataService {
  constructor(private app: ObsidianApp) {}

  getAssetLabel(path: string): string | null {
    let file = this.app.metadataCache.getFirstLinkpathDest(path, "");

    if (!file && !path.endsWith(".md")) {
      file = this.app.metadataCache.getFirstLinkpathDest(path + ".md", "");
    }

    if (!(file instanceof TFile)) {
      return null;
    }

    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};

    const label = metadata.exo__Asset_label;
    if (label && typeof label === "string" && label.trim() !== "") {
      return label;
    }

    const prototypeRef = metadata.ems__Effort_prototype;
    if (prototypeRef) {
      const prototypePath =
        typeof prototypeRef === "string"
          ? prototypeRef.replace(/^\[\[|\]\]$/g, "").trim()
          : null;

      if (prototypePath) {
        const prototypeFile = this.app.metadataCache.getFirstLinkpathDest(
          prototypePath,
          "",
        );
        if (prototypeFile instanceof TFile) {
          const prototypeCache =
            this.app.metadataCache.getFileCache(prototypeFile);
          const prototypeMetadata = prototypeCache?.frontmatter || {};
          const prototypeLabel = prototypeMetadata.exo__Asset_label;

          if (
            prototypeLabel &&
            typeof prototypeLabel === "string" &&
            prototypeLabel.trim() !== ""
          ) {
            return prototypeLabel;
          }
        }
      }
    }

    return null;
  }

  extractFirstValue(value: unknown): string | null {
    if (!value) {
      return null;
    }

    if (typeof value === "string" && value.trim() !== "") {
      return value.replace(/^\[\[|\]\]$/g, "").trim();
    }

    if (Array.isArray(value) && value.length > 0) {
      const firstValue = value[0];
      if (typeof firstValue === "string" && firstValue.trim() !== "") {
        return firstValue.replace(/^\[\[|\]\]$/g, "").trim();
      }
    }

    return null;
  }

  getEffortArea(
    metadata: Record<string, unknown>,
    visited: Set<string> = new Set(),
  ): string | null {
    if (!metadata || typeof metadata !== "object") {
      return null;
    }

    const area = metadata.ems__Effort_area;
    const directArea = this.extractFirstValue(area);
    if (directArea) {
      return directArea;
    }

    const prototypeRef = metadata.ems__Effort_prototype;
    const prototypePath = this.extractFirstValue(prototypeRef);

    if (prototypePath && !visited.has(prototypePath)) {
      visited.add(prototypePath);
      const prototypeFile = this.app.metadataCache.getFirstLinkpathDest(
        prototypePath,
        "",
      );
      if (prototypeFile instanceof TFile) {
        const prototypeCache =
          this.app.metadataCache.getFileCache(prototypeFile);
        const prototypeMetadata = prototypeCache?.frontmatter || {};

        const resolvedArea = this.getEffortArea(prototypeMetadata, visited);
        if (resolvedArea) {
          return resolvedArea;
        }
      }
    }

    const parentRef = metadata.ems__Effort_parent;
    const parentPath = this.extractFirstValue(parentRef);

    if (parentPath && !visited.has(parentPath)) {
      visited.add(parentPath);
      const parentFile = this.app.metadataCache.getFirstLinkpathDest(
        parentPath,
        "",
      );
      if (parentFile instanceof TFile) {
        const parentCache = this.app.metadataCache.getFileCache(parentFile);
        const parentMetadata = parentCache?.frontmatter || {};

        const resolvedArea = this.getEffortArea(parentMetadata, visited);
        if (resolvedArea) {
          return resolvedArea;
        }
      }
    }

    return null;
  }

  extractInstanceClass(metadata: Record<string, any>): string {
    const instanceClass = metadata.exo__Instance_class || "";
    if (Array.isArray(instanceClass)) {
      const firstClass = instanceClass[0] || "";
      return String(firstClass)
        .replace(/^\[\[|\]\]$/g, "")
        .trim();
    }
    return String(instanceClass)
      .replace(/^\[\[|\]\]$/g, "")
      .trim();
  }
}
