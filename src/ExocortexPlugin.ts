import {
  MarkdownPostProcessorContext,
  MarkdownView,
  Plugin,
  TFile,
  WorkspaceLeaf,
} from "obsidian";
import { UniversalLayoutRenderer } from "./presentation/renderers/UniversalLayoutRenderer";
import { ILogger } from "./infrastructure/logging/ILogger";
import { LoggerFactory } from "./infrastructure/logging/LoggerFactory";
import { CommandManager } from "./application/services/CommandManager";
import {
  ExocortexSettings,
  DEFAULT_SETTINGS,
} from "./domain/settings/ExocortexSettings";
import { ExocortexSettingTab } from "./presentation/settings/ExocortexSettingTab";
import { TaskStatusService } from "./infrastructure/services/TaskStatusService";
import { ExocortexGraphView, GRAPH_VIEW_TYPE } from "./presentation/views/ExocortexGraphView";

/**
 * Exocortex Plugin - Automatic layout rendering
 * Automatically displays related assets table in all notes (below metadata in reading mode)
 * Provides Command Palette integration for all asset commands
 */
export default class ExocortexPlugin extends Plugin {
  private logger!: ILogger;
  private layoutRenderer!: UniversalLayoutRenderer;
  private commandManager!: CommandManager;
  private taskStatusService!: TaskStatusService;
  private metadataCache!: Map<string, Record<string, unknown>>;
  settings!: ExocortexSettings;

  async onload(): Promise<void> {
    try {
      this.logger = LoggerFactory.create("ExocortexPlugin");
      this.logger.info("Loading Exocortex Plugin");

      await this.loadSettings();

      this.layoutRenderer = new UniversalLayoutRenderer(this.app, this.settings, this);
      this.taskStatusService = new TaskStatusService(this.app.vault);
      this.metadataCache = new Map();

      // Initialize CommandManager and register all commands
      this.commandManager = new CommandManager(this.app);
      this.commandManager.registerAllCommands(
        this,
        () => this.autoRenderLayout(),
      );

      this.addSettingTab(new ExocortexSettingTab(this.app, this));

      this.registerView(
        GRAPH_VIEW_TYPE,
        (leaf) => new ExocortexGraphView(leaf, this)
      );

      this.addRibbonIcon("git-fork", "Open exocortex graph", () => {
        this.activateGraphView();
      });

      this.addCommand({
        id: "open-graph-view",
        name: "Open graph",
        callback: () => {
          this.activateGraphView();
        },
      });

      this.registerEvent(
        this.app.metadataCache.on("resolved", () => {
          this.layoutRenderer.invalidateBacklinksCache();
        }),
      );

      this.registerEvent(
        this.app.metadataCache.on("changed", (file) => {
          this.handleMetadataChange(file);
        }),
      );

      // AutoLayout: Automatic rendering on file open
      this.registerEvent(
        this.app.workspace.on("file-open", (file) => {
          if (file) {
            setTimeout(() => this.autoRenderLayout(), 150);
          }
        }),
      );

      this.registerEvent(
        this.app.workspace.on("active-leaf-change", () => {
          setTimeout(() => this.autoRenderLayout(), 150);
        }),
      );

      this.registerEvent(
        this.app.workspace.on("layout-change", () => {
          setTimeout(() => this.autoRenderLayout(), 150);
        }),
      );

      // Initial render
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile) {
        setTimeout(() => this.autoRenderLayout(), 150);
      }

      this.logger.info("Exocortex Plugin loaded successfully");
    } catch (error) {
      this.logger?.error("Failed to load Exocortex Plugin", error as Error);
      throw error;
    }
  }

  async onunload(): Promise<void> {
    this.removeAutoRenderedLayouts();
    
    this.logger?.info("Exocortex Plugin unloaded");
  }

  async activateGraphView(): Promise<void> {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(GRAPH_VIEW_TYPE);

    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({
        type: GRAPH_VIEW_TYPE,
        active: true,
      });
    }

    workspace.revealLeaf(leaf);
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  refreshLayout(): void {
    this.autoRenderLayout();
  }

  private autoRenderLayout(): void {
    // Remove existing auto-rendered layouts
    this.removeAutoRenderedLayouts();

    // If layout is hidden by settings, do not render
    if (!this.settings.layoutVisible) {
      return;
    }

    // Get the active MarkdownView using Obsidian API
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (!view) {
      return;
    }

    // Get the container element from the view
    // Use containerEl which contains the entire view DOM
    const viewContainer = view.containerEl;

    if (!viewContainer) {
      return;
    }

    // Find metadata container within the active view
    const metadataContainer = viewContainer.querySelector(
      ".metadata-container",
    ) as HTMLElement;

    if (!metadataContainer) {
      return;
    }

    // Create layout container
    const layoutContainer = document.createElement("div");
    layoutContainer.className = "exocortex-auto-layout";
    layoutContainer.style.cssText = `
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--background-modifier-border);
    `;

    // Insert after metadata container using insertAdjacentElement
    // This ensures it always goes right after the metadata, not before
    metadataContainer.insertAdjacentElement("afterend", layoutContainer);

    // Render layout
    this.layoutRenderer
      .render("", layoutContainer, {} as MarkdownPostProcessorContext)
      .catch((error) => {
        this.logger.error("Failed to auto-render layout", error);
      });
  }

  private async handleMetadataChange(file: TFile): Promise<void> {
    try {
      const metadata = this.app.metadataCache.getFileCache(file)?.frontmatter;

      if (!metadata) {
        return;
      }

      const currentEndTimestamp = metadata.ems__Effort_endTimestamp;
      const cachedMetadata = this.metadataCache.get(file.path);

      if (!cachedMetadata) {
        this.metadataCache.set(file.path, { ...metadata });
        return;
      }

      const previousEndTimestamp = cachedMetadata.ems__Effort_endTimestamp;

      if (
        currentEndTimestamp &&
        currentEndTimestamp !== previousEndTimestamp
      ) {
        this.logger.info(
          `Detected ems__Effort_endTimestamp change in ${file.path}: ${String(previousEndTimestamp)} → ${String(currentEndTimestamp)}`,
        );

        const parsedDate = new Date(currentEndTimestamp);
        if (!isNaN(parsedDate.getTime())) {
          await this.taskStatusService.syncEffortEndTimestamp(
            file,
            parsedDate,
          );
          this.logger.info(
            `Auto-synced ems__Effort_resolutionTimestamp to ${currentEndTimestamp}`,
          );
        }
      }

      this.metadataCache.set(file.path, { ...metadata });
    } catch (error) {
      this.logger.error(
        `Failed to handle metadata change for ${file.path}`,
        error as Error,
      );
    }
  }

  private removeAutoRenderedLayouts(): void {
    document
      .querySelectorAll(".exocortex-auto-layout")
      .forEach((el) => el.remove());
  }
}
