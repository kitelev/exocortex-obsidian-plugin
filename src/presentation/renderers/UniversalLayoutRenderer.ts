import { MarkdownPostProcessorContext, TFile, Keymap } from "obsidian";
import { ILogger } from "../../infrastructure/logging/ILogger";
import { LoggerFactory } from "../../infrastructure/logging/LoggerFactory";
import React from "react";
import { ReactRenderer } from "../utils/ReactRenderer";
import { ExocortexSettings } from "../../domain/settings/ExocortexSettings";
import { AssetRelationsTable } from "../components/AssetRelationsTable";
import { AssetPropertiesTable } from "../components/AssetPropertiesTable";
import { DailyProjectsTable, DailyProject } from "../components/DailyProjectsTable";
import { ActionButtonsGroup, ButtonGroup, ActionButton } from "../components/ActionButtonsGroup";
import { AreaHierarchyTree } from "../components/AreaHierarchyTree";
import { AreaHierarchyBuilder } from "../../infrastructure/services/AreaHierarchyBuilder";
import { TaskCreationService } from "../../infrastructure/services/TaskCreationService";
import { ProjectCreationService } from "../../infrastructure/services/ProjectCreationService";
import { AreaCreationService } from "../../infrastructure/services/AreaCreationService";
import { TaskStatusService } from "../../infrastructure/services/TaskStatusService";
import { PropertyCleanupService } from "../../infrastructure/services/PropertyCleanupService";
import { FolderRepairService } from "../../infrastructure/services/FolderRepairService";
import { RenameToUidService } from "../../infrastructure/services/RenameToUidService";
import { EffortVotingService } from "../../infrastructure/services/EffortVotingService";
import { LabelToAliasService } from "../../infrastructure/services/LabelToAliasService";
import { BacklinksCacheManager } from "../../infrastructure/caching/BacklinksCacheManager";
import { EventListenerManager } from "../../infrastructure/events/EventListenerManager";
import { MetadataHelpers } from "../../infrastructure/utilities/MetadataHelpers";
import { AssetClass, EffortStatus } from "../../domain/constants";
import { MetadataExtractor } from "../../infrastructure/utilities/MetadataExtractor";
import { DateFormatter } from "../../infrastructure/utilities/DateFormatter";
import { EffortSortingHelpers } from "../../infrastructure/utilities/EffortSortingHelpers";
import { ButtonGroupsBuilder } from "../builders/ButtonGroupsBuilder";
import { DailyTasksRenderer } from "./DailyTasksRenderer";

/**
 * UniversalLayout configuration options
 */
interface UniversalLayoutConfig {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  showProperties?: string[];
}

/**
 * Asset relation data structure
 */
interface AssetRelation {
  file: TFile;
  path: string;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
  propertyName?: string; // The property through which this asset references the current one
  isBodyLink: boolean; // True if link is in body, not frontmatter
  isArchived?: boolean; // True if asset is archived
  created: number;
  modified: number;
}

