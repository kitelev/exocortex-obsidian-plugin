import { MarkdownPostProcessorContext, TFile, Keymap } from "obsidian";
import { ILogger } from "../../infrastructure/logging/ILogger";
import { LoggerFactory } from "../../infrastructure/logging/LoggerFactory";
import React from "react";
import { ReactRenderer } from "../utils/ReactRenderer";
import { AssetRelationsTable } from "../components/AssetRelationsTable";
import { AssetPropertiesTable } from "../components/AssetPropertiesTable";
import { DailyTasksTable, DailyTask } from "../components/DailyTasksTable";
import { ActionButtonsGroup, ButtonGroup, ActionButton } from "../components/ActionButtonsGroup";
import {
  canCreateTask,
  canCreateInstance,
  canMoveToBacklog,
  canStartEffort,
  canMarkDone,
  canPlanOnToday,
  canShiftDayBackward,
  canShiftDayForward,
  canTrashEffort,
  canArchiveTask,
  canCleanProperties,
  canRepairFolder,
  canRenameToUid,
  CommandVisibilityContext,
} from "../../domain/commands/CommandVisibility";
import { CreateTaskButton } from "../components/CreateTaskButton";
import { CreateInstanceButton } from "../components/CreateInstanceButton";
import { MoveToBacklogButton } from "../components/MoveToBacklogButton";
import { StartEffortButton } from "../components/StartEffortButton";
import { PlanOnTodayButton } from "../components/PlanOnTodayButton";
import { ShiftDayBackwardButton } from "../components/ShiftDayBackwardButton";
import { ShiftDayForwardButton } from "../components/ShiftDayForwardButton";
import { MarkTaskDoneButton } from "../components/MarkTaskDoneButton";
import { TrashEffortButton } from "../components/TrashEffortButton";
import { ArchiveTaskButton } from "../components/ArchiveTaskButton";
import { CleanEmptyPropertiesButton } from "../components/CleanEmptyPropertiesButton";
import { RepairFolderButton } from "../components/RepairFolderButton";
import { RenameToUidButton } from "../components/RenameToUidButton";
import { LabelInputModal } from "../modals/LabelInputModal";
import { TaskCreationService } from "../../infrastructure/services/TaskCreationService";
import { TaskStatusService } from "../../infrastructure/services/TaskStatusService";
import { PropertyCleanupService } from "../../infrastructure/services/PropertyCleanupService";
import { FolderRepairService } from "../../infrastructure/services/FolderRepairService";
import { RenameToUidService } from "../../infrastructure/services/RenameToUidService";

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
  private eventListeners: Array<{
    element: HTMLElement;
    type: string;
    handler: EventListener;
  }> = [];
  private backlinksCache: Map<string, Set<string>> = new Map();
  private backlinksCacheValid = false;
  private reactRenderer: ReactRenderer;
  private rootContainer: HTMLElement | null = null;

  constructor(app: ObsidianApp) {
    this.app = app;
    this.logger = LoggerFactory.create("UniversalLayoutRenderer");
    this.reactRenderer = new ReactRenderer();
    this.taskCreationService = new TaskCreationService(this.app.vault);
    this.taskStatusService = new TaskStatusService(this.app.vault);
    this.propertyCleanupService = new PropertyCleanupService(this.app.vault);
    this.folderRepairService = new FolderRepairService(this.app.vault, this.app);
    this.renameToUidService = new RenameToUidService(this.app);
  }

  private taskCreationService: TaskCreationService;
  private taskStatusService: TaskStatusService;
  private propertyCleanupService: PropertyCleanupService;
  private folderRepairService: FolderRepairService;
  private renameToUidService: RenameToUidService;

  /**
   * Build reverse index of backlinks for O(1) lookups
   */
  private buildBacklinksCache(): void {
    if (this.backlinksCacheValid) return;

    this.backlinksCache.clear();
    const resolvedLinks = this.app.metadataCache.resolvedLinks;

    for (const sourcePath in resolvedLinks) {
      const links = resolvedLinks[sourcePath];
      for (const targetPath in links) {
        const existingBacklinks = this.backlinksCache.get(targetPath);
        if (!existingBacklinks) {
          this.backlinksCache.set(targetPath, new Set([sourcePath]));
        } else {
          existingBacklinks.add(sourcePath);
        }
      }
    }

    this.backlinksCacheValid = true;
  }

  /**
   * Invalidate backlinks cache when vault changes
   */
  public invalidateBacklinksCache(): void {
    this.backlinksCacheValid = false;
  }

  /**
   * Clean up all registered event listeners
   * Should be called when component is unmounted
   */
  cleanup(): void {
    this.eventListeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    this.eventListeners = [];
    this.reactRenderer.cleanup();
  }

  /**
   * Register event listener for automatic cleanup
   */
  private registerEventListener(
    element: HTMLElement,
    type: string,
    handler: EventListener,
  ): void {
    element.addEventListener(type, handler);
    this.eventListeners.push({ element, type, handler });
  }

  /**
   * Build action button groups with semantic organization
   */
  private async buildActionButtonGroups(file: TFile): Promise<ButtonGroup[]> {
    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};
    const instanceClass = metadata.exo__Instance_class || null;
    const currentStatus = metadata.ems__Effort_status || null;
    const isArchived = metadata.archived ?? metadata.exo__Asset_isArchived ?? null;
    const currentFolder = file.parent?.path || "";
    const expectedFolder = await this.folderRepairService.getExpectedFolder(file, metadata);

    const context: CommandVisibilityContext = {
      instanceClass,
      currentStatus,
      metadata,
      isArchived,
      currentFolder,
      expectedFolder,
    };

    const groups: ButtonGroup[] = [];

    // Creation Group - Primary actions
    const creationButtons: ActionButton[] = [
      {
        id: "create-task",
        label: "Create Task",
        variant: "primary",
        visible: canCreateTask(context),
        onClick: async () => {
          const label = await new Promise<string | null>((resolve) => {
            new LabelInputModal(this.app, resolve).open();
          });
          if (label === null) return;

          const sourceClass = Array.isArray(instanceClass)
            ? (instanceClass[0] || "").replace(/\[\[|\]\]/g, "").trim()
            : (instanceClass || "").replace(/\[\[|\]\]/g, "").trim();

          const createdFile = await this.taskCreationService.createTask(file, metadata, sourceClass, label);
          const leaf = this.app.workspace.getLeaf("tab");
          await leaf.openFile(createdFile);
          this.app.workspace.setActiveLeaf(leaf, { focus: true });
          this.logger.info(`Created Task from ${sourceClass}: ${createdFile.path}`);
        },
      },
      {
        id: "create-instance",
        label: "Create Instance",
        variant: "primary",
        visible: canCreateInstance(context),
        onClick: async () => {
          const label = await new Promise<string | null>((resolve) => {
            new LabelInputModal(this.app, resolve).open();
          });
          if (label === null) return;

          const sourceClass = Array.isArray(instanceClass)
            ? (instanceClass[0] || "").replace(/\[\[|\]\]/g, "").trim()
            : (instanceClass || "").replace(/\[\[|\]\]/g, "").trim();

          const createdFile = await this.taskCreationService.createTask(file, metadata, sourceClass, label);
          const leaf = this.app.workspace.getLeaf("tab");
          await leaf.openFile(createdFile);
          this.app.workspace.setActiveLeaf(leaf, { focus: true });
          this.logger.info(`Created Instance from TaskPrototype: ${createdFile.path}`);
        },
      },
    ];

    if (creationButtons.some(btn => btn.visible)) {
      groups.push({
        id: "creation",
        title: "Creation",
        buttons: creationButtons,
      });
    }

    // Status Group - Status transitions
    const statusButtons: ActionButton[] = [
      {
        id: "move-to-backlog",
        label: "Move to Backlog",
        variant: "secondary",
        visible: canMoveToBacklog(context),
        onClick: async () => {
          await this.taskStatusService.moveToBacklog(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Moved to Backlog: ${file.path}`);
        },
      },
      {
        id: "start-effort",
        label: "Start Effort",
        variant: "secondary",
        visible: canStartEffort(context),
        onClick: async () => {
          await this.taskStatusService.startEffort(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Started effort: ${file.path}`);
        },
      },
      {
        id: "mark-done",
        label: "Mark Done",
        variant: "success",
        visible: canMarkDone(context),
        onClick: async () => {
          await this.taskStatusService.markTaskAsDone(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Marked task as Done: ${file.path}`);
        },
      },
    ];

    if (statusButtons.some(btn => btn.visible)) {
      groups.push({
        id: "status",
        title: "Status",
        buttons: statusButtons,
      });
    }

    // Planning Group - Planning actions
    const planningButtons: ActionButton[] = [
      {
        id: "plan-on-today",
        label: "Plan on Today",
        variant: "warning",
        visible: canPlanOnToday(context),
        onClick: async () => {
          await this.taskStatusService.planOnToday(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Planned on today: ${file.path}`);
        },
      },
      {
        id: "shift-day-backward",
        label: "Shift Day ◀",
        variant: "warning",
        visible: canShiftDayBackward(context),
        onClick: async () => {
          await this.taskStatusService.shiftDayBackward(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Day shifted backward: ${file.path}`);
        },
      },
      {
        id: "shift-day-forward",
        label: "Shift Day ▶",
        variant: "warning",
        visible: canShiftDayForward(context),
        onClick: async () => {
          await this.taskStatusService.shiftDayForward(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Day shifted forward: ${file.path}`);
        },
      },
    ];

    if (planningButtons.some(btn => btn.visible)) {
      groups.push({
        id: "planning",
        title: "Planning",
        buttons: planningButtons,
      });
    }

    // Maintenance Group - Maintenance actions
    const maintenanceButtons: ActionButton[] = [
      {
        id: "trash",
        label: "Trash",
        variant: "danger",
        visible: canTrashEffort(context),
        onClick: async () => {
          await this.taskStatusService.trashEffort(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Trashed effort: ${file.path}`);
        },
      },
      {
        id: "archive",
        label: "Archive",
        variant: "danger",
        visible: canArchiveTask(context),
        onClick: async () => {
          await this.taskStatusService.archiveTask(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Archived task: ${file.path}`);
        },
      },
      {
        id: "clean-properties",
        label: "Clean Properties",
        variant: "secondary",
        visible: canCleanProperties(context),
        onClick: async () => {
          await this.propertyCleanupService.cleanEmptyProperties(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Cleaned empty properties: ${file.path}`);
        },
      },
      {
        id: "repair-folder",
        label: "Repair Folder",
        variant: "secondary",
        visible: canRepairFolder(context),
        onClick: async () => {
          if (expectedFolder) {
            await this.folderRepairService.repairFolder(file, expectedFolder);
            await new Promise((resolve) => setTimeout(resolve, 100));
            await this.refresh();
            this.logger.info(`Repaired folder for ${file.path}: ${currentFolder} -> ${expectedFolder}`);
          }
        },
      },
      {
        id: "rename-to-uid",
        label: "Rename to UID",
        variant: "secondary",
        visible: canRenameToUid(context, file.basename),
        onClick: async () => {
          const oldName = file.basename;
          const uid = metadata.exo__Asset_uid;
          await this.renameToUidService.renameToUid(file, metadata);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Renamed "${oldName}" to "${uid}"`);
        },
      },
    ];

    if (maintenanceButtons.some(btn => btn.visible)) {
      groups.push({
        id: "maintenance",
        title: "Maintenance",
        buttons: maintenanceButtons,
      });
    }

    return groups;
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

      // Render action buttons with semantic grouping
      const buttonGroups = await this.buildActionButtonGroups(currentFile);
      if (buttonGroups.length > 0) {
        const buttonsContainer = el.createDiv({ cls: "exocortex-buttons-section" });
        this.reactRenderer.render(
          buttonsContainer,
          React.createElement(ActionButtonsGroup, { groups: buttonGroups }),
        );
      }

      // Render asset properties
      await this.renderAssetProperties(el, currentFile);

      // Render daily tasks for pn__DailyNote assets
      await this.renderDailyTasks(el, currentFile);

      // Get asset relations for the current file
      const relations = await this.getAssetRelations(currentFile, config);

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

    const source = this.rootContainer.getAttribute("data-source") || "";
    this.rootContainer.empty();
    await this.render(source, this.rootContainer, {} as MarkdownPostProcessorContext);
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

    // Build reverse index if needed (amortized O(1) per call)
    this.buildBacklinksCache();

    // O(1) lookup of backlinks instead of O(n) iteration
    const backlinks = this.backlinksCache.get(file.path);
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

        // Skip archived assets
        if (this.isAssetArchived(metadata)) {
          continue;
        }

        // Find ALL properties that reference the current file
        const referencingProperties = this.findAllReferencingProperties(
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
            created: sourceFile.stat.ctime,
            modified: sourceFile.stat.mtime,
          };
          relations.push(relation);
        }
      }
    }

    // Sort relations
    if (config.sortBy) {
      const sortBy = config.sortBy;
      relations.sort((a, b) => {
        const aVal = this.getPropertyValue(a, sortBy);
        const bVal = this.getPropertyValue(b, sortBy);
        const order = config.sortOrder === "desc" ? -1 : 1;
        return aVal > bVal ? order : -order;
      });
    }

    return relations;
  }

  /**
   * Render asset properties for the current file
   */
  /**
   * Render Create Task button for Area and Project assets
   * Button appears when exo__Instance_class is ems__Area or ems__Project
   */
  private async renderCreateTaskButton(
    el: HTMLElement,
    file: TFile,
  ): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};
    const instanceClass = metadata.exo__Instance_class || null;

    const container = el.createDiv({ cls: "exocortex-create-task-wrapper" });

    // Extract clean source class for service
    const getCleanSourceClass = (): string => {
      if (!instanceClass) return "";
      const classes = Array.isArray(instanceClass)
        ? instanceClass
        : [instanceClass];
      const firstClass = classes[0] || "";
      return firstClass.replace(/\[\[|\]\]/g, "").trim();
    };

    this.reactRenderer.render(
      container,
      React.createElement(CreateTaskButton, {
        instanceClass,
        metadata,
        sourceFile: file,
        onTaskCreate: async () => {
          // Show modal and wait for user input
          const label = await new Promise<string | null>((resolve) => {
            new LabelInputModal(this.app, resolve).open();
          });

          // User cancelled
          if (label === null) {
            return;
          }

          const sourceClass = getCleanSourceClass();

          // Create the task file with appropriate effort property
          const createdFile = await this.taskCreationService.createTask(
            file,
            metadata,
            sourceClass,
            label,
          );

          // Open the created file in a new tab
          const leaf = this.app.workspace.getLeaf("tab");
          await leaf.openFile(createdFile);

          // Switch focus to the new tab
          this.app.workspace.setActiveLeaf(leaf, { focus: true });

          this.logger.info(`Created Task from ${sourceClass}: ${createdFile.path}`)
        },
      }),
    );
  }

  /**
   * Render Create Instance button for TaskPrototype assets
   * Button appears when exo__Instance_class is ems__TaskPrototype
   */
  private async renderCreateInstanceButton(
    el: HTMLElement,
    file: TFile,
  ): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};
    const instanceClass = metadata.exo__Instance_class || null;

    const container = el.createDiv({ cls: "exocortex-create-instance-wrapper" });

    // Extract clean source class for service
    const getCleanSourceClass = (): string => {
      if (!instanceClass) return "";
      const classes = Array.isArray(instanceClass)
        ? instanceClass
        : [instanceClass];
      const firstClass = classes[0] || "";
      return firstClass.replace(/\[\[|\]\]/g, "").trim();
    };

    this.reactRenderer.render(
      container,
      React.createElement(CreateInstanceButton, {
        instanceClass,
        metadata,
        sourceFile: file,
        onInstanceCreate: async () => {
          // Show modal and wait for user input
          const label = await new Promise<string | null>((resolve) => {
            new LabelInputModal(this.app, resolve).open();
          });

          // User cancelled
          if (label === null) {
            return;
          }

          const sourceClass = getCleanSourceClass();

          // Create the instance (task) from prototype with ems__Effort_prototype property
          const createdFile = await this.taskCreationService.createTask(
            file,
            metadata,
            sourceClass,
            label,
          );

          // Open the created file in a new tab
          const leaf = this.app.workspace.getLeaf("tab");
          await leaf.openFile(createdFile);

          // Switch focus to the new tab
          this.app.workspace.setActiveLeaf(leaf, { focus: true });

          this.logger.info(`Created Instance from TaskPrototype: ${createdFile.path}`);
        },
      }),
    );
  }

  private async renderMoveToBacklogButton(
    el: HTMLElement,
    file: TFile,
  ): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};
    const instanceClass = metadata.exo__Instance_class || null;
    const currentStatus = metadata.ems__Effort_status || null;

    const container = el.createDiv({ cls: "exocortex-move-to-backlog-wrapper" });

    this.reactRenderer.render(
      container,
      React.createElement(MoveToBacklogButton, {
        instanceClass,
        currentStatus,
        sourceFile: file,
        onMoveToBacklog: async () => {
          await this.taskStatusService.moveToBacklog(file);

          await new Promise((resolve) => setTimeout(resolve, 100));

          await this.refresh(el);

          this.logger.info(`Moved to Backlog: ${file.path}`);
        },
      }),
    );
  }

  private async renderMarkTaskDoneButton(
    el: HTMLElement,
    file: TFile,
  ): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};
    const instanceClass = metadata.exo__Instance_class || null;
    const currentStatus = metadata.ems__Effort_status || null;

    const container = el.createDiv({ cls: "exocortex-mark-done-wrapper" });

    this.reactRenderer.render(
      container,
      React.createElement(MarkTaskDoneButton, {
        instanceClass,
        currentStatus,
        sourceFile: file,
        onMarkDone: async () => {
          await this.taskStatusService.markTaskAsDone(file);

          await new Promise((resolve) => setTimeout(resolve, 100));

          await this.refresh(el);

          this.logger.info(`Marked task as Done: ${file.path}`);
        },
      }),
    );
  }

  private async renderTrashEffortButton(
    el: HTMLElement,
    file: TFile,
  ): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};
    const instanceClass = metadata.exo__Instance_class || null;
    const currentStatus = metadata.ems__Effort_status || null;

    const container = el.createDiv({ cls: "exocortex-trash-effort-wrapper" });

    this.reactRenderer.render(
      container,
      React.createElement(TrashEffortButton, {
        instanceClass,
        currentStatus,
        sourceFile: file,
        onTrash: async () => {
          await this.taskStatusService.trashEffort(file);

          await new Promise((resolve) => setTimeout(resolve, 100));

          await this.refresh(el);

          this.logger.info(`Trashed effort: ${file.path}`);
        },
      }),
    );
  }

  private async renderArchiveTaskButton(
    el: HTMLElement,
    file: TFile,
  ): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};
    const instanceClass = metadata.exo__Instance_class || null;
    const currentStatus = metadata.ems__Effort_status || null;
    const isArchived =
      metadata.archived ?? metadata.exo__Asset_isArchived ?? null;

    const container = el.createDiv({ cls: "exocortex-archive-task-wrapper" });

    this.reactRenderer.render(
      container,
      React.createElement(ArchiveTaskButton, {
        instanceClass,
        currentStatus,
        isArchived,
        sourceFile: file,
        onArchive: async () => {
          await this.taskStatusService.archiveTask(file);

          await new Promise((resolve) => setTimeout(resolve, 100));

          await this.refresh(el);

          this.logger.info(`Archived task: ${file.path}`);
        },
      }),
    );
  }

  private async renderStartEffortButton(
    el: HTMLElement,
    file: TFile,
  ): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};
    const instanceClass = metadata.exo__Instance_class || null;
    const currentStatus = metadata.ems__Effort_status || null;

    const container = el.createDiv({ cls: "exocortex-start-effort-wrapper" });

    this.reactRenderer.render(
      container,
      React.createElement(StartEffortButton, {
        instanceClass,
        currentStatus,
        sourceFile: file,
        onStartEffort: async () => {
          await this.taskStatusService.startEffort(file);

          await new Promise((resolve) => setTimeout(resolve, 100));

          await this.refresh(el);

          this.logger.info(`Started effort: ${file.path}`);
        },
      }),
    );
  }

  /**
   * Render Plan on Today button for Task and Project assets
   * Button appears when exo__Instance_class is ems__Task or ems__Project
   */
  private async renderPlanOnTodayButton(
    el: HTMLElement,
    file: TFile,
  ): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};
    const instanceClass = metadata.exo__Instance_class || null;

    const container = el.createDiv({ cls: "exocortex-plan-on-today-wrapper" });

    this.reactRenderer.render(
      container,
      React.createElement(PlanOnTodayButton, {
        instanceClass,
        metadata,
        sourceFile: file,
        onPlanOnToday: async () => {
          await this.taskStatusService.planOnToday(file);

          await new Promise((resolve) => setTimeout(resolve, 100));

          await this.refresh(el);

          this.logger.info(`Planned on today: ${file.path}`);
        },
      }),
    );
  }

  private async renderShiftDayBackwardButton(
    el: HTMLElement,
    file: TFile,
  ): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};
    const instanceClass = metadata.exo__Instance_class || null;

    const container = el.createDiv({ cls: "exocortex-shift-day-backward-wrapper" });

    this.reactRenderer.render(
      container,
      React.createElement(ShiftDayBackwardButton, {
        instanceClass,
        metadata,
        sourceFile: file,
        onShiftDayBackward: async () => {
          await this.taskStatusService.shiftDayBackward(file);

          await new Promise((resolve) => setTimeout(resolve, 100));

          await this.refresh(el);

          this.logger.info(`Day shifted backward: ${file.path}`);
        },
      }),
    );
  }

  private async renderShiftDayForwardButton(
    el: HTMLElement,
    file: TFile,
  ): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};
    const instanceClass = metadata.exo__Instance_class || null;

    const container = el.createDiv({ cls: "exocortex-shift-day-forward-wrapper" });

    this.reactRenderer.render(
      container,
      React.createElement(ShiftDayForwardButton, {
        instanceClass,
        metadata,
        sourceFile: file,
        onShiftDayForward: async () => {
          await this.taskStatusService.shiftDayForward(file);

          await new Promise((resolve) => setTimeout(resolve, 100));

          await this.refresh(el);

          this.logger.info(`Day shifted forward: ${file.path}`);
        },
      }),
    );
  }

  private async renderCleanEmptyPropertiesButton(
    el: HTMLElement,
    file: TFile,
  ): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};

    const container = el.createDiv({
      cls: "exocortex-clean-properties-wrapper",
    });

    this.reactRenderer.render(
      container,
      React.createElement(CleanEmptyPropertiesButton, {
        sourceFile: file,
        metadata,
        onCleanup: async () => {
          await this.propertyCleanupService.cleanEmptyProperties(file);

          await new Promise((resolve) => setTimeout(resolve, 100));

          await this.refresh(el);

          this.logger.info(`Cleaned empty properties: ${file.path}`);
        },
      }),
    );
  }

  private async renderRepairFolderButton(
    el: HTMLElement,
    file: TFile,
  ): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};

    // Get current folder
    const currentFolder = file.parent?.path || "";

    // Get expected folder based on exo__Asset_isDefinedBy
    const expectedFolder = await this.folderRepairService.getExpectedFolder(
      file,
      metadata,
    );

    const container = el.createDiv({
      cls: "exocortex-repair-folder-wrapper",
    });

    this.reactRenderer.render(
      container,
      React.createElement(RepairFolderButton, {
        sourceFile: file,
        currentFolder,
        expectedFolder,
        onRepair: async () => {
          if (expectedFolder) {
            await this.folderRepairService.repairFolder(file, expectedFolder);

            await new Promise((resolve) => setTimeout(resolve, 100));

            await this.refresh(el);

            this.logger.info(
              `Repaired folder for ${file.path}: ${currentFolder} -> ${expectedFolder}`,
            );
          }
        },
      }),
    );
  }

  private async renderRenameToUidButton(
    el: HTMLElement,
    file: TFile,
  ): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};

    const container = el.createDiv({
      cls: "exocortex-rename-to-uid-wrapper",
    });

    this.reactRenderer.render(
      container,
      React.createElement(RenameToUidButton, {
        file,
        metadata,
        onRename: async () => {
          const oldName = file.basename;
          const uid = metadata.exo__Asset_uid;

          await this.renameToUidService.renameToUid(file, metadata);

          await new Promise((resolve) => setTimeout(resolve, 100));

          await this.refresh(el);

          this.logger.info(`Renamed "${oldName}" to "${uid}"`);
        },
      }),
    );
  }

  private async renderAssetProperties(
    el: HTMLElement,
    file: TFile,
  ): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};

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

  private async renderDailyTasks(
    el: HTMLElement,
    file: TFile,
  ): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};
    const instanceClass = metadata.exo__Instance_class || null;

    // Check if this is a pn__DailyNote
    const classes = Array.isArray(instanceClass)
      ? instanceClass
      : [instanceClass];
    const isDailyNote = classes.some(
      (c: string) => c === "[[pn__DailyNote]]" || c === "pn__DailyNote",
    );

    if (!isDailyNote) {
      return;
    }

    // Get the day from metadata
    const dayProperty = metadata.pn__DailyNote_day;
    if (!dayProperty) {
      this.logger.debug("No pn__DailyNote_day found for daily note");
      return;
    }

    // Extract day link: [[2025-10-16]] -> 2025-10-16
    const dayMatch =
      typeof dayProperty === "string"
        ? dayProperty.match(/\[\[(.+?)\]\]/)
        : null;
    const day = dayMatch ? dayMatch[1] : String(dayProperty).replace(/^\[\[|\]\]$/g, "");

    // Dataview no longer required - we use Vault API directly
    // Get daily tasks
    const tasks = await this.getDailyTasks(day);

    if (tasks.length === 0) {
      this.logger.debug(`No tasks found for day: ${day}`);
      return;
    }

    // Render the tasks table
    const sectionContainer = el.createDiv({ cls: "exocortex-daily-tasks-section" });

    // Add section header
    sectionContainer.createEl("h3", {
      text: "Tasks",
      cls: "exocortex-section-header",
    });

    // Create separate container for React component to prevent header replacement
    const tableContainer = sectionContainer.createDiv({ cls: "exocortex-daily-tasks-table-container" });

    this.reactRenderer.render(
      tableContainer,
      React.createElement(DailyTasksTable, {
        tasks,
        onTaskClick: async (path: string, event: React.MouseEvent) => {
          // Use Obsidian's Keymap.isModEvent to detect Cmd/Ctrl properly
          const isModPressed = Keymap.isModEvent(
            event.nativeEvent as MouseEvent,
          );

          if (isModPressed) {
            // Open in new tab
            const leaf = this.app.workspace.getLeaf("tab");
            await leaf.openLinkText(path, "");
          } else {
            // Open in current tab
            await this.app.workspace.openLinkText(path, "", false);
          }
        },
        getAssetLabel: (path: string) => this.getAssetLabel(path),
      }),
    );

    this.logger.info(`Rendered ${tasks.length} tasks for DailyNote: ${day}`);
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

  /**
   * Get asset label for display (exo__Asset_label or prototype's label)
   * Fallback chain:
   * 1. Asset's own exo__Asset_label
   * 2. Prototype's exo__Asset_label (via ems__Effort_prototype)
   * 3. null (caller should use filename)
   */
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

  /**
   * Helper method to get property value from relation
   */
  private getPropertyValue(
    relation: AssetRelation,
    propertyName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    if (propertyName === "Name") return relation.title;
    if (propertyName === "title") return relation.title;
    if (propertyName === "created") return relation.created;
    if (propertyName === "modified") return relation.modified;
    if (propertyName === "path") return relation.path;
    return relation.metadata?.[propertyName];
  }

  /**
   * Helper method to find referencing property
   */
  /**
   * Find ALL properties that reference the current file
   * Returns array of property names (can be multiple if same file is referenced via different properties)
   */
  private findAllReferencingProperties(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: Record<string, any>,
    currentFileName: string,
  ): string[] {
    const properties: string[] = [];
    for (const [key, value] of Object.entries(metadata)) {
      if (this.containsReference(value, currentFileName)) {
        properties.push(key);
      }
    }
    return properties;
  }

  private findReferencingProperty(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: Record<string, any>,
    currentFileName: string,
  ): string | undefined {
    for (const [key, value] of Object.entries(metadata)) {
      if (this.containsReference(value, currentFileName)) {
        return key;
      }
    }
    return undefined;
  }

  /**
   * Check if a value contains a reference to a file
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private containsReference(value: any, fileName: string): boolean {
    if (!value) return false;

    const cleanName = fileName.replace(/\.md$/, "");

    if (typeof value === "string") {
      return value.includes(`[[${cleanName}]]`) || value.includes(cleanName);
    }

    if (Array.isArray(value)) {
      return value.some((v) => this.containsReference(v, fileName));
    }

    return false;
  }

  /**
   * Check if an asset is archived based on frontmatter metadata
   * Supports multiple archived field formats:
   * - archived: true (boolean)
   * - archived: "true" or "yes" (string)
   * - archived: 1 (number)
   * Also checks legacy exo__Asset_isArchived field for backward compatibility
   */
  private isAssetArchived(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: Record<string, any>,
  ): boolean {
    // Check legacy field first
    if (metadata?.exo__Asset_isArchived === true) {
      return true;
    }

    // Check standard 'archived' field
    const archivedValue = metadata?.archived;

    if (archivedValue === undefined || archivedValue === null) {
      return false;
    }

    // Handle boolean
    if (typeof archivedValue === "boolean") {
      return archivedValue;
    }

    // Handle number (1 = archived, 0 = not archived)
    if (typeof archivedValue === "number") {
      return archivedValue !== 0;
    }

    // Handle string ("true", "yes" = archived, "false", "no" = not archived)
    if (typeof archivedValue === "string") {
      const normalized = archivedValue.toLowerCase().trim();
      return (
        normalized === "true" || normalized === "yes" || normalized === "1"
      );
    }

    return false;
  }

  private async getDailyTasks(
    day: string,
  ): Promise<DailyTask[]> {
    try {
      const tasks: DailyTask[] = [];

      // Use Obsidian vault API to get all markdown files directly
      const allFiles = this.app.vault.getMarkdownFiles();

      for (const file of allFiles) {
        const cache = this.app.metadataCache.getFileCache(file);
        const metadata = cache?.frontmatter || {};

        const effortDay = metadata.ems__Effort_day;

        if (!effortDay) {
          continue;
        }

        const effortDayStr = String(effortDay).replace(/^\[\[|\]\]$/g, "");

        if (effortDayStr !== day) {
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

        const isDone = effortStatusStr === "ems__EffortStatusDone";
        const isTrashed = effortStatusStr === "ems__EffortStatusTrashed";
        const instanceClass = metadata.exo__Instance_class || [];
        const instanceClassArray = Array.isArray(instanceClass)
          ? instanceClass
          : [instanceClass];
        const isMeeting = instanceClassArray.some(
          (c: string) => String(c).includes("ems__Meeting"),
        );

        const label = metadata.exo__Asset_label || file.basename;

        tasks.push({
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
          isMeeting,
        });
      }

      tasks.sort((a, b) => {
        if (a.isTrashed !== b.isTrashed) {
          return a.isTrashed ? 1 : -1;
        }

        if (a.isDone !== b.isDone) {
          return a.isDone ? 1 : -1;
        }

        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime);
        }

        if (a.startTime) return -1;
        if (b.startTime) return 1;

        return 0;
      });

      return tasks.slice(0, 50);
    } catch (error) {
      this.logger.error("Failed to get daily tasks", { error });
      return [];
    }
  }
}
