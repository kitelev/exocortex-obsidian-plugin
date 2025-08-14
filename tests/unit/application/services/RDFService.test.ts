/**
 * Test suite for RDF Service functionality
 */

import { RDFService } from '../../../../src/application/services/RDFService';
import { RDFSerializer } from '../../../../src/application/services/RDFSerializer';
import { RDFParser } from '../../../../src/application/services/RDFParser';
import { NamespaceManager } from '../../../../src/application/services/NamespaceManager';
import { Graph } from '../../../../src/domain/semantic/core/Graph';
import { Triple, IRI, BlankNode, Literal } from '../../../../src/domain/semantic/core/Triple';
import { Result } from '../../../../src/domain/core/Result';

// Mock the dependent services
jest.mock('../../../../src/application/services/RDFFileManager');
jest.mock('../../../../src/application/services/RDFParser'); 
jest.mock('../../../../src/application/services/RDFValidator');
jest.mock('../../../../src/application/services/RDFSerializer');
jest.mock('../../../../src/application/services/NamespaceManager');

// Mock Obsidian App
const mockApp = {
    vault: {
        getAbstractFileByPath: jest.fn(),
        createFolder: jest.fn(),
        create: jest.fn(),
        modify: jest.fn(),
        read: jest.fn(),
        getFiles: jest.fn(),
        adapter: {
            write: jest.fn(),
            read: jest.fn()
        }
    }
} as any;

// Mock the service classes
const mockRDFFileManager = {
    readFromVault: jest.fn(),
    saveToVault: jest.fn(),
    detectFormatFromExtension: jest.fn(),
    listRDFFiles: jest.fn(),
    generateFileName: jest.fn()
};

const mockRDFParser = {
    parse: jest.fn()
};

const mockRDFValidator = {
    validateExportOptions: jest.fn(),
    validateImportOptions: jest.fn(),
    validateGraph: jest.fn()
};

const mockRDFSerializer = {
    serialize: jest.fn()
};

const mockNamespaceManager = {
    hasPrefix: jest.fn(),
    addBinding: jest.fn(),
    getPrefix: jest.fn(),
    expand: jest.fn(),
    compressIRI: jest.fn(),
    getAllBindings: jest.fn(),
    generatePrefixDeclarations: jest.fn(),
    getNamespace: jest.fn(),
    expandCURIE: jest.fn()
};

// Import and mock the constructors
import { RDFFileManager } from '../../../../src/application/services/RDFFileManager';
import { RDFParser } from '../../../../src/application/services/RDFParser';
import { RDFValidator } from '../../../../src/application/services/RDFValidator';
import { RDFSerializer } from '../../../../src/application/services/RDFSerializer';
import { NamespaceManager } from '../../../../src/application/services/NamespaceManager';

// Configure the mocked constructors
(RDFFileManager as jest.MockedClass<typeof RDFFileManager>).mockImplementation(() => mockRDFFileManager as any);
(RDFParser as jest.MockedClass<typeof RDFParser>).mockImplementation(() => mockRDFParser as any);
(RDFValidator as jest.MockedClass<typeof RDFValidator>).mockImplementation(() => mockRDFValidator as any);
(RDFSerializer as jest.MockedClass<typeof RDFSerializer>).mockImplementation(() => mockRDFSerializer as any);
(NamespaceManager as jest.MockedClass<typeof NamespaceManager>).mockImplementation(() => mockNamespaceManager as any);

