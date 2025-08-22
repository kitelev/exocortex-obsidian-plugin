import {
  App,
  Setting,
  TextComponent,
  DropdownComponent,
  ToggleComponent,
  TextAreaComponent,
  ButtonComponent,
  Notice,
} from "obsidian";
import { PropertyEditingUseCase } from "../../application/use-cases/PropertyEditingUseCase";
import { Result } from "../../domain/core/Result";
import { PlatformDetector } from "../../infrastructure/utils/PlatformDetector";
import { MobileModalAdapter } from "./MobileModalAdapter";

/**
 * Touch-optimized property renderer for mobile devices
 * Implements iOS-friendly form controls with enhanced touch interactions
 */
export class TouchPropertyRenderer {
  private editingProperty: string | null = null;
  private originalValues: Map<string, any> = new Map();
  private propertyInputs: Map<string, any> = new Map();
  private hapticFeedback?: any;

  constructor(
    private app: App,
    private propertyEditingUseCase: PropertyEditingUseCase,
  ) {
    this.initializeHapticFeedback();
  }

  /**
   * Initialize haptic feedback for iOS devices
   */
  private initializeHapticFeedback(): void {
    if (PlatformDetector.isIOS() && "vibrate" in navigator) {
      this.hapticFeedback = {
        selection: () => navigator.vibrate?.(5),
        impact: () => navigator.vibrate?.(15),
        notification: () => navigator.vibrate?.(25),
      };
    }
  }

  /**
   * Render touch-optimized properties block
   */
  async renderPropertiesBlock(
    container: HTMLElement,
    assetId: string,
    className: string,
    currentProperties: Record<string, any>,
  ): Promise<void> {
    const propertiesResult =
      await this.propertyEditingUseCase.getPropertiesForClass(className);

    if (propertiesResult.isFailure) {
      this.renderErrorState(container, "Failed to load properties");
      return;
    }

    const properties = propertiesResult.getValue();

    // Create mobile-optimized properties container
    const propertiesEl = this.createPropertiesContainer(container);

    // Group properties by category for better mobile UX
    const groupedProperties = this.groupPropertiesByCategory(properties);

    // Render each group
    for (const [category, categoryProperties] of groupedProperties) {
      this.renderPropertyGroup(
        propertiesEl,
        assetId,
        category,
        categoryProperties,
        currentProperties,
      );
    }

    // Add custom properties section
    this.renderCustomPropertiesSection(
      propertiesEl,
      assetId,
      properties,
      currentProperties,
    );
  }

