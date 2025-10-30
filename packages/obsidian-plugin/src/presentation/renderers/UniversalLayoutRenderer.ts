import { MarkdownPostProcessorContext } from "obsidian";
import { ILogger } from "../../adapters/logging/ILogger";
import { LoggerFactory } from "../../adapters/logging/LoggerFactory";
import React from "react";
import { ReactRenderer } from "../utils/ReactRenderer";
import { ExocortexSettings } from "../../domain/settings/ExocortexSettings";
import { ActionButtonsGroup } from "../components/ActionButtonsGroup";
import { TaskCreationService } from "@exocortex/core";
import { ProjectCreationService } from "@exocortex/core";
import { AreaCreationService } from "@exocortex/core";
import { ConceptCreationService } from "@exocortex/core";
import { TaskStatusService } from "@exocortex/core";
import { PropertyCleanupService } from "@exocortex/core";
import { FolderRepairService } from "@exocortex/core";
import { RenameToUidService } from "@exocortex/core";
import { EffortVotingService } from "@exocortex/core";
import { LabelToAliasService } from "@exocortex/core";
import { AssetConversionService } from "@exocortex/core";
import { BacklinksCacheManager } from "../../adapters/caching/BacklinksCacheManager";
import { EventListenerManager } from "../../adapters/events/EventListenerManager";
import { MetadataExtractor } from "@exocortex/core";
import { ButtonGroupsBuilder } from "../builders/ButtonGroupsBuilder";
import { DailyTasksRenderer } from "./DailyTasksRenderer";
import { DailyProjectsRenderer } from "./DailyProjectsRenderer";
import { ObsidianVaultAdapter } from "../../adapters/ObsidianVaultAdapter";
import { PropertiesRenderer } from "./layout/PropertiesRenderer";
import { AreaTreeRenderer } from "./layout/AreaTreeRenderer";
import { RelationsRenderer, UniversalLayoutConfig } from "./layout/RelationsRenderer";
import { AssetMetadataService } from "./layout/helpers/AssetMetadataService";

type ObsidianApp = any;

export class UniversalLayoutRenderer {
  private logger: ILogger;
  private app: ObsidianApp;
  private settings: ExocortexSettings;
  private plugin: any;
  private eventListenerManager: EventListenerManager;
  private backlinksCacheManager: BacklinksCacheManager;
  private reactRenderer: ReactRenderer;
  private metadataExtractor: MetadataExtractor;
  private rootContainer: HTMLElement | null = null;
  private buttonGroupsBuilder: ButtonGroupsBuilder;
  private dailyTasksRenderer: DailyTasksRenderer;
  private dailyProjectsRenderer: DailyProjectsRenderer;
  private vaultAdapter: ObsidianVaultAdapter;
  private metadataService: AssetMetadataService;
  private propertiesRenderer: PropertiesRenderer;
  private areaTreeRenderer: AreaTreeRenderer;
  private relationsRenderer: RelationsRenderer;

  private taskCreationService: TaskCreationService;
  private projectCreationService: ProjectCreationService;
  private areaCreationService: AreaCreationService;
  private conceptCreationService: ConceptCreationService;
  private taskStatusService: TaskStatusService;
  private propertyCleanupService: PropertyCleanupService;
  private folderRepairService: FolderRepairService;
  private renameToUidService: RenameToUidService;
  private effortVotingService: EffortVotingService;
  private labelToAliasService: LabelToAliasService;
  private assetConversionService: AssetConversionService;

  constructor(app: ObsidianApp, settings: ExocortexSettings, plugin: any) {
    this.app = app;
    this.settings = settings;
    this.plugin = plugin;
    this.logger = LoggerFactory.create("UniversalLayoutRenderer");
    this.reactRenderer = new ReactRenderer();
    this.eventListenerManager = new EventListenerManager();
    this.backlinksCacheManager = new BacklinksCacheManager(this.app);
    this.vaultAdapter = new ObsidianVaultAdapter(
      this.app.vault,
      this.app.metadataCache,
      this.app,
    );
    this.metadataExtractor = new MetadataExtractor(this.vaultAdapter);
    this.taskCreationService = new TaskCreationService(this.vaultAdapter);
    this.projectCreationService = new ProjectCreationService(this.vaultAdapter);
    this.areaCreationService = new AreaCreationService(this.vaultAdapter);
    this.conceptCreationService = new ConceptCreationService(this.vaultAdapter);
    this.taskStatusService = new TaskStatusService(this.vaultAdapter);
    this.propertyCleanupService = new PropertyCleanupService(this.vaultAdapter);
    this.folderRepairService = new FolderRepairService(this.vaultAdapter);
    this.renameToUidService = new RenameToUidService(this.vaultAdapter);
    this.effortVotingService = new EffortVotingService(this.vaultAdapter);
    this.labelToAliasService = new LabelToAliasService(this.vaultAdapter);
    this.assetConversionService = new AssetConversionService(this.vaultAdapter);

    this.metadataService = new AssetMetadataService(this.app);

    this.propertiesRenderer = new PropertiesRenderer(
      this.app,
      this.reactRenderer,
      this.metadataExtractor,
      this.metadataService,
    );

    this.areaTreeRenderer = new AreaTreeRenderer(
      this.app,
      this.reactRenderer,
      this.metadataExtractor,
      this.vaultAdapter,
      this.metadataService,
      this.logger,
    );

    this.relationsRenderer = new RelationsRenderer(
      this.app,
      this.settings,
      this.reactRenderer,
      this.backlinksCacheManager,
      this.metadataService,
    );

    this.buttonGroupsBuilder = new ButtonGroupsBuilder(
      this.app,
      this.settings,
      this.plugin,
      this.taskCreationService,
      this.projectCreationService,
      this.areaCreationService,
      this.conceptCreationService,
      this.taskStatusService,
      this.propertyCleanupService,
      this.folderRepairService,
      this.renameToUidService,
      this.effortVotingService,
      this.labelToAliasService,
      this.assetConversionService,
      this.metadataExtractor,
      this.logger,
      () => this.refresh(),
    );

    this.dailyTasksRenderer = new DailyTasksRenderer(
      this.app,
      this.settings,
      this.plugin,
      this.logger,
      this.metadataExtractor,
      this.reactRenderer,
      () => this.refresh(),
    );

    this.dailyProjectsRenderer = new DailyProjectsRenderer(
      this.app,
      this.settings,
      this.plugin,
      this.logger,
      this.metadataExtractor,
      this.reactRenderer,
      () => this.refresh(),
      (path: string) => this.metadataService.getAssetLabel(path),
      (metadata: Record<string, unknown>) => this.metadataService.getEffortArea(metadata),
    );
  }

