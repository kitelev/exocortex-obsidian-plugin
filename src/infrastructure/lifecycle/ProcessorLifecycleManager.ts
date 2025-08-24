import { Plugin } from "obsidian";
import { ILifecycleManager } from "../../application/ports/ILifecycleManager";
import { Graph } from "../../domain/semantic/core/Graph";
import { ExocortexSettings } from "../../domain/entities/ExocortexSettings";
import { GraphVisualizationProcessor } from "../../presentation/processors/GraphVisualizationProcessor";

/**
 * Processor Lifecycle Manager following Pure Fabrication Pattern (GRASP)
 * Single Responsibility: Manage code block processors lifecycle
 */
export class ProcessorLifecycleManager implements ILifecycleManager {
  private graphVisualizationProcessor: GraphVisualizationProcessor;

  constructor(
    private readonly plugin: Plugin,
    private readonly graph: Graph,
    private readonly settings: ExocortexSettings,
  ) {}

  async initialize(): Promise<void> {
    // Initialize Graph Visualization processor
    this.graphVisualizationProcessor = new GraphVisualizationProcessor(
      this.plugin,
      this.graph,
    );

    // Register processors
    await this.registerProcessors();
  }

  async cleanup(): Promise<void> {
    // Cleanup processors if needed
  }

  getManagerId(): string {
    return "ProcessorLifecycleManager";
  }

  getGraphVisualizationProcessor(): GraphVisualizationProcessor {
    return this.graphVisualizationProcessor;
  }

  /**
   * Update cache configuration for processors
   */
  updateCacheConfig(settings: ExocortexSettings): void {
    // Update configuration for processors if needed
  }

  private async registerProcessors(): Promise<void> {
    // Register Graph Visualization code block processor
    try {
      this.plugin.registerMarkdownCodeBlockProcessor(
        "graph",
        (source, el, ctx) =>
          this.graphVisualizationProcessor.processCodeBlock(source, el, ctx),
      );
    } catch (error) {
      // Graph processor may already be registered (hot reload scenario)
      console.warn(
        "Graph processor registration failed, likely due to hot reload:",
        error.message,
      );
    }
  }
}