  /**
   * Create mobile-optimized properties container
   */
  private createPropertiesContainer(parent: HTMLElement): HTMLElement {
    const container = parent.createDiv({ cls: "exocortex-touch-properties" });

    container.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding: 16px;
            background: var(--background-primary);
            border-radius: 12px;
            border: 1px solid var(--background-modifier-border);
        `;

    return container;
  }

  /**
   * Group properties by category for better organization
   */
  private groupPropertiesByCategory(properties: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();

    properties.forEach((prop) => {
      const category =
        prop.category || (prop.isRequired ? "Required" : "Optional");

      if (!groups.has(category)) {
        groups.set(category, []);
      }

      groups.get(category)!.push(prop);
    });

    // Sort groups: Required first, then alphabetical
    const sortedEntries = Array.from(groups.entries()).sort(([a], [b]) => {
      if (a === "Required") return -1;
      if (b === "Required") return 1;
      return a.localeCompare(b);
    });

    return new Map(sortedEntries);
  }

  /**
   * Render property group with expandable section
   */
  private renderPropertyGroup(
    container: HTMLElement,
    assetId: string,
    category: string,
    properties: any[],
    currentProperties: Record<string, any>,
  ): void {
    const groupContainer = this.createExpandableSection(
      container,
      category,
      true,
    );
    const contentContainer = groupContainer.querySelector(
      ".exocortex-expandable-content",
    ) as HTMLElement;

    properties.forEach((prop) => {
      this.renderTouchProperty(
        contentContainer,
        assetId,
        prop,
        currentProperties[prop.propertyName],
      );
    });
  }

  /**
   * Create expandable section for property groups
   */
  private createExpandableSection(
    parent: HTMLElement,
    title: string,
    expanded: boolean = false,
  ): HTMLElement {
    const section = parent.createDiv({
      cls: `exocortex-expandable-section ${expanded ? "expanded" : ""}`,
    });

    const header = section.createDiv({ cls: "exocortex-expandable-header" });

    const titleEl = header.createEl("h3", {
      text: title,
      cls: "exocortex-expandable-title",
    });

    const chevron = header.createSpan({
      cls: "exocortex-expandable-chevron",
      text: "▶",
    });

    const content = section.createDiv({ cls: "exocortex-expandable-content" });

    // Touch interaction for expand/collapse
    header.addEventListener("click", () => {
      this.triggerHaptic("selection");

      const isExpanded = section.hasClass("expanded");
      if (isExpanded) {
        section.removeClass("expanded");
        content.style.display = "none";
      } else {
        section.addClass("expanded");
        content.style.display = "block";
      }
    });

    return section;
  }

  /**
   * Render individual touch-optimized property
   */
  private renderTouchProperty(
    container: HTMLElement,
    assetId: string,
    property: any,
    currentValue: any,
  ): void {
    const propertyEl = container.createDiv({ cls: "touch-property-item" });

    // Property header with label and status
    const headerEl = this.createPropertyHeader(propertyEl, property);

    // Property value container
    const valueContainer = propertyEl.createDiv({
      cls: "touch-property-value",
    });

    if (this.editingProperty === property.propertyName) {
      this.renderTouchEditControl(
        valueContainer,
        assetId,
        property,
        currentValue,
      );
    } else {
      this.renderTouchReadOnlyValue(
        valueContainer,
        assetId,
        property,
        currentValue,
      );
    }

    // Property description (collapsible on mobile)
    if (property.description) {
      this.renderPropertyDescription(propertyEl, property.description);
    }
  }

  /**
   * Create property header with label and metadata
   */
  private createPropertyHeader(
    container: HTMLElement,
    property: any,
  ): HTMLElement {
    const header = container.createDiv({ cls: "touch-property-header" });

    const labelContainer = header.createDiv({
      cls: "touch-property-label-container",
    });

    const label = labelContainer.createSpan({
      text: property.label || property.propertyName,
      cls: "touch-property-label",
    });

    if (property.isRequired) {
      labelContainer.createSpan({
        text: " *",
        cls: "required-indicator",
      });
    }

    // Property type badge
    if (property.range || property.type) {
      const typeBadge = header.createSpan({
        text: this.getPropertyTypeDisplay(property),
        cls: "touch-property-type-badge",
      });
    }

    return header;
  }

  /**
   * Get display text for property type
   */
  private getPropertyTypeDisplay(property: any): string {
    if (property.isObjectProperty) return "Link";
    if (property.range?.startsWith("enum:")) return "Choice";
    if (property.range === "boolean") return "Toggle";
    if (property.range === "date") return "Date";
    if (property.range === "number") return "Number";
    if (property.range === "array") return "List";
    return "Text";
  }

  /**
   * Render touch-optimized read-only value
   */
  private renderTouchReadOnlyValue(
    container: HTMLElement,
    assetId: string,
    property: any,
    value: any,
  ): void {
    const valueEl = container.createDiv({
      cls: "touch-property-value-readonly",
    });

    // Display formatted value
    const displayValue = this.formatDisplayValue(
      value,
      property.type || property.range,
    );
    const valueText = valueEl.createSpan({
      text: displayValue || "(empty)",
      cls: "touch-property-display-value",
    });

    // Touch-optimized edit button
    const editButton = this.createTouchEditButton(() => {
      this.enterTouchEditMode(container, assetId, property, value);
    });

    valueEl.appendChild(editButton);

    // Make entire area tappable
    valueEl.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-height: 44px;
            padding: 12px 16px;
            background: var(--background-secondary);
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.2s ease;
            -webkit-tap-highlight-color: transparent;
        `;

    valueEl.addEventListener("click", () => {
      this.triggerHaptic("selection");
      this.enterTouchEditMode(container, assetId, property, value);
    });

    // Touch feedback
    if (PlatformDetector.hasTouch()) {
      valueEl.addEventListener(
        "touchstart",
        () => {
          valueEl.style.backgroundColor = "var(--background-modifier-hover)";
        },
        { passive: true },
      );

      valueEl.addEventListener(
        "touchend",
        () => {
          setTimeout(() => {
            valueEl.style.backgroundColor = "var(--background-secondary)";
          }, 150);
        },
        { passive: true },
      );
    }
  }

