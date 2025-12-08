import { Setting } from "obsidian";
import type { WikilinkPropertyFieldProps, ValidationResult } from "./types";

/**
 * Wikilink property field renderer.
 *
 * Renders a text input for wikilink references with [[ ]] visual wrapper.
 * For autocomplete support, use ReferencePropertyField instead.
 *
 * @example
 * ```typescript
 * const field = new WikilinkPropertyField(containerEl, {
 *   property: { uri: "ems:parent", name: "ems__Effort_parent", label: "Parent", fieldType: PropertyFieldType.Wikilink },
 *   value: "[[My Project]]",
 *   onChange: (value) => console.log("Changed:", value),
 * });
 * ```
 */
export class WikilinkPropertyField {
  private setting: Setting;
  private inputEl: HTMLInputElement | null = null;

  constructor(
    private containerEl: HTMLElement,
    private props: WikilinkPropertyFieldProps,
  ) {
    this.setting = this.render();
  }

  /**
   * Render the wikilink field.
   */
  private render(): Setting {
    const { property, value, onChange, error, disabled } = this.props;

    const setting = new Setting(this.containerEl)
      .setName(property.label)
      .setDesc(property.description || "Enter note name");

    // Create custom input with wikilink wrapper
    const inputWrapper = setting.controlEl.createDiv({
      cls: "property-field-wikilink-wrapper",
    });

    // Prefix
    inputWrapper.createSpan({
      text: "[[",
      cls: "property-field-wikilink-bracket",
    });

    // Input
    const inputEl = inputWrapper.createEl("input", {
      type: "text",
      cls: "property-field-wikilink-input",
      placeholder: "Note name",
    });
    this.inputEl = inputEl;

    // Extract display value from wikilink format
    const displayValue = this.extractDisplayValue(value);
    inputEl.value = displayValue;

    // Suffix
    inputWrapper.createSpan({
      text: "]]",
      cls: "property-field-wikilink-bracket",
    });

    // Event handlers
    inputEl.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      const newValue = target.value.trim();
      // Always store in wikilink format
      const formattedValue = newValue ? `[[${newValue}]]` : "";
      onChange(formattedValue);
    });

    inputEl.addEventListener("blur", () => {
      // Clean up value on blur
      if (this.inputEl) {
        const cleanValue = this.extractDisplayValue(this.inputEl.value);
        this.inputEl.value = cleanValue;
      }
    });

    if (disabled) {
      inputEl.disabled = true;
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
      inputEl.addClass("has-error");
      setting.descEl.createDiv({
        text: error,
        cls: "property-field-error",
      });
    }

    return setting;
  }

  /**
   * Extract display value from wikilink format.
   */
  private extractDisplayValue(value: string): string {
    if (!value) return "";
    // Remove [[ ]], quotes, and trim
    return value
      .replace(/^\[\[|\]\]$/g, "")
      .replace(/^"|"$/g, "")
      .trim();
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
  setValue(value: string): void {
    if (this.inputEl) {
      this.inputEl.value = this.extractDisplayValue(value);
    }
  }

  /**
   * Format a value as wikilink.
   */
  static formatAsWikilink(value: string): string {
    if (!value) return "";
    const clean = value.replace(/^\[\[|\]\]$/g, "").trim();
    return clean ? `[[${clean}]]` : "";
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

    // Check for valid wikilink format
    if (value) {
      const displayValue = this.extractDisplayValue(value);
      if (!displayValue) {
        return { valid: false, error: `${property.label} is invalid` };
      }
    }

    return { valid: true };
  }

  /**
   * Add keyboard event listener for Enter key submission.
   */
  onEnter(callback: () => void): void {
    if (this.inputEl) {
      this.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          callback();
        }
      });
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
