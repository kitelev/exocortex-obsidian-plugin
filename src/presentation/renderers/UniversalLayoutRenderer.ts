import { MarkdownPostProcessorContext, TFile } from "obsidian";
import { IViewRenderer, ViewConfig } from "../processors/CodeBlockProcessor";
import { ILogger } from "../../infrastructure/logging/ILogger";
import { LoggerFactory } from "../../infrastructure/logging/LoggerFactory";
import { ServiceProvider } from "../../infrastructure/providers/ServiceProvider";
import { IAssetRepository } from "../../domain/repositories/IAssetRepository";
import { Result } from "../../domain/core/Result";
import { AssetRelationUtils } from "../../shared/utils/AssetRelationUtils";

/**
 * UniversalLayout configuration options
 */
interface UniversalLayoutConfig extends ViewConfig {
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
export class UniversalLayoutRenderer implements IViewRenderer {
  private logger: ILogger;
  private assetRepository: IAssetRepository;
  private app: any;
  private sortState: Map<string, { column: string; order: 'asc' | 'desc' }> = new Map();

  constructor(private serviceProvider: ServiceProvider) {
    this.logger = LoggerFactory.createForClass(UniversalLayoutRenderer);
    this.assetRepository = serviceProvider.getService("IAssetRepository");
    this.app = (window as any).app;
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
    const resolvedLinks = cache.resolvedLinks;

    for (const [sourcePath, links] of Object.entries(resolvedLinks)) {
      if (links && (links as any)[file.path]) {
        const sourceFile = this.app.vault.getAbstractFileByPath(sourcePath);
        if (sourceFile instanceof TFile) {
          const fileCache = cache.getFileCache(sourceFile);
          const metadata = fileCache?.frontmatter || {};

          // Skip archived assets
          if (AssetRelationUtils.isAssetArchived(metadata)) {
            continue;
          }

          // Determine how this asset references the current file
          const propertyName = AssetRelationUtils.findReferencingProperty(
            metadata,
            file.basename,
            file.path,
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
    }

    // Sort relations
    if (config.sortBy) {
      relations.sort((a, b) => {
        const aVal = AssetRelationUtils.getPropertyValue(a, config.sortBy!);
        const bVal = AssetRelationUtils.getPropertyValue(b, config.sortBy!);
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
      this.sortState.set(sortStateKey, { column: 'Name', order: 'asc' });
    }
    const currentSort = this.sortState.get(sortStateKey)!;

    // Create sortable headers
    const nameHeader = headerRow.createEl("th", { 
      text: "Name", 
      cls: `sortable ${currentSort.column === 'Name' ? `sorted-${currentSort.order}` : ''}`
    });
    const instanceClassHeader = headerRow.createEl("th", { 
      text: "exo__Instance_class", 
      cls: `sortable ${currentSort.column === 'exo__Instance_class' ? `sorted-${currentSort.order}` : ''}`
    });

    // Add sort indicator arrows
    if (currentSort.column === 'Name') {
      nameHeader.createSpan({ text: currentSort.order === 'asc' ? ' ▲' : ' ▼', cls: 'sort-indicator' });
    }
    if (currentSort.column === 'exo__Instance_class') {
      instanceClassHeader.createSpan({ text: currentSort.order === 'asc' ? ' ▲' : ' ▼', cls: 'sort-indicator' });
    }

    // Add click handlers for sorting
    nameHeader.addEventListener('click', () => {
      this.updateSort('Name', sortStateKey);
      const sortedRelations = AssetRelationUtils.sortRelations(relations, 'Name', this.sortState.get(sortStateKey)!.order);
      this.updateTableBody(tbody, sortedRelations, config);
      this.updateSortIndicators(headerRow, this.sortState.get(sortStateKey)!);
    });

    instanceClassHeader.addEventListener('click', () => {
      this.updateSort('exo__Instance_class', sortStateKey);
      const sortedRelations = AssetRelationUtils.sortRelations(relations, 'exo__Instance_class', this.sortState.get(sortStateKey)!.order);
      this.updateTableBody(tbody, sortedRelations, config);
      this.updateSortIndicators(headerRow, this.sortState.get(sortStateKey)!);
    });

    // Add additional property columns if configured
    if (config.showProperties && config.showProperties.length > 0) {
      for (const prop of config.showProperties) {
        if (prop !== "exo__Instance_class") {
          const propHeader = headerRow.createEl("th", { 
            text: prop, 
            cls: `sortable ${currentSort.column === prop ? `sorted-${currentSort.order}` : ''}` 
          });
          
          if (currentSort.column === prop) {
            propHeader.createSpan({ text: currentSort.order === 'asc' ? ' ▲' : ' ▼', cls: 'sort-indicator' });
          }
          
          propHeader.addEventListener('click', () => {
            this.updateSort(prop, sortStateKey);
            const sortedRelations = AssetRelationUtils.sortRelations(relations, prop, this.sortState.get(sortStateKey)!.order);
            this.updateTableBody(tbody, sortedRelations, config);
            this.updateSortIndicators(headerRow, this.sortState.get(sortStateKey)!);
          });
        }
      }
    }

    // Sort relations based on current sort state
    const sortedRelations = AssetRelationUtils.sortRelations(relations, currentSort.column, currentSort.order);

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
        ? (instanceClassRaw[0] || "-")
        : (instanceClassRaw || "-");
        
      row.createEl("td", {
        text: String(instanceClass),
        cls: "instance-class",
      });

      // Additional property columns if configured
      if (config.showProperties && config.showProperties.length > 0) {
        for (const prop of config.showProperties) {
          if (prop !== "exo__Instance_class") {
            // Don't duplicate Instance Class column
            const value = AssetRelationUtils.getPropertyValue(relation, prop);
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

      linkEl.addEventListener("click", (e) => {
        e.preventDefault();
        this.app.workspace.openLinkText(relation.path, "", false);
      });

      if (config.showProperties && config.showProperties.length > 0) {
        const propsEl = itemEl.createDiv({ cls: "exocortex-properties" });
        for (const prop of config.showProperties) {
          const value = AssetRelationUtils.getPropertyValue(relation, prop);
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

    const headerRow = thead.createEl("tr");
    headerRow.createEl("th", { text: "Name", cls: "sortable" });
    headerRow.createEl("th", { text: "exo__Instance_class", cls: "sortable" });

    if (config.showProperties) {
      for (const prop of config.showProperties) {
        if (prop !== "exo__Instance_class") {
          // Don't duplicate Instance Class column
          headerRow.createEl("th", { text: prop });
        }
      }
    }

    headerRow.createEl("th", { text: "Relation Type" });
    headerRow.createEl("th", { text: "Modified" });

    for (const relation of relations) {
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
        ? (instanceClassRaw[0] || "-")
        : (instanceClassRaw || "-");
        
      row.createEl("td", {
        text: String(instanceClass),
        cls: "instance-class",
      });

      if (config.showProperties) {
        for (const prop of config.showProperties) {
          if (prop !== "exo__Instance_class") {
            // Don't duplicate Instance Class column
            const value = AssetRelationUtils.getPropertyValue(relation, prop);
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
          const value = AssetRelationUtils.getPropertyValue(relation, prop);
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
      type: "UniversalLayout",
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
    if (!config.filters) return true;

    for (const [key, value] of Object.entries(config.filters)) {
      const relationValue = AssetRelationUtils.getPropertyValue(relation, key);
      if (relationValue !== value) {
        return false;
      }
    }

    return true;
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
      currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, default to ascending
      currentSort.column = column;
      currentSort.order = 'asc';
    }
    
    this.sortState.set(sortStateKey, currentSort);
  }

  /**
   * Update the table body with sorted data
   */
  private updateTableBody(
    tbody: HTMLElement,
    relations: AssetRelation[],
    config: UniversalLayoutConfig
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
        ? (instanceClassRaw[0] || "-")
        : (instanceClassRaw || "-");
        
      row.createEl("td", {
        text: String(instanceClass),
        cls: "instance-class",
      });

      // Additional property columns if configured
      if (config.showProperties && config.showProperties.length > 0) {
        for (const prop of config.showProperties) {
          if (prop !== "exo__Instance_class") {
            const value = AssetRelationUtils.getPropertyValue(relation, prop);
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
    sortState: { column: string; order: 'asc' | 'desc' }
  ): void {
    // Remove all existing indicators
    headerRow.querySelectorAll('.sort-indicator').forEach(el => el.remove());
    
    // Remove all sorted classes
    headerRow.querySelectorAll('th').forEach(th => {
      th.classList.remove('sorted-asc', 'sorted-desc');
    });
    
    // Add indicator to the currently sorted column
    const headers = headerRow.querySelectorAll('th');
    headers.forEach(th => {
      const text = th.textContent?.replace(' ▲', '').replace(' ▼', '').trim();
      if (text === sortState.column || 
          (text === 'Name' && sortState.column === 'Name') ||
          (text === 'exo__Instance_class' && sortState.column === 'exo__Instance_class')) {
        th.classList.add(`sorted-${sortState.order}`);
        th.createSpan({ 
          text: sortState.order === 'asc' ? ' ▲' : ' ▼', 
          cls: 'sort-indicator' 
        });
      }
    });
  }
}
