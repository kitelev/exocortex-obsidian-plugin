import { MarkdownPostProcessorContext, TFile } from "obsidian";
import { IViewRenderer, ViewConfig } from "../processors/CodeBlockProcessor";
import { ILogger } from "../../infrastructure/logging/ILogger";
import { LoggerFactory } from "../../infrastructure/logging/LoggerFactory";
import { ServiceProvider } from "../../infrastructure/providers/ServiceProvider";
import { IAssetRepository } from "../../domain/repositories/IAssetRepository";

/**
 * AssetList configuration options
 */
interface AssetListConfig extends ViewConfig {
  class?: string;
  folder?: string;
  tags?: string[];
  properties?: string[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  limit?: number;
  showCreateButton?: boolean;
}

/**
 * Renderer for AssetList view type
 * Shows a filtered list of assets based on criteria
 */
export class AssetListRenderer implements IViewRenderer {
  private logger: ILogger;
  private assetRepository: IAssetRepository;
  private app: any;

  constructor(private serviceProvider: ServiceProvider) {
    this.logger = LoggerFactory.createForClass(AssetListRenderer);
    this.assetRepository = serviceProvider.getService("IAssetRepository");
    this.app = (window as any).app;
  }

  /**
   * Render the AssetList view
   */
  public async render(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ): Promise<void> {
    try {
      const config = this.parseConfig(source);
      const assets = await this.getFilteredAssets(config);
      
      // Create container
      const container = el.createDiv({ cls: "exocortex-asset-list" });
      
      // Add header with count
      const header = container.createDiv({ cls: "exocortex-asset-header" });
      header.createEl("h3", { 
        text: `Assets ${config.class ? `(${config.class})` : ""}: ${assets.length}` 
      });
      
      // Add create button if enabled
      if (config.showCreateButton) {
        const createBtn = header.createEl("button", {
          text: "➕ Create Asset",
          cls: "exocortex-create-button"
        });
        createBtn.addEventListener("click", () => this.createNewAsset(config));
      }
      
      // Render the asset list
      if (assets.length === 0) {
        container.createDiv({ 
          text: "No assets found matching criteria",
          cls: "exocortex-message" 
        });
      } else {
        await this.renderAssetList(container, assets, config);
      }
      
      this.logger.info(`Rendered AssetList with ${assets.length} assets`);
      
    } catch (error) {
      this.logger.error("Failed to render AssetList", { error });
      this.renderError(el, error.message);
    }
  }

  /**
   * Get filtered assets based on configuration
   */
  private async getFilteredAssets(config: AssetListConfig): Promise<any[]> {
    const assets: any[] = [];
    const files = this.app.vault.getMarkdownFiles();
    
    for (const file of files) {
      // Apply folder filter
      if (config.folder && !file.path.startsWith(config.folder)) {
        continue;
      }
      
      const metadata = this.app.metadataCache.getFileCache(file);
      if (!metadata?.frontmatter) continue;
      
      // Apply class filter
      if (config.class && metadata.frontmatter.class !== config.class) {
        continue;
      }
      
      // Apply tag filter
      if (config.tags && config.tags.length > 0) {
        const fileTags = metadata.frontmatter.tags || [];
        const hasTag = config.tags.some(tag => fileTags.includes(tag));
        if (!hasTag) continue;
      }
      
      assets.push({
        file,
        title: file.basename,
        path: file.path,
        metadata: metadata.frontmatter,
        created: file.stat.ctime,
        modified: file.stat.mtime
      });
    }
    
    // Sort assets
    if (config.sortBy) {
      assets.sort((a, b) => {
        const aVal = this.getPropertyValue(a, config.sortBy!);
        const bVal = this.getPropertyValue(b, config.sortBy!);
        const order = config.sortOrder === "desc" ? -1 : 1;
        return aVal > bVal ? order : -order;
      });
    }
    
    // Apply limit
    if (config.limit && config.limit > 0) {
      return assets.slice(0, config.limit);
    }
    
    return assets;
  }

