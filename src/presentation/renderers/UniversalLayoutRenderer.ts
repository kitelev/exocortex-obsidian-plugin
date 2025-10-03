import { MarkdownPostProcessorContext, TFile } from "obsidian";
import { ILogger } from "../../infrastructure/logging/ILogger";
import { LoggerFactory } from "../../infrastructure/logging/LoggerFactory";

/**
 * UniversalLayout configuration options
 */
interface UniversalLayoutConfig {
  layout?: "list" | "table" | "cards" | "graph";
  showProperties?: string[];
  groupBy?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  limit?: number;
  showBacklinks?: boolean;
  showForwardLinks?: boolean;
  groupByProperty?: boolean; // Enable Assets Relations grouping
}

/**
 * Asset relation data structure
 */
interface AssetRelation {
  file: TFile;
  path: string;
  title: string;
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
export class UniversalLayoutRenderer {
  private logger: ILogger;
  private app: any;
  private sortState: Map<string, { column: string; order: "asc" | "desc" }> =
    new Map();
  private eventListeners: Array<{
    element: HTMLElement;
    type: string;
    handler: EventListener;
  }> = [];
  private backlinksCache: Map<string, Set<string>> = new Map();
  private backlinksCacheValid: boolean = false;

  constructor(app: any) {
    this.app = app;
    this.logger = LoggerFactory.create("UniversalLayoutRenderer");
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
        if (!this.backlinksCache.has(targetPath)) {
          this.backlinksCache.set(targetPath, new Set());
        }
        this.backlinksCache.get(targetPath)!.add(sourcePath);
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
    this.sortState.clear();
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
    ctx: MarkdownPostProcessorContext,
  ): Promise<void> {
    try {
      const config = this.parseConfig(source);
      const currentFile = this.app.workspace.getActiveFile();

      if (!currentFile) {
        this.renderMessage(el, "No active file");
        return;
      }

      // Check if current file is a class and add creation button
      await this.renderCreationButtonIfClass(el, currentFile);

      // Get asset relations for the current file
      const relations = await this.getAssetRelations(currentFile, config);

      if (relations.length === 0) {
        this.renderMessage(el, "No related assets found");
        return;
      }

      // Default behavior: group by property (Assets Relations)
      if (config.groupByProperty !== false) {
        await this.renderAssetRelations(el, relations, config);
      } else {
        // Legacy behavior: render based on layout type
        switch (config.layout) {
          case "table":
            await this.renderTable(el, relations, config);
            break;
          case "cards":
            await this.renderCards(el, relations, config);
            break;
          case "graph":
            await this.renderGraph(el, relations, config);
            break;
          default:
            await this.renderList(el, relations, config);
        }
      }

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
      if (sourceFile instanceof TFile) {
        const fileCache = cache.getFileCache(sourceFile);
        const metadata = fileCache?.frontmatter || {};

        // Skip archived assets
        if (this.isAssetArchived(metadata)) {
          continue;
        }

        // Determine how this asset references the current file
        const propertyName = this.findReferencingProperty(
          metadata,
          file.basename
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

        // Apply filters if specified
        if (this.matchesFilters(relation, config)) {
          relations.push(relation);
        }
      }
    }

    // Sort relations
    if (config.sortBy) {
      relations.sort((a, b) => {
        const aVal = this.getPropertyValue(a, config.sortBy!);
        const bVal = this.getPropertyValue(b, config.sortBy!);
        const order = config.sortOrder === "desc" ? -1 : 1;
        return aVal > bVal ? order : -order;
      });
    }

    // Apply limit
    if (config.limit && config.limit > 0) {
      return relations.slice(0, config.limit);
    }

    return relations;
  }

  /**
   * Render assets grouped by the property through which they reference the current asset
   * This is the core Assets Relations feature
   */
  private async renderAssetRelations(
    el: HTMLElement,
    relations: AssetRelation[],
    config: UniversalLayoutConfig,
  ): Promise<void> {
    const container = el.createDiv({ cls: "exocortex-assets-relations" });

    // Group relations by property name
    const groupedRelations = new Map<string, AssetRelation[]>();
    const untypedRelations: AssetRelation[] = [];

    for (const relation of relations) {
      if (relation.isBodyLink) {
        untypedRelations.push(relation);
      } else if (relation.propertyName) {
        if (!groupedRelations.has(relation.propertyName)) {
          groupedRelations.set(relation.propertyName, []);
        }
        groupedRelations.get(relation.propertyName)!.push(relation);
      }
    }

    // Sort property names alphabetically for typed relations
    const sortedProperties = Array.from(groupedRelations.keys()).sort();

    // Render each typed property group first
    for (const propertyName of sortedProperties) {
      const group = groupedRelations.get(propertyName)!;
      await this.renderRelationGroup(container, propertyName, group, config);
    }

    // Always render untyped relations last
    if (untypedRelations.length > 0) {
      await this.renderRelationGroup(
        container,
        "Untyped Relations",
        untypedRelations,
        config,
      );
    }

    // If no relations found, show message
    if (groupedRelations.size === 0 && untypedRelations.length === 0) {
      this.renderMessage(container, "No asset relations found");
    }
  }

  /**
   * Render a single group of related assets
   */
  private async renderRelationGroup(
    container: HTMLElement,
    groupName: string,
    relations: AssetRelation[],
    config: UniversalLayoutConfig,
  ): Promise<void> {
    const groupDiv = container.createDiv({ cls: "exocortex-relation-group" });

    // Create H2 header for the group
    groupDiv.createEl("h2", {
      text: groupName,
      cls: "exocortex-relation-group-header",
    });

    // Render as a table with two columns: Name and Instance Class
    const table = groupDiv.createEl("table", {
      cls: "exocortex-relation-table",
    });
    const thead = table.createEl("thead");
    const tbody = table.createEl("tbody");

    // Create header row with sorting
    const headerRow = thead.createEl("tr");

    // Get or initialize sort state for this group
    const sortStateKey = `group_${groupName}`;
    if (!this.sortState.has(sortStateKey)) {
      this.sortState.set(sortStateKey, { column: "Name", order: "asc" });
    }
    const currentSort = this.sortState.get(sortStateKey)!;

    // Create sortable headers
    const nameHeader = headerRow.createEl("th", {
      text: "Name",
      cls: `sortable ${currentSort.column === "Name" ? `sorted-${currentSort.order}` : ""}`,
    });
    const instanceClassHeader = headerRow.createEl("th", {
      text: "exo__Instance_class",
      cls: `sortable ${currentSort.column === "exo__Instance_class" ? `sorted-${currentSort.order}` : ""}`,
    });

    // Add sort indicator arrows
    if (currentSort.column === "Name") {
      nameHeader.createSpan({
        text: currentSort.order === "asc" ? " ▲" : " ▼",
        cls: "sort-indicator",
      });
    }
    if (currentSort.column === "exo__Instance_class") {
      instanceClassHeader.createSpan({
        text: currentSort.order === "asc" ? " ▲" : " ▼",
        cls: "sort-indicator",
      });
    }

    // Add click handlers for sorting
    this.registerEventListener(nameHeader, "click", () => {
      this.updateSort("Name", sortStateKey);
      const sortedRelations = this.sortRelations(
        relations,
        "Name",
        this.sortState.get(sortStateKey)!.order,
      );
      this.updateTableBody(tbody, sortedRelations, config);
      this.updateSortIndicators(headerRow, this.sortState.get(sortStateKey)!);
    });

    this.registerEventListener(instanceClassHeader, "click", () => {
      this.updateSort("exo__Instance_class", sortStateKey);
      const sortedRelations = this.sortRelations(
        relations,
        "exo__Instance_class",
        this.sortState.get(sortStateKey)!.order,
      );
      this.updateTableBody(tbody, sortedRelations, config);
      this.updateSortIndicators(headerRow, this.sortState.get(sortStateKey)!);
    });

    // Add additional property columns if configured
    if (config.showProperties && config.showProperties.length > 0) {
      for (const prop of config.showProperties) {
        if (prop !== "exo__Instance_class") {
          const propHeader = headerRow.createEl("th", {
            text: prop,
            cls: `sortable ${currentSort.column === prop ? `sorted-${currentSort.order}` : ""}`,
          });

          if (currentSort.column === prop) {
            propHeader.createSpan({
              text: currentSort.order === "asc" ? " ▲" : " ▼",
              cls: "sort-indicator",
            });
          }

          this.registerEventListener(propHeader, "click", () => {
            this.updateSort(prop, sortStateKey);
            const sortedRelations = this.sortRelations(
              relations,
              prop,
              this.sortState.get(sortStateKey)!.order,
            );
            this.updateTableBody(tbody, sortedRelations, config);
            this.updateSortIndicators(
              headerRow,
              this.sortState.get(sortStateKey)!,
            );
          });
        }
      }
    }

    // Sort relations based on current sort state
    const sortedRelations = this.sortRelations(
      relations,
      currentSort.column,
      currentSort.order,
    );

    // Render each relation as a table row
    for (const relation of sortedRelations) {
      const row = tbody.createEl("tr", { cls: "exocortex-relation-row" });

      // First column: Asset name with link
      const nameCell = row.createEl("td", { cls: "asset-name" });
      const linkEl = nameCell.createEl("a", {
        text: relation.title,
        cls: "internal-link",
        href: relation.path,
      });

      // Add click handler
      this.registerEventListener(linkEl, "click", (e) => {
        e.preventDefault();
        this.app.workspace.openLinkText(relation.path, "", false);
      });

      // Second column: exo__Instance_class value
      const instanceClassRaw =
        relation.metadata?.exo__Instance_class ||
        relation.metadata?.["exo__Instance_class"] ||
        "-";

      // Handle arrays and convert to string safely
      const instanceClass = Array.isArray(instanceClassRaw)
        ? instanceClassRaw[0] || "-"
        : instanceClassRaw || "-";

      // Create Instance Class cell with clickable link
      const instanceCell = row.createEl("td", { cls: "instance-class" });

      if (instanceClass && instanceClass !== "-") {
        // Remove [[ and ]] from wikilink syntax
        const cleanClass = String(instanceClass).replace(/^\[\[|\]\]$/g, "");

        const link = instanceCell.createEl("a", {
          text: cleanClass,
          cls: "internal-link",
          attr: { href: cleanClass },
        });

        this.registerEventListener(link, "click", (e) => {
          e.preventDefault();
          this.app.workspace.openLinkText(cleanClass, "", false);
        });
      } else {
        instanceCell.textContent = "-";
      }

      // Additional property columns if configured
      if (config.showProperties && config.showProperties.length > 0) {
        for (const prop of config.showProperties) {
          if (prop !== "exo__Instance_class") {
            // Don't duplicate Instance Class column
            const value = this.getPropertyValue(relation, prop);
            row.createEl("td", {
              text: value !== undefined ? String(value) : "",
              cls: "exocortex-property",
            });
          }
        }
      }
    }

    // Add responsive mobile class if needed
    if ((window as any).isMobile) {
      table.addClass("mobile-responsive");
    }
  }

  /**
   * Render relations as a list (legacy mode)
   */
  private async renderList(
    el: HTMLElement,
    relations: AssetRelation[],
    config: UniversalLayoutConfig,
  ): Promise<void> {
    const container = el.createDiv({ cls: "exocortex-backlinks-list" });
    container.createEl("h3", { text: `Related Assets (${relations.length})` });

    const listEl = container.createEl("ul", { cls: "exocortex-list" });

    for (const relation of relations) {
      const itemEl = listEl.createEl("li", { cls: "exocortex-list-item" });

      const linkEl = itemEl.createEl("a", {
        text: relation.title,
        cls: "internal-link",
        href: relation.path,
      });

      this.registerEventListener(linkEl, "click", (e) => {
        e.preventDefault();
        this.app.workspace.openLinkText(relation.path, "", false);
      });

      if (config.showProperties && config.showProperties.length > 0) {
        const propsEl = itemEl.createDiv({ cls: "exocortex-properties" });
        for (const prop of config.showProperties) {
          const value = this.getPropertyValue(relation, prop);
          if (value !== undefined) {
            propsEl.createSpan({
              text: `${prop}: ${value}`,
              cls: "exocortex-property",
            });
          }
        }
      }
    }
  }

  /**
   * Render relations as a table (legacy mode)
   */
  private async renderTable(
    el: HTMLElement,
    relations: AssetRelation[],
    config: UniversalLayoutConfig,
  ): Promise<void> {
    const container = el.createDiv({ cls: "exocortex-backlinks-table" });
    container.createEl("h3", { text: `Related Assets (${relations.length})` });

    const table = container.createEl("table", { cls: "exocortex-table" });
    const thead = table.createEl("thead");
    const tbody = table.createEl("tbody");

    // Get or initialize sort state for table
    const sortStateKey = "table_main";
    if (!this.sortState.has(sortStateKey)) {
      this.sortState.set(sortStateKey, { column: "Name", order: "asc" });
    }
    const currentSort = this.sortState.get(sortStateKey)!;

    const headerRow = thead.createEl("tr");
    const nameHeader = headerRow.createEl("th", {
      text: "Name",
      cls: `sortable ${currentSort.column === "Name" ? `sorted-${currentSort.order}` : ""}`
    });
    const instanceClassHeader = headerRow.createEl("th", {
      text: "exo__Instance_class",
      cls: `sortable ${currentSort.column === "exo__Instance_class" ? `sorted-${currentSort.order}` : ""}`
    });

    // Add sort indicator arrows
    if (currentSort.column === "Name") {
      nameHeader.createSpan({
        text: currentSort.order === "asc" ? " ▲" : " ▼",
        cls: "sort-indicator",
      });
    }
    if (currentSort.column === "exo__Instance_class") {
      instanceClassHeader.createSpan({
        text: currentSort.order === "asc" ? " ▲" : " ▼",
        cls: "sort-indicator",
      });
    }

    // Add click handlers for sorting
    this.registerEventListener(nameHeader, "click", () => {
      this.updateSort("Name", sortStateKey);
      const sortedRelations = this.sortRelations(
        relations,
        "Name",
        this.sortState.get(sortStateKey)!.order,
      );
      this.updateTableBody(tbody, sortedRelations, config);
      this.updateSortIndicators(headerRow, this.sortState.get(sortStateKey)!);
    });

    this.registerEventListener(instanceClassHeader, "click", () => {
      this.updateSort("exo__Instance_class", sortStateKey);
      const sortedRelations = this.sortRelations(
        relations,
        "exo__Instance_class",
        this.sortState.get(sortStateKey)!.order,
      );
      this.updateTableBody(tbody, sortedRelations, config);
      this.updateSortIndicators(headerRow, this.sortState.get(sortStateKey)!);
    });

    if (config.showProperties) {
      for (const prop of config.showProperties) {
        if (prop !== "exo__Instance_class") {
          const propHeader = headerRow.createEl("th", {
            text: prop,
            cls: `sortable ${currentSort.column === prop ? `sorted-${currentSort.order}` : ""}`
          });

          this.registerEventListener(propHeader, "click", () => {
            this.updateSort(prop, sortStateKey);
            const sortedRelations = this.sortRelations(
              relations,
              prop,
              this.sortState.get(sortStateKey)!.order,
            );
            this.updateTableBody(tbody, sortedRelations, config);
            this.updateSortIndicators(headerRow, this.sortState.get(sortStateKey)!);
          });
        }
      }
    }

    headerRow.createEl("th", { text: "Relation Type" });
    headerRow.createEl("th", { text: "Modified" });

    // Sort relations based on current sort state
    const sortedRelations = this.sortRelations(
      relations,
      currentSort.column,
      currentSort.order,
    );

    for (const relation of sortedRelations) {
      const row = tbody.createEl("tr");

      // First column: Name with link
      const titleCell = row.createEl("td");
      const linkEl = titleCell.createEl("a", {
        text: relation.title,
        cls: "internal-link",
        href: relation.path,
      });

      linkEl.addEventListener("click", (e) => {
        e.preventDefault();
        this.app.workspace.openLinkText(relation.path, "", false);
      });

      // Second column: exo__Instance_class value
      const instanceClassRaw =
        relation.metadata?.exo__Instance_class ||
        relation.metadata?.["exo__Instance_class"] ||
        "-";

      // Handle arrays and convert to string safely
      const instanceClass = Array.isArray(instanceClassRaw)
        ? instanceClassRaw[0] || "-"
        : instanceClassRaw || "-";

      // Create Instance Class cell with clickable link
      const instanceCell = row.createEl("td", { cls: "instance-class" });

      if (instanceClass && instanceClass !== "-") {
        // Remove [[ and ]] from wikilink syntax
        const cleanClass = String(instanceClass).replace(/^\[\[|\]\]$/g, "");

        const link = instanceCell.createEl("a", {
          text: cleanClass,
          cls: "internal-link",
          attr: { href: cleanClass },
        });

        this.registerEventListener(link, "click", (e) => {
          e.preventDefault();
          this.app.workspace.openLinkText(cleanClass, "", false);
        });
      } else {
        instanceCell.textContent = "-";
      }

      if (config.showProperties) {
        for (const prop of config.showProperties) {
          if (prop !== "exo__Instance_class") {
            // Don't duplicate Instance Class column
            const value = this.getPropertyValue(relation, prop);
            row.createEl("td", { text: value?.toString() || "" });
          }
        }
      }

      // Show relation type
      row.createEl("td", {
        text: relation.propertyName || "body",
        cls: "relation-type",
      });

      row.createEl("td", {
        text: new Date(relation.modified).toLocaleDateString(),
      });
    }

    // Add responsive mobile class if needed
    if ((window as any).isMobile) {
      table.addClass("mobile-responsive");
    }
  }

  /**
   * Render relations as cards (legacy mode)
   */
  private async renderCards(
    el: HTMLElement,
    relations: AssetRelation[],
    config: UniversalLayoutConfig,
  ): Promise<void> {
    const container = el.createDiv({ cls: "exocortex-backlinks-cards" });
    container.createEl("h3", { text: `Related Assets (${relations.length})` });

    const cardsContainer = container.createDiv({ cls: "exocortex-cards-grid" });

    for (const relation of relations) {
      const card = cardsContainer.createDiv({ cls: "exocortex-card" });

      const titleEl = card.createEl("h4", { cls: "exocortex-card-title" });
      const linkEl = titleEl.createEl("a", {
        text: relation.title,
        cls: "internal-link",
        href: relation.path,
      });

      linkEl.addEventListener("click", (e) => {
        e.preventDefault();
        this.app.workspace.openLinkText(relation.path, "", false);
      });

      // Show relation type badge
      if (relation.propertyName) {
        card.createDiv({
          text: relation.propertyName,
          cls: "exocortex-relation-badge",
        });
      }

      if (config.showProperties && config.showProperties.length > 0) {
        const propsEl = card.createDiv({ cls: "exocortex-card-properties" });
        for (const prop of config.showProperties) {
          const value = this.getPropertyValue(relation, prop);
          if (value !== undefined) {
            const propEl = propsEl.createDiv({
              cls: "exocortex-card-property",
            });
            propEl.createSpan({ text: prop + ": ", cls: "property-label" });
            propEl.createSpan({
              text: value.toString(),
              cls: "property-value",
            });
          }
        }
      }

      const footer = card.createDiv({ cls: "exocortex-card-footer" });
      footer.createSpan({
        text: `Modified: ${new Date(relation.modified).toLocaleDateString()}`,
        cls: "card-date",
      });
    }
  }

  /**
   * Render relations as a graph (placeholder)
   */
  private async renderGraph(
    el: HTMLElement,
    relations: AssetRelation[],
    config: UniversalLayoutConfig,
  ): Promise<void> {
    const container = el.createDiv({ cls: "exocortex-backlinks-graph" });
    container.createEl("h3", {
      text: `Assets Relations Graph (${relations.length})`,
    });
    container.createEl("p", {
      text: "Graph visualization coming soon. Showing grouped relations instead.",
    });

    // Fall back to assets relations view
    await this.renderAssetRelations(container, relations, config);
  }

  /**
   * Parse configuration from source
   */
  private parseConfig(source: string): UniversalLayoutConfig {
    const lines = source.trim().split("\n");
    const config: UniversalLayoutConfig = {
      layout: "list",
      showBacklinks: true,
      groupByProperty: true, // Default to Assets Relations mode
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line === "UniversalLayout") continue;

      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        try {
          if (key === "showProperties") {
            config.showProperties = value.split(",").map((s) => s.trim());
          } else {
            (config as any)[key] =
              value === "true"
                ? true
                : value === "false"
                  ? false
                  : isNaN(Number(value))
                    ? value
                    : Number(value);
          }
        } catch {
          (config as any)[key] = value;
        }
      }
    }

