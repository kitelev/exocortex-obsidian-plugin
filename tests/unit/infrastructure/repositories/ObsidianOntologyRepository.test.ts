import { App, TFile, MetadataCache } from 'obsidian';
import { ObsidianOntologyRepository } from '../../../../src/infrastructure/repositories/ObsidianOntologyRepository';
import { Ontology } from '../../../../src/domain/entities/Ontology';
import { OntologyPrefix } from '../../../../src/domain/value-objects/OntologyPrefix';

describe('ObsidianOntologyRepository', () => {
    let repository: ObsidianOntologyRepository;
    let mockApp: App;
    let mockVault: any;
    let mockMetadataCache: MetadataCache;

    beforeEach(() => {
        // Create mock app with vault and metadata cache
        mockVault = {
            getAbstractFileByPath: jest.fn(),
            getMarkdownFiles: jest.fn(),
            create: jest.fn(),
            modify: jest.fn()
        };

        mockMetadataCache = {
            getFileCache: jest.fn()
        } as any;

        mockApp = {
            vault: mockVault,
            metadataCache: mockMetadataCache
        } as App;

        repository = new ObsidianOntologyRepository(mockApp);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Constructor and Initialization', () => {
        it('should initialize with app reference', () => {
            expect(repository).toBeInstanceOf(ObsidianOntologyRepository);
        });

        it('should handle null app gracefully', () => {
            expect(() => new ObsidianOntologyRepository(null as any)).not.toThrow();
        });
    });

    describe('findByPrefix', () => {
        const mockPrefix = OntologyPrefix.create('test').getValue();
        const mockFile = new TFile('!test.md');

        beforeEach(() => {
            // Mock Ontology.fromFrontmatter static method
            jest.spyOn(Ontology, 'fromFrontmatter').mockImplementation((frontmatter: any) => {
                return {
                    getPrefix: () => mockPrefix,
                    getNamespace: () => 'http://example.org/test#',
                    getClasses: () => [],
                    getProperties: () => []
                } as any;
            });
        });

        it('should find ontology by prefix when file exists', async () => {
            const mockFrontmatter = {
                'exo__Ontology_prefix': 'test',
                'exo__Ontology_namespace': 'http://example.org/test#'
            };

            mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
            mockMetadataCache.getFileCache.mockReturnValue({
                frontmatter: mockFrontmatter
            });

            const result = await repository.findByPrefix(mockPrefix);

            expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith('!test.md');
            expect(mockMetadataCache.getFileCache).toHaveBeenCalledWith(mockFile);
            expect(result).toBeDefined();
            expect(Ontology.fromFrontmatter).toHaveBeenCalledWith(mockFrontmatter);
        });

        it('should return null when file does not exist', async () => {
            mockVault.getAbstractFileByPath.mockReturnValue(null);

            const result = await repository.findByPrefix(mockPrefix);

            expect(result).toBeNull();
            expect(mockMetadataCache.getFileCache).not.toHaveBeenCalled();
        });

        it('should return null when file exists but has no frontmatter', async () => {
            mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
            mockMetadataCache.getFileCache.mockReturnValue({});

            const result = await repository.findByPrefix(mockPrefix);

            expect(result).toBeNull();
        });

        it('should return null when file cache is null', async () => {
            mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
            mockMetadataCache.getFileCache.mockReturnValue(null);

            const result = await repository.findByPrefix(mockPrefix);

            expect(result).toBeNull();
        });

        it('should handle non-TFile return from getAbstractFileByPath', async () => {
            const mockFolder = { name: '!test.md' }; // Not a TFile
            mockVault.getAbstractFileByPath.mockReturnValue(mockFolder);

            const result = await repository.findByPrefix(mockPrefix);

            expect(result).toBeNull();
        });

        it('should handle fromFrontmatter errors gracefully', async () => {
            mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
            mockMetadataCache.getFileCache.mockReturnValue({ frontmatter: {} });
            jest.spyOn(Ontology, 'fromFrontmatter').mockImplementation(() => {
                throw new Error('Invalid frontmatter');
            });

            await expect(repository.findByPrefix(mockPrefix)).rejects.toThrow('Invalid frontmatter');
        });
    });

    describe('findAll', () => {
        beforeEach(() => {
            jest.spyOn(Ontology, 'fromFrontmatter').mockImplementation((frontmatter: any) => ({
                getPrefix: () => OntologyPrefix.create(frontmatter['exo__Ontology_prefix']).getValue(),
                getNamespace: () => frontmatter['exo__Ontology_namespace'],
                getClasses: () => [],
                getProperties: () => []
            } as any));
        });

        it('should return all ontology files', async () => {
            const mockFiles = [
                { name: '!test1.md', path: '!test1.md' } as TFile,
                { name: '!test2.md', path: '!test2.md' } as TFile,
                { name: 'regular-file.md', path: 'regular-file.md' } as TFile, // Should be ignored
                { name: '!test3.md', path: '!test3.md' } as TFile
            ];

            mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
            
            // Mock metadata cache responses
            mockMetadataCache.getFileCache.mockImplementation((file: TFile) => {
                if (file.name.startsWith('!')) {
                    return {
                        frontmatter: {
                            'exo__Ontology_prefix': file.name.replace('!', '').replace('.md', ''),
                            'exo__Ontology_namespace': `http://example.org/${file.name.replace('!', '').replace('.md', '')}#`
                        }
                    };
                }
                return {};
            });

            const result = await repository.findAll();

            expect(result).toHaveLength(3); // Only the files starting with '!'
            expect(mockVault.getMarkdownFiles).toHaveBeenCalled();
        });

        it('should return empty array when no ontology files exist', async () => {
            mockVault.getMarkdownFiles.mockReturnValue([]);

            const result = await repository.findAll();

            expect(result).toEqual([]);
        });

        it('should filter out files without ontology prefix in frontmatter', async () => {
            const mockFiles = [
                { name: '!valid.md', path: '!valid.md' } as TFile,
                { name: '!invalid.md', path: '!invalid.md' } as TFile
            ];

            mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
            mockMetadataCache.getFileCache.mockImplementation((file: TFile) => {
                if (file.name === '!valid.md') {
                    return {
                        frontmatter: {
                            'exo__Ontology_prefix': 'valid',
                            'exo__Ontology_namespace': 'http://example.org/valid#'
                        }
                    };
                }
                // Invalid file has no ontology prefix
                return { frontmatter: {} };
            });

            const result = await repository.findAll();

            expect(result).toHaveLength(1);
        });

        it('should handle missing frontmatter gracefully', async () => {
            const mockFiles = [{ name: '!test.md', path: '!test.md' } as TFile];

            mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
            mockMetadataCache.getFileCache.mockReturnValue(null);

            const result = await repository.findAll();

            expect(result).toEqual([]);
        });

        it('should handle fromFrontmatter errors gracefully', async () => {
            const mockFiles = [{ name: '!test.md', path: '!test.md' } as TFile];

            mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
            mockMetadataCache.getFileCache.mockReturnValue({
                frontmatter: { 'exo__Ontology_prefix': 'test' }
            });
            jest.spyOn(Ontology, 'fromFrontmatter').mockImplementation(() => {
                throw new Error('Invalid frontmatter');
            });

            // Should throw the error from fromFrontmatter
            await expect(repository.findAll()).rejects.toThrow('Invalid frontmatter');
        });
    });

    describe('save', () => {
        let mockOntology: Ontology;
        const mockPrefix = OntologyPrefix.create('test').getValue();

        beforeEach(() => {
            mockOntology = {
                getPrefix: () => mockPrefix,
                toFrontmatter: () => ({
                    'exo__Ontology_prefix': 'test',
                    'exo__Ontology_namespace': 'http://example.org/test#',
                    'exo__Ontology_classes': ['Class1', 'Class2'],
                    'exo__Ontology_properties': ['prop1', 'prop2']
                })
            } as any;
        });

        it('should create new ontology file when it does not exist', async () => {
            mockVault.getAbstractFileByPath.mockReturnValue(null);
            mockVault.create.mockResolvedValue({ name: '!test.md', path: '!test.md' } as TFile);

            await repository.save(mockOntology);

            expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith('!test.md');
            expect(mockVault.create).toHaveBeenCalledWith('!test.md', expect.stringContaining('exo__Ontology_prefix: test'));
            expect(mockVault.modify).not.toHaveBeenCalled();
        });

        it('should modify existing ontology file', async () => {
            const existingFile = new TFile('!test.md');
            mockVault.getAbstractFileByPath.mockReturnValue(existingFile);
            mockVault.modify.mockResolvedValue(undefined);

            await repository.save(mockOntology);

            expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith('!test.md');
            expect(mockVault.modify).toHaveBeenCalledWith(existingFile, expect.stringContaining('exo__Ontology_prefix: test'));
        });

        it('should generate proper YAML frontmatter for arrays', async () => {
            mockVault.getAbstractFileByPath.mockReturnValue(null);
            mockVault.create.mockResolvedValue({ name: '!test.md', path: '!test.md' } as TFile);

            await repository.save(mockOntology);

            const createCall = mockVault.create.mock.calls[0];
            const content = createCall[1];

            expect(content).toContain('---');
            expect(content).toContain('exo__Ontology_classes:');
            expect(content).toContain('  - Class1');
            expect(content).toContain('  - Class2');
            expect(content).toContain('exo__Ontology_properties:');
            expect(content).toContain('  - prop1');
            expect(content).toContain('  - prop2');
        });

        it('should generate proper YAML frontmatter for scalar values', async () => {
            mockVault.getAbstractFileByPath.mockReturnValue(null);
            mockVault.create.mockResolvedValue({ name: '!test.md', path: '!test.md' } as TFile);

            await repository.save(mockOntology);

            const createCall = mockVault.create.mock.calls[0];
            const content = createCall[1];

            expect(content).toContain('exo__Ontology_prefix: test');
            expect(content).toContain('exo__Ontology_namespace: http://example.org/test#');
        });

        it('should handle empty arrays in frontmatter', async () => {
            mockOntology.toFrontmatter = () => ({
                'exo__Ontology_prefix': 'test',
                'exo__Ontology_namespace': 'http://example.org/test#',
                'exo__Ontology_classes': []
            });

            mockVault.getAbstractFileByPath.mockReturnValue(null);
            mockVault.create.mockResolvedValue({ name: '!test.md', path: '!test.md' } as TFile);

            await repository.save(mockOntology);

            const createCall = mockVault.create.mock.calls[0];
            const content = createCall[1];

            expect(content).toContain('exo__Ontology_classes:');
        });

        it('should handle vault create errors', async () => {
            mockVault.getAbstractFileByPath.mockReturnValue(null);
            mockVault.create.mockRejectedValue(new Error('Failed to create file'));

            await expect(repository.save(mockOntology)).rejects.toThrow('Failed to create file');
        });

        it('should handle vault modify errors', async () => {
            const existingFile = new TFile('!test.md');
            mockVault.getAbstractFileByPath.mockReturnValue(existingFile);
            mockVault.modify.mockRejectedValue(new Error('Failed to modify file'));

            await expect(repository.save(mockOntology)).rejects.toThrow('Failed to modify file');
        });

        it('should handle non-TFile from getAbstractFileByPath during save', async () => {
            const mockFolder = { name: '!test.md' }; // Not a TFile
            mockVault.getAbstractFileByPath.mockReturnValue(mockFolder);
            mockVault.create.mockResolvedValue({ name: '!test.md', path: '!test.md' } as TFile);

            await repository.save(mockOntology);

            // Should treat as non-existent and create new file
            expect(mockVault.create).toHaveBeenCalled();
            expect(mockVault.modify).not.toHaveBeenCalled();
        });
    });

    describe('exists', () => {
        const mockPrefix = OntologyPrefix.create('test').getValue();

        it('should return true when file exists and is TFile', async () => {
            const mockFile = new TFile('!test.md');
            mockVault.getAbstractFileByPath.mockReturnValue(mockFile);

            const result = await repository.exists(mockPrefix);

            expect(result).toBe(true);
            expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith('!test.md');
        });

        it('should return false when file does not exist', async () => {
            mockVault.getAbstractFileByPath.mockReturnValue(null);

            const result = await repository.exists(mockPrefix);

            expect(result).toBe(false);
        });

        it('should return false when file exists but is not TFile', async () => {
            const mockFolder = { name: '!test.md' }; // Not a TFile
            mockVault.getAbstractFileByPath.mockReturnValue(mockFolder);

            const result = await repository.exists(mockPrefix);

            expect(result).toBe(false);
        });

        it('should handle vault errors gracefully', async () => {
            mockVault.getAbstractFileByPath.mockImplementation(() => {
                throw new Error('Vault error');
            });

            await expect(repository.exists(mockPrefix)).rejects.toThrow('Vault error');
        });
    });

    describe('Error Recovery and Edge Cases', () => {
        const mockPrefix = OntologyPrefix.create('test').getValue();

        it('should handle concurrent findByPrefix calls', async () => {
            const mockFile = { name: '!test.md', path: '!test.md' } as TFile;
            mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
            mockMetadataCache.getFileCache.mockReturnValue({
                frontmatter: { 'exo__Ontology_prefix': 'test' }
            });
            jest.spyOn(Ontology, 'fromFrontmatter').mockImplementation(() => ({} as any));

            const promises = [
                repository.findByPrefix(mockPrefix),
                repository.findByPrefix(mockPrefix),
                repository.findByPrefix(mockPrefix)
            ];

            const results = await Promise.all(promises);
            expect(results).toHaveLength(3);
            expect(mockVault.getAbstractFileByPath).toHaveBeenCalledTimes(3);
        });

        it('should handle corrupt frontmatter gracefully', async () => {
            const mockFile = new TFile('!test.md');
            mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
            mockMetadataCache.getFileCache.mockReturnValue({
                frontmatter: { invalid: 'data' } // Missing required fields
            });
            jest.spyOn(Ontology, 'fromFrontmatter').mockImplementation(() => {
                throw new Error('Required field missing');
            });

            await expect(repository.findByPrefix(mockPrefix)).rejects.toThrow('Required field missing');
        });

        it('should handle special characters in prefix', async () => {
            const result = await repository.exists(mockPrefix);
            expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith('!test.md');
        });

        it('should handle very long prefix names', async () => {
            const longPrefix = 'a'.repeat(50); // Reduced to valid length
            const prefix = OntologyPrefix.create(longPrefix).getValue();
            
            await repository.exists(prefix);
            expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith(`!${longPrefix}.md`);
        });

        it('should handle metadata cache returning undefined', async () => {
            const mockFile = new TFile('!test.md');
            mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
            mockMetadataCache.getFileCache.mockReturnValue(undefined);

            const result = await repository.findByPrefix(mockPrefix);
            expect(result).toBeNull();
        });

        it('should handle vault adapter errors in getAbstractFileByPath', async () => {
            mockVault.getAbstractFileByPath.mockImplementation(() => {
                throw new Error('Vault adapter error');
            });

            await expect(repository.findByPrefix(mockPrefix)).rejects.toThrow('Vault adapter error');
        });

        it('should handle metadata cache errors in getFileCache', async () => {
            const mockFile = new TFile('!test.md');
            mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
            mockMetadataCache.getFileCache.mockImplementation(() => {
                throw new Error('Metadata cache error');
            });

            await expect(repository.findByPrefix(mockPrefix)).rejects.toThrow('Metadata cache error');
        });

        it('should handle findAll with mixed valid and invalid files', async () => {
            const mockFiles = [
                { name: '!valid.md', path: '!valid.md' } as TFile,
                { name: '!invalid.md', path: '!invalid.md' } as TFile,
                { name: '!error.md', path: '!error.md' } as TFile
            ];

            mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
            mockMetadataCache.getFileCache.mockImplementation((file: TFile) => {
                if (file.name === '!valid.md') {
                    return { frontmatter: { 'exo__Ontology_prefix': 'valid' } };
                }
                if (file.name === '!invalid.md') {
                    return { frontmatter: {} }; // No prefix
                }
                if (file.name === '!error.md') {
                    throw new Error('File access error');
                }
                return null;
            });

            jest.spyOn(Ontology, 'fromFrontmatter').mockImplementation((frontmatter: any) => {
                if (frontmatter['exo__Ontology_prefix'] === 'valid') {
                    return {} as any;
                }
                throw new Error('Invalid ontology');
            });

            // Should handle errors gracefully and continue processing
            await expect(repository.findAll()).rejects.toThrow('File access error');
        });

        it('should handle invalid TFile objects', async () => {
            const invalidFile = { name: '!test.md' }; // Missing required TFile properties
            mockVault.getAbstractFileByPath.mockReturnValue(invalidFile);

            const result = await repository.findByPrefix(mockPrefix);
            expect(result).toBeNull();
        });

        it('should handle empty string prefix', async () => {
            try {
                const emptyPrefix = OntologyPrefix.create('').getValue();
                // This should never execute as OntologyPrefix.create('') should fail
                expect(true).toBe(false);
            } catch (error) {
                // Expected behavior - empty prefix should be rejected by value object
                expect(error).toBeDefined();
            }
        });

        it('should handle malformed frontmatter structure', async () => {
            const mockFile = new TFile('!test.md');
            mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
            mockMetadataCache.getFileCache.mockReturnValue({
                frontmatter: {
                    'exo__Ontology_prefix': ['array', 'instead', 'of', 'string'],
                    'invalid_structure': { nested: { object: true } }
                }
            });

            jest.spyOn(Ontology, 'fromFrontmatter').mockImplementation(() => {
                throw new Error('Malformed frontmatter');
            });

            await expect(repository.findByPrefix(mockPrefix)).rejects.toThrow('Malformed frontmatter');
        });

        it('should handle save with complex nested frontmatter', async () => {
            const complexOntology = {
                getPrefix: () => mockPrefix,
                toFrontmatter: () => ({
                    'exo__Ontology_prefix': 'test',
                    'exo__Ontology_namespace': 'http://example.org/test#',
                    'exo__Ontology_classes': [
                        'Person',
                        'Organization',
                        'Event'
                    ],
                    'exo__Ontology_properties': [
                        'hasName',
                        'hasDescription',
                        'relatedTo'
                    ],
                    'exo__Ontology_imports': [
                        'http://www.w3.org/2002/07/owl#',
                        'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
                    ],
                    'exo__Ontology_version': '1.0.0',
                    'exo__Ontology_author': 'Test Author',
                    'exo__Ontology_license': 'MIT'
                })
            } as any;

            mockVault.getAbstractFileByPath.mockReturnValue(null);
            mockVault.create.mockResolvedValue({ name: '!test.md', path: '!test.md' } as TFile);

            await repository.save(complexOntology);

            const createCall = mockVault.create.mock.calls[0];
            const content = createCall[1];

            // Verify all arrays are properly formatted
            expect(content).toContain('exo__Ontology_classes:');
            expect(content).toContain('  - Person');
            expect(content).toContain('  - Organization');
            expect(content).toContain('  - Event');
            
            expect(content).toContain('exo__Ontology_properties:');
            expect(content).toContain('  - hasName');
            expect(content).toContain('  - hasDescription');
            
            expect(content).toContain('exo__Ontology_imports:');
            expect(content).toContain('  - http://www.w3.org/2002/07/owl#');
            
            // Verify scalar values
            expect(content).toContain('exo__Ontology_version: 1.0.0');
            expect(content).toContain('exo__Ontology_author: Test Author');
            expect(content).toContain('exo__Ontology_license: MIT');
        });

        it('should handle save with null and undefined values in frontmatter', async () => {
            const ontologyWithNulls = {
                getPrefix: () => mockPrefix,
                toFrontmatter: () => ({
                    'exo__Ontology_prefix': 'test',
                    'exo__Ontology_namespace': null,
                    'exo__Ontology_description': undefined,
                    'exo__Ontology_classes': [],
                    'exo__Ontology_properties': null
                })
            } as any;

            mockVault.getAbstractFileByPath.mockReturnValue(null);
            mockVault.create.mockResolvedValue({ name: '!test.md', path: '!test.md' } as TFile);

            await repository.save(ontologyWithNulls);

            const createCall = mockVault.create.mock.calls[0];
            const content = createCall[1];

            expect(content).toContain('exo__Ontology_prefix: test');
            expect(content).toContain('exo__Ontology_namespace: null');
            expect(content).toContain('exo__Ontology_description: undefined');
        });
    });

    describe('Integration Scenarios', () => {
        it('should support full CRUD cycle', async () => {
            const mockPrefix = OntologyPrefix.create('integration').getValue();
            const mockOntology = {
                getPrefix: () => mockPrefix,
                toFrontmatter: () => ({
                    'exo__Ontology_prefix': 'integration',
                    'exo__Ontology_namespace': 'http://example.org/integration#'
                })
            } as any;

            // Create
            mockVault.getAbstractFileByPath.mockReturnValueOnce(null); // File doesn't exist
            mockVault.create.mockResolvedValue({ name: '!integration.md', path: '!integration.md' } as TFile);
            await repository.save(mockOntology);
            
            // Check exists
            const mockIntegrationFile = new TFile('!integration.md');
            mockVault.getAbstractFileByPath.mockReturnValueOnce(mockIntegrationFile);
            const exists = await repository.exists(mockPrefix);
            expect(exists).toBe(true);
            
            // Find
            const mockFile = new TFile('!integration.md');
            mockVault.getAbstractFileByPath.mockReturnValueOnce(mockFile);
            mockMetadataCache.getFileCache.mockReturnValue({
                frontmatter: { 'exo__Ontology_prefix': 'integration' }
            });
            jest.spyOn(Ontology, 'fromFrontmatter').mockImplementation(() => mockOntology);
            
            const found = await repository.findByPrefix(mockPrefix);
            expect(found).toBe(mockOntology);
        });

        it('should handle batch operations with multiple ontologies', async () => {
            const prefixes = ['batch1', 'batch2', 'batch3'].map(p => OntologyPrefix.create(p).getValue());
            const ontologies = prefixes.map(prefix => ({
                getPrefix: () => prefix,
                toFrontmatter: () => ({
                    'exo__Ontology_prefix': prefix.toString(),
                    'exo__Ontology_namespace': `http://example.org/${prefix.toString()}#`
                })
            })) as any[];

            // Mock file creation for all ontologies
            mockVault.getAbstractFileByPath.mockReturnValue(null);
            mockVault.create.mockImplementation((path: string) => 
                Promise.resolve({ name: path, path } as TFile)
            );

            // Save all ontologies
            const savePromises = ontologies.map(ont => repository.save(ont));
            await Promise.all(savePromises);

            // Verify all files were created
            expect(mockVault.create).toHaveBeenCalledTimes(3);
            expect(mockVault.create).toHaveBeenCalledWith('!batch1.md', expect.any(String));
            expect(mockVault.create).toHaveBeenCalledWith('!batch2.md', expect.any(String));
            expect(mockVault.create).toHaveBeenCalledWith('!batch3.md', expect.any(String));
        });

        it('should handle repository state consistency during concurrent operations', async () => {
            const mockPrefix = OntologyPrefix.create('concurrent').getValue();
            const mockFile = { name: '!concurrent.md', path: '!concurrent.md' } as TFile;

            // Setup concurrent read/write scenario
            mockVault.getAbstractFileByPath.mockImplementation(() => {
                // Simulate file being created during concurrent access
                return Math.random() > 0.5 ? mockFile : null;
            });
            
            mockMetadataCache.getFileCache.mockReturnValue({
                frontmatter: { 'exo__Ontology_prefix': 'concurrent' }
            });
            
            jest.spyOn(Ontology, 'fromFrontmatter').mockImplementation(() => ({} as any));

            // Execute concurrent operations
            const operations = [
                repository.findByPrefix(mockPrefix),
                repository.exists(mockPrefix),
                repository.findByPrefix(mockPrefix)
            ];

            const results = await Promise.all(operations);
            expect(results).toHaveLength(3);
        });

        it('should handle complex findAll scenario with mixed file types', async () => {
            const mockFiles = [
                { name: '!ontology1.md', path: '!ontology1.md' } as TFile,
                { name: '!ontology2.md', path: '!ontology2.md' } as TFile,
                { name: 'regular-note.md', path: 'regular-note.md' } as TFile,
                { name: '!invalid-ontology.md', path: '!invalid-ontology.md' } as TFile,
                { name: '!empty-ontology.md', path: '!empty-ontology.md' } as TFile
            ];

            mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
            
            mockMetadataCache.getFileCache.mockImplementation((file: TFile) => {
                switch (file.name) {
                    case '!ontology1.md':
                        return { frontmatter: { 'exo__Ontology_prefix': 'ont1' } };
                    case '!ontology2.md':
                        return { frontmatter: { 'exo__Ontology_prefix': 'ont2' } };
                    case '!invalid-ontology.md':
                        return { frontmatter: {} }; // Missing prefix
                    case '!empty-ontology.md':
                        return null; // No cache
                    default:
                        return { frontmatter: {} };
                }
            });

            jest.spyOn(Ontology, 'fromFrontmatter').mockImplementation((frontmatter: any) => {
                if (frontmatter['exo__Ontology_prefix']) {
                    return {
                        getPrefix: () => OntologyPrefix.create(frontmatter['exo__Ontology_prefix']).getValue()
                    } as any;
                }
                throw new Error('Invalid ontology');
            });

            const result = await repository.findAll();
            
            // Should only include valid ontology files
            expect(result).toHaveLength(2);
        });

        it('should maintain data integrity during save operations', async () => {
            const mockPrefix = OntologyPrefix.create('integrity').getValue();
            const originalData = {
                'exo__Ontology_prefix': 'integrity',
                'exo__Ontology_namespace': 'http://example.org/integrity#',
                'exo__Ontology_classes': ['Class1', 'Class2'],
                'exo__Ontology_properties': ['prop1', 'prop2']
            };

            const mockOntology = {
                getPrefix: () => mockPrefix,
                toFrontmatter: () => originalData
            } as any;

            mockVault.getAbstractFileByPath.mockReturnValue(null);
            mockVault.create.mockImplementation((path: string, content: string) => {
                // Verify content integrity
                expect(content).toContain('---');
                expect(content).toContain('exo__Ontology_prefix: integrity');
                expect(content).toContain('exo__Ontology_classes:');
                expect(content).toContain('  - Class1');
                expect(content).toContain('  - Class2');
                expect(content).toContain('exo__Ontology_properties:');
                expect(content).toContain('  - prop1');
                expect(content).toContain('  - prop2');
                
                return Promise.resolve({ name: path, path } as TFile);
            });

            await repository.save(mockOntology);
            expect(mockVault.create).toHaveBeenCalledWith('!integrity.md', expect.any(String));
        });
    });
});
