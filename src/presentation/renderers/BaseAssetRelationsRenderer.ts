import { App, MarkdownPostProcessorContext, TFile } from "obsidian";

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
export abstract class BaseAssetRelationsRenderer {
  protected app: App;
  protected sortState: Map<string, { column: string; order: "asc" | "desc" }> =
    new Map();

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
   * Filters out archived assets to maintain clean output
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

          // Skip archived assets
          if (this.isAssetArchived(metadata)) {
            continue;
          }

          const propertyName = this.findReferencingProperty(
            metadata,
            file.basename
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

    // Separate "Untyped Relations" from other groups
    const untypedRelations = groupedRelations.get("Untyped Relations");
    const typedGroups = new Map(groupedRelations);
    typedGroups.delete("Untyped Relations");

    // Render all typed relation groups first (sorted alphabetically)
    const sortedTypedKeys = Array.from(typedGroups.keys()).sort();
    for (const propertyName of sortedTypedKeys) {
      const relations = typedGroups.get(propertyName);
      if (relations) {
        this.renderRelationGroup(relationsContainer, propertyName, relations);
      }
    }

    // Render "Untyped Relations" last if it exists
    if (untypedRelations) {
      this.renderRelationGroup(
        relationsContainer,
        "Untyped Relations",
        untypedRelations,
      );
    }
  }

