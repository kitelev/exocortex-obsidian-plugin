import { Plugin, Notice } from "obsidian";
import { ICommandController } from "../../application/ports/ICommandController";
import { Graph } from "../../domain/semantic/core/Graph";
import { RDFService } from "../../application/services/RDFService";
import { SPARQLProcessor } from "../processors/SPARQLProcessor";
import { ExportRDFModal } from "../modals/ExportRDFModal";
import { ImportRDFModal } from "../modals/ImportRDFModal";

/**
 * RDF Command Controller following Controller Pattern (GRASP)
 * Single Responsibility: Handle RDF import/export commands only
 */
export class RDFCommandController implements ICommandController {
  constructor(
    private readonly plugin: Plugin,
    private readonly graph: Graph,
    private readonly rdfService: RDFService,
    private readonly sparqlProcessor: SPARQLProcessor
  ) {}

  async registerCommands(): Promise<void> {
    // Register command: Export knowledge graph
    this.plugin.addCommand({
      id: "export-knowledge-graph",
      name: "Export knowledge graph",
      callback: () => {
        const modal = new ExportRDFModal(
          this.plugin.app,
          this.graph,
          this.rdfService.getNamespaceManager(),
          (result) => {
            // Graph export completed
          },
        );
        modal.open();
      },
    });

    // Register command: Import RDF data
    this.plugin.addCommand({
      id: "import-rdf-data",
      name: "Import RDF data",
      callback: () => {
        const modal = new ImportRDFModal(
          this.plugin.app,
          this.graph,
          this.rdfService.getNamespaceManager(),
          async (importedGraph, options) => {
            try {
              if (options.mergeMode === "replace") {
                this.graph.clear();
                this.graph.merge(importedGraph);
              } else {
                this.graph.merge(importedGraph);
              }

              // Invalidate SPARQL cache since graph changed
              this.sparqlProcessor.invalidateCache();

              // RDF import completed
            } catch (error) {
              // RDF import failed
              new Notice(`Import failed: ${error.message}`);
            }
          },
        );
        modal.open();
      },
    });
  }

  async cleanup(): Promise<void> {
    // No specific cleanup needed for RDF commands
  }

  getControllerId(): string {
    return "RDFCommandController";
  }
}