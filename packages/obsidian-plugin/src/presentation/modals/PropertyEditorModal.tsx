import { Modal, App, Notice, TFile } from "obsidian";
import React from "react";
import { FrontmatterService } from "@exocortex/core";
import type ExocortexPlugin from "../../ExocortexPlugin";
import { ReactRenderer } from "../utils/ReactRenderer";
import { PropertyEditorForm } from "../components/property-editor/PropertyEditorForm";
import { ErrorBoundary } from "../components/ErrorBoundary";

export class PropertyEditorModal extends Modal {
  private plugin: ExocortexPlugin;
  private reactRenderer: ReactRenderer;
  private file: TFile;
  private frontmatter: Record<string, unknown>;
  private instanceClass: string;

  constructor(
    app: App,
    plugin: ExocortexPlugin,
    file: TFile,
    frontmatter: Record<string, unknown>,
  ) {
    super(app);
    this.plugin = plugin;
    this.reactRenderer = new ReactRenderer();
    this.file = file;
    this.frontmatter = frontmatter;
    this.instanceClass = this.extractInstanceClass(frontmatter);
  }

  private extractInstanceClass(frontmatter: Record<string, unknown>): string {
    const instanceClass = frontmatter["exo__Instance_class"];
    if (Array.isArray(instanceClass) && instanceClass.length > 0) {
      return String(instanceClass[0]).replace(/^\[\[|\]\]$/g, "").replace(/^"|"$/g, "");
    }
    if (typeof instanceClass === "string") {
      return instanceClass.replace(/^\[\[|\]\]$/g, "").replace(/^"|"$/g, "");
    }
    return "ems__Task";
  }

  override onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("property-editor-modal");

    const titleEl = contentEl.createEl("div", { cls: "modal-title" });
    titleEl.textContent = "Edit properties";

    const subtitleEl = contentEl.createEl("div", { cls: "property-editor-subtitle" });
    subtitleEl.textContent = `${this.file.basename} (${this.instanceClass})`;

    const container = contentEl.createEl("div", { cls: "property-editor-container" });

    this.reactRenderer.render(
      container,
      React.createElement(
        ErrorBoundary,
        {
          children: React.createElement(PropertyEditorForm, {
            instanceClass: this.instanceClass,
            frontmatter: this.frontmatter,
            onSave: this.handleSave.bind(this),
            onCancel: this.handleCancel.bind(this),
          }),
          onError: (error: Error) => {
            console.error("[Exocortex Property Editor] Error:", error);
            new Notice(`Error in property editor: ${error.message}`);
          },
        },
      ),
    );
  }

  private async handleSave(updatedFrontmatter: Record<string, unknown>): Promise<void> {
    try {
      let fileContent = await this.app.vault.read(this.file);
      const frontmatterService = new FrontmatterService();

      for (const [key, value] of Object.entries(updatedFrontmatter)) {
        const formattedValue = this.formatPropertyValue(value);
        fileContent = frontmatterService.updateProperty(
          fileContent,
          key,
          formattedValue,
        );
      }

      await this.app.vault.modify(this.file, fileContent);
      new Notice("Properties saved successfully");
      this.close();
      this.plugin.refreshLayout?.();
    } catch (error) {
      console.error("[Exocortex Property Editor] Save error:", error);
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`Failed to save properties: ${message}`, 5000);
    }
  }

  private formatPropertyValue(value: unknown): string {
    if (value === null || value === undefined) {
      return "";
    }
    if (typeof value === "boolean") {
      return value.toString();
    }
    if (typeof value === "number") {
      return value.toString();
    }
    if (Array.isArray(value)) {
      return `\n${value.map((v) => `  - ${v}`).join("\n")}`;
    }
    return String(value);
  }

  private handleCancel(): void {
    this.close();
  }

  override onClose(): void {
    const { contentEl } = this;
    this.reactRenderer.unmount(contentEl);
    contentEl.empty();
  }
}