  /**
   * Render a single group of relations as a table
   * Each asset is displayed as a row with "Name" and "Instance Class" columns
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

    // Get or initialize sort state for this group
    const sortStateKey = `group_${groupName}`;
    if (!this.sortState.has(sortStateKey)) {
      this.sortState.set(sortStateKey, { column: "Name", order: "asc" });
    }
    const currentSort = this.sortState.get(sortStateKey)!;

    // Create table header
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");

    // Name header with sorting
    const nameHeader = headerRow.createEl("th", {
      text: "Name",
      cls: `exocortex-table-header sortable ${currentSort.column === "Name" ? `sorted-${currentSort.order}` : ""}`,
    });

    // Add sort indicator for Name
    if (currentSort.column === "Name") {
      nameHeader.createSpan({
        text: currentSort.order === "asc" ? " ▲" : " ▼",
        cls: "sort-indicator",
      });
    }

    // Instance class header with sorting
    const instanceHeader = headerRow.createEl("th", {
      text: "exo__Instance_class",
      cls: `exocortex-table-header sortable ${currentSort.column === "exo__Instance_class" ? `sorted-${currentSort.order}` : ""}`,
    });

    // Add sort indicator for Instance class
    if (currentSort.column === "exo__Instance_class") {
      instanceHeader.createSpan({
        text: currentSort.order === "asc" ? " ▲" : " ▼",
        cls: "sort-indicator",
      });
    }

    // Add click handlers for sorting
    nameHeader.addEventListener("click", () => {
      this.handleSort("Name", sortStateKey);
      const newSortedRelations = this.sortRelations(
        relations,
        "Name",
        this.sortState.get(sortStateKey)!.order,
      );
      this.updateTableBody(tbody, newSortedRelations);
      this.updateSortIndicators(headerRow, this.sortState.get(sortStateKey)!);
    });

    instanceHeader.addEventListener("click", () => {
      this.handleSort("exo__Instance_class", sortStateKey);
      const newSortedRelations = this.sortRelations(
        relations,
        "exo__Instance_class",
        this.sortState.get(sortStateKey)!.order,
      );
      this.updateTableBody(tbody, newSortedRelations);
      this.updateSortIndicators(headerRow, this.sortState.get(sortStateKey)!);
    });

    // Sort relations based on current state
    const sortedRelations = this.sortRelations(
      relations,
      currentSort.column,
      currentSort.order,
    );

    // Create table body
    const tbody = table.createEl("tbody");

    for (const relation of sortedRelations) {
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

    // Instance Class column - render as clickable links
    const instanceClassCell = row.createEl("td", {
      cls: "exocortex-instance-class-cell",
    });

    this.renderInstanceClassLinks(instanceClassCell, relation.metadata);

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
        const leaf = this.app.workspace.getLeaf("split");
        if (leaf) {
          leaf.openFile(
            this.app.vault.getAbstractFileByPath(relation.path) as any,
          );
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
      if (event.button === 1) {
        // Middle button
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
        const leaf = this.app.workspace.getLeaf("split");
        if (leaf) {
          leaf.openFile(
            this.app.vault.getAbstractFileByPath(relation.path) as any,
          );
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
      if (event.button === 1) {
        // Middle button
        event.preventDefault();
        event.stopPropagation();
        this.app.workspace.openLinkText(relation.path, "", true);
      }
    });
  }

  /**
   * Render instance class values as clickable links
   * Handles both single values and arrays, with or without wiki-link brackets
   */
  protected renderInstanceClassLinks(
    container: HTMLElement,
    metadata: Record<string, any>,
  ): void {
    const instanceClasses =
      metadata?.exo__Instance_class || metadata?.["exo__Instance_class"];

    if (!instanceClasses) {
      container.createSpan({ text: "-", cls: "no-instance-class" });
      return;
    }

    // Convert to array if it's a single value
    const classArray = Array.isArray(instanceClasses)
      ? instanceClasses
      : [instanceClasses];

    if (classArray.length === 0) {
      container.createSpan({ text: "-", cls: "no-instance-class" });
      return;
    }

    // Render each class as a link
    classArray.forEach((classValue, index) => {
      if (index > 0) {
        container.createSpan({ text: ", ", cls: "separator" });
      }

      const classStr = String(classValue);

      // Parse the link - handle [[Link]], [[Link|Alias]], or plain text
      let linkPath: string;
      let linkText: string;

      if (classStr.startsWith("[[") && classStr.endsWith("]]")) {
        // Wiki-link format
        const inner = classStr.slice(2, -2);
        const pipeIndex = inner.indexOf("|");

        if (pipeIndex !== -1) {
          // Piped link [[Path|Alias]]
          linkPath = inner.substring(0, pipeIndex);
          linkText = inner.substring(pipeIndex + 1);
        } else {
          // Regular link [[Path]]
          linkPath = inner;
          linkText = inner;
        }
      } else {
        // Plain text - treat as link path
        linkPath = classStr;
        linkText = classStr;
      }

      // Create the link element
      const linkEl = container.createEl("a", {
        text: linkText,
        cls: "instance-class-link internal-link",
        href: linkPath.endsWith(".md") ? linkPath : `${linkPath}.md`,
      });

      // Handle click events for navigation
      linkEl.addEventListener("click", (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        // Handle modifiers for different opening modes
        if (event.metaKey || event.ctrlKey) {
          // Cmd/Ctrl+Click: open in new tab
          this.app.workspace.openLinkText(linkPath, "", true);
        } else if (event.shiftKey) {
          // Shift+Click: open in new split
          const leaf = this.app.workspace.getLeaf("split");
          if (leaf) {
            const file = this.app.vault.getAbstractFileByPath(
              linkPath.endsWith(".md") ? linkPath : `${linkPath}.md`,
            );
            if (file instanceof TFile) {
              leaf.openFile(file);
            }
          }
        } else {
          // Regular click: open in current pane
          this.app.workspace.openLinkText(linkPath, "", false);
        }
      });

      // Handle middle mouse button
      linkEl.addEventListener("auxclick", (event: MouseEvent) => {
        if (event.button === 1) {
          event.preventDefault();
          event.stopPropagation();
          this.app.workspace.openLinkText(linkPath, "", true);
        }
      });
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

  /**
   * Update the table body with sorted data
   */
  protected updateTableBody(
    tbody: HTMLElement,
    relations: AssetRelation[],
  ): void {
    // Clear existing rows
    tbody.empty();

    // Re-render sorted rows
    for (const relation of relations) {
      this.renderRelationRow(tbody, relation);
    }
  }

  /**
   * Update sort indicators on column headers
   */
  protected updateSortIndicators(
    headerRow: HTMLElement,
    sortState: { column: string; order: "asc" | "desc" },
  ): void {
    // Remove all existing indicators
    headerRow.querySelectorAll(".sort-indicator").forEach((el) => el.remove());

    // Remove all sorted classes
    headerRow.querySelectorAll("th").forEach((th) => {
      th.classList.remove("sorted-asc", "sorted-desc");
    });

    // Add indicator to the currently sorted column
    const headers = headerRow.querySelectorAll("th");
    headers.forEach((th) => {
      const text = th.textContent?.replace(" ▲", "").replace(" ▼", "").trim();
      if (
        text === sortState.column ||
        (text === "Name" && sortState.column === "Name") ||
        (text === "exo__Instance_class" &&
          sortState.column === "exo__Instance_class")
      ) {
        th.classList.add(`sorted-${sortState.order}`);
        th.createSpan({
          text: sortState.order === "asc" ? " ▲" : " ▼",
          cls: "sort-indicator",
        });
      }
    });
  }

  /**
   * Handle column header click for sorting
   */
  protected handleSort(column: string, sortStateKey: string): void {
    const currentSort = this.sortState.get(sortStateKey)!;

    // Update sort state
    if (currentSort.column === column) {
      // Toggle order if same column
      currentSort.order = currentSort.order === "asc" ? "desc" : "asc";
    } else {
      // New column, default to ascending
      currentSort.column = column;
      currentSort.order = "asc";
    }

    this.sortState.set(sortStateKey, currentSort);
  }

  /**
   * Helper methods from AssetRelationUtils
   */
  protected isAssetArchived(metadata: Record<string, any>): boolean {
    return metadata?.exo__Asset_isArchived === true;
  }

  protected findReferencingProperty(
    metadata: Record<string, any>,
    currentFileName: string
  ): string | undefined {
    for (const [key, value] of Object.entries(metadata)) {
      if (this.containsReference(value, currentFileName)) {
        return key;
      }
    }
    return undefined;
  }

  private containsReference(value: any, fileName: string): boolean {
    if (!value) return false;
    const cleanName = fileName.replace(/\.md$/, "");

    if (typeof value === "string") {
      return value.includes(`[[${cleanName}]]`) || value.includes(cleanName);
    }

    if (Array.isArray(value)) {
      return value.some(v => this.containsReference(v, fileName));
    }

    return false;
  }

  protected sortRelations(
    relations: AssetRelation[],
    sortBy: string,
    sortOrder: "asc" | "desc" = "asc"
  ): AssetRelation[] {
    return [...relations].sort((a, b) => {
      const aVal = this.getPropertyValue(a, sortBy);
      const bVal = this.getPropertyValue(b, sortBy);

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }

  private getPropertyValue(relation: AssetRelation, propertyName: string): any {
    if (propertyName === "title") return relation.title;
    if (propertyName === "created") return relation.created;
    if (propertyName === "modified") return relation.modified;
    if (propertyName === "path") return relation.path;
    return relation.metadata?.[propertyName];
  }
}
