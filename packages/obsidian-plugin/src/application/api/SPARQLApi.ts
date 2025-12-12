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

  constructor(plugin: ExocortexPlugin) {
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
    return this.queryService.getTripleStore();
  }

  async refresh(): Promise<void> {
    await this.queryService.refresh();
  }

  async dispose(): Promise<void> {
    await this.queryService.dispose();
  }
}
