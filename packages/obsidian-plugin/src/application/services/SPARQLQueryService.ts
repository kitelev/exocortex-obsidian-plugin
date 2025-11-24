import { App, TFile } from "obsidian";
import {
  SPARQLParser,
  AlgebraTranslator,
  AlgebraOptimizer,
  BGPExecutor,
  type SPARQLQuery,
  type SolutionMapping,
  type AlgebraOperation,
} from "@exocortex/core";
import { ValidationError, ServiceError } from "@exocortex/core/domain/errors";
import { VaultRDFIndexer } from "../../infrastructure/VaultRDFIndexer";

export class SPARQLQueryService {
  private indexer: VaultRDFIndexer;
  private parser: SPARQLParser;
  private translator: AlgebraTranslator;
  private optimizer: AlgebraOptimizer;
  private executor: BGPExecutor | null = null;
  private isInitialized = false;

  constructor(app: App) {
    this.indexer = new VaultRDFIndexer(app);
    this.parser = new SPARQLParser();
    this.translator = new AlgebraTranslator();
    this.optimizer = new AlgebraOptimizer();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.indexer.initialize();

      const tripleStore = this.indexer.getTripleStore();
      this.executor = new BGPExecutor(tripleStore);

      this.isInitialized = true;
    } catch (error) {
      throw new ServiceError(
        "failed to initialize sparql query service",
        {
          service: "SPARQLQueryService",
          operation: "initialize",
          originalError: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  async query(queryString: string): Promise<SolutionMapping[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.executor) {
      throw new ServiceError(
        "query executor not initialized",
        {
          service: "SPARQLQueryService",
          operation: "query",
        }
      );
    }

    try {
      const ast: SPARQLQuery = this.parser.parse(queryString);

      let algebra: AlgebraOperation = this.translator.translate(ast);
      algebra = this.optimizer.optimize(algebra);

      const resultIterator = this.executor.execute(algebra as any);
      const results: SolutionMapping[] = [];
      for await (const mapping of resultIterator) {
        results.push(mapping);
      }

      return results;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("parse") || errorMessage.includes("syntax")) {
        throw new ValidationError(
          "invalid sparql query",
          {
            query: queryString,
            originalError: errorMessage,
          }
        );
      }

      throw new ServiceError(
        "sparql query execution failed",
        {
          service: "SPARQLQueryService",
          operation: "query",
          query: queryString,
          originalError: errorMessage,
        }
      );
    }
  }

  async refresh(): Promise<void> {
    await this.indexer.refresh();
  }

  async updateFile(file: TFile): Promise<void> {
    await this.indexer.updateFile(file);
  }

  async dispose(): Promise<void> {
    this.indexer.dispose();
    this.executor = null;
    this.isInitialized = false;
  }
}
