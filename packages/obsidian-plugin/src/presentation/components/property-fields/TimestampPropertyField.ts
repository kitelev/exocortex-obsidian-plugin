import { Setting } from "obsidian";
import type { TimestampPropertyFieldProps, ValidationResult } from "./types";

/**
 * Timestamp property field renderer (read-only display).
 *
 * Displays a timestamp value in a human-readable format.
 * This is typically used for system-managed timestamps like createdAt.
 *
 * @example
 * ```typescript
 * const field = new TimestampPropertyField(containerEl, {
 *   property: { uri: "exo:createdAt", name: "exo__Asset_createdAt", label: "Created At", fieldType: PropertyFieldType.Timestamp },
 *   value: "2024-12-09T14:30:00.000Z",
 * });
 * ```
 */
export class TimestampPropertyField {
  private setting: Setting;
  private displayEl: HTMLDivElement | null = null;

  constructor(
    private containerEl: HTMLElement,
    private props: TimestampPropertyFieldProps,
  ) {
    this.setting = this.render();
  }

  /**
   * Render the timestamp display field.
   */
  private render(): Setting {
    const { property, value, error } = this.props;

    const setting = new Setting(this.containerEl)
      .setName(property.label)
      .setDesc(property.description || "");

    // Create display element (read-only)
    this.displayEl = setting.controlEl.createDiv({
      cls: "property-field-timestamp-display",
    });

    // Format and display the timestamp
    const formattedValue = this.formatTimestamp(value);
    this.displayEl.textContent = formattedValue;

    // Add "read-only" indicator
    setting.controlEl.createSpan({
      text: "(read-only)",
      cls: "property-field-readonly-indicator",
    });

    // Show error state
    if (error) {
      this.displayEl.addClass("has-error");
      setting.descEl.createDiv({
        text: error,
        cls: "property-field-error",
      });
    }

    return setting;
  }

  /**
   * Format timestamp to human-readable string.
   */
  private formatTimestamp(value: string): string {
    if (!value) return "Not set";

    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return value; // Return raw value if invalid date
      }

      // Format as localized date and time
      return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return value;
    }
  }

  /**
   * Format timestamp with custom options.
   */
  static format(
    value: string,
    options?: Intl.DateTimeFormatOptions,
  ): string {
    if (!value) return "Not set";

    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return value;
      }

      const defaultOptions: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };

      return date.toLocaleString(undefined, options || defaultOptions);
    } catch {
      return value;
    }
  }

  /**
   * Format as relative time (e.g., "2 hours ago").
   */
  static formatRelative(value: string): string {
    if (!value) return "Not set";

    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return value;
      }

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) {
        return "Just now";
      } else if (diffMins < 60) {
        return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
      } else {
        return TimestampPropertyField.format(value);
      }
    } catch {
      return value;
    }
  }

  /**
   * Update the displayed value.
   */
  setValue(value: string): void {
    if (this.displayEl) {
      this.displayEl.textContent = this.formatTimestamp(value);
    }
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

    // Check if timestamp is valid
    if (value) {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return {
          valid: false,
          error: `${property.label} is not a valid timestamp`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Destroy the field and clean up resources.
   */
  destroy(): void {
    this.setting.settingEl.remove();
    this.displayEl = null;
  }
}