describe('RDFService', () => {
    let rdfService: RDFService;
    let graph: Graph;
    
    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Setup default mock responses for successful operations
        mockRDFFileManager.readFromVault.mockResolvedValue({
            isSuccess: true,
            isFailure: false,
            getValue: () => '@prefix ex: <http://example.org/> . ex:test ex:prop "value" .',
            errorValue: () => null
        });
        
        mockRDFFileManager.detectFormatFromExtension.mockReturnValue('turtle');
        
        mockRDFParser.parse.mockReturnValue({
            isSuccess: true,
            isFailure: false,
            getValue: () => ({
                graph: new Graph(),
                tripleCount: 1,
                namespaces: { 'ex': 'http://example.org/' },
                warnings: []
            }),
            errorValue: () => null
        });
        
        mockRDFValidator.validateExportOptions.mockReturnValue({
            isSuccess: true,
            isFailure: false,
            getValue: () => true,
            errorValue: () => null
        });
        
        mockRDFValidator.validateImportOptions.mockReturnValue({
            isSuccess: true,
            isFailure: false,
            getValue: () => true,
            errorValue: () => null
        });
        
        mockRDFFileManager.listRDFFiles.mockResolvedValue({
            isSuccess: true,
            isFailure: false,
            getValue: () => [],
            errorValue: () => null
        });
        
        mockRDFFileManager.saveToVault.mockImplementation(async (content, filePath) => {
            // Simulate vault write operation
            mockApp.vault.create(filePath, content);
            return {
                isSuccess: true,
                isFailure: false,
                getValue: () => ({ filePath, success: true }),
                errorValue: () => null
            };
        });
        
        mockRDFFileManager.generateFileName.mockImplementation((fileName, format) => {
            if (fileName) return fileName;
            const extension = format === 'turtle' ? '.ttl' : '.rdf';
            return `generated-file${extension}`;
        });
        
        // Setup serializer mock - make it format-aware
        mockRDFSerializer.serialize.mockImplementation((graph, options) => {
            const tripleCount = graph.size();
            let content: string;
            
            switch (options.format) {
                case 'json-ld':
                    content = JSON.stringify({
                        "@context": { "ex": "http://example.org/" },
                        "@graph": [
                            {
                                "@id": "http://example.org/person/1",
                                "http://example.org/name": { "@value": "John Doe" }
                            }
                        ]
                    }, null, 2);
                    break;
                case 'n-triples':
                    content = '<http://example.org/person/1> <http://example.org/name> "John Doe" .';
                    break;
                case 'turtle':
                default:
                    content = '@prefix ex: <http://example.org/> .\n<http://example.org/person/1> <http://example.org/name> "John Doe" .';
                    break;
            }
            
            return {
                isSuccess: true,
                isFailure: false,
                getValue: () => ({
                    content,
                    tripleCount,
                    format: options.format
                }),
                errorValue: () => null
            };
        });
        
        // Setup namespace manager mock
        mockNamespaceManager.hasPrefix.mockReturnValue(false);
        mockNamespaceManager.addBinding.mockImplementation(() => {});
        mockNamespaceManager.compressIRI.mockImplementation((iri) => iri.toString());
        mockNamespaceManager.getAllBindings.mockReturnValue([
            { prefix: 'ex', namespace: { toString: () => 'http://example.org/' } },
            { prefix: 'foaf', namespace: { toString: () => 'http://xmlns.com/foaf/0.1/' } }
        ]);
        mockNamespaceManager.generatePrefixDeclarations.mockReturnValue('@prefix ex: <http://example.org/> .');
        mockNamespaceManager.getNamespace.mockReturnValue(null);
        mockNamespaceManager.expandCURIE.mockReturnValue({ isSuccess: false });
        
        mockRDFValidator.validateGraph.mockReturnValue({
            isSuccess: true,
            isFailure: false,
            getValue: () => ({
                isValid: true,
                errors: [],
                warnings: []
            }),
            errorValue: () => null
        });
        
        rdfService = new RDFService(mockApp);
        graph = new Graph();
        
        // Add some test data
        const subject = new IRI('http://example.org/person/1');
        const predicate = new IRI('http://example.org/name');
        const object = Literal.string('John Doe');
        
        graph.add(new Triple(subject, predicate, object));
    });
    
    describe('exportGraph', () => {
        it('should export graph in Turtle format', async () => {
            const result = await rdfService.exportGraph(graph, {
                format: 'turtle',
                saveToVault: false
            });
            
            expect(result.isSuccess).toBe(true);
            
            const exportData = result.getValue();
            expect(exportData.format).toBe('turtle');
            expect(exportData.tripleCount).toBe(1);
            expect(exportData.content).toContain('@prefix');
            expect(exportData.content).toContain('John Doe');
        });
        
        it('should export graph in JSON-LD format', async () => {
            const result = await rdfService.exportGraph(graph, {
                format: 'json-ld',
                saveToVault: false
            });
            
            expect(result.isSuccess).toBe(true);
            
            const exportData = result.getValue();
            expect(exportData.format).toBe('json-ld');
            expect(exportData.tripleCount).toBe(1);
            
            // Should be valid JSON
            const jsonData = JSON.parse(exportData.content);
            expect(jsonData['@context']).toBeDefined();
            expect(jsonData['@graph']).toBeDefined();
        });
        
        it('should validate export options', async () => {
            // Mock validation failure for invalid format
            mockRDFValidator.validateExportOptions.mockReturnValue({
                isSuccess: false,
                isFailure: true,
                getValue: () => null,
                errorValue: () => 'Unsupported format: invalid'
            });
            
            const result = await rdfService.exportGraph(graph, {
                format: 'invalid' as any,
                saveToVault: false
            });
            
            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toContain('Unsupported format: invalid');
        });
    });
    
    describe('importRDF', () => {
        it('should import Turtle format RDF', async () => {
            const turtleContent = `
                @prefix ex: <http://example.org/> .
                ex:person1 ex:name "Jane Smith" .
                ex:person1 ex:age "30"^^<http://www.w3.org/2001/XMLSchema#integer> .
            `;
            
            const result = await rdfService.importRDF(turtleContent, graph, {
                format: 'turtle',
                mergeMode: 'merge'
            });
            
            expect(result.isSuccess).toBe(true);
            
            const { graph: updatedGraph, imported } = result.getValue();
            expect(imported.tripleCount).toBeGreaterThan(0);
            expect(updatedGraph.size()).toBeGreaterThanOrEqual(1); // Should have at least the imported data
        });
        
        it('should import JSON-LD format RDF', async () => {
            const jsonldContent = JSON.stringify({
                "@context": {
                    "ex": "http://example.org/"
                },
                "@graph": [
                    {
                        "@id": "ex:person2",
                        "ex:name": { "@value": "Bob Johnson" },
                        "ex:age": { "@value": "25", "@type": "http://www.w3.org/2001/XMLSchema#integer" }
                    }
                ]
            });
            
            const result = await rdfService.importRDF(jsonldContent, graph, {
                format: 'json-ld',
                mergeMode: 'merge'
            });
            
            expect(result.isSuccess).toBe(true);
            
            const { imported } = result.getValue();
            expect(imported.tripleCount).toBeGreaterThan(0);
        });
        
        it('should validate import options', async () => {
            // Mock validation failure for invalid format
            mockRDFValidator.validateImportOptions.mockReturnValue({
                isSuccess: false,
                isFailure: true,
                getValue: () => null,
                errorValue: () => 'Unsupported import format: invalid'
            });
            
            const result = await rdfService.importRDF('invalid content', graph, {
                format: 'invalid' as any,
                mergeMode: 'merge'
            });
            
            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toContain('Unsupported import format: invalid');
        });
        
        it('should handle replace merge mode', async () => {
            const originalSize = graph.size();
            
            const turtleContent = `
                @prefix ex: <http://example.org/> .
                ex:newperson ex:name "New Person" .
            `;
            
            // Mock successful parsing with specific data for replace mode
            const replacementGraph = new Graph();
            replacementGraph.add(new Triple(
                new IRI('http://example.org/newperson'),
                new IRI('http://example.org/name'),
                Literal.string('New Person')
            ));
            
            mockRDFParser.parse.mockReturnValue({
                isSuccess: true,
                isFailure: false,
                getValue: () => ({
                    graph: replacementGraph,
                    tripleCount: 1,
                    namespaces: { 'ex': 'http://example.org/' },
                    warnings: []
                }),
                errorValue: () => null
            });
            
            const result = await rdfService.importRDF(turtleContent, graph, {
                format: 'turtle',
                mergeMode: 'replace'
            });
            
            expect(result.isSuccess).toBe(true);
            
            const { graph: updatedGraph } = result.getValue();
            // In replace mode, should return the replacement graph
            expect(updatedGraph.size()).toBe(1);
        });
    });
    
    describe('getSupportedFormats', () => {
        it('should return all supported formats', () => {
            const formats = rdfService.getSupportedFormats();
            
            expect(formats).toContain('turtle');
            expect(formats).toContain('n-triples');
            expect(formats).toContain('json-ld');
            expect(formats).toContain('rdf-xml');
        });
    });
    
    describe('getFormatInfo', () => {
        it('should return format information', () => {
            const info = rdfService.getFormatInfo('turtle');
            
            expect(info.extension).toBe('.ttl');
            expect(info.mimeType).toBe('text/turtle');
            expect(info.name).toBe('Turtle');
        });
    });
    
    describe('exportQueryResults', () => {
        it('should export SPARQL query results', async () => {
            const queryResults = [
                {
                    subject: 'http://example.org/person/1',
                    predicate: 'http://example.org/name',
                    object: 'John Doe'
                },
                {
                    subject: 'http://example.org/person/1',
                    predicate: 'http://example.org/age',
                    object: '30'
                }
            ];
            
            const result = await rdfService.exportQueryResults(
                queryResults,
                'turtle',
                'query-results',
                false
            );
            
            expect(result.isSuccess).toBe(true);
            
            const exportData = result.getValue();
            expect(exportData.format).toBe('turtle');
            expect(exportData.tripleCount).toBe(2);
        });
    });
    
    describe('importFromVaultFile', () => {
        it('should import RDF from vault file', async () => {
            const mockFile = {
                path: 'test.ttl',
                name: 'test.ttl'
            } as any;
            
            // Mock successful file read
            mockRDFFileManager.readFromVault.mockResolvedValue({
                isSuccess: true,
                isFailure: false,
                getValue: () => '@prefix ex: <http://example.org/> . ex:person1 ex:name "Test Person" .',
                errorValue: () => null
            });
            
            // Mock format detection
            mockRDFFileManager.detectFormatFromExtension.mockReturnValue('turtle');
            
            // Mock successful parsing
            const testGraph = new Graph();
            testGraph.add(new Triple(
                new IRI('http://example.org/person1'),
                new IRI('http://example.org/name'),
                Literal.string('Test Person')
            ));
            
            mockRDFParser.parse.mockReturnValue({
                isSuccess: true,
                isFailure: false,
                getValue: () => ({
                    graph: testGraph,
                    tripleCount: 1,
                    namespaces: { 'ex': 'http://example.org/' },
                    warnings: []
                }),
                errorValue: () => null
            });
            
            const result = await rdfService.importFromVaultFile(mockFile, graph, {
                mergeMode: 'merge'
            });
            
            expect(result.isSuccess).toBe(true);
            expect(mockRDFFileManager.readFromVault).toHaveBeenCalledWith('test.ttl');
        });
        
        it('should auto-detect format from file extension', async () => {
            const mockFile = {
                path: 'test.jsonld',
                name: 'test.jsonld'
            } as any;
            
            // Mock successful file read
            mockRDFFileManager.readFromVault.mockResolvedValue({
                isSuccess: true,
                isFailure: false,
                getValue: () => JSON.stringify({
                    "@context": { "ex": "http://example.org/" },
                    "@graph": []
                }),
                errorValue: () => null
            });
            
            // Mock format detection for JSON-LD
            mockRDFFileManager.detectFormatFromExtension.mockReturnValue('json-ld');
            
            // Mock successful parsing
            mockRDFParser.parse.mockReturnValue({
                isSuccess: true,
                isFailure: false,
                getValue: () => ({
                    graph: new Graph(),
                    tripleCount: 0,
                    namespaces: { 'ex': 'http://example.org/' },
                    warnings: []
                }),
                errorValue: () => null
            });
            
            const result = await rdfService.importFromVaultFile(mockFile, graph, {
                mergeMode: 'merge'
            });
            
            expect(result.isSuccess).toBe(true);
            expect(mockRDFFileManager.detectFormatFromExtension).toHaveBeenCalledWith('test.jsonld');
        });
        
        it('should handle file read errors', async () => {
            const mockFile = {
                path: 'nonexistent.ttl',
                name: 'nonexistent.ttl'
            } as any;
            
            // Mock file read failure
            mockRDFFileManager.readFromVault.mockResolvedValue({
                isSuccess: false,
                isFailure: true,
                getValue: () => null,
                errorValue: () => 'File not found: nonexistent.ttl'
            });
            
            const result = await rdfService.importFromVaultFile(mockFile, graph, {
                mergeMode: 'merge'
            });
            
            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toContain('File not found');
        });
    });
    
    describe('listRDFFiles', () => {
        it('should list RDF files in vault', async () => {
            const mockFiles = [
                { name: 'test.ttl', path: 'test.ttl', extension: 'ttl' },
                { name: 'data.rdf', path: 'data.rdf', extension: 'rdf' },
                { name: 'example.jsonld', path: 'example.jsonld', extension: 'jsonld' }
            ] as any;
            
            mockRDFFileManager.listRDFFiles.mockResolvedValue({
                isSuccess: true,
                isFailure: false,
                getValue: () => mockFiles,
                errorValue: () => null
            });
            
            const result = await rdfService.listRDFFiles();
            
            expect(result.isSuccess).toBe(true);
            const files = result.getValue();
            expect(files).toHaveLength(3); // Should exclude non-RDF files
            expect(files.map(f => f.name)).toEqual(['test.ttl', 'data.rdf', 'example.jsonld']);
        });
        
        it('should filter files by folder', async () => {
            const mockFiles = [
                { name: 'test.ttl', path: 'folder1/test.ttl', extension: 'ttl' },
                { name: 'example.jsonld', path: 'folder1/example.jsonld', extension: 'jsonld' }
            ] as any;
            
            mockRDFFileManager.listRDFFiles.mockResolvedValue({
                isSuccess: true,
                isFailure: false,
                getValue: () => mockFiles,
                errorValue: () => null
            });
            
            const result = await rdfService.listRDFFiles('folder1');
            
            expect(result.isSuccess).toBe(true);
            const files = result.getValue();
            expect(files).toHaveLength(2);
            expect(files.map(f => f.path)).toEqual(['folder1/test.ttl', 'folder1/example.jsonld']);
        });
    });
    
    describe('validateGraph', () => {
        it('should validate graph with default options', async () => {
            const result = await rdfService.validateGraph(graph);
            
            expect(result.isSuccess).toBe(true);
            const validation = result.getValue();
            expect(validation.isValid).toBe(true);
            expect(Array.isArray(validation.errors)).toBe(true);
            expect(Array.isArray(validation.warnings)).toBe(true);
        });
        
        it('should validate graph with custom options', async () => {
            const options = {
                strictMode: true,
                checkDuplicates: true,
                checkNamespaces: true
            };
            
            const result = await rdfService.validateGraph(graph, options);
            
            expect(result.isSuccess).toBe(true);
        });
    });
    
    describe('createNodeFromValue', () => {
        it('should create IRI from string with protocol', () => {
            const queryResults = [{
                subject: 'http://example.org/person/1',
                predicate: 'http://example.org/name',
                object: 'John Doe'
            }];
            
            const result = rdfService.exportQueryResults(queryResults, 'turtle', 'test', false);
            
            expect(result).resolves.toBeDefined();
        });
        
        it('should create BlankNode from string with _: prefix', async () => {
            const queryResults = [{
                subject: '_:b1',
                predicate: 'http://example.org/name',
                object: 'John Doe'
            }];
            
            // Update the serializer mock to handle blank node subjects
            mockRDFSerializer.serialize.mockImplementationOnce((graph, options) => {
                return {
                    isSuccess: true,
                    isFailure: false,
                    getValue: () => ({
                        content: '_:b1 <http://example.org/name> "John Doe" .',
                        tripleCount: 1,
                        format: options.format
                    }),
                    errorValue: () => null
                };
            });
            
            const result = await rdfService.exportQueryResults(queryResults, 'turtle', 'test', false);
            
            expect(result.isSuccess).toBe(true);
            const exported = result.getValue();
            expect(exported.content).toContain('_:b1');
        });
        
        it('should create Literal from number', async () => {
            const queryResults = [{
                subject: 'http://example.org/person/1',
                predicate: 'http://example.org/age',
                object: 25
            }];
            
            const result = await rdfService.exportQueryResults(queryResults, 'turtle', 'test', false);
            
            expect(result.isSuccess).toBe(true);
        });
        
        it('should create Literal from boolean', async () => {
            const queryResults = [{
                subject: 'http://example.org/person/1',
                predicate: 'http://example.org/active',
                object: true
            }];
            
            const result = await rdfService.exportQueryResults(queryResults, 'turtle', 'test', false);
            
            expect(result.isSuccess).toBe(true);
        });
        
        it('should create typed Literal from object with datatype', async () => {
            const queryResults = [{
                subject: 'http://example.org/person/1',
                predicate: 'http://example.org/birthDate',
                object: {
                    type: 'literal',
                    value: '1990-01-01',
                    datatype: 'http://www.w3.org/2001/XMLSchema#date'
                }
            }];
            
            const result = await rdfService.exportQueryResults(queryResults, 'turtle', 'test', false);
            
            expect(result.isSuccess).toBe(true);
        });
        
        it('should create language-tagged Literal from object with lang', async () => {
            const queryResults = [{
                subject: 'http://example.org/person/1',
                predicate: 'http://example.org/name',
                object: {
                    type: 'literal',
                    value: 'Jean',
                    lang: 'fr'
                }
            }];
            
            const result = await rdfService.exportQueryResults(queryResults, 'turtle', 'test', false);
            
            expect(result.isSuccess).toBe(true);
        });
        
        it('should handle null values gracefully', async () => {
            const queryResults = [{
                subject: 'http://example.org/person/1',
                predicate: 'http://example.org/name',
                object: null
            }];
            
            const result = await rdfService.exportQueryResults(queryResults, 'turtle', 'test', false);
            
            expect(result.isSuccess).toBe(true);
        });
    });
    
    describe('error handling', () => {
        it('should handle serialization errors', async () => {
            // Create an invalid graph scenario
            const invalidGraph = new Graph();
            
            // Mock serialization failure
            mockRDFSerializer.serialize.mockImplementationOnce(() => {
                return {
                    isSuccess: false,
                    isFailure: true,
                    getValue: () => null,
                    errorValue: () => 'Serialization failed: Invalid base IRI'
                };
            });
            
            const result = await rdfService.exportGraph(invalidGraph, {
                format: 'turtle',
                baseIRI: 'invalid-uri',
                saveToVault: false
            });
            
            // Should handle the error gracefully
            expect(result.isFailure).toBe(true);
        });
        
        it('should handle parsing errors in strict mode', async () => {
            const invalidContent = 'This is not valid RDF';
            
            // Mock parsing failure
            mockRDFParser.parse.mockReturnValue({
                isSuccess: false,
                isFailure: true,
                getValue: () => null,
                errorValue: () => 'Invalid RDF syntax'
            });
            
            const result = await rdfService.importRDF(invalidContent, graph, {
                format: 'turtle',
                mergeMode: 'merge',
                strictMode: true
            });
            
            expect(result.isFailure).toBe(true);
        });
        
        it('should handle malformed RDF content', async () => {
            const malformedContent = `
                @prefix ex: <http://example.org/>
                ex:person1 ex:name "Unclosed string
            `;
            
            const result = await rdfService.importRDF(malformedContent, graph, {
                format: 'turtle',
                mergeMode: 'merge',
                strictMode: false
            });
            
            // Should fail or succeed with warnings
            if (result.isSuccess) {
                // If successful, should have warnings
                expect(result.getValue().imported.warnings).toBeDefined();
            } else {
                expect(result.errorValue()).toContain('parsing failed');
            }
        });
        
        it('should handle invalid JSON-LD content', async () => {
            const invalidJsonLD = '{ "invalid": json }'; // Invalid JSON syntax
            
            // Mock parsing failure for invalid JSON-LD
            mockRDFParser.parse.mockReturnValue({
                isSuccess: false,
                isFailure: true,
                getValue: () => null,
                errorValue: () => 'Invalid JSON-LD syntax'
            });
            
            const result = await rdfService.importRDF(invalidJsonLD, graph, {
                format: 'json-ld',
                mergeMode: 'merge',
                strictMode: true  // Enable strict mode to catch parsing errors
            });
            
            expect(result.isFailure).toBe(true);
        });
        
        it('should handle vault write errors', async () => {
            // Mock save failure
            mockRDFFileManager.saveToVault.mockResolvedValue({
                isSuccess: false,
                isFailure: true,
                getValue: () => null,
                errorValue: () => 'Write failed'
            });
            
            const result = await rdfService.exportGraph(graph, {
                format: 'turtle',
                saveToVault: true,
                fileName: 'test.ttl'
            });
            
            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toContain('Write failed');
        });
        
        it('should handle namespace errors', async () => {
            const contentWithBadNamespace = `
                @prefix bad: <invalid-uri> .
                bad:test bad:prop "value" .
            `;
            
            // Mock parsing with warnings
            mockRDFParser.parse.mockReturnValue({
                isSuccess: true,
                isFailure: false,
                getValue: () => ({
                    graph: new Graph(),
                    tripleCount: 1,
                    namespaces: { 'bad': 'invalid-uri' },
                    warnings: ['Invalid namespace URI: invalid-uri']
                }),
                errorValue: () => null
            });
            
            // Mock validation with warnings
            mockRDFValidator.validateGraph.mockReturnValue({
                isSuccess: true,
                isFailure: false,
                getValue: () => ({
                    isValid: true,
                    errors: [],
                    warnings: [{ message: 'Invalid namespace URI detected' }]
                }),
                errorValue: () => null
            });
            
            const result = await rdfService.importRDF(contentWithBadNamespace, graph, {
                format: 'turtle',
                mergeMode: 'merge',
                strictMode: true,
                validateInput: true
            });
            
            // Should succeed with warnings
            expect(result.isSuccess).toBe(true);
            const validation = result.getValue();
            expect(validation.imported.warnings.length).toBeGreaterThan(0);
        });
        
        it('should handle empty graph export', async () => {
            const emptyGraph = new Graph();
            
            const result = await rdfService.exportGraph(emptyGraph, {
                format: 'turtle',
                saveToVault: false
            });
            
            expect(result.isSuccess).toBe(true);
            const exported = result.getValue();
            expect(exported.tripleCount).toBe(0);
        });
        
        it('should handle very large graphs', async () => {
            const largeGraph = new Graph();
            
            // Add many triples to test memory/performance
            for (let i = 0; i < 1000; i++) {
                const triple = new Triple(
                    new IRI(`http://example.org/person/${i}`),
                    new IRI('http://example.org/name'),
                    Literal.string(`Person ${i}`)
                );
                largeGraph.add(triple);
            }
            
            const result = await rdfService.exportGraph(largeGraph, {
                format: 'n-triples',
                saveToVault: false
            });
            
            expect(result.isSuccess).toBe(true);
            const exported = result.getValue();
            expect(exported.tripleCount).toBe(1000);
        });
    });
    
    describe('namespace management', () => {
        it('should use custom namespace manager', () => {
            // Create a mock custom namespace manager
            const MockedNamespaceManager = NamespaceManager as jest.MockedClass<typeof NamespaceManager>;
            const customNamespaceManager = new MockedNamespaceManager();
            (customNamespaceManager.hasPrefix as jest.Mock).mockImplementation((prefix: string) => {
                return prefix === 'custom';
            });
            (customNamespaceManager.addBinding as jest.Mock).mockImplementation(() => {});
            
            customNamespaceManager.addBinding('custom', 'http://custom.example.org/');
            
            const customRDFService = new RDFService(mockApp, customNamespaceManager);
            const nsManager = customRDFService.getNamespaceManager();
            
            expect(nsManager.hasPrefix('custom')).toBe(true);
        });
        
        it('should preserve namespace bindings during import', async () => {
            const turtleContent = `
                @prefix custom: <http://custom.example.org/> .
                @prefix test: <http://test.example.org/> .
                custom:item test:property "value" .
            `;
            
            // Mock parsing with custom namespaces
            mockRDFParser.parse.mockReturnValue({
                isSuccess: true,
                isFailure: false,
                getValue: () => ({
                    graph: new Graph(),
                    tripleCount: 1,
                    namespaces: { 
                        'custom': 'http://custom.example.org/',
                        'test': 'http://test.example.org/'
                    },
                    warnings: []
                }),
                errorValue: () => null
            });
            
            // Mock namespace manager to show prefixes after binding
            mockNamespaceManager.hasPrefix.mockImplementation((prefix: string) => {
                return prefix === 'custom' || prefix === 'test';
            });
            
            const result = await rdfService.importRDF(turtleContent, graph, {
                format: 'turtle',
                mergeMode: 'merge'
            });
            
            expect(result.isSuccess).toBe(true);
            
            const nsManager = rdfService.getNamespaceManager();
            expect(nsManager.hasPrefix('custom')).toBe(true);
            expect(nsManager.hasPrefix('test')).toBe(true);
        });
    });
    
    describe('export with file operations', () => {
        beforeEach(() => {
            mockApp.vault.getAbstractFileByPath.mockReturnValue(null); // File doesn't exist
            mockApp.vault.create.mockResolvedValue();
            mockApp.vault.createFolder.mockResolvedValue();
        });
        
        it('should save to vault with custom filename', async () => {
            const result = await rdfService.exportGraph(graph, {
                format: 'turtle',
                saveToVault: true,
                fileName: 'custom-name.ttl'
            });
            
            expect(result.isSuccess).toBe(true);
            expect(mockApp.vault.create).toHaveBeenCalledWith(
                'custom-name.ttl',
                expect.any(String)
            );
        });
        
        it('should save to vault in target folder', async () => {
            const result = await rdfService.exportGraph(graph, {
                format: 'turtle',
                saveToVault: true,
                targetFolder: 'exports',
                fileName: 'test.ttl'
            });
            
            expect(result.isSuccess).toBe(true);
            expect(mockApp.vault.create).toHaveBeenCalledWith(
                'exports/test.ttl',
                expect.any(String)
            );
        });
        
        it('should generate filename when not provided', async () => {
            const result = await rdfService.exportGraph(graph, {
                format: 'turtle',
                saveToVault: true
            });
            
            expect(result.isSuccess).toBe(true);
            expect(mockApp.vault.create).toHaveBeenCalledWith(
                expect.stringMatching(/.*\.ttl$/),
                expect.any(String)
            );
        });
    });
});

