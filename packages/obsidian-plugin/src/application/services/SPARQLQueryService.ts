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

    await this.indexer.initialize();

    const tripleStore = this.indexer.getTripleStore();
    this.executor = new BGPExecutor(tripleStore);

    this.isInitialized = true;
  }

  async query(queryString: string): Promise<SolutionMapping[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.executor) {
      throw new Error("Query executor not initialized");
    }

    const ast: SPARQLQuery = this.parser.parse(queryString);

    let algebra: AlgebraOperation = this.translator.translate(ast);
    algebra = this.optimizer.optimize(algebra);

    const resultIterator = this.executor.execute(algebra as any);
    const results: SolutionMapping[] = [];
    for await (const mapping of resultIterator) {
      results.push(mapping);
    }

    return results;
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