/**
 * Renderer for UniversalLayout view type
 * Implements Assets Relations - showing assets grouped by the property through which they reference the current asset
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  constructor(app: ObsidianApp, settings: ExocortexSettings, plugin: any) {
    this.app = app;
    this.settings = settings;
    this.plugin = plugin;
    this.logger = LoggerFactory.create("UniversalLayoutRenderer");
    this.reactRenderer = new ReactRenderer();
    this.eventListenerManager = new EventListenerManager();
    this.backlinksCacheManager = new BacklinksCacheManager(this.app);
    this.metadataExtractor = new MetadataExtractor(this.app.metadataCache);
    this.taskCreationService = new TaskCreationService(this.app.vault);
    this.projectCreationService = new ProjectCreationService(this.app.vault);
    this.areaCreationService = new AreaCreationService(this.app.vault);
    this.taskStatusService = new TaskStatusService(this.app.vault);
    this.propertyCleanupService = new PropertyCleanupService(this.app.vault);
    this.folderRepairService = new FolderRepairService(this.app.vault, this.app);
    this.renameToUidService = new RenameToUidService(this.app);
    this.effortVotingService = new EffortVotingService(this.app.vault);
    this.labelToAliasService = new LabelToAliasService(this.app.vault);
    this.buttonGroupsBuilder = new ButtonGroupsBuilder(
      this.app,
      this.settings,
      this.plugin,
      this.taskCreationService,
      this.projectCreationService,
      this.areaCreationService,
      this.taskStatusService,
      this.propertyCleanupService,
      this.folderRepairService,
      this.renameToUidService,
      this.effortVotingService,
      this.labelToAliasService,
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
  }

  private taskCreationService: TaskCreationService;
  private projectCreationService: ProjectCreationService;
  private areaCreationService: AreaCreationService;
  private taskStatusService: TaskStatusService;
  private propertyCleanupService: PropertyCleanupService;
  private folderRepairService: FolderRepairService;
  private renameToUidService: RenameToUidService;
  private effortVotingService: EffortVotingService;
  private labelToAliasService: LabelToAliasService;


  public invalidateBacklinksCache(): void {
    this.backlinksCacheManager.invalidate();
  }

  cleanup(): void {
    this.eventListenerManager.cleanup();
    this.reactRenderer.cleanup();
  }

  private registerEventListener(
    element: HTMLElement,
    type: string,
    handler: EventListener,
  ): void {
    this.eventListenerManager.register(element, type, handler);
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
      // Save root container for refresh operations
      this.rootContainer = el;

      const config = this.parseConfig(source);
      const currentFile = this.app.workspace.getActiveFile();

      if (!currentFile) {
        this.renderMessage(el, "No active file");
        return;
      }

      // Render asset properties (if enabled in settings)
      if (this.settings.showPropertiesSection) {
        await this.renderAssetProperties(el, currentFile);
      }

      // Render action buttons with semantic grouping
      const buttonGroups = await this.buttonGroupsBuilder.build(currentFile);
      if (buttonGroups.length > 0) {
        const buttonsContainer = el.createDiv({ cls: "exocortex-buttons-section" });
        this.reactRenderer.render(
          buttonsContainer,
          React.createElement(ActionButtonsGroup, { groups: buttonGroups }),
        );
      }

      // Render daily tasks for pn__DailyNote assets
      await this.dailyTasksRenderer.render(el, currentFile);

      // Render daily projects for pn__DailyNote assets
      await this.renderDailyProjects(el, currentFile);

      // Get asset relations for the current file
      const relations = await this.getAssetRelations(currentFile, config);

      // Render Area Tree for ems__Area assets (before relations)
      await this.renderAreaTree(el, currentFile, relations);

      if (relations.length > 0) {
        // Render as table with Name and exo__Instance_class columns
        await this.renderAssetRelations(el, relations, config);
      }

      this.logger.info(
        `Rendered UniversalLayout with properties and ${relations.length} asset relations`,
      );
    } catch (error) {
      this.logger.error("Failed to render UniversalLayout", { error });
      this.renderError(el, error.message);
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

    const scrollParent = this.rootContainer.closest('.cm-scroller')
      || this.rootContainer.closest('.markdown-preview-view')
      || this.rootContainer.closest('.workspace-leaf-content');
    const scrollTop = scrollParent?.scrollTop || 0;

    const source = this.rootContainer.getAttribute("data-source") || "";
    this.rootContainer.empty();
    await this.render(source, this.rootContainer, {} as MarkdownPostProcessorContext);

    setTimeout(() => {
      if (scrollParent) {
        scrollParent.scrollTop = scrollTop;
      }
    }, 50);
  }

  /**
   * Get asset relations for the current file
   * Analyzes HOW each asset references the current one (via which property or body)
   * Filters out archived assets to maintain clean output
   */
  private async getAssetRelations(
    file: TFile,
    config: UniversalLayoutConfig,
  ): Promise<AssetRelation[]> {
    const relations: AssetRelation[] = [];
    const cache = this.app.metadataCache;

    const backlinks = this.backlinksCacheManager.getBacklinks(file.path);
    if (!backlinks) {
      return relations;
    }

    // Process only files that actually link to this file
    for (const sourcePath of backlinks) {
      const sourceFile = this.app.vault.getAbstractFileByPath(sourcePath);
      // Duck typing: Check for TFile properties instead of instanceof
      if (
        sourceFile &&
        typeof sourceFile === "object" &&
        "basename" in sourceFile &&
        "path" in sourceFile &&
        "stat" in sourceFile
      ) {
        const fileCache = cache.getFileCache(sourceFile as TFile);
        const metadata = fileCache?.frontmatter || {};

        const isArchived = MetadataHelpers.isAssetArchived(metadata);

        // Skip archived assets if setting is disabled
        if (isArchived && !this.settings.showArchivedAssets) {
          continue;
        }

        const referencingProperties = MetadataHelpers.findAllReferencingProperties(
          metadata,
          file.basename,
        );

        // Enrich metadata with resolved label (asset's own or prototype's)
        const enrichedMetadata = { ...metadata };
        const resolvedLabel = this.getAssetLabel(sourcePath);
        if (resolvedLabel) {
          enrichedMetadata.exo__Asset_label = resolvedLabel;
        }

        // Create a separate relation for EACH property that references this file
        if (referencingProperties.length > 0) {
          for (const propertyName of referencingProperties) {
            const relation: AssetRelation = {
              file: sourceFile,
              path: sourcePath,
              title: sourceFile.basename,
              metadata: enrichedMetadata,
              propertyName: propertyName,
              isBodyLink: false,
              isArchived: isArchived,
              created: sourceFile.stat.ctime,
              modified: sourceFile.stat.mtime,
            };
            relations.push(relation);
          }
        } else {
          // No property found, it's a body link
          const relation: AssetRelation = {
            file: sourceFile,
            path: sourcePath,
            title: sourceFile.basename,
            metadata: enrichedMetadata,
            propertyName: undefined,
            isBodyLink: true,
            isArchived: isArchived,
            created: sourceFile.stat.ctime,
            modified: sourceFile.stat.mtime,
          };
          relations.push(relation);
        }
      }
    }

    if (config.sortBy) {
      const sortBy = config.sortBy;
      relations.sort((a, b) => {
        const aVal = MetadataHelpers.getPropertyValue(a, sortBy);
        const bVal = MetadataHelpers.getPropertyValue(b, sortBy);
        const order = config.sortOrder === "desc" ? -1 : 1;
        return aVal > bVal ? order : -order;
      });
    }

    return relations;
  }

  /**
   * Render asset properties for the current file
   */
  private async renderAssetProperties(
    el: HTMLElement,
    file: TFile,
  ): Promise<void> {
    const metadata = this.metadataExtractor.extractMetadata(file);

    if (Object.keys(metadata).length === 0) {
      return;
    }

    const container = el.createDiv({ cls: "exocortex-properties-section" });

    this.reactRenderer.render(
      container,
      React.createElement(AssetPropertiesTable, {
        metadata,
        onLinkClick: async (path: string, event: React.MouseEvent) => {
          // Use Obsidian's Keymap.isModEvent to detect Cmd/Ctrl properly
          const isModPressed = Keymap.isModEvent(event.nativeEvent as MouseEvent);

          if (isModPressed) {
            // Open in new tab - get a new leaf and open there
            const leaf = this.app.workspace.getLeaf('tab');
            await leaf.openLinkText(path, '');
          } else {
            // Open in current tab
            await this.app.workspace.openLinkText(path, "", false);
          }
        },
        getAssetLabel: (path: string) => this.getAssetLabel(path),
      }),
    );
  }

  private async renderDailyProjects(
    el: HTMLElement,
    file: TFile,
  ): Promise<void> {
    const metadata = this.metadataExtractor.extractMetadata(file);
    const instanceClass = this.metadataExtractor.extractInstanceClass(metadata);

    const classes = Array.isArray(instanceClass)
      ? instanceClass
      : [instanceClass];
    const isDailyNote = classes.some(
      (c: string) => c === "[[pn__DailyNote]]" || c === "pn__DailyNote",
    );

    if (!isDailyNote) {
      return;
    }

    const dayProperty = metadata.pn__DailyNote_day;
    if (!dayProperty) {
      this.logger.debug("No pn__DailyNote_day found for daily note");
      return;
    }

    const dayMatch =
      typeof dayProperty === "string"
        ? dayProperty.match(/\[\[(.+?)\]\]/)
        : null;
    const day = dayMatch ? dayMatch[1] : String(dayProperty).replace(/^\[\[|\]\]$/g, "");

    const projects = await this.getDailyProjects(day);

    if (projects.length === 0) {
      this.logger.debug(`No projects found for day: ${day}`);
      return;
    }

    const sectionContainer = el.createDiv({ cls: "exocortex-daily-projects-section" });

    sectionContainer.createEl("h3", {
      text: "Projects",
      cls: "exocortex-section-header",
    });

    const tableContainer = sectionContainer.createDiv({ cls: "exocortex-daily-projects-table-container" });

    this.reactRenderer.render(
      tableContainer,
      React.createElement(DailyProjectsTable, {
        projects,
        onProjectClick: async (path: string, event: React.MouseEvent) => {
          const isModPressed = Keymap.isModEvent(
            event.nativeEvent as MouseEvent,
          );

          if (isModPressed) {
            const leaf = this.app.workspace.getLeaf("tab");
            await leaf.openLinkText(path, "");
          } else {
            await this.app.workspace.openLinkText(path, "", false);
          }
        },
        getAssetLabel: (path: string) => this.getAssetLabel(path),
      }),
    );

    this.logger.info(`Rendered ${projects.length} projects for DailyNote: ${day}`);
  }

  /**
   * Render Area Hierarchy Tree for ems__Area assets
   * Displays hierarchical parent-child relationships via ems__Area_parent property
   */
  private async renderAreaTree(
    el: HTMLElement,
    file: TFile,
    relations: AssetRelation[],
  ): Promise<void> {
    const metadata = this.metadataExtractor.extractMetadata(file);
    const instanceClass = this.extractInstanceClass(metadata);

    if (instanceClass !== AssetClass.AREA) {
      return;
    }

    const hierarchyBuilder = new AreaHierarchyBuilder(
      this.app.vault,
      this.app.metadataCache,
    );

    const tree = hierarchyBuilder.buildHierarchy(file.path, relations);

    if (!tree) {
      return;
    }

    const sectionContainer = el.createDiv({ cls: "exocortex-area-tree-section" });

    sectionContainer.createEl("h3", {
      text: "Area Tree",
      cls: "exocortex-section-header",
    });

    const treeContainer = sectionContainer.createDiv({ cls: "exocortex-area-tree-container" });

    this.reactRenderer.render(
      treeContainer,
      React.createElement(AreaHierarchyTree, {
        tree,
        currentAreaPath: file.path,
        onAreaClick: async (path: string, event: React.MouseEvent) => {
          const isModPressed = Keymap.isModEvent(
            event.nativeEvent as MouseEvent,
          );

          if (isModPressed) {
            const leaf = this.app.workspace.getLeaf("tab");
            await leaf.openLinkText(path, "");
          } else {
            await this.app.workspace.openLinkText(path, "", false);
          }
        },
        getAssetLabel: (path: string) => this.getAssetLabel(path),
      }),
    );

    this.logger.info(`Rendered Area Tree for ${file.path}`);
  }

  private extractInstanceClass(metadata: Record<string, any>): string {
    const instanceClass = metadata.exo__Instance_class || "";
    if (Array.isArray(instanceClass)) {
      const firstClass = instanceClass[0] || "";
      return String(firstClass).replace(/^\[\[|\]\]$/g, "").trim();
    }
    return String(instanceClass).replace(/^\[\[|\]\]$/g, "").trim();
  }

  /**
   * Render assets grouped by the property through which they reference the current asset
   * This is the core Assets Relations feature - Now using React components
   */
  private async renderAssetRelations(
    el: HTMLElement,
    relations: AssetRelation[],
    config: UniversalLayoutConfig,
  ): Promise<void> {
    const container = el.createDiv({ cls: "exocortex-assets-relations" });

    // Use React component for rendering
    this.reactRenderer.render(
      container,
      React.createElement(AssetRelationsTable, {
        relations,
        groupByProperty: true,
        sortBy: config.sortBy || "title",
        sortOrder: config.sortOrder || "asc",
        showProperties: config.showProperties || [],
        groupSpecificProperties: {
          "ems__Effort_parent": ["ems__Effort_status"],
          "ems__Effort_area": ["ems__Effort_status"],
        },
        onAssetClick: async (path: string, event: React.MouseEvent) => {
          // Use Obsidian's Keymap.isModEvent to detect Cmd/Ctrl properly
          const isModPressed = Keymap.isModEvent(event.nativeEvent as MouseEvent);

          if (isModPressed) {
            // Open in new tab - get a new leaf and open there
            const leaf = this.app.workspace.getLeaf('tab');
            await leaf.openLinkText(path, '');
          } else {
            // Open in current tab
            await this.app.workspace.openLinkText(path, "", false);
          }
        },
        getAssetLabel: (path: string) => this.getAssetLabel(path),
      }),
    );
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

  private getAssetLabel(path: string): string | null {
    // Use getFirstLinkpathDest to resolve file regardless of vault location
    let file = this.app.metadataCache.getFirstLinkpathDest(path, "");

    if (!file && !path.endsWith('.md')) {
      file = this.app.metadataCache.getFirstLinkpathDest(path + '.md', "");
    }

    if (
      !file ||
      typeof file !== "object" ||
      !("basename" in file) ||
      !("path" in file)
    ) {
      return null;
    }

    const cache = this.app.metadataCache.getFileCache(file as TFile);
    const metadata = cache?.frontmatter || {};

    // Check asset's own label first
    const label = metadata.exo__Asset_label;
    if (label && typeof label === "string" && label.trim() !== "") {
      return label;
    }

    // Fallback: check prototype's label
    const prototypeRef = metadata.ems__Effort_prototype;
    if (prototypeRef) {
      // Extract clean path from wiki-link format [[path]] or plain path
      const prototypePath = typeof prototypeRef === "string"
        ? prototypeRef.replace(/^\[\[|\]\]$/g, "").trim()
        : null;

      if (prototypePath) {
        // Use getFirstLinkpathDest to resolve prototype file regardless of vault location
        const prototypeFile = this.app.metadataCache.getFirstLinkpathDest(prototypePath, "");
        if (prototypeFile && typeof prototypeFile === "object" && "path" in prototypeFile) {
          const prototypeCache = this.app.metadataCache.getFileCache(prototypeFile as TFile);
          const prototypeMetadata = prototypeCache?.frontmatter || {};
          const prototypeLabel = prototypeMetadata.exo__Asset_label;

          if (prototypeLabel && typeof prototypeLabel === "string" && prototypeLabel.trim() !== "") {
            return prototypeLabel;
          }
        }
      }
    }

    return null;
  }


  private async getDailyProjects(
    day: string,
  ): Promise<DailyProject[]> {
    try {
      const projects: DailyProject[] = [];

      const allFiles = this.app.vault.getMarkdownFiles();

      for (const file of allFiles) {
        const metadata = this.metadataExtractor.extractMetadata(file);

        const effortDay = metadata.ems__Effort_day;

        if (!effortDay) {
          continue;
        }

        const effortDayStr = String(effortDay).replace(/^\[\[|\]\]$/g, "");

        if (effortDayStr !== day) {
          continue;
        }

        const instanceClass = metadata.exo__Instance_class || [];
        const instanceClassArray = Array.isArray(instanceClass)
          ? instanceClass
          : [instanceClass];
        const isProject = instanceClassArray.some(
          (c: string) => String(c).includes(AssetClass.PROJECT),
        );

        if (!isProject) {
          continue;
        }

        const effortStatus = metadata.ems__Effort_status || "";
        const effortStatusStr = String(effortStatus).replace(/^\[\[|\]\]$/g, "");

        const startTimestamp = metadata.ems__Effort_startTimestamp;
        const plannedStartTimestamp = metadata.ems__Effort_plannedStartTimestamp;
        const endTimestamp = metadata.ems__Effort_endTimestamp;
        const plannedEndTimestamp = metadata.ems__Effort_plannedEndTimestamp;

        const formatTime = (timestamp: string | number | null | undefined): string => {
          if (!timestamp) return "";
          const date = new Date(timestamp);
          if (isNaN(date.getTime())) return "";
          return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        };

        const startTime = formatTime(startTimestamp) || formatTime(plannedStartTimestamp);
        const endTime = formatTime(endTimestamp) || formatTime(plannedEndTimestamp);

        const isDone = effortStatusStr === EffortStatus.DONE;
        const isTrashed = effortStatusStr === EffortStatus.TRASHED;

        const label = metadata.exo__Asset_label || file.basename;

        projects.push({
          file: {
            path: file.path,
            basename: file.basename,
          },
          path: file.path,
          title: file.basename,
          label,
          startTime,
          endTime,
          status: effortStatusStr,
          metadata,
          isDone,
          isTrashed,
        });
      }

      projects.sort(EffortSortingHelpers.sortByPriority);

      return projects.slice(0, 50);
    } catch (error) {
      this.logger.error("Failed to get daily projects", { error });
      return [];
    }
  }
}
