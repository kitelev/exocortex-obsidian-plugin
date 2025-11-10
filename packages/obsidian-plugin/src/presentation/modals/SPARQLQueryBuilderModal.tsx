import { Modal, App, Notice } from "obsidian";
import React from "react";
import {
  InMemoryTripleStore,
  SPARQLParser,
  AlgebraTranslator,
  AlgebraOptimizer,
  BGPExecutor,
  ConstructExecutor,
  NoteToRDFConverter,
  type SolutionMapping,
  type Triple,
} from "@exocortex/core";
import type ExocortexPlugin from "../../ExocortexPlugin";
import { ObsidianVaultAdapter } from "../../adapters/ObsidianVaultAdapter";
import { ReactRenderer } from "../utils/ReactRenderer";
import { QueryBuilder } from "../components/sparql/QueryBuilder";

export class SPARQLQueryBuilderModal extends Modal {
  private plugin: ExocortexPlugin;
  private reactRenderer: ReactRenderer;
  private tripleStore: InMemoryTripleStore | null = null;
  private isLoading = false;

  constructor(app: App, plugin: ExocortexPlugin) {
    super(app);
    this.plugin = plugin;
    this.reactRenderer = new ReactRenderer();
  }

  async onOpen(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("sparql-query-builder-modal");

    const titleEl = contentEl.createEl("div", { cls: "modal-title" });
    titleEl.textContent = "sparql query builder";

    const container = contentEl.createEl("div", { cls: "sparql-query-builder-container" });

    const loadingDiv = container.createEl("div", { cls: "sparql-loading" });
    loadingDiv.textContent = "loading query engine...";

    try {
      await this.ensureTripleStoreLoaded();
      container.innerHTML = "";

      this.reactRenderer.render(
        React.createElement(QueryBuilder, {
          app: this.app,
          onExecuteQuery: this.executeQuery.bind(this),
          onAssetClick: this.handleAssetClick.bind(this),
          onCopyQuery: this.handleCopyQuery.bind(this),
        }),
        container
      );
    } catch (error) {
      container.innerHTML = "";
      const errorDiv = container.createEl("div", { cls: "sparql-error" });
      errorDiv.textContent = `failed to load query engine: ${error instanceof Error ? error.message : String(error)}`;
      console.error("[Exocortex Query Builder] Failed to load:", error);
    }
  }

  onClose(): void {
    const { contentEl } = this;
    this.reactRenderer.unmount(contentEl);
    contentEl.empty();
  }

  private async ensureTripleStoreLoaded(): Promise<void> {
    if (this.tripleStore) {
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
      const vaultAdapter = new ObsidianVaultAdapter(this.plugin.app.vault);
      const allFiles = this.plugin.app.vault.getMarkdownFiles();

      const converter = new NoteToRDFConverter(vaultAdapter);
      const store = new InMemoryTripleStore();

      for (const file of allFiles) {
        try {
          const triples = await converter.convertNote(file.path);
          for (const triple of triples) {
            store.add(triple);
          }
        } catch (error) {
          console.warn(`[Exocortex Query Builder] Skipping file ${file.path}:`, error);
        }
      }

      this.tripleStore = store;
    } finally {
      this.isLoading = false;
    }
  }

  private async executeQuery(query: string): Promise<SolutionMapping[] | Triple[]> {
    if (!this.tripleStore) {
      throw new Error("triple store not loaded");
    }

    const parser = new SPARQLParser();
    const parsedQuery = parser.parse(query);

    const translator = new AlgebraTranslator();
    const algebra = translator.translate(parsedQuery);

    const optimizer = new AlgebraOptimizer();
    const optimized = optimizer.optimize(algebra);

    if (parsedQuery.queryType === "SELECT" || parsedQuery.queryType === "ASK") {
      const executor = new BGPExecutor(this.tripleStore);
      return executor.execute(optimized);
    } else if (parsedQuery.queryType === "CONSTRUCT" || parsedQuery.queryType === "DESCRIBE") {
      const constructExecutor = new ConstructExecutor(
        this.tripleStore,
        new BGPExecutor(this.tripleStore)
      );
      return constructExecutor.execute(parsedQuery as any, optimized);
    } else {
      throw new Error(`unsupported query type: ${parsedQuery.queryType}`);
    }
  }

  private handleAssetClick(path: string, event?: React.MouseEvent): void {
    const file = this.plugin.app.vault.getAbstractFileByPath(path);
    if (!file) {
      new Notice(`file not found: ${path}`);
      return;
    }

    const newLeaf = event?.ctrlKey || event?.metaKey;

    if (newLeaf) {
      const leaf = this.plugin.app.workspace.getLeaf("tab");
      leaf.openFile(file as any);
    } else {
      this.plugin.app.workspace.getLeaf().openFile(file as any);
      this.close();
    }
  }

  private handleCopyQuery(query: string): void {
    new Notice("query copied to clipboard", 2000);
  }
}
