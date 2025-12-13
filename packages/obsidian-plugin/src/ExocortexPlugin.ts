import "reflect-metadata";
import {
  MarkdownPostProcessorContext,
  MarkdownView,
  Notice,
  Plugin,
  TFile,
} from "obsidian";
import { container } from "tsyringe";
import { UniversalLayoutRenderer } from "./presentation/renderers/UniversalLayoutRenderer";
import { ILogger } from "./adapters/logging/ILogger";
import { LoggerFactory } from "./adapters/logging/LoggerFactory";
import { CommandManager } from "./application/services/CommandManager";
import {
  ExocortexSettings,
  DEFAULT_SETTINGS,
} from "./domain/settings/ExocortexSettings";
import { ExocortexSettingTab } from "./presentation/settings/ExocortexSettingTab";
import { TaskStatusService } from "@exocortex/core";
import { ObsidianVaultAdapter } from "./adapters/ObsidianVaultAdapter";
import { TaskTrackingService } from "./application/services/TaskTrackingService";
import { AliasSyncService } from "./application/services/AliasSyncService";
import { WikilinkAliasService } from "./application/services/WikilinkAliasService";
import { SPARQLCodeBlockProcessor } from "./application/processors/SPARQLCodeBlockProcessor";
import { SPARQLApi } from "./application/api/SPARQLApi";
import { PluginContainer } from "./infrastructure/di/PluginContainer";
import { createAliasIconExtension } from "./presentation/editor-extensions";
import { TimerManager } from "./infrastructure/timer";
import { LRUCache } from "./infrastructure/cache";

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
  private taskTrackingService!: TaskTrackingService;
  private aliasSyncService!: AliasSyncService;
  private wikilinkAliasService!: WikilinkAliasService;
  // Use LRU cache with max 1000 entries and 5-minute TTL to prevent unbounded memory growth
  // TTL ensures stale entries are evicted even if not accessed
  private metadataCache!: LRUCache<string, Record<string, unknown>>;
  vaultAdapter!: ObsidianVaultAdapter;
  private sparqlProcessor!: SPARQLCodeBlockProcessor;
  sparql!: SPARQLApi;
  settings!: ExocortexSettings;
  private timerManager!: TimerManager;

  override async onload(): Promise<void> {
    try {
      // Initialize DI container (Phase 1 infrastructure)
      PluginContainer.setup(this.app, this);

      this.logger = LoggerFactory.create("ExocortexPlugin");
      this.logger.info("Loading Exocortex Plugin");

      // Initialize timer manager for lifecycle-safe setTimeout/setInterval
      this.timerManager = new TimerManager();

      await this.loadSettings();

      this.vaultAdapter = new ObsidianVaultAdapter(
        this.app.vault,
        this.app.metadataCache,
        this.app,
      );
      this.layoutRenderer = new UniversalLayoutRenderer(
        this.app,
        this.settings,
        this,
        this.vaultAdapter,
      );
      this.taskStatusService = container.resolve(TaskStatusService);
      this.taskTrackingService = new TaskTrackingService(
        this.app,
        this.app.vault,
        this.app.metadataCache
      );
      this.aliasSyncService = new AliasSyncService(
        this.app.metadataCache,
        this.app
      );
      this.wikilinkAliasService = new WikilinkAliasService(
        this.app,
        this.app.metadataCache,
      );
      this.metadataCache = new LRUCache({
        maxEntries: 1000,
        ttl: 5 * 60 * 1000, // 5 minutes
      });
      this.sparqlProcessor = new SPARQLCodeBlockProcessor(this);
      this.sparql = new SPARQLApi(this);

      // Register the alias icon editor extension for Live Preview mode
      this.registerEditorExtension(
        createAliasIconExtension(
          this.app,
          this.app.metadataCache,
          this.wikilinkAliasService,
          (message: string) => new Notice(message),
        ),
      );

      // Initialize CommandManager and register all commands
      this.commandManager = new CommandManager(this.app);
      this.commandManager.registerAllCommands(this, () =>
        this.autoRenderLayout(),
      );

      this.addSettingTab(new ExocortexSettingTab(this.app, this));

      this.registerMarkdownCodeBlockProcessor(
        "sparql",
        (source, el, ctx) => this.sparqlProcessor.process(source, el, ctx)
      );

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

      this.registerEvent(
        this.app.vault.on("modify", (file) => {
          if (file instanceof TFile) {
            this.handleMetadataChange(file);
          }
        }),
      );

      // AutoLayout: Automatic rendering on file open
      // Using TimerManager for lifecycle-safe timers that are cleared on plugin unload
      this.registerEvent(
        this.app.workspace.on("file-open", (file) => {
          if (file) {
            this.timerManager.setTimeout("auto-layout-file-open", () => this.autoRenderLayout(), 150);
          }
        }),
      );

      this.registerEvent(
        this.app.workspace.on("active-leaf-change", () => {
          this.timerManager.setTimeout("auto-layout-leaf-change", () => this.autoRenderLayout(), 150);
        }),
      );

      this.registerEvent(
        this.app.workspace.on("layout-change", () => {
          this.timerManager.setTimeout("auto-layout-change", () => this.autoRenderLayout(), 150);
        }),
      );

      // Initial render
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile) {
        this.timerManager.setTimeout("auto-layout-initial", () => this.autoRenderLayout(), 150);
      }

      this.logger.info("Exocortex Plugin loaded successfully");
    } catch (error) {
      this.logger?.error("Failed to load Exocortex Plugin", error as Error);
      throw error;
    }
  }

  override async onunload(): Promise<void> {
    // Dispose timer manager first to prevent any more timer callbacks from firing
    if (this.timerManager) {
      this.timerManager.dispose();
    }

    this.removeAutoRenderedLayouts();

    // Cleanup SPARQL processor
    if (this.sparqlProcessor) {
      this.sparqlProcessor.cleanup();
    }

    if (this.sparql) {
      await this.sparql.dispose();
    }

    // Cleanup layout renderer (includes backlinks cache, metadata cache, etc.)
    if (this.layoutRenderer) {
      this.layoutRenderer.cleanup();
    }

    // Cleanup metadata cache
    if (this.metadataCache) {
      this.metadataCache.cleanup();
    }

    this.logger?.info("Exocortex Plugin unloaded");
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

  getSPARQLApi(): SPARQLApi | null {
    return this.sparql ?? null;
  }

  private autoRenderLayout(): void {
    // If layout is hidden by settings, remove existing and do not render
    if (!this.settings.layoutVisible) {
      this.removeAutoRenderedLayouts();
      return;
    }

    // Get the active MarkdownView using Obsidian API
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (!view) {
      // No active view - don't remove existing layout as this may be a transient state
      // (e.g., during embed loading when DOM is temporarily unstable)
      return;
    }

    // Only render in Reading Mode (Preview), not in Edit Mode (Source/Live Preview)
    // getMode() returns 'preview' for Reading Mode, 'source' for Edit Mode
    const mode = view.getMode();
    if (mode !== "preview") {
      // Not in preview mode - remove layout
      this.removeAutoRenderedLayouts();
      return;
    }

    // Get the container element from the view
    // Use containerEl which contains the entire view DOM
    const viewContainer = view.containerEl;

    if (!viewContainer) {
      // No view container - don't remove existing layout as this may be a transient state
      return;
    }

    // Find metadata container within the active view
    const metadataContainer = viewContainer.querySelector(
      ".metadata-container",
    ) as HTMLElement;

    // Fallback containers for notes that may not have a .metadata-container
    // This can happen when files have embedded assets (![[...]]) that cause
    // DOM restructuring, or when the Properties section is hidden in settings
    const markdownPreviewSizer = viewContainer.querySelector(
      ".markdown-preview-sizer",
    ) as HTMLElement;

    const markdownPreviewSection = viewContainer.querySelector(
      ".markdown-preview-section",
    ) as HTMLElement;

    // Determine the insertion strategy based on available containers
    let insertionParent: HTMLElement | null = null;
    let insertionStrategy: "afterend" | "afterbegin" = "afterend";
    let referenceElement: HTMLElement | null = null;

    if (metadataContainer) {
      // Primary: Insert after metadata container
      referenceElement = metadataContainer;
      insertionStrategy = "afterend";
    } else if (markdownPreviewSizer) {
      // Fallback 1: Insert at the beginning of markdown-preview-sizer
      // This places the layout at the top of the reading view content
      insertionParent = markdownPreviewSizer;
      insertionStrategy = "afterbegin";
    } else if (markdownPreviewSection) {
      // Fallback 2: Insert at the beginning of markdown-preview-section
      insertionParent = markdownPreviewSection;
      insertionStrategy = "afterbegin";
    } else {
      // No suitable container found - cannot render layout
      return;
    }

    // Check if layout already exists in the correct position
    if (referenceElement) {
      const existingLayout = referenceElement.nextElementSibling;
      if (existingLayout?.classList.contains("exocortex-auto-layout")) {
        // Layout already exists in correct position - no need to re-render
        return;
      }
    } else if (insertionParent) {
      const existingLayout = insertionParent.firstElementChild;
      if (existingLayout?.classList.contains("exocortex-auto-layout")) {
        // Layout already exists in correct position - no need to re-render
        return;
      }
    }

    // Now we're sure we can render - remove any existing layouts
    this.removeAutoRenderedLayouts();

    // Create layout container
    const layoutContainer = document.createElement("div");
    layoutContainer.className = "exocortex-auto-layout";
    layoutContainer.style.cssText = `
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--background-modifier-border);
    `;

    // Insert layout container using the determined strategy
    if (referenceElement) {
      referenceElement.insertAdjacentElement(insertionStrategy, layoutContainer);
    } else if (insertionParent) {
      insertionParent.insertAdjacentElement(insertionStrategy, layoutContainer);
    }

    // Render layout
    void (async () => {
      try {
        await this.layoutRenderer.render("", layoutContainer, {} as MarkdownPostProcessorContext);
      } catch (error) {
        this.logger.error("Failed to auto-render layout", error);
      }
    })();
  }

  private async handleMetadataChange(file: TFile): Promise<void> {
    try {
      const metadata = this.app.metadataCache.getFileCache(file)?.frontmatter;

      if (!metadata) {
        return;
      }

      // iOS Live Activities: Track status changes to DOING
      await this.taskTrackingService.handleFileChange(file);

      const currentAssetLabel = metadata.exo__Asset_label;
      const currentEndTimestamp = metadata.ems__Effort_endTimestamp;
      const currentPlannedStartTimestamp =
        metadata.ems__Effort_plannedStartTimestamp;
      const cachedMetadata = this.metadataCache.get(file.path);

      if (!cachedMetadata) {
        this.metadataCache.set(file.path, { ...metadata });
        return;
      }

      const previousAssetLabel = cachedMetadata.exo__Asset_label;
      const previousEndTimestamp = cachedMetadata.ems__Effort_endTimestamp;
      const previousPlannedStartTimestamp =
        cachedMetadata.ems__Effort_plannedStartTimestamp;

      if (currentEndTimestamp && currentEndTimestamp !== previousEndTimestamp) {
        this.logger.info(
          `Detected ems__Effort_endTimestamp change in ${file.path}: ${String(previousEndTimestamp)} → ${String(currentEndTimestamp)}`,
        );

        cachedMetadata.ems__Effort_endTimestamp = currentEndTimestamp;

        const parsedDate = new Date(currentEndTimestamp);
        if (!isNaN(parsedDate.getTime())) {
          await this.taskStatusService.syncEffortEndTimestamp(file, parsedDate);
          this.logger.info(
            `Auto-synced ems__Effort_resolutionTimestamp to ${currentEndTimestamp}`,
          );
        }
      }

      if (
        currentPlannedStartTimestamp &&
        currentPlannedStartTimestamp !== previousPlannedStartTimestamp
      ) {
        this.logger.info(
          `Detected ems__Effort_plannedStartTimestamp change in ${file.path}: ${String(previousPlannedStartTimestamp)} → ${String(currentPlannedStartTimestamp)}`,
        );

        cachedMetadata.ems__Effort_plannedStartTimestamp =
          currentPlannedStartTimestamp;

        const currentDate = new Date(
          String(currentPlannedStartTimestamp),
        );
        const previousDate = previousPlannedStartTimestamp
          ? new Date(String(previousPlannedStartTimestamp))
          : null;

        if (
          !isNaN(currentDate.getTime()) &&
          previousDate &&
          !isNaN(previousDate.getTime())
        ) {
          const deltaMs = currentDate.getTime() - previousDate.getTime();
          await this.taskStatusService.shiftPlannedEndTimestamp(file, deltaMs);
          this.logger.info(
            `Shifted ems__Effort_plannedEndTimestamp by ${deltaMs}ms`,
          );
        }
      }

      if (
        currentAssetLabel &&
        typeof currentAssetLabel === "string" &&
        currentAssetLabel !== previousAssetLabel
      ) {
        this.logger.info(
          `Detected exo__Asset_label change in ${file.path}: ${String(previousAssetLabel)} → ${currentAssetLabel}`,
        );

        cachedMetadata.exo__Asset_label = currentAssetLabel;

        await this.aliasSyncService.syncAliases(
          file,
          typeof previousAssetLabel === "string" ? previousAssetLabel : null,
          currentAssetLabel,
        );

        this.logger.info(
          `Auto-synced aliases for exo__Asset_label change`,
        );
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
