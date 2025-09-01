import { App, MarkdownPostProcessorContext, TFile } from "obsidian";
import {
  BaseAssetRelationsRenderer,
  AssetRelation,
  AssetRelationsConfig,
} from "./BaseAssetRelationsRenderer";
import { ServiceProvider } from "../../infrastructure/providers/ServiceProvider";
import { IAssetRepository } from "../../domain/repositories/IAssetRepository";
import { ILogger } from "../../application/ports/ILogger";
import { LoggerFactory } from "../../infrastructure/logging/LoggerFactory";
import { EnhancedCreateAssetModal } from "../modals/EnhancedCreateAssetModal";

/**
 * UniversalLayout configuration extending base config
 */
interface UniversalLayoutConfig extends AssetRelationsConfig {
  layout?: "list" | "table" | "cards" | "graph";
  showBacklinks?: boolean;
  showForwardLinks?: boolean;
}

/**
 * RefactoredUniversalLayoutRenderer - Shows all asset relations grouped by property
 * Extends BaseAssetRelationsRenderer for code reuse and consistency
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Handles universal relation display
 * - Open/Closed: Extends base without modification
 * - Liskov Substitution: Can replace IViewRenderer
 * - Interface Segregation: Uses only needed interfaces
 * - Dependency Inversion: Depends on abstractions
 *
 * DRY: Reuses common logic from base class
 * KISS: Simple implementation focusing on core functionality
 */
export class RefactoredUniversalLayoutRenderer extends BaseAssetRelationsRenderer {
  private logger: ILogger;
  private assetRepository: IAssetRepository;

  constructor(app: App, serviceProvider: ServiceProvider) {
    super(app);
    this.logger = LoggerFactory.createForClass(
      RefactoredUniversalLayoutRenderer,
    );
    this.assetRepository = serviceProvider.getService("IAssetRepository");
  }

