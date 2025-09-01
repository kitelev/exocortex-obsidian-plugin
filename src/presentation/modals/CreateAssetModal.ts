import { App, Modal, Notice, Setting } from "obsidian";
import { CreateAssetUseCase } from "../../application/use-cases/CreateAssetUseCase";
import { DIContainer } from "../../infrastructure/container/DIContainer";
import { IOntologyRepository } from "../../domain/repositories/IOntologyRepository";
import { IClassViewRepository } from "../../domain/repositories/IClassViewRepository";
import { PropertyCacheService } from "../../domain/services/PropertyCacheService";
import { SemanticPropertyDiscoveryService } from "../../domain/services/SemanticPropertyDiscoveryService";
import { CircuitBreakerService } from "../../infrastructure/resilience/CircuitBreakerService";
import { PropertyFieldManager } from "./components/PropertyFieldManager";
import { FormUIManager, FormUICallbacks } from "./components/FormUIManager";
import {
  AssetCreationOrchestrator,
  AssetCreationCallbacks,
} from "./components/AssetCreationOrchestrator";

/**
 * Modal for creating new ExoAssets
 * Refactored to use focused component classes following SOLID principles
 * Presentation layer component that delegates to use cases
 */
export class CreateAssetModal extends Modal {
  private propertiesContainer: HTMLElement | null = null;
  private updateDebounceTimer: number | null = null;
  private isUpdatingProperties: boolean = false;

  // Focused component managers
  private propertyFieldManager: PropertyFieldManager;
  private formUIManager: FormUIManager;
  private assetCreationOrchestrator: AssetCreationOrchestrator;

  // Dependencies
  private container: DIContainer;

  constructor(app: App) {
    super(app);
    this.container = DIContainer.getInstance();

    // Initialize focused component managers
    const ontologyRepository = this.container.resolve<IOntologyRepository>(
      "IOntologyRepository",
    );
    const classViewRepository = this.container.resolve<IClassViewRepository>(
      "IClassViewRepository",
    );
    const propertyCache = this.container.resolve<PropertyCacheService>(
      "PropertyCacheService",
    );
    const propertyDiscoveryService = new SemanticPropertyDiscoveryService(app);
    const createAssetUseCase = this.container.getCreateAssetUseCase();
    const circuitBreaker = this.container.resolve<CircuitBreakerService>(
      "CircuitBreakerService",
    );

    this.propertyFieldManager = new PropertyFieldManager(
      app,
      propertyDiscoveryService,
      propertyCache,
    );
    this.formUIManager = new FormUIManager(
      app,
      ontologyRepository,
      classViewRepository,
    );
    this.assetCreationOrchestrator = new AssetCreationOrchestrator(
      app,
      createAssetUseCase,
      circuitBreaker,
    );
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.setAttribute("data-test", "create-asset-modal");
    contentEl.createEl("h2", { text: "Create ExoAsset" });

    const callbacks: FormUICallbacks = {
      onTitleChange: (title) => {
        // Title change handled by FormUIManager
      },
      onClassChange: async (className) => {
        await this.updatePropertiesForClass(className);
      },
      onOntologyChange: (ontology) => {
        // Ontology change handled by FormUIManager
      },
      onCreateAsset: async () => {
        await this.createAsset();
      },
      onCancel: () => {
        this.close();
      },
    };

    await this.formUIManager.setupTitleField(contentEl, callbacks);
    await this.formUIManager.setupClassField(contentEl, callbacks);
    await this.formUIManager.setupOntologyField(contentEl, callbacks);
    await this.setupPropertiesSection(contentEl);
    this.formUIManager.setupActionButtons(contentEl, callbacks);
  }

  private async setupPropertiesSection(
    containerEl: HTMLElement,
  ): Promise<void> {
    const propertiesSection = containerEl.createEl("div", {
      cls: "exocortex-properties-section",
    });
    propertiesSection.createEl("h3", { text: "Properties" });

    this.propertiesContainer = propertiesSection.createEl("div", {
      cls: "exocortex-properties-container",
    });

    // Load initial properties for default class
    await this.updatePropertiesForClass(
      this.formUIManager.getValue("assetClass"),
    );
  }

  private async createAsset(): Promise<void> {
    const formValues = this.formUIManager.getValues();
    const propertyValues = this.propertyFieldManager.getPropertyValues();

    const request = this.assetCreationOrchestrator.createAssetCreationRequest(
      formValues,
      propertyValues,
    );

    const callbacks: AssetCreationCallbacks = {
      onSuccess: (assetPath: string) => {
        new Notice(`Asset "${request.title}" created successfully!`);
        this.close();
      },
      onError: (error: string) => {
        new Notice(`Error: ${error}`, 5000);
      },
      onValidationError: (errors: string[]) => {
        new Notice(`Validation error: ${errors.join(", ")}`, 6000);
      },
    };

    await this.assetCreationOrchestrator.createAsset(request, callbacks);
  }

  onClose() {
    // Cancel any pending property updates
    if (this.updateDebounceTimer !== null) {
      window.clearTimeout(this.updateDebounceTimer);
      this.updateDebounceTimer = null;
    }

    // Clear all state using component managers
    this.propertyFieldManager.clearPropertyValues();
    this.formUIManager.reset();
    this.propertiesContainer = null;
    this.isUpdatingProperties = false;

    // Clear content - try Obsidian method first, fallback to DOM
    if (
      "empty" in this.contentEl &&
      typeof (this.contentEl as any).empty === "function"
    ) {
      (this.contentEl as any).empty();
    } else {
      // Fallback to standard DOM method
      this.contentEl.innerHTML = "";
      while (this.contentEl.firstChild) {
        this.contentEl.removeChild(this.contentEl.firstChild);
      }
    }
  }

  private async updatePropertiesForClass(className: string): Promise<void> {
    if (!this.propertiesContainer || this.isUpdatingProperties) return;

    this.isUpdatingProperties = true;

    try {
      // Debounce rapid class changes to prevent race conditions
      if (this.updateDebounceTimer !== null) {
        window.clearTimeout(this.updateDebounceTimer);
      }

      this.updateDebounceTimer = window.setTimeout(async () => {
        this.updateDebounceTimer = null;

        const result =
          await this.propertyFieldManager.discoverPropertiesForClass(className);

        if (result.isSuccess) {
          this.propertyFieldManager.renderPropertiesInContainer(
            this.propertiesContainer!,
          );
        } else {
          console.error(`Property discovery failed: ${result.getError()}`);

          // Display error message to user
          this.propertiesContainer!.empty();
          const errorEl = this.propertiesContainer!.createEl("div", {
            cls: "exocortex-error-message",
          });
          errorEl.createEl("p", {
            text: `Failed to load properties for ${className}`,
            cls: "exocortex-error-text",
          });
          errorEl.createEl("small", {
            text: result.getError(),
            cls: "exocortex-error-details",
          });
        }

        this.isUpdatingProperties = false;
      }, 50) as unknown as number;
    } catch (error) {
      console.error("Error updating properties:", error);
      this.isUpdatingProperties = false;
    }
  }
}
