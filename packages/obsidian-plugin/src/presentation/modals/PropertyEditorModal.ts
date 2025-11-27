import { App, Modal, TFile } from "obsidian";
import { PropertyUpdateService } from "../../application/services/PropertyUpdateService";
import { WikiLinkSuggestModal } from "./WikiLinkSuggestModal";

export interface PropertyEditorResult {
  properties: Record<string, any>;
  cancelled: boolean;
}

export interface PropertyFieldConfig {
  key: string;
  type: "text" | "number" | "boolean" | "select" | "wikilink" | "readonly";
  label: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export class PropertyEditorModal extends Modal {
  private properties: Record<string, any> = {};
  private originalProperties: Record<string, any> = {};
  private onSubmit: (result: PropertyEditorResult) => void;
  private file: TFile;
  private propertyUpdateService: PropertyUpdateService;
  private inputElements: Map<string, HTMLInputElement | HTMLSelectElement> = new Map();

  constructor(
    app: App,
    file: TFile,
    onSubmit: (result: PropertyEditorResult) => void,
  ) {
    super(app);
    this.file = file;
    this.onSubmit = onSubmit;
    this.propertyUpdateService = new PropertyUpdateService(app);
    this.loadProperties();
  }

  private loadProperties(): void {
    const cache = this.app.metadataCache.getFileCache(this.file);
    if (cache?.frontmatter) {
      this.properties = { ...cache.frontmatter };
      delete this.properties.position;
      this.originalProperties = { ...this.properties };
    }
  }

  override onOpen(): void {
    const { contentEl } = this;

    contentEl.addClass("exocortex-property-editor-modal");

    contentEl.createEl("h2", { text: "Edit properties" });

    contentEl.createEl("p", {
      text: this.file.basename,
      cls: "exocortex-modal-filename exocortex-modal-description",
    });

    const formContainer = contentEl.createDiv({
      cls: "exocortex-property-form",
    });

    this.renderPropertyFields(formContainer);

    const buttonContainer = contentEl.createDiv({
      cls: "modal-button-container",
    });

    const saveButton = buttonContainer.createEl("button", {
      text: "Save",
      cls: "mod-cta",
    });
    saveButton.addEventListener("click", () => this.submit());

    const cancelButton = buttonContainer.createEl("button", {
      text: "Cancel",
    });
    cancelButton.addEventListener("click", () => this.cancel());

    contentEl.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        this.cancel();
      }
    });
  }

  private renderPropertyFields(container: HTMLElement): void {
    const sortedKeys = Object.keys(this.properties).sort();

    if (sortedKeys.length === 0) {
      container.createEl("p", {
        text: "No properties found in frontmatter.",
        cls: "exocortex-modal-description",
      });
      return;
    }

    for (const key of sortedKeys) {
      const value = this.properties[key];
      const fieldConfig = this.inferFieldConfig(key, value);
      this.renderField(container, fieldConfig, value);
    }
  }

  private inferFieldConfig(key: string, value: any): PropertyFieldConfig {
    if (key === "exo__Asset_uid" || key.endsWith("_createdAt")) {
      return { key, type: "readonly", label: this.formatLabel(key) };
    }

    if (this.isWikiLink(value)) {
      return { key, type: "wikilink", label: this.formatLabel(key) };
    }

    if (key === "ems__Effort_status") {
      return {
        key,
        type: "select",
        label: this.formatLabel(key),
        options: [
          { value: '"[[ems__EffortStatusDraft]]"', label: "Draft" },
          { value: '"[[ems__EffortStatusBacklog]]"', label: "Backlog" },
          { value: '"[[ems__EffortStatusAnalysis]]"', label: "Analysis" },
          { value: '"[[ems__EffortStatusToDo]]"', label: "To Do" },
          { value: '"[[ems__EffortStatusDoing]]"', label: "Doing" },
          { value: '"[[ems__EffortStatusDone]]"', label: "Done" },
          { value: '"[[ems__EffortStatusTrashed]]"', label: "Trashed" },
        ],
      };
    }

    if (key === "ems__Task_size") {
      return {
        key,
        type: "select",
        label: this.formatLabel(key),
        options: [
          { value: "", label: "Not specified" },
          { value: '"[[ems__TaskSize_XXS]]"', label: "XXS" },
          { value: '"[[ems__TaskSize_XS]]"', label: "XS" },
          { value: '"[[ems__TaskSize_S]]"', label: "S" },
          { value: '"[[ems__TaskSize_M]]"', label: "M" },
          { value: '"[[ems__TaskSize_L]]"', label: "L" },
          { value: '"[[ems__TaskSize_XL]]"', label: "XL" },
        ],
      };
    }

    if (typeof value === "boolean") {
      return { key, type: "boolean", label: this.formatLabel(key) };
    }

    if (typeof value === "number") {
      return { key, type: "number", label: this.formatLabel(key) };
    }

    return { key, type: "text", label: this.formatLabel(key) };
  }

  private isWikiLink(value: any): boolean {
    if (typeof value !== "string") return false;
    return /^\[\[.+\]\]$/.test(value) || /^"\[\[.+\]\]"$/.test(value);
  }

  private formatLabel(key: string): string {
    const parts = key.split("__");
    const lastPart = parts[parts.length - 1];
    const withoutPrefix = lastPart.replace(/^[A-Z][a-z]+_/, "");
    return withoutPrefix
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .toLowerCase();
  }

  private renderField(
    container: HTMLElement,
    config: PropertyFieldConfig,
    value: any,
  ): void {
    const fieldContainer = container.createDiv({
      cls: "exocortex-property-field",
    });

    fieldContainer.createEl("label", {
      text: config.label,
      cls: "exocortex-property-label",
    });

    switch (config.type) {
      case "readonly":
        this.renderReadonlyField(fieldContainer, config, value);
        break;
      case "select":
        this.renderSelectField(fieldContainer, config, value);
        break;
      case "boolean":
        this.renderBooleanField(fieldContainer, config, value);
        break;
      case "number":
        this.renderNumberField(fieldContainer, config, value);
        break;
      case "wikilink":
        this.renderWikiLinkField(fieldContainer, config, value);
        break;
      default:
        this.renderTextField(fieldContainer, config, value);
    }
  }

  private renderReadonlyField(
    container: HTMLElement,
    _config: PropertyFieldConfig,
    value: any,
  ): void {
    const displayValue = this.formatDisplayValue(value);
    container.createEl("span", {
      text: displayValue,
      cls: "exocortex-property-readonly",
    });
  }

  private renderSelectField(
    container: HTMLElement,
    config: PropertyFieldConfig,
    value: any,
  ): void {
    const selectEl = container.createEl("select", {
      cls: "exocortex-modal-select dropdown",
    });

    for (const option of config.options || []) {
      const optionEl = selectEl.createEl("option", {
        value: option.value,
        text: option.label,
      });

      const currentValue = this.formatDisplayValue(value);
      const optionValue = this.formatDisplayValue(option.value);
      if (currentValue === optionValue) {
        optionEl.selected = true;
      }
    }

    selectEl.addEventListener("change", () => {
      this.properties[config.key] = selectEl.value || null;
    });

    this.inputElements.set(config.key, selectEl);
  }

  private renderBooleanField(
    container: HTMLElement,
    config: PropertyFieldConfig,
    value: any,
  ): void {
    const checkboxWrapper = container.createDiv({
      cls: "exocortex-modal-checkbox-wrapper",
    });

    const checkboxEl = checkboxWrapper.createEl("input", {
      type: "checkbox",
    }) as HTMLInputElement;
    checkboxEl.checked = Boolean(value);

    checkboxEl.addEventListener("change", () => {
      this.properties[config.key] = checkboxEl.checked;
    });

    this.inputElements.set(config.key, checkboxEl);
  }

  private renderNumberField(
    container: HTMLElement,
    config: PropertyFieldConfig,
    value: any,
  ): void {
    const inputEl = container.createEl("input", {
      type: "number",
      cls: "exocortex-modal-input",
    }) as HTMLInputElement;
    inputEl.value = String(value ?? "");

    inputEl.addEventListener("input", () => {
      const numValue = inputEl.value === "" ? null : Number(inputEl.value);
      this.properties[config.key] = numValue;
    });

    this.inputElements.set(config.key, inputEl);
  }

  private renderWikiLinkField(
    container: HTMLElement,
    config: PropertyFieldConfig,
    value: any,
  ): void {
    const inputWrapper = container.createDiv({
      cls: "exocortex-wikilink-input-wrapper",
    });

    const inputEl = inputWrapper.createEl("input", {
      type: "text",
      cls: "exocortex-modal-input",
      placeholder: "[[file-name]]",
    }) as HTMLInputElement;
    inputEl.value = this.formatDisplayValue(value);

    inputEl.addEventListener("input", () => {
      this.properties[config.key] = this.normalizeWikiLink(inputEl.value);
    });

    const browseButton = inputWrapper.createEl("button", {
      text: "...",
      cls: "exocortex-browse-button",
    });
    browseButton.addEventListener("click", () => {
      this.openFileSuggest(config.key, inputEl);
    });

    this.inputElements.set(config.key, inputEl);
  }

  private renderTextField(
    container: HTMLElement,
    config: PropertyFieldConfig,
    value: any,
  ): void {
    const inputEl = container.createEl("input", {
      type: "text",
      cls: "exocortex-modal-input",
      placeholder: config.placeholder || "",
    }) as HTMLInputElement;
    inputEl.value = String(value ?? "");

    inputEl.addEventListener("input", () => {
      this.properties[config.key] = inputEl.value || null;
    });

    this.inputElements.set(config.key, inputEl);
  }

  private formatDisplayValue(value: any): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") {
      return value.replace(/^"|"$/g, "");
    }
    if (Array.isArray(value)) {
      return value.map((v) => this.formatDisplayValue(v)).join(", ");
    }
    return String(value);
  }

  private normalizeWikiLink(value: string): string {
    if (!value) return "";
    const trimmed = value.trim();
    if (trimmed.startsWith("[[") && trimmed.endsWith("]]")) {
      return `"${trimmed}"`;
    }
    return trimmed;
  }

  private openFileSuggest(propertyKey: string, inputEl: HTMLInputElement): void {
    const suggestModal = new WikiLinkSuggestModal(this.app, (result) => {
      if (result.wikiLink && result.file) {
        inputEl.value = `[[${result.file.basename}]]`;
        this.properties[propertyKey] = result.wikiLink;
      }
    });
    suggestModal.open();
  }

  private async submit(): Promise<void> {
    const changedProperties: Record<string, any> = {};

    for (const [key, newValue] of Object.entries(this.properties)) {
      const originalValue = this.originalProperties[key];
      if (JSON.stringify(newValue) !== JSON.stringify(originalValue)) {
        changedProperties[key] = newValue;
      }
    }

    if (Object.keys(changedProperties).length > 0) {
      for (const [key, value] of Object.entries(changedProperties)) {
        await this.propertyUpdateService.updateProperty(this.file, key, value);
      }
    }

    this.onSubmit({
      properties: this.properties,
      cancelled: false,
    });
    this.close();
  }

  private cancel(): void {
    this.onSubmit({
      properties: this.originalProperties,
      cancelled: true,
    });
    this.close();
  }

  override onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
    this.inputElements.clear();
  }
}
