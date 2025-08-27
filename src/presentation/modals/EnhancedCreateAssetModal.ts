import { App, Modal, Setting, Notice } from "obsidian";
import { CreateAssetUseCase } from "../../application/use-cases/CreateAssetUseCase";
import { DIContainer } from "../../infrastructure/container/DIContainer";
import {
  SemanticPropertyDiscoveryService,
  PropertyMetadata,
} from "../../domain/services/SemanticPropertyDiscoveryService";
import { CircuitBreakerService } from "../../infrastructure/resilience/CircuitBreakerService";
import { CreateAssetResponse } from "../../application/use-cases/CreateAssetUseCase";

/**
 * Enhanced modal for creating new ExoAssets with semantic property discovery
 * Uses SemanticPropertyDiscoveryService for automatic property detection
 */
export class EnhancedCreateAssetModal extends Modal {
  open() {
    // Call parent open for real Obsidian environment
    try {
      super.open();
    } catch (error) {
      // If parent open is not available (e.g., in tests), call onOpen directly
      this.onOpen();
    }
  }
  private assetTitle: string = "";
  private assetClass: string;
  private assetOntology: string = "";
  private propertyValues: Map<string, any> = new Map();
  private propertiesContainer: HTMLElement | null = null;
  private properties: PropertyMetadata[] = [];

  private createAssetUseCase: CreateAssetUseCase;
  private container: DIContainer;
  private propertyDiscovery: SemanticPropertyDiscoveryService;
  private circuitBreaker: CircuitBreakerService;

  constructor(app: App, className: string) {
    super(app);
    this.assetClass = className;
    this.container = DIContainer.getInstance();
    this.createAssetUseCase = this.container.getCreateAssetUseCase();
    this.propertyDiscovery = new SemanticPropertyDiscoveryService(app);
    this.circuitBreaker = this.container.resolve<CircuitBreakerService>(
      "CircuitBreakerService",
    );
  }

  async onOpen() {
    const { contentEl } = this;

    // Get class label for title
    const classFile = this.app.vault
      .getMarkdownFiles()
      .find((f) => f.basename === this.assetClass);

    let modalTitle = "Create Asset";
    if (classFile) {
      const cache = this.app.metadataCache.getFileCache(classFile);
      const classLabel =
        cache?.frontmatter?.["rdfs__label"] ||
        cache?.frontmatter?.["exo__Asset_label"] ||
        this.assetClass;
      modalTitle = `Create ${this.humanizeClassName(classLabel)}`;
    }

    contentEl.createEl("h2", { text: modalTitle });

    await this.setupTitleField(contentEl);
    await this.setupOntologyField(contentEl);
    await this.setupPropertiesSection(contentEl);
    this.setupActionButtons(contentEl);
  }

  private async setupTitleField(containerEl: HTMLElement): Promise<void> {
    new Setting(containerEl)
      .setName("Title")
      .setDesc("Asset title (will be used as the filename)")
      .addText((text) =>
        text
          .setPlaceholder("Enter asset title")
          .setValue(this.assetTitle)
          .onChange((value) => (this.assetTitle = value)),
      );
  }

  private async setupOntologyField(containerEl: HTMLElement): Promise<void> {
    const files = this.app.vault.getMarkdownFiles();
    const ontologies: { prefix: string; displayName: string }[] = [];

    // Find all ontology definitions
    for (const file of files) {
      if (file.name.startsWith("!")) {
        const cache = this.app.metadataCache.getFileCache(file);
        if (cache?.frontmatter) {
          const prefix =
            cache.frontmatter["exo__Ontology_prefix"] ||
            file.basename.substring(1);
          const displayName = cache.frontmatter["rdfs__label"] || prefix;
          ontologies.push({ prefix, displayName });
        }
      }
    }

    // Add default ontologies if none found
    if (ontologies.length === 0) {
      ontologies.push(
        { prefix: "exo", displayName: "Exocortex Core" },
        { prefix: "ui", displayName: "User Interface" },
        { prefix: "rdfs", displayName: "RDF Schema" },
      );
    }

    // Try to determine default ontology from the class
    let defaultOntology = "exo";
    const classPrefix = this.assetClass.split("__")[0];
    if (ontologies.some((o) => o.prefix === classPrefix)) {
      defaultOntology = classPrefix;
    }
    this.assetOntology = defaultOntology;

    new Setting(containerEl)
      .setName("Ontology")
      .setDesc("Select which knowledge graph this asset belongs to")
      .addDropdown((dropdown) => {
        for (const ontology of ontologies) {
          dropdown.addOption(ontology.prefix, ontology.displayName);
        }

        dropdown.setValue(this.assetOntology);
        dropdown.onChange((value) => {
          this.assetOntology = value;
        });
      });
  }

