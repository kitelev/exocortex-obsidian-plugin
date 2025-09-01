import { App, Setting } from "obsidian";
import { IOntologyRepository } from "../../../domain/repositories/IOntologyRepository";
import { IClassViewRepository } from "../../../domain/repositories/IClassViewRepository";

export interface FormFieldValues {
  assetTitle: string;
  assetClass: string;
  assetOntology: string;
}

export interface FormUICallbacks {
  onTitleChange: (title: string) => void;
  onClassChange: (className: string) => Promise<void>;
  onOntologyChange: (ontology: string) => void;
  onCreateAsset: () => Promise<void>;
  onCancel: () => void;
}

/**
 * Manages form UI construction and interactions
 * Extracted from CreateAssetModal to follow Single Responsibility Principle
 */
export class FormUIManager {
  private values: FormFieldValues = {
    assetTitle: "",
    assetClass: "exo__Asset",
    assetOntology: "",
  };

  constructor(
    private app: App,
    private ontologyRepository: IOntologyRepository,
    private classViewRepository: IClassViewRepository,
  ) {}

  async setupTitleField(
    containerEl: HTMLElement,
    callbacks: FormUICallbacks,
  ): Promise<void> {
    new Setting(containerEl)
      .setName("Asset Title")
      .setDesc("The name of the new asset")
      .addText((text) => {
        text
          .setPlaceholder("Enter asset title")
          .setValue(this.values.assetTitle)
          .onChange((value) => {
            this.values.assetTitle = value;
            callbacks.onTitleChange(value);
          });
        // Auto-focus the title field
        setTimeout(() => text.inputEl.focus(), 50);
      });
  }

  async setupClassField(
    containerEl: HTMLElement,
    callbacks: FormUICallbacks,
  ): Promise<void> {
    const classOptions: Record<string, string> = { "exo__Asset": "Asset" };

    // Load available classes from class views
    try {
      const classViewsResult = await this.classViewRepository.findAll();
      if (classViewsResult.isSuccess) {
        const classViews = classViewsResult.getValue();
        for (const classView of classViews) {
          const className = classView.className.toString();
          // Use className as display name for now, or add a display name property to ClassView
          const displayName = className.replace(/^exo__/, '').replace(/_/g, ' ');
          classOptions[className] = displayName;
        }
      }
    } catch (error) {
      console.warn("Failed to load class views:", error);
    }

    new Setting(containerEl)
      .setName("Asset Class")
      .setDesc("The type/class of the new asset")
      .addDropdown((dropdown) => {
        Object.entries(classOptions).forEach(([value, label]) => {
          dropdown.addOption(value, label);
        });

        dropdown
          .setValue(this.values.assetClass)
          .onChange(async (value) => {
            this.values.assetClass = value;
            await callbacks.onClassChange(value);
          });
      });
  }

  async setupOntologyField(
    containerEl: HTMLElement,
    callbacks: FormUICallbacks,
  ): Promise<void> {
    const ontologyOptions: Record<string, string> = { "": "Default" };

    // Load available ontologies
    try {
      const ontologies = await this.ontologyRepository.findAll();
      for (const ontology of ontologies) {
        const prefix = ontology.getPrefix().toString();
        ontologyOptions[prefix] = ontology.getDisplayName();
      }
    } catch (error) {
      console.warn("Failed to load ontologies:", error);
    }

    new Setting(containerEl)
      .setName("Ontology")
      .setDesc("The ontology context for this asset")
      .addDropdown((dropdown) => {
        Object.entries(ontologyOptions).forEach(([value, label]) => {
          dropdown.addOption(value, label);
        });

        dropdown
          .setValue(this.values.assetOntology)
          .onChange((value) => {
            this.values.assetOntology = value;
            callbacks.onOntologyChange(value);
          });
      });
  }

  setupActionButtons(
    containerEl: HTMLElement,
    callbacks: FormUICallbacks,
  ): void {
    const buttonContainer = containerEl.createDiv({
      cls: "exocortex-modal-buttons",
    });

    // Create Asset button
    const createButton = buttonContainer.createEl("button", {
      text: "Create Asset",
      cls: "mod-cta",
    });
    createButton.addEventListener("click", async () => {
      await callbacks.onCreateAsset();
    });

    // Cancel button
    const cancelButton = buttonContainer.createEl("button", {
      text: "Cancel",
    });
    cancelButton.addEventListener("click", () => {
      callbacks.onCancel();
    });
  }

  getValues(): FormFieldValues {
    return { ...this.values };
  }

  setValues(values: Partial<FormFieldValues>): void {
    this.values = { ...this.values, ...values };
  }

  getValue(field: keyof FormFieldValues): string {
    return this.values[field];
  }

  setValue(field: keyof FormFieldValues, value: string): void {
    this.values[field] = value;
  }

  reset(): void {
    this.values = {
      assetTitle: "",
      assetClass: "exo__Asset",
      assetOntology: "",
    };
  }

  isValid(): boolean {
    return this.values.assetTitle.trim().length > 0;
  }

  getValidationErrors(): string[] {
    const errors: string[] = [];

    if (!this.values.assetTitle.trim()) {
      errors.push("Asset title is required");
    }

    if (!this.values.assetClass) {
      errors.push("Asset class is required");
    }

    return errors;
  }
}