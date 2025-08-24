import { App, TFile } from "obsidian";
import { SimplifiedLayoutBlock } from "../../domain/entities/SimplifiedLayoutBlock";

interface RelatedAsset {
  file: TFile;
  frontmatter: Record<string, any>;
}

export class SimplifiedRelationPropertiesRenderer {
  constructor(private app: App) {}

  async render(
    container: HTMLElement,
    layoutBlock: SimplifiedLayoutBlock,
    file: TFile,
  ): Promise<void> {
    try {
      // Get related assets (backlinks)
      const relatedAssets = await this.getRelatedAssets(
        file,
        layoutBlock.targetClass,
      );

      if (relatedAssets.length === 0) {
        container.createEl("p", {
          text: "No related assets found",
          cls: "exocortex-empty",
        });
        return;
      }

      // Render simple table
      this.renderTable(container, relatedAssets, layoutBlock);
    } catch (error) {
      console.error("Error rendering simplified relation properties:", error);
      container.createEl("p", {
        text: "Error displaying properties",
        cls: "exocortex-error",
      });
    }
  }

  private async getRelatedAssets(
    file: TFile,
    targetClass?: string,
  ): Promise<RelatedAsset[]> {
    const backlinks = (this.app.metadataCache as any).getBacklinksForFile(file);
    const relatedAssets: RelatedAsset[] = [];

    if (!backlinks?.data) return relatedAssets;

    for (const [path] of backlinks.data) {
      const backlinkFile = this.app.vault.getAbstractFileByPath(path) as TFile;
      if (backlinkFile?.path) {
        const metadata = this.app.metadataCache.getFileCache(backlinkFile);
        if (metadata?.frontmatter) {
          // Filter by target class if specified
          if (targetClass) {
            const assetClass = metadata.frontmatter["exo__Instance_class"];
            if (this.cleanValue(assetClass) !== this.cleanValue(targetClass)) {
              continue;
            }
          }

          relatedAssets.push({
            file: backlinkFile,
            frontmatter: metadata.frontmatter,
          });
        }
      }
    }

    return relatedAssets;
  }

  private renderTable(
    container: HTMLElement,
    assets: RelatedAsset[],
    layoutBlock: SimplifiedLayoutBlock,
  ): void {
    const table = container.createEl("table", {
      cls: "exocortex-simplified-table",
    });

    // Create header
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");

    // Always show asset name as first column
    headerRow.createEl("th", {
      text: "Asset",
      cls: "exocortex-table-header",
    });

    // Add columns for each configured property
    const propertyNames = layoutBlock.getPropertyNames();
    propertyNames.forEach((propName) => {
      headerRow.createEl("th", {
        text: this.formatPropertyLabel(propName),
        cls: "exocortex-table-header",
      });
    });

    // Create body
    const tbody = table.createEl("tbody");

    assets.forEach((asset) => {
      const row = tbody.createEl("tr", {
        cls: "exocortex-table-row",
      });

      // Asset name/label cell
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

      // Property cells
      propertyNames.forEach((propName) => {
        const cell = row.createEl("td", {
          cls: "exocortex-table-cell",
        });

        const value = asset.frontmatter[propName];
        const formatType = layoutBlock.inferFormatType(propName);

        this.renderPropertyValue(cell, value, formatType);
      });
    });
  }

  private renderPropertyValue(
    container: HTMLElement,
    value: any,
    formatType: string,
  ): void {
    if (!value) {
      container.createEl("span", {
        text: "-",
        cls: "exocortex-empty-value",
      });
      return;
    }

    const displayValue = Array.isArray(value) ? value[0] : value;

    switch (formatType) {
      case "status-badge": {
        const cleanStatus = this.cleanValue(displayValue);
        const statusClass = this.getStatusClass(cleanStatus);
        container.createEl("span", {
          text: cleanStatus,
          cls: `exocortex-status-badge ${statusClass}`,
        });
        break;
      }

      case "date": {
        try {
          const date = new Date(displayValue);
          if (!isNaN(date.getTime())) {
            container.createEl("span", {
              text: date.toLocaleDateString(),
              cls: "exocortex-date-value",
            });
          } else {
            container.createEl("span", {
              text: String(displayValue),
            });
          }
        } catch {
          container.createEl("span", {
            text: String(displayValue),
          });
        }
        break;
      }

      case "link": {
        const linkText = this.cleanValue(displayValue);
        const link = container.createEl("a", {
          text: linkText,
          href: linkText,
          cls: "internal-link",
        });

        link.addEventListener("click", (e) => {
          e.preventDefault();
          this.app.workspace.openLinkText(linkText, "", false);
        });
        break;
      }

      default:
        container.createEl("span", {
          text: this.cleanValue(displayValue),
        });
        break;
    }
  }

  private cleanValue(value: any): string {
    if (!value) return "";
    const str = Array.isArray(value) ? value[0] : value;
    return str?.toString().replace(/\[\[|\]\]/g, "") || "";
  }

  private formatPropertyLabel(propertyName: string): string {
    // Remove namespace prefix and format
    return propertyName
      .replace(/^[a-z]+__/, "") // Remove namespace
      .replace(/_/g, " ") // Replace underscores with spaces
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  private getStatusClass(status: string): string {
    const lowerStatus = status.toLowerCase();

    if (["completed", "done", "success"].includes(lowerStatus)) {
      return "exocortex-status-green";
    }

    if (["in-progress", "active", "running"].includes(lowerStatus)) {
      return "exocortex-status-yellow";
    }

    if (["blocked", "failed", "error"].includes(lowerStatus)) {
      return "exocortex-status-red";
    }

    if (["pending", "waiting", "todo"].includes(lowerStatus)) {
      return "exocortex-status-blue";
    }

    return "exocortex-status-default";
  }
}
