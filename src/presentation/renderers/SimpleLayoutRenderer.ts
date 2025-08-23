import { App, MarkdownPostProcessorContext, TFile } from "obsidian";

export class SimpleLayoutRenderer {
  constructor(private app: App) {}

  async render(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    // Get the current file
    const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
    if (!(file instanceof TFile)) {
      el.createEl("div", { text: "Error: Could not find current file" });
      return;
    }

    // Get frontmatter
    const metadata = this.app.metadataCache.getFileCache(file);
    if (!metadata?.frontmatter) {
      el.createEl("div", { text: "No frontmatter found" });
      return;
    }

    // Group related assets by relationship type
    const relatedAssets = await this.getRelatedAssets(file);
    
    // Create container
    const container = el.createEl("div", { cls: "exocortex-layout" });
    
    // Render title
    container.createEl("h2", { text: metadata.frontmatter.title || file.basename });
    
    // Render grouped assets
    for (const [relationshipType, assets] of Object.entries(relatedAssets)) {
      if (assets.length > 0) {
        const section = container.createEl("div", { cls: "relation-section" });
        section.createEl("h3", { text: relationshipType });
        
        const list = section.createEl("ul");
        for (const asset of assets) {
          const item = list.createEl("li");
          const link = item.createEl("a", {
            text: asset.name,
            cls: "internal-link",
          });
          link.addEventListener("click", () => {
            this.app.workspace.openLinkText(asset.path, ctx.sourcePath);
          });
        }
      }
    }
  }

  private async getRelatedAssets(file: TFile): Promise<Record<string, Array<{name: string, path: string}>>> {
    const result: Record<string, Array<{name: string, path: string}>> = {};
    const metadata = this.app.metadataCache.getFileCache(file);
    
    if (!metadata?.frontmatter) {
      return result;
    }

    // Get all files in vault
    const allFiles = this.app.vault.getMarkdownFiles();
    
    // Check each file for relationships to current file
    for (const otherFile of allFiles) {
      if (otherFile.path === file.path) continue;
      
      const otherMetadata = this.app.metadataCache.getFileCache(otherFile);
      if (!otherMetadata?.frontmatter) continue;
      
      // Check for relationships
      for (const [key, value] of Object.entries(otherMetadata.frontmatter)) {
        // Look for references to current file
        if (typeof value === "string" && value.includes(file.basename)) {
          // Use the property name as relationship type
          if (!result[key]) {
            result[key] = [];
          }
          result[key].push({
            name: otherFile.basename,
            path: otherFile.path,
          });
        } else if (Array.isArray(value) && value.some(v => typeof v === "string" && v.includes(file.basename))) {
          // Handle array properties
          if (!result[key]) {
            result[key] = [];
          }
          result[key].push({
            name: otherFile.basename,
            path: otherFile.path,
          });
        }
      }
    }
    
    return result;
  }
}