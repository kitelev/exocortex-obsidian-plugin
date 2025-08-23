/**
 * Modal for RDF Export functionality
 * Allows users to export knowledge graph or query results to various RDF formats
 */

import { App, Modal, Setting, Notice, TFile } from "obsidian";
import { Graph } from "../../domain/semantic/core/Graph";
import {
  RDFSerializer,
  RDFFormat,
  SerializationOptions,
} from "../../application/services/RDFSerializer";
import { NamespaceManager } from "../../application/services/NamespaceManager";

export interface ExportOptions {
  format: RDFFormat;
  includeComments: boolean;
  prettyPrint: boolean;
  saveToVault: boolean;
  fileName?: string;
  baseIRI?: string;
}

export class ExportRDFModal extends Modal {
  private graph: Graph;
  private options: ExportOptions = {
    format: "turtle",
    includeComments: true,
    prettyPrint: true,
    saveToVault: true,
    fileName: "knowledge-graph",
  };
  private serializer: RDFSerializer;
  private namespaceManager: NamespaceManager;
  private onExport?: (result: {
    content: string;
    fileName: string;
    format: RDFFormat;
  }) => void;

  constructor(
    app: App,
    graph: Graph,
    namespaceManager?: NamespaceManager,
    onExport?: (result: {
      content: string;
      fileName: string;
      format: RDFFormat;
    }) => void,
  ) {
    super(app);
    this.graph = graph;
    this.namespaceManager = namespaceManager || new NamespaceManager();
    this.serializer = new RDFSerializer(this.namespaceManager);
    this.onExport = onExport;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    // Title
    contentEl.createEl("h2", { text: "Export Knowledge Graph" });

    // Statistics
    const statsEl = contentEl.createDiv("export-stats");
    statsEl.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Triples:</span>
                <span class="stat-value">${this.graph.size()}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Subjects:</span>
                <span class="stat-value">${this.graph.subjects().size}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Predicates:</span>
                <span class="stat-value">${this.graph.predicates().size}</span>
            </div>
        `;

    // Format selection
    new Setting(contentEl)
      .setName("Export format")
      .setDesc("Choose the RDF serialization format")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("turtle", "Turtle (.ttl)")
          .addOption("ntriples", "N-Triples (.nt)")
          .addOption("jsonld", "JSON-LD (.jsonld)")
          .addOption("rdfxml", "RDF/XML (.rdf)")
          .setValue(this.options.format)
          .onChange((value) => {
            this.options.format = value as RDFFormat;
            this.updateFileName();
            this.updatePreview();
          });
      });

    // File name setting
    new Setting(contentEl)
      .setName("File name")
      .setDesc("Name for the exported file (without extension)")
      .addText((text) => {
        text
          .setPlaceholder("knowledge-graph")
          .setValue(this.options.fileName || "")
          .onChange((value) => {
            this.options.fileName = value || "knowledge-graph";
          });
      });

    // Base IRI setting
    new Setting(contentEl)
      .setName("Base IRI")
      .setDesc("Optional base IRI for relative URIs")
      .addText((text) => {
        text
          .setPlaceholder("https://example.org/data/")
          .setValue(this.options.baseIRI || "")
          .onChange((value) => {
            this.options.baseIRI = value || undefined;
            this.updatePreview();
          });
      });

    // Options
    new Setting(contentEl)
      .setName("Include comments")
      .setDesc("Add comments with metadata and statistics")
      .addToggle((toggle) => {
        toggle.setValue(this.options.includeComments).onChange((value) => {
          this.options.includeComments = value;
          this.updatePreview();
        });
      });

    new Setting(contentEl)
      .setName("Pretty print")
      .setDesc("Format output for readability (larger file size)")
      .addToggle((toggle) => {
        toggle.setValue(this.options.prettyPrint).onChange((value) => {
          this.options.prettyPrint = value;
          this.updatePreview();
        });
      });

    new Setting(contentEl)
      .setName("Save to vault")
      .setDesc("Save file to vault, or download to computer")
      .addToggle((toggle) => {
        toggle.setValue(this.options.saveToVault).onChange((value) => {
          this.options.saveToVault = value;
        });
      });

    // Preview section
    const previewContainer = contentEl.createDiv("export-preview");
    previewContainer.createEl("h3", { text: "Preview" });

    const previewEl = previewContainer.createEl("pre");
    previewEl.addClass("export-preview-content");

    // Buttons
    const buttonContainer = contentEl.createDiv("export-buttons");
    buttonContainer.addClass("modal-button-container");

    // Export button
    const exportButton = buttonContainer.createEl("button", {
      text: "Export",
      cls: "mod-cta",
    });
    exportButton.onclick = () => this.handleExport();

    // Cancel button
    const cancelButton = buttonContainer.createEl("button", { text: "Cancel" });
    cancelButton.onclick = () => this.close();

    // Initial preview
    this.updatePreview();

    // Add styles
    this.addStyles();
  }

  /**
   * Update file name based on format
   */
  private updateFileName(): void {
    if (this.options.fileName && !this.options.fileName.includes(".")) {
      // File name will get extension added during export
    }
  }

  /**
   * Update preview content
   */
  private updatePreview(): void {
    const previewEl = this.contentEl.querySelector(
      ".export-preview-content",
    ) as HTMLElement;
    if (!previewEl) return;

    try {
      // Create a small sample for preview
      const sampleGraph = this.createSampleGraph();

      const serializationOptions: SerializationOptions = {
        format: this.options.format,
        includeComments: this.options.includeComments,
        prettyPrint: this.options.prettyPrint,
        baseIRI: this.options.baseIRI,
        namespaceManager: this.namespaceManager,
      };

      const result = this.serializer.serialize(
        sampleGraph,
        serializationOptions,
      );

      if (result.isSuccess) {
        const content = result.getValue().content;
        const lines = content.split("\n");
        const preview = lines.slice(0, 10).join("\n");

        previewEl.textContent =
          preview + (lines.length > 10 ? "\n... (truncated)" : "");
      } else {
        previewEl.textContent = `Preview error: ${result.errorValue()}`;
      }
    } catch (error) {
      previewEl.textContent = `Preview error: ${error.message}`;
    }
  }

  /**
   * Create a small sample graph for preview
   */
  private createSampleGraph(): Graph {
    const sampleTriples = this.graph.toArray().slice(0, 5);
    return new Graph(sampleTriples);
  }

  /**
   * Handle export action
   */
  private async handleExport(): Promise<void> {
    try {
      const serializationOptions: SerializationOptions = {
        format: this.options.format,
        includeComments: this.options.includeComments,
        prettyPrint: this.options.prettyPrint,
        baseIRI: this.options.baseIRI,
        namespaceManager: this.namespaceManager,
      };

      const result = this.serializer.serialize(
        this.graph,
        serializationOptions,
      );

      if (result.isFailure) {
        new Notice(`Export failed: ${result.errorValue()}`);
        return;
      }

      const serializedData = result.getValue();
      const extension = RDFSerializer.getFileExtension(this.options.format);
      const fileName = `${this.options.fileName || "knowledge-graph"}${extension}`;

      if (this.options.saveToVault) {
        // Save to vault
        await this.saveToVault(serializedData.content, fileName);
      } else {
        // Download to computer
        this.downloadFile(serializedData.content, fileName);
      }

      // Call onExport callback if provided
      if (this.onExport) {
        this.onExport({
          content: serializedData.content,
          fileName,
          format: this.options.format,
        });
      }

      const message = this.options.saveToVault
        ? `Exported ${serializedData.tripleCount} triples to ${fileName}`
        : `Downloaded ${serializedData.tripleCount} triples as ${fileName}`;

      new Notice(message);

      if (serializedData.metadata?.warnings?.length) {
        new Notice(
          `Warnings: ${serializedData.metadata.warnings.join("; ")}`,
          5000,
        );
      }

      this.close();
    } catch (error) {
      new Notice(`Export error: ${error.message}`);
    }
  }

  /**
   * Save content to vault
   */
  private async saveToVault(content: string, fileName: string): Promise<void> {
    const filePath = `exports/${fileName}`;

    try {
      // Ensure exports folder exists
      const folder = this.app.vault.getAbstractFileByPath("exports");
      if (!folder) {
        await this.app.vault.createFolder("exports");
      }

      // Create or update file
      const existingFile = this.app.vault.getAbstractFileByPath(filePath);
      if (existingFile instanceof TFile) {
        await this.app.vault.modify(existingFile, content);
      } else {
        await this.app.vault.create(filePath, content);
      }
    } catch (error) {
      throw new Error(`Failed to save to vault: ${error.message}`);
    }
  }

  /**
   * Download file to computer
   */
  private downloadFile(content: string, fileName: string): void {
    const blob = new Blob([content], {
      type: RDFSerializer.getMimeType(this.options.format),
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Add custom styles
   */
  private addStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
            .export-stats {
                display: flex;
                gap: 20px;
                margin-bottom: 20px;
                padding: 10px;
                background: var(--background-secondary);
                border-radius: 6px;
            }
            
            .stat-item {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .stat-label {
                font-size: 12px;
                color: var(--text-muted);
                margin-bottom: 2px;
            }
            
            .stat-value {
                font-size: 18px;
                font-weight: 600;
                color: var(--text-normal);
            }
            
            .export-preview {
                margin: 20px 0;
            }
            
            .export-preview-content {
                max-height: 200px;
                overflow-y: auto;
                background: var(--background-secondary);
                padding: 10px;
                border-radius: 4px;
                font-family: var(--font-monospace);
                font-size: 12px;
                white-space: pre-wrap;
                margin: 0;
            }
            
            .export-buttons {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid var(--background-modifier-border);
            }
            
            .modal-button-container button {
                padding: 8px 16px;
                border-radius: 4px;
                border: 1px solid var(--background-modifier-border);
                background: var(--background-primary);
                color: var(--text-normal);
                cursor: pointer;
            }
            
            .modal-button-container button:hover {
                background: var(--background-secondary);
            }
            
            .modal-button-container button.mod-cta {
                background: var(--interactive-accent);
                color: var(--text-on-accent);
                border-color: var(--interactive-accent);
            }
            
            .modal-button-container button.mod-cta:hover {
                background: var(--interactive-accent-hover);
                border-color: var(--interactive-accent-hover);
            }
        `;

    document.head.appendChild(style);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
