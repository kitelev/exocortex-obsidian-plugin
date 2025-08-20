import { CreateChildTaskUseCase } from '../../../../src/application/use-cases/CreateChildTaskUseCase';
import { CreateAssetUseCase } from '../../../../src/application/use-cases/CreateAssetUseCase';
import { IAssetRepository } from '../../../../src/domain/repositories/IAssetRepository';
import { Asset } from '../../../../src/domain/entities/Asset';
import { AssetId } from '../../../../src/domain/value-objects/AssetId';
import { ClassName } from '../../../../src/domain/value-objects/ClassName';
import { OntologyPrefix } from '../../../../src/domain/value-objects/OntologyPrefix';
import { Result } from '../../../../src/domain/core/Result';

describe('CreateChildTaskUseCase', () => {
    let useCase: CreateChildTaskUseCase;
    let mockAssetRepository: jest.Mocked<IAssetRepository>;
    let mockCreateAssetUseCase: jest.Mocked<CreateAssetUseCase>;
    let projectAsset: Asset;

    beforeEach(() => {
        mockAssetRepository = {
            findById: jest.fn(),
            save: jest.fn(),
            findByClass: jest.fn(),
            updateFrontmatter: jest.fn(),
            deleteAsset: jest.fn()
        } as any;

        mockCreateAssetUseCase = {
            execute: jest.fn()
        } as any;

        const projectId = AssetId.create('test-project').getValue();
        const className = ClassName.create('ems__Project').getValue();
        const ontology = OntologyPrefix.create('ems').getValue();

        projectAsset = Asset.create({
            id: projectId,
            label: 'Test Project',
            className: className,
            ontology: ontology,
            properties: {}
        }).getValue();

        useCase = new CreateChildTaskUseCase(
            mockAssetRepository,
            mockCreateAssetUseCase
        );
    });

    describe('execute', () => {
        it('should create a child task successfully', async () => {
            mockAssetRepository.findById.mockResolvedValueOnce(projectAsset);
            mockCreateAssetUseCase.execute.mockResolvedValueOnce({
                success: true,
                assetId: 'task-123',
                message: 'Task created'
            });

            const result = await useCase.execute({
                projectAssetId: 'test-project'
            });

            expect(result.success).toBe(true);
            expect(result.taskId).toBe('task-123');
            expect(result.message).toContain('Task created successfully');
            expect(mockAssetRepository.findById).toHaveBeenCalledWith(expect.any(AssetId));
            expect(mockCreateAssetUseCase.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    className: 'ems__Task',
                    ontologyPrefix: 'ems',
                    properties: expect.objectContaining({
                        'exo__Effort_parent': '[[Test Project]]',
                        'exo__Instance_class': ['[[ems__Task]]'],
                        'ems__Task_project': '[[Test Project]]'
                    })
                })
            );
        });

        it('should fail if project ID is invalid', async () => {
            const result = await useCase.execute({
                projectAssetId: ''
            });

            expect(result.success).toBe(false);
            expect(result.message).toContain('Invalid project ID');
            expect(mockAssetRepository.findById).not.toHaveBeenCalled();
        });

        it('should fail if project not found', async () => {
            mockAssetRepository.findById.mockResolvedValueOnce(null);

            const result = await useCase.execute({
                projectAssetId: 'test-project'
            });

            expect(result.success).toBe(false);
            expect(result.message).toBe('Project not found');
        });

        it('should fail if asset is not a project', async () => {
            const nonProjectAsset = Asset.create({
                id: AssetId.create('test-asset').getValue(),
                label: 'Test Asset',
                className: ClassName.create('ems__Task').getValue(),
                ontology: OntologyPrefix.create('ems').getValue(),
                properties: {}
            }).getValue();

            mockAssetRepository.findById.mockResolvedValueOnce(nonProjectAsset);

            const result = await useCase.execute({
                projectAssetId: 'test-asset'
            });

            expect(result.success).toBe(false);
            expect(result.message).toBe('Asset is not a project');
        });

        it('should handle CreateAssetUseCase failure', async () => {
            mockAssetRepository.findById.mockResolvedValueOnce(projectAsset);
            mockCreateAssetUseCase.execute.mockResolvedValueOnce({
                success: false,
                assetId: '',
                message: 'Failed to create asset'
            });

            const result = await useCase.execute({
                projectAssetId: 'test-project'
            });

            expect(result.success).toBe(false);
            expect(result.message).toBe('Failed to create asset');
        });

        it('should generate correct task properties', async () => {
            mockAssetRepository.findById.mockResolvedValueOnce(projectAsset);
            mockCreateAssetUseCase.execute.mockResolvedValueOnce({
                success: true,
                assetId: 'task-456',
                message: 'Task created'
            });

            await useCase.execute({
                projectAssetId: 'test-project'
            });

            const callArgs = mockCreateAssetUseCase.execute.mock.calls[0][0];
            expect(callArgs.properties).toMatchObject({
                'exo__Asset_uid': expect.any(String),
                'exo__Asset_label': 'Task for Test Project',
                'exo__Asset_isDefinedBy': '[[!ems]]',
                'exo__Instance_class': ['[[ems__Task]]'],
                'exo__Effort_parent': '[[Test Project]]',
                'ems__Task_status': '[[ems__TaskStatus - TODO]]',
                'ems__Task_priority': '[[ems__Priority - Medium]]',
                'ems__Task_project': '[[Test Project]]'
            });
        });

        it('should include context when provided', async () => {
            mockAssetRepository.findById.mockResolvedValueOnce(projectAsset);
            mockCreateAssetUseCase.execute.mockResolvedValueOnce({
                success: true,
                assetId: 'task-789',
                message: 'Task created'
            });

            const result = await useCase.execute({
                projectAssetId: 'test-project',
                context: {
                    activeFile: 'current-view.md',
                    selection: 'selected text'
                }
            });

            expect(result.success).toBe(true);
        });

        it('should handle exceptions gracefully', async () => {
            mockAssetRepository.findById.mockRejectedValueOnce(new Error('Database error'));

            const result = await useCase.execute({
                projectAssetId: 'test-project'
            });

            expect(result.success).toBe(false);
            expect(result.message).toContain('Failed to create task: Database error');
        });
    });
});