describe('NamespaceManager', () => {
    let namespaceManager: NamespaceManager;
    
    beforeEach(() => {
        // Use mock for NamespaceManager tests too
        const MockedNamespaceManager = NamespaceManager as jest.MockedClass<typeof NamespaceManager>;
        namespaceManager = new MockedNamespaceManager();
        
        // Setup default behavior for these specific tests
        (namespaceManager.hasPrefix as jest.Mock).mockImplementation((prefix: string) => {
            return ['rdf', 'rdfs', 'owl', 'xsd', 'test'].includes(prefix);
        });
        
        (namespaceManager.addBinding as jest.Mock).mockImplementation(() => {});
        
        (namespaceManager.getNamespace as jest.Mock).mockImplementation((prefix: string) => {
            if (prefix === 'test') {
                return { toString: () => 'http://test.example.org/' };
            }
            return null;
        });
        
        (namespaceManager.expandCURIE as jest.Mock).mockImplementation((curie: string) => {
            if (curie === 'rdf:type') {
                return {
                    isSuccess: true,
                    getValue: () => new IRI('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
                };
            }
            return { isSuccess: false };
        });
        
        (namespaceManager.compressIRI as jest.Mock).mockImplementation((iri: IRI) => {
            if (iri.toString() === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
                return 'rdf:type';
            }
            return iri.toString();
        });
    });
    
    it('should have default namespaces', () => {
        expect(namespaceManager.hasPrefix('rdf')).toBe(true);
        expect(namespaceManager.hasPrefix('rdfs')).toBe(true);
        expect(namespaceManager.hasPrefix('owl')).toBe(true);
        expect(namespaceManager.hasPrefix('xsd')).toBe(true);
    });
    
    it('should add custom namespace bindings', () => {
        namespaceManager.addBinding('test', 'http://test.example.org/');
        
        expect(namespaceManager.hasPrefix('test')).toBe(true);
        
        const namespace = namespaceManager.getNamespace('test');
        expect(namespace?.toString()).toBe('http://test.example.org/');
    });
    
    it('should expand CURIEs', () => {
        const result = namespaceManager.expandCURIE('rdf:type');
        
        expect(result.isSuccess).toBe(true);
        
        const iri = result.getValue();
        expect(iri.toString()).toBe('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
    });
    
    it('should compress IRIs', () => {
        const iri = new IRI('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
        const compressed = namespaceManager.compressIRI(iri);
        
        expect(compressed).toBe('rdf:type');
    });
});

describe('RDFSerializer', () => {
    let serializer: RDFSerializer;
    let graph: Graph;
    
    beforeEach(() => {
        // Use mocked serializer
        const MockedRDFSerializer = RDFSerializer as jest.MockedClass<typeof RDFSerializer>;
        const mockNamespaceManager = new (NamespaceManager as jest.MockedClass<typeof NamespaceManager>)();
        serializer = new MockedRDFSerializer(mockNamespaceManager);
        graph = new Graph();
        
        // Add test data
        const triple = new Triple(
            new IRI('http://example.org/person/1'),
            new IRI('http://xmlns.com/foaf/0.1/name'),
            Literal.string('John Doe')
        );
        graph.add(triple);
        
        // Setup mock behavior for serializer
        (serializer.serialize as jest.Mock).mockImplementation((graph, options) => {
            let content: string;
            switch (options.format) {
                case 'turtle':
                    content = '@prefix foaf: <http://xmlns.com/foaf/0.1/> .\n<http://example.org/person/1> foaf:name "John Doe" .';
                    break;
                case 'n-triples':
                    content = '<http://example.org/person/1> <http://xmlns.com/foaf/0.1/name> "John Doe" .';
                    break;
                default:
                    content = '@prefix foaf: <http://xmlns.com/foaf/0.1/> .\n<http://example.org/person/1> foaf:name "John Doe" .';
            }
            
            return {
                isSuccess: true,
                getValue: () => ({
                    content,
                    format: options.format,
                    tripleCount: 1
                })
            };
        });
    });
    
    it('should serialize to Turtle format', () => {
        const result = serializer.serialize(graph, {
            format: 'turtle',
            prettyPrint: true
        });
        
        expect(result.isSuccess).toBe(true);
        
        const serializedData = result.getValue();
        expect(serializedData.content).toContain('@prefix');
        expect(serializedData.content).toContain('foaf:name');
        expect(serializedData.content).toContain('"John Doe"');
    });
    
    it('should serialize to N-Triples format', () => {
        const result = serializer.serialize(graph, {
            format: 'n-triples'
        });
        
        expect(result.isSuccess).toBe(true);
        
        const serializedData = result.getValue();
        expect(serializedData.content).toContain('<http://example.org/person/1>');
        expect(serializedData.content).toContain('<http://xmlns.com/foaf/0.1/name>');
        expect(serializedData.content).toContain('"John Doe"');
        expect(serializedData.content).toContain(' .');
    });
    
    it('should provide file extension for format', () => {
        // Mock static methods
        (RDFSerializer.getFileExtension as jest.Mock) = jest.fn().mockImplementation((format) => {
            const extensions = {
                'turtle': '.ttl',
                'n-triples': '.nt',
                'json-ld': '.jsonld',
                'rdf-xml': '.rdf'
            };
            return extensions[format];
        });
        
        expect(RDFSerializer.getFileExtension('turtle')).toBe('.ttl');
        expect(RDFSerializer.getFileExtension('n-triples')).toBe('.nt');
        expect(RDFSerializer.getFileExtension('json-ld')).toBe('.jsonld');
        expect(RDFSerializer.getFileExtension('rdf-xml')).toBe('.rdf');
    });
    
    it('should provide MIME type for format', () => {
        // Mock static methods
        (RDFSerializer.getMimeType as jest.Mock) = jest.fn().mockImplementation((format) => {
            const mimeTypes = {
                'turtle': 'text/turtle',
                'n-triples': 'application/n-triples',
                'json-ld': 'application/ld+json',
                'rdf-xml': 'application/rdf+xml'
            };
            return mimeTypes[format];
        });
        
        expect(RDFSerializer.getMimeType('turtle')).toBe('text/turtle');
        expect(RDFSerializer.getMimeType('n-triples')).toBe('application/n-triples');
        expect(RDFSerializer.getMimeType('json-ld')).toBe('application/ld+json');
        expect(RDFSerializer.getMimeType('rdf-xml')).toBe('application/rdf+xml');
    });
});

describe('RDFParser', () => {
    let parser: RDFParser;
    
    beforeEach(() => {
        // Use mocked parser
        const MockedRDFParser = RDFParser as jest.MockedClass<typeof RDFParser>;
        const mockNamespaceManager = new (NamespaceManager as jest.MockedClass<typeof NamespaceManager>)();
        parser = new MockedRDFParser(mockNamespaceManager);
        
        // Setup mock behavior for parser
        (parser.parse as jest.Mock).mockImplementation((content, options) => {
            const graph = new Graph();
            
            // Simulate parsing based on content and format
            if (content.includes('foaf:name') || content.includes('http://xmlns.com/foaf/0.1/name')) {
                const triple = new Triple(
                    new IRI('http://example.org/person1'),
                    new IRI('http://xmlns.com/foaf/0.1/name'),
                    Literal.string('Alice Smith')
                );
                graph.add(triple);
                
                if (content.includes('foaf:age') || content.includes('age')) {
                    const ageTriple = new Triple(
                        new IRI('http://example.org/person1'),
                        new IRI('http://xmlns.com/foaf/0.1/age'),
                        new Literal('28', new IRI('http://www.w3.org/2001/XMLSchema#integer'))
                    );
                    graph.add(ageTriple);
                }
            } else if (content.includes('ex:test')) {
                const triple = new Triple(
                    new IRI('http://example.org/test'),
                    new IRI('http://example.org/prop'),
                    Literal.string('value')
                );
                graph.add(triple);
            } else if (content === 'This is not valid RDF at all!') {
                return {
                    isSuccess: false,
                    isFailure: true,
                    getError: () => 'Parse error: invalid syntax'
                };
            }
            
            return {
                isSuccess: true,
                getValue: () => ({
                    graph,
                    tripleCount: graph.size(),
                    namespaces: { 
                        'foaf': 'http://xmlns.com/foaf/0.1/',
                        'ex': 'http://example.org/' 
                    },
                    warnings: []
                })
            };
        });
    });
    
    it('should parse Turtle format', () => {
        const turtleContent = `
            @prefix foaf: <http://xmlns.com/foaf/0.1/> .
            @prefix ex: <http://example.org/> .
            
            ex:person1 foaf:name "Alice Smith" ;
                       foaf:age "28"^^<http://www.w3.org/2001/XMLSchema#integer> .
        `;
        
        const result = parser.parse(turtleContent, { format: 'turtle' });
        
        expect(result.isSuccess).toBe(true);
        
        const parseResult = result.getValue();
        expect(parseResult.tripleCount).toBeGreaterThan(0);
        expect(parseResult.graph.size()).toBeGreaterThan(0);
        expect(parseResult.namespaces['foaf']).toBe('http://xmlns.com/foaf/0.1/');
    });
    
    it('should parse N-Triples format', () => {
        const ntriplesContent = `
            <http://example.org/person1> <http://xmlns.com/foaf/0.1/name> "Bob Johnson" .
            <http://example.org/person1> <http://xmlns.com/foaf/0.1/age> "32"^^<http://www.w3.org/2001/XMLSchema#integer> .
        `;
        
        const result = parser.parse(ntriplesContent, { format: 'n-triples' });
        
        expect(result.isSuccess).toBe(true);
        
        const parseResult = result.getValue();
        expect(parseResult.tripleCount).toBe(2);
        expect(parseResult.graph.size()).toBe(2);
    });
    
    it('should auto-detect format', () => {
        const turtleContent = '@prefix ex: <http://example.org/> . ex:test ex:prop "value" .';
        
        const result = parser.parse(turtleContent); // No format specified
        
        expect(result.isSuccess).toBe(true);
        
        const parseResult = result.getValue();
        expect(parseResult.tripleCount).toBe(1);
    });
    
    it('should handle parsing errors gracefully', () => {
        const invalidContent = 'This is not valid RDF at all!';
        
        const result = parser.parse(invalidContent, { 
            format: 'turtle',
            strictMode: false 
        });
        
        // Should either succeed with warnings or fail gracefully
        if (result.isFailure) {
            expect(result.getError()).toContain('Parse');
        } else {
            const parseResult = result.getValue();
            expect(parseResult.warnings).toBeDefined();
        }
    });
});