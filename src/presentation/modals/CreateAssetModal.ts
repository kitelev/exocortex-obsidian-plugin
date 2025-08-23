import { App, Modal, Setting, Notice, TFile } from "obsidian";
import { CreateAssetUseCase } from "../../application/use-cases/CreateAssetUseCase";
import { DIContainer } from "../../infrastructure/container/DIContainer";
import { IOntologyRepository } from "../../domain/repositories/IOntologyRepository";
import { IClassViewRepository } from "../../domain/repositories/IClassViewRepository";
import { PropertyCacheService } from "../../domain/services/PropertyCacheService";
import { CircuitBreakerService } from "../../infrastructure/resilience/CircuitBreakerService";
import { Result } from "../../domain/core/Result";
import { CreateAssetResponse } from "../../application/use-cases/CreateAssetUseCase";

/**
 * Modal for creating new ExoAssets
 * Presentation layer component that delegates to use cases
 */
export class CreateAssetModal extends Modal {
  private assetTitle: string = "";
  private assetClass: string = "exo__Asset";
  private assetOntology: string = "";
  private propertyValues: Map<string, any> = new Map();
  private propertiesContainer: HTMLElement | null = null;
  private properties: any[] = []; // Store current properties for testing

  private createAssetUseCase: CreateAssetUseCase;
  private container: DIContainer;
  private ontologyRepository: IOntologyRepository;
  private classViewRepository: IClassViewRepository;
  private propertyCache: PropertyCacheService;
  private circuitBreaker: CircuitBreakerService;

  constructor(app: App) {
    super(app);
    this.container = DIContainer.getInstance();
    this.createAssetUseCase = this.container.getCreateAssetUseCase();
    this.ontologyRepository = this.container.resolve<IOntologyRepository>(
      "IOntologyRepository",
    );
    this.classViewRepository = this.container.resolve<IClassViewRepository>(
      "IClassViewRepository",
    );
    this.propertyCache = this.container.resolve<PropertyCacheService>(
      "PropertyCacheService",
    );
    this.circuitBreaker = this.container.resolve<CircuitBreakerService>(
      "CircuitBreakerService",
    );
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Create ExoAsset" });

    await this.setupTitleField(contentEl);
    await this.setupClassField(contentEl);
    await this.setupOntologyField(contentEl);
    await this.setupPropertiesSection(contentEl);
    this.setupActionButtons(contentEl);
  }

  private async setupTitleField(containerEl: HTMLElement): Promise<void> {
    new Setting(containerEl)
      .setName("Title")
      .setDesc("Asset title")
      .addText((text) =>
        text
          .setPlaceholder("Enter asset title")
          .setValue(this.assetTitle)
          .onChange((value) => (this.assetTitle = value)),
      );
  }

  private async setupClassField(containerEl: HTMLElement): Promise<void> {
    // Get all class files from the vault
    const files = this.app.vault.getMarkdownFiles();
    const classes: { className: string; displayName: string }[] = [];

    // Find all class definitions (files with exo__Class frontmatter)
    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (cache?.frontmatter) {
        const instanceClass = cache.frontmatter["exo__Instance_class"];
        if (
          instanceClass === "[[exo__Class]]" ||
          instanceClass === "exo__Class"
        ) {
          const className = file.basename;
          const displayName = cache.frontmatter["rdfs__label"] || className;
          classes.push({ className, displayName });
        }
      }
    }

    // Add default classes if none found
    if (classes.length === 0) {
      classes.push(
        { className: "exo__Asset", displayName: "Asset" },
        { className: "exo__Class", displayName: "Class" },
        { className: "exo__Property", displayName: "Property" },
      );
    }

