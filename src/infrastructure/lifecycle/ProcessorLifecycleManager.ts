import { Plugin } from "obsidian";
import { ILifecycleManager } from "../../application/ports/ILifecycleManager";
import { Graph } from "../../domain/semantic/core/Graph";
import { ExocortexSettings } from "../../domain/entities/ExocortexSettings";
import { SPARQLProcessor } from "../../presentation/processors/SPARQLProcessor";
import { GraphVisualizationProcessor } from "../../presentation/processors/GraphVisualizationProcessor";

/**
 * Processor Lifecycle Manager following Pure Fabrication Pattern (GRASP)
 * Single Responsibility: Manage code block processors lifecycle
 */
export class ProcessorLifecycleManager implements ILifecycleManager {
  private sparqlProcessor: SPARQLProcessor;
  private graphVisualizationProcessor: GraphVisualizationProcessor;

  constructor(
    private readonly plugin: Plugin,
    private readonly graph: Graph,
    private readonly settings: ExocortexSettings
  ) {}

  async initialize(): Promise<void> {
    // Initialize SPARQL processor with cache configuration from settings
    const cacheConfig = {
      maxSize: this.settings.get("sparqlCacheMaxSize"),
      defaultTTL: this.settings.get("sparqlCacheTTLMinutes") * 60 * 1000,
      enabled: this.settings.get("enableSPARQLCache"),
    };

    this.sparqlProcessor = new SPARQLProcessor(
      this.plugin,
      this.graph,
      undefined,
      cacheConfig,
    );

    // Initialize Graph Visualization processor
    this.graphVisualizationProcessor = new GraphVisualizationProcessor(
      this.plugin,
      this.graph,
    );

    // Register processors
    await this.registerProcessors();
  }

  async cleanup(): Promise<void> {
    if (this.sparqlProcessor) {
      this.sparqlProcessor.destroy();
    }
  }

  getManagerId(): string {
    return "ProcessorLifecycleManager";
  }

  getSPARQLProcessor(): SPARQLProcessor {
    return this.sparqlProcessor;
  }

  getGraphVisualizationProcessor(): GraphVisualizationProcessor {
    return this.graphVisualizationProcessor;
  }

  /**
   * Update cache configuration for processors
   */
  updateCacheConfig(settings: ExocortexSettings): void {
    if (this.sparqlProcessor) {
      const cacheConfig = {
        maxSize: settings.get("sparqlCacheMaxSize"),
        defaultTTL: settings.get("sparqlCacheTTLMinutes") * 60 * 1000,
        enabled: settings.get("enableSPARQLCache"),
      };
      this.sparqlProcessor.updateCacheConfig(cacheConfig);
    }
  }

  private async registerProcessors(): Promise<void> {
    // Register SPARQL code block processor
    try {
      this.plugin.registerMarkdownCodeBlockProcessor("sparql", (source, el, ctx) =>
        this.sparqlProcessor.processCodeBlock(source, el, ctx),
      );
    } catch (error) {
      // SPARQL processor may already be registered (hot reload scenario)
      console.warn(
        "SPARQL processor registration failed, likely due to hot reload:",
        error.message,
      );
    }

    // Register Graph Visualization code block processor
    try {
      this.plugin.registerMarkdownCodeBlockProcessor("graph", (source, el, ctx) =>
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