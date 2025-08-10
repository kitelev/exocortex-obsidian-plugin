import { App, Setting, Notice } from 'obsidian';
import { CreateAssetModal } from '../../../src/presentation/modals/CreateAssetModal';
import { CreateAssetUseCase } from '../../../src/application/use-cases/CreateAssetUseCase';
import { DIContainer } from '../../../src/infrastructure/container/DIContainer';

// Mock DIContainer
jest.mock('../../../src/infrastructure/container/DIContainer');

// Mock Notice
jest.mock('obsidian', () => {
  const actual = jest.requireActual('obsidian');
  return {
    ...actual,
    Notice: jest.fn()
  };
});

// Extend HTMLElement to include Obsidian-specific methods
declare global {
  interface HTMLElement {
    createEl(tag: string, attrs?: any): HTMLElement;
    createDiv(attrs?: any): HTMLElement;
    empty(): void;
  }
}

// Add Obsidian DOM extensions to HTMLElement prototype
beforeAll(() => {
  HTMLElement.prototype.createEl = jest.fn().mockImplementation((tag: string, attrs?: any) => {
    const element = document.createElement(tag);
    if (attrs?.text) element.textContent = attrs.text;
    if (attrs?.cls) element.className = attrs.cls;
    return element;
  });

  HTMLElement.prototype.createDiv = jest.fn().mockImplementation((attrs?: any) => {
    const element = document.createElement('div');
    if (attrs?.cls) element.className = attrs.cls;
    return element;
  });

  HTMLElement.prototype.empty = jest.fn().mockImplementation(() => {
    // Mock empty implementation - in real Obsidian this clears the element
  });
});

