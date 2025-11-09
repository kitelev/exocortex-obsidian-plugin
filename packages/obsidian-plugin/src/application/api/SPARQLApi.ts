import type { App } from "obsidian";
import type { InMemoryTripleStore, SolutionMapping, Triple } from "@exocortex/core";
import { SPARQLQueryService } from "../services/SPARQLQueryService";
import type ExocortexPlugin from "../../ExocortexPlugin";

export interface QueryResult {
  bindings: SolutionMapping[];
  count: number;
}

export interface ConstructResult {
  triples: Triple[];
  count: number;
}

export class SPARQLApi {
  private queryService: SPARQLQueryService;
  private plugin: ExocortexPlugin;

  constructor(plugin: ExocortexPlugin) {
    this.plugin = plugin;
    this.queryService = new SPARQLQueryService(plugin.app);
  }

  async query(sparql: string): Promise<QueryResult> {
    const bindings = await this.queryService.query(sparql);
    return {
      bindings,
      count: bindings.length,
    };
  }

  getTripleStore(): InMemoryTripleStore {
    const indexer = (this.queryService as any).indexer;
    return indexer.getTripleStore();
  }

  async refresh(): Promise<void> {
    await this.queryService.refresh();
  }

  async dispose(): Promise<void> {
    await this.queryService.dispose();
  }
}
