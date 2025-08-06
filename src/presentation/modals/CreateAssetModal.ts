import { App, Modal, Setting, Notice } from 'obsidian';
import { CreateAssetUseCase } from '../../application/use-cases/CreateAssetUseCase';
import { Container, SERVICE_TOKENS } from '../../shared/Container';

/**
 * Modal for creating new ExoAssets
 * Presentation layer component that delegates to use cases
 */
export class CreateAssetModal extends Modal {
  private assetTitle: string = '';
  private assetClass: string = 'exo__Asset';
  private assetOntology: string = '';
  private propertyValues: Map<string, any> = new Map();
  private propertiesContainer: HTMLElement | null = null;
  
  private createAssetUseCase: CreateAssetUseCase;
  private container: Container;

  constructor(app: App) {
    super(app);
    this.container = Container.getInstance();
    this.createAssetUseCase = this.container.resolve(SERVICE_TOKENS.CREATE_ASSET_USE_CASE);
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
      .addText(text => text
        .setPlaceholder("Enter asset title")
        .setValue(this.assetTitle)
        .onChange(value => this.assetTitle = value));
  }

  private async setupClassField(containerEl: HTMLElement): Promise<void> {
    const classService = this.container.resolve<any>(SERVICE_TOKENS.ASSET_SERVICE);
    const classes = await classService.findAllClasses();

    new Setting(containerEl)
      .setName("Class")
      .setDesc("Select the type of asset")
      .addDropdown(dropdown => {
        for (const classInfo of classes) {
          dropdown.addOption(classInfo.className, classInfo.displayName);
        }
        
        dropdown.setValue(this.assetClass);
        dropdown.onChange(async value => {
          this.assetClass = value;
          await this.updatePropertiesForClass(value);
        });
      });
  }

  private async setupOntologyField(containerEl: HTMLElement): Promise<void> {
    const ontologyService = this.container.resolve<any>(SERVICE_TOKENS.ONTOLOGY_SERVICE);
    const ontologies = await ontologyService.findAll();
    
    const settings = this.container.resolve<any>(SERVICE_TOKENS.SETTINGS);
    const defaultOntology = settings.defaultOntology;

    new Setting(containerEl)
      .setName("Ontology")
      .setDesc("Select which knowledge graph this asset belongs to")
      .addDropdown(dropdown => {
        for (const ontology of ontologies) {
          dropdown.addOption(ontology.prefix, ontology.displayName);
        }
        
        // Set default ontology
        if (defaultOntology && ontologies.some(o => o.prefix === defaultOntology)) {
          this.assetOntology = defaultOntology;
          dropdown.setValue(defaultOntology);
        } else if (ontologies.length > 0) {
          this.assetOntology = ontologies[0].prefix;
          dropdown.setValue(ontologies[0].prefix);
        }
        
        dropdown.onChange(value => {
          this.assetOntology = value;
        });
      });
  }

  private async setupPropertiesSection(containerEl: HTMLElement): Promise<void> {
    containerEl.createEl("h3", { 
      text: "Properties", 
      cls: "exocortex-properties-header" 
    });
    
    this.propertiesContainer = containerEl.createDiv({ 
      cls: "exocortex-properties-container" 
    });
    
    await this.updatePropertiesForClass(this.assetClass);
  }

  private async updatePropertiesForClass(className: string): Promise<void> {
    if (!this.propertiesContainer) return;
    
    this.propertiesContainer.empty();
    this.propertyValues.clear();
    
    const propertyService = this.container.resolve<any>(SERVICE_TOKENS.PROPERTY_SERVICE);
    const properties = await propertyService.findPropertiesForClass(className);
    
    if (properties.length === 0) {
      this.propertiesContainer.createEl("p", {
        text: "No specific properties for this class",
        cls: "exocortex-no-properties"
      });
      return;
    }
    
    for (const prop of properties) {
      this.createPropertyField(prop);
    }
  }

  private createPropertyField(property: any): void {
    if (!this.propertiesContainer) return;
    
    const setting = new Setting(this.propertiesContainer)
      .setName(property.label + (property.isRequired ? ' *' : ''))
      .setDesc(property.description);
    
    // Create appropriate input based on property type
    switch (property.type) {
      case 'enum':
        this.createEnumField(setting, property);
        break;
      case 'boolean':
        this.createBooleanField(setting, property);
        break;
      case 'date':
        this.createDateField(setting, property);
        break;
      case 'number':
        this.createNumberField(setting, property);
        break;
      case 'text':
        this.createTextAreaField(setting, property);
        break;
      case 'array':
        this.createArrayField(setting, property);
        break;
      default:
        this.createTextField(setting, property);
    }
  }

  private createEnumField(setting: Setting, property: any): void {
    setting.addDropdown(dropdown => {
      dropdown.addOption('', '-- Select --');
      for (const option of property.options) {
        dropdown.addOption(option, option);
      }
      dropdown.onChange(value => {
        if (value) {
          this.propertyValues.set(property.name, value);
        } else {
          this.propertyValues.delete(property.name);
        }
      });
    });
  }

  private createBooleanField(setting: Setting, property: any): void {
    setting.addToggle(toggle => {
      toggle.onChange(value => {
        this.propertyValues.set(property.name, value);
      });
    });
  }

  private createDateField(setting: Setting, property: any): void {
    setting.addText(text => {
      text.setPlaceholder('YYYY-MM-DD')
        .onChange(value => {
          if (value) {
            this.propertyValues.set(property.name, value);
          } else {
            this.propertyValues.delete(property.name);
          }
        });
    });
  }

  private createNumberField(setting: Setting, property: any): void {
    setting.addText(text => {
      text.setPlaceholder('Enter number')
        .onChange(value => {
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
    setting.addTextArea(text => {
      text.setPlaceholder('Enter ' + property.label.toLowerCase())
        .onChange(value => {
          if (value) {
            this.propertyValues.set(property.name, value);
          } else {
            this.propertyValues.delete(property.name);
          }
        });
    });
  }

  private createArrayField(setting: Setting, property: any): void {
    setting.addText(text => {
      text.setPlaceholder('Comma-separated values or [[links]]')
        .onChange(value => {
          if (value) {
            if (value.includes('[[')) {
              const links = value.match(/\[\[([^\]]+)\]\]/g) || [];
              this.propertyValues.set(property.name, links);
            } else {
              const items = value.split(',').map(s => s.trim()).filter(s => s);
              this.propertyValues.set(property.name, items);
            }
          } else {
            this.propertyValues.delete(property.name);
          }
        });
    });
  }

  private createTextField(setting: Setting, property: any): void {
    setting.addText(text => {
      text.setPlaceholder('Enter ' + property.label.toLowerCase())
        .onChange(value => {
          if (value) {
            this.propertyValues.set(property.name, value);
          } else {
            this.propertyValues.delete(property.name);
          }
        });
    });
  }

  private setupActionButtons(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .addButton(btn => btn
        .setButtonText("Create")
        .setCta()
        .onClick(async () => {
          await this.createAsset();
        }));
  }

  private async createAsset(): Promise<void> {
    try {
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
        properties
      });
      
      if (response.success) {
        new Notice(response.message);
        this.close();
      } else {
        new Notice(`Failed to create asset`);
      }
    } catch (error: any) {
      new Notice(`Error: ${error.message}`);
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}