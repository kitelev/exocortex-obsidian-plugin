import { MarkdownPostProcessorContext, TFile } from "obsidian";
import { IViewRenderer, ViewConfig } from "../processors/CodeBlockProcessor";
import { ILogger } from "../../infrastructure/logging/ILogger";
import { LoggerFactory } from "../../infrastructure/logging/LoggerFactory";
import { ServiceProvider } from "../../infrastructure/providers/ServiceProvider";
import { IAssetRepository } from "../../domain/repositories/IAssetRepository";
import { Result } from "../../domain/core/Result";

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
}

/**
 * Renderer for UniversalLayout view type
 * Shows assets that reference the current asset (backlinks)
 */
export class UniversalLayoutRenderer implements IViewRenderer {
  private logger: ILogger;
  private assetRepository: IAssetRepository;
  private app: any;

  constructor(private serviceProvider: ServiceProvider) {
    this.logger = LoggerFactory.createForClass(UniversalLayoutRenderer);
    this.assetRepository = serviceProvider.getService("IAssetRepository");
    this.app = (window as any).app;
  }

  /**
   * Render the UniversalLayout view
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

      // Get backlinks for the current file
      const backlinks = await this.getBacklinks(currentFile, config);

      if (backlinks.length === 0) {
        this.renderMessage(el, "No backlinks found");
        return;
      }

      // Render based on layout type
      switch (config.layout) {
        case "table":
          await this.renderTable(el, backlinks, config);
          break;
        case "cards":
          await this.renderCards(el, backlinks, config);
          break;
        case "graph":
          await this.renderGraph(el, backlinks, config);
          break;
        default:
          await this.renderList(el, backlinks, config);
      }

      this.logger.info(
        `Rendered UniversalLayout with ${backlinks.length} backlinks`,
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
    // Re-render the view
    const source = el.getAttribute("data-source") || "";
    el.empty();
    await this.render(source, el, {} as MarkdownPostProcessorContext);
  }

  /**
   * Get backlinks for the current file
   */
  private async getBacklinks(
    file: TFile,
    config: UniversalLayoutConfig,
  ): Promise<any[]> {
    const backlinks: any[] = [];

    // Use Obsidian's metadata cache to get backlinks
    const cache = this.app.metadataCache;
    const resolvedLinks = cache.resolvedLinks;

    for (const [sourcePath, links] of Object.entries(resolvedLinks)) {
      if (links && (links as any)[file.path]) {
        const sourceFile = this.app.vault.getAbstractFileByPath(sourcePath);
        if (sourceFile instanceof TFile) {
          const metadata = cache.getFileCache(sourceFile);

          const backlinkData = {
            file: sourceFile,
            path: sourcePath,
            title: sourceFile.basename,
            metadata: metadata?.frontmatter || {},
            links: (links as any)[file.path] || 0,
            created: sourceFile.stat.ctime,
            modified: sourceFile.stat.mtime,
          };

          // Apply filters if specified
          if (this.matchesFilters(backlinkData, config)) {
            backlinks.push(backlinkData);
          }
        }
      }
    }

    // Sort backlinks
    if (config.sortBy) {
      backlinks.sort((a, b) => {
        const aVal = this.getPropertyValue(a, config.sortBy!);
        const bVal = this.getPropertyValue(b, config.sortBy!);
        const order = config.sortOrder === "desc" ? -1 : 1;
        return aVal > bVal ? order : -order;
      });
    }

    // Apply limit
    if (config.limit && config.limit > 0) {
      return backlinks.slice(0, config.limit);
    }

    return backlinks;
  }

