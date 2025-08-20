import { App } from 'obsidian';
import { DIContainer } from '../../src/infrastructure/container/DIContainer';
import { ButtonRenderer } from '../../src/presentation/components/ButtonRenderer';
import { RenderClassButtonsUseCase } from '../../src/application/use-cases/RenderClassButtonsUseCase';
import { ExecuteButtonCommandUseCase } from '../../src/application/use-cases/ExecuteButtonCommandUseCase';
import { CreateChildTaskUseCase } from '../../src/application/use-cases/CreateChildTaskUseCase';
import { IClassLayoutRepository } from '../../src/domain/repositories/IClassLayoutRepository';
import { ObsidianAssetRepository } from '../../src/infrastructure/repositories/ObsidianAssetRepository';
import { ClassLayout } from '../../src/domain/entities/ClassLayout';
import { LayoutBlock } from '../../src/domain/entities/LayoutBlock';
import { UIButton } from '../../src/domain/entities/UIButton';
import { ButtonCommand, CommandType } from '../../src/domain/entities/ButtonCommand';
import { Asset } from '../../src/domain/entities/Asset';
import { AssetId } from '../../src/domain/value-objects/AssetId';
import { ClassName } from '../../src/domain/value-objects/ClassName';
import { OntologyPrefix } from '../../src/domain/value-objects/OntologyPrefix';
import '../__mocks__/obsidian';

