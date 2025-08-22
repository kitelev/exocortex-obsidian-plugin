import { App, TFile } from "obsidian";
import { RenderingUtils } from "./utils/RenderingUtils";
import { ErrorHandlingUtils } from "./utils/ErrorHandlingUtils";

/**
 * Base renderer class that provides common functionality for all block renderers
 * Implements DRY principle by extracting common rendering patterns
 */
export abstract class BaseRenderer {
  protected app: App;

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Main render method that all renderers must implement
   */
  abstract render(
    container: HTMLElement,
    config: any,
    file: TFile,
    dv: any,
  ): Promise<void>;

  /**
   * Common preprocessing for all renderers
   */
  protected async preprocess(
    container: HTMLElement,
    config: any,
    file: TFile
  ): Promise<{
    totalFiles: TFile[];
    filteredFiles: TFile[];
    displayFiles: TFile[];
  }> {
    try {
      // Get initial file list (subclasses implement this)
      const totalFiles = await this.getRelevantFiles(config, file);
      
      // Apply class filter if specified
      const filteredFiles = RenderingUtils.filterFilesByClass(
        this.app,
        totalFiles,
        config.filterByClass
      );
      
      // Apply result limit if specified
      const displayFiles = RenderingUtils.applyResultLimit(
        filteredFiles,
        config.maxResults
      );
      
      return { totalFiles, filteredFiles, displayFiles };
    } catch (error) {
      ErrorHandlingUtils.handleRenderingError(
        this.constructor.name,
        error,
        container,
        "Unable to load content"
      );
      
      return { totalFiles: [], filteredFiles: [], displayFiles: [] };
    }
  }

  /**
   * Render empty state with consistent styling
   */
  protected renderEmptyState(container: HTMLElement, message: string): void {
    RenderingUtils.createEmptyMessage(container, message);
  }

  /**
   * Render count information
   */
  protected renderCountInfo(
    container: HTMLElement,
    totalCount: number,
    displayCount: number,
    itemType: string,
    additionalInfo?: string
  ): void {
    const className = `exocortex-${itemType.toLowerCase().replace(/ /g, "-")}-info`;
    const suffix = additionalInfo ? ` ${additionalInfo}` : "";
    
    RenderingUtils.createCountInfo(
      container,
      totalCount,
      displayCount,
      itemType + suffix,
      className
    );
  }

  /**
   * Render files in flat format (list, table, or cards)
   */
  protected renderFlatFiles(
    container: HTMLElement,
    files: TFile[],
    config: any
  ): void {
    const displayAs = config.displayAs || "table";

    switch (displayAs) {
      case "list":
        this.renderFilesList(container, files, config);
        break;
      case "cards":
        this.renderFilesCards(container, files, config);
        break;
      default:
        this.renderFilesTable(container, files, config);
        break;
    }
  }

  /**
   * Render files grouped by class
   */
  protected renderGroupedFiles(
    container: HTMLElement,
    files: TFile[],
    config: any,
    itemType: string
  ): void {
    const groups = RenderingUtils.groupFilesByClass(this.app, files);
    const sortedGroups = RenderingUtils.sortGroupsByName(groups);

    sortedGroups.forEach(([className, groupFiles]) => {
      const groupContainer = container.createDiv({
        cls: `exocortex-${itemType.toLowerCase()}-group`,
      });

      RenderingUtils.createGroupHeader(
        groupContainer,
        className,
        groupFiles.length,
        `${itemType.toLowerCase()}-group-header`
      );

      // Render group contents without grouping
      this.renderFlatFiles(groupContainer, groupFiles, {
        ...config,
        groupByClass: false,
      });
    });
  }

