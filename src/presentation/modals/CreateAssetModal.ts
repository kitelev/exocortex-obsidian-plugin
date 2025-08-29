import { App, Modal, Setting, Notice, TFile } from "obsidian";
import { CreateAssetUseCase } from "../../application/use-cases/CreateAssetUseCase";
import { DIContainer } from "../../infrastructure/container/DIContainer";
import { IOntologyRepository } from "../../domain/repositories/IOntologyRepository";
import { IClassViewRepository } from "../../domain/repositories/IClassViewRepository";
import { PropertyCacheService } from "../../domain/services/PropertyCacheService";
import { SemanticPropertyDiscoveryService } from "../../domain/services/SemanticPropertyDiscoveryService";
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
  private updateDebounceTimer: number | null = null;
  private isUpdatingProperties: boolean = false;

  private createAssetUseCase: CreateAssetUseCase;
  private container: DIContainer;
  private ontologyRepository: IOntologyRepository;
  private classViewRepository: IClassViewRepository;
  private propertyCache: PropertyCacheService;
  private propertyDiscoveryService: SemanticPropertyDiscoveryService;
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
    this.propertyDiscoveryService = new SemanticPropertyDiscoveryService(app);
    this.circuitBreaker = this.container.resolve<CircuitBreakerService>(
      "CircuitBreakerService",
    );
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.setAttribute("data-test", "create-asset-modal");
    contentEl.createEl("h2", { text: "Create ExoAsset" });

    await this.setupTitleField(contentEl);
    await this.setupClassField(contentEl);
    await this.setupOntologyField(contentEl);
    await this.setupPropertiesSection(contentEl);
    this.setupActionButtons(contentEl);
  }

  private async setupTitleField(containerEl: HTMLElement): Promise<void> {
    const setting = new Setting(containerEl)
      .setName("Title")
      .setDesc("Asset title")
      .addText((text) => {
        text.inputEl.setAttribute("data-test", "asset-title-input");
        text
          .setPlaceholder("Enter asset title")
          .setValue(this.assetTitle)
          .onChange((value) => (this.assetTitle = value));
      });
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

    const setting = new Setting(containerEl)
      .setName("Class")
      .setDesc("Select the type of asset")
      .addDropdown((dropdown) => {
        dropdown.selectEl.setAttribute("data-test", "asset-class-dropdown");

        for (const classInfo of classes) {
          dropdown.addOption(classInfo.className, classInfo.displayName);
        }

        dropdown.setValue(this.assetClass);
        dropdown.onChange(async (value) => {
          this.assetClass = value;
          
          // Debounce rapid class changes to prevent race conditions
          if (this.updateDebounceTimer !== null) {
            window.clearTimeout(this.updateDebounceTimer);
          }
          
          this.updateDebounceTimer = window.setTimeout(async () => {
            this.updateDebounceTimer = null;
            await this.updatePropertiesForClass(value);
          }, 50) as unknown as number; // 50ms debounce
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
    this.propertiesContainer.setAttribute("data-test", "properties-container");

    await this.updatePropertiesForClass(this.assetClass);
  }

  private async updatePropertiesForClass(className: string): Promise<void> {
    if (!this.propertiesContainer) return;
    
    // Prevent concurrent updates
    if (this.isUpdatingProperties) {
      console.log(`Already updating properties, skipping update for: ${className}`);
      return;
    }
    
    this.isUpdatingProperties = true;

    console.log(`Updating properties for class: ${className}`);
    const startTime = Date.now();

    try {
      // Clear cache for the new class to ensure fresh data
      this.propertyDiscoveryService.clearCache();
      
      // Clear property values BEFORE clearing the container to prevent stale data
      this.propertyValues.clear();
      this.properties = [];
      
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
      
      // Force DOM refresh to ensure complete cleanup
      await new Promise(resolve => setTimeout(resolve, 0));

      // Use SemanticPropertyDiscoveryService for proper property resolution
      const propertyResult =
        await this.propertyDiscoveryService.discoverPropertiesForClass(
          className,
        );

      if (!propertyResult.isSuccess) {
        console.error(
          `Property discovery failed: ${propertyResult.getError()}`,
        );

        // Display error message to user
        const errorEl = this.propertiesContainer.createEl("div", {
          cls: "exocortex-property-error",
        });
        errorEl.createEl("p", {
          text: "Failed to load properties for this class",
          cls: "exocortex-error-message",
        });
        errorEl.createEl("p", {
          text: propertyResult.getError(),
          cls: "exocortex-error-details",
        });

        // Still allow basic asset creation
        this.addFallbackProperties();
        return;
      }

      const discoveredProperties = propertyResult.getValue() || [];
      console.log(
        `Discovered ${discoveredProperties.length} properties for class ${className}`,
      );

      // Convert semantic property metadata to modal format
      this.properties = discoveredProperties.map((prop) => ({
        name: prop.name,
        label: prop.label,
        description: prop.description || "",
        type: this.mapSemanticPropertyTypeToUIType(prop),
        isRequired: prop.isRequired,
        range: prop.range,
        options: prop.options,
        semanticType: prop.type, // Keep original semantic type for reference
      }));

      if (this.properties.length === 0) {
        this.propertiesContainer.createEl("p", {
          text: "No specific properties for this class",
          cls: "exocortex-no-properties",
        });
      } else {
        // Create fields for all properties
        for (const prop of this.properties) {
          this.createPropertyField(prop);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`Property update completed in ${duration}ms`);

      // Performance monitoring for testing
      if (duration > 200) {
        console.warn(
          `Property loading took ${duration}ms, exceeding 200ms threshold`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Error updating properties for class ${className}:`, error);

      // Display user-friendly error and provide fallback
      const errorEl = this.propertiesContainer.createEl("div", {
        cls: "exocortex-property-error",
      });
      errorEl.createEl("p", {
        text: "Unable to load class properties",
        cls: "exocortex-error-message",
      });
      errorEl.createEl("p", {
        text: `Error: ${errorMessage}`,
        cls: "exocortex-error-details",
      });

      this.addFallbackProperties();
    } finally {
      // Always reset the update flag
      this.isUpdatingProperties = false;
    }
  }

  /**
   * Map semantic property type to UI input type
   */
  private mapSemanticPropertyTypeToUIType(prop: any): string {
    // Handle ObjectProperty vs DatatypeProperty
    if (prop.type === "ObjectProperty") {
      return "object"; // Will create dropdown with instances
    }

    // Handle DatatypeProperty with range-based mapping
    if (prop.options && Array.isArray(prop.options)) {
      return "enum";
    }

    return this.mapRangeToType(prop.range);
  }

  /**
   * Add fallback properties when property discovery fails
   */
  private addFallbackProperties(): void {
    this.properties = [
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
    ];

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

    // Add test attribute for E2E testing (check if settingEl exists for compatibility)
    const settingEl = (setting as any).settingEl;
    if (settingEl) {
      settingEl.setAttribute("data-test", `property-${property.name}`);
      settingEl.setAttribute("data-property-type", property.type);
      settingEl.setAttribute("data-required", property.isRequired.toString());
    }

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
      case "object":
        this.createObjectPropertyField(setting, property);
        break;
      default:
        this.createTextField(setting, property);
    }
  }

  /**
   * Create ObjectProperty field with instance dropdown
   */
  private createObjectPropertyField(
    setting: Setting,
    property: any,
  ): void {
    // Extract class name from range for ObjectProperty
    const rangeClass = property.range.replace(/^\[\[|\]\]$/g, "");

    // Create dropdown synchronously first
    setting.addDropdown((dropdown) => {
      dropdown.addOption("", "Loading...");
      dropdown.onChange((value) => {
        if (value && value !== "") {
          this.propertyValues.set(property.name, value);
        } else {
          this.propertyValues.delete(property.name);
        }
      });
      
      // Load instances asynchronously without blocking
      this.propertyDiscoveryService.getInstancesOfClass(rangeClass).then(
        (instancesResult) => {
          if (!instancesResult.isSuccess) {
            console.warn(
              `Failed to get instances for ${rangeClass}: ${instancesResult.getError()}`,
            );
            dropdown.selectEl.innerHTML = "";
            dropdown.addOption("", "-- Error loading options --");
            return;
          }

          const instances = instancesResult.getValue() || [];
          
          // Clear and repopulate dropdown
          dropdown.selectEl.innerHTML = "";
          dropdown.addOption("", "-- Select --");
          for (const instance of instances) {
            dropdown.addOption(instance.value, instance.label);
          }
        }
      );
    });
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
    new Setting(containerEl).addButton((btn) => {
      btn.buttonEl.setAttribute("data-test", "create-asset-button");
      btn
        .setButtonText("Create")
        .setCta()
        .onClick(async () => {
          await this.createAsset();
        });
    });
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
    // Cancel any pending property updates
    if (this.updateDebounceTimer !== null) {
      window.clearTimeout(this.updateDebounceTimer);
      this.updateDebounceTimer = null;
    }
    
    // Clear all state
    this.propertyValues.clear();
    this.properties = [];
    this.propertiesContainer = null;
    this.isUpdatingProperties = false;
    
    // Clear cache to prevent stale data
    this.propertyDiscoveryService.clearCache();
    
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
