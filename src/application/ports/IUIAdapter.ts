/**
 * Port interface for UI operations
 * Abstracts UI framework dependencies from application layer
 */
export interface IUIAdapter {
  /**
   * Get display label for a file
   */
  getDisplayLabel(file: any): string;

  /**
   * Extract frontmatter data from a file
   */
  extractFrontmatterData(file: any, key: string): any;

  /**
   * Create internal link in UI
   */
  createInternalLink(container: HTMLElement, text: string, path: string): void;

  /**
   * Create HTML element with styling
   */
  createElement(
    parent: HTMLElement,
    tag: string,
    options?: {
      cls?: string;
      text?: string;
      attrs?: Record<string, string>;
    }
  ): HTMLElement;

  /**
   * Clean CSS class names
   */
  cleanClassName(className: any): string;

  /**
   * Group files by class
   */
  groupFilesByClass(files: any[]): Map<string, any[]>;

  /**
   * Filter files by class
   */
  filterFilesByClass(files: any[], className?: string): any[];

  /**
   * Apply result limit to files
   */
  applyResultLimit(files: any[], limit?: number): any[];
}