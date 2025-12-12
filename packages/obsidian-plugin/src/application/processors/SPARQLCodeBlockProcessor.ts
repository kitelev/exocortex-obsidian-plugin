import React from "react";
import { MarkdownPostProcessorContext, EventRef, Notice, MarkdownRenderChild } from "obsidian";
import {
  InMemoryTripleStore,
  SPARQLParser,
  SPARQLParseError,
  AlgebraTranslator,
  AlgebraOptimizer,
  BGPExecutor,
  ConstructExecutor,
  NoteToRDFConverter,
  type SPARQLQuery,
  type SolutionMapping,
  type Triple,
  type AlgebraOperation,
  type ConstructOperation,
  type AlgebraTriple,
} from "@exocortex/core";
import type ExocortexPlugin from "../../ExocortexPlugin";
import { ObsidianVaultAdapter } from "../../adapters/ObsidianVaultAdapter";
import { ReactRenderer } from "../../presentation/utils/ReactRenderer";
import { SPARQLResultViewer } from "../../presentation/components/sparql/SPARQLResultViewer";
import { SPARQLErrorView, type SPARQLError } from "../../presentation/components/sparql/SPARQLErrorView";
import { LoggerFactory } from "../../adapters/logging/LoggerFactory";

class SPARQLCleanupComponent extends MarkdownRenderChild {
  constructor(
    containerEl: HTMLElement,
    private el: HTMLElement,
    private activeQueries: Map<HTMLElement, {
      source: string;
      lastResults: SolutionMapping[] | Triple[];
      refreshTimeout?: ReturnType<typeof setTimeout>;
      eventRef?: EventRef;
    }>,
    private reactRenderer: ReactRenderer,
    private container: HTMLElement,
    private plugin: ExocortexPlugin
  ) {
    super(containerEl);
  }

  override onload(): void {
    // Nothing needed on load
  }

  override onunload(): void {
    const query = this.activeQueries.get(this.el);
    if (query) {
      if (query.refreshTimeout) {
        clearTimeout(query.refreshTimeout);
      }
      if (query.eventRef) {
        this.plugin.app.metadataCache.offref(query.eventRef);
      }
      this.activeQueries.delete(this.el);
    }
    this.reactRenderer.unmount(this.container);
  }
}

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
  private readonly logger = LoggerFactory.create("SPARQLCodeBlockProcessor");

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

      ctx.addChild(
        new SPARQLCleanupComponent(
          el,
          el,
          this.activeQueries,
          this.reactRenderer,
          container,
          this.plugin
        )
      );

      const activeQuery = this.activeQueries.get(el);
      if (activeQuery) {
        activeQuery.eventRef = eventRef;
      }

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logger.error("Query execution error", errorObj);
      new Notice(`SPARQL query error: ${errorObj.message}`, 5000);

      container.innerHTML = "";
      this.renderError(errorObj, container, source);
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
      this.logger.error("Query refresh error", errorObj);
      new Notice(`SPARQL query refresh error: ${errorObj.message}`, 5000);

      container.innerHTML = "";
      this.renderError(errorObj, container, source);
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
      this.logger.error("Triple store initialization error", errorObj);
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

  private async executeConstructQuery(algebra: AlgebraOperation): Promise<Triple[]> {
    if (!this.tripleStore) {
      throw new Error("Triple store not initialized");
    }

    let operation: AlgebraOperation = algebra;
    let template: AlgebraTriple[] = [];

    if (operation.type === "construct") {
      const constructOp = operation as ConstructOperation;
      template = constructOp.template;
      operation = constructOp.where;
    }

    const solutions = await this.executeAlgebra(operation);

    const constructExecutor = new ConstructExecutor();
    return await constructExecutor.execute(template, solutions);
  }

  private async executeAlgebra(algebra: AlgebraOperation): Promise<SolutionMapping[]> {
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

  private isTripleArray(results: SolutionMapping[] | Triple[]): results is Triple[] {
    return results.length > 0 && "subject" in results[0];
  }

  private renderError(error: Error, container: HTMLElement, queryString: string): void {
    const sparqlError: SPARQLError = {
      message: error.message,
      queryString,
    };

    if (error instanceof SPARQLParseError) {
      sparqlError.line = error.line;
      sparqlError.column = error.column;
    }

    this.reactRenderer.render(
      container,
      React.createElement(SPARQLErrorView, { error: sparqlError }),
    );
  }
}