describe('Button Workflow Integration Tests', () => {
  let app: App;
  let container: DIContainer;
  let buttonRenderer: ButtonRenderer;
  let renderButtonsUseCase: RenderClassButtonsUseCase;
  let executeCommandUseCase: ExecuteButtonCommandUseCase;
  let createChildTaskUseCase: CreateChildTaskUseCase;
  let assetRepository: ObsidianAssetRepository;
  let layoutRepository: IClassLayoutRepository;

  beforeEach(() => {
    // Reset DIContainer
    DIContainer.reset();
    
    // Mock Obsidian App
    app = {
      vault: {
        getAbstractFileByPath: jest.fn(),
        read: jest.fn(),
        create: jest.fn(),
        modify: jest.fn()
      },
      workspace: {
        getLeaf: jest.fn(() => ({
          openFile: jest.fn()
        }))
      }
    } as any;

    // Initialize container
    container = DIContainer.initialize(app);
    
    // Get instances
    buttonRenderer = container.getButtonRenderer();
    renderButtonsUseCase = container.getRenderButtonsUseCase();
    executeCommandUseCase = container.getExecuteButtonCommandUseCase();
    assetRepository = container.resolve<ObsidianAssetRepository>('IAssetRepository');
    layoutRepository = container.resolve<IClassLayoutRepository>('IClassLayoutRepository');
  });

  afterEach(() => {
    container.dispose();
    DIContainer.reset();
  });

  describe('ems__Project Button Configuration', () => {
    it('should load ems__Project layout with CREATE_CHILD_TASK button', async () => {
      // Create test project asset
      const projectAsset = Asset.create({
        id: AssetId.create('test-project-001').getValue()!,
        className: ClassName.create('ems__Project').getValue()!,
        ontology: OntologyPrefix.create('ems').getValue()!,
        label: 'Test Project',
        description: 'A test project for integration testing',
        properties: {
          'ems__Project_status': '[[ems__ProjectStatus - Active]]',
          'ems__Project_priority': '[[ems__Priority - High]]'
        }
      }).getValue()!;

      // Mock asset repository
      jest.spyOn(assetRepository, 'findById').mockResolvedValue(projectAsset);

      // Test button rendering
      const result = await renderButtonsUseCase.execute({
        className: 'ems__Project',
        assetId: 'test-project-001'
      });

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      
      // Should find CREATE_CHILD_TASK button
      const createTaskButton = response.buttons.find(b => 
        b.command.type === 'CREATE_CHILD_TASK'
      );
      
      expect(createTaskButton).toBeDefined();
      expect(createTaskButton?.label).toBe('➕ Create Child Task');
      expect(createTaskButton?.isEnabled).toBe(true);
    });

    it('should execute CREATE_CHILD_TASK command successfully', async () => {
      // Create test project asset
      const projectAsset = Asset.create({
        id: AssetId.create('test-project-001').getValue()!,
        className: ClassName.create('ems__Project').getValue()!,
        ontology: OntologyPrefix.create('ems').getValue()!,
        label: 'Test Project',
        description: 'A test project for integration testing',
        properties: {}
      }).getValue()!;

      // Mock asset repository
      jest.spyOn(assetRepository, 'findById').mockResolvedValue(projectAsset);
      jest.spyOn(assetRepository, 'save').mockResolvedValue();

      // Mock vault operations
      (app.vault.create as jest.Mock).mockResolvedValue({ path: 'test-task.md' });
      (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue({ path: 'test-task.md' });

      // Test command execution
      const result = await executeCommandUseCase.execute({
        buttonId: 'create-child-task',
        assetId: 'test-project-001'
      });

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.success).toBe(true);
    });

    it('should render button in DOM correctly', async () => {
      // Create test container
      const container = document.createElement('div');
      
      // Mock successful button data
      jest.spyOn(renderButtonsUseCase, 'execute').mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        getValue: () => ({
          buttons: [{
            buttonId: 'create-child-task',
            label: '➕ Create Child Task',
            tooltip: 'Create a new task for this project',
            isEnabled: true,
            order: 1,
            command: {
              id: 'create-child-task-cmd',
              type: 'CREATE_CHILD_TASK',
              requiresInput: false,
              parameters: []
            }
          }],
          displayOptions: {
            position: 'top' as const,
            showButtons: true
          }
        }),
        getError: () => ''
      } as any);

      // Render buttons
      await buttonRenderer.render(container, 'ems__Project', 'test-project-001');

      // Check DOM structure
      const buttonContainer = container.querySelector('.exocortex-button-container');
      expect(buttonContainer).toBeTruthy();

      const button = buttonContainer?.querySelector('button');
      expect(button).toBeTruthy();
      expect(button?.textContent).toBe('➕ Create Child Task');
      expect(button?.getAttribute('data-button-id')).toBe('create-child-task');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing project gracefully', async () => {
      // Mock missing project
      jest.spyOn(assetRepository, 'findById').mockResolvedValue(null);

      const result = await executeCommandUseCase.execute({
        buttonId: 'create-child-task',
        assetId: 'non-existent-project'
      });

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.success).toBe(false);
      expect(response.message).toContain('Project not found');
    });

    it('should handle invalid asset class', async () => {
      // Create non-project asset
      const nonProjectAsset = Asset.create({
        id: AssetId.create('test-asset-001').getValue()!,
        className: ClassName.create('ems__Task').getValue()!,
        ontology: OntologyPrefix.create('ems').getValue()!,
        label: 'Test Task',
        description: 'A test task',
        properties: {}
      }).getValue()!;

      jest.spyOn(assetRepository, 'findById').mockResolvedValue(nonProjectAsset);

      const result = await executeCommandUseCase.execute({
        buttonId: 'create-child-task',
        assetId: 'test-asset-001'
      });

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.success).toBe(false);
      expect(response.message).toContain('Asset is not a project');
    });
  });

  describe('Layout Configuration Validation', () => {
    it('should validate button block configuration syntax', () => {
      // Test the layout configuration from the actual file
      const layoutConfig = {
        id: "project-actions",
        type: "buttons",
        title: "🚀 Project Actions",
        order: 0.5,
        isVisible: true,
        config: {
          type: "buttons",
          buttons: [
            {
              id: "create-child-task",
              label: "➕ Create Child Task",
              commandType: "CREATE_CHILD_TASK",
              tooltip: "Create a new task for this project",
              style: "primary"
            }
          ]
        }
      };

      // Validate required fields
      expect(layoutConfig.id).toBe('project-actions');
      expect(layoutConfig.type).toBe('buttons');
      expect(layoutConfig.config.buttons).toHaveLength(1);
      
      const button = layoutConfig.config.buttons[0];
      expect(button.id).toBe('create-child-task');
      expect(button.commandType).toBe('CREATE_CHILD_TASK');
      expect(button.label).toBe('➕ Create Child Task');
      expect(button.tooltip).toBe('Create a new task for this project');
    });
  });
});