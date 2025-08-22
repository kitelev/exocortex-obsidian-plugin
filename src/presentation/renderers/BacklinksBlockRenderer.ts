import { App, TFile } from "obsidian";
import { BacklinksBlockConfig } from "../../domain/entities/LayoutBlockStubs";
import { BaseRenderer } from "../../shared/BaseRenderer";
import { RenderingUtils } from "../../shared/utils/RenderingUtils";
import { CompatibilityWrapper } from "../../infrastructure/adapters/CompatibilityWrapper";

export class BacklinksBlockRenderer extends BaseRenderer {
  private app: App;
  
  constructor(app: App) {
    super(CompatibilityWrapper.wrapAppAsUIAdapter(app));
    this.app = app;
  }

  async render(
    container: HTMLElement,
    config: any,
    file: TFile,
    dv: any,
  ): Promise<void> {
    const backlinksConfig = config as BacklinksBlockConfig;
    
    const { totalFiles, filteredFiles, displayFiles } = await this.preprocess(
      container,
      config,
      file
    );

    if (totalFiles.length === 0) {
      this.renderEmptyState(container, "No backlinks found");
      return;
    }

    this.renderCountInfo(
      container,
      filteredFiles.length,
      displayFiles.length,
      "backlink"
    );

    if (displayFiles.length === 0) {
      this.renderEmptyState(container, "No matching backlinks found");
      return;
    }

    // Group by class if specified
    if (backlinksConfig.groupByClass) {
      this.renderGroupedFiles(container, displayFiles, config, "backlinks");
    } else {
      this.renderFlatFiles(container, displayFiles, config);
    }
  }

  protected getRelevantFiles(config: any, file: TFile): Promise<TFile[]> {
    const backlinks = (this.app.metadataCache as any).getBacklinksForFile(file);
    
    if (!backlinks || !backlinks.data || backlinks.data.size === 0) {
      return Promise.resolve([]);
    }

    const backlinkFiles: TFile[] = [];
    for (const [path] of backlinks.data) {
      const backlinkFile = this.app.vault.getAbstractFileByPath(path);
      if (backlinkFile && backlinkFile.path) {
        backlinkFiles.push(backlinkFile as TFile);
      }
    }

    return Promise.resolve(backlinkFiles);
  }

  protected getItemType(): string {
    return "backlink";
  }

  protected getTableHeaders(config: any): string[] {
    return ["Name", "Class"];
  }

  protected renderTableRow(row: HTMLElement, file: TFile, config: any): void {
    // Name column
    const nameCell = row.createEl("td", { cls: "exocortex-table-cell-name" });
    const displayLabel = this.getDisplayLabel(file);
    RenderingUtils.createInternalLink(nameCell, displayLabel, file.path);

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
  }

}
