import { App, Modal } from "obsidian";

export interface SupervisionFormData {
  situation: string;
  emotions: string;
  thoughts: string;
  behavior: string;
  shortTermConsequences: string;
  longTermConsequences: string;
}

export class SupervisionInputModal extends Modal {
  private formData: SupervisionFormData = {
    situation: "",
    emotions: "",
    thoughts: "",
    behavior: "",
    shortTermConsequences: "",
    longTermConsequences: "",
  };
  private onSubmit: (data: SupervisionFormData | null) => void;
  private inputs: HTMLInputElement[] = [];

  constructor(app: App, onSubmit: (data: SupervisionFormData | null) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    const { contentEl } = this;

    contentEl.addClass("exocortex-supervision-modal");

    contentEl.createEl("h2", { text: "Добавить супервизию" });

    const fields = [
      { key: "situation", label: "Ситуация/триггер" },
      { key: "emotions", label: "Эмоции" },
      { key: "thoughts", label: "Мысли" },
      { key: "behavior", label: "Поведение" },
      {
        key: "shortTermConsequences",
        label: "Краткосрочные последствия поведения",
      },
      {
        key: "longTermConsequences",
        label: "Долгосрочные последствия поведения",
      },
    ];

    fields.forEach((field) => {
      const fieldContainer = contentEl.createDiv({
        cls: "exocortex-modal-field-container",
      });

      fieldContainer.createEl("label", {
        text: field.label,
        cls: "exocortex-modal-label",
      });

      const input = fieldContainer.createEl("input", {
        type: "text",
        cls: "exocortex-modal-input",
      });

      input.addEventListener("input", (e) => {
        this.formData[field.key as keyof SupervisionFormData] = (
          e.target as HTMLInputElement
        ).value;
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.submit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          this.cancel();
        }
      });

      this.inputs.push(input);
    });

    const buttonContainer = contentEl.createDiv({
      cls: "modal-button-container",
    });

    const submitButton = buttonContainer.createEl("button", {
      text: "Создать",
      cls: "mod-cta",
    });
    submitButton.addEventListener("click", () => this.submit());

    const cancelButton = buttonContainer.createEl("button", {
      text: "Отмена",
    });
    cancelButton.addEventListener("click", () => this.cancel());

    setTimeout(() => {
      this.inputs[0]?.focus();
    }, 50);
  }

  private submit(): void {
    this.onSubmit(this.formData);
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