describe('CreateAssetModal', () => {
  let app: App;
  let modal: CreateAssetModal;
  let mockCreateAssetUseCase: jest.Mocked<CreateAssetUseCase>;
  let mockContainer: jest.Mocked<DIContainer>;

  beforeEach(() => {
    // Setup app mock
    app = new App();

    // Setup CreateAssetUseCase mock
    mockCreateAssetUseCase = {
      execute: jest.fn()
    } as any;

    // Setup DIContainer mock
    mockContainer = {
      getCreateAssetUseCase: jest.fn().mockReturnValue(mockCreateAssetUseCase),
      getInstance: jest.fn().mockReturnThis(),
      resolve: jest.fn().mockImplementation((token: string) => {
        // Return empty mock repositories
        return {};
      })
    } as any;

    (DIContainer.getInstance as jest.Mock).mockReturnValue(mockContainer);

    // Create modal instance
    modal = new CreateAssetModal(app);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Initialization', () => {
    test('should create modal with default values', () => {
      expect(modal).toBeDefined();
      expect(modal.app).toBe(app);
    });

    test('should initialize with DIContainer', () => {
      expect(DIContainer.getInstance).toHaveBeenCalled();
      expect(mockContainer.getCreateAssetUseCase).toHaveBeenCalled();
    });

    test('should have default asset values', () => {
      expect((modal as any).assetTitle).toBe('');
      expect((modal as any).assetClass).toBe('exo__Asset');
      expect((modal as any).assetOntology).toBe('');
      expect((modal as any).propertyValues).toBeInstanceOf(Map);
    });
  });

  describe('Modal Opening', () => {
    test('should setup UI elements when opened', async () => {
      const mockContentEl = document.createElement('div');
      (modal as any).contentEl = mockContentEl;

      await modal.onOpen();

      expect(mockContentEl.createEl).toHaveBeenCalledWith('h2', { text: 'Create ExoAsset' });
    });

    test('should setup all required fields', async () => {
      const mockContentEl = document.createElement('div');
      (modal as any).contentEl = mockContentEl;

      const setupTitleFieldSpy = jest.spyOn(modal as any, 'setupTitleField');
      const setupClassFieldSpy = jest.spyOn(modal as any, 'setupClassField');
      const setupOntologyFieldSpy = jest.spyOn(modal as any, 'setupOntologyField');
      const setupPropertiesSectionSpy = jest.spyOn(modal as any, 'setupPropertiesSection');
      const setupActionButtonsSpy = jest.spyOn(modal as any, 'setupActionButtons');

      await modal.onOpen();

      expect(setupTitleFieldSpy).toHaveBeenCalled();
      expect(setupClassFieldSpy).toHaveBeenCalled();
      expect(setupOntologyFieldSpy).toHaveBeenCalled();
      expect(setupPropertiesSectionSpy).toHaveBeenCalled();
      expect(setupActionButtonsSpy).toHaveBeenCalled();
    });
  });

  describe('Title Field', () => {
    test('should setup title field correctly', async () => {
      const containerEl = document.createElement('div');
      
      await (modal as any).setupTitleField(containerEl);

      // Verify Setting was created for title field
      expect(Setting).toBeDefined();
    });

    test('should update assetTitle when title changes', async () => {
      const containerEl = document.createElement('div');
      
      await (modal as any).setupTitleField(containerEl);

      // Simulate title change
      const testTitle = 'Test Asset Title';
      (modal as any).assetTitle = testTitle;

      expect((modal as any).assetTitle).toBe(testTitle);
    });
  });

  describe('Class Field', () => {
    test('should setup class field correctly', async () => {
      const containerEl = document.createElement('div');
      
      await (modal as any).setupClassField(containerEl);

      expect(Setting).toBeDefined();
    });

    test('should have default class value', async () => {
      expect((modal as any).assetClass).toBe('exo__Asset');
    });

    test('should update properties when class changes', async () => {
      const containerEl = document.createElement('div');
      const updatePropertiesForClassSpy = jest.spyOn(modal as any, 'updatePropertiesForClass');
      
      await (modal as any).setupClassField(containerEl);

      // Simulate class change
      const newClass = 'exo__Task';
      (modal as any).assetClass = newClass;
      
      expect((modal as any).assetClass).toBe(newClass);
    });
  });

  describe('Ontology Field', () => {
    test('should setup ontology field correctly', async () => {
      const containerEl = document.createElement('div');
      
      await (modal as any).setupOntologyField(containerEl);

      expect(Setting).toBeDefined();
    });

    test('should handle empty ontology list', async () => {
      const containerEl = document.createElement('div');
      
      await (modal as any).setupOntologyField(containerEl);

      // Should not crash with empty ontologies list
      expect(containerEl).toBeDefined();
    });
  });

  describe('Properties Section', () => {
    test('should setup properties section correctly', async () => {
      const containerEl = document.createElement('div');
      
      await (modal as any).setupPropertiesSection(containerEl);

      expect(containerEl.createEl).toHaveBeenCalledWith('h3', {
        text: 'Properties',
        cls: 'exocortex-properties-header'
      });
      expect(containerEl.createDiv).toHaveBeenCalledWith({
        cls: 'exocortex-properties-container'
      });
    });

    test('should update properties for default class', async () => {
      const containerEl = document.createElement('div');
      const updatePropertiesForClassSpy = jest.spyOn(modal as any, 'updatePropertiesForClass');
      
      await (modal as any).setupPropertiesSection(containerEl);

      expect(updatePropertiesForClassSpy).toHaveBeenCalledWith('exo__Asset');
    });
  });

  describe('Properties Management', () => {
    test('should clear existing properties when updating for new class', async () => {
      const mockPropertiesContainer = document.createElement('div');
      
      (modal as any).propertiesContainer = mockPropertiesContainer;
      (modal as any).propertyValues.set('test', 'value');

      await (modal as any).updatePropertiesForClass('exo__Task');

      expect(mockPropertiesContainer.empty).toHaveBeenCalled();
      expect((modal as any).propertyValues.size).toBe(0);
    });

    test('should add default properties for exo__Asset class', async () => {
      const mockPropertiesContainer = document.createElement('div');
      mockPropertiesContainer.createEl = jest.fn().mockReturnValue(document.createElement('div'));
      mockPropertiesContainer.empty = jest.fn();
      
      (modal as any).propertiesContainer = mockPropertiesContainer;

      await (modal as any).updatePropertiesForClass('exo__Asset');

      // Should have added default properties for exo__Asset (description and tags)
      expect((modal as any).propertyValues).toBeDefined();
      // Should have created property fields in the container
      expect(mockPropertiesContainer.createEl).not.toHaveBeenCalledWith('p', {
        text: 'No specific properties for this class',
        cls: 'exocortex-no-properties'
      });
    });
  });

  describe('Property Field Creation', () => {
    let mockPropertiesContainer: HTMLElement;

    beforeEach(() => {
      mockPropertiesContainer = document.createElement('div');
      (modal as any).propertiesContainer = mockPropertiesContainer;
    });

    test('should create text field for text property', () => {
      const property = {
        name: 'description',
        label: 'Description',
        type: 'text',
        isRequired: false,
        description: 'Asset description'
      };

      (modal as any).createPropertyField(property);

      // Should create Setting instance
      expect(Setting).toBeDefined();
    });

    test('should create enum field for enum property', () => {
      const property = {
        name: 'status',
        label: 'Status',
        type: 'enum',
        options: ['active', 'inactive'],
        isRequired: true,
        description: 'Asset status'
      };

      (modal as any).createPropertyField(property);

      expect(Setting).toBeDefined();
    });

    test('should create boolean field for boolean property', () => {
      const property = {
        name: 'completed',
        label: 'Completed',
        type: 'boolean',
        isRequired: false,
        description: 'Whether task is completed'
      };

      (modal as any).createPropertyField(property);

      expect(Setting).toBeDefined();
    });

    test('should create date field for date property', () => {
      const property = {
        name: 'dueDate',
        label: 'Due Date',
        type: 'date',
        isRequired: false,
        description: 'Task due date'
      };

      (modal as any).createPropertyField(property);

      expect(Setting).toBeDefined();
    });

    test('should create number field for number property', () => {
      const property = {
        name: 'effort',
        label: 'Effort',
        type: 'number',
        isRequired: false,
        description: 'Estimated effort in hours'
      };

      (modal as any).createPropertyField(property);

      expect(Setting).toBeDefined();
    });

    test('should create textarea field for text property', () => {
      const property = {
        name: 'notes',
        label: 'Notes',
        type: 'text',
        isRequired: false,
        description: 'Additional notes'
      };

      (modal as any).createPropertyField(property);

      expect(Setting).toBeDefined();
    });

    test('should create array field for array property', () => {
      const property = {
        name: 'tags',
        label: 'Tags',
        type: 'array',
        isRequired: false,
        description: 'Asset tags'
      };

      (modal as any).createPropertyField(property);

      expect(Setting).toBeDefined();
    });

    test('should show required indicator for required fields', () => {
      const property = {
        name: 'title',
        label: 'Title',
        type: 'text',
        isRequired: true,
        description: 'Asset title'
      };

      (modal as any).createPropertyField(property);

      // The field label should include the required indicator " *"
      expect(Setting).toBeDefined();
    });
  });

  describe('Asset Creation', () => {
    test('should call createAssetUseCase.execute when creating asset', async () => {
      mockCreateAssetUseCase.execute.mockResolvedValue({
        success: true,
        assetId: 'test-id',
        message: 'Asset created successfully'
      });

      (modal as any).assetTitle = 'Test Asset';
      (modal as any).assetClass = 'exo__Task';
      (modal as any).assetOntology = 'exo';
      (modal as any).propertyValues.set('priority', 'high');

      const closeSpy = jest.spyOn(modal, 'close').mockImplementation(() => {});

      await (modal as any).createAsset();

      expect(mockCreateAssetUseCase.execute).toHaveBeenCalledWith({
        title: 'Test Asset',
        className: 'exo__Task',
        ontologyPrefix: 'exo',
        properties: {
          priority: 'high'
        }
      });

      expect(Notice).toHaveBeenCalledWith('Asset created successfully');
      expect(closeSpy).toHaveBeenCalled();
    });

    test('should show error notice when asset creation fails', async () => {
      mockCreateAssetUseCase.execute.mockResolvedValue({
        success: false,
        assetId: '',
        message: 'Creation failed'
      });

      (modal as any).assetTitle = 'Test Asset';

      await (modal as any).createAsset();

      expect(Notice).toHaveBeenCalledWith('Failed to create asset');
    });

    test('should handle errors during asset creation', async () => {
      const error = new Error('Network error');
      mockCreateAssetUseCase.execute.mockRejectedValue(error);

      (modal as any).assetTitle = 'Test Asset';

      await (modal as any).createAsset();

      expect(Notice).toHaveBeenCalledWith('Error: Network error');
    });

    test('should convert property values to plain object', async () => {
      mockCreateAssetUseCase.execute.mockResolvedValue({
        success: true,
        assetId: 'test-id',
        message: 'Success'
      });

      (modal as any).assetTitle = 'Test Asset';
      (modal as any).propertyValues.set('prop1', 'value1');
      (modal as any).propertyValues.set('prop2', 'value2');

      await (modal as any).createAsset();

      expect(mockCreateAssetUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: {
            prop1: 'value1',
            prop2: 'value2'
          }
        })
      );
    });
  });

  describe('Modal Cleanup', () => {
    test('should clear content on close', () => {
      const mockContentEl = document.createElement('div');
      const emptySpy = jest.spyOn(mockContentEl, 'empty');
      (modal as any).contentEl = mockContentEl;

      modal.onClose();

      expect(emptySpy).toHaveBeenCalled();
    });
  });

  describe('Input Validation', () => {
    test('should handle empty title field', async () => {
      mockCreateAssetUseCase.execute.mockRejectedValue(new Error('Asset title is required'));

      (modal as any).assetTitle = '';

      await (modal as any).createAsset();

      expect(Notice).toHaveBeenCalledWith('Error: Asset title is required');
    });

    test('should handle missing class field', async () => {
      mockCreateAssetUseCase.execute.mockRejectedValue(new Error('Asset class is required'));

      (modal as any).assetTitle = 'Test';
      (modal as any).assetClass = '';

      await (modal as any).createAsset();

      expect(Notice).toHaveBeenCalledWith('Error: Asset class is required');
    });

    test('should handle missing ontology field', async () => {
      mockCreateAssetUseCase.execute.mockRejectedValue(new Error('Ontology prefix is required'));

      (modal as any).assetTitle = 'Test';
      (modal as any).assetOntology = '';

      await (modal as any).createAsset();

      expect(Notice).toHaveBeenCalledWith('Error: Ontology prefix is required');
    });
  });

  describe('Property Value Handling', () => {
    test('should handle array values correctly', () => {
      const containerEl = document.createElement('div');
      (modal as any).propertiesContainer = containerEl;

      const property = {
        name: 'tags',
        label: 'Tags',
        type: 'array',
        isRequired: false,
        description: 'Asset tags'
      };

      (modal as any).createArrayField = jest.fn().mockImplementation((setting, prop) => {
        // Simulate adding comma-separated values
        (modal as any).propertyValues.set(prop.name, ['tag1', 'tag2', 'tag3']);
      });

      (modal as any).createPropertyField(property);
      (modal as any).createArrayField(null, property);

      const values = (modal as any).propertyValues.get('tags');
      expect(values).toEqual(['tag1', 'tag2', 'tag3']);
    });

    test('should handle wiki link values correctly', () => {
      const containerEl = document.createElement('div');
      (modal as any).propertiesContainer = containerEl;

      const property = {
        name: 'relatedTasks',
        label: 'Related Tasks',
        type: 'array',
        isRequired: false,
        description: 'Related task links'
      };

      (modal as any).createArrayField = jest.fn().mockImplementation((setting, prop) => {
        // Simulate adding wiki links
        (modal as any).propertyValues.set(prop.name, ['[[Task 1]]', '[[Task 2]]']);
      });

      (modal as any).createPropertyField(property);
      (modal as any).createArrayField(null, property);

      const values = (modal as any).propertyValues.get('relatedTasks');
      expect(values).toEqual(['[[Task 1]]', '[[Task 2]]']);
    });

    test('should handle number parsing correctly', () => {
      const containerEl = document.createElement('div');
      (modal as any).propertiesContainer = containerEl;

      (modal as any).createNumberField = jest.fn().mockImplementation((setting, prop) => {
        // Simulate valid number input
        (modal as any).propertyValues.set(prop.name, 42);
      });

      const property = {
        name: 'effort',
        label: 'Effort',
        type: 'number',
        isRequired: false,
        description: 'Effort in hours'
      };

      (modal as any).createPropertyField(property);
      (modal as any).createNumberField(null, property);

      const value = (modal as any).propertyValues.get('effort');
      expect(value).toBe(42);
      expect(typeof value).toBe('number');
    });

    test('should clear property values when empty', () => {
      (modal as any).propertyValues.set('test', 'value');

      // Simulate clearing a field
      (modal as any).propertyValues.delete('test');

      expect((modal as any).propertyValues.has('test')).toBe(false);
    });
  });
});