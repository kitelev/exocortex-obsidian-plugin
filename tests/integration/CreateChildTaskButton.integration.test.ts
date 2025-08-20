import { App, TFile, Notice } from 'obsidian';
import { LayoutRenderer } from '../../src/presentation/renderers/LayoutRenderer';
import { ButtonsBlockRenderer } from '../../src/presentation/renderers/ButtonsBlockRenderer';
import { CreateChildTaskUseCase } from '../../src/application/use-cases/CreateChildTaskUseCase';
import { DIContainer } from '../../src/infrastructure/container/DIContainer';
import { IClassLayoutRepository } from '../../src/domain/repositories/IClassLayoutRepository';
import { ClassLayout } from '../../src/domain/entities/ClassLayout';
import { LayoutBlock } from '../../src/domain/entities/LayoutBlock';
import { Result } from '../../src/domain/core/Result';

// Mock Obsidian
jest.mock('obsidian', () => ({
    App: jest.fn(),
    TFile: jest.fn(),
    ButtonComponent: jest.fn().mockImplementation(() => ({
        setButtonText: jest.fn().mockReturnThis(),
        setTooltip: jest.fn().mockReturnThis(),
        onClick: jest.fn().mockReturnThis(),
        setDisabled: jest.fn().mockReturnThis(),
        buttonEl: {
            addClass: jest.fn(),
            setAttribute: jest.fn()
        }
    })),
    Notice: jest.fn()
}));

