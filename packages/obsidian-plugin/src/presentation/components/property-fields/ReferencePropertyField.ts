import { Setting, TFile } from "obsidian";
import type { ReferencePropertyFieldProps, ValidationResult } from "./types";

/**
 * Suggestion item for autocomplete.
 */
interface FileSuggestion {
  file: TFile;
  displayName: string;
  matchScore: number;
}

/**
 * Reference property field renderer with autocomplete.
 *
 * Renders an input field with autocomplete suggestions from the vault.
 * Supports filtering by asset class and fuzzy matching.
 *
 * @example
 * ```typescript
 * const field = new ReferencePropertyField(containerEl, {
 *   property: { uri: "ems:parent", name: "ems__Effort_parent", label: "Parent", fieldType: PropertyFieldType.Reference },
 *   value: "[[My Project]]",
 *   onChange: (value) => console.log("Changed:", value),
 *   app: this.app,
 *   classFilter: ["ems__Project", "ems__Initiative"],
 * });
 * ```
 */
export class ReferencePropertyField {
  private setting: Setting;
  private inputEl: HTMLInputElement | null = null;
  private suggestionsEl: HTMLDivElement | null = null;
  private suggestions: FileSuggestion[] = [];
  private selectedIndex = -1;
  private isOpen = false;

  constructor(
    private containerEl: HTMLElement,
    private props: ReferencePropertyFieldProps,
  ) {
    this.setting = this.render();
  }

