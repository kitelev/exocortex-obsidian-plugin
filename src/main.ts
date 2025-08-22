import { Plugin, Notice, MarkdownPostProcessorContext, TFile } from "obsidian";
import { Graph } from "./domain/semantic/core/Graph";
import { Triple, IRI, Literal } from "./domain/semantic/core/Triple";
import { SPARQLProcessor } from "./presentation/processors/SPARQLProcessor";
import { GraphVisualizationProcessor } from "./presentation/processors/GraphVisualizationProcessor";
import { CreateAssetModal } from "./presentation/modals/CreateAssetModal";
import { ExportRDFModal } from "./presentation/modals/ExportRDFModal";
import { ImportRDFModal } from "./presentation/modals/ImportRDFModal";
import { QuickTaskModal } from "./presentation/modals/QuickTaskModal";
import { DIContainer } from "./infrastructure/container/DIContainer";
import { RDFService } from "./application/services/RDFService";
import { CreateTaskFromProjectUseCase } from "./application/use-cases/CreateTaskFromProjectUseCase";
import { GetCurrentProjectUseCase } from "./application/use-cases/GetCurrentProjectUseCase";
import { ObsidianTaskRepository } from "./infrastructure/repositories/ObsidianTaskRepository";
import { ObsidianAssetRepository } from "./infrastructure/repositories/ObsidianAssetRepository";
import { IndexedGraph } from "./domain/semantic/core/IndexedGraph";
import { ExoFocusService } from "./application/services/ExoFocusService";
import { LayoutRenderer } from "./presentation/renderers/LayoutRenderer";
import { PropertyRenderer } from "./presentation/components/PropertyRenderer";
import { IClassLayoutRepository } from "./domain/repositories/IClassLayoutRepository";
import { QueryEngineService } from "./application/services/QueryEngineService";
import { PropertyEditingUseCase } from "./application/use-cases/PropertyEditingUseCase";
import {
  ExocortexSettings,
  DEFAULT_SETTINGS,
} from "./domain/entities/ExocortexSettings";
import { ExocortexSettingTab } from "./presentation/settings/ExocortexSettingTab";

import manifest from "../manifest.json";

export default class ExocortexPlugin extends Plugin {
  private graph: Graph;
  private sparqlProcessor: SPARQLProcessor;
  private graphVisualizationProcessor: GraphVisualizationProcessor;
  private container: DIContainer;
  private rdfService: RDFService;
  private layoutRenderer: LayoutRenderer;
  public settings: ExocortexSettings;

  async onload(): Promise<void> {
    // Plugin initialization

    // Load settings
    await this.loadSettings();

    // Add settings tab
    this.addSettingTab(new ExocortexSettingTab(this.app, this));

    // Initialize DI container
    DIContainer.initialize(this.app, this);
    this.container = DIContainer.getInstance();

    // Initialize graph
    this.graph = new Graph();

    // Initialize RDF service
    this.rdfService = new RDFService(this.app);

    // Load vault data into graph
    try {
      await this.loadVaultIntoGraph();
    } catch (error) {
      // Vault loading failed - plugin should still function
      console.warn("Failed to load vault into graph:", error);
    }

    // Initialize SPARQL processor with cache configuration from settings
    const cacheConfig = {
      maxSize: this.settings.get("sparqlCacheMaxSize"),
      defaultTTL: this.settings.get("sparqlCacheTTLMinutes") * 60 * 1000,
      enabled: this.settings.get("enableSPARQLCache"),
    };
    this.sparqlProcessor = new SPARQLProcessor(
      this,
      this.graph,
      undefined,
      cacheConfig,
    );

    // Initialize Graph Visualization processor
    this.graphVisualizationProcessor = new GraphVisualizationProcessor(
      this,
      this.graph,
    );

    // Initialize Layout Renderer with proper dependencies
    // Use the repository from DI container which respects plugin settings
    const layoutRepository = this.container.resolve<IClassLayoutRepository>(
      "IClassLayoutRepository",
    );

    // Get PropertyEditingUseCase from DI container
    const propertyEditingUseCase = this.container.getPropertyEditingUseCase();
    const propertyRenderer = new PropertyRenderer(
      this.app,
      propertyEditingUseCase,
    );

    this.layoutRenderer = new LayoutRenderer(this.app, layoutRepository);

    // Export ExoUIRender function to global window object for DataviewJS integration
    (window as any).ExoUIRender = async (dv: any, ctx: any) => {
      try {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
          ctx.container.createEl("p", {
            text: "Error: No active file found",
            cls: "exocortex-error",
          });
          return;
        }

        const metadata = this.app.metadataCache.getFileCache(file);
        await this.layoutRenderer.renderLayout(
          ctx.container,
          file,
          metadata,
          dv,
        );
      } catch (error) {
        console.error("ExoUIRender error:", error);
        ctx.container.createEl("p", {
          text: `Error rendering layout: ${error.message}`,
          cls: "exocortex-error",
        });
      }
    };