  /**
   * Create touch-optimized edit button
   */
  private createTouchEditButton(onClick: () => void): HTMLElement {
    const button = document.createElement("button");
    button.className = "touch-edit-button";
    button.innerHTML = "✏️";
    button.setAttribute("aria-label", "Edit property");

    button.style.cssText = `
            width: 32px;
            height: 32px;
            border: none;
            background: none;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background-color 0.2s ease;
            -webkit-tap-highlight-color: transparent;
        `;

    button.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick();
    });

    return button;
  }

  /**
   * Enter touch-optimized edit mode
   */
  private enterTouchEditMode(
    container: HTMLElement,
    assetId: string,
    property: any,
    currentValue: any,
  ): void {
    this.originalValues.set(property.propertyName, currentValue);
    this.editingProperty = property.propertyName;

    // For complex properties, show full-screen modal
    if (this.shouldUseModalEditor(property)) {
      this.showModalEditor(container, assetId, property, currentValue);
    } else {
      // Clear container and render inline edit control
      container.empty();
      this.renderTouchEditControl(container, assetId, property, currentValue);
    }
  }

  /**
   * Check if property should use modal editor
   */
  private shouldUseModalEditor(property: any): boolean {
    return (
      property.range === "array" ||
      property.range === "text" ||
      property.isObjectProperty ||
      (property.range?.startsWith("enum:") && PlatformDetector.isMobile())
    );
  }

  /**
   * Show modal editor for complex properties
   */
  private showModalEditor(
    container: HTMLElement,
    assetId: string,
    property: any,
    currentValue: any,
  ): void {
    const modal = new MobileModalAdapter(this.app, {
      title: `Edit ${property.label || property.propertyName}`,
      subtitle: property.description,
      fullscreen: PlatformDetector.isMobile(),
      keyboardHandling: "auto",
    });

    modal.onOpen = () => {
      const formSection = modal.createFormSection();
      this.renderModalPropertyEditor(formSection, property, currentValue);

      const buttonGroup = modal.createButtonGroup([
        {
          text: "Save",
          variant: "primary",
          onClick: async () => {
            await this.saveTouchProperty(assetId, property);
            modal.close();
          },
        },
        {
          text: "Cancel",
          variant: "secondary",
          onClick: () => {
            // Find the container element from the modal
            const modalContainer = modal.modalEl.querySelector(
              ".touch-property-edit-form",
            ) as HTMLElement;
            this.cancelTouchEdit(
              modalContainer || container,
              assetId,
              property,
            );
            modal.close();
          },
        },
      ]);

      modal.addContent(formSection);
      modal.addContent(buttonGroup);
    };

    modal.open();
  }

  /**
   * Render property editor in modal
   */
  private renderModalPropertyEditor(
    container: HTMLElement,
    property: any,
    currentValue: any,
  ): void {
    if (property.isObjectProperty) {
      this.renderTouchObjectPropertyDropdown(container, property, currentValue);
    } else if (property.range?.startsWith("enum:")) {
      this.renderTouchEnumSelector(container, property, currentValue);
    } else if (property.range === "array") {
      this.renderTouchArrayEditor(container, property, currentValue);
    } else if (property.range === "text") {
      this.renderTouchTextArea(container, property, currentValue);
    } else {
      this.renderTouchTextInput(container, property, currentValue);
    }
  }

  /**
   * Render touch-optimized edit control
   */
  private renderTouchEditControl(
    container: HTMLElement,
    assetId: string,
    property: any,
    currentValue: any,
  ): void {
    const controlContainer = container.createDiv({ cls: "touch-edit-control" });

    // Handle different property types
    if (property.range === "boolean") {
      this.renderTouchBooleanToggle(controlContainer, property, currentValue);
    } else if (property.range === "date") {
      this.renderTouchDateInput(controlContainer, property, currentValue);
    } else if (property.range === "number") {
      this.renderTouchNumberInput(controlContainer, property, currentValue);
    } else {
      this.renderTouchTextInput(controlContainer, property, currentValue);
    }

    // Add save/cancel actions
    this.renderTouchEditActions(controlContainer, assetId, property);
  }

  /**
   * Render touch-optimized boolean toggle
   */
  private renderTouchBooleanToggle(
    container: HTMLElement,
    property: any,
    currentValue: any,
  ): void {
    const toggleContainer = container.createDiv({
      cls: "touch-toggle-container",
    });

    const toggle = toggleContainer.createEl("input", {
      type: "checkbox",
      cls: "touch-toggle",
    });

    const label = toggleContainer.createEl("label", {
      cls: "touch-toggle-label",
    });

    label.appendChild(toggle);
    label.createSpan({
      text: currentValue ? "Enabled" : "Disabled",
      cls: "touch-toggle-text",
    });

    if (currentValue !== undefined) {
      toggle.checked = currentValue;
    }

    toggle.addEventListener("change", () => {
      this.triggerHaptic("selection");
      const textSpan = label.querySelector(".touch-toggle-text");
      if (textSpan) {
        textSpan.textContent = toggle.checked ? "Enabled" : "Disabled";
      }
    });

    this.propertyInputs.set(property.propertyName, toggle);
  }

  /**
   * Render touch-optimized date input
   */
  private renderTouchDateInput(
    container: HTMLElement,
    property: any,
    currentValue: any,
  ): void {
    const dateInput = container.createEl("input", {
      type: "date",
      cls: "touch-input",
    });

    if (currentValue) {
      dateInput.value = currentValue;
    }

    // Add visual feedback for touch
    this.addTouchInputFeedback(dateInput);

    this.propertyInputs.set(property.propertyName, dateInput);

    // Auto-focus on mobile
    if (PlatformDetector.isMobile()) {
      setTimeout(() => dateInput.focus(), 100);
    }
  }

  /**
   * Render touch-optimized number input
   */
  private renderTouchNumberInput(
    container: HTMLElement,
    property: any,
    currentValue: any,
  ): void {
    const numberInput = container.createEl("input", {
      type: "number",
      cls: "touch-input",
    });

    if (currentValue !== undefined) {
      numberInput.value = String(currentValue);
    }

    // Add increment/decrement buttons for better touch UX
    const inputGroup = container.createDiv({ cls: "touch-number-input-group" });
    inputGroup.appendChild(numberInput);

    const decrementBtn = this.createNumberButton("-", () => {
      const current = parseFloat(numberInput.value) || 0;
      numberInput.value = String(current - 1);
      this.triggerHaptic("selection");
    });

    const incrementBtn = this.createNumberButton("+", () => {
      const current = parseFloat(numberInput.value) || 0;
      numberInput.value = String(current + 1);
      this.triggerHaptic("selection");
    });

    inputGroup.appendChild(decrementBtn);
    inputGroup.appendChild(incrementBtn);

    this.addTouchInputFeedback(numberInput);
    this.propertyInputs.set(property.propertyName, numberInput);
  }

  /**
   * Create number increment/decrement button
   */
  private createNumberButton(text: string, onClick: () => void): HTMLElement {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = "touch-number-button";

    button.style.cssText = `
            width: 44px;
            height: 44px;
            border: 1px solid var(--background-modifier-border);
            background: var(--background-secondary);
            color: var(--text-normal);
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: background-color 0.2s ease;
            -webkit-tap-highlight-color: transparent;
        `;

    button.addEventListener("click", onClick);

    // Touch feedback
    if (PlatformDetector.hasTouch()) {
      button.addEventListener(
        "touchstart",
        () => {
          button.style.backgroundColor = "var(--background-modifier-hover)";
        },
        { passive: true },
      );

      button.addEventListener(
        "touchend",
        () => {
          setTimeout(() => {
            button.style.backgroundColor = "var(--background-secondary)";
          }, 150);
        },
        { passive: true },
      );
    }

    return button;
  }

  /**
   * Render touch-optimized text input
   */
  private renderTouchTextInput(
    container: HTMLElement,
    property: any,
    currentValue: any,
  ): void {
    const textInput = container.createEl("input", {
      type: "text",
      cls: "touch-input",
    });

    textInput.placeholder = property.label || property.propertyName;
    textInput.value = currentValue || "";

    this.addTouchInputFeedback(textInput);
    this.propertyInputs.set(property.propertyName, textInput);

    // Keyboard shortcuts
    textInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        // Auto-save on Enter
        // Implementation would go here
      } else if (e.key === "Escape") {
        e.preventDefault();
        // Cancel edit
        // Implementation would go here
      }
    });
  }

  /**
   * Add touch feedback to input elements
   */
  private addTouchInputFeedback(input: HTMLInputElement): void {
    input.addEventListener("focus", () => {
      input.style.borderColor = "var(--interactive-accent)";
      input.style.boxShadow =
        "0 0 0 3px rgba(var(--interactive-accent-rgb), 0.1)";
    });

    input.addEventListener("blur", () => {
      input.style.borderColor = "var(--background-modifier-border)";
      input.style.boxShadow = "none";
    });
  }

  /**
   * Render touch edit actions (save/cancel)
   */
  private renderTouchEditActions(
    container: HTMLElement,
    assetId: string,
    property: any,
  ): void {
    const actionsEl = container.createDiv({ cls: "touch-edit-actions" });

    actionsEl.style.cssText = `
            display: flex;
            gap: 12px;
            margin-top: 16px;
            justify-content: flex-end;
        `;

    // Save button
    const saveBtn = this.createActionButton("Save", "primary", async () => {
      this.triggerHaptic("impact");
      await this.saveTouchProperty(assetId, property);
    });

    // Cancel button
    const cancelBtn = this.createActionButton("Cancel", "secondary", () => {
      this.triggerHaptic("selection");
      this.cancelTouchEdit(container, assetId, property);
    });

    actionsEl.appendChild(saveBtn);
    actionsEl.appendChild(cancelBtn);
  }

  /**
   * Create action button for save/cancel
   */
  private createActionButton(
    text: string,
    variant: "primary" | "secondary",
    onClick: () => void,
  ): HTMLElement {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = `touch-action-button touch-action-button--${variant}`;

    button.style.cssText = `
            min-height: 44px;
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            -webkit-tap-highlight-color: transparent;
            
            ${
              variant === "primary"
                ? `
                background: var(--interactive-accent);
                color: var(--text-on-accent);
            `
                : `
                background: var(--background-secondary);
                color: var(--text-normal);
                border: 1px solid var(--background-modifier-border);
            `
            }
        `;

    button.addEventListener("click", onClick);

    // Touch feedback
    if (PlatformDetector.hasTouch()) {
      button.addEventListener(
        "touchstart",
        () => {
          button.style.transform = "scale(0.98)";
        },
        { passive: true },
      );

      button.addEventListener(
        "touchend",
        () => {
          setTimeout(() => {
            button.style.transform = "scale(1)";
          }, 150);
        },
        { passive: true },
      );
    }

    return button;
  }

  /**
   * Save touch property value
   */
  private async saveTouchProperty(
    assetId: string,
    property: any,
  ): Promise<void> {
    const input = this.propertyInputs.get(property.propertyName);
    if (!input) return;

    let value: any;
    if (input instanceof HTMLInputElement) {
      if (input.type === "checkbox") {
        value = input.checked;
      } else if (input.type === "number") {
        value = parseFloat(input.value);
      } else {
        value = input.value;
      }
    }

    // Validate and save
    const result = await this.propertyEditingUseCase.execute({
      assetId,
      propertyName: property.propertyName,
      value,
      propertyDefinition: property,
    });

    if (result.isSuccess) {
      this.triggerHaptic("notification");
      this.exitTouchEditMode(property);
      this.showTouchNotification("Property updated", "success");
    } else {
      this.triggerHaptic("notification");
      this.showTouchNotification(`Error: ${result.error}`, "error");
    }
  }

  /**
   * Cancel touch edit and restore original value
   */
  private cancelTouchEdit(
    container: HTMLElement,
    assetId: string,
    property: any,
  ): void {
    const originalValue = this.originalValues.get(property.propertyName);
    this.exitTouchEditMode(property);

    // Re-render as read-only
    container.empty();
    this.renderTouchReadOnlyValue(container, assetId, property, originalValue);
  }

  /**
   * Exit touch edit mode
   */
  private exitTouchEditMode(property: any): void {
    this.editingProperty = null;
    this.propertyInputs.delete(property.propertyName);
    this.originalValues.delete(property.propertyName);
  }

  /**
   * Render custom properties section
   */
  private renderCustomPropertiesSection(
    container: HTMLElement,
    assetId: string,
    schemaProperties: any[],
    currentProperties: Record<string, any>,
  ): void {
    const schemaPropertyNames = new Set(
      schemaProperties.map((p) => p.propertyName),
    );
    const customProperties = Object.entries(currentProperties).filter(
      ([key]) => !schemaPropertyNames.has(key) && !key.startsWith("exo__"),
    );

    if (customProperties.length > 0) {
      const customSection = this.createExpandableSection(
        container,
        "Custom Properties",
        false,
      );
      const contentContainer = customSection.querySelector(
        ".exocortex-expandable-content",
      ) as HTMLElement;

      customProperties.forEach(([key, value]) => {
        const customProperty = {
          propertyName: key,
          label: key,
          range: "string",
          isRequired: false,
          description: "Custom property",
        };

        this.renderTouchProperty(
          contentContainer,
          assetId,
          customProperty,
          value,
        );
      });
    }
  }

  /**
   * Render property description
   */
  private renderPropertyDescription(
    container: HTMLElement,
    description: string,
  ): void {
    if (PlatformDetector.isMobile()) {
      // Collapsible description on mobile
      const descSection = this.createExpandableSection(
        container,
        "Description",
        false,
      );
      const content = descSection.querySelector(
        ".exocortex-expandable-content",
      ) as HTMLElement;
      content.createEl("p", {
        text: description,
        cls: "touch-property-description",
      });
    } else {
      // Always visible on desktop
      container.createEl("p", {
        text: description,
        cls: "touch-property-description",
      });
    }
  }

  /**
   * Format value for display
   */
  private formatDisplayValue(value: any, type: string): string {
    if (value === null || value === undefined) {
      return "";
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? `${value.length} items` : "Empty list";
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (typeof value === "string" && value.length > 50) {
      return value.substring(0, 47) + "...";
    }

    return String(value);
  }

  /**
   * Render error state
   */
  private renderErrorState(container: HTMLElement, message: string): void {
    const errorEl = container.createDiv({
      cls: "touch-properties-error",
      text: message,
    });

    errorEl.style.cssText = `
            padding: 20px;
            text-align: center;
            color: var(--text-muted);
            background: var(--background-secondary);
            border-radius: 8px;
            border: 1px solid var(--background-modifier-border);
        `;
  }

  /**
   * Show touch-optimized notification
   */
  private showTouchNotification(
    message: string,
    type: "success" | "error" | "info",
  ): void {
    new Notice(message, type === "error" ? 5000 : 3000);
  }

  /**
   * Trigger haptic feedback
   */
  private triggerHaptic(type: "selection" | "impact" | "notification"): void {
    if (this.hapticFeedback && this.hapticFeedback[type]) {
      this.hapticFeedback[type]();
    }
  }

  // Additional methods for complex property types would go here...
  private renderTouchObjectPropertyDropdown(
    container: HTMLElement,
    property: any,
    currentValue: any,
  ): void {
    // Implementation for object property dropdown
  }

  private renderTouchEnumSelector(
    container: HTMLElement,
    property: any,
    currentValue: any,
  ): void {
    // Implementation for enum selector
  }

  private renderTouchArrayEditor(
    container: HTMLElement,
    property: any,
    currentValue: any,
  ): void {
    // Implementation for array editor
  }

  private renderTouchTextArea(
    container: HTMLElement,
    property: any,
    currentValue: any,
  ): void {
    // Implementation for text area
  }
}
