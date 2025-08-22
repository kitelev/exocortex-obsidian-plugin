import { App, TFile } from "obsidian";
import { DynamicBacklinksBlockConfig } from "../../domain/entities/LayoutBlock";
import {
  DynamicBacklinksService,
  PropertyBasedBacklink,
} from "../../application/services/DynamicBacklinksService";

export class DynamicBacklinksBlockRenderer {
  private dynamicBacklinksService: DynamicBacklinksService;

  constructor(private app: App) {
    this.dynamicBacklinksService = new DynamicBacklinksService(app);
  }

  async render(
    container: HTMLElement,
    config: DynamicBacklinksBlockConfig,
    file: TFile,
    dv: any,
  ): Promise<void> {
    // Discover property-based backlinks
    const backlinkResult =
      await this.dynamicBacklinksService.discoverPropertyBasedBacklinks(file, {
        excludeProperties: config.excludeProperties || [
          "exo__Asset_id",
          "exo__Instance_class",
        ],
        maxResultsPerProperty: config.maxResultsPerProperty,
        filterByClass: config.filterByClass,
      });

    if (backlinkResult.isFailure) {
      container.createEl("p", {
        text: `Error discovering backlinks: ${backlinkResult.getError()}`,
        cls: "exocortex-error",
      });
      return;
    }

    const propertyBacklinks = backlinkResult.getValue();

    if (propertyBacklinks.length === 0) {
      container.createEl("p", {
        text: "No property-based backlinks found",
        cls: "exocortex-empty",
      });
      return;
    }

    // Render each property group as a separate section
    for (const propertyGroup of propertyBacklinks) {
      if (
        !config.showEmptyProperties &&
        propertyGroup.referencingFiles.length === 0
      ) {
        continue;
      }

      await this.renderPropertyGroup(container, propertyGroup, config);
    }
  }

  private async renderPropertyGroup(
    container: HTMLElement,
    propertyGroup: PropertyBasedBacklink,
    config: DynamicBacklinksBlockConfig,
  ): Promise<void> {
    const groupContainer = container.createDiv({
      cls: "exocortex-dynamic-backlinks-group",
    });

    // Property header
    const header = groupContainer.createEl("h4", {
      text: `${this.formatPropertyName(propertyGroup.propertyName)} (${propertyGroup.referencingFiles.length})`,
      cls: "exocortex-property-backlinks-header",
    });

    if (propertyGroup.referencingFiles.length === 0) {
      groupContainer.createEl("p", {
        text: "No files reference this asset via this property",
        cls: "exocortex-empty",
      });
      return;
    }

    // Render backlinks list
    const list = groupContainer.createEl("ul", {
      cls: "exocortex-property-backlinks-list",
    });

    for (const backlinkFile of propertyGroup.referencingFiles) {
      await this.renderBacklinkItem(list, backlinkFile);
    }
  }

  private async renderBacklinkItem(
    list: HTMLElement,
    file: TFile,
  ): Promise<void> {
    const metadata = this.app.metadataCache.getFileCache(file);
    const frontmatter = metadata?.frontmatter || {};

    const item = list.createEl("li", { cls: "exocortex-backlink-item" });

    // File link
    const link = item.createEl("a", {
      text: frontmatter["exo__Asset_label"] || file.basename,
      href: file.path,
      cls: "internal-link",
    });

    // Class info (if available)
    const instanceClass = frontmatter["exo__Instance_class"];
    if (instanceClass) {
      const classSpan = item.createEl("span", {
        text: ` (${this.cleanClassName(instanceClass)})`,
        cls: "exocortex-class-info",
      });
    }

    // File path (for disambiguation)
    if (file.path !== `${file.basename}.md`) {
      const pathSpan = item.createEl("span", {
        text: ` - ${file.path}`,
        cls: "exocortex-path-info",
      });
    }
  }

  private formatPropertyName(propertyName: string): string {
    // Convert property names to more readable format
    return propertyName
      .replace(/^ems__/, "") // Remove ems__ prefix
      .replace(/^exo__/, "") // Remove exo__ prefix
      .replace(/_/g, " ") // Replace underscores with spaces
      .replace(/\b\w/g, (l) => l.toUpperCase()); // Capitalize words
  }

  private cleanClassName(className: any): string {
    if (!className) return "";
    const str = Array.isArray(className) ? className[0] : className;
    return str?.toString().replace(/\[\[|\]\]/g, "") || "";
  }
}
