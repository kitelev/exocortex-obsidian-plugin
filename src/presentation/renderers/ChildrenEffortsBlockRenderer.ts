import { App, TFile } from "obsidian";
import { ChildrenEffortsBlockConfig } from "../../domain/entities/LayoutBlockStubs";

export class ChildrenEffortsBlockRenderer {
  constructor(private app: App) {}

  async render(
    container: HTMLElement,
    config: any,
    file: TFile,
    dv: any,
  ): Promise<void> {
    const childrenConfig = config as ChildrenEffortsBlockConfig;

    // Get all backlinks for current file
    const backlinks = (this.app.metadataCache as any).getBacklinksForFile(file);

    if (!backlinks || !backlinks.data || backlinks.data.size === 0) {
      container.createEl("p", {
        text: "No children efforts found",
        cls: "exocortex-empty",
      });
      return;
    }

    // Convert backlinks to file array and filter for ems__Effort_parent relationships
    let childrenFiles: TFile[] = [];
    for (const [path] of backlinks.data) {
      const backlinkFile = this.app.vault.getAbstractFileByPath(path);
      if (backlinkFile && backlinkFile.path) {
        const tFile = backlinkFile as TFile;
        // Check if this file references current file via ems__Effort_parent
        if (this.isChildEffort(tFile, file)) {
          childrenFiles.push(tFile);
        }
      }
    }

    // Filter by class if specified
    if (childrenConfig.filterByClass) {
      const targetClass = this.cleanClassName(childrenConfig.filterByClass);
      childrenFiles = childrenFiles.filter((f) => {
        const metadata = this.app.metadataCache.getFileCache(f);
        const instanceClass = metadata?.frontmatter?.["exo__Instance_class"];
        return this.cleanClassName(instanceClass) === targetClass;
      });
    }

    // Limit results if specified
    const totalCount = childrenFiles.length;
    if (childrenConfig.maxResults && childrenConfig.maxResults > 0) {
      childrenFiles = childrenFiles.slice(0, childrenConfig.maxResults);
    }

    // Show count
    const info = container.createDiv({
      cls: "exocortex-children-efforts-info",
    });
    info.createEl("span", {
      text: `${totalCount} child effort${totalCount !== 1 ? "s" : ""}${childrenFiles.length < totalCount ? `, showing ${childrenFiles.length}` : ""} (table view)`,
      cls: "exocortex-children-efforts-count",
    });

    if (childrenFiles.length === 0) {
      container.createEl("p", {
        text: "No matching child efforts found",
        cls: "exocortex-empty",
      });
      return;
    }

    // Group by class if specified
    if (childrenConfig.groupByClass) {
      this.renderGroupedChildrenEfforts(
        container,
        childrenFiles,
        childrenConfig,
      );
    } else {
      this.renderFlatChildrenEfforts(container, childrenFiles, childrenConfig);
    }
  }

  private isChildEffort(childFile: TFile, parentFile: TFile): boolean {
    const metadata = this.app.metadataCache.getFileCache(childFile);
    const frontmatter = metadata?.frontmatter;

    if (!frontmatter) return false;

    const effortParent = frontmatter["ems__Effort_parent"];
    if (!effortParent) return false;

    // Handle both string and array formats
    const parentRefs = Array.isArray(effortParent)
      ? effortParent
      : [effortParent];

    // Check if any parent reference matches our current file
    return parentRefs.some((ref) => {
      const cleanRef = this.cleanClassName(ref);
      const parentName = parentFile.basename.replace(/\.md$/, "");

      // Match against various possible reference formats
      return (
        cleanRef === parentName ||
        cleanRef === parentFile.basename ||
        cleanRef === parentFile.path ||
        cleanRef === parentFile.path.replace(/\.md$/, "") ||
        // Also check if the reference contains the parent name (for partial matches)
        ref.includes(`[[${parentName}]]`) ||
        ref.includes(parentName)
      );
    });
  }

  private renderFlatChildrenEfforts(
    container: HTMLElement,
    files: TFile[],
    config: ChildrenEffortsBlockConfig,
  ): void {
    const table = container.createEl("table", {
      cls: "exocortex-children-efforts-table",
    });

    // Create table header
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    headerRow.createEl("th", {
      text: "Asset Name",
      cls: "exocortex-table-header-asset",
    });
    headerRow.createEl("th", {
      text: "Status",
      cls: "exocortex-table-header-status",
    });

    // Add parent path header if enabled
    if (config.showParentPath) {
      headerRow.createEl("th", {
        text: "Parent",
        cls: "exocortex-table-header-parent",
      });
    }

    // Create table body
    const tbody = table.createEl("tbody");

    files.forEach((file) => {
      const metadata = this.app.metadataCache.getFileCache(file);
      const frontmatter = metadata?.frontmatter || {};

      const row = tbody.createEl("tr", { cls: "exocortex-efforts-row" });

      // Asset Name column
      const assetCell = row.createEl("td", {
        cls: "exocortex-table-cell-asset",
      });
      const link = assetCell.createEl("a", {
        text: frontmatter["exo__Asset_label"] || file.basename,
        href: file.path,
        cls: "internal-link",
      });

      // Add class info as subtitle
      const instanceClass = frontmatter["exo__Instance_class"];
      if (instanceClass) {
        assetCell.createEl("div", {
          text: this.cleanClassName(instanceClass),
          cls: "exocortex-class-info-subtitle",
        });
      }

      // Status column
      const statusCell = row.createEl("td", {
        cls: "exocortex-table-cell-status",
      });
      const status = this.extractEffortStatus(frontmatter);
      statusCell.createEl("span", {
        text: status,
        cls:
          status === "Unknown"
            ? "exocortex-status-unknown"
            : "exocortex-status-known",
      });

      // Parent path column if enabled
      if (config.showParentPath) {
        const parentCell = row.createEl("td", {
          cls: "exocortex-table-cell-parent",
        });
        const effortParent = frontmatter["ems__Effort_parent"];
        if (effortParent) {
          const parentPath = Array.isArray(effortParent)
            ? effortParent[0]
            : effortParent;
          parentCell.createEl("span", {
            text: this.cleanClassName(parentPath),
            cls: "exocortex-parent-ref",
          });
        } else {
          parentCell.createEl("span", {
            text: "-",
            cls: "exocortex-parent-empty",
          });
        }
      }
    });
  }

