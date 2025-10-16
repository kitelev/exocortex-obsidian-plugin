import { App, TFile, Notice } from "obsidian";
import {
  CommandVisibilityContext,
  canCreateTask,
  canCreateInstance,
  canMoveToBacklog,
  canStartEffort,
  canPlanOnToday,
  canMarkDone,
  canTrashEffort,
  canArchiveTask,
  canCleanProperties,
  canRepairFolder,
  canRenameToUid,
  canShiftDayBackward,
  canShiftDayForward,
} from "../../domain/commands/CommandVisibility";
import { TaskCreationService } from "../../infrastructure/services/TaskCreationService";
import { TaskStatusService } from "../../infrastructure/services/TaskStatusService";
import { PropertyCleanupService } from "../../infrastructure/services/PropertyCleanupService";
import { FolderRepairService } from "../../infrastructure/services/FolderRepairService";
import { SupervisionCreationService } from "../../infrastructure/services/SupervisionCreationService";
import { RenameToUidService } from "../../infrastructure/services/RenameToUidService";
import { LabelInputModal } from "../../presentation/modals/LabelInputModal";
import { SupervisionInputModal } from "../../presentation/modals/SupervisionInputModal";

/**
 * Command Manager Service
 * Manages registration and dynamic availability of Obsidian commands
 *
 * Pattern: Facade + Observer
 * - Facade: Provides simple interface for command registration
 * - Observer: Listens to file changes and updates command availability
 *
 * Responsibility:
 * - Register all asset-related commands in Command Palette
 * - Determine command availability based on current file context
 * - Execute commands by delegating to appropriate services
 */
export class CommandManager {
  private taskCreationService: TaskCreationService;
  private taskStatusService: TaskStatusService;
  private propertyCleanupService: PropertyCleanupService;
  private folderRepairService: FolderRepairService;
  private supervisionCreationService: SupervisionCreationService;
  private renameToUidService: RenameToUidService;
  private reloadLayoutCallback?: () => void;

  constructor(private app: App) {
    this.taskCreationService = new TaskCreationService(app.vault);
    this.taskStatusService = new TaskStatusService(app.vault);
    this.propertyCleanupService = new PropertyCleanupService(app.vault);
    this.folderRepairService = new FolderRepairService(app.vault, app);
    this.supervisionCreationService = new SupervisionCreationService(app.vault);
    this.renameToUidService = new RenameToUidService(app);
  }

  /**
   * Register all commands in Obsidian Command Palette
   * Call this once during plugin initialization
   */
  registerAllCommands(plugin: any, reloadLayoutCallback?: () => void): void {
    this.reloadLayoutCallback = reloadLayoutCallback;

    this.registerCreateTaskCommand(plugin);
    this.registerCreateInstanceCommand(plugin);
    this.registerMoveToBacklogCommand(plugin);
    this.registerStartEffortCommand(plugin);
    this.registerPlanOnTodayCommand(plugin);
    this.registerShiftDayBackwardCommand(plugin);
    this.registerShiftDayForwardCommand(plugin);
    this.registerMarkDoneCommand(plugin);
    this.registerTrashCommand(plugin);
    this.registerArchiveTaskCommand(plugin);
    this.registerCleanPropertiesCommand(plugin);
    this.registerRepairFolderCommand(plugin);
    this.registerRenameToUidCommand(plugin);
    this.registerReloadLayoutCommand(plugin);
    this.registerAddSupervisionCommand(plugin);
  }

  /**
   * Get visibility context for current active file
   * Note: expectedFolder is set to null for synchronous checking.
   * Individual command handlers will fetch it async when needed.
   */
  private getContext(file: TFile): CommandVisibilityContext | null {
    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};

    const instanceClass = metadata.exo__Instance_class || null;
    const currentStatus = metadata.ems__Effort_status || null;
    const isArchived =
      metadata.archived ?? metadata.exo__Asset_isArchived ?? false;

    const currentFolder = file.parent?.path || "";