  /**
   * Render files as a list
   */
  protected renderFilesList(
    container: HTMLElement,
    files: TFile[],
    config: any
  ): void {
    const list = RenderingUtils.createList(
      container,
      `exocortex-${this.getItemType().toLowerCase()}-list`
    );

    files.forEach((file) => {
      const item = list.createEl("li", { 
        cls: `exocortex-${this.getItemType().toLowerCase()}-item` 
      });

      // Create main link
      const displayLabel = RenderingUtils.getDisplayLabel(this.app, file);
      RenderingUtils.createInternalLink(item, displayLabel, file.path);

      // Add additional info if enabled
      if (config.showInstanceInfo || config.showClassInfo) {
        this.renderAdditionalFileInfo(item, file, config);
      }
    });
  }

  /**
   * Render files as cards
   */
  protected renderFilesCards(
    container: HTMLElement,
    files: TFile[],
    config: any
  ): void {
    const cardsContainer = container.createDiv({
      cls: `exocortex-${this.getItemType().toLowerCase()}-cards`,
    });

    files.forEach((file) => {
      const card = cardsContainer.createDiv({ 
        cls: `exocortex-${this.getItemType().toLowerCase()}-card` 
      });

      // Card title
      const title = card.createEl("h4", { cls: "exocortex-card-title" });
      const displayLabel = RenderingUtils.getDisplayLabel(this.app, file);
      RenderingUtils.createInternalLink(title, displayLabel, file.path);

      // Card content
      if (config.showInstanceInfo) {
        this.renderCardContent(card, file, config);
      }
    });
  }

  /**
   * Render files as a table
   */
  protected renderFilesTable(
    container: HTMLElement,
    files: TFile[],
    config: any
  ): void {
    const headers = this.getTableHeaders(config);
    const { table, thead, tbody } = RenderingUtils.createTable(
      container,
      headers,
      `exocortex-${this.getItemType().toLowerCase()}-table`
    );

    files.forEach((file) => {
      const row = tbody.createEl("tr", { 
        cls: `exocortex-${this.getItemType().toLowerCase()}-row` 
      });
      this.renderTableRow(row, file, config);
    });
  }

  /**
   * Clean class name using utility
   */
  protected cleanClassName(className: any): string {
    return RenderingUtils.cleanClassName(className);
  }

  /**
   * Get display label for file using utility
   */
  protected getDisplayLabel(file: TFile): string {
    return RenderingUtils.getDisplayLabel(this.app, file);
  }

  // Abstract methods that subclasses must implement

  /**
   * Get the list of files relevant to this renderer
   */
  protected abstract getRelevantFiles(config: any, file: TFile): Promise<TFile[]>;

  /**
   * Get the item type for this renderer (e.g., "backlink", "instance")
   */
  protected abstract getItemType(): string;

  /**
   * Get table headers for this renderer
   */
  protected abstract getTableHeaders(config: any): string[];

  /**
   * Render a single table row for this renderer
   */
  protected abstract renderTableRow(row: HTMLElement, file: TFile, config: any): void;

  /**
   * Render additional file info (optional override)
   */
  protected renderAdditionalFileInfo(
    container: HTMLElement,
    file: TFile,
    config: any
  ): void {
    // Default implementation - subclasses can override
    const instanceClass = RenderingUtils.extractFrontmatterData(
      this.app,
      file,
      "exo__Instance_class"
    );
    
    if (instanceClass) {
      container.createEl("span", {
        text: ` (${this.cleanClassName(instanceClass)})`,
        cls: "exocortex-class-info",
      });
    }
  }

  /**
   * Render card content (optional override)
   */
  protected renderCardContent(
    card: HTMLElement,
    file: TFile,
    config: any
  ): void {
    // Default implementation - subclasses can override
    const instanceClass = RenderingUtils.extractFrontmatterData(
      this.app,
      file,
      "exo__Instance_class"
    );
    
    if (instanceClass) {
      card.createEl("p", {
        text: `Class: ${this.cleanClassName(instanceClass)}`,
        cls: "exocortex-card-class",
      });
    }

    const description = RenderingUtils.extractFrontmatterData(
      this.app,
      file,
      "exo__Asset_description"
    );
    
    if (description) {
      card.createEl("p", {
        text: description,
        cls: "exocortex-card-description",
      });
    }
  }
}