import { App, TFile } from "obsidian";
import {
  RelationPropertiesBlockConfig,
  PropertyDisplayConfig,
} from "../../domain/entities/LayoutBlock";

interface RelatedAsset {
  file: TFile;
  frontmatter: Record<string, any>;
  referencingProperty?: string;
}

export class RelationPropertiesBlockRenderer {
  constructor(private app: App) {}

  async render(
    container: HTMLElement,
    config: RelationPropertiesBlockConfig,
    file: TFile,
    dv: any,
  ): Promise<void> {
    try {
      const relatedAssets = await this.getRelatedAssets(file, config);

      if (relatedAssets.length === 0) {
        container.createEl("p", {
          text: "No related assets found",
          cls: "exocortex-empty",
        });
        return;
      }

      const filteredAssets = this.filterByClass(
        relatedAssets,
        config.targetClass,
      );
      const sortedAssets = this.sortAssets(filteredAssets, config);
      const limitedAssets = config.maxResults
        ? sortedAssets.slice(0, config.maxResults)
        : sortedAssets;

      if (config.groupByProperty) {
        await this.renderGroupedProperties(container, limitedAssets, config);
      } else if (config.tableFormat) {
        await this.renderPropertyTable(container, limitedAssets, config);
      } else {
        await this.renderPropertyList(container, limitedAssets, config);
      }

      if (config.maxResults && sortedAssets.length > config.maxResults) {
        container.createEl("p", {
          text: `Showing ${config.maxResults} of ${sortedAssets.length} results`,
          cls: "exocortex-results-info",
        });
      }
    } catch (error) {
      console.error("Error rendering relation properties block:", error);
      container.createEl("p", {
        text: "Error rendering relation properties",
        cls: "exocortex-error",
      });
    }
  }

  private async getRelatedAssets(
    file: TFile,
    config: RelationPropertiesBlockConfig,
  ): Promise<RelatedAsset[]> {
    const backlinks = (this.app.metadataCache as any).getBacklinksForFile(file);
    const relatedAssets: RelatedAsset[] = [];

    if (!backlinks?.data) return relatedAssets;

    for (const [path] of backlinks.data) {
      const backlinkFile = this.app.vault.getAbstractFileByPath(path) as TFile;
      if (backlinkFile?.path) {
        const metadata = this.app.metadataCache.getFileCache(backlinkFile);
        if (metadata?.frontmatter) {
          const referencingProperty = this.findReferencingProperty(
            metadata.frontmatter,
            file,
          );
          relatedAssets.push({
            file: backlinkFile,
            frontmatter: metadata.frontmatter,
            referencingProperty,
          });
        }
      }
    }

    return relatedAssets;
  }

  private findReferencingProperty(
    frontmatter: Record<string, any>,
    targetFile: TFile,
  ): string | undefined {
    const targetBasename = targetFile.basename;
    const targetPath = targetFile.path;

    for (const [key, value] of Object.entries(frontmatter)) {
      if (!value) continue;

      const valueStr = Array.isArray(value) ? value.join(" ") : String(value);

      if (
        valueStr.includes(`[[${targetBasename}]]`) ||
        valueStr.includes(`[[${targetPath}]]`) ||
        valueStr.includes(`[[${targetPath.replace(".md", "")}]]`) ||
        valueStr.includes(`[[${targetBasename}|`) ||
        valueStr.includes(`[[${targetPath}|`) ||
        valueStr.includes(`[[${targetPath.replace(".md", "")}|`)
      ) {
        return key;
      }
    }

    return undefined;
  }

  private filterByClass(
    assets: RelatedAsset[],
    targetClass?: string,
  ): RelatedAsset[] {
    if (!targetClass) return assets;

    return assets.filter((asset) => {
      const assetClass = asset.frontmatter["exo__Instance_class"];
      return (
        this.cleanClassName(assetClass) === this.cleanClassName(targetClass)
      );
    });
  }

  private sortAssets(
    assets: RelatedAsset[],
    config: RelationPropertiesBlockConfig,
  ): RelatedAsset[] {
    if (!config.sortBy) return assets;

    return [...assets].sort((a, b) => {
      const aValue = a.frontmatter[config.sortBy!.property];
      const bValue = b.frontmatter[config.sortBy!.property];

      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      const comparison = String(aValue).localeCompare(String(bValue));
      return config.sortBy!.direction === "desc" ? -comparison : comparison;
    });
  }

