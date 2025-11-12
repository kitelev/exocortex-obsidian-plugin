import { App, Modal } from "obsidian";

export interface SubclassCreationModalResult {
  label: string | null;
}

export class SubclassCreationModal extends Modal {
  private label = "";
  private onSubmit: (result: SubclassCreationModalResult) => void;
  private labelEl: HTMLInputElement | null = null;

  constructor(app: App, onSubmit: (result: SubclassCreationModalResult) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    const { contentEl } = this;

    contentEl.addClass("exocortex-subclass-creation-modal");

    contentEl.createEl("h2", { text: "Create subclass" });

    contentEl.createEl("p", {
      text: "Subclass label (required):",
      cls: "exocortex-modal-description",
    });

    const labelContainer = contentEl.createDiv({
      cls: "exocortex-modal-input-container",
    });

    this.labelEl = labelContainer.createEl("input", {
      type: "text",
      placeholder: "enter subclass label...",
      cls: "exocortex-modal-input",
    });

    this.labelEl.addEventListener("input", (e) => {
      this.label = (e.target as HTMLInputElement).value;
    });

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
      this.labelEl?.focus();
    }, 50);
  }

  private submit(): void {
    const trimmedLabel = this.label.trim();

    if (!trimmedLabel) {
      this.showError("Subclass label is required");
      return;
    }

    this.onSubmit({ label: trimmedLabel });
    this.close();
  }

  private cancel(): void {
    this.onSubmit({ label: null });
    this.close();
  }

  private showError(message: string): void {
    const existingError = this.contentEl.querySelector(
      ".exocortex-modal-error",
    );
    if (existingError) {
      existingError.remove();
    }

    const errorEl = this.contentEl.createDiv({
      text: message,
      cls: "exocortex-modal-error",
    });

    setTimeout(() => {
      errorEl.remove();
    }, 3000);
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