    // Register SPARQL code block processor
    try {
      this.registerMarkdownCodeBlockProcessor("sparql", (source, el, ctx) =>
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
      this.registerMarkdownCodeBlockProcessor("graph", (source, el, ctx) =>
        this.graphVisualizationProcessor.processCodeBlock(source, el, ctx),
      );
    } catch (error) {
      // Graph processor may already be registered (hot reload scenario)
      console.warn(
        "Graph processor registration failed, likely due to hot reload:",
        error.message,
      );
    }

    // Register command: Create new asset
    this.addCommand({
      id: "create-exo-asset",
      name: "Create new ExoAsset",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "n" }],
      callback: () => {
        new CreateAssetModal(this.app).open();
      },
    });

    // Add ribbon icon for quick access
    this.addRibbonIcon("plus-circle", "Create ExoAsset", () => {
      new CreateAssetModal(this.app).open();
    });

    // Register command: View SPARQL cache statistics
    this.addCommand({
      id: "view-sparql-cache-stats",
      name: "View SPARQL cache statistics",
      callback: () => {
        const stats = this.sparqlProcessor.getCacheStatistics();
        const message = [
          `SPARQL Query Cache Statistics:`,
          `• Cache hits: ${stats.hits}`,
          `• Cache misses: ${stats.misses}`,
          `• Hit rate: ${stats.hitRate.toFixed(1)}%`,
          `• Cached entries: ${stats.size}/${stats.maxSize}`,
          `• Total queries: ${stats.totalQueries}`,
          `• Evictions: ${stats.evictions}`,
        ].join("\n");
        new Notice(message, 8000);
      },
    });

    // Register command: Clear SPARQL cache
    this.addCommand({
      id: "clear-sparql-cache",
      name: "Clear SPARQL cache",
      callback: () => {
        this.sparqlProcessor.invalidateCache();
        new Notice("SPARQL query cache cleared!");
      },
    });

    // Register command: Export knowledge graph
    this.addCommand({
      id: "export-knowledge-graph",
      name: "Export knowledge graph",
      callback: () => {
        const modal = new ExportRDFModal(
          this.app,
          this.graph,
          this.rdfService.getNamespaceManager(),
          (result) => {
            // Graph export completed
          },
        );
        modal.open();
      },
    });

    // Register command: Import RDF data
    this.addCommand({
      id: "import-rdf-data",
      name: "Import RDF data",
      callback: () => {
        const modal = new ImportRDFModal(
          this.app,
          this.graph,
          this.rdfService.getNamespaceManager(),
          async (importedGraph, options) => {
            try {
              if (options.mergeMode === "replace") {
                this.graph.clear();
                this.graph.merge(importedGraph);
              } else {
                this.graph.merge(importedGraph);
              }

              // Invalidate SPARQL cache since graph changed
              this.sparqlProcessor.invalidateCache();

              // RDF import completed
            } catch (error) {
              // RDF import failed
              new Notice(`Import failed: ${error.message}`);
            }
          },
        );
        modal.open();
      },
    });

    // Register command: Quick Task Creation
    this.addCommand({
      id: "quick-create-task",
      name: "Quick create task for current project",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "t" }],
      callback: async () => {
        try {
          // Get current file context
          const activeFile = this.app.workspace.getActiveFile();
          const activeFilePath = activeFile?.path;

          // Initialize repositories and services
          const taskRepository = new ObsidianTaskRepository(this.app);
          const assetRepository = new ObsidianAssetRepository(this.app);
          const indexedGraph = new IndexedGraph();
          const focusService = new ExoFocusService(this.app, this.graph);

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
            this.app,
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

    // Register file modification handler to update graph
    this.registerEvent(
      this.app.vault.on("modify", async (file) => {
        if (file instanceof TFile && file.extension === "md") {
          await this.updateFileInGraph(file);
          // Invalidate SPARQL query cache when data changes
          this.sparqlProcessor.invalidateCache();
        }
      }),
    );

    // Register file creation handler
    this.registerEvent(
      this.app.vault.on("create", async (file) => {
        if (file instanceof TFile && file.extension === "md") {
          await this.updateFileInGraph(file);
          // Invalidate SPARQL query cache when data changes
          this.sparqlProcessor.invalidateCache();
        }
      }),
    );

    // Register file deletion handler
    this.registerEvent(
      this.app.vault.on("delete", async (file) => {
        if (file instanceof TFile && file.extension === "md") {
          this.removeFileFromGraph(file);
          // Invalidate SPARQL query cache when data changes
          this.sparqlProcessor.invalidateCache();
        }
      }),
    );

    new Notice("🔍 Exocortex: SPARQL support and graph visualization enabled!");
    // SPARQL and graph processors initialized
  }

  private async loadVaultIntoGraph(): Promise<void> {
    // Loading vault data
    const startTime = Date.now();
    let triplesCount = 0;

    try {
      const files = this.app.vault.getMarkdownFiles();

      for (const file of files) {
        try {
          const content = await this.app.vault.read(file);
          const triples = this.extractTriplesFromFile(file, content);

          for (const triple of triples) {
            this.graph.add(triple);
            triplesCount++;
          }
        } catch (err) {
          // File processing failed - continue with next file
        }
      }
    } catch (err) {
      // Vault access failed - plugin should still function
      console.warn(
        "Failed to access vault files during graph initialization:",
        err,
      );
      new Notice("Exocortex: Unable to load vault files into graph");
      return;
    }

    const loadTime = Date.now() - startTime;
    // Vault data loaded
  }

  private async updateFileInGraph(file: TFile): Promise<void> {
    try {
      // Remove old triples for this file
      this.removeFileFromGraph(file);

      // Add new triples
      const content = await this.app.vault.read(file);
      const triples = this.extractTriplesFromFile(file, content);

      for (const triple of triples) {
        this.graph.add(triple);
      }
    } catch (err) {
      // File update failed
    }
  }

  private removeFileFromGraph(file: TFile): void {
    const subject = new IRI(`file://${file.basename}`);
    const triplesToRemove = this.graph.match(subject, null, null);

    for (const triple of triplesToRemove) {
      this.graph.remove(triple);
    }
  }

  private extractTriplesFromFile(file: TFile, content: string): Triple[] {
    const triples: Triple[] = [];
    const subject = new IRI(`file://${file.basename}`);

    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

    if (frontmatterMatch) {
      const frontmatter = this.parseFrontmatter(frontmatterMatch[1]);

      for (const [key, value] of Object.entries(frontmatter)) {
        if (Array.isArray(value)) {
          for (const v of value) {
            triples.push(
              new Triple(subject, new IRI(key), Literal.string(String(v))),
            );
          }
        } else if (value !== null && value !== undefined) {
          triples.push(
            new Triple(subject, new IRI(key), Literal.string(String(value))),
          );
        }
      }
    }

    // Add basic file metadata
    triples.push(
      new Triple(subject, new IRI("file_path"), Literal.string(file.path)),
    );

    triples.push(
      new Triple(subject, new IRI("file_name"), Literal.string(file.name)),
    );

    return triples;
  }

  private parseFrontmatter(yaml: string): Record<string, any> {
    const result: Record<string, any> = {};
    const lines = yaml.split("\n");
    let currentKey: string | null = null;
    let currentValue: any = null;
    let inArray = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) continue;

      // Check for array item
      if (line.startsWith("  - ") || line.startsWith("    - ")) {
        if (currentKey && inArray) {
          const value = line.substring(line.indexOf("- ") + 2).trim();
          const cleanValue = value
            .replace(/^["']|["']$/g, "")
            .replace(/\[\[|\]\]/g, "");
          if (!Array.isArray(currentValue)) {
            currentValue = [];
          }
          currentValue.push(cleanValue);
        }
        continue;
      }

      // Check for key:value pair
      if (trimmed.includes(":")) {
        // Save previous key-value if exists
        if (currentKey !== null && currentValue !== null) {
          result[currentKey] = currentValue;
        }

        const colonIndex = trimmed.indexOf(":");
        currentKey = trimmed.substring(0, colonIndex).trim();
        const valueStr = trimmed.substring(colonIndex + 1).trim();

        if (!valueStr) {
          // Value will be on next lines (array)
          inArray = true;
          currentValue = [];
        } else {
          // Single value
          inArray = false;
          currentValue = valueStr
            .replace(/^["']|["']$/g, "")
            .replace(/\[\[|\]\]/g, "");
        }
      }
    }

    // Save last key-value
    if (currentKey !== null && currentValue !== null) {
      result[currentKey] = currentValue;
    }

    return result;
  }

  /**
   * Load plugin settings from data.json
   */
  async loadSettings(): Promise<void> {
    try {
      const data = await this.loadData();
      const settingsResult = ExocortexSettings.create(data || {});

      if (settingsResult.isFailure) {
        console.error("Failed to load settings:", settingsResult.getError());
        this.settings = new ExocortexSettings(DEFAULT_SETTINGS);
      } else {
        this.settings = settingsResult.getValue()!;
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      this.settings = new ExocortexSettings(DEFAULT_SETTINGS);
    }
  }

  /**
   * Save plugin settings to data.json
   */
  async saveSettings(): Promise<void> {
    try {
      await this.saveData(this.settings.toJSON());
    } catch (error) {
      console.error("Error saving settings:", error);
      new Notice("Failed to save settings");
    }
  }

  /**
   * Update DI container with new settings
   */
  updateContainer(): void {
    try {
      // Re-initialize DI container to pick up new settings
      DIContainer.initialize(this.app, this);
      this.container = DIContainer.getInstance();

      // Update cache configuration if SPARQL processor exists
      if (this.sparqlProcessor) {
        const cacheConfig = {
          maxSize: this.settings.get("sparqlCacheMaxSize"),
          defaultTTL: this.settings.get("sparqlCacheTTLMinutes") * 60 * 1000,
          enabled: this.settings.get("enableSPARQLCache"),
        };
        this.sparqlProcessor.updateCacheConfig(cacheConfig);
      }
    } catch (error) {
      console.error("Error updating container:", error);
    }
  }

  async onunload(): Promise<void> {
    // Plugin cleanup completed
    if (this.graph) {
      this.graph.clear();
    }
    if (this.sparqlProcessor) {
      this.sparqlProcessor.destroy();
    }
    // Clean up global ExoUIRender function
    if ((window as any).ExoUIRender) {
      delete (window as any).ExoUIRender;
    }
  }
}
