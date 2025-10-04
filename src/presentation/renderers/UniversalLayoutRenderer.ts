import { MarkdownPostProcessorContext, TFile } from "obsidian";
import { ILogger } from "../../infrastructure/logging/ILogger";
import { LoggerFactory } from "../../infrastructure/logging/LoggerFactory";
import React from "react";
import { ReactRenderer } from "../utils/ReactRenderer";
import { AssetRelationsTable } from "../components/AssetRelationsTable";

/**
 * UniversalLayout configuration options
 */
interface UniversalLayoutConfig {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  showProperties?: string[];
}

/**
 * Asset relation data structure
 */
interface AssetRelation {
  file: TFile;
  path: string;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
  propertyName?: string; // The property through which this asset references the current one
  isBodyLink: boolean; // True if link is in body, not frontmatter
  created: number;
  modified: number;
}

/**
 * Renderer for UniversalLayout view type
 * Implements Assets Relations - showing assets grouped by the property through which they reference the current asset
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ObsidianApp = any;

export class UniversalLayoutRenderer {
  private logger: ILogger;
  private app: ObsidianApp;
  private eventListeners: Array<{
    element: HTMLElement;
    type: string;
    handler: EventListener;
  }> = [];
  private backlinksCache: Map<string, Set<string>> = new Map();
  private backlinksCacheValid = false;
  private reactRenderer: ReactRenderer;

  constructor(app: ObsidianApp) {
    this.app = app;
    this.logger = LoggerFactory.create("UniversalLayoutRenderer");
    this.reactRenderer = new ReactRenderer();
  }

  /**
   * Build reverse index of backlinks for O(1) lookups
   */
  private buildBacklinksCache(): void {
    if (this.backlinksCacheValid) return;

    this.backlinksCache.clear();
    const resolvedLinks = this.app.metadataCache.resolvedLinks;

    for (const sourcePath in resolvedLinks) {
      const links = resolvedLinks[sourcePath];
      for (const targetPath in links) {
        const existingBacklinks = this.backlinksCache.get(targetPath);
        if (!existingBacklinks) {
          this.backlinksCache.set(targetPath, new Set([sourcePath]));
        } else {
          existingBacklinks.add(sourcePath);
        }
      }
    }

    this.backlinksCacheValid = true;
  }

  /**
   * Invalidate backlinks cache when vault changes
   */
  public invalidateBacklinksCache(): void {
    this.backlinksCacheValid = false;
  }

  /**
   * Clean up all registered event listeners
   * Should be called when component is unmounted
   */
  cleanup(): void {
    this.eventListeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    this.eventListeners = [];
    this.reactRenderer.cleanup();
  }

  /**
   * Register event listener for automatic cleanup
   */
  private registerEventListener(
    element: HTMLElement,
    type: string,
    handler: EventListener,
  ): void {
    element.addEventListener(type, handler);
    this.eventListeners.push({ element, type, handler });
  }

  /**
   * Render the UniversalLayout view with Assets Relations
   */
  public async render(
    source: string,
    el: HTMLElement,
    _ctx: MarkdownPostProcessorContext,
  ): Promise<void> {
    try {
      const config = this.parseConfig(source);
      const currentFile = this.app.workspace.getActiveFile();

      if (!currentFile) {
        this.renderMessage(el, "No active file");
        return;
      }

      // Get asset relations for the current file
      const relations = await this.getAssetRelations(currentFile, config);

      if (relations.length === 0) {
        this.renderMessage(el, "No related assets found");
        return;
      }

      // Render as table with Name and exo__Instance_class columns
      await this.renderAssetRelations(el, relations, config);

      this.logger.info(
        `Rendered UniversalLayout with ${relations.length} asset relations`,
      );
    } catch (error) {
      this.logger.error("Failed to render UniversalLayout", { error });
      this.renderError(el, error.message);
    }
  }

  /**
   * Refresh the view when data changes
   */
  public async refresh(el: HTMLElement): Promise<void> {
    const source = el.getAttribute("data-source") || "";
    el.empty();
    await this.render(source, el, {} as MarkdownPostProcessorContext);
  }

  /**
   * Get asset relations for the current file
   * Analyzes HOW each asset references the current one (via which property or body)
   * Filters out archived assets to maintain clean output
   */
  private async getAssetRelations(
    file: TFile,
    config: UniversalLayoutConfig,
  ): Promise<AssetRelation[]> {
    const relations: AssetRelation[] = [];
    const cache = this.app.metadataCache;

    // Build reverse index if needed (amortized O(1) per call)
    this.buildBacklinksCache();

    // O(1) lookup of backlinks instead of O(n) iteration
    const backlinks = this.backlinksCache.get(file.path);
    if (!backlinks) {
      return relations;
    }

    // Process only files that actually link to this file
    for (const sourcePath of backlinks) {
      const sourceFile = this.app.vault.getAbstractFileByPath(sourcePath);
      // Duck typing: Check for TFile properties instead of instanceof
      if (
        sourceFile &&
        typeof sourceFile === "object" &&
        "basename" in sourceFile &&
        "path" in sourceFile &&
        "stat" in sourceFile
      ) {
        const fileCache = cache.getFileCache(sourceFile as TFile);
        const metadata = fileCache?.frontmatter || {};

        // Skip archived assets
        if (this.isAssetArchived(metadata)) {
          continue;
        }

        // Determine how this asset references the current file
        const propertyName = this.findReferencingProperty(
          metadata,
          file.basename,
        );

        const relation: AssetRelation = {
          file: sourceFile,
          path: sourcePath,
          title: sourceFile.basename,
          metadata: metadata,
          propertyName: propertyName,
          isBodyLink: !propertyName, // If no property found, it's a body link
          created: sourceFile.stat.ctime,
          modified: sourceFile.stat.mtime,
        };

        relations.push(relation);
      }
    }

    // Sort relations
    if (config.sortBy) {
      const sortBy = config.sortBy;
      relations.sort((a, b) => {
        const aVal = this.getPropertyValue(a, sortBy);
        const bVal = this.getPropertyValue(b, sortBy);
        const order = config.sortOrder === "desc" ? -1 : 1;
        return aVal > bVal ? order : -order;
      });
    }

    return relations;
  }

  /**
   * Render assets grouped by the property through which they reference the current asset
   * This is the core Assets Relations feature - Now using React components
   */
  private async renderAssetRelations(
    el: HTMLElement,
    relations: AssetRelation[],
    config: UniversalLayoutConfig,
  ): Promise<void> {
    const container = el.createDiv({ cls: "exocortex-assets-relations" });

    // Use React component for rendering
    this.reactRenderer.render(
      container,
      React.createElement(AssetRelationsTable, {
        relations,
        groupByProperty: true,
        sortBy: config.sortBy || "title",
        sortOrder: config.sortOrder || "asc",
        showProperties: config.showProperties || [],
        onAssetClick: (path: string) => {
          this.app.workspace.openLinkText(path, "", false);
        },
      }),
    );
  }

  /**
   * Parse configuration from source
   */
  private parseConfig(source: string): UniversalLayoutConfig {
    const lines = source.trim().split("\n");
    const config: UniversalLayoutConfig = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const match = trimmed.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        if (key === "sortBy") {
          config.sortBy = value;
        } else if (key === "sortOrder") {
          config.sortOrder = value as "asc" | "desc";
        } else if (key === "showProperties") {
          config.showProperties = value.split(",").map((s) => s.trim());
        }
      }
    }

    return config;
  }

  /**
   * Render a simple message
   */
  private renderMessage(el: HTMLElement, message: string): void {
    el.createDiv({
      text: message,
      cls: "exocortex-message",
    });
  }

  /**
   * Render an error message
   */
  private renderError(el: HTMLElement, message: string): void {
    el.createDiv({
      text: `Error: ${message}`,
      cls: "exocortex-error-message",
    });
  }

  /**
   * Helper method to get property value from relation
   */
  private getPropertyValue(
    relation: AssetRelation,
    propertyName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    if (propertyName === "Name") return relation.title;
    if (propertyName === "title") return relation.title;
    if (propertyName === "created") return relation.created;
    if (propertyName === "modified") return relation.modified;
    if (propertyName === "path") return relation.path;
    return relation.metadata?.[propertyName];
  }

  /**
   * Helper method to find referencing property
   */
  private findReferencingProperty(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  /**
   * Check if a value contains a reference to a file
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private containsReference(value: any, fileName: string): boolean {
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

  /**
   * Check if an asset is archived based on frontmatter metadata
   * Supports multiple archived field formats:
   * - archived: true (boolean)
   * - archived: "true" or "yes" (string)
   * - archived: 1 (number)
   * Also checks legacy exo__Asset_isArchived field for backward compatibility
   */
  private isAssetArchived(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: Record<string, any>,
  ): boolean {
    // Check legacy field first
    if (metadata?.exo__Asset_isArchived === true) {
      return true;
    }

    // Check standard 'archived' field
    const archivedValue = metadata?.archived;

    if (archivedValue === undefined || archivedValue === null) {
      return false;
    }

    // Handle boolean
    if (typeof archivedValue === "boolean") {
      return archivedValue;
    }

    // Handle number (1 = archived, 0 = not archived)
    if (typeof archivedValue === "number") {
      return archivedValue !== 0;
    }

    // Handle string ("true", "yes" = archived, "false", "no" = not archived)
    if (typeof archivedValue === "string") {
      const normalized = archivedValue.toLowerCase().trim();
      return (
        normalized === "true" || normalized === "yes" || normalized === "1"
      );
    }

    return false;
  }
}
