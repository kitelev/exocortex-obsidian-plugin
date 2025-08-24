import { App, MarkdownPostProcessorContext, TFile } from "obsidian";
import { IViewRenderer } from "../processors/CodeBlockProcessor";

/**
 * Asset relation data structure shared by all relation renderers
 */
export interface AssetRelation {
  file: TFile;
  path: string;
  title: string;
  metadata: Record<string, any>;
  propertyName?: string;
  isBodyLink: boolean;
  created: number;
  modified: number;
}

/**
 * Base configuration for asset relation renderers
 */
export interface AssetRelationsConfig {
  groupByProperty?: boolean;
  showProperties?: string[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  limit?: number;
}

/**
 * Abstract base class for asset relation renderers
 * Implements SOLID principles by providing common functionality
 * while allowing derived classes to customize specific behavior
 */
export abstract class BaseAssetRelationsRenderer implements IViewRenderer {
  protected app: App;

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Abstract method that derived classes must implement
   */
  abstract render(
    source: string,
    container: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ): Promise<void>;

  /**
   * Collect all relations for a given file
   * Common implementation for all relation renderers
   */
  protected async collectAllRelations(file: TFile): Promise<AssetRelation[]> {
    const relations: AssetRelation[] = [];
    const cache = this.app.metadataCache;
    const resolvedLinks = cache.resolvedLinks;

    for (const sourcePath in resolvedLinks) {
      const links = resolvedLinks[sourcePath];
      if (links && links[file.path]) {
        const sourceFile = this.app.vault.getAbstractFileByPath(sourcePath);
        if (sourceFile instanceof TFile) {
          const fileCache = cache.getFileCache(sourceFile);
          const metadata = fileCache?.frontmatter || {};

          const propertyName = this.findReferencingProperty(
            metadata,
            file.basename,
            file.path,
          );

          const relation: AssetRelation = {
            file: sourceFile,
            path: sourcePath,
            title: sourceFile.basename,
            metadata,
            propertyName,
            isBodyLink: !propertyName,
            created: sourceFile.stat.ctime,
            modified: sourceFile.stat.mtime,
          };

          relations.push(relation);
        }
      }
    }

    return relations.sort((a, b) => b.modified - a.modified);
  }

  /**
   * Find which property contains the reference to the target file
   * Common logic shared between all renderers
   */
  protected findReferencingProperty(
    metadata: Record<string, any>,
    targetBasename: string,
    targetPath: string,
  ): string | undefined {
    for (const [key, value] of Object.entries(metadata)) {
      if (!value) continue;

      const valueStr = String(value);
      if (
        valueStr.includes(`[[${targetBasename}]]`) ||
        valueStr.includes(`[[${targetPath}]]`) ||
        valueStr.includes(`[[${targetPath.replace(".md", "")}]]`)
      ) {
        return key;
      }

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
        }
      }
    }

