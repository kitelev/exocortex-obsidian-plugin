/**
 * RDF Service - Coordinates RDF operations using specialized services
 * Follows Single Responsibility Principle by delegating to specific services
 */

import { App, Notice, TFile } from 'obsidian';
import { Graph } from '../../domain/semantic/core/Graph';
import { Triple, IRI, BlankNode, Literal } from '../../domain/semantic/core/Triple';
import { Result } from '../../domain/core/Result';
import { RDFSerializer, RDFFormat, SerializationOptions, SerializationResult } from './RDFSerializer';
import { RDFParser, ParseOptions, ParseResult } from './RDFParser';
import { NamespaceManager } from './NamespaceManager';
import { RDFValidator, ValidationOptions } from './RDFValidator';
import { RDFFileManager } from './RDFFileManager';

export interface RDFExportOptions {
    format: RDFFormat;
    includeComments?: boolean;
    prettyPrint?: boolean;
    baseIRI?: string;
    fileName?: string;
    saveToVault?: boolean;
    targetFolder?: string;
}

export interface RDFImportOptions {
    format?: RDFFormat;
    mergeMode: 'merge' | 'replace';
    validateInput?: boolean;
    strictMode?: boolean;
    baseIRI?: string;
}

export type { ValidationError } from './RDFValidator';

export class RDFService {
    private serializer: RDFSerializer;
    private parser: RDFParser;
    private validator: RDFValidator;
    private fileManager: RDFFileManager;
    private namespaceManager: NamespaceManager;
    
    constructor(
        private app: App,
        namespaceManager?: NamespaceManager
    ) {
        this.namespaceManager = namespaceManager || new NamespaceManager();
        this.serializer = new RDFSerializer(this.namespaceManager);
        this.parser = new RDFParser(this.namespaceManager);
        this.validator = new RDFValidator();
        this.fileManager = new RDFFileManager(app);
    }
    
    /**
     * Export graph to RDF format
     */
    async exportGraph(graph: Graph, options: RDFExportOptions): Promise<Result<SerializationResult>> {
        try {
            const validationResult = this.validator.validateExportOptions(options);
            if (validationResult.isFailure) {
                return Result.fail<SerializationResult>(validationResult.errorValue());
            }
            
            const serializationOptions: SerializationOptions = {
                format: options.format,
                includeComments: options.includeComments ?? true,
                prettyPrint: options.prettyPrint ?? true,
                baseIRI: options.baseIRI,
                namespaceManager: this.namespaceManager
            };
            
            const result = this.serializer.serialize(graph, serializationOptions);
            if (result.isFailure) {
                return result;
            }
            
            const serializedData = result.getValue();
            
            if (options.saveToVault) {
                const fileName = this.fileManager.generateFileName(options.fileName, options.format);
                const filePath = options.targetFolder ? `${options.targetFolder}/${fileName}` : fileName;
                
                const saveResult = await this.fileManager.saveToVault(serializedData.content, filePath);
                if (saveResult.isFailure) {
                    return Result.fail(saveResult.errorValue());
                }
                
                new Notice(`Exported ${serializedData.tripleCount} triples to ${filePath}`);
            }
            
            return result;
        } catch (error) {
            return Result.fail(`Export failed: ${error.message}`);
        }
    }
    
    /**
     * Import RDF data and merge with existing graph
     */
    async importRDF(
        content: string, 
        graph: Graph, 
        options: RDFImportOptions
    ): Promise<Result<{ graph: Graph; imported: ParseResult }>> {
        try {
            const validationResult = this.validator.validateImportOptions(options);
            if (validationResult.isFailure) {
                return Result.fail<{ graph: Graph; imported: ParseResult }>(validationResult.errorValue());
            }
            
            const parseOptions: ParseOptions = {
                format: options.format,
                baseIRI: options.baseIRI,
                namespaceManager: this.namespaceManager,
                validateInput: options.validateInput ?? true,
                strictMode: options.strictMode ?? false
            };
            
            const parseResult = this.parser.parse(content, parseOptions);
            if (parseResult.isFailure) {
                return Result.fail(`Import parsing failed: ${parseResult.errorValue()}`);
            }
            
            const imported = parseResult.getValue();
            
            if (options.validateInput) {
                const validationOptions: ValidationOptions = {
                    strictMode: options.strictMode,
                    checkDuplicates: true,
                    checkNamespaces: true,
                    checkLiterals: true
                };
                
                const graphValidation = this.validator.validateGraph(imported.graph, validationOptions);
                if (graphValidation.isFailure) {
                    return Result.fail(graphValidation.errorValue());
                }
                
                const validation = graphValidation.getValue();
                if (!validation.isValid && options.strictMode) {
                    const errorMessages = validation.errors.map(e => e.message).join('; ');
                    return Result.fail(`Import validation failed: ${errorMessages}`);
                }
                
                if (validation.warnings.length > 0) {
                    new Notice(`Import completed with ${validation.warnings.length} warnings`);
                }
            }
            
            let finalGraph: Graph;
            
            if (options.mergeMode === 'replace') {
                finalGraph = imported.graph;
            } else {
                finalGraph = graph.clone();
                finalGraph.merge(imported.graph);
            }
            
            for (const [prefix, namespace] of Object.entries(imported.namespaces)) {
                if (!this.namespaceManager.hasPrefix(prefix)) {
                    this.namespaceManager.addBinding(prefix, namespace);
                }
            }
            
            return Result.ok({ graph: finalGraph, imported });
            
        } catch (error) {
            return Result.fail(`Import failed: ${error.message}`);
        }
    }
    
