import { Plugin, TFile, Notice } from "obsidian";
import { ILifecycleManager } from "../../application/ports/ILifecycleManager";
import { Graph } from "../../domain/semantic/core/Graph";
import { Triple, IRI, Literal } from "../../domain/semantic/core/Triple";

/**
 * Callback type for cache invalidation
 */
type CacheInvalidationCallback = () => void;

/**
 * Graph Lifecycle Manager following Pure Fabrication Pattern (GRASP)
 * Single Responsibility: Manage knowledge graph lifecycle and file synchronization
 */
export class GraphLifecycleManager implements ILifecycleManager {
  private graph: Graph;
  private cacheInvalidationCallback?: CacheInvalidationCallback;

  constructor(private readonly plugin: Plugin) {
    this.graph = new Graph();
  }

  async initialize(): Promise<void> {
    // Load vault data into graph
    try {
      await this.loadVaultIntoGraph();
    } catch (error) {
      // Vault loading failed - plugin should still function
      console.warn("Failed to load vault into graph:", error);
    }

    // Register file modification handlers
    this.registerFileHandlers();

    new Notice("🔍 Exocortex: Knowledge graph loaded!");
  }

  async cleanup(): Promise<void> {
    if (this.graph) {
      this.graph.clear();
    }
  }

  getManagerId(): string {
    return "GraphLifecycleManager";
  }

  getGraph(): Graph {
    return this.graph;
  }

  /**
   * Set callback for cache invalidation when graph changes
   */
  setCacheInvalidationCallback(callback: CacheInvalidationCallback): void {
    this.cacheInvalidationCallback = callback;
  }

  private async loadVaultIntoGraph(): Promise<void> {
    // Loading vault data
    const startTime = Date.now();
    let triplesCount = 0;

    try {
      const files = this.plugin.app.vault.getMarkdownFiles();

      for (const file of files) {
        try {
          const content = await this.plugin.app.vault.read(file);
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

  private registerFileHandlers(): void {
    // Register file modification handler to update graph
    this.plugin.registerEvent(
      this.plugin.app.vault.on("modify", async (file) => {
        if (file instanceof TFile && file.extension === "md") {
          await this.updateFileInGraph(file);
        }
      }),
    );

    // Register file creation handler
    this.plugin.registerEvent(
      this.plugin.app.vault.on("create", async (file) => {
        if (file instanceof TFile && file.extension === "md") {
          await this.updateFileInGraph(file);
        }
      }),
    );

    // Register file deletion handler
    this.plugin.registerEvent(
      this.plugin.app.vault.on("delete", async (file) => {
        if (file instanceof TFile && file.extension === "md") {
          this.removeFileFromGraph(file);
        }
      }),
    );
  }

  private async updateFileInGraph(file: TFile): Promise<void> {
    try {
      // Remove old triples for this file
      this.removeFileFromGraph(file);

      // Add new triples
      const content = await this.plugin.app.vault.read(file);
      const triples = this.extractTriplesFromFile(file, content);

      for (const triple of triples) {
        this.graph.add(triple);
      }

      // Invalidate cache when graph changes
      this.cacheInvalidationCallback?.();
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

    // Invalidate cache when graph changes
    this.cacheInvalidationCallback?.();
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
}
