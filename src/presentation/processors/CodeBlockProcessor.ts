import { MarkdownPostProcessorContext, MarkdownRenderChild } from "obsidian";
import { ILogger } from "../../infrastructure/logging/ILogger";
import { LoggerFactory } from "../../infrastructure/logging/LoggerFactory";
import { ServiceProvider } from "../../infrastructure/providers/ServiceProvider";

/**
 * Interface for view renderers that handle specific code block content types
 */
export interface IViewRenderer {
  render(
    content: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ): Promise<void>;
  
  /**
   * Called when the view should be updated due to external changes
   */
  refresh?(el: HTMLElement): Promise<void>;
}

/**
 * Configuration for a code block view
 */
export interface ViewConfig {
  type: string;
  filters?: Record<string, any>;
  layout?: string;
  showProperties?: string[];
  groupBy?: string;
  sortBy?: string;
  limit?: number;
}

/**
 * Main code block processor for 'exocortex' code blocks
 * Similar to LifeOS plugin architecture but adapted for Exocortex
 */
export class CodeBlockProcessor {
  private logger: ILogger;
  private views: Map<string, IViewRenderer> = new Map();
  private activeElements: Map<HTMLElement, ViewConfig> = new Map();

  constructor(private serviceProvider: ServiceProvider) {
    this.logger = LoggerFactory.createForClass(CodeBlockProcessor);
    this.loadViews();
  }

  /**
   * Load all available view renderers
   */
  private loadViews(): void {
    // These will be registered from the main plugin
    this.logger.info("Code block processor initialized");
  }

  /**
   * Register a new view renderer
   */
  public registerView(name: string, renderer: IViewRenderer): void {
    this.views.set(name, renderer);
    this.logger.info(`Registered view: ${name}`);
  }

  /**
   * Main processor function called by Obsidian for each code block
   */
  public async processCodeBlock(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Parse the source to extract view type and configuration
      const config = this.parseConfig(source);
      
      // Get the appropriate renderer
      const renderer = this.views.get(config.type);
      
      if (!renderer) {
        this.renderError(el, `Unknown view type: ${config.type}`);
        return;
      }

      // Clear existing content
      el.empty();
      
      // Add container with proper styling
      const container = el.createDiv({ cls: "exocortex-view-container" });
      container.setAttribute("data-view-type", config.type);
      
      // Store the element and config for live updates
      this.activeElements.set(container, config);
      
      // Render the view
      await renderer.render(source, container, ctx);
      
      // Set up cleanup when the element is removed from DOM
      const self = this;
      ctx.addChild(new class extends MarkdownRenderChild {
        constructor() {
          super(container);
        }
        
        onunload() {
          self.activeElements.delete(container);
        }
      }());
      
      this.logger.info(`Rendered view ${config.type}`, {
        duration: Date.now() - startTime,
        sourcePath: ctx.sourcePath
      });
      
    } catch (error) {
      this.logger.error(`Failed to process code block`, { error });
      this.renderError(el, `Error: ${error.message}`);
    }
  }

  /**
   * Parse the configuration from the code block source
   */
  private parseConfig(source: string): ViewConfig {
    const lines = source.trim().split("\n");
    const type = lines[0]?.trim() || "UniversalLayout";
    
    // Parse YAML-like configuration if present
    const config: ViewConfig = { type };
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith("#")) continue;
      
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        try {
          // Try to parse as JSON first
          (config as any)[key] = JSON.parse(value);
        } catch {
          // Otherwise treat as string
          (config as any)[key] = value;
        }
      }
    }
    
    return config;
  }

  /**
   * Render an error message in the code block area
   */
  private renderError(el: HTMLElement, message: string): void {
    el.empty();
    const errorDiv = el.createDiv({ cls: "exocortex-error" });
    errorDiv.createEl("span", { 
      text: "⚠️ " + message,
      cls: "exocortex-error-message" 
    });
  }

  /**
   * Refresh all active views (called when data changes)
   */
  public async refreshViews(): Promise<void> {
    for (const [element, config] of this.activeElements) {
      const renderer = this.views.get(config.type);
      if (renderer?.refresh) {
        await renderer.refresh(element);
      }
    }
  }
}