  /**
   * Main render method - implements abstract method from base
   */
  async render(
    source: string,
    container: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ): Promise<void> {
    try {
      const config = this.parseConfig(source);
      const file = this.getCurrentFile(ctx);


      if (!file) {
        this.renderMessage(container, "No active file");
        return;
      }

      // Check if this is a class file and render creation button if so
      await this.renderCreationButtonIfClass(container, file);

      // Get all relations for the current file
      const relations = await this.collectAllRelations(file);

      if (relations.length === 0) {
        this.renderMessage(container, "No related assets found");
      } else {
        // Default behavior: group by property (Assets Relations)
        if (config.groupByProperty !== false) {
          const groupedRelations = this.groupRelationsByProperty(relations);
          this.renderGroupedRelations(container, groupedRelations);
        } else {
          // Legacy behavior: render based on layout type
          await this.renderByLayout(container, relations, config);
        }
      }

      this.logger.info(
        `Rendered UniversalLayout with ${relations.length} asset relations`,
      );
    } catch (error) {
      this.logger.error("Failed to render UniversalLayout", { error });
      this.renderError(container, `Error: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Parse configuration from source
   */
  private parseConfig(source: string): UniversalLayoutConfig {
    const lines = source.trim().split("\n");
    const config: UniversalLayoutConfig = {
      groupByProperty: true, // Default to showing grouped relations
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "UniversalLayout") continue;

      const match = trimmed.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        try {
          // Try to parse as JSON
          (config as any)[key] = JSON.parse(value);
        } catch {
          // Handle special cases for comma-separated values
          if (key === 'showProperties' && value.includes(',')) {
            (config as any)[key] = value.split(',').map(s => s.trim());
          } else {
            // Otherwise treat as string
            (config as any)[key] = value;
          }
        }
      }
    }

    return config;
  }

  /**
   * Render relations based on layout type (legacy mode)
   */
  private async renderByLayout(
    container: HTMLElement,
    relations: AssetRelation[],
    config: UniversalLayoutConfig,
  ): Promise<void> {
    switch (config.layout) {
      case "table":
        this.renderTable(container, relations, config);
        break;
      case "cards":
        this.renderCards(container, relations, config);
        break;
      case "graph":
        this.renderGraph(container, relations, config);
        break;
      default:
        this.renderList(container, relations, config);
    }
  }

  /**
   * Render relations as a simple list (legacy mode)
   */
  private renderList(
    container: HTMLElement,
    relations: AssetRelation[],
    config: UniversalLayoutConfig,
  ): void {
    const listEl = container.createEl("ul", {
      cls: "exocortex-relations-list",
    });

    for (const relation of relations) {
      const itemEl = listEl.createEl("li");
      const linkEl = itemEl.createEl("a", {
        text: relation.title,
        cls: "internal-link",
        href: relation.path,
      });

      linkEl.addEventListener("click", (e) => {
        e.preventDefault();
        this.app.workspace.openLinkText(relation.path, "", false);
      });
    }
  }

  /**
   * Render relations as a table (legacy mode)
   */
  private renderTable(
    container: HTMLElement,
    relations: AssetRelation[],
    config: UniversalLayoutConfig,
  ): void {
    // Determine CSS classes based on mobile detection
    const isMobile = typeof window !== 'undefined' && (window as any).isMobile;
    const tableClasses = ["exocortex-table"];
    if (isMobile) {
      tableClasses.push("mobile-responsive");
    }

    const table = container.createEl("table", {
      cls: tableClasses.join(" "),
    });

    const thead = table.createEl("thead");
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

    const tbody = table.createEl("tbody");
    for (const relation of relations) {
      const row = tbody.createEl("tr");

      // Name column with link
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

      // Instance Class column - render as clickable links
      const instanceClassCell = row.createEl("td", {
        cls: "instance-class",
      });

      this.renderInstanceClassLinks(instanceClassCell, relation.metadata);

      if (config.showProperties) {
        for (const prop of config.showProperties) {
          if (prop !== "exo__Instance_class") {
            // Don't duplicate Instance Class column
            const value = this.getPropertyValue(relation, prop);
            row.createEl("td", { text: value?.toString() || "" });
          }
        }
      }

      row.createEl("td", {
        text: relation.propertyName || "body",
        cls: "relation-type",
      });

      row.createEl("td", {
        text: new Date(relation.modified).toLocaleDateString(),
      });
    }
  }

  /**
   * Render relations as cards (legacy mode)
   */
  private renderCards(
    container: HTMLElement,
    relations: AssetRelation[],
    config: UniversalLayoutConfig,
  ): void {
    const cardsContainer = container.createDiv({
      cls: "exocortex-relations-cards",
    });

    for (const relation of relations) {
      const card = cardsContainer.createDiv({
        cls: "exocortex-relation-card",
      });

      const linkEl = card.createEl("a", {
        text: relation.title,
        cls: "internal-link card-title",
        href: relation.path,
      });

      linkEl.addEventListener("click", (e) => {
        e.preventDefault();
        this.app.workspace.openLinkText(relation.path, "", false);
      });

      if (relation.propertyName) {
        card.createDiv({
          text: `Via: ${relation.propertyName}`,
          cls: "card-property",
        });
      }

      card.createDiv({
        text: new Date(relation.modified).toLocaleDateString(),
        cls: "card-date",
      });
    }
  }

  /**
   * Render relations as a graph (placeholder for future implementation)
   */
  private renderGraph(
    container: HTMLElement,
    relations: AssetRelation[],
    config: UniversalLayoutConfig,
  ): void {
    container.createDiv({
      text: "Graph view not yet implemented",
      cls: "exocortex-placeholder",
    });
  }

  /**
   * Get property value from relation metadata
   */
  private getPropertyValue(relation: AssetRelation, propertyName: string): any {
    return relation.metadata[propertyName];
  }

  /**
   * Render creation button if the current file is a class
   */
  private async renderCreationButtonIfClass(
    container: HTMLElement,
    file: TFile,
  ): Promise<void> {
    const metadata = this.getFileMetadata(file);
    const instanceClass = metadata?.exo__Instance_class;


    // Check if this is a class file
    if (instanceClass === "exo__Class" || instanceClass === "[[exo__Class]]") {
      const buttonContainer = container.createDiv({
        cls: "exocortex-creation-button-container",
      });

      // Generate button label from class name or rdfs__label
      const label = metadata?.rdfs__label || this.humanizeClassName(file.basename);
      const customLabel = metadata?.exo__Class_createButtonLabel;
      const buttonText = customLabel || `Create ${label}`;

      const button = buttonContainer.createEl("button", {
        text: buttonText,
        cls: "exocortex-create-asset-button",
      });

      button.addEventListener("click", async () => {
        try {
          const modal = new EnhancedCreateAssetModal(this.app, file.basename);
          modal.open();
        } catch (error) {
          this.logger.error("Error opening create asset modal", { error });
        }
      });
    }
  }

  /**
   * Humanize class names by removing prefixes and converting to readable format
   */
  private humanizeClassName(className: string): string {
    // Remove common prefixes
    const cleaned = className.replace(/^(ems__|exo__|ui__|test__)/, "");
    
    // Convert camelCase/PascalCase to spaced words
    const spaced = cleaned.replace(/([A-Z])/g, " $1");
    
    // Trim first, then capitalize
    const trimmed = spaced.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
}
