import { App, Modal, Setting } from "obsidian";
import type { LabelInputModalResult } from "./LabelInputModal";

/**
 * Result from DynamicAssetCreationModal
 * Extends base result with additional property values from dynamic fields
 */
export interface DynamicAssetCreationResult extends LabelInputModalResult {
  /** Additional property values collected from dynamic fields */
  propertyValues: Record<string, unknown>;
}

/**
 * Dynamic modal for creating assets with ontology-driven fields.
 *
 * Phase 1 (current): Shows basic label and task size fields (same as LabelInputModal)
 * Phase 2 (future): Will query OntologySchemaService for class properties
 *                   and render fields dynamically based on property types.
 *
 * @example
 * ```typescript
 * const modal = new DynamicAssetCreationModal(
 *   this.app,
 *   'ems__Task',
 *   (result) => {
 *     if (result.label !== null) {
 *       // Create asset with result.label, result.taskSize, result.propertyValues
 *     }
 *   }
 * );
 * modal.open();
 * ```
 */
export class DynamicAssetCreationModal extends Modal {
  private label = "";
  private taskSize: string | null = null;
  private openInNewTab = false;
  private propertyValues: Record<string, unknown> = {};
  private inputEl: HTMLInputElement | null = null;

  constructor(
    app: App,
    private className: string,
    private onSubmit: (result: DynamicAssetCreationResult) => void,
  ) {
    super(app);
  }

  override onOpen(): void {
    const { contentEl } = this;

    contentEl.addClass("exocortex-dynamic-asset-modal");

    // Title based on class name
    const displayClassName = this.getDisplayClassName(this.className);
    contentEl.createEl("h2", { text: `Create ${displayClassName}` });

    // Phase 1: Basic fields (label + task size)
    // TODO (Phase 2): Fetch properties from OntologySchemaService and render dynamically
    this.renderBasicFields(contentEl);

    // Button container
    const buttonContainer = contentEl.createDiv({
      cls: "modal-button-container",
    });

    const createButton = buttonContainer.createEl("button", {
      text: "Create",
      cls: "mod-cta",
    });
    createButton.addEventListener("click", () => this.submit());

    const cancelButton = buttonContainer.createEl("button", {
      text: "Cancel",
    });
    cancelButton.addEventListener("click", () => this.cancel());

    // Focus on input
    setTimeout(() => {
      this.inputEl?.focus();
    }, 50);
  }

  /**
   * Renders basic fields for Phase 1 implementation.
   * Will be replaced/extended by dynamic field rendering in Phase 2.
   */
  private renderBasicFields(contentEl: HTMLElement): void {
    // Label field
    new Setting(contentEl)
      .setName("Label")
      .setDesc("Display label for the new asset (optional)")
      .addText((text) => {
        this.inputEl = text.inputEl;
        text
          .setPlaceholder("Enter label...")
          .setValue(this.label)
          .onChange((value) => {
            this.label = value;
          });

        text.inputEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            this.submit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            this.cancel();
          }
        });
      });

    // Task size field (only for Task class)
    if (this.isTaskClass(this.className)) {
      const taskSizeSetting = new Setting(contentEl)
        .setName("Task size")
        .setDesc("Estimated size of the task");

      const selectContainer = taskSizeSetting.controlEl.createEl("select", {
        cls: "dropdown",
      });

      const taskSizeOptions = [
        { value: "", label: "Not specified" },
        { value: '"[[ems__TaskSize_XXS]]"', label: "XXS" },
        { value: '"[[ems__TaskSize_XS]]"', label: "XS" },
        { value: '"[[ems__TaskSize_S]]"', label: "S" },
        { value: '"[[ems__TaskSize_M]]"', label: "M" },
      ];

      taskSizeOptions.forEach((option) => {
        selectContainer.createEl("option", {
          value: option.value,
          text: option.label,
        });
      });

      selectContainer.addEventListener("change", (e) => {
        const selectedValue = (e.target as HTMLSelectElement).value;
        this.taskSize = selectedValue || null;
      });
    }

    // Open in new tab checkbox
    new Setting(contentEl)
      .setName("Open in new tab")
      .setDesc("Open the created asset in a new tab instead of the current one")
      .addToggle((toggle) => {
        toggle.setValue(this.openInNewTab).onChange((value) => {
          this.openInNewTab = value;
        });
      });
  }

  /**
   * Checks if the class is a Task class (or subclass of Task).
   */
  private isTaskClass(className: string): boolean {
    return className === "ems__Task" || className.startsWith("ems__Task_");
  }

  /**
   * Converts internal class name to human-readable display name.
   */
  private getDisplayClassName(className: string): string {
    // Remove prefix (ems__, exo__, etc.)
    const withoutPrefix = className.replace(/^[a-z]+__/, "");
    // Convert underscores to spaces and add proper spacing for camelCase
    return withoutPrefix
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2");
  }

  private submit(): void {
    const trimmedLabel = this.label.trim();
    this.onSubmit({
      label: trimmedLabel || null,
      taskSize: this.taskSize,
      openInNewTab: this.openInNewTab,
      propertyValues: this.propertyValues,
    });
    this.close();
  }

  private cancel(): void {
    this.onSubmit({
      label: null,
      taskSize: null,
      openInNewTab: this.openInNewTab,
      propertyValues: {},
    });
    this.close();
  }

  override onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
