import React from "react";
import { MarkdownPostProcessorContext, EventRef, Notice } from "obsidian";
import {
  InMemoryTripleStore,
  SPARQLParser,
  AlgebraTranslator,
  AlgebraOptimizer,
  BGPExecutor,
  ConstructExecutor,
  NoteToRDFConverter,
  type SPARQLQuery,
  type SolutionMapping,
  type Triple,
} from "@exocortex/core";
import type ExocortexPlugin from "../../ExocortexPlugin";
import { ObsidianVaultAdapter } from "../../adapters/ObsidianVaultAdapter";
import { ReactRenderer } from "../../presentation/utils/ReactRenderer";
import { SPARQLResultViewer } from "../../presentation/components/sparql/SPARQLResultViewer";

export class SPARQLCodeBlockProcessor {
  private plugin: ExocortexPlugin;
  private tripleStore: InMemoryTripleStore | null = null;
  private isLoading = false;
  private reactRenderer: ReactRenderer = new ReactRenderer();
  private activeQueries: Map<HTMLElement, {
    source: string;
    lastResults: SolutionMapping[] | Triple[];
    refreshTimeout?: ReturnType<typeof setTimeout>;
    eventRef?: EventRef;
  }> = new Map();
  private readonly DEBOUNCE_DELAY = 500;

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
      loadingDiv.textContent = "Loading query engine";
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

      this.activeQueries.set(el, {
        source,
        lastResults: results,
      });

      const eventRef = this.plugin.app.metadataCache.on("changed", () => {
        this.scheduleRefresh(el, container, source);
      });

      ctx.addChild({
        unload: () => {
          const query = this.activeQueries.get(el);
          if (query) {
            if (query.refreshTimeout) {
              clearTimeout(query.refreshTimeout);
            }
            if (query.eventRef) {
              this.plugin.app.metadataCache.offref(query.eventRef);
            }
            this.activeQueries.delete(el);
          }
          this.reactRenderer.unmount(container);
        },
      } as any);

      const activeQuery = this.activeQueries.get(el);
      if (activeQuery) {
        activeQuery.eventRef = eventRef;
      }

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      console.error("[Exocortex SPARQL] Query execution error:", errorObj);
      console.error("[Exocortex SPARQL] Stack trace:", errorObj.stack);
      new Notice(`SPARQL query error: ${errorObj.message}`, 5000);