  private async renderPropertyTable(
    container: HTMLElement,
    assets: RelatedAsset[],
    config: RelationPropertiesBlockConfig,
  ): Promise<void> {
    const table = container.createEl("table", {
      cls: "exocortex-relation-properties-table",
    });

    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");

    if (config.showAssetName !== false) {
      headerRow.createEl("th", {
        text: "Asset",
        cls: "exocortex-table-header-asset",
      });
    }

    const visibleProperties = config.displayProperties.filter(
      (p) => p.isVisible,
    );

    visibleProperties.forEach((propConfig) => {
      const th = headerRow.createEl("th", {
        text:
          propConfig.displayLabel ||
          this.formatPropertyName(propConfig.propertyName),
        cls: "exocortex-table-header-property",
      });

      if (propConfig.columnWidth) {
        th.style.width = propConfig.columnWidth;
      }

      if (propConfig.alignment) {
        th.style.textAlign = propConfig.alignment;
      }
    });

    const tbody = table.createEl("tbody");

    assets.forEach((asset) => {
      const row = tbody.createEl("tr", { cls: "exocortex-property-row" });

      if (config.showAssetName !== false) {
        const assetCell = row.createEl("td", {
          cls: "exocortex-table-cell-asset",
        });

        const assetLabel =
          asset.frontmatter["exo__Asset_label"] || asset.file.basename;
        const link = assetCell.createEl("a", {
          text: assetLabel,
          href: asset.file.path,
          cls: "internal-link",
        });

        link.addEventListener("click", (e) => {
          e.preventDefault();
          this.app.workspace.openLinkText(asset.file.path, "", false);
        });

        if (config.showAssetClass) {
          const instanceClass = asset.frontmatter["exo__Instance_class"];
          if (instanceClass) {
            assetCell.createEl("div", {
              text: this.cleanClassName(instanceClass),
              cls: "exocortex-class-info-subtitle",
            });
          }
        }
      }

      visibleProperties.forEach((propConfig) => {
        const cell = row.createEl("td", {
          cls: "exocortex-table-cell-property",
        });

        if (propConfig.alignment) {
          cell.style.textAlign = propConfig.alignment;
        }

        const propertyValue = asset.frontmatter[propConfig.propertyName];
        this.renderPropertyValue(cell, propertyValue, propConfig);
      });
    });
  }

  private async renderPropertyList(
    container: HTMLElement,
    assets: RelatedAsset[],
    config: RelationPropertiesBlockConfig,
  ): Promise<void> {
    const listContainer = container.createEl("div", {
      cls: "exocortex-relation-properties-list",
    });

    assets.forEach((asset) => {
      const itemContainer = listContainer.createEl("div", {
        cls: "exocortex-property-list-item",
      });

      if (config.showAssetName !== false) {
        const assetLabel =
          asset.frontmatter["exo__Asset_label"] || asset.file.basename;
        const link = itemContainer.createEl("a", {
          text: assetLabel,
          href: asset.file.path,
          cls: "internal-link exocortex-property-list-asset",
        });

        link.addEventListener("click", (e) => {
          e.preventDefault();
          this.app.workspace.openLinkText(asset.file.path, "", false);
        });

        if (config.showAssetClass) {
          const instanceClass = asset.frontmatter["exo__Instance_class"];
          if (instanceClass) {
            itemContainer.createEl("span", {
              text: ` (${this.cleanClassName(instanceClass)})`,
              cls: "exocortex-class-info-inline",
            });
          }
        }
      }

      const propertiesContainer = itemContainer.createEl("div", {
        cls: "exocortex-property-list-properties",
      });

      const visibleProperties = config.displayProperties.filter(
        (p) => p.isVisible,
      );

      visibleProperties.forEach((propConfig) => {
        const propertyContainer = propertiesContainer.createEl("div", {
          cls: "exocortex-property-list-property",
        });

        propertyContainer.createEl("span", {
          text: `${propConfig.displayLabel || this.formatPropertyName(propConfig.propertyName)}: `,
          cls: "exocortex-property-label",
        });

        const valueContainer = propertyContainer.createEl("span", {
          cls: "exocortex-property-value",
        });

        const propertyValue = asset.frontmatter[propConfig.propertyName];
        this.renderPropertyValue(valueContainer, propertyValue, propConfig);
      });
    });
  }

