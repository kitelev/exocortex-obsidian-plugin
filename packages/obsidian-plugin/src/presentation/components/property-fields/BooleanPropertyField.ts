import { Setting, ToggleComponent } from "obsidian";
import type { BooleanPropertyFieldProps, ValidationResult } from "./types";

/**
 * Boolean property field renderer.
 *
 * Renders a toggle switch for boolean property values.
 *
 * @example
 * ```typescript
 * const field = new BooleanPropertyField(containerEl, {
 *   property: { uri: "exo:isArchived", name: "exo__Asset_isArchived", label: "Archived", fieldType: PropertyFieldType.Boolean },
 *   value: false,
 *   onChange: (value) => console.log("Changed:", value),
 * });
 * ```
 */
export class BooleanPropertyField {
  private setting: Setting;
  private toggleComponent: ToggleComponent | null = null;

  constructor(
    private containerEl: HTMLElement,
    private props: BooleanPropertyFieldProps,
  ) {
    this.setting = this.render();
  }

  /**
   * Render the boolean field.
   */
  private render(): Setting {
    const { property, value, onChange, error, disabled } = this.props;

    const setting = new Setting(this.containerEl)
      .setName(property.label)
      .setDesc(property.description || "");

    setting.addToggle((toggle) => {
      this.toggleComponent = toggle;

      // Parse value to boolean (handle string "true"/"false" as well)
      const boolValue = this.parseBoolean(value);
      toggle.setValue(boolValue);

      toggle.onChange((newValue) => {
        onChange(newValue);
      });

      if (disabled) {
        toggle.setDisabled(true);
      }

      // Add required indicator (though boolean required is unusual)
      if (property.required) {
        setting.nameEl.createSpan({
          text: " *",
          cls: "required-indicator",
        });
      }

      // Show error state
      if (error) {
        toggle.toggleEl.addClass("has-error");
        setting.descEl.createDiv({
          text: error,
          cls: "property-field-error",
        });
      }
    });

    return setting;
  }

  /**
   * Parse various boolean representations to actual boolean.
   */
  private parseBoolean(value: unknown): boolean {
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      return value.toLowerCase() === "true" || value === "1" || value === "yes";
    }
    if (typeof value === "number") {
      return value !== 0;
    }
    return false;
  }

  /**
   * Update the field value programmatically.
   */
  setValue(value: boolean): void {
    if (this.toggleComponent) {
      this.toggleComponent.setValue(value);
    }
  }

  /**
   * Get the current value.
   */
  getValue(): boolean {
    if (this.toggleComponent) {
      return this.toggleComponent.getValue();
    }
    return this.props.value;
  }

  /**
   * Toggle the current value.
   */
  toggle(): void {
    const currentValue = this.getValue();
    this.setValue(!currentValue);
    this.props.onChange(!currentValue);
  }

  /**
   * Validate the current value.
   */
  validate(): ValidationResult {
    const { property, value } = this.props;

    // For boolean fields, required means it must be explicitly set (which it always is)
    // This is unusual for boolean fields but supported for completeness
    if (property.required && value === undefined) {
      return { valid: false, error: `${property.label} is required` };
    }

    return { valid: true };
  }

  /**
   * Focus the toggle element.
   */
  focus(): void {
    if (this.toggleComponent?.toggleEl) {
      this.toggleComponent.toggleEl.focus();
    }
  }

  /**
   * Destroy the field and clean up resources.
   */
  destroy(): void {
    this.setting.settingEl.remove();
    this.toggleComponent = null;
  }
}
