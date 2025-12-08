import { Setting } from "obsidian";
import type { EnumPropertyFieldProps, ValidationResult } from "./types";

/**
 * Enum property field renderer.
 *
 * Renders a dropdown select field for properties with fixed value options.
 * Uses the options array from PropertyDefinition.
 *
 * @example
 * ```typescript
 * const field = new EnumPropertyField(containerEl, {
 *   property: {
 *     uri: "exo:priority",
 *     name: "exo__Asset_priority",
 *     label: "Priority",
 *     fieldType: PropertyFieldType.Enum,
 *     options: [
 *       { value: "high", label: "High" },
 *       { value: "medium", label: "Medium" },
 *       { value: "low", label: "Low" },
 *     ],
 *   },
 *   value: "medium",
 *   onChange: (value) => console.log("Changed:", value),
 * });
 * ```
 */
export class EnumPropertyField {
  private setting: Setting;
  private selectEl: HTMLSelectElement | null = null;

  constructor(
    private containerEl: HTMLElement,
    private props: EnumPropertyFieldProps,
  ) {
    this.setting = this.render();
  }

  /**
   * Render the enum field.
   */
  private render(): Setting {
    const { property, value, onChange, error, disabled } = this.props;

    const setting = new Setting(this.containerEl)
      .setName(property.label)
      .setDesc(property.description || "");

    setting.addDropdown((dropdown) => {
      this.selectEl = dropdown.selectEl;
      dropdown.selectEl.addClass("property-field-enum-select");

      // Add empty option if not required
      if (!property.required) {
        dropdown.addOption("", "Not specified");
      }

      // Add options from property definition
      if (property.options && property.options.length > 0) {
        for (const option of property.options) {
          dropdown.addOption(option.value, option.label);
        }
      }

      // Set current value
      if (value) {
        dropdown.setValue(value);
      }

      dropdown.onChange((newValue) => {
        onChange(newValue);
      });

      if (disabled) {
        dropdown.setDisabled(true);
      }

      // Show error state
      if (error) {
        dropdown.selectEl.addClass("has-error");
        setting.descEl.createDiv({
          text: error,
          cls: "property-field-error",
        });
      }
    });

    // Add required indicator
    if (property.required) {
      setting.nameEl.createSpan({
        text: " *",
        cls: "required-indicator",
      });
    }

    return setting;
  }

  /**
   * Get the select element.
   */
  getSelectEl(): HTMLSelectElement | null {
    return this.selectEl;
  }

  /**
   * Update the field value programmatically.
   */
  setValue(value: string): void {
    if (this.selectEl) {
      this.selectEl.value = value;
    }
  }

  /**
   * Get available options.
   */
  getOptions(): { value: string; label: string }[] {
    const { property } = this.props;
    return property.options || [];
  }

  /**
   * Validate the current value.
   */
  validate(): ValidationResult {
    const { property, value } = this.props;

    // Required validation
    if (property.required && !value) {
      return { valid: false, error: `${property.label} is required` };
    }

    // Check if value is in options (if options are defined)
    if (value && property.options && property.options.length > 0) {
      const validValues = property.options.map((opt) => opt.value);
      if (!validValues.includes(value)) {
        return {
          valid: false,
          error: `${property.label} must be one of the available options`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Focus the select element.
   */
  focus(): void {
    if (this.selectEl) {
      this.selectEl.focus();
    }
  }

  /**
   * Destroy the field and clean up resources.
   */
  destroy(): void {
    this.setting.settingEl.remove();
    this.selectEl = null;
  }
}