  public invalidateBacklinksCache(): void {
    this.backlinksCacheManager.invalidate();
  }

  cleanup(): void {
    this.eventListenerManager.cleanup();
    this.reactRenderer.cleanup();
  }

  /**
   * Render the UniversalLayout view with Asset Properties and Assets Relations
   */
  public async render(
    source: string,
    el: HTMLElement,
    _ctx: MarkdownPostProcessorContext,
  ): Promise<void> {
    try {
      this.rootContainer = el;

      const config = this.parseConfig(source);
      const currentFile = this.app.workspace.getActiveFile();

      if (!currentFile) {
        this.renderMessage(el, "No active file");
        return;
      }

      if (this.settings.showPropertiesSection) {
        await this.propertiesRenderer.render(el, currentFile);
      }

      const buttonGroups = await this.buttonGroupsBuilder.build(currentFile);
      if (buttonGroups.length > 0) {
        const buttonsContainer = el.createDiv({
          cls: "exocortex-buttons-section",
        });
        this.reactRenderer.render(
          buttonsContainer,
          React.createElement(ActionButtonsGroup, { groups: buttonGroups }),
        );
      }

      await this.dailyTasksRenderer.render(el, currentFile);
      await this.dailyProjectsRenderer.render(el, currentFile);

      const relations = await this.relationsRenderer.getAssetRelations(
        currentFile,
        config,
      );

      await this.areaTreeRenderer.render(el, currentFile, relations);
      await this.relationsRenderer.render(el, relations, config);

      this.logger.info(
        `Rendered UniversalLayout with properties and ${relations.length} asset relations`,
      );
    } catch (error) {
      this.logger.error("Failed to render UniversalLayout", { error });
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.renderError(el, errorMessage);
    }
  }

  /**
   * Refresh the view when data changes
   */
  public async refresh(_el?: HTMLElement): Promise<void> {
    if (!this.rootContainer) {
      this.logger.error("Cannot refresh: root container not set");
      return;
    }

    const scrollParent =
      this.rootContainer.closest(".cm-scroller") ||
      this.rootContainer.closest(".markdown-preview-view") ||
      this.rootContainer.closest(".workspace-leaf-content");
    const scrollTop = scrollParent?.scrollTop || 0;

    const source = this.rootContainer.getAttribute("data-source") || "";
    this.rootContainer.empty();
    await this.render(
      source,
      this.rootContainer,
      {} as MarkdownPostProcessorContext,
    );

    setTimeout(() => {
      if (scrollParent) {
        scrollParent.scrollTop = scrollTop;
      }
    }, 50);
  }


  /**
   * Parse configuration from source
   */
  private parseConfig(source: string): UniversalLayoutConfig {
    const lines = source.trim().split("\n");
    const config: UniversalLayoutConfig = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const match = trimmed.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        if (key === "sortBy") {
          config.sortBy = value;
        } else if (key === "sortOrder") {
          config.sortOrder = value as "asc" | "desc";
        } else if (key === "showProperties") {
          config.showProperties = value.split(",").map((s) => s.trim());
        }
      }
    }

    return config;
  }

  /**
   * Render a simple message
   */
  private renderMessage(el: HTMLElement, message: string): void {
    el.createDiv({
      text: message,
      cls: "exocortex-message",
    });
  }

  /**
   * Render an error message
   */
  private renderError(el: HTMLElement, message: string): void {
    el.createDiv({
      text: `Error: ${message}`,
      cls: "exocortex-error-message",
    });
  }
}