  private async setupPropertiesSection(
    containerEl: HTMLElement,
  ): Promise<void> {
    containerEl.createEl("h3", {
      text: "Properties",
      cls: "exocortex-properties-header",
    });

    this.propertiesContainer = containerEl.createDiv({
      cls: "exocortex-properties-container",
    });

    // Show loading indicator
    this.propertiesContainer.createEl("p", {
      text: "Discovering properties...",
      cls: "exocortex-loading",
    });

    // Discover properties using semantic service
    const propertiesResult =
      await this.propertyDiscovery.discoverPropertiesForClass(this.assetClass);

    // Clear loading indicator
    this.propertiesContainer.empty();

    if (propertiesResult.isSuccess) {
      this.properties = propertiesResult.getValue() || [];

      if (this.properties.length === 0) {
        this.propertiesContainer.createEl("p", {
          text: "No specific properties for this class",
          cls: "exocortex-no-properties",
        });
      } else {
        // Create fields for all discovered properties
        for (const prop of this.properties) {
          await this.createPropertyField(prop);
        }
      }
    } else {
      this.propertiesContainer.createEl("p", {
        text: `Error discovering properties: ${propertiesResult.getError()}`,
        cls: "exocortex-error-message",
      });
    }
  }

  private async createPropertyField(property: PropertyMetadata): Promise<void> {
    if (!this.propertiesContainer) return;

    const setting = new Setting(this.propertiesContainer)
      .setName(property.label + (property.isRequired ? " *" : ""))
      .setDesc(property.description || "");

    // Handle different property types
    if (property.type === "ObjectProperty") {
      // Create dropdown with instances of the range class
      await this.createObjectPropertyField(setting, property);
    } else {
      // Create appropriate input based on range type
      this.createDatatypePropertyField(setting, property);
    }
  }

  private async createObjectPropertyField(
    setting: Setting,
    property: PropertyMetadata,
  ): Promise<void> {
    // Get instances of the range class
    const rangeClass = this.extractValue(property.range);
    const instancesResult =
      await this.propertyDiscovery.getInstancesOfClass(rangeClass);

    setting.addDropdown((dropdown) => {
      dropdown.addOption("", "-- Select --");

      if (instancesResult.isSuccess) {
        const instances = instancesResult.getValue() || [];
        for (const instance of instances) {
          dropdown.addOption(instance.value, instance.label);
        }
      }

      dropdown.onChange((value) => {
        if (value) {
          this.propertyValues.set(property.name, value);
        } else {
          this.propertyValues.delete(property.name);
        }
      });

      // Set default value if provided
      if (property.defaultValue) {
        dropdown.setValue(property.defaultValue);
        this.propertyValues.set(property.name, property.defaultValue);
      }
    });
  }

  private createDatatypePropertyField(
    setting: Setting,
    property: PropertyMetadata,
  ): void {
    const range = this.extractValue(property.range).toLowerCase();

    // Check for enum options first
    if (property.options && property.options.length > 0) {
      this.createEnumField(setting, property);
    } else if (range.includes("boolean") || range === "bool") {
      this.createBooleanField(setting, property);
    } else if (range.includes("date")) {
      this.createDateField(setting, property);
    } else if (
      range.includes("integer") ||
      range.includes("number") ||
      range.includes("decimal") ||
      range.includes("float")
    ) {
      this.createNumberField(setting, property);
    } else if (range.includes("text") || range === "longtext") {
      this.createTextAreaField(setting, property);
    } else {
      // Default to text field
      this.createTextField(setting, property);
    }
  }

  private createEnumField(setting: Setting, property: PropertyMetadata): void {
    setting.addDropdown((dropdown) => {
      dropdown.addOption("", "-- Select --");
      for (const option of property.options || []) {
        dropdown.addOption(option, option);
      }
      dropdown.onChange((value) => {
        if (value) {
          this.propertyValues.set(property.name, value);
        } else {
          this.propertyValues.delete(property.name);
        }
      });

      // Set default value if provided
      if (property.defaultValue) {
        dropdown.setValue(property.defaultValue);
        this.propertyValues.set(property.name, property.defaultValue);
      }
    });
  }

  private createBooleanField(
    setting: Setting,
    property: PropertyMetadata,
  ): void {
    setting.addToggle((toggle) => {
      toggle.onChange((value) => {
        this.propertyValues.set(property.name, value);
      });

      // Set default value if provided
      if (property.defaultValue !== undefined) {
        toggle.setValue(property.defaultValue);
        this.propertyValues.set(property.name, property.defaultValue);
      }
    });
  }

  private createDateField(setting: Setting, property: PropertyMetadata): void {
    setting.addText((text) => {
      text.setPlaceholder("YYYY-MM-DD").onChange((value) => {
        if (value) {
          this.propertyValues.set(property.name, value);
        } else {
          this.propertyValues.delete(property.name);
        }
      });
      text.inputEl.type = "date";

      // Set default value if provided
      if (property.defaultValue) {
        text.setValue(property.defaultValue);
        this.propertyValues.set(property.name, property.defaultValue);
      }
    });
  }

