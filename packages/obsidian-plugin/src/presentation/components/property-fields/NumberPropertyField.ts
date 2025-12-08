import { Setting } from "obsidian";
import type { NumberPropertyFieldProps, ValidationResult } from "./types";

/**
 * Number property field renderer.
 *
 * Renders a number input field with optional min/max constraints.
 * Only accepts numeric values (integers or decimals).
 *
 * @example
 * ```typescript
 * const field = new NumberPropertyField(containerEl, {
 *   property: { uri: "ems:votes", name: "ems__Effort_votes", label: "Votes", fieldType: PropertyFieldType.Number, minValue: 0 },
 *   value: 5,
 *   onChange: (value) => console.log("Changed:", value),
 * });
 * ```
 */
export class NumberPropertyField {
  private setting: Setting;
  private inputEl: HTMLInputElement | null = null;

  constructor(
    private containerEl: HTMLElement,
    private props: NumberPropertyFieldProps,
  ) {
    this.setting = this.render();
  }

  /**
   * Render the number field.
   */
  private render(): Setting {
    const { property, value, onChange, error, disabled } = this.props;

    const setting = new Setting(this.containerEl)
      .setName(property.label)
      .setDesc(property.description || this.buildConstraintDescription());

    setting.addText((text) => {
      this.inputEl = text.inputEl;
      text.inputEl.type = "number";
      text.inputEl.addClass("property-field-number-input");

      // Set value
      if (value !== null && value !== undefined) {
        text.setValue(String(value));
      }

      // Set min/max constraints
      if (property.minValue !== undefined) {
        text.inputEl.min = String(property.minValue);
      }
      if (property.maxValue !== undefined) {
        text.inputEl.max = String(property.maxValue);
      }

      // Set step for decimal support
      text.inputEl.step = "any";

      text.onChange((newValue) => {
        if (newValue === "") {
          onChange(null);
        } else {
          const numValue = parseFloat(newValue);
          if (!isNaN(numValue)) {
            onChange(numValue);
          }
        }
      });

      if (disabled) {
        text.inputEl.disabled = true;
      }

      // Add required indicator
      if (property.required) {
        setting.nameEl.createSpan({
          text: " *",
          cls: "required-indicator",
        });
      }

      // Show error state
      if (error) {
        text.inputEl.addClass("has-error");
        setting.descEl.createDiv({
          text: error,
          cls: "property-field-error",
        });
      }
    });

    return setting;
  }

  /**
   * Build description string from constraints.
   */
  private buildConstraintDescription(): string {
    const { property } = this.props;
    const parts: string[] = [];

    if (property.minValue !== undefined && property.maxValue !== undefined) {
      parts.push(`Value between ${property.minValue} and ${property.maxValue}`);
    } else if (property.minValue !== undefined) {
      parts.push(`Minimum value: ${property.minValue}`);
    } else if (property.maxValue !== undefined) {
      parts.push(`Maximum value: ${property.maxValue}`);
    }

    return parts.join(". ") || "Enter a number";
  }

  /**
   * Get the input element for focus management.
   */
  getInputEl(): HTMLInputElement | null {
    return this.inputEl;
  }

  /**
   * Update the field value programmatically.
   */
  setValue(value: number | null): void {
    if (this.inputEl) {
      this.inputEl.value = value !== null ? String(value) : "";
    }
  }

  /**
   * Validate the current value.
   */
  validate(): ValidationResult {
    const { property, value } = this.props;

    // Required validation
    if (property.required && (value === null || value === undefined)) {
      return { valid: false, error: `${property.label} is required` };
    }

    // Skip further validation if value is empty and not required
    if (value === null || value === undefined) {
      return { valid: true };
    }

    // Type validation
    if (typeof value !== "number" || isNaN(value)) {
      return { valid: false, error: `${property.label} must be a number` };
    }

    // Min value validation
    if (property.minValue !== undefined && value < property.minValue) {
      return {
        valid: false,
        error: `${property.label} must be at least ${property.minValue}`,
      };
    }

    // Max value validation
    if (property.maxValue !== undefined && value > property.maxValue) {
      return {
        valid: false,
        error: `${property.label} must be at most ${property.maxValue}`,
      };
    }

    return { valid: true };
  }

  /**
   * Increment the value by step (default 1).
   */
  increment(step = 1): void {
    const { value, onChange, property } = this.props;
    const currentValue = value ?? 0;
    const newValue = currentValue + step;

    // Respect max constraint
    if (property.maxValue !== undefined && newValue > property.maxValue) {
      onChange(property.maxValue);
    } else {
      onChange(newValue);
    }
  }

  /**
   * Decrement the value by step (default 1).
   */
  decrement(step = 1): void {
    const { value, onChange, property } = this.props;
    const currentValue = value ?? 0;
    const newValue = currentValue - step;

    // Respect min constraint
    if (property.minValue !== undefined && newValue < property.minValue) {
      onChange(property.minValue);
    } else {
      onChange(newValue);
    }
  }

  /**
   * Focus the input element.
   */
  focus(): void {
    if (this.inputEl) {
      this.inputEl.focus();
    }
  }

  /**
   * Destroy the field and clean up resources.
   */
  destroy(): void {
    this.setting.settingEl.remove();
    this.inputEl = null;
  }
}
