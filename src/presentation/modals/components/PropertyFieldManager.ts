import { App, Setting } from "obsidian";
import { SemanticPropertyDiscoveryService } from "../../../domain/services/SemanticPropertyDiscoveryService";
import { PropertyCacheService } from "../../../domain/services/PropertyCacheService";
import { Result } from "../../../domain/core/Result";

export interface PropertyMetadata {
  name: string;
  label: string;
  description?: string;
  type: "ObjectProperty" | "DatatypeProperty";
  domain: string | string[];
  range: string;
  isRequired: boolean;
  options?: string[];
  defaultValue?: any;
}

/**
 * Manages property discovery and UI field creation
 * Extracted from CreateAssetModal to follow Single Responsibility Principle
 */
export class PropertyFieldManager {
  private properties: PropertyMetadata[] = [];
  private propertyValues: Map<string, any> = new Map();

  constructor(
    private app: App,
    private propertyDiscoveryService: SemanticPropertyDiscoveryService,
    private propertyCache: PropertyCacheService,
  ) {}

  async discoverPropertiesForClass(
    className: string,
  ): Promise<Result<PropertyMetadata[]>> {
    const propertyResult =
      await this.propertyDiscoveryService.discoverPropertiesForClass(className);

    if (!propertyResult.isSuccess) {
      return Result.fail(
        `Property discovery failed: ${propertyResult.getError()}`,
      );
    }

    this.properties = propertyResult.getValue() || [];
    return Result.ok(this.properties);
  }

  renderPropertiesInContainer(container: HTMLElement): void {
    container.empty();

    if (this.properties.length === 0) {
      this.addFallbackProperties(container);
      return;
    }

    this.properties.forEach((property) => {
      this.createPropertyField(container, property);
    });
  }

  private createPropertyField(
    container: HTMLElement,
    property: PropertyMetadata,
  ): void {
    const setting = new Setting(container);
    setting.setName(property.label);
    setting.setDesc(property.description || "");

    const uiType = this.mapSemanticPropertyTypeToUIType(property);

    switch (uiType) {
      case "object":
        this.createObjectPropertyField(setting, property);
        break;
      case "enum":
        this.createEnumField(setting, property);
        break;
      case "boolean":
        this.createBooleanField(setting, property);
        break;
      case "date":
        this.createDateField(setting, property);
        break;
      case "number":
        this.createNumberField(setting, property);
        break;
      case "textarea":
        this.createTextAreaField(setting, property);
        break;
      case "array":
        this.createArrayField(setting, property);
        break;
      default:
        this.createTextField(setting, property);
    }
  }

  private mapSemanticPropertyTypeToUIType(property: PropertyMetadata): string {
    if (property.options && property.options.length > 0) {
      return "enum";
    }

    if (property.type === "ObjectProperty") {
      return "object";
    }

    return this.mapRangeToType(property.range);
  }

  private mapRangeToType(range: string): string {
    const rangeLower = range.toLowerCase();

    if (rangeLower.includes("boolean")) return "boolean";
    if (rangeLower.includes("date") || rangeLower.includes("time"))
      return "date";
    if (
      rangeLower.includes("int") ||
      rangeLower.includes("number") ||
      rangeLower.includes("decimal") ||
      rangeLower.includes("float")
    )
      return "number";
    if (rangeLower.includes("array") || rangeLower.includes("list"))
      return "array";
    if (
      rangeLower.includes("description") ||
      rangeLower.includes("content") ||
      rangeLower.includes("text")
    )
      return "textarea";

    return "text";
  }

  private createObjectPropertyField(
    setting: Setting,
    property: PropertyMetadata,
  ): void {
    setting.addText((text) => {
      text
        .setPlaceholder(`Select ${property.label}`)
        .setValue(this.propertyValues.get(property.name) || "")
        .onChange((value) => {
          this.propertyValues.set(property.name, value);
        });
    });
  }