    /**
     * Import RDF from vault file
     */
    async importFromVaultFile(file: TFile, graph: Graph, options: RDFImportOptions): Promise<Result<{ graph: Graph; imported: ParseResult }>> {
        try {
            const contentResult = await this.fileManager.readFromVault(file.path);
            if (contentResult.isFailure) {
                return Result.fail(contentResult.errorValue());
            }
            
            if (!options.format) {
                options.format = this.fileManager.detectFormatFromExtension(file.name);
            }
            
            return await this.importRDF(contentResult.getValue(), graph, options);
        } catch (error) {
            return Result.fail(`Failed to import from vault file: ${error.message}`);
        }
    }
    
    /**
     * Export SPARQL query results
     */
    async exportQueryResults(
        results: any[], 
        format: RDFFormat,
        fileName?: string,
        saveToVault: boolean = true
    ): Promise<Result<SerializationResult>> {
        try {
            const graph = this.convertQueryResultsToGraph(results);
            
            const options: RDFExportOptions = {
                format,
                fileName: fileName || 'sparql-results',
                saveToVault,
                includeComments: true,
                prettyPrint: true,
                targetFolder: 'exports'
            };
            
            return await this.exportGraph(graph, options);
        } catch (error) {
            return Result.fail(`Query results export failed: ${error.message}`);
        }
    }
    
    /**
     * Validate a graph
     */
    async validateGraph(graph: Graph, options?: ValidationOptions): Promise<Result<any>> {
        return this.validator.validateGraph(graph, options);
    }
    
    /**
     * List RDF files in vault
     */
    async listRDFFiles(folder?: string): Promise<Result<TFile[]>> {
        return this.fileManager.listRDFFiles(folder);
    }
    
    /**
     * Convert SPARQL query results to graph
     */
    private convertQueryResultsToGraph(results: any[]): Graph {
        const graph = new Graph();
        
        for (const result of results) {
            if (result.subject && result.predicate && result.object) {
                try {
                    const subject = this.createNodeFromValue(result.subject);
                    const predicate = this.createNodeFromValue(result.predicate) as IRI;
                    const object = this.createNodeFromValue(result.object);
                    
                    if (subject && predicate && object) {
                        const triple = new Triple(subject as IRI | BlankNode, predicate, object);
                        graph.add(triple);
                    }
                } catch (error) {
                    console.warn('Failed to convert query result to triple:', error);
                }
            }
        }
        
        return graph;
    }
    
    /**
     * Create RDF node from query result value
     */
    private createNodeFromValue(value: any): IRI | BlankNode | Literal | null {
        if (typeof value === 'string') {
            if (value.startsWith('_:')) {
                return new BlankNode(value);
            } else if (value.startsWith('http://') || value.startsWith('https://') || value.includes(':')) {
                try {
                    return new IRI(value);
                } catch {
                    return Literal.string(value);
                }
            } else {
                return Literal.string(value);
            }
        } else if (typeof value === 'number') {
            return Number.isInteger(value) ? Literal.integer(value) : Literal.double(value);
        } else if (typeof value === 'boolean') {
            return Literal.boolean(value);
        } else if (value && typeof value === 'object') {
            if (value.type === 'uri' || value.type === 'iri') {
                return new IRI(value.value);
            } else if (value.type === 'bnode') {
                return new BlankNode(value.value);
            } else if (value.type === 'literal') {
                if (value.datatype) {
                    return new Literal(value.value, new IRI(value.datatype));
                } else if (value.lang) {
                    return new Literal(value.value, undefined, value.lang);
                } else {
                    return new Literal(value.value);
                }
            }
        }
        
        return null;
    }
    
    /**
     * Get namespace manager instance
     */
    getNamespaceManager(): NamespaceManager {
        return this.namespaceManager;
    }
    
    /**
     * Get supported export formats
     */
    getSupportedFormats(): RDFFormat[] {
        return ['turtle', 'n-triples', 'json-ld', 'rdf-xml'];
    }
    
    /**
     * Get format information
     */
    getFormatInfo(format: RDFFormat): { extension: string; mimeType: string; name: string } {
        const formatMap = {
            'turtle': { extension: '.ttl', mimeType: 'text/turtle', name: 'Turtle' },
            'n-triples': { extension: '.nt', mimeType: 'application/n-triples', name: 'N-Triples' },
            'json-ld': { extension: '.jsonld', mimeType: 'application/ld+json', name: 'JSON-LD' },
            'rdf-xml': { extension: '.rdf', mimeType: 'application/rdf+xml', name: 'RDF/XML' }
        };
        
        return formatMap[format];
    }
}