  /**
   * Render the reference field with autocomplete.
   */
  private render(): Setting {
    const { property, value, error, disabled } = this.props;

    const setting = new Setting(this.containerEl)
      .setName(property.label)
      .setDesc(property.description || "Start typing to search vault files");

    // Create a wrapper for the input and suggestions
    const inputWrapper = setting.controlEl.createDiv({
      cls: "property-field-reference-wrapper",
    });

    // Create the input element
    const inputEl = inputWrapper.createEl("input", {
      type: "text",
      cls: "property-field-reference-input",
      placeholder: "Start typing to search...",
    });
    this.inputEl = inputEl;

    // Display value without wikilink syntax for editing
    const displayValue = this.extractDisplayValue(value);
    inputEl.value = displayValue;

    if (disabled) {
      inputEl.disabled = true;
    }

    // Create suggestions container (hidden by default via CSS class)
    this.suggestionsEl = inputWrapper.createDiv({
      cls: "property-field-suggestions is-hidden",
    });

    // Event handlers
    inputEl.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      this.onInput(target.value);
    });

    inputEl.addEventListener("keydown", (e) => {
      this.onKeyDown(e);
    });

    inputEl.addEventListener("focus", () => {
      if (inputEl.value) {
        this.updateSuggestions(inputEl.value);
      }
    });

    inputEl.addEventListener("blur", () => {
      // Delay hiding to allow click on suggestions
      setTimeout(() => this.hideSuggestions(), 200);
    });

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
   * Handle input changes.
   */
  private onInput(value: string): void {
    this.updateSuggestions(value);
  }

  /**
   * Handle keyboard navigation.
   */
  private onKeyDown(e: KeyboardEvent): void {
    if (!this.isOpen || this.suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        this.commitValue();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this.selectNext();
        break;
      case "ArrowUp":
        e.preventDefault();
        this.selectPrevious();
        break;
      case "Enter":
        e.preventDefault();
        if (this.selectedIndex >= 0) {
          this.selectSuggestion(this.suggestions[this.selectedIndex]);
        } else {
          this.commitValue();
        }
        break;
      case "Escape":
        e.preventDefault();
        this.hideSuggestions();
        break;
      case "Tab":
        if (this.selectedIndex >= 0) {
          e.preventDefault();
          this.selectSuggestion(this.suggestions[this.selectedIndex]);
        }
        break;
    }
  }

  /**
   * Update suggestions based on input.
   */
  private updateSuggestions(query: string): void {
    if (!query || query.length < 1) {
      this.hideSuggestions();
      return;
    }

    const { app, classFilter } = this.props;
    const files = app.vault.getMarkdownFiles();

    // Filter and score files
    this.suggestions = files
      .map((file) => this.scoreFile(file, query, classFilter))
      .filter((suggestion): suggestion is FileSuggestion => suggestion !== null)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10); // Limit to 10 suggestions

    this.renderSuggestions();
  }

  /**
   * Score a file based on query match.
   */
  private scoreFile(
    file: TFile,
    query: string,
    classFilter?: string[],
  ): FileSuggestion | null {
    const basename = file.basename;
    const queryLower = query.toLowerCase();
    const basenameLower = basename.toLowerCase();

    // Check class filter if provided
    if (classFilter && classFilter.length > 0) {
      // Read frontmatter to check class
      const cache = this.props.app.metadataCache.getFileCache(file);
      const frontmatter = cache?.frontmatter;
      const instanceClass = frontmatter?.["exo__instanceClass"] as
        | string
        | undefined;

      if (instanceClass) {
        // Extract class name from wikilink format
        const className = instanceClass.replace(/^\[\[|\]\]$/g, "");
        if (!classFilter.includes(className)) {
          return null;
        }
      }
    }

    // Calculate match score
    let matchScore = 0;

    // Exact match
    if (basenameLower === queryLower) {
      matchScore = 100;
    }
    // Starts with query
    else if (basenameLower.startsWith(queryLower)) {
      matchScore = 80;
    }
    // Contains query
    else if (basenameLower.includes(queryLower)) {
      matchScore = 60;
    }
    // Fuzzy match (each character in order)
    else if (this.fuzzyMatch(queryLower, basenameLower)) {
      matchScore = 40;
    }
    // No match
    else {
      return null;
    }

    // Boost recently modified files
    const daysSinceModified =
      (Date.now() - file.stat.mtime) / (1000 * 60 * 60 * 24);
    if (daysSinceModified < 1) {
      matchScore += 10;
    } else if (daysSinceModified < 7) {
      matchScore += 5;
    }

    return {
      file,
      displayName: basename,
      matchScore,
    };
  }

  /**
   * Simple fuzzy match - checks if all chars of query appear in order.
   */
  private fuzzyMatch(query: string, target: string): boolean {
    let queryIndex = 0;
    for (let i = 0; i < target.length && queryIndex < query.length; i++) {
      if (target[i] === query[queryIndex]) {
        queryIndex++;
      }
    }
    return queryIndex === query.length;
  }

  /**
   * Render suggestions dropdown.
   */
  private renderSuggestions(): void {
    if (!this.suggestionsEl) return;

    this.suggestionsEl.empty();

    if (this.suggestions.length === 0) {
      this.hideSuggestions();
      return;
    }

    this.selectedIndex = -1;

    for (let i = 0; i < this.suggestions.length; i++) {
      const suggestion = this.suggestions[i];
      const item = this.suggestionsEl.createDiv({
        cls: "property-field-suggestion-item",
        text: suggestion.displayName,
      });

      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        this.selectSuggestion(suggestion);
      });

      item.addEventListener("mouseenter", () => {
        this.selectedIndex = i;
        this.updateSelectionHighlight();
      });
    }

    this.showSuggestions();
  }

  /**
   * Select next suggestion.
   */
  private selectNext(): void {
    if (this.suggestions.length === 0) return;
    this.selectedIndex = (this.selectedIndex + 1) % this.suggestions.length;
    this.updateSelectionHighlight();
  }

  /**
   * Select previous suggestion.
   */
  private selectPrevious(): void {
    if (this.suggestions.length === 0) return;
    this.selectedIndex =
      this.selectedIndex <= 0
        ? this.suggestions.length - 1
        : this.selectedIndex - 1;
    this.updateSelectionHighlight();
  }

  /**
   * Update visual selection highlight.
   */
  private updateSelectionHighlight(): void {
    if (!this.suggestionsEl) return;

    const items = this.suggestionsEl.querySelectorAll(
      ".property-field-suggestion-item",
    );
    items.forEach((item, i) => {
      if (i === this.selectedIndex) {
        item.addClass("is-selected");
      } else {
        item.removeClass("is-selected");
      }
    });
  }

  /**
   * Select a suggestion and update the value.
   */
  private selectSuggestion(suggestion: FileSuggestion): void {
    if (this.inputEl) {
      this.inputEl.value = suggestion.displayName;
    }

    // Format as wikilink for storage
    const wikilinkValue = `[[${suggestion.displayName}]]`;
    this.props.onChange(wikilinkValue);

    this.hideSuggestions();
  }

  /**
   * Commit the current input value.
   */
  private commitValue(): void {
    if (!this.inputEl) return;

    const value = this.inputEl.value.trim();
    if (value) {
      // Wrap in wikilink syntax if not already
      const wikilinkValue = value.startsWith("[[")
        ? value
        : `[[${value}]]`;
      this.props.onChange(wikilinkValue);
    } else {
      this.props.onChange("");
    }

    this.hideSuggestions();
  }

  /**
   * Show suggestions dropdown.
   */
  private showSuggestions(): void {
    if (this.suggestionsEl) {
      this.suggestionsEl.removeClass("is-hidden");
      this.isOpen = true;
    }
  }

  /**
   * Hide suggestions dropdown.
   */
  private hideSuggestions(): void {
    if (this.suggestionsEl) {
      this.suggestionsEl.addClass("is-hidden");
      this.isOpen = false;
      this.selectedIndex = -1;
    }
  }

  /**
   * Extract display value from wikilink format.
   */
  private extractDisplayValue(value: string): string {
    if (!value) return "";
    // Remove [[ ]] and quotes
    return value.replace(/^\[\[|\]\]$/g, "").replace(/^"|"$/g, "");
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
   * Validate the current value.
   */
  validate(): ValidationResult {
    const { property, value } = this.props;

    // Required validation
    if (property.required && !value) {
      return { valid: false, error: `${property.label} is required` };
    }

    // If value is provided, check it looks like a valid reference
    if (value) {
      const cleanValue = this.extractDisplayValue(value);
      if (!cleanValue) {
        return { valid: false, error: `${property.label} is invalid` };
      }
    }

    return { valid: true };
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
    this.hideSuggestions();
    this.setting.settingEl.remove();
    this.inputEl = null;
    this.suggestionsEl = null;
    this.suggestions = [];
  }
}