  private async renderGroupedProperties(
    container: HTMLElement,
    assets: RelatedAsset[],
    config: RelationPropertiesBlockConfig,
  ): Promise<void> {
    if (!config.groupByProperty) return;

    const groups = new Map<string, RelatedAsset[]>();

    assets.forEach((asset) => {
      const groupValue =
        asset.frontmatter[config.groupByProperty!] || "Ungrouped";
      const groupKey = this.cleanClassName(groupValue);

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(asset);
    });

    const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );

    for (const [groupName, groupAssets] of sortedGroups) {
      const groupContainer = container.createEl("div", {
        cls: "exocortex-property-group",
      });

      groupContainer.createEl("h4", {
        text: groupName,
        cls: "exocortex-property-group-header",
      });

      if (config.tableFormat) {
        await this.renderPropertyTable(groupContainer, groupAssets, config);
      } else {
        await this.renderPropertyList(groupContainer, groupAssets, config);
      }
    }
  }

  private renderPropertyValue(
    container: HTMLElement,
    value: any,
    config: PropertyDisplayConfig,
  ): void {
    if (!value) {
      container.createEl("span", {
        text: "-",
        cls: "exocortex-property-empty",
      });
      return;
    }

    const displayValue = Array.isArray(value) ? value[0] : value;

    if (!displayValue) {
      container.createEl("span", {
        text: "-",
        cls: "exocortex-property-empty",
      });
      return;
    }

    switch (config.formatType) {
      case "status-badge":
        this.renderStatusBadge(container, displayValue);
        break;

      case "date":
        this.renderDate(container, displayValue);
        break;

      case "link":
        this.renderLink(container, displayValue);
        break;

      case "custom":
        if (config.customFormatter) {
          try {
            const formatted = new Function("value", config.customFormatter)(
              displayValue,
            );
            container.createEl("span", {
              text: String(formatted),
              cls: "exocortex-property-custom",
            });
          } catch (error) {
            console.error("Custom formatter error:", error);
            this.renderRaw(container, displayValue);
          }
        } else {
          this.renderRaw(container, displayValue);
        }
        break;

      case "raw":
      default:
        this.renderRaw(container, displayValue);
        break;
    }
  }

  private renderStatusBadge(container: HTMLElement, value: any): void {
    const cleanStatus = this.cleanClassName(value);
    const statusClass = cleanStatus.toLowerCase().replace(/\s+/g, "-");

    container.createEl("span", {
      text: cleanStatus || "Unknown",
      cls: `exocortex-status-badge exocortex-status-${statusClass}`,
    });
  }

  private renderDate(container: HTMLElement, value: any): void {
    try {
      const dateValue = new Date(value);
      if (!isNaN(dateValue.getTime())) {
        container.createEl("span", {
          text: dateValue.toLocaleDateString(),
          cls: "exocortex-property-date",
        });
      } else {
        this.renderRaw(container, value);
      }
    } catch {
      this.renderRaw(container, value);
    }
  }

  private renderLink(container: HTMLElement, value: any): void {
    const linkText = this.cleanClassName(value);
    const link = container.createEl("a", {
      text: linkText,
      href: linkText,
      cls: "internal-link exocortex-property-link",
    });

    link.addEventListener("click", (e) => {
      e.preventDefault();
      this.app.workspace.openLinkText(linkText, "", false);
    });
  }

  private renderRaw(container: HTMLElement, value: any): void {
    container.createEl("span", {
      text: String(value),
      cls: "exocortex-property-raw",
    });
  }

  private cleanClassName(className: any): string {
    if (!className) return "";
    const str = Array.isArray(className) ? className[0] : className;
    return str?.toString().replace(/\[\[|\]\]/g, "") || "";
  }

  private formatPropertyName(propertyName: string): string {
    return propertyName
      .replace(/_/g, " ")
      .replace(/^[a-z]+\s+/, "")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }
}
