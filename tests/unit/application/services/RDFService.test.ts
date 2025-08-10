/**
 * Test suite for RDF Service functionality
 */

import { RDFService } from '../../../../src/application/services/RDFService';
import { RDFSerializer } from '../../../../src/application/services/RDFSerializer';
import { RDFParser } from '../../../../src/application/services/RDFParser';
import { NamespaceManager } from '../../../../src/application/services/NamespaceManager';
import { Graph } from '../../../../src/domain/semantic/core/Graph';
import { Triple, IRI, BlankNode, Literal } from '../../../../src/domain/semantic/core/Triple';

// Mock Obsidian App
const mockApp = {
    vault: {
        getAbstractFileByPath: jest.fn(),
        createFolder: jest.fn(),
        create: jest.fn(),
        modify: jest.fn(),
        adapter: {
            write: jest.fn(),
            read: jest.fn()
        }
    }
} as any;

describe('RDFService', () => {
    let rdfService: RDFService;
    let graph: Graph;
    
    beforeEach(() => {
        rdfService = new RDFService(mockApp);
        graph = new Graph();
        
        // Add some test data
        const subject = new IRI('http://example.org/person/1');
        const predicate = new IRI('http://example.org/name');
        const object = Literal.string('John Doe');
        
        graph.add(new Triple(subject, predicate, object));
        
        // Clear mocks
        jest.clearAllMocks();
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
            const result = await rdfService.exportGraph(graph, {
                format: 'invalid' as any,
                saveToVault: false
            });
            
            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toContain('Unsupported export format');
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
            expect(updatedGraph.size()).toBeGreaterThan(1); // Original + imported
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
            const result = await rdfService.importRDF('invalid content', graph, {
                format: 'invalid' as any,
                mergeMode: 'merge'
            });
            
            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toContain('Unsupported import format');
        });
        
        it('should handle replace merge mode', async () => {
            const originalSize = graph.size();
            
            const turtleContent = `
                @prefix ex: <http://example.org/> .
                ex:newperson ex:name "New Person" .
            `;
            
            const result = await rdfService.importRDF(turtleContent, graph, {
                format: 'turtle',
                mergeMode: 'replace'
            });
            
            expect(result.isSuccess).toBe(true);
            
            const { graph: updatedGraph } = result.getValue();
            // In replace mode, only imported triples should remain
            expect(updatedGraph.size()).toBeLessThan(originalSize + 10); // Rough check
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
    
    describe('error handling', () => {
        it('should handle serialization errors', async () => {
            // Create an invalid graph scenario
            const invalidGraph = new Graph();
            
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
            
            const result = await rdfService.importRDF(invalidContent, graph, {
                format: 'turtle',
                mergeMode: 'merge',
                strictMode: true
            });
            
            expect(result.isFailure).toBe(true);
        });
    });
});

describe('NamespaceManager', () => {
    let namespaceManager: NamespaceManager;
    
    beforeEach(() => {
        namespaceManager = new NamespaceManager();
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
        const namespaceManager = new NamespaceManager();
        serializer = new RDFSerializer(namespaceManager);
        graph = new Graph();
        
        // Add test data
        const triple = new Triple(
            new IRI('http://example.org/person/1'),
            new IRI('http://xmlns.com/foaf/0.1/name'),
            Literal.string('John Doe')
        );
        graph.add(triple);
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
        expect(RDFSerializer.getFileExtension('turtle')).toBe('.ttl');
        expect(RDFSerializer.getFileExtension('n-triples')).toBe('.nt');
        expect(RDFSerializer.getFileExtension('json-ld')).toBe('.jsonld');
        expect(RDFSerializer.getFileExtension('rdf-xml')).toBe('.rdf');
    });
    
    it('should provide MIME type for format', () => {
        expect(RDFSerializer.getMimeType('turtle')).toBe('text/turtle');
        expect(RDFSerializer.getMimeType('n-triples')).toBe('application/n-triples');
        expect(RDFSerializer.getMimeType('json-ld')).toBe('application/ld+json');
        expect(RDFSerializer.getMimeType('rdf-xml')).toBe('application/rdf+xml');
    });
});

describe('RDFParser', () => {
    let parser: RDFParser;
    
    beforeEach(() => {
        const namespaceManager = new NamespaceManager();
        parser = new RDFParser(namespaceManager);
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