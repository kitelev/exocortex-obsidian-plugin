import { App, Modal } from "obsidian";

/**
 * Result from the TrashReasonModal
 */
export interface TrashReasonModalResult {
  /** Whether the user confirmed the action (true) or cancelled (false) */
  confirmed: boolean;
  /** The trash reason entered by the user, or null if cancelled/empty */
  reason: string | null;
}

/**
 * Modal for inputting the reason when trashing an effort.
 * Allows users to document why an effort was trashed for retrospectives and pattern analysis.
 */
export class TrashReasonModal extends Modal {
  private reason = "";
  private onSubmit: (result: TrashReasonModalResult) => void;
  private inputEl: HTMLTextAreaElement | null = null;

  constructor(
    app: App,
    onSubmit: (result: TrashReasonModalResult) => void,
  ) {
    super(app);
    this.onSubmit = onSubmit;
  }

  override onOpen(): void {
    const { contentEl } = this;

    contentEl.addClass("exocortex-trash-reason-modal");

    contentEl.createEl("h2", { text: "Trash effort" });

    contentEl.createEl("p", {
      text: "Optionally enter a reason for trashing this effort. This will be appended to the note.",
      cls: "exocortex-modal-description",
    });

    const inputContainer = contentEl.createDiv({
      cls: "exocortex-modal-input-container",
    });

    this.inputEl = inputContainer.createEl("textarea", {
      placeholder: "Reason for trashing (optional)",
      cls: "exocortex-modal-input exocortex-modal-textarea",
    });

    this.inputEl.rows = 3;
    this.inputEl.value = this.reason;

    this.inputEl.addEventListener("input", (e) => {
      this.reason = (e.target as HTMLTextAreaElement).value;
    });

    this.inputEl.addEventListener("keydown", (e) => {
      // Allow Enter for newlines in textarea, but Ctrl/Cmd+Enter to submit
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.submit();
      } else if (e.key === "Escape") {
        e.preventDefault();
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

    setTimeout(() => {
      this.inputEl?.focus();
    }, 50);
  }

  private submit(): void {
    const trimmedReason = this.reason.trim();
    this.onSubmit({
      confirmed: true,
      reason: trimmedReason || null,
    });
    this.close();
  }

  private cancel(): void {
    this.onSubmit({
      confirmed: false,
      reason: null,
    });
    this.close();
  }

  override onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
