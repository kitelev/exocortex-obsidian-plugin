import { Plugin, Notice } from "obsidian";
import { ICommandController } from "../../application/ports/ICommandController";
import { Graph } from "../../domain/semantic/core/Graph";
import { CreateTaskFromProjectUseCase } from "../../application/use-cases/CreateTaskFromProjectUseCase";
import { GetCurrentProjectUseCase } from "../../application/use-cases/GetCurrentProjectUseCase";
import { ObsidianTaskRepository } from "../../infrastructure/repositories/ObsidianTaskRepository";
import { ObsidianAssetRepository } from "../../infrastructure/repositories/ObsidianAssetRepository";
import { IndexedGraph } from "../../domain/semantic/core/IndexedGraph";
import { ExoFocusService } from "../../application/services/ExoFocusService";
import { QuickTaskModal } from "../modals/QuickTaskModal";
import { DIContainer } from "../../infrastructure/container/DIContainer";

/**
 * Task Command Controller following Controller Pattern (GRASP)
 * Single Responsibility: Handle task-related commands only
 */
export class TaskCommandController implements ICommandController {
  constructor(
    private readonly plugin: Plugin,
    private readonly graph: Graph,
  ) {}

  async registerCommands(): Promise<void> {
    // Register command: Quick Task Creation
    this.plugin.addCommand({
      id: "quick-create-task",
      name: "Quick create task for current project",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "t" }],
      callback: async () => {
        try {
          // Get current file context
          const activeFile = this.plugin.app.workspace.getActiveFile();
          const activeFilePath = activeFile?.path;

          // Initialize repositories and services
          const taskRepository = new ObsidianTaskRepository(this.plugin.app);
          const assetRepository = new ObsidianAssetRepository(this.plugin.app);
          const indexedGraph = new IndexedGraph();
          // Get focusService from container
          const container = DIContainer.getInstance();
          const focusService =
            container.resolve<ExoFocusService>("ExoFocusService");

          // Create use cases
          const getCurrentProjectUseCase = new GetCurrentProjectUseCase(
            assetRepository,
            focusService,
            indexedGraph,
          );

          const createTaskUseCase = new CreateTaskFromProjectUseCase(
            taskRepository,
            assetRepository,
            indexedGraph,
            getCurrentProjectUseCase,
          );

          // Open modal
          const modal = new QuickTaskModal(
            this.plugin.app,
            createTaskUseCase,
            getCurrentProjectUseCase,
            activeFilePath,
          );
          modal.open();
        } catch (error) {
          // Quick task modal error
          new Notice(`Failed to open task creation: ${error.message}`);
        }
      },
    });
  }

  async cleanup(): Promise<void> {
    // No specific cleanup needed for task commands
  }

  getControllerId(): string {
    return "TaskCommandController";
  }
}
