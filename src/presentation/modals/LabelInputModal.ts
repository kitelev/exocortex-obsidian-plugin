import { App, Modal } from "obsidian";

/**
 * Modal for inputting asset label during creation
 * Allows optional label input with Create/Cancel actions
 */
export class LabelInputModal extends Modal {
  private label: string = "";
  private onSubmit: (label: string | null) => void;
  private inputEl: HTMLInputElement | null = null;

  constructor(app: App, onSubmit: (label: string | null) => void, defaultValue: string = "") {
    super(app);
    this.onSubmit = onSubmit;
    this.label = defaultValue;
  }

  onOpen(): void {
    const { contentEl } = this;

    contentEl.addClass("exocortex-label-input-modal");

    contentEl.createEl("h2", { text: "Create Asset" });

    const description = contentEl.createEl("p", {
      text: "Enter a display label for the new asset (optional):",
      cls: "exocortex-modal-description",
    });

    const inputContainer = contentEl.createDiv({ cls: "exocortex-modal-input-container" });

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

    const buttonContainer = contentEl.createDiv({ cls: "modal-button-container" });

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
    this.onSubmit(trimmedLabel);
    this.close();
  }

  private cancel(): void {
    this.onSubmit(null);
    this.close();
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
