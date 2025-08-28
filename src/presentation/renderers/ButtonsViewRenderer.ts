import { App, MarkdownPostProcessorContext, TFile } from "obsidian";
import { IViewRenderer } from "../processors/CodeBlockProcessor";
import { ButtonsBlockRenderer } from "./ButtonsBlockRenderer";
import { ILogger } from "../../infrastructure/logging/ILogger";
import { LoggerFactory } from "../../infrastructure/logging/LoggerFactory";

/**
 * View renderer adapter for ButtonsBlockRenderer to work with CodeBlockProcessor
 * Follows the Adapter pattern to bridge different interfaces
 */
export class ButtonsViewRenderer implements IViewRenderer {
  private logger: ILogger;
  private buttonsRenderer: ButtonsBlockRenderer;

  constructor(private app: App) {
    this.logger = LoggerFactory.createForClass(ButtonsViewRenderer);
    this.buttonsRenderer = new ButtonsBlockRenderer(app);
  }

  async render(
    content: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ): Promise<void> {
    try {
      // Get the current file and its frontmatter
      const file = this.getCurrentFile(ctx);
      const frontmatter = this.getFrontmatter(file);

      if (!file) {
        // Show a message if no file context is available
        el.createDiv({ text: "Buttons require a file context to work properly.", cls: "exocortex-warning" });
        return;
      }

      // Check if content contains button references or YAML config
      const isButtonReferences = this.isButtonReferencesFormat(content);
      
      let config: any;
      if (isButtonReferences) {
        // Parse button references and load their configs
        config = await this.loadButtonReferences(content);
      } else {
        // Parse as YAML configuration
        config = this.parseButtonsConfig(content);
      }

      // Render the buttons using the existing ButtonsBlockRenderer
      await this.buttonsRenderer.render(el, config, file, frontmatter);

      this.logger.info("Buttons view rendered successfully", {
        buttonCount: config?.buttons?.length || 0,
        file: file?.path,
      });
    } catch (error) {
      this.logger.error("Failed to render Buttons view", { error });
      throw error;
    }
  }

  async refresh(el: HTMLElement): Promise<void> {
    // For buttons, we might need to re-render if the file context has changed
    // For now, we'll just log that a refresh was requested
    this.logger.info("Buttons view refresh requested");
  }

  /**
   * Check if content is in button references format
   */
  private isButtonReferencesFormat(content: string): boolean {
    const lines = content.trim().split('\n');
    // Check if first line is just "Buttons" or similar without YAML syntax
    if (lines[0]?.trim().toLowerCase() === 'buttons') {
      // Check if subsequent lines contain wiki link references
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('- [[') && line.endsWith(']]')) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Load button configurations from wiki link references
   */
  private async loadButtonReferences(content: string): Promise<any> {
    const lines = content.trim().split('\n');
    const buttons: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Extract wiki link references
      const linkMatch = line.match(/^-\s*\[\[([^\]]+)\]\]$/);
      if (linkMatch) {
        const buttonRef = linkMatch[1];
        const buttonConfig = await this.loadButtonFromReference(buttonRef);
        if (buttonConfig) {
          buttons.push(buttonConfig);
        }
      }
    }

