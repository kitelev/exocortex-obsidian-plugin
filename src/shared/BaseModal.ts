import { App, Modal, Setting } from "obsidian";
import { DIContainer } from "../infrastructure/container/DIContainer";
import { ErrorHandlingUtils } from "./utils/ErrorHandlingUtils";
import { ValidationUtils } from "./utils/ValidationUtils";

/**
 * Base modal class that provides common functionality for all modals
 * Implements DRY principle by extracting common modal patterns
 */
export abstract class BaseModal extends Modal {
  protected container: DIContainer;
  protected formData: Map<string, any> = new Map();

  constructor(app: App) {
    super(app);
    this.container = DIContainer.getInstance();
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    
    try {
      await this.setupModal(contentEl);
    } catch (error) {
      ErrorHandlingUtils.handleRenderingError(
        this.constructor.name,
        error,
        contentEl,
        "Failed to load modal content"
      );
    }
  }

  /**
   * Main modal setup method that subclasses must implement
   */
  protected abstract setupModal(contentEl: HTMLElement): Promise<void>;

  /**
   * Get modal title - subclasses should override
   */
  protected abstract getModalTitle(): string;

  /**
   * Validate form data before submission - subclasses can override
   */
  protected validateFormData(): { isValid: boolean; errors: string[] } {
    return { isValid: true, errors: [] };
  }

  /**
   * Handle form submission - subclasses must implement
   */
  protected abstract handleSubmit(): Promise<void>;

  /**
   * Create modal header with title
   */
  protected createHeader(contentEl: HTMLElement): void {
    contentEl.createEl("h2", { text: this.getModalTitle() });
  }

  /**
   * Create text input field with validation
   */
  protected createTextInput(
    containerEl: HTMLElement,
    config: {
      name: string;
      label: string;
      description?: string;
      placeholder?: string;
      required?: boolean;
      initialValue?: string;
      validator?: (value: string) => boolean;
      validationMessage?: string;
    }
  ): Setting {
    const setting = new Setting(containerEl)
      .setName(config.label)
      .addText((text) => {
        if (config.placeholder) {
          text.setPlaceholder(config.placeholder);
        }
        if (config.initialValue) {
          text.setValue(config.initialValue);
          this.formData.set(config.name, config.initialValue);
        }
        
        text.onChange((value) => {
          this.formData.set(config.name, value);
          
          // Real-time validation if validator provided
          if (config.validator && !config.validator(value)) {
            text.inputEl.addClass("exocortex-input-error");
            if (config.validationMessage) {
              // Show validation message
              this.showFieldError(setting, config.validationMessage);
            }
          } else {
            text.inputEl.removeClass("exocortex-input-error");
            this.clearFieldError(setting);
          }
        });
      });

    if (config.description) {
      setting.setDesc(config.description);
    }

    return setting;
  }

  /**
   * Create dropdown field
   */
  protected createDropdown(
    containerEl: HTMLElement,
    config: {
      name: string;
      label: string;
      description?: string;
      options: { value: string; label: string }[];
      initialValue?: string;
      required?: boolean;
    }
  ): Setting {
    const setting = new Setting(containerEl)
      .setName(config.label)
      .addDropdown((dropdown) => {
        for (const option of config.options) {
          dropdown.addOption(option.value, option.label);
        }

        if (config.initialValue) {
          dropdown.setValue(config.initialValue);
          this.formData.set(config.name, config.initialValue);
        }

        dropdown.onChange((value) => {
          this.formData.set(config.name, value);
        });
      });

    if (config.description) {
      setting.setDesc(config.description);
    }

    return setting;
  }

  /**
   * Create toggle field
   */
  protected createToggle(
    containerEl: HTMLElement,
    config: {
      name: string;
      label: string;
      description?: string;
      initialValue?: boolean;
    }
  ): Setting {
    const setting = new Setting(containerEl)
      .setName(config.label)
      .addToggle((toggle) => {
        if (config.initialValue !== undefined) {
          toggle.setValue(config.initialValue);
          this.formData.set(config.name, config.initialValue);
        }

        toggle.onChange((value) => {
          this.formData.set(config.name, value);
        });
      });

    if (config.description) {
      setting.setDesc(config.description);
    }

    return setting;
  }

  /**
   * Create dynamic content container
   */
  protected createDynamicContainer(
    containerEl: HTMLElement,
    className: string
  ): HTMLElement {
    return containerEl.createDiv({ cls: className });
  }

  /**
   * Create action buttons (Cancel/Submit)
   */
  protected createActionButtons(
    containerEl: HTMLElement,
    submitText: string = "Create"
  ): void {
    const buttonContainer = containerEl.createDiv({ cls: "exocortex-modal-buttons" });

    // Cancel button
    const cancelButton = buttonContainer.createEl("button", {
      text: "Cancel",
      cls: "exocortex-button-secondary",
    });
    cancelButton.onclick = () => this.close();

    // Submit button
    const submitButton = buttonContainer.createEl("button", {
      text: submitText,
      cls: "exocortex-button-primary",
    });
    submitButton.onclick = async () => {
      await this.handleFormSubmission();
    };
  }

  /**
   * Handle form submission with validation
   */
  private async handleFormSubmission(): Promise<void> {
    try {
      // Validate form data
      const validation = this.validateFormData();
      if (!validation.isValid) {
        ErrorHandlingUtils.handleValidationError(
          "Form",
          this.formData,
          validation.errors.join(", ")
        );
        return;
      }

      // Handle submission
      await this.handleSubmit();
      
      // Close modal on success
      this.close();
    } catch (error) {
      ErrorHandlingUtils.handleRenderingError(
        "Form submission",
        error,
        undefined,
        "Failed to submit form"
      );
    }
  }

  /**
   * Show field-specific error message
   */
  private showFieldError(setting: Setting, message: string): void {
    // Remove existing error message
    this.clearFieldError(setting);
    
    // Add error message
    const errorEl = setting.settingEl.createDiv({
      text: message,
      cls: "exocortex-field-error",
    });
  }

  /**
   * Clear field-specific error message
   */
  private clearFieldError(setting: Setting): void {
    const existingError = setting.settingEl.querySelector(".exocortex-field-error");
    if (existingError) {
      existingError.remove();
    }
  }

  /**
   * Get form field value with type safety
   */
  protected getFormValue<T>(key: string, defaultValue?: T): T {
    return this.formData.get(key) ?? defaultValue;
  }

  /**
   * Set form field value
   */
  protected setFormValue(key: string, value: any): void {
    this.formData.set(key, value);
  }

  /**
   * Check if required fields are filled
   */
  protected validateRequiredFields(requiredFields: string[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const field of requiredFields) {
      const value = this.formData.get(field);
      if (!ValidationUtils.isNonEmptyString(value)) {
        errors.push(`${field} is required`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Reset form data
   */
  protected resetForm(): void {
    this.formData.clear();
  }

  onClose() {
    this.resetForm();
  }
}