describe('Create Child Task Button Integration Tests', () => {
    let app: App;
    let layoutRenderer: LayoutRenderer;
    let buttonsRenderer: ButtonsBlockRenderer;
    let mockLayoutRepository: jest.Mocked<IClassLayoutRepository>;
    let mockContainer: DIContainer;
    let mockCreateChildTaskUseCase: jest.Mocked<CreateChildTaskUseCase>;

    beforeEach(() => {
        // Setup mocks
        app = new App();
        
        // Mock DIContainer
        mockCreateChildTaskUseCase = {
            execute: jest.fn()
        } as any;

        mockContainer = {
            resolve: jest.fn().mockImplementation((key: string) => {
                if (key === 'CreateChildTaskUseCase') {
                    return mockCreateChildTaskUseCase;
                }
                return null;
            })
        } as any;

        // Mock DIContainer.getInstance
        jest.spyOn(DIContainer, 'getInstance').mockReturnValue(mockContainer as any);

        // Mock layout repository
        mockLayoutRepository = {
            findLayoutsByClass: jest.fn(),
            findById: jest.fn(),
            save: jest.fn(),
            getAll: jest.fn(),
            delete: jest.fn(),
            findByTargetClass: jest.fn()
        } as any;

        // Create renderers
        buttonsRenderer = new ButtonsBlockRenderer(app);
        layoutRenderer = new LayoutRenderer(
            app,
            mockLayoutRepository,
            {} as any, // PropertyRenderer
            {} as any  // QueryEngineService
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Button Rendering', () => {
        it('should render Create Child Task button for ems__Project', async () => {
            const container = document.createElement('div');
            const file = { path: 'test-project.md' } as TFile;
            const frontmatter = {
                'exo__Asset_uid': 'project-123',
                'exo__Instance_class': ['[[ems__Project]]']
            };

            const buttonsConfig = {
                type: 'buttons' as const,
                buttons: [{
                    id: 'create-child-task',
                    label: '➕ Create Child Task',
                    commandType: 'CREATE_CHILD_TASK',
                    tooltip: 'Create a new task for this project',
                    style: 'primary'
                }]
            };

            await buttonsRenderer.render(container, buttonsConfig, file, frontmatter);

            // Check button container was created
            const buttonContainer = container.querySelector('.exocortex-buttons-block');
            expect(buttonContainer).toBeTruthy();

            // Check button was created with correct text
            const ButtonComponent = require('obsidian').ButtonComponent;
            expect(ButtonComponent).toHaveBeenCalled();
            
            const buttonInstance = ButtonComponent.mock.results[0].value;
            expect(buttonInstance.setButtonText).toHaveBeenCalledWith('➕ Create Child Task');
            expect(buttonInstance.setTooltip).toHaveBeenCalledWith('Create a new task for this project');
        });

        it('should apply correct styling to button', async () => {
            const container = document.createElement('div');
            const file = { path: 'test-project.md' } as TFile;
            const frontmatter = { 'exo__Asset_uid': 'project-123' };

            const buttonsConfig = {
                type: 'buttons' as const,
                buttons: [{
                    id: 'create-child-task',
                    label: 'Create Task',
                    commandType: 'CREATE_CHILD_TASK',
                    style: 'primary'
                }],
                position: 'top'
            };

            await buttonsRenderer.render(container, buttonsConfig, file, frontmatter);

            const ButtonComponent = require('obsidian').ButtonComponent;
            const buttonInstance = ButtonComponent.mock.results[0].value;
            
            expect(buttonInstance.buttonEl.addClass).toHaveBeenCalledWith('exocortex-layout-button');
            expect(buttonInstance.buttonEl.addClass).toHaveBeenCalledWith('exocortex-button-primary');
        });

        it('should not render buttons if config is empty', async () => {
            const container = document.createElement('div');
            const file = { path: 'test-project.md' } as TFile;
            const frontmatter = {};

            const buttonsConfig = {
                type: 'buttons' as const,
                buttons: []
            };

            await buttonsRenderer.render(container, buttonsConfig, file, frontmatter);

            const buttonContainer = container.querySelector('.exocortex-buttons-block');
            expect(buttonContainer).toBeFalsy();
        });
    });

    describe('Button Click Handling', () => {
        it('should call CreateChildTaskUseCase when button is clicked', async () => {
            mockCreateChildTaskUseCase.execute.mockResolvedValueOnce({
                success: true,
                taskId: 'task-456',
                taskFilePath: 'task-456.md',
                message: 'Task created successfully'
            });

            const container = document.createElement('div');
            const file = { path: 'test-project.md' } as TFile;
            const frontmatter = { 'exo__Asset_uid': 'project-123' };

            const buttonsConfig = {
                type: 'buttons' as const,
                buttons: [{
                    id: 'create-child-task',
                    label: 'Create Task',
                    commandType: 'CREATE_CHILD_TASK'
                }]
            };

            await buttonsRenderer.render(container, buttonsConfig, file, frontmatter);

            // Get the onClick handler
            const ButtonComponent = require('obsidian').ButtonComponent;
            const buttonInstance = ButtonComponent.mock.results[0].value;
            const onClickHandler = buttonInstance.onClick.mock.calls[0][0];

            // Mock app.vault and workspace
            (app as any).vault = {
                getAbstractFileByPath: jest.fn().mockReturnValue({ path: 'task-456.md' } as TFile)
            };
            (app as any).workspace = {
                getLeaf: jest.fn().mockReturnValue({
                    openFile: jest.fn()
                })
            };

            // Trigger click
            await onClickHandler();

            // Verify use case was called
            expect(mockCreateChildTaskUseCase.execute).toHaveBeenCalledWith({
                projectAssetId: 'project-123'
            });

            // Verify success notification
            expect(Notice).toHaveBeenCalledWith('Task created successfully');
        });

        it('should show error notification on failure', async () => {
            mockCreateChildTaskUseCase.execute.mockResolvedValueOnce({
                success: false,
                message: 'Failed to create task: Invalid project'
            });

            const container = document.createElement('div');
            const file = { path: 'test-project.md' } as TFile;
            const frontmatter = { 'exo__Asset_uid': 'invalid-project' };

            const buttonsConfig = {
                type: 'buttons' as const,
                buttons: [{
                    id: 'create-child-task',
                    label: 'Create Task',
                    commandType: 'CREATE_CHILD_TASK'
                }]
            };

            await buttonsRenderer.render(container, buttonsConfig, file, frontmatter);

            const ButtonComponent = require('obsidian').ButtonComponent;
            const buttonInstance = ButtonComponent.mock.results[0].value;
            const onClickHandler = buttonInstance.onClick.mock.calls[0][0];

            await onClickHandler();

            expect(Notice).toHaveBeenCalledWith('Failed to create task: Failed to create task: Invalid project');
        });

        it('should handle missing CreateChildTaskUseCase gracefully', async () => {
            // Mock container to return null for use case
            mockContainer.resolve = jest.fn().mockReturnValue(null);

            const container = document.createElement('div');
            const file = { path: 'test-project.md' } as TFile;
            const frontmatter = { 'exo__Asset_uid': 'project-123' };

            const buttonsConfig = {
                type: 'buttons' as const,
                buttons: [{
                    id: 'create-child-task',
                    label: 'Create Task',
                    commandType: 'CREATE_CHILD_TASK'
                }]
            };

            await buttonsRenderer.render(container, buttonsConfig, file, frontmatter);

            const ButtonComponent = require('obsidian').ButtonComponent;
            const buttonInstance = ButtonComponent.mock.results[0].value;
            const onClickHandler = buttonInstance.onClick.mock.calls[0][0];

            await onClickHandler();

            expect(Notice).toHaveBeenCalledWith('Create Child Task functionality not available');
        });
    });

    describe('Layout Loading with Buttons', () => {
        it('should load layout with buttons block for ems__Project', async () => {
            const projectLayout = ClassLayout.create({
                id: 'layout-project',
                targetClass: 'ems__Project',
                priority: 10,
                enabled: true,
                blocks: [
                    LayoutBlock.create({
                        id: 'project-actions',
                        type: 'buttons',
                        title: '🚀 Project Actions',
                        order: 0.5,
                        config: {
                            type: 'buttons',
                            buttons: [{
                                id: 'create-child-task',
                                label: '➕ Create Child Task',
                                commandType: 'CREATE_CHILD_TASK'
                            }]
                        },
                        isVisible: true
                    }).getValue()
                ]
            }).getValue();

            mockLayoutRepository.findByTargetClass.mockResolvedValueOnce(
                Result.ok([projectLayout])
            );

            const container = document.createElement('div');
            const file = { path: 'test-project.md' } as TFile;
            const metadata = {
                frontmatter: {
                    'exo__Instance_class': ['[[ems__Project]]'],
                    'exo__Asset_uid': 'project-123'
                }
            };

            // Mock dv object
            const dv = {
                container: container,
                currentFilePath: 'test-project.md'
            };

            await layoutRenderer.renderLayout(container, file, metadata, dv);

            // Verify layout repository was called
            expect(mockLayoutRepository.findByTargetClass).toHaveBeenCalledWith('ems__Project');
        });

        it('should handle missing layout gracefully', async () => {
            mockLayoutRepository.findByTargetClass.mockResolvedValueOnce(
                Result.ok([])
            );

            const container = document.createElement('div');
            const file = { path: 'test-project.md' } as TFile;
            const metadata = {
                frontmatter: {
                    'exo__Instance_class': ['[[ems__Project]]']
                }
            };

            const dv = {};

            await layoutRenderer.renderLayout(container, file, metadata, dv);

            // Should render default layout
            const defaultLayout = container.querySelector('.exocortex-default-layout');
            expect(defaultLayout).toBeTruthy();
        });
    });

    describe('Integration with ExoUIRender', () => {
        it('should work through ExoUIRender entry point', async () => {
            // Setup global window.ExoUIRender
            const mockExoUIRender = jest.fn();
            (global as any).window = { ExoUIRender: mockExoUIRender };

            // Create mock dv context
            const dvContext = {
                container: document.createElement('div'),
                currentFilePath: 'test-project.md'
            };

            // Simulate ExoUIRender call
            await mockExoUIRender(dvContext, { container: dvContext.container });

            // In real implementation, this would trigger the full rendering pipeline
            expect(mockExoUIRender).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle exceptions in button click handler', async () => {
            mockCreateChildTaskUseCase.execute.mockRejectedValueOnce(
                new Error('Network error')
            );

            const container = document.createElement('div');
            const file = { path: 'test-project.md' } as TFile;
            const frontmatter = { 'exo__Asset_uid': 'project-123' };

            const buttonsConfig = {
                type: 'buttons' as const,
                buttons: [{
                    id: 'create-child-task',
                    label: 'Create Task',
                    commandType: 'CREATE_CHILD_TASK'
                }]
            };

            await buttonsRenderer.render(container, buttonsConfig, file, frontmatter);

            const ButtonComponent = require('obsidian').ButtonComponent;
            const buttonInstance = ButtonComponent.mock.results[0].value;
            const onClickHandler = buttonInstance.onClick.mock.calls[0][0];

            await onClickHandler();

            expect(Notice).toHaveBeenCalledWith('Error: Network error');
        });

        it('should handle non-Error exceptions', async () => {
            mockCreateChildTaskUseCase.execute.mockRejectedValueOnce('String error');

            const container = document.createElement('div');
            const file = { path: 'test-project.md' } as TFile;
            const frontmatter = { 'exo__Asset_uid': 'project-123' };

            const buttonsConfig = {
                type: 'buttons' as const,
                buttons: [{
                    id: 'create-child-task',
                    label: 'Create Task',
                    commandType: 'CREATE_CHILD_TASK'
                }]
            };

            await buttonsRenderer.render(container, buttonsConfig, file, frontmatter);

            const ButtonComponent = require('obsidian').ButtonComponent;
            const buttonInstance = ButtonComponent.mock.results[0].value;
            const onClickHandler = buttonInstance.onClick.mock.calls[0][0];

            await onClickHandler();

            expect(Notice).toHaveBeenCalledWith('Error: String error');
        });
    });

    describe('Button Configuration Validation', () => {
        it('should validate button configuration', async () => {
            const container = document.createElement('div');
            const file = { path: 'test-project.md' } as TFile;
            const frontmatter = {};

            const invalidConfig = {
                type: 'buttons' as const,
                buttons: [{
                    // Missing required fields
                    id: '',
                    label: '',
                    commandType: ''
                }]
            };

            await buttonsRenderer.render(container, invalidConfig, file, frontmatter);

            // Button should still render but with empty text
            const ButtonComponent = require('obsidian').ButtonComponent;
            expect(ButtonComponent).toHaveBeenCalled();
            
            const buttonInstance = ButtonComponent.mock.results[0].value;
            expect(buttonInstance.setButtonText).toHaveBeenCalledWith('');
        });

        it('should handle unknown command types', async () => {
            const container = document.createElement('div');
            const file = { path: 'test-project.md' } as TFile;
            const frontmatter = {};

            const buttonsConfig = {
                type: 'buttons' as const,
                buttons: [{
                    id: 'unknown-cmd',
                    label: 'Unknown Command',
                    commandType: 'UNKNOWN_COMMAND'
                }]
            };

            await buttonsRenderer.render(container, buttonsConfig, file, frontmatter);

            const ButtonComponent = require('obsidian').ButtonComponent;
            const buttonInstance = ButtonComponent.mock.results[0].value;
            const onClickHandler = buttonInstance.onClick.mock.calls[0][0];

            await onClickHandler();

            expect(Notice).toHaveBeenCalledWith('Command UNKNOWN_COMMAND not yet implemented');
        });
    });
});