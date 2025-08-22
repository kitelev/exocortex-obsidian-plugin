import { App, TFile } from "obsidian";
import { InstancesBlockConfig } from "../../domain/entities/LayoutBlockStubs";
import { BaseRenderer } from "../../shared/BaseRenderer";
import { RenderingUtils } from "../../shared/utils/RenderingUtils";
import { FileOperationUtils } from "../../shared/utils/FileOperationUtils";

export class InstancesBlockRenderer extends BaseRenderer {
  constructor(app: App) {
    super(app);
  }

  async render(
    container: HTMLElement,
    config: any,
    file: TFile,
    dv: any,
  ): Promise<void> {
    const instancesConfig = config as InstancesBlockConfig;
    
    const { totalFiles, filteredFiles, displayFiles } = await this.preprocess(
      container,
      config,
      file
    );

    if (totalFiles.length === 0) {
      this.renderEmptyState(container, "No instances found");
      return;
    }

    this.renderCountInfo(
      container,
      filteredFiles.length,
      displayFiles.length,
      "instance"
    );

    if (displayFiles.length === 0) {
      this.renderEmptyState(container, "No matching instances found");
      return;
    }

    // Group by class if specified
    if (instancesConfig.groupByClass) {
      this.renderGroupedFiles(container, displayFiles, config, "instances");
    } else {
      this.renderFlatFiles(container, displayFiles, config);
    }
  }

  protected getRelevantFiles(config: any, file: TFile): Promise<TFile[]> {
    const instancesConfig = config as InstancesBlockConfig;
    const targetProperty = instancesConfig.targetProperty || "exo__Instance_class";
    const currentAssetName = file.basename;
    const instanceFiles: TFile[] = [];

    // Get all files in the vault
    const allFiles = this.app.vault.getFiles();

    for (const otherFile of allFiles) {
      if (otherFile === file) continue; // Skip self

      const metadata = this.app.metadataCache.getFileCache(otherFile);
      const frontmatter = metadata?.frontmatter;

      if (!frontmatter) continue;

      const instanceClassValue = frontmatter[targetProperty];
      if (FileOperationUtils.isReferencingAsset(instanceClassValue, currentAssetName)) {
        instanceFiles.push(otherFile);
      }
    }

    return Promise.resolve(instanceFiles);
  }

  protected getItemType(): string {
    return "instance";
  }

  protected getTableHeaders(config: any): string[] {
    const headers = ["Instance Name"];
    if (config.showInstanceInfo) {
      headers.push("Class", "Description");
    }
    return headers;
  }

  // Keep the old method for backward compatibility with tests
  private isReferencingCurrentAsset(
    instanceClassValue: any,
    currentAssetName: string,
  ): boolean {
    return FileOperationUtils.isReferencingAsset(instanceClassValue, currentAssetName);
  }

  protected renderTableRow(row: HTMLElement, file: TFile, config: any): void {
    // Name column
    const nameCell = row.createEl("td", { cls: "exocortex-table-cell-name" });
    const displayLabel = this.getDisplayLabel(file);
    RenderingUtils.createInternalLink(nameCell, displayLabel, file.path);

    if (config.showInstanceInfo) {
      // Class column
      const classCell = row.createEl("td", { cls: "exocortex-table-cell-class" });
      const instanceClass = RenderingUtils.extractFrontmatterData(
        this.app,
        file,
        "exo__Instance_class"
      );
      if (instanceClass) {
        classCell.createEl("span", {
          text: this.cleanClassName(instanceClass),
          cls: "exocortex-class-ref",
        });
      } else {
        classCell.createEl("span", {
          text: "-",
          cls: "exocortex-class-empty",
        });
      }

      // Description column
      const descCell = row.createEl("td", { cls: "exocortex-table-cell-description" });
      const description = RenderingUtils.extractFrontmatterData(
        this.app,
        file,
        "exo__Asset_description"
      );
      if (description) {
        const truncated = description.length > 100
          ? description.substring(0, 100) + "..."
          : description;
        descCell.createEl("span", {
          text: truncated,
          cls: "exocortex-description-text",
        });
      } else {
        descCell.createEl("span", {
          text: "-",
          cls: "exocortex-description-empty",
        });
      }
    }
  }



}
