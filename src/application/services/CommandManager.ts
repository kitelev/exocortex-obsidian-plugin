import { App, TFile, Notice } from "obsidian";
import {
  CommandVisibilityContext,
  canCreateTask,
  canCreateProject,
  canCreateInstance,
  canCreateRelatedTask,
  canSetDraftStatus,
  canMoveToBacklog,
  canMoveToAnalysis,
  canMoveToToDo,
  canStartEffort,
  canPlanOnToday,
  canPlanForEvening,
  canMarkDone,
  canTrashEffort,
  canArchiveTask,
  canCleanProperties,
  canRepairFolder,
  canRenameToUid,
  canShiftDayBackward,
  canShiftDayForward,
  canVoteOnEffort,
  canCopyLabelToAliases,
} from "../../domain/commands/CommandVisibility";
import { TaskCreationService } from "../../infrastructure/services/TaskCreationService";
import { ProjectCreationService } from "../../infrastructure/services/ProjectCreationService";
import { TaskStatusService } from "../../infrastructure/services/TaskStatusService";
import { PropertyCleanupService } from "../../infrastructure/services/PropertyCleanupService";
import { FolderRepairService } from "../../infrastructure/services/FolderRepairService";
import { SupervisionCreationService } from "../../infrastructure/services/SupervisionCreationService";
import { RenameToUidService } from "../../infrastructure/services/RenameToUidService";
import { EffortVotingService } from "../../infrastructure/services/EffortVotingService";
import { LabelToAliasService } from "../../infrastructure/services/LabelToAliasService";
import { LabelInputModal, type LabelInputModalResult } from "../../presentation/modals/LabelInputModal";
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
  private projectCreationService: ProjectCreationService;
  private taskStatusService: TaskStatusService;
  private propertyCleanupService: PropertyCleanupService;
  private folderRepairService: FolderRepairService;
  private supervisionCreationService: SupervisionCreationService;
  private renameToUidService: RenameToUidService;
  private effortVotingService: EffortVotingService;
  private labelToAliasService: LabelToAliasService;
  private reloadLayoutCallback?: () => void;

  constructor(private app: App) {
    this.taskCreationService = new TaskCreationService(app.vault);
    this.projectCreationService = new ProjectCreationService(app.vault);
    this.taskStatusService = new TaskStatusService(app.vault);
    this.propertyCleanupService = new PropertyCleanupService(app.vault);
    this.folderRepairService = new FolderRepairService(app.vault, app);
    this.supervisionCreationService = new SupervisionCreationService(app.vault);
    this.renameToUidService = new RenameToUidService(app);
    this.effortVotingService = new EffortVotingService(app.vault);
    this.labelToAliasService = new LabelToAliasService(app.vault);
  }

  /**
   * Register all commands in Obsidian Command Palette
   * Call this once during plugin initialization
   */
  registerAllCommands(plugin: any, reloadLayoutCallback?: () => void): void {
    this.reloadLayoutCallback = reloadLayoutCallback;

    this.registerCreateTaskCommand(plugin);
    this.registerCreateProjectCommand(plugin);
    this.registerCreateInstanceCommand(plugin);
    this.registerCreateRelatedTaskCommand(plugin);
    this.registerSetDraftStatusCommand(plugin);
    this.registerMoveToBacklogCommand(plugin);
    this.registerMoveToAnalysisCommand(plugin);
    this.registerMoveToToDoCommand(plugin);
    this.registerStartEffortCommand(plugin);
    this.registerPlanOnTodayCommand(plugin);
    this.registerPlanForEveningCommand(plugin);
    this.registerShiftDayBackwardCommand(plugin);
    this.registerShiftDayForwardCommand(plugin);
    this.registerMarkDoneCommand(plugin);
    this.registerTrashCommand(plugin);
    this.registerArchiveTaskCommand(plugin);
    this.registerCleanPropertiesCommand(plugin);
    this.registerRepairFolderCommand(plugin);
    this.registerRenameToUidCommand(plugin);
    this.registerVoteOnEffortCommand(plugin);
    this.registerCopyLabelToAliasesCommand(plugin);
    this.registerReloadLayoutCommand(plugin);
    this.registerAddSupervisionCommand(plugin);
    this.registerTogglePropertiesVisibilityCommand(plugin);
    this.registerToggleLayoutVisibilityCommand(plugin);
    this.registerToggleArchivedAssetsCommand(plugin);
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
   * Register "Exocortex: Create Project" command
   */
  private registerCreateProjectCommand(plugin: any): void {
    plugin.addCommand({
      id: "create-project",
      name: "Create Project",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;

        const context = this.getContext(file);
        if (!context || !canCreateProject(context)) return false;

        if (!checking) {
          this.executeCreateProject(file, context).catch((error) => {
            new Notice(`Failed to create project: ${error.message}`);
            console.error("Create project error:", error);
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
   * Register "Exocortex: Create Related Task" command
   */
  private registerCreateRelatedTaskCommand(plugin: any): void {
    plugin.addCommand({
      id: "create-related-task",
      name: "Create Related Task",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;

        const context = this.getContext(file);
        if (!context || !canCreateRelatedTask(context)) return false;

        if (!checking) {
          this.executeCreateRelatedTask(file, context).catch((error) => {
            new Notice(`Failed to create related task: ${error.message}`);
            console.error("Create related task error:", error);
          });
        }

        return true;
      },
    });
  }

  /**
   * Register "Exocortex: Set Draft Status" command
   */
  private registerSetDraftStatusCommand(plugin: any): void {
    plugin.addCommand({
      id: "set-draft-status",
      name: "Set Draft Status",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;

        const context = this.getContext(file);
        if (!context || !canSetDraftStatus(context)) return false;

        if (!checking) {
          this.executeSetDraftStatus(file).catch((error) => {
            new Notice(`Failed to set draft status: ${error.message}`);
            console.error("Set draft status error:", error);
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
   * Register "Exocortex: Move to Analysis" command
   */
  private registerMoveToAnalysisCommand(plugin: any): void {
    plugin.addCommand({
      id: "move-to-analysis",
      name: "Move to Analysis",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;

        const context = this.getContext(file);
        if (!context || !canMoveToAnalysis(context)) return false;

        if (!checking) {
          this.executeMoveToAnalysis(file).catch((error) => {
            new Notice(`Failed to move to analysis: ${error.message}`);
            console.error("Move to analysis error:", error);
          });
        }

        return true;
      },
    });
  }

  /**
   * Register "Exocortex: Move to ToDo" command
   */
  private registerMoveToToDoCommand(plugin: any): void {
    plugin.addCommand({
      id: "move-to-todo",
      name: "Move to ToDo",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;

        const context = this.getContext(file);
        if (!context || !canMoveToToDo(context)) return false;

        if (!checking) {
          this.executeMoveToToDo(file).catch((error) => {
            new Notice(`Failed to move to todo: ${error.message}`);
            console.error("Move to todo error:", error);
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
   * Register "Exocortex: Plan for Evening" command
   */
  private registerPlanForEveningCommand(plugin: any): void {
    plugin.addCommand({
      id: "plan-for-evening",
      name: "Plan for Evening (19:00)",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;

        const context = this.getContext(file);
        if (!context || !canPlanForEvening(context)) return false;

        if (!checking) {
          this.executePlanForEvening(file).catch((error) => {
            new Notice(`Failed to plan for evening: ${error.message}`);
            console.error("Plan for evening error:", error);
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
   * Register "Exocortex: Vote on Effort" command
   * Available for Task and Project efforts (not archived)
   */
  private registerVoteOnEffortCommand(plugin: any): void {
    plugin.addCommand({
      id: "vote-on-effort",
      name: "Vote on Effort",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;

        const context = this.getContext(file);
        if (!context || !canVoteOnEffort(context)) return false;

        if (!checking) {
          this.executeVoteOnEffort(file).catch((error) => {
            new Notice(`Failed to vote: ${error.message}`);
            console.error("Vote on effort error:", error);
          });
        }

        return true;
      },
    });
  }

  private registerCopyLabelToAliasesCommand(plugin: any): void {
    plugin.addCommand({
      id: "copy-label-to-aliases",
      name: "Copy Label to Aliases",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;

        const context = this.getContext(file);
        if (!context || !canCopyLabelToAliases(context)) return false;

        if (!checking) {
          this.executeCopyLabelToAliases(file).catch((error) => {
            new Notice(`Failed to copy label: ${error.message}`);
            console.error("Copy label to aliases error:", error);
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

  /**
   * Register "Exocortex: Toggle Properties Visibility" command
   * Always available - toggles the visibility of the Properties section
   */
  private registerTogglePropertiesVisibilityCommand(plugin: any): void {
    plugin.addCommand({
      id: "toggle-properties-visibility",
      name: "Toggle Properties Visibility",
      callback: async () => {
        plugin.settings.showPropertiesSection =
          !plugin.settings.showPropertiesSection;
        await plugin.saveSettings();
        plugin.refreshLayout();
        new Notice(
          `Properties section ${plugin.settings.showPropertiesSection ? "shown" : "hidden"}`,
        );
      },
    });
  }

  /**
   * Register "Exocortex: Toggle Layout Visibility" command
   * Always available - toggles the visibility of the entire Layout
   */
  private registerToggleLayoutVisibilityCommand(plugin: any): void {
    plugin.addCommand({
      id: "toggle-layout-visibility",
      name: "Toggle Layout Visibility",
      callback: async () => {
        plugin.settings.layoutVisible = !plugin.settings.layoutVisible;
        await plugin.saveSettings();
        plugin.refreshLayout();
        new Notice(
          `Layout ${plugin.settings.layoutVisible ? "shown" : "hidden"}`,
        );
      },
    });
  }

  /**
   * Register "Exocortex: Toggle Archived Assets Visibility" command
   * Always available - toggles the visibility of archived assets in relations table
   */
  private registerToggleArchivedAssetsCommand(plugin: any): void {
    plugin.addCommand({
      id: "toggle-archived-assets-visibility",
      name: "Toggle Archived Assets Visibility",
      callback: async () => {
        plugin.settings.showArchivedAssets = !plugin.settings.showArchivedAssets;
        await plugin.saveSettings();
        plugin.refreshLayout();
        new Notice(
          `Archived assets ${plugin.settings.showArchivedAssets ? "shown" : "hidden"}`,
        );
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
    const result = await new Promise<LabelInputModalResult>((resolve) => {
      new LabelInputModal(this.app, resolve).open();
    });

    if (result.label === null) {
      return;
    }

    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};

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
      result.label,
      result.taskSize,
    );

    // Open the created file in a new tab
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.openFile(createdFile);

    // Switch focus to the new tab
    this.app.workspace.setActiveLeaf(leaf, { focus: true });

    new Notice(`Task created: ${createdFile.basename}`);
  }

  private async executeCreateProject(
    file: TFile,
    context: CommandVisibilityContext,
  ): Promise<void> {
    const result = await new Promise<LabelInputModalResult>((resolve) => {
      new LabelInputModal(this.app, resolve).open();
    });

    if (result.label === null) {
      return;
    }

    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};
    const instanceClass = metadata.exo__Instance_class;

    const sourceClass = Array.isArray(instanceClass) ? instanceClass[0] : instanceClass;

    const createdFile = await this.projectCreationService.createProject(
      file,
      metadata,
      sourceClass,
      result.label,
    );

    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.openFile(createdFile);

    this.app.workspace.setActiveLeaf(leaf, { focus: true });

    new Notice(`Project created: ${createdFile.basename}`);
  }

  private async executeCreateInstance(
    file: TFile,
    context: CommandVisibilityContext,
  ): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};

    const instanceClass = context.instanceClass;
    const classes = Array.isArray(instanceClass)
      ? instanceClass
      : [instanceClass];
    const firstClass = classes[0] || "";
    const sourceClass = firstClass.replace(/\[\[|\]\]/g, "").trim();

    const showTaskSize = sourceClass !== "ems__MeetingPrototype";

    const result = await new Promise<LabelInputModalResult>((resolve) => {
      new LabelInputModal(this.app, resolve, "", showTaskSize).open();
    });

    if (result.label === null) {
      return;
    }

    const createdFile = await this.taskCreationService.createTask(
      file,
      metadata,
      sourceClass,
      result.label,
      result.taskSize,
    );

    // Open the created file in a new tab
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.openFile(createdFile);

    // Switch focus to the new tab
    this.app.workspace.setActiveLeaf(leaf, { focus: true });

    new Notice(`Instance created: ${createdFile.basename}`);
  }

  private async executeCreateRelatedTask(
    file: TFile,
    context: CommandVisibilityContext,
  ): Promise<void> {
    const result = await new Promise<LabelInputModalResult>((resolve) => {
      new LabelInputModal(this.app, resolve).open();
    });

    if (result.label === null) {
      return;
    }

    const cache = this.app.metadataCache.getFileCache(file);
    const metadata = cache?.frontmatter || {};

    const createdFile = await this.taskCreationService.createRelatedTask(
      file,
      metadata,
      result.label,
      result.taskSize,
    );

    // Open the created file in a new tab
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.openFile(createdFile);

    // Switch focus to the new tab
    this.app.workspace.setActiveLeaf(leaf, { focus: true });

    new Notice(`Related task created: ${createdFile.basename}`);
  }

  private async executeSetDraftStatus(file: TFile): Promise<void> {
    await this.taskStatusService.setDraftStatus(file);
    new Notice(`Set Draft status: ${file.basename}`);
  }

  private async executeMoveToBacklog(file: TFile): Promise<void> {
    await this.taskStatusService.moveToBacklog(file);
    new Notice(`Moved to Backlog: ${file.basename}`);
  }

  private async executeMoveToAnalysis(file: TFile): Promise<void> {
    await this.taskStatusService.moveToAnalysis(file);
    new Notice(`Moved to Analysis: ${file.basename}`);
  }

  private async executeMoveToToDo(file: TFile): Promise<void> {
    await this.taskStatusService.moveToToDo(file);
    new Notice(`Moved to ToDo: ${file.basename}`);
  }

  private async executeStartEffort(file: TFile): Promise<void> {
    await this.taskStatusService.startEffort(file);
    new Notice(`Started effort: ${file.basename}`);
  }

  private async executePlanOnToday(file: TFile): Promise<void> {
    await this.taskStatusService.planOnToday(file);
    new Notice(`Planned on today: ${file.basename}`);
  }

  private async executePlanForEvening(file: TFile): Promise<void> {
    await this.taskStatusService.planForEvening(file);
    new Notice(`Planned for evening (19:00): ${file.basename}`);
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

  private async executeVoteOnEffort(file: TFile): Promise<void> {
    const newVoteCount = await this.effortVotingService.incrementEffortVotes(
      file,
    );
    new Notice(`Voted! New vote count: ${newVoteCount}`);
  }

  private async executeCopyLabelToAliases(file: TFile): Promise<void> {
    await this.labelToAliasService.copyLabelToAliases(file);
    new Notice("Label copied to aliases");
  }
}