    return undefined;
  }

  /**
   * Group relations by the property they reference through
   * Common grouping logic for all renderers
   */
  protected groupRelationsByProperty(
    relations: AssetRelation[],
  ): Map<string, AssetRelation[]> {
    const groups = new Map<string, AssetRelation[]>();

    for (const relation of relations) {
      const key = relation.propertyName || "Untyped Relations";
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(relation);
    }

    return groups;
  }

  /**
   * Render grouped relations with consistent H2 headers and structure
   * This is the standard display format for all relation renderers
   */
  protected renderGroupedRelations(
    container: HTMLElement,
    groupedRelations: Map<string, AssetRelation[]>,
  ): void {
    if (groupedRelations.size === 0) {
      this.renderNoRelations(container);
      return;
    }

    const relationsContainer = container.createDiv({
      cls: "exocortex-asset-relations",
    });

    for (const [propertyName, relations] of groupedRelations) {
      this.renderRelationGroup(relationsContainer, propertyName, relations);
    }
  }

  /**
   * Render a single group of relations as a table
   * Each asset is displayed as a row with "Name" column
   */
  protected renderRelationGroup(
    container: HTMLElement,
    groupName: string,
    relations: AssetRelation[],
  ): void {
    const groupDiv = container.createDiv({
      cls: "exocortex-relation-group",
    });

    // H2 header with property name as-is (no formatting)
    groupDiv.createEl("h2", {
      text: groupName,
      cls: "exocortex-relation-group-header",
    });

    // Create table
    const table = groupDiv.createEl("table", {
      cls: "exocortex-relation-table",
    });

    // Create table header
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    headerRow.createEl("th", {
      text: "Name",
      cls: "exocortex-table-header",
    });

    // Create table body
    const tbody = table.createEl("tbody");

    for (const relation of relations) {
      this.renderRelationRow(tbody, relation);
    }
  }

  /**
   * Render individual relation as a table row
   */
  protected renderRelationRow(
    tbody: HTMLElement,
    relation: AssetRelation,
  ): void {
    const row = tbody.createEl("tr", {
      cls: "exocortex-relation-row",
    });

    // Name column with link
    const nameCell = row.createEl("td", {
      cls: "exocortex-relation-name-cell",
    });

    const linkEl = nameCell.createEl("a", {
      text: relation.title,
      cls: "exocortex-relation-link internal-link",
      href: relation.path,
    });

    // Handle standard click events
    linkEl.addEventListener("click", (event: MouseEvent) => {
      // For Cmd/Ctrl+Click, open in new tab
      if (event.metaKey || event.ctrlKey) {
        event.preventDefault();
        event.stopPropagation();
        this.app.workspace.openLinkText(relation.path, "", true);
        return;
      }
      
      // For Shift+Click, open in new split
      if (event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        const leaf = this.app.workspace.getLeaf('split');
        if (leaf) {
          leaf.openFile(this.app.vault.getAbstractFileByPath(relation.path) as any);
        }
        return;
      }
      
      // For Alt+Click, show context menu (let default behavior handle it)
      if (event.altKey) {
        // Don't prevent default - let Obsidian handle context menu
        return;
      }
      
      // For simple click, open in current tab
      event.preventDefault();
      this.app.workspace.openLinkText(relation.path, "", false);
    });
    
    // Handle middle mouse button click
    linkEl.addEventListener("auxclick", (event: MouseEvent) => {
      if (event.button === 1) { // Middle button
        event.preventDefault();
        event.stopPropagation();
        this.app.workspace.openLinkText(relation.path, "", true);
      }
    });
  }

  /**
   * Render individual relation item (legacy method for backward compatibility)
   * @deprecated Use renderRelationRow instead
   */
  protected renderRelationItem(
    container: HTMLElement,
    relation: AssetRelation,
  ): void {
    // This method is kept for backward compatibility
    // but the main rendering now uses renderRelationRow
    const itemDiv = container.createDiv({
      cls: "exocortex-relation-item",
    });

    const linkEl = itemDiv.createEl("a", {
      text: relation.title,
      cls: "exocortex-relation-link internal-link",
      href: relation.path,
    });

    // Handle standard click events
    linkEl.addEventListener("click", (event: MouseEvent) => {
      // For Cmd/Ctrl+Click, open in new tab
      if (event.metaKey || event.ctrlKey) {
        event.preventDefault();
        event.stopPropagation();
        this.app.workspace.openLinkText(relation.path, "", true);
        return;
      }
      
      // For Shift+Click, open in new split
      if (event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        const leaf = this.app.workspace.getLeaf('split');
        if (leaf) {
          leaf.openFile(this.app.vault.getAbstractFileByPath(relation.path) as any);
        }
        return;
      }
      
      // For Alt+Click, show context menu (let default behavior handle it)
      if (event.altKey) {
        // Don't prevent default - let Obsidian handle context menu
        return;
      }
      
      // For simple click, open in current tab
      event.preventDefault();
      this.app.workspace.openLinkText(relation.path, "", false);
    });
    
    // Handle middle mouse button click
    linkEl.addEventListener("auxclick", (event: MouseEvent) => {
      if (event.button === 1) { // Middle button
        event.preventDefault();
        event.stopPropagation();
        this.app.workspace.openLinkText(relation.path, "", true);
      }
    });
  }

  /**
   * Extract basename from wiki-link or path
   * Common utility for all renderers
   */
  protected extractBasename(value: string): string {
    return (
      value.replace(/^\[\[/, "").replace(/\]\]$/, "").split("/").pop() || value
    );
  }

  /**
   * Format date for display
   * Common date formatting logic
   */
  protected formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Render message when no relations found
   */
  protected renderNoRelations(container: HTMLElement): void {
    const noRelationsDiv = container.createDiv({
      cls: "exocortex-no-relations",
    });
    noRelationsDiv.createEl("p", {
      text: "No relations found",
      cls: "exocortex-message",
    });
  }

  /**
   * Render error message
   */
  protected renderError(
    container: HTMLElement,
    message: string,
    details?: any,
  ): void {
    const errorDiv = container.createDiv({
      cls: "exocortex-error",
    });

    errorDiv.createEl("h3", {
      text: "⚠️ Error",
      cls: "exocortex-error-title",
    });

    errorDiv.createEl("p", {
      text: message,
      cls: "exocortex-error-message",
    });

    if (details) {
      errorDiv.createEl("p", {
        text: typeof details === "string" ? details : String(details),
        cls: "exocortex-error-details",
      });
    }
  }

  /**
   * Render informational message
   */
  protected renderMessage(container: HTMLElement, message: string): void {
    const messageDiv = container.createDiv({
      cls: "exocortex-message-container",
    });

    messageDiv.createEl("p", {
      text: message,
      cls: "exocortex-info-message",
    });
  }

  /**
   * Get current file from context
   */
  protected getCurrentFile(ctx: MarkdownPostProcessorContext): TFile | null {
    const file = this.app.metadataCache.getFirstLinkpathDest(
      ctx.sourcePath,
      "",
    );
    return file instanceof TFile ? file : null;
  }

  /**
   * Get metadata for a file
   */
  protected getFileMetadata(file: TFile): Record<string, any> {
    const cache = this.app.metadataCache.getFileCache(file);
    return cache?.frontmatter || {};
  }
}