    return { buttons };
  }

  /**
   * Load a single button configuration from a file reference
   */
  private async loadButtonFromReference(reference: string): Promise<any | null> {
    try {
      // Try to find the file
      const filePath = `${reference}.md`;
      let file = this.app.vault.getAbstractFileByPath(filePath) as TFile;
      
      // If not found in root, search in known directories
      if (!file) {
        const searchPaths = [
          `02 Ontology/2 Custom/ems/${reference}.md`,
          `02 Ontology/1 Exo/${reference}.md`,
          `ui/${reference}.md`,
        ];
        
        for (const path of searchPaths) {
          file = this.app.vault.getAbstractFileByPath(path) as TFile;
          if (file) break;
        }
      }

      if (!file) {
        this.logger.warn(`Button reference not found: ${reference}`);
        return null;
      }

      // Get the file's frontmatter
      const cache = this.app.metadataCache.getFileCache(file);
      const fm = cache?.frontmatter;
      
      if (!fm) {
        this.logger.warn(`No frontmatter found for button: ${reference}`);
        return null;
      }

      // Convert frontmatter to button config
      return {
        label: fm['ui__Button_label'] || fm['exo__Asset_label'] || reference,
        commandType: this.mapCommandToType(fm['ui__Button_command']),
        tooltip: fm['ui__Button_tooltip'] || '',
        style: fm['ui__Button_style'] || 'default',
        commandArgs: fm['ui__Button_commandArgs'] || {},
      };
    } catch (error) {
      this.logger.error(`Failed to load button reference: ${reference}`, { error });
      return null;
    }
  }

  /**
   * Map command string to CommandType enum
   */
  private mapCommandToType(command: string): string {
    const commandMap: Record<string, string> = {
      'exocortex:create-asset': 'CREATE_ASSET',
      'exocortex:create-child-task': 'CREATE_CHILD_TASK',
      'exocortex:create-child-area': 'CREATE_CHILD_AREA',
      'exocortex:open-asset': 'OPEN_ASSET',
      'exocortex:delete-asset': 'DELETE_ASSET',
    };
    
    return commandMap[command] || 'CUSTOM';
  }

  /**
   * Parse the YAML-like configuration for buttons
   */
  private parseButtonsConfig(content: string): any {
    const lines = content.trim().split('\n');
    
    let config: any = {};
    let currentSection = '';
    let inButtonsArray = false;
    let currentButton: any = {};
    let buttons: any[] = [];

    for (let i = 0; i < lines.length; i++) {
      const originalLine = lines[i];
      const line = originalLine.trim();
      
      // Skip empty lines and comments
      if (!line || line.startsWith('#')) continue;

      // Skip the view type line
      if (line.startsWith('view:')) continue;

      // Handle config section
      if (line === 'config:') {
        currentSection = 'config';
        continue;
      }

      // Handle buttons array
      if (line === 'buttons:') {
        inButtonsArray = true;
        buttons = [];
        continue;
      }
      
      // Handle empty buttons array syntax: "buttons: []"
      if (line.startsWith('buttons:')) {
        const match = line.match(/^buttons:\s*\[\s*\]$/);
        if (match) {
          config.buttons = [];
          return config; // Early return for empty array
        } else {
          inButtonsArray = true;
          buttons = [];
        }
        continue;
      }

      // Handle button items
      if (inButtonsArray && line.startsWith('- ')) {
        // Save previous button if exists
        if (Object.keys(currentButton).length > 0) {
          buttons.push(currentButton);
        }
        currentButton = {};
        
        // Parse the first property if it's on the same line as the dash
        const propertyMatch = line.match(/^-\s+(\w+):\s*(.+)$/);
        if (propertyMatch) {
          const [, key, value] = propertyMatch;
          currentButton[key] = this.parseValue(value);
        }
        // If the line is just "- " without a property, we'll collect properties on subsequent lines
        continue;
      }

      // Handle continuation of button properties
      // Check if the original line has indentation and we're in a buttons array
      if (inButtonsArray && originalLine.match(/^\s+\w+:/) && !line.startsWith('- ')) {
        const propertyMatch = line.match(/^(\w+):\s*(.+)$/);
        if (propertyMatch) {
          const [, key, value] = propertyMatch;
          currentButton[key] = this.parseValue(value);
        }
        continue;
      }

      // Handle other config properties
      if (currentSection === 'config' && !inButtonsArray) {
        const propertyMatch = line.match(/^(\w+):\s*(.+)$/);
        if (propertyMatch) {
          const [, key, value] = propertyMatch;
          config[key] = this.parseValue(value);
        }
      }
    }

    // Don't forget the last button
    if (Object.keys(currentButton).length > 0) {
      buttons.push(currentButton);
    }

    // Set the buttons array (even if empty)
    if (inButtonsArray) {
      config.buttons = buttons;
    }
    

    return config;
  }

  /**
   * Parse a string value, removing quotes and handling basic types
   */
  private parseValue(value: string): any {
    // Remove quotes if present
    const trimmed = value.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }

    // Try to parse as boolean
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;

    // Try to parse as number
    if (/^\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }

    // Return as string
    return trimmed;
  }

  /**
   * Get the current file from the context
   */
  private getCurrentFile(ctx: MarkdownPostProcessorContext): TFile | null {
    if (!ctx.sourcePath) return null;
    
    return this.app.vault.getAbstractFileByPath(ctx.sourcePath) as TFile;
  }

  /**
   * Get frontmatter from the file
   */
  private getFrontmatter(file: TFile | null): any {
    if (!file) return {};

    const cache = this.app.metadataCache.getFileCache(file);
    return cache?.frontmatter || {};
  }
}