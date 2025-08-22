import { PropertyEditingUseCase, UpdatePropertyRequest, UpdatePropertyResponse } from '../../../../src/application/use-cases/PropertyEditingUseCase';
import { IAssetRepository } from '../../../../src/domain/repositories/IAssetRepository';
import { Asset } from '../../../../src/domain/entities/Asset';
import { AssetId } from '../../../../src/domain/value-objects/AssetId';
import { ClassName } from '../../../../src/domain/value-objects/ClassName';
import { OntologyPrefix } from '../../../../src/domain/value-objects/OntologyPrefix';
import { Result } from '../../../../src/domain/core/Result';

describe('PropertyEditingUseCase', () => {
    let useCase: PropertyEditingUseCase;
    let mockAssetRepository: jest.Mocked<IAssetRepository>;
    let mockPlugin: any;

    beforeEach(() => {
        // Setup mock repository
        mockAssetRepository = {
            save: jest.fn(),
            findById: jest.fn(),
            findByFilename: jest.fn(),
            findAll: jest.fn(),
            delete: jest.fn(),
            exists: jest.fn(),
            updateFrontmatterByPath: jest.fn()
        };

        // Setup mock plugin
        mockPlugin = {
            findPropertiesForClass: jest.fn(),
            findAssetsByClass: jest.fn()
        };

        useCase = new PropertyEditingUseCase(mockAssetRepository, mockPlugin);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
        // Clear references to prevent memory leaks
        mockAssetRepository = null as any;
        mockPlugin = null as any;
        useCase = null as any;
    });

    describe('Basic Functionality', () => {
        test('should create useCase with repository and plugin', () => {
            expect(useCase).toBeDefined();
            expect(useCase.execute).toBeDefined();
        });

        test('should implement UseCase interface', () => {
            expect(typeof useCase.execute).toBe('function');
            expect(typeof useCase.getPropertiesForClass).toBe('function');
            expect(typeof useCase.getAssetsForClass).toBe('function');
        });

        test('should accept valid dependencies in constructor', () => {
            const newUseCase = new PropertyEditingUseCase(mockAssetRepository, mockPlugin);
            expect(newUseCase).toBeInstanceOf(PropertyEditingUseCase);
        });
    });

    describe('Request Validation', () => {
        test('should fail when assetId is missing', async () => {
            const request: UpdatePropertyRequest = {
                assetId: '',
                propertyName: 'test',
                value: 'value',
                propertyDefinition: {
                    propertyName: 'test',
                    label: 'Test',
                    range: 'string',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isFailure).toBe(true);
            expect(result.error).toBe('Asset ID is required');
        });

        test('should fail when propertyName is missing', async () => {
            const request: UpdatePropertyRequest = {
                assetId: 'test-id',
                propertyName: '',
                value: 'value',
                propertyDefinition: {
                    propertyName: 'test',
                    label: 'Test',
                    range: 'string',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isFailure).toBe(true);
            expect(result.error).toBe('Property name is required');
        });

        test('should pass validation with valid request', async () => {
            const request: UpdatePropertyRequest = {
                assetId: 'valid-id.md',
                propertyName: 'test',
                value: 'value',
                propertyDefinition: {
                    propertyName: 'test',
                    label: 'Test',
                    range: 'string',
                    isRequired: false
                }
            };

            mockAssetRepository.updateFrontmatterByPath.mockResolvedValue(undefined);

            const result = await useCase.execute(request);

            expect(result.isSuccess).toBe(true);
        });

        test('should handle null assetId', async () => {
            const request: UpdatePropertyRequest = {
                assetId: null as any,
                propertyName: 'test',
                value: 'value',
                propertyDefinition: {
                    propertyName: 'test',
                    label: 'Test',
                    range: 'string',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isFailure).toBe(true);
            expect(result.error).toBe('Asset ID is required');
        });

        test('should handle null propertyName', async () => {
            const request: UpdatePropertyRequest = {
                assetId: 'test-id',
                propertyName: null as any,
                value: 'value',
                propertyDefinition: {
                    propertyName: 'test',
                    label: 'Test',
                    range: 'string',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isFailure).toBe(true);
            expect(result.error).toBe('Property name is required');
        });
    });

    describe('Property Value Validation', () => {
        test('should validate required properties', async () => {
            const request: UpdatePropertyRequest = {
                assetId: 'test-id',
                propertyName: 'requiredProp',
                value: '',
                propertyDefinition: {
                    propertyName: 'requiredProp',
                    label: 'Required Property',
                    range: 'string',
                    isRequired: true
                }
            };

            const result = await useCase.execute(request);

            expect(result.isFailure).toBe(true);
            expect(result.error).toBe('Required Property is required');
        });

        test('should allow empty values for non-required properties', async () => {
            const request: UpdatePropertyRequest = {
                assetId: 'test-id.md',
                propertyName: 'optionalProp',
                value: '',
                propertyDefinition: {
                    propertyName: 'optionalProp',
                    label: 'Optional Property',
                    range: 'string',
                    isRequired: false
                }
            };

            mockAssetRepository.updateFrontmatterByPath.mockResolvedValue(undefined);

            const result = await useCase.execute(request);

            expect(result.isSuccess).toBe(true);
        });

        test('should validate number properties', async () => {
            const request: UpdatePropertyRequest = {
                assetId: 'test-id.md',
                propertyName: 'numberProp',
                value: 'not-a-number',
                propertyDefinition: {
                    propertyName: 'numberProp',
                    label: 'Number Property',
                    range: 'number',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isFailure).toBe(true);
            expect(result.error).toBe('Number Property must be a number');
        });

        test('should validate valid numbers', async () => {
            const request: UpdatePropertyRequest = {
                assetId: 'test-id.md',
                propertyName: 'numberProp',
                value: '42',
                propertyDefinition: {
                    propertyName: 'numberProp',
                    label: 'Number Property',
                    range: 'number',
                    isRequired: false
                }
            };

            mockAssetRepository.updateFrontmatterByPath.mockResolvedValue(undefined);

            const result = await useCase.execute(request);

            expect(result.isSuccess).toBe(true);
        });

        test('should validate date properties', async () => {
            const request: UpdatePropertyRequest = {
                assetId: 'test-id.md',
                propertyName: 'dateProp',
                value: 'not-a-date',
                propertyDefinition: {
                    propertyName: 'dateProp',
                    label: 'Date Property',
                    range: 'date',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isFailure).toBe(true);
            expect(result.error).toBe('Date Property must be a valid date');
        });

        test('should validate valid dates', async () => {
            const request: UpdatePropertyRequest = {
                assetId: 'test-id.md',
                propertyName: 'dateProp',
                value: '2024-12-31',
                propertyDefinition: {
                    propertyName: 'dateProp',
                    label: 'Date Property',
                    range: 'date',
                    isRequired: false
                }
            };

            mockAssetRepository.updateFrontmatterByPath.mockResolvedValue(undefined);

            const result = await useCase.execute(request);

            expect(result.isSuccess).toBe(true);
        });

        test('should validate boolean properties', async () => {
            const request: UpdatePropertyRequest = {
                assetId: 'test-id.md',
                propertyName: 'boolProp',
                value: 'not-a-boolean',
                propertyDefinition: {
                    propertyName: 'boolProp',
                    label: 'Boolean Property',
                    range: 'boolean',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isFailure).toBe(true);
            expect(result.error).toBe('Boolean Property must be true or false');
        });

        test('should validate valid booleans', async () => {
            const trueRequest: UpdatePropertyRequest = {
                assetId: 'test-id.md',
                propertyName: 'boolProp',
                value: true,
                propertyDefinition: {
                    propertyName: 'boolProp',
                    label: 'Boolean Property',
                    range: 'boolean',
                    isRequired: false
                }
            };

            mockAssetRepository.updateFrontmatterByPath.mockResolvedValue(undefined);

            const trueResult = await useCase.execute(trueRequest);
            expect(trueResult.isSuccess).toBe(true);

            const falseRequest: UpdatePropertyRequest = {
                assetId: 'test-id.md',
                propertyName: 'boolProp',
                value: false,
                propertyDefinition: {
                    propertyName: 'boolProp',
                    label: 'Boolean Property',
                    range: 'boolean',
                    isRequired: false
                }
            };

            const falseResult = await useCase.execute(falseRequest);
            expect(falseResult.isSuccess).toBe(true);
        });

        test('should validate enum properties', async () => {
            const request: UpdatePropertyRequest = {
                assetId: 'test-id.md',
                propertyName: 'enumProp',
                value: 'invalid',
                propertyDefinition: {
                    propertyName: 'enumProp',
                    label: 'Enum Property',
                    range: 'enum:low,medium,high',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isFailure).toBe(true);
            expect(result.error).toBe('Enum Property must be one of: low, medium, high');
        });

        test('should validate valid enum values', async () => {
            const request: UpdatePropertyRequest = {
                assetId: 'test-id.md',
                propertyName: 'enumProp',
                value: 'medium',
                propertyDefinition: {
                    propertyName: 'enumProp',
                    label: 'Enum Property',
                    range: 'enum:low,medium,high',
                    isRequired: false
                }
            };

            mockAssetRepository.updateFrontmatterByPath.mockResolvedValue(undefined);

            const result = await useCase.execute(request);

            expect(result.isSuccess).toBe(true);
        });

        test('should validate with custom regex', async () => {
            const request: UpdatePropertyRequest = {
                assetId: 'test-id.md',
                propertyName: 'regexProp',
                value: 'invalid-format',
                propertyDefinition: {
                    propertyName: 'regexProp',
                    label: 'Regex Property',
                    range: 'string',
                    isRequired: false,
                    validation: '^[A-Z]{3}-\\d{3}$'
                }
            };

            const result = await useCase.execute(request);

            expect(result.isFailure).toBe(true);
            expect(result.error).toBe('Regex Property format is invalid');
        });

        test('should pass custom regex validation', async () => {
            const request: UpdatePropertyRequest = {
                assetId: 'test-id.md',
                propertyName: 'regexProp',
                value: 'ABC-123',
                propertyDefinition: {
                    propertyName: 'regexProp',
                    label: 'Regex Property',
                    range: 'string',
                    isRequired: false,
                    validation: '^[A-Z]{3}-\\d{3}$'
                }
            };

            mockAssetRepository.updateFrontmatterByPath.mockResolvedValue(undefined);

            const result = await useCase.execute(request);

            expect(result.isSuccess).toBe(true);
        });

        test('should handle invalid regex gracefully', async () => {
            const request: UpdatePropertyRequest = {
                assetId: 'test-id.md',
                propertyName: 'regexProp',
                value: 'any-value',
                propertyDefinition: {
                    propertyName: 'regexProp',
                    label: 'Regex Property',
                    range: 'string',
                    isRequired: false,
                    validation: '[invalid-regex'
                }
            };

            mockAssetRepository.updateFrontmatterByPath.mockResolvedValue(undefined);

            const result = await useCase.execute(request);

            expect(result.isSuccess).toBe(true); // Should skip invalid regex validation
        });
    });

    describe('Direct File Path Updates', () => {
        test('should use direct path update for file paths', async () => {
            const request: UpdatePropertyRequest = {
                assetId: 'path/to/file.md',
                propertyName: 'title',
                value: 'New Title',
                propertyDefinition: {
                    propertyName: 'title',
                    label: 'Title',
                    range: 'string',
                    isRequired: false
                }
            };

            mockAssetRepository.updateFrontmatterByPath.mockResolvedValue(undefined);

            const result = await useCase.execute(request);

            expect(result.isSuccess).toBe(true);
            expect(mockAssetRepository.updateFrontmatterByPath).toHaveBeenCalledWith(
                'path/to/file.md',
                { title: 'New Title' }
            );
        });

        test('should handle direct update errors', async () => {
            const request: UpdatePropertyRequest = {
                assetId: 'path/to/file.md',
                propertyName: 'title',
                value: 'New Title',
                propertyDefinition: {
                    propertyName: 'title',
                    label: 'Title',
                    range: 'string',
                    isRequired: false
                }
            };

            mockAssetRepository.updateFrontmatterByPath.mockRejectedValue(new Error('File not found'));

            const result = await useCase.execute(request);

            expect(result.isFailure).toBe(true);
            expect(result.error).toBe('Failed to update property: Error: File not found');
        });

        test('should detect file paths correctly', async () => {
            const filePaths = [
                'file.md',
                'folder/file.md',
                'deep/nested/path/file.md',
                '../relative/path.md',
                './current/path.md'
            ];

            for (const filePath of filePaths) {
                const request: UpdatePropertyRequest = {
                    assetId: filePath,
                    propertyName: 'test',
                    value: 'value',
                    propertyDefinition: {
                        propertyName: 'test',
                        label: 'Test',
                        range: 'string',
                        isRequired: false
                    }
                };

                mockAssetRepository.updateFrontmatterByPath.mockResolvedValue(undefined);

                const result = await useCase.execute(request);

                expect(result.isSuccess).toBe(true);
                expect(mockAssetRepository.updateFrontmatterByPath).toHaveBeenCalledWith(
                    filePath,
                    { test: 'value' }
                );
            }
        });

        test('should fallback to Asset ID lookup when direct update not available', async () => {
            const request: UpdatePropertyRequest = {
                assetId: 'path/to/file.md',
                propertyName: 'title',
                value: 'New Title',
                propertyDefinition: {
                    propertyName: 'title',
                    label: 'Title',
                    range: 'string',
                    isRequired: false
                }
            };

            // Mock repository without updateFrontmatterByPath method
            const repoWithoutDirectUpdate = { ...mockAssetRepository };
            delete (repoWithoutDirectUpdate as any).updateFrontmatterByPath;

            const useCaseWithoutDirectUpdate = new PropertyEditingUseCase(repoWithoutDirectUpdate, mockPlugin);

            // Mock asset creation and retrieval
            const validUUID = '123e4567-e89b-12d3-a456-426614174000';
            const assetIdResult = AssetId.create(validUUID);
            const mockAsset = {
                setProperty: jest.fn().mockReturnValue(Result.ok()),
                getId: jest.fn().mockReturnValue(assetIdResult.getValue())
            } as any;

            repoWithoutDirectUpdate.findByFilename.mockResolvedValue(mockAsset);
            repoWithoutDirectUpdate.save.mockResolvedValue(undefined);

            const result = await useCaseWithoutDirectUpdate.execute(request);

            expect(result.isSuccess).toBe(true);
            expect(repoWithoutDirectUpdate.findByFilename).toHaveBeenCalledWith('path/to/file.md');
            expect(mockAsset.setProperty).toHaveBeenCalledWith('title', 'New Title');
        });
    });

    describe('Asset ID Based Updates', () => {
        test('should update asset by UUID', async () => {
            const validUUID = '123e4567-e89b-12d3-a456-426614174000';
            const assetIdResult = AssetId.create(validUUID);
            const mockAsset = {
                setProperty: jest.fn().mockReturnValue(Result.ok()),
                getId: jest.fn().mockReturnValue(assetIdResult.getValue())
            } as any;

            mockAssetRepository.findById.mockResolvedValue(mockAsset);
            mockAssetRepository.save.mockResolvedValue(undefined);

            const request: UpdatePropertyRequest = {
                assetId: validUUID,
                propertyName: 'title',
                value: 'New Title',
                propertyDefinition: {
                    propertyName: 'title',
                    label: 'Title',
                    range: 'string',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isSuccess).toBe(true);
            expect(mockAssetRepository.findById).toHaveBeenCalled();
            expect(mockAsset.setProperty).toHaveBeenCalledWith('title', 'New Title');
            expect(mockAssetRepository.save).toHaveBeenCalledWith(mockAsset);
        });

        test('should fallback to filename lookup when UUID lookup fails', async () => {
            const validUUID = '123e4567-e89b-12d3-a456-426614174000';
            const assetIdResult = AssetId.create(validUUID);
            const mockAsset = {
                setProperty: jest.fn().mockReturnValue(Result.ok()),
                getId: jest.fn().mockReturnValue(assetIdResult.getValue())
            } as any;

            mockAssetRepository.findById.mockResolvedValue(null);
            mockAssetRepository.findByFilename.mockResolvedValue(mockAsset);
            mockAssetRepository.save.mockResolvedValue(undefined);

            const request: UpdatePropertyRequest = {
                assetId: 'invalid-uuid',
                propertyName: 'title',
                value: 'New Title',
                propertyDefinition: {
                    propertyName: 'title',
                    label: 'Title',
                    range: 'string',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isSuccess).toBe(true);
            expect(mockAssetRepository.findByFilename).toHaveBeenCalledWith('invalid-uuid');
            expect(mockAsset.setProperty).toHaveBeenCalledWith('title', 'New Title');
        });

        test('should fail when asset not found by ID or filename', async () => {
            mockAssetRepository.findById.mockResolvedValue(null);
            mockAssetRepository.findByFilename.mockResolvedValue(null);

            const request: UpdatePropertyRequest = {
                assetId: 'nonexistent',
                propertyName: 'title',
                value: 'New Title',
                propertyDefinition: {
                    propertyName: 'title',
                    label: 'Title',
                    range: 'string',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isFailure).toBe(true);
            expect(result.error).toBe('Asset not found: nonexistent');
        });

        test('should handle repository errors during asset lookup', async () => {
            mockAssetRepository.findById.mockRejectedValue(new Error('Database error'));

            const validUUID = '123e4567-e89b-12d3-a456-426614174000';
            const request: UpdatePropertyRequest = {
                assetId: validUUID,
                propertyName: 'title',
                value: 'New Title',
                propertyDefinition: {
                    propertyName: 'title',
                    label: 'Title',
                    range: 'string',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isFailure).toBe(true);
            expect(result.error).toBe('Failed to update property: Error: Database error');
        });

        test('should handle save errors', async () => {
            const validUUID = '123e4567-e89b-12d3-a456-426614174000';
            const assetIdResult = AssetId.create(validUUID);
            const mockAsset = {
                setProperty: jest.fn().mockReturnValue(Result.ok()),
                getId: jest.fn().mockReturnValue(assetIdResult.getValue())
            } as any;

            mockAssetRepository.findByFilename.mockResolvedValue(mockAsset);
            mockAssetRepository.save.mockRejectedValue(new Error('Save failed'));

            const request: UpdatePropertyRequest = {
                assetId: 'test-asset',
                propertyName: 'title',
                value: 'New Title',
                propertyDefinition: {
                    propertyName: 'title',
                    label: 'Title',
                    range: 'string',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isFailure).toBe(true);
            expect(result.error).toBe('Failed to update property: Error: Save failed');
        });
    });

    describe('Property Value Types', () => {
        beforeEach(() => {
            mockAssetRepository.updateFrontmatterByPath.mockResolvedValue(undefined);
        });

        test('should handle string values', async () => {
            const request: UpdatePropertyRequest = {
                assetId: 'test.md',
                propertyName: 'description',
                value: 'This is a description',
                propertyDefinition: {
                    propertyName: 'description',
                    label: 'Description',
                    range: 'string',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isSuccess).toBe(true);
            expect(result.getValue().updatedValue).toBe('This is a description');
        });

        test('should handle numeric values', async () => {
            const request: UpdatePropertyRequest = {
                assetId: 'test.md',
                propertyName: 'count',
                value: 42,
                propertyDefinition: {
                    propertyName: 'count',
                    label: 'Count',
                    range: 'number',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isSuccess).toBe(true);
            expect(result.getValue().updatedValue).toBe(42);
        });

        test('should handle boolean values', async () => {
            const request: UpdatePropertyRequest = {
                assetId: 'test.md',
                propertyName: 'active',
                value: true,
                propertyDefinition: {
                    propertyName: 'active',
                    label: 'Active',
                    range: 'boolean',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isSuccess).toBe(true);
            expect(result.getValue().updatedValue).toBe(true);
        });

        test('should handle array values', async () => {
            const arrayValue = ['item1', 'item2', 'item3'];
            const request: UpdatePropertyRequest = {
                assetId: 'test.md',
                propertyName: 'tags',
                value: arrayValue,
                propertyDefinition: {
                    propertyName: 'tags',
                    label: 'Tags',
                    range: 'array',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isSuccess).toBe(true);
            expect(result.getValue().updatedValue).toEqual(arrayValue);
        });

        test('should handle object values', async () => {
            const objectValue = { nested: 'value', count: 5 };
            const request: UpdatePropertyRequest = {
                assetId: 'test.md',
                propertyName: 'metadata',
                value: objectValue,
                propertyDefinition: {
                    propertyName: 'metadata',
                    label: 'Metadata',
                    range: 'object',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isSuccess).toBe(true);
            expect(result.getValue().updatedValue).toEqual(objectValue);
        });

        test('should handle null values for non-required properties', async () => {
            const request: UpdatePropertyRequest = {
                assetId: 'test.md',
                propertyName: 'optional',
                value: null,
                propertyDefinition: {
                    propertyName: 'optional',
                    label: 'Optional',
                    range: 'string',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isSuccess).toBe(true);
            expect(result.getValue().updatedValue).toBeNull();
        });

        test('should handle undefined values for non-required properties', async () => {
            const request: UpdatePropertyRequest = {
                assetId: 'test.md',
                propertyName: 'optional',
                value: undefined,
                propertyDefinition: {
                    propertyName: 'optional',
                    label: 'Optional',
                    range: 'string',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isSuccess).toBe(true);
            expect(result.getValue().updatedValue).toBeUndefined();
        });
    });

    describe('Plugin Integration', () => {
        test('should get properties for class through plugin', async () => {
            const mockProperties = [
                {
                    name: 'title',
                    label: 'Title',
                    range: 'string',
                    isRequired: true
                },
                {
                    name: 'description',
                    label: 'Description',
                    range: 'text',
                    isRequired: false
                }
            ];

            mockPlugin.findPropertiesForClass.mockResolvedValue(mockProperties);

            const result = await useCase.getPropertiesForClass('exo__Task');

            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual(mockProperties);
            expect(mockPlugin.findPropertiesForClass).toHaveBeenCalledWith('exo__Task');
        });

        test('should handle plugin errors when getting properties', async () => {
            mockPlugin.findPropertiesForClass.mockRejectedValue(new Error('Plugin error'));

            const result = await useCase.getPropertiesForClass('exo__Task');

            expect(result.isFailure).toBe(true);
            expect(result.error).toBe('Failed to get properties: Plugin error');
        });

        test('should get assets for class through plugin', async () => {
            const mockAssets = [
                { id: '1', title: 'Asset 1' },
                { id: '2', title: 'Asset 2' }
            ];

            mockPlugin.findAssetsByClass.mockResolvedValue(mockAssets);

            const result = await useCase.getAssetsForClass('exo__Task');

            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual(mockAssets);
            expect(mockPlugin.findAssetsByClass).toHaveBeenCalledWith('exo__Task', true);
        });

        test('should handle plugin errors when getting assets', async () => {
            mockPlugin.findAssetsByClass.mockRejectedValue(new Error('Plugin error'));

            const result = await useCase.getAssetsForClass('exo__Task');

            expect(result.isFailure).toBe(true);
            expect(result.error).toBe('Failed to get assets: Plugin error');
        });

        test('should pass correct parameters to plugin methods', async () => {
            mockPlugin.findPropertiesForClass.mockResolvedValue([]);
            mockPlugin.findAssetsByClass.mockResolvedValue([]);

            await useCase.getPropertiesForClass('custom__Class');
            await useCase.getAssetsForClass('custom__Class');

            expect(mockPlugin.findPropertiesForClass).toHaveBeenCalledWith('custom__Class');
            expect(mockPlugin.findAssetsByClass).toHaveBeenCalledWith('custom__Class', true);
        });
    });

    describe('Response Structure', () => {
        test('should return correct success response structure', async () => {
            mockAssetRepository.updateFrontmatterByPath.mockResolvedValue(undefined);

            const request: UpdatePropertyRequest = {
                assetId: 'test.md',
                propertyName: 'title',
                value: 'New Title',
                propertyDefinition: {
                    propertyName: 'title',
                    label: 'Title',
                    range: 'string',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual({
                success: true,
                updatedValue: 'New Title'
            });
        });

        test('should return correct failure response structure', async () => {
            const request: UpdatePropertyRequest = {
                assetId: '',
                propertyName: 'title',
                value: 'New Title',
                propertyDefinition: {
                    propertyName: 'title',
                    label: 'Title',
                    range: 'string',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isFailure).toBe(true);
            expect(result.error).toBe('Asset ID is required');
        });

        test('should preserve original value in success response', async () => {
            mockAssetRepository.updateFrontmatterByPath.mockResolvedValue(undefined);

            const complexValue = {
                nested: {
                    array: [1, 2, 3],
                    string: 'test'
                }
            };

            const request: UpdatePropertyRequest = {
                assetId: 'test.md',
                propertyName: 'metadata',
                value: complexValue,
                propertyDefinition: {
                    propertyName: 'metadata',
                    label: 'Metadata',
                    range: 'object',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isSuccess).toBe(true);
            expect(result.getValue().updatedValue).toEqual(complexValue);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle extremely large property values', async () => {
            mockAssetRepository.updateFrontmatterByPath.mockResolvedValue(undefined);

            // Reduce size for CI memory efficiency
            const largeSize = process.env.CI ? 10000 : 50000;
            const largeValue = 'A'.repeat(largeSize);
            const request: UpdatePropertyRequest = {
                assetId: 'test.md',
                propertyName: 'largeField',
                value: largeValue,
                propertyDefinition: {
                    propertyName: 'largeField',
                    label: 'Large Field',
                    range: 'string',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isSuccess).toBe(true);
            expect(result.getValue().updatedValue).toBe(largeValue);
            
            // Clear large string reference
            request.value = null;
        });

        test('should handle special characters in property names', async () => {
            mockAssetRepository.updateFrontmatterByPath.mockResolvedValue(undefined);

            const specialPropName = 'prop-with-special_chars$123';
            const request: UpdatePropertyRequest = {
                assetId: 'test.md',
                propertyName: specialPropName,
                value: 'test value',
                propertyDefinition: {
                    propertyName: specialPropName,
                    label: 'Special Property',
                    range: 'string',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isSuccess).toBe(true);
        });

        test('should handle circular references in object values', async () => {
            mockAssetRepository.updateFrontmatterByPath.mockResolvedValue(undefined);

            const obj1: any = { name: 'obj1' };
            const obj2: any = { name: 'obj2', ref: obj1 };
            obj1.ref = obj2; // Create circular reference

            const request: UpdatePropertyRequest = {
                assetId: 'test.md',
                propertyName: 'circular',
                value: obj1,
                propertyDefinition: {
                    propertyName: 'circular',
                    label: 'Circular',
                    range: 'object',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isSuccess).toBe(true);
        });

        test('should handle concurrent updates gracefully', async () => {
            mockAssetRepository.updateFrontmatterByPath.mockResolvedValue(undefined);

            const concurrentCount = process.env.CI ? 5 : 10; // Reduce for CI
            const requests = Array(concurrentCount).fill(null).map((_, i) => ({
                assetId: `test${i}.md`,
                propertyName: 'title',
                value: `Title ${i}`,
                propertyDefinition: {
                    propertyName: 'title',
                    label: 'Title',
                    range: 'string',
                    isRequired: false
                }
            }));

            const promises = requests.map(req => useCase.execute(req));
            const results = await Promise.all(promises);

            results.forEach((result, i) => {
                expect(result.isSuccess).toBe(true);
                expect(result.getValue().updatedValue).toBe(`Title ${i}`);
            });
            
            // Clear references
            requests.length = 0;
            promises.length = 0;
            results.length = 0;
        });

        test('should handle timeout scenarios', async () => {
            mockAssetRepository.updateFrontmatterByPath.mockImplementation(
                () => new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 100)
                )
            );

            const request: UpdatePropertyRequest = {
                assetId: 'test.md',
                propertyName: 'title',
                value: 'New Title',
                propertyDefinition: {
                    propertyName: 'title',
                    label: 'Title',
                    range: 'string',
                    isRequired: false
                }
            };

            const result = await useCase.execute(request);

            expect(result.isFailure).toBe(true);
            expect(result.error).toContain('Timeout');
        });

        test('should handle malformed property definitions', async () => {
            mockAssetRepository.updateFrontmatterByPath.mockResolvedValue(undefined);

            const request: UpdatePropertyRequest = {
                assetId: 'test.md',
                propertyName: 'test',
                value: 'value',
                propertyDefinition: {
                    propertyName: 'test',
                    label: null as any,
                    range: undefined as any,
                    isRequired: null as any
                }
            };

            const result = await useCase.execute(request);

            // Should handle gracefully and succeed
            expect(result.isSuccess).toBe(true);
        });
    });

    describe('Performance Tests', () => {
        test('should complete property updates within reasonable time', async () => {
            mockAssetRepository.updateFrontmatterByPath.mockResolvedValue(undefined);

            const startTime = Date.now();

            const request: UpdatePropertyRequest = {
                assetId: 'test.md',
                propertyName: 'title',
                value: 'New Title',
                propertyDefinition: {
                    propertyName: 'title',
                    label: 'Title',
                    range: 'string',
                    isRequired: false
                }
            };

            await useCase.execute(request);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(100); // Should complete within 100ms
        });

        test('should handle batch updates efficiently', async () => {
            mockAssetRepository.updateFrontmatterByPath.mockResolvedValue(undefined);

            const startTime = Date.now();
            const batchSize = process.env.CI ? 10 : 25; // Reduce batch size for CI

            const requests = Array(batchSize).fill(null).map((_, i) => ({
                assetId: `test${i}.md`,
                propertyName: 'title',
                value: `Title ${i}`,
                propertyDefinition: {
                    propertyName: 'title',
                    label: 'Title',
                    range: 'string',
                    isRequired: false
                }
            }));

            const promises = requests.map(req => useCase.execute(req));
            await Promise.all(promises);

            // Clear references
            requests.length = 0;
            promises.length = 0;

            const endTime = Date.now();
            const duration = endTime - startTime;

            const timeoutLimit = process.env.CI ? 2000 : 1000; // More lenient for CI
            expect(duration).toBeLessThan(timeoutLimit);
        });

        test('should not accumulate memory over multiple executions', async () => {
            mockAssetRepository.updateFrontmatterByPath.mockResolvedValue(undefined);

            const initialMemory = process.memoryUsage().heapUsed;
            const requests: UpdatePropertyRequest[] = [];

            // Reduce iterations for CI memory efficiency
            const iterations = process.env.CI ? 10 : 50;
            
            for (let i = 0; i < iterations; i++) {
                const request: UpdatePropertyRequest = {
                    assetId: `test${i}.md`,
                    propertyName: 'title',
                    value: `Title ${i}`,
                    propertyDefinition: {
                        propertyName: 'title',
                        label: 'Title',
                        range: 'string',
                        isRequired: false
                    }
                };
                requests.push(request);
            }

            // Execute in smaller batches to prevent memory buildup
            const batchSize = 5;
            for (let i = 0; i < requests.length; i += batchSize) {
                const batch = requests.slice(i, i + batchSize);
                await Promise.all(batch.map(req => useCase.execute(req)));
                
                // Clear references after each batch
                batch.length = 0;
            }

            // Clear the requests array
            requests.length = 0;

            // Force garbage collection if possible
            if (global.gc) {
                global.gc();
            }

            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;

            // Memory increase should be reasonable (less than 3MB in CI, 8MB locally)
            const memoryLimit = process.env.CI ? 3 * 1024 * 1024 : 8 * 1024 * 1024;
            expect(memoryIncrease).toBeLessThan(memoryLimit);
        });
    });
});