      container.innerHTML = "";
      this.renderError(errorObj, container);
    }
  }

  private scheduleRefresh(el: HTMLElement, container: HTMLElement, source: string): void {
    const query = this.activeQueries.get(el);
    if (!query) return;

    if (query.refreshTimeout) {
      clearTimeout(query.refreshTimeout);
    }

    query.refreshTimeout = setTimeout(async () => {
      await this.refreshQuery(el, container, source);
    }, this.DEBOUNCE_DELAY);
  }

  private async refreshQuery(el: HTMLElement, container: HTMLElement, source: string): Promise<void> {
    const query = this.activeQueries.get(el);
    if (!query) return;

    try {
      this.invalidateTripleStore();

      await this.ensureTripleStoreLoaded();

      this.showRefreshIndicator(container);

      const newResults = await this.executeQuery(source);

      if (!this.areResultsEqual(query.lastResults, newResults)) {
        container.innerHTML = "";
        this.renderResults(newResults, container, source);
        query.lastResults = newResults;
      } else {
        this.hideRefreshIndicator(container);
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      console.error("[Exocortex SPARQL] Query refresh error:", errorObj);
      console.error("[Exocortex SPARQL] Stack trace:", errorObj.stack);
      new Notice(`SPARQL query refresh error: ${errorObj.message}`, 5000);

      container.innerHTML = "";
      this.renderError(errorObj, container);
    }
  }

  private invalidateTripleStore(): void {
    this.tripleStore = null;
  }

  private areResultsEqual(
    oldResults: SolutionMapping[] | Triple[],
    newResults: SolutionMapping[] | Triple[]
  ): boolean {
    if (oldResults.length !== newResults.length) {
      return false;
    }

    if (this.isTripleArray(oldResults) && this.isTripleArray(newResults)) {
      const stringifyTriple = (triple: Triple): string => {
        return triple.toString();
      };

      const oldStrings = oldResults.map(stringifyTriple).sort();
      const newStrings = newResults.map(stringifyTriple).sort();

      for (let i = 0; i < oldStrings.length; i++) {
        if (oldStrings[i] !== newStrings[i]) {
          return false;
        }
      }

      return true;
    }

    if (!this.isTripleArray(oldResults) && !this.isTripleArray(newResults)) {
      const stringify = (result: SolutionMapping): string => {
        const entries: string[] = [];
        result.getBindings().forEach((value, key) => {
          entries.push(`${key}:${value.toString()}`);
        });
        return entries.sort().join("|");
      };

      const oldStrings = oldResults.map(stringify).sort();
      const newStrings = newResults.map(stringify).sort();

      for (let i = 0; i < oldStrings.length; i++) {
        if (oldStrings[i] !== newStrings[i]) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  private showRefreshIndicator(container: HTMLElement): void {
    const existing = container.querySelector(".sparql-refresh-indicator");
    if (!existing) {
      const indicator = document.createElement("div");
      indicator.className = "sparql-refresh-indicator";

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.classList.add("sparql-refresh-spinner");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("width", "16");
      svg.setAttribute("height", "16");

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16");
      path.setAttribute("stroke", "currentColor");
      path.setAttribute("stroke-width", "2");
      path.setAttribute("fill", "none");
      path.setAttribute("stroke-linecap", "round");

      svg.appendChild(path);
      indicator.appendChild(svg);

      const span = document.createElement("span");
      span.textContent = "Refreshing...";
      indicator.appendChild(span);

      container.insertBefore(indicator, container.firstChild);
    }
  }

  private hideRefreshIndicator(container: HTMLElement): void {
    const indicator = container.querySelector(".sparql-refresh-indicator");
    if (indicator) {
      indicator.remove();
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

      for (const triple of triples) {
        this.tripleStore.add(triple);
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      console.error("[Exocortex SPARQL] Triple store initialization error:", errorObj);
      console.error("[Exocortex SPARQL] Stack trace:", errorObj.stack);
      new Notice(`Failed to load triple store: ${errorObj.message}`, 5000);
      throw errorObj;
    } finally {
      this.isLoading = false;
    }
  }

  private async executeQuery(queryString: string): Promise<SolutionMapping[] | Triple[]> {
    if (!this.tripleStore) {
      throw new Error("Triple store not initialized");
    }

    const parser = new SPARQLParser();
    const ast: SPARQLQuery = parser.parse(queryString);

    const translator = new AlgebraTranslator();
    let algebra = translator.translate(ast);

    const optimizer = new AlgebraOptimizer();
    algebra = optimizer.optimize(algebra);

    if (this.isConstructQuery(queryString)) {
      return await this.executeConstructQuery(algebra);
    } else {
      return await this.executeAlgebra(algebra);
    }
  }

  private isConstructQuery(queryString: string): boolean {
    return /^\s*CONSTRUCT\s+/i.test(queryString);
  }

  private async executeConstructQuery(algebra: any): Promise<Triple[]> {
    if (!this.tripleStore) {
      throw new Error("Triple store not initialized");
    }

    let operation = algebra;
    let template: any[] = [];

    if (operation.type === "construct") {
      template = operation.template;
      operation = operation.input;
    }

    const solutions = await this.executeAlgebra(operation);

    const constructExecutor = new ConstructExecutor();
    return await constructExecutor.execute(template, solutions);
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
    results: SolutionMapping[] | Triple[],
    container: HTMLElement,
    queryString: string
  ): void {
    this.reactRenderer.render(
      container,
      React.createElement(SPARQLResultViewer, {
        results,
        queryString,
        app: this.plugin.app,
        onAssetClick: (path: string) => {
          this.plugin.app.workspace.openLinkText(path, "", false, { active: true });
        },
      })
    );
  }

  private shouldRenderAsGraph(triples: Triple[]): boolean {
    if (triples.length === 0) {
      return false;
    }

    let relationshipCount = 0;

    for (const triple of triples) {
      const subjectStr = triple.subject.toString();
      const objectStr = triple.object.toString();

      const isSubjectIRI = subjectStr.startsWith("<") && subjectStr.endsWith(">");
      const isObjectIRI = objectStr.startsWith("<") && objectStr.endsWith(">");

      if (isSubjectIRI && isObjectIRI) {
        relationshipCount++;
      }
    }

    return relationshipCount >= 2;
  }

  private isTripleArray(results: SolutionMapping[] | Triple[]): results is Triple[] {
    return results.length > 0 && "subject" in results[0];
  }

  private renderError(error: Error, container: HTMLElement): void {
    const errorDiv = document.createElement("div");
    errorDiv.className = "sparql-error";

    const strong = document.createElement("strong");
    strong.textContent = "Query error:";
    errorDiv.appendChild(strong);

    const pre = document.createElement("pre");
    pre.textContent = error.message;
    errorDiv.appendChild(pre);

    container.appendChild(errorDiv);
  }

  private extractVariables(queryString: string): string[] {
    const selectMatch = queryString.match(/SELECT\s+(.*?)\s+WHERE/i);
    if (!selectMatch) {
      return [];
    }

    const selectClause = selectMatch[1];
    const variables = selectClause.match(/\?(\w+)/g) || [];
    return variables.map((v) => v.substring(1));
  }
}