  private createEnumField(setting: Setting, property: PropertyMetadata): void {
    setting.addDropdown((dropdown) => {
      dropdown.addOption("", "Select option");
      property.options?.forEach((option) => {
        dropdown.addOption(option, option);
      });
      dropdown
        .setValue(this.propertyValues.get(property.name) || "")
        .onChange((value) => {
          this.propertyValues.set(property.name, value);
        });
    });
  }

  private createBooleanField(
    setting: Setting,
    property: PropertyMetadata,
  ): void {
    setting.addToggle((toggle) => {
      toggle
        .setValue(this.propertyValues.get(property.name) || false)
        .onChange((value) => {
          this.propertyValues.set(property.name, value);
        });
    });
  }

  private createDateField(setting: Setting, property: PropertyMetadata): void {
    setting.addText((text) => {
      text
        .setPlaceholder("YYYY-MM-DD")
        .setValue(this.propertyValues.get(property.name) || "")
        .onChange((value) => {
          this.propertyValues.set(property.name, value);
        });
      text.inputEl.type = "date";
    });
  }

  private createNumberField(
    setting: Setting,
    property: PropertyMetadata,
  ): void {
    setting.addText((text) => {
      text
        .setPlaceholder("Enter number")
        .setValue(this.propertyValues.get(property.name) || "")
        .onChange((value) => {
          const numValue = parseFloat(value);
          this.propertyValues.set(
            property.name,
            isNaN(numValue) ? value : numValue,
          );
        });
      text.inputEl.type = "number";
    });
  }

  private createTextAreaField(
    setting: Setting,
    property: PropertyMetadata,
  ): void {
    setting.addTextArea((textArea) => {
      textArea
        .setPlaceholder(`Enter ${property.label}`)
        .setValue(this.propertyValues.get(property.name) || "")
        .onChange((value) => {
          this.propertyValues.set(property.name, value);
        });
    });
  }

  private createArrayField(setting: Setting, property: PropertyMetadata): void {
    setting.addTextArea((textArea) => {
      textArea
        .setPlaceholder("Enter items separated by commas")
        .setValue(
          Array.isArray(this.propertyValues.get(property.name))
            ? this.propertyValues.get(property.name).join(", ")
            : this.propertyValues.get(property.name) || "",
        )
        .onChange((value) => {
          const arrayValue = value.split(",").map((item) => item.trim());
          this.propertyValues.set(property.name, arrayValue);
        });
    });
  }

  private createTextField(setting: Setting, property: PropertyMetadata): void {
    setting.addText((text) => {
      text
        .setPlaceholder(`Enter ${property.label}`)
        .setValue(this.propertyValues.get(property.name) || "")
        .onChange((value) => {
          this.propertyValues.set(property.name, value);
        });
    });
  }

  private addFallbackProperties(container: HTMLElement): void {
    const fallbackMessage = container.createEl("div", {
      cls: "exocortex-fallback-message",
    });
    fallbackMessage.createEl("p", {
      text: "No properties found for this class. Using default fields.",
      cls: "exocortex-fallback-text",
    });

    // Add common fallback properties
    const commonProperties: PropertyMetadata[] = [
      {
        name: "exo__Asset_description",
        label: "Description",
        type: "DatatypeProperty",
        domain: ["exo__Asset"],
        range: "xsd:string",
        isRequired: false,
      },
      {
        name: "exo__Asset_tags",
        label: "Tags",
        type: "DatatypeProperty",
        domain: ["exo__Asset"],
        range: "xsd:string",
        isRequired: false,
      },
    ];

    commonProperties.forEach((property) => {
      this.createPropertyField(container, property);
    });
  }

  getPropertyValues(): Map<string, any> {
    return new Map(this.propertyValues);
  }

  setPropertyValue(name: string, value: any): void {
    this.propertyValues.set(name, value);
  }

  clearPropertyValues(): void {
    this.propertyValues.clear();
  }

  getProperties(): PropertyMetadata[] {
    return [...this.properties];
  }
}
