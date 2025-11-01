import { App, Modal } from "obsidian";

export interface FleetingNoteModalResult {
  label: string | null;
}

/**
 * Modal that collects a required label for fleeting note creation.
 */
export class FleetingNoteModal extends Modal {
  private label = "";
  private onSubmit: (result: FleetingNoteModalResult) => void;
  private inputEl: HTMLInputElement | null = null;
  private errorEl: HTMLDivElement | null = null;

  constructor(app: App, onSubmit: (result: FleetingNoteModalResult) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    const { contentEl } = this;

    contentEl.addClass("exocortex-fleeting-note-modal");

    contentEl.createEl("h2", { text: "Create fleeting note" });

    const inputContainer = contentEl.createDiv({
      cls: "exocortex-modal-input-container",
    });

    this.inputEl = inputContainer.createEl("input", {
      type: "text",
      placeholder: "Label",
      cls: "exocortex-modal-input",
    });

    const errorElement = contentEl.createDiv({
      cls: "exocortex-modal-error-message",
    });
    errorElement.style.display = "none";
    this.errorEl = errorElement;

    this.inputEl.addEventListener("input", (event) => {
      this.label = (event.target as HTMLInputElement).value;
      this.clearErrorState();
    });

    this.inputEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        this.submit();
      } else if (event.key === "Escape") {
        event.preventDefault();
        this.cancel();
      }
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

    window.setTimeout(() => {
      this.inputEl?.focus();
    }, 50);
  }

  private submit(): void {
    const trimmedLabel = this.label.trim();
    if (!trimmedLabel) {
      this.showError("Label is required");
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
    this.inputEl?.classList.add("exocortex-modal-input--error");
    if (this.errorEl) {
      this.errorEl.textContent = message;
      this.errorEl.style.display = "";
    }
  }

  private clearErrorState(): void {
    this.inputEl?.classList.remove("exocortex-modal-input--error");
    if (this.errorEl) {
      this.errorEl.style.display = "none";
      this.errorEl.textContent = "";
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