  /**
   * Render backlinks as a list
   */
  private async renderList(
    el: HTMLElement,
    backlinks: any[],
    config: UniversalLayoutConfig,
  ): Promise<void> {
    const container = el.createDiv({ cls: "exocortex-backlinks-list" });

    // Add header
    container.createEl("h3", { text: `Backlinks (${backlinks.length})` });

    const listEl = container.createEl("ul", { cls: "exocortex-list" });

    for (const backlink of backlinks) {
      const itemEl = listEl.createEl("li", { cls: "exocortex-list-item" });

      // Create link to the file
      const linkEl = itemEl.createEl("a", {
        text: backlink.title,
        cls: "internal-link",
        href: backlink.path,
      });

      // Add click handler
      linkEl.addEventListener("click", (e) => {
        e.preventDefault();
        this.app.workspace.openLinkText(backlink.path, "", false);
      });

      // Show properties if configured
      if (config.showProperties && config.showProperties.length > 0) {
        const propsEl = itemEl.createDiv({ cls: "exocortex-properties" });
        for (const prop of config.showProperties) {
          const value = this.getPropertyValue(backlink, prop);
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
   * Render backlinks as a table
   */
  private async renderTable(
    el: HTMLElement,
    backlinks: any[],
    config: UniversalLayoutConfig,
  ): Promise<void> {
    const container = el.createDiv({ cls: "exocortex-backlinks-table" });

    // Add header
    container.createEl("h3", { text: `Backlinks (${backlinks.length})` });

    const table = container.createEl("table", { cls: "exocortex-table" });
    const thead = table.createEl("thead");
    const tbody = table.createEl("tbody");

    // Create header row
    const headerRow = thead.createEl("tr");
    headerRow.createEl("th", { text: "Title" });

    // Add property columns
    if (config.showProperties) {
      for (const prop of config.showProperties) {
        headerRow.createEl("th", { text: prop });
      }
    }

    headerRow.createEl("th", { text: "Modified" });

    // Create data rows
    for (const backlink of backlinks) {
      const row = tbody.createEl("tr");

      // Title cell with link
      const titleCell = row.createEl("td");
      const linkEl = titleCell.createEl("a", {
        text: backlink.title,
        cls: "internal-link",
        href: backlink.path,
      });

      linkEl.addEventListener("click", (e) => {
        e.preventDefault();
        this.app.workspace.openLinkText(backlink.path, "", false);
      });

      // Property cells
      if (config.showProperties) {
        for (const prop of config.showProperties) {
          const value = this.getPropertyValue(backlink, prop);
          row.createEl("td", { text: value?.toString() || "" });
        }
      }

      // Modified date cell
      row.createEl("td", {
        text: new Date(backlink.modified).toLocaleDateString(),
      });
    }
  }

  /**
   * Render backlinks as cards
   */
  private async renderCards(
    el: HTMLElement,
    backlinks: any[],
    config: UniversalLayoutConfig,
  ): Promise<void> {
    const container = el.createDiv({ cls: "exocortex-backlinks-cards" });

    // Add header
    container.createEl("h3", { text: `Backlinks (${backlinks.length})` });

    const cardsContainer = container.createDiv({ cls: "exocortex-cards-grid" });

    for (const backlink of backlinks) {
      const card = cardsContainer.createDiv({ cls: "exocortex-card" });

      // Card title
      const titleEl = card.createEl("h4", { cls: "exocortex-card-title" });
      const linkEl = titleEl.createEl("a", {
        text: backlink.title,
        cls: "internal-link",
        href: backlink.path,
      });

      linkEl.addEventListener("click", (e) => {
        e.preventDefault();
        this.app.workspace.openLinkText(backlink.path, "", false);
      });

      // Card properties
      if (config.showProperties && config.showProperties.length > 0) {
        const propsEl = card.createDiv({ cls: "exocortex-card-properties" });
        for (const prop of config.showProperties) {
          const value = this.getPropertyValue(backlink, prop);
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

      // Card footer
      const footer = card.createDiv({ cls: "exocortex-card-footer" });
      footer.createSpan({
        text: `Modified: ${new Date(backlink.modified).toLocaleDateString()}`,
        cls: "card-date",
      });
    }
  }

  /**
   * Render backlinks as a graph (placeholder for now)
   */
  private async renderGraph(
    el: HTMLElement,
    backlinks: any[],
    config: UniversalLayoutConfig,
  ): Promise<void> {
    const container = el.createDiv({ cls: "exocortex-backlinks-graph" });
    container.createEl("h3", { text: `Backlinks Graph (${backlinks.length})` });
    container.createEl("p", {
      text: "Graph visualization coming soon. Showing list view instead.",
    });

    // Fall back to list view for now
    await this.renderList(container, backlinks, config);
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
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line === "UniversalLayout") continue;

      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        try {
          // Handle array values for showProperties
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
   * Check if a backlink matches the configured filters
   */
  private matchesFilters(
    backlink: any,
    config: UniversalLayoutConfig,
  ): boolean {
    if (!config.filters) return true;

    for (const [key, value] of Object.entries(config.filters)) {
      const backlinkValue = this.getPropertyValue(backlink, key);
      if (backlinkValue !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get a property value from a backlink object
   */
  private getPropertyValue(backlink: any, property: string): any {
    // Check frontmatter first
    if (backlink.metadata && backlink.metadata[property] !== undefined) {
      return backlink.metadata[property];
    }

    // Check direct properties
    if (backlink[property] !== undefined) {
      return backlink[property];
    }

    // Check nested properties using dot notation
    const parts = property.split(".");
    let value = backlink;
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) break;
    }

    return value;
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
}
