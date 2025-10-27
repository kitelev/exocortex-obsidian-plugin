import { App, Modal } from "obsidian";

export interface LabelInputModalResult {
  label: string | null;
  taskSize: string | null;
}

/**
 * Modal for inputting asset label and task size during creation
 * Allows optional label input and task size selection with Create/Cancel actions
 */
export class LabelInputModal extends Modal {
  private label = "";
  private taskSize: string | null = null;
  private onSubmit: (result: LabelInputModalResult) => void;
  private inputEl: HTMLInputElement | null = null;
  private taskSizeSelectEl: HTMLSelectElement | null = null;
  private showTaskSize: boolean;

  constructor(
    app: App,
    onSubmit: (result: LabelInputModalResult) => void,
    defaultValue = "",
    showTaskSize = true,
  ) {
    super(app);
    this.onSubmit = onSubmit;
    this.label = defaultValue;
    this.showTaskSize = showTaskSize;
  }

  onOpen(): void {
    const { contentEl } = this;

    contentEl.addClass("exocortex-label-input-modal");

    contentEl.createEl("h2", { text: "Create asset" });

    contentEl.createEl("p", {
      text: "Enter a display label for the new asset (optional):",
      cls: "exocortex-modal-description",
    });

    const inputContainer = contentEl.createDiv({
      cls: "exocortex-modal-input-container",
    });

    this.inputEl = inputContainer.createEl("input", {
      type: "text",
      placeholder: "Asset label (optional)",
      cls: "exocortex-modal-input",
    });

    this.inputEl.value = this.label;

    this.inputEl.addEventListener("input", (e) => {
      this.label = (e.target as HTMLInputElement).value;
    });

    this.inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.submit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.cancel();
      }
    });

    if (this.showTaskSize) {
      contentEl.createEl("p", {
        text: "Task size:",
        cls: "exocortex-modal-description",
      });

      const selectContainer = contentEl.createDiv({
        cls: "exocortex-modal-input-container",
      });

      this.taskSizeSelectEl = selectContainer.createEl("select", {
        cls: "exocortex-modal-select dropdown",
      });

      const taskSizeOptions = [
        { value: "", label: "Not specified" },
        { value: '"[[ems__TaskSize_XXS]]"', label: "XXS" },
        { value: '"[[ems__TaskSize_XS]]"', label: "XS" },
        { value: '"[[ems__TaskSize_S]]"', label: "S" },
        { value: '"[[ems__TaskSize_M]]"', label: "M" },
      ];

      taskSizeOptions.forEach((option) => {
        if (this.taskSizeSelectEl) {
          this.taskSizeSelectEl.createEl("option", {
            value: option.value,
            text: option.label,
          });
        }
      });

      this.taskSizeSelectEl.addEventListener("change", (e) => {
        const selectedValue = (e.target as HTMLSelectElement).value;
        this.taskSize = selectedValue || null;
      });
    }

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

    setTimeout(() => {
      this.inputEl?.focus();
    }, 50);
  }

  private submit(): void {
    const trimmedLabel = this.label.trim();
    this.onSubmit({
      label: trimmedLabel || null,
      taskSize: this.taskSize,
    });
    this.close();
  }

  private cancel(): void {
    this.onSubmit({ label: null, taskSize: null });
    this.close();
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
