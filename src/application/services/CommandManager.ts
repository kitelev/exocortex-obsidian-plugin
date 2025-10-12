import { App, TFile, Notice } from "obsidian";
import {
  CommandVisibilityContext,
  canCreateTask,
  canStartEffort,
  canMarkDone,
  canArchiveTask,
  canCleanProperties,
  canRepairFolder,
} from "../../domain/commands/CommandVisibility";
import { TaskCreationService } from "../../infrastructure/services/TaskCreationService";
import { TaskStatusService } from "../../infrastructure/services/TaskStatusService";
import { PropertyCleanupService } from "../../infrastructure/services/PropertyCleanupService";
import { FolderRepairService } from "../../infrastructure/services/FolderRepairService";

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

  constructor(private app: App) {
    this.taskCreationService = new TaskCreationService(app.vault);
    this.taskStatusService = new TaskStatusService(app.vault);
    this.propertyCleanupService = new PropertyCleanupService(app.vault);
    this.folderRepairService = new FolderRepairService(app.vault, app);
  }

  /**
   * Register all commands in Obsidian Command Palette
   * Call this once during plugin initialization
   */
  registerAllCommands(plugin: any): void {
    this.registerCreateTaskCommand(plugin);
    this.registerStartEffortCommand(plugin);
    this.registerMarkDoneCommand(plugin);
    this.registerArchiveTaskCommand(plugin);
    this.registerCleanPropertiesCommand(plugin);
    this.registerRepairFolderCommand(plugin);
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

  // ============================================================================
  // Command Execution Methods
  // ============================================================================

  private async executeCreateTask(
    file: TFile,
    context: CommandVisibilityContext,
  ): Promise<void> {
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
    );

    // Open the created file in a new tab
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.openFile(createdFile);

    // Switch focus to the new tab
    this.app.workspace.setActiveLeaf(leaf, { focus: true });

    new Notice(`Task created: ${createdFile.basename}`);
  }

  private async executeStartEffort(file: TFile): Promise<void> {
    await this.taskStatusService.startEffort(file);
    new Notice(`Started effort: ${file.basename}`);
  }

  private async executeMarkDone(file: TFile): Promise<void> {
    await this.taskStatusService.markTaskAsDone(file);
    new Notice(`Marked as done: ${file.basename}`);
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
}