  private renderGroupedChildrenEfforts(
    container: HTMLElement,
    files: TFile[],
    config: ChildrenEffortsBlockConfig,
  ): void {
    // Group files by class
    const groups = new Map<string, TFile[]>();

    files.forEach((file) => {
      const metadata = this.app.metadataCache.getFileCache(file);
      const instanceClass = metadata?.frontmatter?.["exo__Instance_class"];
      const className = this.cleanClassName(instanceClass) || "Unclassified";

      if (!groups.has(className)) {
        groups.set(className, []);
      }
      groups.get(className)!.push(file);
    });

    // Sort groups by name
    const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );

    // Render each group
    sortedGroups.forEach(([className, groupFiles]) => {
      const groupContainer = container.createDiv({
        cls: "exocortex-children-efforts-group",
      });

      // Group header
      groupContainer.createEl("h4", {
        text: `${className} (${groupFiles.length})`,
        cls: "children-efforts-group-header",
      });

      // Group table
      const table = groupContainer.createEl("table", {
        cls: "exocortex-children-efforts-table",
      });

      // Create table header
      const thead = table.createEl("thead");
      const headerRow = thead.createEl("tr");
      headerRow.createEl("th", {
        text: "Asset Name",
        cls: "exocortex-table-header-asset",
      });
      headerRow.createEl("th", {
        text: "Status",
        cls: "exocortex-table-header-status",
      });

      // Add parent path header if enabled
      if (config.showParentPath) {
        headerRow.createEl("th", {
          text: "Parent",
          cls: "exocortex-table-header-parent",
        });
      }

      // Create table body
      const tbody = table.createEl("tbody");

      groupFiles.forEach((file) => {
        const metadata = this.app.metadataCache.getFileCache(file);
        const frontmatter = metadata?.frontmatter || {};

        const row = tbody.createEl("tr", { cls: "exocortex-efforts-row" });

        // Asset Name column
        const assetCell = row.createEl("td", {
          cls: "exocortex-table-cell-asset",
        });
        assetCell.createEl("a", {
          text: frontmatter["exo__Asset_label"] || file.basename,
          href: file.path,
          cls: "internal-link",
        });

        // Status column
        const statusCell = row.createEl("td", {
          cls: "exocortex-table-cell-status",
        });
        const status = this.extractEffortStatus(frontmatter);
        statusCell.createEl("span", {
          text: status,
          cls:
            status === "Unknown"
              ? "exocortex-status-unknown"
              : "exocortex-status-known",
        });

        // Parent path column if enabled
        if (config.showParentPath) {
          const parentCell = row.createEl("td", {
            cls: "exocortex-table-cell-parent",
          });
          const effortParent = frontmatter["ems__Effort_parent"];
          if (effortParent) {
            const parentPath = Array.isArray(effortParent)
              ? effortParent[0]
              : effortParent;
            parentCell.createEl("span", {
              text: this.cleanClassName(parentPath),
              cls: "exocortex-parent-ref",
            });
          } else {
            parentCell.createEl("span", {
              text: "-",
              cls: "exocortex-parent-empty",
            });
          }
        }
      });
    });
  }

  private extractEffortStatus(frontmatter: Record<string, any>): string {
    const status = frontmatter["ems__Effort_status"];
    if (!status) return "Unknown";

    // Handle array format
    const statusValue = Array.isArray(status) ? status[0] : status;
    if (!statusValue) return "Unknown";

    // Clean up the status value - remove brackets and prefixes
    let cleanStatus = statusValue.toString().replace(/\[\[|\]\]/g, "");

    // Remove common prefixes like 'ems__EffortStatus'
    cleanStatus = cleanStatus.replace(/^ems__EffortStatus/i, "");

    // If we have a remaining value, use it, otherwise return 'Unknown'
    return cleanStatus.trim() || "Unknown";
  }

  private cleanClassName(className: any): string {
    if (!className) return "";
    const str = Array.isArray(className) ? className[0] : className;
    return str?.toString().replace(/\[\[|\]\]/g, "") || "";
  }
}
