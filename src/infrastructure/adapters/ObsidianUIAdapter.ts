import { App, TFile } from "obsidian";
import { IUIAdapter } from "../../application/ports/IUIAdapter";

/**
 * Obsidian implementation of UI adapter
 */
export class ObsidianUIAdapter implements IUIAdapter {
  constructor(private app: App) {}

  getDisplayLabel(file: TFile): string {
    const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
    return frontmatter?.["exo__Asset_title"] || 
           frontmatter?.["title"] || 
           file.basename;
  }

  extractFrontmatterData(file: TFile, key: string): any {
    const cache = this.app.metadataCache.getFileCache(file);
    return cache?.frontmatter?.[key];
  }

  createInternalLink(container: HTMLElement, text: string, path: string): void {
    const link = container.createEl("a", {
      text,
      cls: "internal-link",
      href: `#`
    });
    
    link.addEventListener("click", (e) => {
      e.preventDefault();
      this.app.workspace.openLinkText(path, "", false);
    });
  }

  createElement(
    parent: HTMLElement,
    tag: string,
    options?: {
      cls?: string;
      text?: string;
      attrs?: Record<string, string>;
    }
  ): HTMLElement {
    const element = parent.createEl(tag as keyof HTMLElementTagNameMap, {
      cls: options?.cls,
      text: options?.text,
      attr: options?.attrs
    });
    return element;
  }

  cleanClassName(className: any): string {
    if (!className) return "";
    
    let clean = String(className);
    
    // Remove namespace prefixes
    if (clean.includes('#')) {
      clean = clean.split('#').pop() || clean;
    }
    
    // Replace underscores with spaces for display
    clean = clean.replace(/_/g, ' ');
    
    // Capitalize first letter of each word
    clean = clean.replace(/\b\w/g, l => l.toUpperCase());
    
    return clean;
  }

  groupFilesByClass(files: TFile[]): Map<string, TFile[]> {
    const groups = new Map<string, TFile[]>();
    
    files.forEach(file => {
      const className = this.extractFrontmatterData(file, "exo__Instance_class") || "Unclassified";
      const cleanName = this.cleanClassName(className);
      
      if (!groups.has(cleanName)) {
        groups.set(cleanName, []);
      }
      groups.get(cleanName)!.push(file);
    });
    
    return groups;
  }

  filterFilesByClass(files: TFile[], className?: string): TFile[] {
    if (!className) return files;
    
    return files.filter(file => {
      const fileClass = this.extractFrontmatterData(file, "exo__Instance_class");
      return this.cleanClassName(fileClass) === className;
    });
  }

  applyResultLimit(files: TFile[], limit?: number): TFile[] {
    return limit ? files.slice(0, limit) : files;
  }
}