  /**
   * Render the asset list
   */
  private async renderAssetList(
    container: HTMLElement,
    assets: any[],
    config: AssetListConfig
  ): Promise<void> {
    const listEl = container.createEl("div", { cls: "exocortex-asset-items" });
    
    for (const asset of assets) {
      const itemEl = listEl.createDiv({ cls: "exocortex-asset-item" });
      
      // Asset title with link
      const titleEl = itemEl.createDiv({ cls: "exocortex-asset-title" });
      const linkEl = titleEl.createEl("a", {
        text: asset.title,
        cls: "internal-link",
        href: asset.path
      });
      
      linkEl.addEventListener("click", (e) => {
        e.preventDefault();
        this.app.workspace.openLinkText(asset.path, "", false);
      });
      
      // Show selected properties
      if (config.properties && config.properties.length > 0) {
        const propsEl = itemEl.createDiv({ cls: "exocortex-asset-properties" });
        
        for (const prop of config.properties) {
          const value = this.getPropertyValue(asset, prop);
          if (value !== undefined && value !== null && value !== "") {
            const propEl = propsEl.createDiv({ cls: "exocortex-asset-property" });
            propEl.createSpan({ 
              text: `${prop}: `,
              cls: "property-label" 
            });
            propEl.createSpan({ 
              text: this.formatPropertyValue(value),
              cls: "property-value" 
            });
          }
        }
      }
      
      // Asset metadata
      const metaEl = itemEl.createDiv({ cls: "exocortex-asset-meta" });
      metaEl.createSpan({ 
        text: `Modified: ${new Date(asset.modified).toLocaleDateString()}`,
        cls: "asset-date"
      });
    }
  }

  /**
   * Create a new asset based on configuration
   */
  private async createNewAsset(config: AssetListConfig): Promise<void> {
    try {
      // Generate a unique name
      const timestamp = Date.now();
      const name = `New Asset ${timestamp}`;
      const folder = config.folder || "";
      const path = folder ? `${folder}/${name}.md` : `${name}.md`;
      
      // Create frontmatter
      const frontmatter: any = {
        created: new Date().toISOString(),
        class: config.class || "Asset"
      };
      
      if (config.tags && config.tags.length > 0) {
        frontmatter.tags = config.tags;
      }
      
      // Create the file content
      const content = this.generateFileContent(frontmatter, name);
      
      // Create the file
      await this.app.vault.create(path, content);
      
      // Open the new file
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file instanceof TFile) {
        await this.app.workspace.openLinkText(path, "", false);
      }
      
      this.logger.info("Created new asset", { path, class: config.class });
      
    } catch (error) {
      this.logger.error("Failed to create asset", { error });
      // Show error notice
      (window as any).app.notices.show(`Failed to create asset: ${error.message}`);
    }
  }

  /**
   * Generate file content with frontmatter
   */
  private generateFileContent(frontmatter: any, title: string): string {
    const yamlLines = ["---"];
    
    for (const [key, value] of Object.entries(frontmatter)) {
      if (Array.isArray(value)) {
        yamlLines.push(`${key}:`);
        value.forEach(v => yamlLines.push(`  - ${v}`));
      } else {
        yamlLines.push(`${key}: ${value}`);
      }
    }
    
    yamlLines.push("---");
    yamlLines.push("");
    yamlLines.push(`# ${title}`);
    yamlLines.push("");
    
    return yamlLines.join("\n");
  }

  /**
   * Parse configuration from source
   */
  private parseConfig(source: string): AssetListConfig {
    const lines = source.trim().split("\n");
    const config: AssetListConfig = {
      type: "AssetList"
    };
    
    for (const line of lines) {
      if (!line || line === "AssetList") continue;
      
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        
        if (key === "tags" || key === "properties") {
          config[key] = value.split(",").map(s => s.trim());
        } else if (key === "showCreateButton") {
          config[key] = value === "true";
        } else if (key === "limit") {
          config[key] = parseInt(value, 10);
        } else {
          (config as any)[key] = value;
        }
      }
    }
    
    return config;
  }

  /**
   * Get a property value from an asset
   */
  private getPropertyValue(asset: any, property: string): any {
    // Check metadata first
    if (asset.metadata && asset.metadata[property] !== undefined) {
      return asset.metadata[property];
    }
    
    // Check direct properties
    return asset[property];
  }

  /**
   * Format a property value for display
   */
  private formatPropertyValue(value: any): string {
    if (value === null || value === undefined) {
      return "";
    }
    
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    
    return String(value);
  }

  /**
   * Render an error message
   */
  private renderError(el: HTMLElement, message: string): void {
    el.createDiv({ 
      text: `Error: ${message}`,
      cls: "exocortex-error-message" 
    });
  }

  /**
   * Refresh the view
   */
  public async refresh(el: HTMLElement): Promise<void> {
    const source = el.getAttribute("data-source") || "";
    el.empty();
    await this.render(source, el, {} as MarkdownPostProcessorContext);
  }
}