    new Setting(containerEl)
      .setName("Class")
      .setDesc("Select the type of asset")
      .addDropdown((dropdown) => {
        for (const classInfo of classes) {
          dropdown.addOption(classInfo.className, classInfo.displayName);
        }

        dropdown.setValue(this.assetClass);
        dropdown.onChange(async (value) => {
          this.assetClass = value;
          await this.updatePropertiesForClass(value);
        });
      });
  }

  private async setupOntologyField(containerEl: HTMLElement): Promise<void> {
    // Get all ontology files from the vault
    const files = this.app.vault.getMarkdownFiles();
    const ontologies: { prefix: string; displayName: string }[] = [];

    // Find all ontology definitions (files starting with ! or having exo__Ontology_prefix)
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

    const defaultOntology = "exo";

    // Set default ontology when no ontologies found in vault
    if (ontologies.length > 0 && !this.assetOntology) {
      this.assetOntology = defaultOntology;
    }

    new Setting(containerEl)
      .setName("Ontology")
      .setDesc("Select which knowledge graph this asset belongs to")
      .addDropdown((dropdown) => {
        for (const ontology of ontologies) {
          dropdown.addOption(ontology.prefix, ontology.displayName);
        }

        // Set default ontology
        if (
          defaultOntology &&
          ontologies.some((o: any) => o.prefix === defaultOntology)
        ) {
          this.assetOntology = defaultOntology;
          dropdown.setValue(defaultOntology);
        } else if (ontologies.length > 0) {
          this.assetOntology = ontologies[0].prefix;
          dropdown.setValue(ontologies[0].prefix);
        }

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

    await this.updatePropertiesForClass(this.assetClass);
  }

  private async updatePropertiesForClass(className: string): Promise<void> {
    if (!this.propertiesContainer) return;

    console.log(`Updating properties for class: ${className}`);

    // Clear the container - try Obsidian method first, fallback to DOM
    if (
      "empty" in this.propertiesContainer &&
      typeof (this.propertiesContainer as any).empty === "function"
    ) {
      (this.propertiesContainer as any).empty();
    } else {
      // Fallback to standard DOM method - use innerHTML for complete cleanup
      this.propertiesContainer.innerHTML = "";
    }
    this.propertyValues.clear();

    // Get properties for this class
    this.properties = [];
    const files = this.app.vault.getMarkdownFiles();

    console.log(`Scanning ${files.length} files for properties...`);

    // Find all property definitions related to this class
    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (cache?.frontmatter) {
        const instanceClass = cache.frontmatter["exo__Instance_class"];
        if (
          instanceClass === "[[exo__Property]]" ||
          instanceClass === "exo__Property"
        ) {
          const domain = cache.frontmatter["rdfs__domain"];
          // Check if this property belongs to the current class
          if (
            domain === `[[${className}]]` ||
            domain === className ||
            (Array.isArray(domain) &&
              (domain.includes(className) ||
                domain.includes(`[[${className}]]`)))
          ) {
            const propertyName = file.basename;
            const label = cache.frontmatter["rdfs__label"] || propertyName;
            const description = cache.frontmatter["rdfs__comment"] || "";
            const range = cache.frontmatter["rdfs__range"] || "string";
            const isRequired =
              cache.frontmatter["exo__Property_isRequired"] || false;
            const options = cache.frontmatter["exo__Property_options"] || null;

            console.log(
              `Found property ${propertyName} for class ${className}`,
            );

            // Determine property type based on range and options
            let type = this.mapRangeToType(range);
            if (options && Array.isArray(options)) {
              type = "enum";
            } else if (range === "select" && options) {
              type = "enum";
            }

            this.properties.push({
              name: propertyName,
              label: label,
              description: description,
              type: type,
              isRequired: isRequired,
              range: range,
              options: options,
            });
          }
        }
      }
    }

    console.log(
      `Found ${this.properties.length} properties for class ${className}`,
    );

    // Add some default properties for common classes
    if (this.properties.length === 0 && className === "exo__Asset") {
      this.properties.push(
        {
          name: "description",
          label: "Description",
          description: "A brief description of the asset",
          type: "text",
          isRequired: false,
        },
        {
          name: "tags",
          label: "Tags",
          description: "Tags for categorization",
          type: "array",
          isRequired: false,
        },
      );
    }

    if (this.properties.length === 0) {
      this.propertiesContainer.createEl("p", {
        text: "No specific properties for this class",
        cls: "exocortex-no-properties",
      });
      return;
    }

    // Create fields for all properties (including defaults)
    for (const prop of this.properties) {
      this.createPropertyField(prop);
    }
  }

  private mapRangeToType(range: string): string {
    // Map RDF/OWL ranges to input types
    if (range === "select") return "enum";
    if (range.includes("boolean")) return "boolean";
    if (range.includes("date") || range.includes("Date")) return "date";
    if (
      range.includes("integer") ||
      range.includes("decimal") ||
      range.includes("float")
    )
      return "number";
    if (range.includes("string") && range.includes("[]")) return "array";
    if (range.includes("text") || range.includes("Text")) return "text";
    return "string"; // default
  }

  private createPropertyField(property: any): void {
    if (!this.propertiesContainer) return;

    const setting = new Setting(this.propertiesContainer)
      .setName(property.label + (property.isRequired ? " *" : ""))
      .setDesc(property.description);

    // Create appropriate input based on property type
    switch (property.type) {
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
      case "text":
        this.createTextAreaField(setting, property);
        break;
      case "array":
        this.createArrayField(setting, property);
        break;
      default:
        this.createTextField(setting, property);
    }
  }

  private createEnumField(setting: Setting, property: any): void {
    setting.addDropdown((dropdown) => {
      dropdown.addOption("", "-- Select --");
      for (const option of property.options) {
        dropdown.addOption(option, option);
      }
      dropdown.onChange((value) => {
        if (value) {
          this.propertyValues.set(property.name, value);
        } else {
          this.propertyValues.delete(property.name);
        }
      });
    });
  }

  private createBooleanField(setting: Setting, property: any): void {
    setting.addToggle((toggle) => {
      toggle.onChange((value) => {
        this.propertyValues.set(property.name, value);
      });
    });
  }

  private createDateField(setting: Setting, property: any): void {
    setting.addText((text) => {
      text.setPlaceholder("YYYY-MM-DD").onChange((value) => {
        if (value) {
          this.propertyValues.set(property.name, value);
        } else {
          this.propertyValues.delete(property.name);
        }
      });
      // Set the input type to date
      text.inputEl.type = "date";
    });
  }

  private createNumberField(setting: Setting, property: any): void {
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
    });
  }

  private createTextAreaField(setting: Setting, property: any): void {
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
    });
  }

  private createArrayField(setting: Setting, property: any): void {
    setting.addText((text) => {
      text
        .setPlaceholder("Comma-separated values or [[links]]")
        .onChange((value) => {
          if (value) {
            if (value.includes("[[")) {
              const links = value.match(/\[\[([^\]]+)\]\]/g) || [];
              this.propertyValues.set(property.name, links);
            } else {
              const items = value
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s);
              this.propertyValues.set(property.name, items);
            }
          } else {
            this.propertyValues.delete(property.name);
          }
        });
    });
  }

  private createTextField(setting: Setting, property: any): void {
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

  onClose() {
    // Clear content - try Obsidian method first, fallback to DOM
    if (
      "empty" in this.contentEl &&
      typeof (this.contentEl as any).empty === "function"
    ) {
      (this.contentEl as any).empty();
    } else {
      // Fallback to standard DOM method - use innerHTML for complete cleanup
      // Try both methods to ensure compatibility
      this.contentEl.innerHTML = "";
      // Also try removing children manually as additional fallback
      while (this.contentEl.firstChild) {
        this.contentEl.removeChild(this.contentEl.firstChild);
      }
    }
  }
}
