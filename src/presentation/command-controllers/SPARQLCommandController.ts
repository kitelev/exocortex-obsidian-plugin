import { Plugin, Notice } from "obsidian";
import { ICommandController } from "../../application/ports/ICommandController";
import { SPARQLProcessor } from "../processors/SPARQLProcessor";

/**
 * SPARQL Command Controller following Controller Pattern (GRASP)
 * Single Responsibility: Handle SPARQL-related commands only
 */
export class SPARQLCommandController implements ICommandController {
  constructor(
    private readonly plugin: Plugin,
    private readonly sparqlProcessor: SPARQLProcessor
  ) {}

  async registerCommands(): Promise<void> {
    // Register command: View SPARQL cache statistics
    this.plugin.addCommand({
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
    this.plugin.addCommand({
      id: "clear-sparql-cache",
      name: "Clear SPARQL cache",
      callback: () => {
        this.sparqlProcessor.invalidateCache();
        new Notice("SPARQL query cache cleared!");
      },
    });
  }

  async cleanup(): Promise<void> {
    // No specific cleanup needed for SPARQL commands
  }

  getControllerId(): string {
    return "SPARQLCommandController";
  }
}