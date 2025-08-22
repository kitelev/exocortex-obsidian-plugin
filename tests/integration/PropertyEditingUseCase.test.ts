import { PropertyEditingUseCase } from '../../src/application/use-cases/PropertyEditingUseCase';
import { IAssetRepository } from '../../src/domain/repositories/IAssetRepository';
import { Asset } from '../../src/domain/entities/Asset';
import { AssetId } from '../../src/domain/value-objects/AssetId';
import { ClassName } from '../../src/domain/value-objects/ClassName';
import { OntologyPrefix } from '../../src/domain/value-objects/OntologyPrefix';

describe('PropertyEditingUseCase Integration', () => {
    let useCase: PropertyEditingUseCase;
    let mockRepository: jest.Mocked<IAssetRepository>;
    let mockPlugin: any;

    beforeEach(() => {
        mockRepository = {
            findById: jest.fn(),
            findByFilename: jest.fn(),
            findByClass: jest.fn(),
            findByOntology: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            exists: jest.fn(),
            findAll: jest.fn()
        } as any;

        mockPlugin = {
            findPropertiesForClass: jest.fn(),
            findAssetsByClass: jest.fn()
        };

        useCase = new PropertyEditingUseCase(mockRepository, mockPlugin);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
        // Clear references to prevent memory leaks
        mockRepository = null as any;
        mockPlugin = null as any;
        useCase = null as any;
    });

    describe('execute with different asset identifiers', () => {
        let testAsset: Asset;
        
        beforeEach(() => {
            const assetId = AssetId.generate();
            const className = ClassName.create('TestClass').getValue()!;
            const ontology = OntologyPrefix.create('test').getValue()!;
            
            const assetResult = Asset.create({
                id: assetId,
                label: 'Test Asset',
                className: className,
                ontology: ontology,
                properties: { testProp: 'oldValue' }
            });
            
            if (!assetResult.isSuccess) {
                throw new Error(`Failed to create test asset: ${assetResult.getError()}`);
            }
            
            testAsset = assetResult.getValue()!;
        });

        it('should find asset by UUID and update property', async () => {
            mockRepository.findById.mockResolvedValue(testAsset);
            mockRepository.save.mockResolvedValue(undefined);

            const result = await useCase.execute({
                assetId: testAsset.getId().toString(),
                propertyName: 'testProp',
                value: 'newValue',
                propertyDefinition: {
                    propertyName: 'testProp',
                    label: 'Test Property',
                    range: 'string',
                    isRequired: false
                }
            });

            expect(result.isSuccess).toBe(true);
            expect(mockRepository.findById).toHaveBeenCalled();
            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should fallback to filename when UUID not found', async () => {
            mockRepository.findById.mockResolvedValue(null);
            mockRepository.findByFilename.mockResolvedValue(testAsset);
            mockRepository.save.mockResolvedValue(undefined);
            
            // Mock the updateFrontmatterByPath method for file path handling
            const mockUpdateFrontmatterByPath = jest.fn().mockResolvedValue(undefined);
            (mockRepository as any).updateFrontmatterByPath = mockUpdateFrontmatterByPath;

            const result = await useCase.execute({
                assetId: 'MyAsset.md',
                propertyName: 'testProp',
                value: 'newValue',
                propertyDefinition: {
                    propertyName: 'testProp',
                    label: 'Test Property',
                    range: 'string',
                    isRequired: false
                }
            });

            expect(result.isSuccess).toBe(true);
            // For .md files, it should use the direct path update method
            expect(mockUpdateFrontmatterByPath).toHaveBeenCalledWith('MyAsset.md', {
                testProp: 'newValue'
            });
        });

        it('should handle filename without extension', async () => {
            mockRepository.findById.mockResolvedValue(null);
            mockRepository.findByFilename.mockResolvedValue(testAsset);
            mockRepository.save.mockResolvedValue(undefined);

            const result = await useCase.execute({
                assetId: 'MyAsset',
                propertyName: 'testProp',
                value: 'newValue',
                propertyDefinition: {
                    propertyName: 'testProp',
                    label: 'Test Property',
                    range: 'string',
                    isRequired: false
                }
            });

            expect(result.isSuccess).toBe(true);
            expect(mockRepository.findByFilename).toHaveBeenCalledWith('MyAsset');
        });

        it('should return error when asset not found by any method', async () => {
            mockRepository.findById.mockResolvedValue(null);
            mockRepository.findByFilename.mockResolvedValue(null);

            const result = await useCase.execute({
                assetId: 'NonExistent',
                propertyName: 'testProp',
                value: 'newValue',
                propertyDefinition: {
                    propertyName: 'testProp',
                    label: 'Test Property',
                    range: 'string',
                    isRequired: false
                }
            });

            expect(result.isFailure).toBe(true);
            expect(result.error).toContain('Asset not found');
        });

        it('should handle file paths as identifiers', async () => {
            // Mock the updateFrontmatterByPath method for file path handling
            const mockUpdateFrontmatterByPath = jest.fn().mockResolvedValue(undefined);
            (mockRepository as any).updateFrontmatterByPath = mockUpdateFrontmatterByPath;

            const result = await useCase.execute({
                assetId: 'folder/subfolder/MyAsset.md',
                propertyName: 'testProp',
                value: 'newValue',
                propertyDefinition: {
                    propertyName: 'testProp',
                    label: 'Test Property',
                    range: 'string',
                    isRequired: false
                }
            });

            expect(result.isSuccess).toBe(true);
            // For file paths with slashes, it should use the direct path update method
            expect(mockUpdateFrontmatterByPath).toHaveBeenCalledWith('folder/subfolder/MyAsset.md', {
                testProp: 'newValue'
            });
        });
    });

    describe('property validation', () => {
        const testAsset = Asset.create({
            id: AssetId.generate(),
            label: 'Test Asset',
            className: ClassName.create('TestClass').getValue()!,
            ontology: OntologyPrefix.create('test').getValue()!,
            properties: {}
        }).getValue()!;

        beforeEach(() => {
            mockRepository.findById.mockResolvedValue(testAsset);
            mockRepository.save.mockResolvedValue(undefined);
            // Mock the updateFrontmatterByPath method for property validation tests
            (mockRepository as any).updateFrontmatterByPath = jest.fn().mockResolvedValue(undefined);
        });

        it('should validate required fields', async () => {
            const validUuid = testAsset.getId().toString();
            
            const result = await useCase.execute({
                assetId: validUuid,
                propertyName: 'requiredProp',
                value: '',
                propertyDefinition: {
                    propertyName: 'requiredProp',
                    label: 'Required Property',
                    range: 'string',
                    isRequired: true
                }
            });

            expect(result.isFailure).toBe(true);
            expect(result.error).toContain('Required Property is required');
        });

        it('should allow empty values for optional fields', async () => {
            // Use a valid UUID as assetId and set up proper mocks
            const validUuid = testAsset.getId().toString();
            
            const result = await useCase.execute({
                assetId: validUuid,
                propertyName: 'optionalProp',
                value: '',
                propertyDefinition: {
                    propertyName: 'optionalProp',
                    label: 'Optional Property',
                    range: 'string',
                    isRequired: false
                }
            });

            expect(result.isSuccess).toBe(true);
        });

        it('should validate enum values', async () => {
            const validUuid = testAsset.getId().toString();
            
            const result = await useCase.execute({
                assetId: validUuid,
                propertyName: 'statusProp',
                value: 'invalid',
                propertyDefinition: {
                    propertyName: 'statusProp',
                    label: 'Status',
                    range: 'enum:pending,active,completed',
                    isRequired: true
                }
            });

            expect(result.isFailure).toBe(true);
            expect(result.error).toContain('Status must be one of: pending, active, completed');
        });

        it('should validate date format', async () => {
            const validUuid = testAsset.getId().toString();
            
            const result = await useCase.execute({
                assetId: validUuid,
                propertyName: 'dateProp',
                value: 'not-a-date',
                propertyDefinition: {
                    propertyName: 'dateProp',
                    label: 'Date',
                    range: 'date',
                    isRequired: true
                }
            });

            expect(result.isFailure).toBe(true);
            expect(result.error).toContain('Date must be a valid date');
        });

        it('should validate custom regex patterns', async () => {
            const validUuid = testAsset.getId().toString();
            
            const result = await useCase.execute({
                assetId: validUuid,
                propertyName: 'emailProp',
                value: 'invalid-email',
                propertyDefinition: {
                    propertyName: 'emailProp',
                    label: 'Email',
                    range: 'string',
                    isRequired: true,
                    validation: '^[\\w\\.-]+@[\\w\\.-]+\\.\\w+$'
                }
            });

            expect(result.isFailure).toBe(true);
            expect(result.error).toContain('Email format is invalid');
        });
    });
});