    return {
      instanceClass,
      currentStatus,
      metadata,
      isArchived,
      currentFolder,
      expectedFolder: null, // Will be fetched async by repair folder command
    };
  }

  /**
   * Register "Exocortex: Create Task" command
   */
  private registerCreateTaskCommand(plugin: any): void {
    plugin.addCommand({
      id: "create-task",
      name: "Create Task",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;

        const context = this.getContext(file);
        if (!context || !canCreateTask(context)) return false;

        if (!checking) {
          this.executeCreateTask(file, context).catch((error) => {
            new Notice(`Failed to create task: ${error.message}`);
            console.error("Create task error:", error);
          });
        }

        return true;
      },
    });
  }

  /**
   * Register "Exocortex: Create Instance" command
   */
  private registerCreateInstanceCommand(plugin: any): void {
    plugin.addCommand({
      id: "create-instance",
      name: "Create Instance",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;

        const context = this.getContext(file);
        if (!context || !canCreateInstance(context)) return false;

        if (!checking) {
          this.executeCreateInstance(file, context).catch((error) => {
            new Notice(`Failed to create instance: ${error.message}`);
            console.error("Create instance error:", error);
          });
        }

        return true;
      },
    });
  }

  /**
   * Register "Exocortex: Move to Backlog" command
   */
  private registerMoveToBacklogCommand(plugin: any): void {
    plugin.addCommand({
      id: "move-to-backlog",
      name: "Move to Backlog",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;

        const context = this.getContext(file);
        if (!context || !canMoveToBacklog(context)) return false;

        if (!checking) {
          this.executeMoveToBacklog(file).catch((error) => {
            new Notice(`Failed to move to backlog: ${error.message}`);
            console.error("Move to backlog error:", error);
          });
        }

        return true;
      },
    });
  }

  /**
   * Register "Exocortex: Start Effort" command
   */
  private registerStartEffortCommand(plugin: any): void {
    plugin.addCommand({
      id: "start-effort",
      name: "Start Effort",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;

        const context = this.getContext(file);
        if (!context || !canStartEffort(context)) return false;

        if (!checking) {
          this.executeStartEffort(file).catch((error) => {
            new Notice(`Failed to start effort: ${error.message}`);
            console.error("Start effort error:", error);
          });
        }

        return true;
      },
    });
  }

  /**
   * Register "Exocortex: Plan on today" command
   */
  private registerPlanOnTodayCommand(plugin: any): void {
    plugin.addCommand({
      id: "plan-on-today",
      name: "Plan on today",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;

        const context = this.getContext(file);
        if (!context || !canPlanOnToday(context)) return false;

        if (!checking) {
          this.executePlanOnToday(file).catch((error) => {
            new Notice(`Failed to plan on today: ${error.message}`);
            console.error("Plan on today error:", error);
          });
        }

        return true;
      },
    });
  }

  /**
   * Register "Exocortex: Shift Day Backward" command
   */
  private registerShiftDayBackwardCommand(plugin: any): void {
    plugin.addCommand({
      id: "shift-day-backward",
      name: "Shift Day Backward",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;

        const context = this.getContext(file);
        if (!context || !canShiftDayBackward(context)) return false;

        if (!checking) {
          this.executeShiftDayBackward(file).catch((error) => {
            new Notice(`Failed to shift day backward: ${error.message}`);
            console.error("Shift day backward error:", error);
          });
        }

        return true;
      },
    });
  }

  /**
   * Register "Exocortex: Shift Day Forward" command
   */
  private registerShiftDayForwardCommand(plugin: any): void {
    plugin.addCommand({
      id: "shift-day-forward",
      name: "Shift Day Forward",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;

        const context = this.getContext(file);
        if (!context || !canShiftDayForward(context)) return false;

        if (!checking) {
          this.executeShiftDayForward(file).catch((error) => {
            new Notice(`Failed to shift day forward: ${error.message}`);
            console.error("Shift day forward error:", error);
          });
        }

        return true;
      },
    });
  }

  /**
   * Register "Exocortex: Mark as Done" command
   */
  private registerMarkDoneCommand(plugin: any): void {
    plugin.addCommand({
      id: "mark-done",
      name: "Mark as Done",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;

        const context = this.getContext(file);
        if (!context || !canMarkDone(context)) return false;

        if (!checking) {
          this.executeMarkDone(file).catch((error) => {
            new Notice(`Failed to mark as done: ${error.message}`);
            console.error("Mark done error:", error);
          });
        }

        return true;
      },
    });
  }

  /**
   * Register "Exocortex: Trash" command
   */
  private registerTrashCommand(plugin: any): void {
    plugin.addCommand({
      id: "trash-effort",
      name: "Trash",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;

        const context = this.getContext(file);
        if (!context || !canTrashEffort(context)) return false;

        if (!checking) {
          this.executeTrashEffort(file).catch((error) => {
            new Notice(`Failed to trash effort: ${error.message}`);
            console.error("Trash effort error:", error);
          });
        }

        return true;
      },
    });
  }

  /**
   * Register "Exocortex: Archive Task" command
   */
  private registerArchiveTaskCommand(plugin: any): void {
    plugin.addCommand({
      id: "archive-task",
      name: "Archive Task",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;

        const context = this.getContext(file);
        if (!context || !canArchiveTask(context)) return false;

        if (!checking) {
          this.executeArchiveTask(file).catch((error) => {
            new Notice(`Failed to archive task: ${error.message}`);
            console.error("Archive task error:", error);
          });
        }

        return true;
      },
    });
  }

  /**
   * Register "Exocortex: Clean Empty Properties" command
   */
  private registerCleanPropertiesCommand(plugin: any): void {
    plugin.addCommand({
      id: "clean-properties",
      name: "Clean Empty Properties",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;

        const context = this.getContext(file);
        if (!context || !canCleanProperties(context)) return false;

        if (!checking) {
          this.executeCleanProperties(file).catch((error) => {
            new Notice(`Failed to clean properties: ${error.message}`);
            console.error("Clean properties error:", error);
          });
        }

        return true;
      },
    });
  }

  /**
   * Register "Exocortex: Repair Folder" command
   * Note: Shows command if asset has exo__Asset_isDefinedBy property.
   * Actual folder mismatch check happens during execution.
   */
  private registerRepairFolderCommand(plugin: any): void {
    plugin.addCommand({
      id: "repair-folder",
      name: "Repair Folder",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;

        const cache = this.app.metadataCache.getFileCache(file);
        const metadata = cache?.frontmatter || {};

        // Show command if asset has isDefinedBy property
        // Actual folder check happens in executeRepairFolder
        if (!metadata?.exo__Asset_isDefinedBy) return false;

        if (!checking) {
          this.executeRepairFolder(file, metadata).catch((error) => {
            new Notice(`Failed to repair folder: ${error.message}`);
            console.error("Repair folder error:", error);
          });
        }

        return true;
      },
    });
  }

  /**
   * Register "Exocortex: Rename to UID" command
   * Shows when filename doesn't match exo__Asset_uid
   */
  private registerRenameToUidCommand(plugin: any): void {
    plugin.addCommand({
      id: "rename-to-uid",
      name: "Rename to UID",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;

        const context = this.getContext(file);
        if (!context || !canRenameToUid(context, file.basename)) return false;

        if (!checking) {
          this.executeRenameToUid(file, context.metadata).catch((error) => {
            new Notice(`Failed to rename: ${error.message}`);
            console.error("Rename to UID error:", error);
          });
        }

        return true;
      },
    });
  }

  /**
   * Register "Exocortex: Reload Layout" command
   * Always available - reloads the Layout display in current note
   */
  private registerReloadLayoutCommand(plugin: any): void {
    plugin.addCommand({
      id: "reload-layout",
      name: "Reload Layout",
      callback: () => {
        if (this.reloadLayoutCallback) {
          this.reloadLayoutCallback();
          new Notice("Layout reloaded");
        } else {
          new Notice("Failed to reload layout");
        }
      },
    });
  }

  /**
   * Register "Exocortex: Add Supervision" command
   * Always available - creates a new Supervision FleetingNote
   */
  private registerAddSupervisionCommand(plugin: any): void {
    plugin.addCommand({
      id: "add-supervision",
      name: "Add Supervision",
      callback: () => {
        this.executeAddSupervision().catch((error) => {
          new Notice(`Failed to create supervision: ${error.message}`);
          console.error("Add supervision error:", error);
        });
      },
    });
  }

  // ============================================================================
  // Command Execution Methods
  // ============================================================================

  private async executeCreateTask(
    file: TFile,
    context: CommandVisibilityContext,
  ): Promise<void> {
    // Show modal and wait for user input
    const label = await new Promise<string | null>((resolve) => {
      new LabelInputModal(this.app, resolve).open();
    });

    // User cancelled
    if (label === null) {
      return;
    }

    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};

    // Extract clean source class
    const instanceClass = context.instanceClass;
    const classes = Array.isArray(instanceClass)
      ? instanceClass
      : [instanceClass];
    const firstClass = classes[0] || "";
    const sourceClass = firstClass.replace(/\[\[|\]\]/g, "").trim();

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

    new Notice(`Task created: ${createdFile.basename}`);
  }

  private async executeCreateInstance(
    file: TFile,
    context: CommandVisibilityContext,
  ): Promise<void> {
    // Show modal and wait for user input
    const label = await new Promise<string | null>((resolve) => {
      new LabelInputModal(this.app, resolve).open();
    });

    // User cancelled
    if (label === null) {
      return;
    }

    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};

    // Extract clean source class (ems__TaskPrototype)
    const instanceClass = context.instanceClass;
    const classes = Array.isArray(instanceClass)
      ? instanceClass
      : [instanceClass];
    const firstClass = classes[0] || "";
    const sourceClass = firstClass.replace(/\[\[|\]\]/g, "").trim();

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

    new Notice(`Instance created: ${createdFile.basename}`);
  }

  private async executeMoveToBacklog(file: TFile): Promise<void> {
    await this.taskStatusService.moveToBacklog(file);
    new Notice(`Moved to Backlog: ${file.basename}`);
  }

  private async executeStartEffort(file: TFile): Promise<void> {
    await this.taskStatusService.startEffort(file);
    new Notice(`Started effort: ${file.basename}`);
  }

  private async executePlanOnToday(file: TFile): Promise<void> {
    await this.taskStatusService.planOnToday(file);
    new Notice(`Planned on today: ${file.basename}`);
  }

  private async executeShiftDayBackward(file: TFile): Promise<void> {
    await this.taskStatusService.shiftDayBackward(file);
    new Notice(`Day shifted backward: ${file.basename}`);
  }

  private async executeShiftDayForward(file: TFile): Promise<void> {
    await this.taskStatusService.shiftDayForward(file);
    new Notice(`Day shifted forward: ${file.basename}`);
  }

  private async executeMarkDone(file: TFile): Promise<void> {
    await this.taskStatusService.markTaskAsDone(file);
    new Notice(`Marked as done: ${file.basename}`);
  }

  private async executeTrashEffort(file: TFile): Promise<void> {
    await this.taskStatusService.trashEffort(file);
    new Notice(`Trashed: ${file.basename}`);
  }

  private async executeArchiveTask(file: TFile): Promise<void> {
    await this.taskStatusService.archiveTask(file);
    new Notice(`Archived: ${file.basename}`);
  }

  private async executeCleanProperties(file: TFile): Promise<void> {
    await this.propertyCleanupService.cleanEmptyProperties(file);
    new Notice(`Cleaned empty properties: ${file.basename}`);
  }

  private async executeRepairFolder(
    file: TFile,
    metadata: Record<string, any>,
  ): Promise<void> {
    const expectedFolder = await this.folderRepairService.getExpectedFolder(
      file,
      metadata,
    );

    if (!expectedFolder) {
      new Notice("No expected folder found");
      return;
    }

    const currentFolder = file.parent?.path || "";
    if (currentFolder === expectedFolder) {
      new Notice("Asset is already in correct folder");
      return;
    }

    await this.folderRepairService.repairFolder(file, expectedFolder);
    new Notice(`Moved to ${expectedFolder}`);
  }

  private async executeAddSupervision(): Promise<void> {
    const formData = await new Promise<any>((resolve) => {
      new SupervisionInputModal(this.app, resolve).open();
    });

    if (formData === null) {
      return;
    }

    const createdFile = await this.supervisionCreationService.createSupervision(
      formData,
    );

    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.openFile(createdFile);

    this.app.workspace.setActiveLeaf(leaf, { focus: true });

    new Notice(`Supervision created: ${createdFile.basename}`);
  }

  private async executeRenameToUid(
    file: TFile,
    metadata: Record<string, any>,
  ): Promise<void> {
    const oldName = file.basename;
    const uid = metadata.exo__Asset_uid;

    await this.renameToUidService.renameToUid(file, metadata);

    new Notice(`Renamed "${oldName}" to "${uid}"`);
  }
}