  private createNumberField(
    setting: Setting,
    property: PropertyMetadata,
  ): void {
    setting.addText((text) => {
      text.setPlaceholder("Enter number").onChange((value) => {
        if (value) {
          const num = parseFloat(value);
          if (!isNaN(num)) {
            this.propertyValues.set(property.name, num);
          }
        } else {
          this.propertyValues.delete(property.name);
        }
      });

      // Set default value if provided
      if (property.defaultValue !== undefined) {
        text.setValue(String(property.defaultValue));
        this.propertyValues.set(property.name, property.defaultValue);
      }
    });
  }

  private createTextAreaField(
    setting: Setting,
    property: PropertyMetadata,
  ): void {
    setting.addTextArea((text) => {
      text
        .setPlaceholder("Enter " + property.label.toLowerCase())
        .onChange((value) => {
          if (value) {
            this.propertyValues.set(property.name, value);
          } else {
            this.propertyValues.delete(property.name);
          }
        });

      // Set default value if provided
      if (property.defaultValue) {
        text.setValue(property.defaultValue);
        this.propertyValues.set(property.name, property.defaultValue);
      }
    });
  }

  private createTextField(setting: Setting, property: PropertyMetadata): void {
    setting.addText((text) => {
      text
        .setPlaceholder("Enter " + property.label.toLowerCase())
        .onChange((value) => {
          if (value) {
            this.propertyValues.set(property.name, value);
          } else {
            this.propertyValues.delete(property.name);
          }
        });

      // Set default value if provided
      if (property.defaultValue) {
        text.setValue(property.defaultValue);
        this.propertyValues.set(property.name, property.defaultValue);
      }
    });
  }

  private setupActionButtons(containerEl: HTMLElement): void {
    new Setting(containerEl).addButton((btn) =>
      btn
        .setButtonText("Create")
        .setCta()
        .onClick(async () => {
          await this.createAsset();
        }),
    );
  }

  private async createAsset(): Promise<void> {
    // Validate required fields
    const validationError = this.validateRequiredFields();
    if (validationError) {
      new Notice(validationError, 5000);
      return;
    }

    // Use circuit breaker for resilient asset creation
    try {
      const response = await this.circuitBreaker.execute<CreateAssetResponse>(
        "asset-creation",
        async (): Promise<CreateAssetResponse> => {
          // Convert property values to plain object
          const properties: Record<string, any> = {};
          for (const [key, value] of this.propertyValues) {
            properties[key] = value;
          }

          // Add core properties
          properties["exo__Instance_class"] = `[[${this.assetClass}]]`;

          // Execute use case
          const response = await this.createAssetUseCase.execute({
            title: this.assetTitle,
            className: this.assetClass,
            ontologyPrefix: this.assetOntology,
            properties,
          });

          if (!response.success) {
            throw new Error(response.error || "Asset creation failed");
          }

          return response;
        },
      );

      new Notice(response.message);
      this.close();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Asset creation failed:", error);

      // Provide user-friendly error messages
      if (errorMessage.includes("Circuit")) {
        new Notice(
          "Asset creation is temporarily unavailable. Please try again in a moment.",
          5000,
        );
      } else if (errorMessage.includes("ontology")) {
        new Notice(`Ontology issue: ${errorMessage}`, 8000);
      } else if (
        errorMessage.includes("validation") ||
        errorMessage.includes("Invalid")
      ) {
        new Notice(`Validation error: ${errorMessage}`, 6000);
      } else {
        new Notice(`Error: ${errorMessage}`, 5000);
      }
    }
  }

  private validateRequiredFields(): string | null {
    // Check title
    if (!this.assetTitle) {
      return "Title is required";
    }

    // Check required properties
    for (const prop of this.properties) {
      if (prop.isRequired && !this.propertyValues.has(prop.name)) {
        // Skip core properties that will be auto-generated
        if (
          prop.name === "exo__Asset_uid" ||
          prop.name === "exo__Instance_class" ||
          prop.name === "exo__Asset_isDefinedBy"
        ) {
          continue;
        }
        return `${prop.label} is required`;
      }
    }

    return null;
  }

  private extractValue(value: any): string {
    if (!value) return "";
    const str = String(value);
    // Remove [[ and ]] if present
    return str.replace(/^\[\[|\]\]$/g, "");
  }

  private humanizeClassName(className: string): string {
    // Remove prefix if present (e.g., "ems__Area" -> "Area")
    const withoutPrefix = className.split("__").pop() || className;

    // Convert to title case and add spacing
    return withoutPrefix
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .trim();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
