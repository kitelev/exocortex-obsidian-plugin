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
import { ClassCreationService } from "@exocortex/core";
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
import { DailyNoteHelpers } from "./helpers/DailyNoteHelpers";
import { DateFormatter } from "@exocortex/core";
import {
  PropertyDependencyResolver,
  LayoutSection,
} from "../../application/services/PropertyDependencyResolver";
import { FrontmatterDeltaDetector } from "../../application/services/FrontmatterDeltaDetector";

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

  /**
   * Collapse state for layout sections
   * Key: section ID, Value: collapsed state (true = collapsed, false = expanded)
   */
  private collapsedSections: Map<string, boolean> = new Map([
    ["properties", false],
    ["buttons", false],
    ["daily-tasks", false],
    ["daily-projects", false],
    ["area-tree", false],
    ["relations", false],
  ]);

  private taskCreationService: TaskCreationService;
  private projectCreationService: ProjectCreationService;
  private areaCreationService: AreaCreationService;
  private classCreationService: ClassCreationService;
  private conceptCreationService: ConceptCreationService;
  private taskStatusService: TaskStatusService;
  private propertyCleanupService: PropertyCleanupService;
  private folderRepairService: FolderRepairService;
  private renameToUidService: RenameToUidService;
  private effortVotingService: EffortVotingService;
  private labelToAliasService: LabelToAliasService;
  private assetConversionService: AssetConversionService;

  private dependencyResolver: PropertyDependencyResolver;
  private deltaDetector: FrontmatterDeltaDetector;
  private metadataCache: Map<string, Record<string, unknown>> = new Map();
  private debounceTimeout: NodeJS.Timeout | null = null;
  private currentFilePath: string | null = null;
  private currentConfig: UniversalLayoutConfig = {};

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
    this.classCreationService = new ClassCreationService(this.vaultAdapter);
    this.conceptCreationService = new ConceptCreationService(this.vaultAdapter);
    this.taskStatusService = new TaskStatusService(this.vaultAdapter);
    this.propertyCleanupService = new PropertyCleanupService(this.vaultAdapter, this.logger);
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
      this.plugin,
      () => this.refresh(),
    );

    this.buttonGroupsBuilder = new ButtonGroupsBuilder(
      this.app,
      this.settings,
      this.plugin,
      this.taskCreationService,
      this.projectCreationService,
      this.areaCreationService,
      this.classCreationService,
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
      this.metadataService,
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

    this.dependencyResolver = new PropertyDependencyResolver();
    this.deltaDetector = new FrontmatterDeltaDetector();
  }

  public invalidateBacklinksCache(): void {
    this.backlinksCacheManager.invalidate();
  }

  cleanup(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
    this.eventListenerManager.cleanup();
    this.reactRenderer.cleanup();
  }

  public async handleMetadataChange(filePath: string): Promise<void> {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(async () => {
      if (!this.rootContainer || filePath !== this.currentFilePath) {
        return;
      }

      const currentFile = this.app.vault.getAbstractFileByPath(filePath);
      if (!currentFile || currentFile.extension !== "md") {
        return;
      }

      const oldMetadata = this.metadataCache.get(filePath) || {};
      const newMetadata = this.metadataExtractor.extractMetadata(currentFile);

      const delta = this.deltaDetector.detectChanges(oldMetadata, newMetadata);
      const changedProps = this.deltaDetector.getAllChangedProperties(delta);

      if (changedProps.length === 0) {
        return;
      }

      this.metadataCache.set(filePath, newMetadata);

      const affectedSections =
        this.dependencyResolver.getAffectedSections(changedProps);

      await this.incrementalUpdate(currentFile, affectedSections);
    }, 50);
  }

  private async incrementalUpdate(
    file: any,
    sections: LayoutSection[],
  ): Promise<void> {
    if (!this.rootContainer) {
      return;
    }

    for (const section of sections) {
      switch (section) {
        case LayoutSection.PROPERTIES:
          await this.updatePropertiesSection(file);
          break;
        case LayoutSection.BUTTONS:
          await this.updateButtonsSection(file);
          break;
        case LayoutSection.DAILY_TASKS:
          await this.updateDailyTasksSection(file);
          break;
        case LayoutSection.DAILY_PROJECTS:
          await this.updateDailyProjectsSection(file);
          break;
        case LayoutSection.AREA_TREE:
          await this.updateAreaTreeSection(file);
          break;
        case LayoutSection.RELATIONS:
          await this.updateRelationsSection(file);
          break;
      }
    }
  }

  private async updatePropertiesSection(file: any): Promise<void> {
    const sectionContainer = this.rootContainer?.querySelector(
      ".exocortex-properties-section",
    ) as HTMLElement;

    if (!sectionContainer || !this.rootContainer) {
      return;
    }

    sectionContainer.empty();

    const backlinks = this.backlinksCacheManager.getBacklinks(file.path);
    const hasRelations = backlinks && backlinks.size > 0;

    const parent = sectionContainer.parentElement || this.rootContainer;

    await this.propertiesRenderer.render(
      parent,
      file,
      { hideAliases: hasRelations },
      this.renderSectionHeader.bind(this),
      this.isSectionCollapsed("properties"),
    );
  }

  private async updateButtonsSection(file: any): Promise<void> {
    const sectionContainer = this.rootContainer?.querySelector(
      ".exocortex-buttons-section",
    ) as HTMLElement;

    if (sectionContainer) {
      sectionContainer.remove();
    }

    const buttonGroups = await this.buttonGroupsBuilder.build(file);
    if (buttonGroups.length > 0 && this.rootContainer) {
      const buttonsContainer = this.rootContainer.createDiv({
        cls: "exocortex-buttons-section",
      });
      this.reactRenderer.render(
        buttonsContainer,
        React.createElement(ActionButtonsGroup, { groups: buttonGroups }),
      );
    }
  }

  private async updateDailyTasksSection(file: any): Promise<void> {
    const sectionContainer = this.rootContainer?.querySelector(
      ".exocortex-daily-tasks-section",
    ) as HTMLElement;

    if (!sectionContainer || !this.rootContainer) {
      return;
    }

    sectionContainer.empty();

    const parent = sectionContainer.parentElement || this.rootContainer;

    await this.dailyTasksRenderer.render(
      parent,
      file,
      this.renderSectionHeader.bind(this),
      this.isSectionCollapsed("daily-tasks"),
    );
  }

  private async updateDailyProjectsSection(file: any): Promise<void> {
    const sectionContainer = this.rootContainer?.querySelector(
      ".exocortex-daily-projects-section",
    ) as HTMLElement;

    if (!sectionContainer || !this.rootContainer) {
      return;
    }

    sectionContainer.empty();

    const parent = sectionContainer.parentElement || this.rootContainer;

    await this.dailyProjectsRenderer.render(
      parent,
      file,
      this.renderSectionHeader.bind(this),
      this.isSectionCollapsed("daily-projects"),
    );
  }

  private async updateAreaTreeSection(file: any): Promise<void> {
    const sectionContainer = this.rootContainer?.querySelector(
      ".exocortex-area-tree-section",
    ) as HTMLElement;

    if (!sectionContainer || !this.rootContainer) {
      return;
    }

    sectionContainer.empty();

    const relations = await this.relationsRenderer.getAssetRelations(
      file,
      this.currentConfig,
    );

    const parent = sectionContainer.parentElement || this.rootContainer;

    await this.areaTreeRenderer.render(
      parent,
      file,
      relations,
      this.renderSectionHeader.bind(this),
      this.isSectionCollapsed("area-tree"),
    );
  }

  private async updateRelationsSection(file: any): Promise<void> {
    const sectionContainer = this.rootContainer?.querySelector(
      ".exocortex-assets-relations",
    ) as HTMLElement;

    if (!sectionContainer || !this.rootContainer) {
      return;
    }

    sectionContainer.empty();

    const relations = await this.relationsRenderer.getAssetRelations(
      file,
      this.currentConfig,
    );

    const parent = sectionContainer.parentElement || this.rootContainer;

    await this.relationsRenderer.render(
      parent,
      relations,
      this.currentConfig,
      this.renderSectionHeader.bind(this),
      this.isSectionCollapsed("relations"),
    );
  }

  /**
   * Toggle the collapsed state of a section
   */
  private toggleSection(sectionId: string, container: HTMLElement): void {
    const currentState = this.collapsedSections.get(sectionId) || false;
    this.collapsedSections.set(sectionId, !currentState);

    const contentElement = container.querySelector(
      ".exocortex-section-content",
    ) as HTMLElement;
    const toggleButton = container.querySelector(
      ".exocortex-section-toggle",
    ) as HTMLElement;

    if (contentElement && toggleButton) {
      const newState = !currentState;
      contentElement.setAttribute("data-collapsed", newState.toString());
      toggleButton.textContent = newState ? "▶" : "▼";
      toggleButton.setAttribute("aria-expanded", (!newState).toString());
      toggleButton.setAttribute(
        "aria-label",
        `${newState ? "Expand" : "Collapse"} section`,
      );
    }
  }

  /**
   * Check if a section is collapsed
   */
  private isSectionCollapsed(sectionId: string): boolean {
    return this.collapsedSections.get(sectionId) || false;
  }

  /**
   * Render a collapsible section header with toggle button
   */
  private renderSectionHeader(
    container: HTMLElement,
    sectionId: string,
    title: string,
  ): void {
    const isCollapsed = this.isSectionCollapsed(sectionId);

    const header = container.createDiv({ cls: "exocortex-section-header" });

    const toggleButton = header.createEl("button", {
      cls: "exocortex-section-toggle",
      attr: {
        "aria-expanded": (!isCollapsed).toString(),
        "aria-label": `${isCollapsed ? "Expand" : "Collapse"} ${title}`,
        type: "button",
      },
    });
    toggleButton.textContent = isCollapsed ? "▶" : "▼";

    this.eventListenerManager.register(toggleButton, "click", (e: Event) => {
      e.stopPropagation();
      this.toggleSection(sectionId, container);
    });

    this.eventListenerManager.register(toggleButton, "keydown", (e: Event) => {
      const keyboardEvent = e as KeyboardEvent;
      if (keyboardEvent.key === " " || keyboardEvent.key === "Enter") {
        e.preventDefault();
        this.toggleSection(sectionId, container);
      }
    });

    header.createEl("h3", { text: title });
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

      this.renderDailyNavigation(el, currentFile);

      // Check if Relations will be rendered to determine if we should hide aliases
      const backlinks = this.backlinksCacheManager.getBacklinks(currentFile.path);
      const hasRelations = backlinks && backlinks.size > 0;

      if (this.settings.showPropertiesSection) {
        await this.propertiesRenderer.render(
          el,
          currentFile,
          { hideAliases: hasRelations },
          this.renderSectionHeader.bind(this),
          this.isSectionCollapsed("properties"),
        );
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

      await this.dailyTasksRenderer.render(
        el,
        currentFile,
        this.renderSectionHeader.bind(this),
        this.isSectionCollapsed("daily-tasks"),
      );
      await this.dailyProjectsRenderer.render(
        el,
        currentFile,
        this.renderSectionHeader.bind(this),
        this.isSectionCollapsed("daily-projects"),
      );

      const relations = await this.relationsRenderer.getAssetRelations(
        currentFile,
        config,
      );

      await this.areaTreeRenderer.render(
        el,
        currentFile,
        relations,
        this.renderSectionHeader.bind(this),
        this.isSectionCollapsed("area-tree"),
      );
      await this.relationsRenderer.render(
        el,
        relations,
        config,
        this.renderSectionHeader.bind(this),
        this.isSectionCollapsed("relations"),
      );

      this.currentFilePath = currentFile.path;
      this.currentConfig = config;
      const currentMetadata = this.metadataExtractor.extractMetadata(currentFile);
      this.metadataCache.set(currentFile.path, currentMetadata);

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

  private renderDailyNavigation(el: HTMLElement, file: any): void {
    const dailyNoteInfo = DailyNoteHelpers.extractDailyNoteInfo(
      file,
      this.metadataExtractor,
      this.logger,
    );

    if (!dailyNoteInfo.isDailyNote || !dailyNoteInfo.day) {
      return;
    }

    const currentDate = new Date(dailyNoteInfo.day);
    if (isNaN(currentDate.getTime())) {
      this.logger.debug(`Invalid date format: ${dailyNoteInfo.day}`);
      return;
    }

    const prevDate = DateFormatter.addDays(currentDate, -1);
    const nextDate = DateFormatter.addDays(currentDate, 1);

    const prevDateStr = DateFormatter.toDateString(prevDate);
    const nextDateStr = DateFormatter.toDateString(nextDate);

    const prevDailyNote = DailyNoteHelpers.findDailyNoteByDate(
      this.app,
      this.metadataExtractor,
      prevDateStr,
    );
    const nextDailyNote = DailyNoteHelpers.findDailyNoteByDate(
      this.app,
      this.metadataExtractor,
      nextDateStr,
    );

    const navContainer = el.createDiv({
      cls: "exocortex-daily-navigation",
    });

    const prevSpan = navContainer.createSpan({ cls: "exocortex-nav-prev" });
    if (prevDailyNote) {
      const prevLink = prevSpan.createEl("a", {
        text: `← ${prevDateStr}`,
        cls: "internal-link",
        attr: { "data-href": prevDailyNote.path },
      });
      prevLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.app.workspace.openLinkText(prevDailyNote.path, file.path, false);
      });
    } else {
      prevSpan.createSpan({
        text: `← ${prevDateStr}`,
        cls: "exocortex-nav-disabled",
      });
    }

    const nextSpan = navContainer.createSpan({ cls: "exocortex-nav-next" });
    if (nextDailyNote) {
      const nextLink = nextSpan.createEl("a", {
        text: `${nextDateStr} →`,
        cls: "internal-link",
        attr: { "data-href": nextDailyNote.path },
      });
      nextLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.app.workspace.openLinkText(nextDailyNote.path, file.path, false);
      });
    } else {
      nextSpan.createSpan({
        text: `${nextDateStr} →`,
        cls: "exocortex-nav-disabled",
      });
    }
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
