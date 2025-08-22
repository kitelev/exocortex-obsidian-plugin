import { App, TFile } from "obsidian";

/**
 * Common rendering utilities to eliminate duplication across renderers
 * Implements DRY principle for repeated DOM creation and data processing
 */
export class RenderingUtils {
  /**
   * Clean className by removing wiki link brackets and handling arrays
   */
  static cleanClassName(className: any): string {
    if (!className) return "";
    const str = Array.isArray(className) ? className[0] : className;
    return str?.toString().replace(/\[\[|\]\]/g, "") || "";
  }

  /**
   * Create empty state message with consistent styling
   */
  static createEmptyMessage(container: HTMLElement, message: string): void {
    container.createEl("p", {
      text: message,
      cls: "exocortex-empty",
    });
  }

  /**
   * Create count information display
   */
  static createCountInfo(
    container: HTMLElement,
    totalCount: number,
    displayCount: number,
    itemType: string,
    className?: string,
  ): void {
    const info = container.createDiv({ cls: className || "exocortex-info" });
    const suffix = totalCount !== 1 ? "s" : "";
    const showing =
      displayCount < totalCount ? `, showing ${displayCount}` : "";

    info.createEl("span", {
      text: `${totalCount} ${itemType}${suffix}${showing}`,
      cls: `exocortex-${itemType}-count`,
    });
  }

  /**
   * Create internal link element with consistent styling
   */
  static createInternalLink(
    container: HTMLElement,
    text: string,
    href: string,
    className?: string,
  ): HTMLElement {
    return container.createEl("a", {
      text,
      href,
      cls: `internal-link ${className || ""}`.trim(),
    });
  }

  /**
   * Extract frontmatter data with fallback
   */
  static extractFrontmatterData(
    app: App,
    file: TFile,
    key: string,
    fallback: any = null,
  ): any {
    const metadata = app.metadataCache.getFileCache(file);
    return metadata?.frontmatter?.[key] || fallback;
  }

  /**
   * Create table with header and consistent styling
   */
  static createTable(
    container: HTMLElement,
    headers: string[],
    className: string,
  ): {
    table: HTMLElement;
    thead: HTMLElement;
    tbody: HTMLElement;
  } {
    const table = container.createEl("table", { cls: className });
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");

    headers.forEach((header) => {
      headerRow.createEl("th", { text: header });
    });

    const tbody = table.createEl("tbody");

    return { table, thead, tbody };
  }

  /**
   * Create list with consistent styling
   */
  static createList(container: HTMLElement, className: string): HTMLElement {
    return container.createEl("ul", { cls: className });
  }

  /**
   * Group files by class with consistent logic
   */
  static groupFilesByClass(app: App, files: TFile[]): Map<string, TFile[]> {
    const groups = new Map<string, TFile[]>();

    files.forEach((file) => {
      const metadata = app.metadataCache.getFileCache(file);
      const instanceClass = metadata?.frontmatter?.["exo__Instance_class"];
      const className = this.cleanClassName(instanceClass) || "Unclassified";

      if (!groups.has(className)) {
        groups.set(className, []);
      }
      groups.get(className)!.push(file);
    });

    return groups;
  }

  /**
   * Sort groups by name consistently
   */
  static sortGroupsByName(groups: Map<string, TFile[]>): [string, TFile[]][] {
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }

  /**
   * Create group header with consistent styling
   */
  static createGroupHeader(
    container: HTMLElement,
    title: string,
    count: number,
    className: string,
  ): HTMLElement {
    return container.createEl("h4", {
      text: `${title} (${count})`,
      cls: className,
    });
  }

  /**
   * Apply result limit to files array
   */
  static applyResultLimit(files: TFile[], maxResults?: number): TFile[] {
    if (maxResults && maxResults > 0) {
      return files.slice(0, maxResults);
    }
    return files;
  }

  /**
   * Filter files by class with consistent logic
   */
  static filterFilesByClass(
    app: App,
    files: TFile[],
    targetClass?: string,
  ): TFile[] {
    if (!targetClass) return files;

    const cleanTargetClass = this.cleanClassName(targetClass);
    return files.filter((file) => {
      const metadata = app.metadataCache.getFileCache(file);
      const instanceClass = metadata?.frontmatter?.["exo__Instance_class"];
      return this.cleanClassName(instanceClass) === cleanTargetClass;
    });
  }

  /**
   * Get display label for file with fallback to basename
   */
  static getDisplayLabel(app: App, file: TFile): string {
    const metadata = app.metadataCache.getFileCache(file);
    return metadata?.frontmatter?.["exo__Asset_label"] || file.basename;
  }
}
