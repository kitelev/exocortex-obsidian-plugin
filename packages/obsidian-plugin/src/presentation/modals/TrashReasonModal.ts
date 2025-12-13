import { App, Modal } from "obsidian";

export interface TrashReasonModalResult {
  reason: string | null;
  confirmed: boolean;
}

/**
 * Modal that prompts for a reason when trashing an ems__Effort asset.
 * Allows users to document why an effort was abandoned.
 */
export class TrashReasonModal extends Modal {
  private reason = "";
  private onSubmit: (result: TrashReasonModalResult) => void;
  private inputEl: HTMLTextAreaElement | null = null;

  constructor(app: App, onSubmit: (result: TrashReasonModalResult) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  override onOpen(): void {
    const { contentEl } = this;

    contentEl.addClass("exocortex-trash-reason-modal");

    contentEl.createEl("h2", { text: "Trash effort" });

    contentEl.createEl("p", {
      text: "Enter a reason for trashing this effort (optional):",
      cls: "exocortex-modal-description",
    });

    const inputContainer = contentEl.createDiv({
      cls: "exocortex-modal-input-container",
    });

    this.inputEl = inputContainer.createEl("textarea", {
      placeholder: "Reason for trashing...",
      cls: "exocortex-modal-input exocortex-modal-textarea",
    });

    this.inputEl.rows = 3;

    this.inputEl.addEventListener("input", (event) => {
      this.reason = (event.target as HTMLTextAreaElement).value;
    });

    this.inputEl.addEventListener("keydown", (event) => {
      // Allow Enter for new lines in textarea, but Ctrl+Enter or Cmd+Enter to submit
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
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

    const confirmButton = buttonContainer.createEl("button", {
      text: "Confirm",
      cls: "mod-cta",
    });
    confirmButton.addEventListener("click", () => this.submit());

    const cancelButton = buttonContainer.createEl("button", {
      text: "Cancel",
    });
    cancelButton.addEventListener("click", () => this.cancel());

    window.setTimeout(() => {
      this.inputEl?.focus();
    }, 50);
  }

  private submit(): void {
    const trimmedReason = this.reason.trim();
    this.onSubmit({
      reason: trimmedReason || null,
      confirmed: true,
    });
    this.close();
  }

  private cancel(): void {
    this.onSubmit({
      reason: null,
      confirmed: false,
    });
    this.close();
  }

  override onClose(): void {
    this.contentEl.empty();
  }
}
