import { MarkdownPostProcessorContext } from "obsidian";
import {
  InMemoryTripleStore,
  SPARQLParser,
  AlgebraTranslator,
  AlgebraOptimizer,
  BGPExecutor,
  NoteToRDFConverter,
  type SPARQLQuery,
  type SolutionMapping,
} from "@exocortex/core";
import type ExocortexPlugin from "../../ExocortexPlugin";
import { ObsidianVaultAdapter } from "../../adapters/ObsidianVaultAdapter";

export class SPARQLCodeBlockProcessor {
  private plugin: ExocortexPlugin;
  private tripleStore: InMemoryTripleStore | null = null;
  private isLoading = false;

  constructor(plugin: ExocortexPlugin) {
    this.plugin = plugin;
  }

  async process(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ): Promise<void> {
    el.innerHTML = "";
    el.classList.add("sparql-code-block");

    const container = document.createElement("div");
    container.className = "sparql-results-container";
    el.appendChild(container);

    try {
      const loadingDiv = document.createElement("div");
      loadingDiv.className = "sparql-loading";
      loadingDiv.textContent = "Loading SPARQL engine...";
      container.appendChild(loadingDiv);

      await this.ensureTripleStoreLoaded();

      container.innerHTML = "";
      const executingDiv = document.createElement("div");
      executingDiv.className = "sparql-loading";
      executingDiv.textContent = "Executing query...";
      container.appendChild(executingDiv);

      const results = await this.executeQuery(source);

      container.innerHTML = "";
      this.renderResults(results, container, source);
    } catch (error) {
      container.innerHTML = "";
      this.renderError(error instanceof Error ? error : new Error(String(error)), container);
    }
  }

  private async ensureTripleStoreLoaded(): Promise<void> {
    if (this.tripleStore !== null) {
      return;
    }

    if (this.isLoading) {
      while (this.isLoading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    this.isLoading = true;

    try {
      const vaultAdapter = new ObsidianVaultAdapter(
        this.plugin.app.vault,
        this.plugin.app.metadataCache,
        this.plugin.app
      );
      const converter = new NoteToRDFConverter(vaultAdapter);
      const triples = await converter.convertVault();

      this.tripleStore = new InMemoryTripleStore();
      await this.tripleStore.addAll(triples);
    } finally {
      this.isLoading = false;
    }
  }

  private async executeQuery(queryString: string): Promise<SolutionMapping[]> {
    if (!this.tripleStore) {
      throw new Error("Triple store not initialized");
    }

    const parser = new SPARQLParser();
    const ast: SPARQLQuery = parser.parse(queryString);

    const translator = new AlgebraTranslator();
    let algebra = translator.translate(ast);

    const optimizer = new AlgebraOptimizer();
    algebra = optimizer.optimize(algebra);

    return await this.executeAlgebra(algebra);
  }

  private async executeAlgebra(algebra: any): Promise<SolutionMapping[]> {
    if (!this.tripleStore) {
      throw new Error("Triple store not initialized");
    }

    let limit: number | undefined = undefined;
    let operation = algebra;

    while (operation.type !== "bgp") {
      if (operation.type === "slice" && operation.limit !== undefined) {
        limit = operation.limit;
      }

      if ("input" in operation) {
        operation = operation.input;
      } else {
        throw new Error(`Cannot execute operation type: ${operation.type}`);
      }
    }

    const executor = new BGPExecutor(this.tripleStore);
    const results = await executor.executeAll(operation);

    if (limit !== undefined) {
      return results.slice(0, limit);
    }

    return results;
  }

  private renderResults(
    results: SolutionMapping[],
    container: HTMLElement,
    queryString: string
  ): void {
    if (results.length === 0) {
      const noResultsDiv = document.createElement("div");
      noResultsDiv.className = "sparql-no-results";
      noResultsDiv.textContent = "No results found";
      container.appendChild(noResultsDiv);
      return;
    }

    const variables = this.extractVariables(queryString);
    const table = document.createElement("table");
    table.className = "sparql-results-table";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    for (const variable of variables) {
      const th = document.createElement("th");
      th.textContent = variable;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    for (const result of results) {
      const row = document.createElement("tr");
      for (const variable of variables) {
        const value = result.get(variable);
        const cell = document.createElement("td");
        cell.textContent = value ? value.toString() : "";
        row.appendChild(cell);
      }
      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    container.appendChild(table);

    const meta = document.createElement("div");
    meta.className = "sparql-meta";
    const small = document.createElement("small");
    small.textContent = `${results.length} result(s)`;
    meta.appendChild(small);
    container.appendChild(meta);
  }

  private renderError(error: Error, container: HTMLElement): void {
    const errorDiv = document.createElement("div");
    errorDiv.className = "sparql-error";

    const strong = document.createElement("strong");
    strong.textContent = "SPARQL Query Error:";
    errorDiv.appendChild(strong);

    const pre = document.createElement("pre");
    pre.textContent = error.message;
    errorDiv.appendChild(pre);

    container.appendChild(errorDiv);
  }

  private extractVariables(queryString: string): string[] {
    const selectMatch = queryString.match(/SELECT\s+(.*?)\s+WHERE/is);
    if (!selectMatch) {
      return [];
    }

    const selectClause = selectMatch[1];
    const variables = selectClause.match(/\?(\w+)/g) || [];
    return variables.map((v) => v.substring(1));
  }
}