    return config;
  }

  /**
   * Check if a relation matches the configured filters
   */
  private matchesFilters(
    relation: AssetRelation,
    config: UniversalLayoutConfig,
  ): boolean {
    // Filters removed in simplified version
    return true;
    /*
    for (const [key, value] of Object.entries({})) {
      const relationValue = this.getPropertyValue(relation, key);
      if (relationValue !== value) {
        return false;
      }
    }

    return true;
    */
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
   * Update sort state when a column is clicked
   */
  private updateSort(column: string, sortStateKey: string): void {
    const currentSort = this.sortState.get(sortStateKey)!;

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
   * Update the table body with sorted data
   */
  private updateTableBody(
    tbody: HTMLElement,
    relations: AssetRelation[],
    config: UniversalLayoutConfig,
  ): void {
    // Clear existing rows
    tbody.empty();

    // Re-render sorted rows
    for (const relation of relations) {
      const row = tbody.createEl("tr", { cls: "exocortex-relation-row" });

      // First column: Asset name with link
      const nameCell = row.createEl("td", { cls: "asset-name" });
      const linkEl = nameCell.createEl("a", {
        text: relation.title,
        cls: "internal-link",
        href: relation.path,
      });

      linkEl.addEventListener("click", (e) => {
        e.preventDefault();
        this.app.workspace.openLinkText(relation.path, "", false);
      });

      // Second column: exo__Instance_class value
      const instanceClassRaw =
        relation.metadata?.exo__Instance_class ||
        relation.metadata?.["exo__Instance_class"] ||
        "-";

      // Handle arrays and convert to string safely
      const instanceClass = Array.isArray(instanceClassRaw)
        ? instanceClassRaw[0] || "-"
        : instanceClassRaw || "-";

      // Create Instance Class cell with clickable link
      const instanceCell = row.createEl("td", { cls: "instance-class" });

      if (instanceClass && instanceClass !== "-") {
        // Remove [[ and ]] from wikilink syntax
        const cleanClass = String(instanceClass).replace(/^\[\[|\]\]$/g, "");

        const link = instanceCell.createEl("a", {
          text: cleanClass,
          cls: "internal-link",
          attr: { href: cleanClass },
        });

        linkEl.addEventListener("click", (e) => {
          e.preventDefault();
          this.app.workspace.openLinkText(cleanClass, "", false);
        });
      } else {
        instanceCell.textContent = "-";
      }

      // Additional property columns if configured
      if (config.showProperties && config.showProperties.length > 0) {
        for (const prop of config.showProperties) {
          if (prop !== "exo__Instance_class") {
            const value = this.getPropertyValue(relation, prop);
            row.createEl("td", {
              text: value !== undefined ? String(value) : "",
              cls: "exocortex-property",
            });
          }
        }
      }
    }
  }

  /**
   * Update sort indicators on column headers
   */
  private updateSortIndicators(
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
   * Check if current file is a class and render creation button if applicable
   */
  private async renderCreationButtonIfClass(
    container: HTMLElement,
    file: TFile,
  ): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    if (!cache?.frontmatter) return;

    const instanceClass = this.extractValue(
      cache.frontmatter["exo__Instance_class"],
    );

    // Check if this file is a class
    if (instanceClass !== "exo__Class") return;

    // Get class name and label
    const className = file.basename;
    const classLabel =
      cache.frontmatter["rdfs__label"] ||
      cache.frontmatter["exo__Asset_label"] ||
      className;

    // Determine button label - check for custom button configuration
    const customButtonLabel = cache.frontmatter["exo__Class_createButtonLabel"];
    const buttonLabel =
      customButtonLabel || `Create ${this.humanizeClassName(classLabel)}`;

    // Create button container at the top of the layout
    const buttonContainer = container.createDiv({
      cls: "exocortex-creation-button-container",
    });

    // Create the button
    const button = buttonContainer.createEl("button", {
      text: buttonLabel,
      cls: "exocortex-create-asset-button",
    });

    // Add click handler to open CreateAssetModal
    button.addEventListener("click", async () => {
      try {
        // Creation modal removed - simplified version
        console.log(`Would create asset of type: ${className}`);
      } catch (error) {
        console.error("Failed to open asset creation modal:", error);
      }
    });

    // Add some spacing after the button
    buttonContainer.createEl("hr", { cls: "exocortex-button-separator" });
  }

  /**
   * Extract clean value from frontmatter (remove wikilink brackets)
   */
  private extractValue(value: any): string {
    if (!value) return "";
    const str = String(value);
    // Handle arrays
    if (Array.isArray(value)) {
      return this.extractValue(value[0]);
    }
    // Remove [[ and ]] if present
    return str.replace(/^\[\[|\]\]$/g, "");
  }

  /**
   * Convert class name to human-readable form for button label
   */
  private humanizeClassName(className: string): string {
    // Remove prefix if present (e.g., "ems__Area" -> "Area")
    const withoutPrefix = className.split("__").pop() || className;

    // Convert to title case and add spacing
    return withoutPrefix
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .trim();
  }

  /**
   * Helper method to get property value from relation
   */
  private getPropertyValue(relation: AssetRelation, propertyName: string): any {
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

  /**
   * Check if a value contains a reference to a file
   */
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

  /**
   * Sort relations
   */
  private sortRelations(
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

  /**
   * Check if asset is archived
   */
  /**
   * Check if an asset is archived based on frontmatter metadata
   * Supports multiple archived field formats:
   * - archived: true (boolean)
   * - archived: "true" or "yes" (string)
   * - archived: 1 (number)
   * Also checks legacy exo__Asset_isArchived field for backward compatibility
   */
  private isAssetArchived(metadata: Record<string, any>): boolean {
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
      return normalized === "true" || normalized === "yes" || normalized === "1";
    }

    return false;
  }
}
