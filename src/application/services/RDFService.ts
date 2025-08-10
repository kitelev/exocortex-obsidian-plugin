/**
 * RDF Service - High-level service for RDF export/import operations
 * Combines RDFSerializer, RDFParser, and validation functionality
 */

import { App, Notice, TFile } from 'obsidian';
import { Graph } from '../../domain/semantic/core/Graph';
import { Triple, IRI, BlankNode, Literal } from '../../domain/semantic/core/Triple';
import { Result } from '../../domain/core/Result';
import { RDFSerializer, RDFFormat, SerializationOptions, SerializationResult } from './RDFSerializer';
import { RDFParser, ParseOptions, ParseResult } from './RDFParser';
import { NamespaceManager } from './NamespaceManager';

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

export interface ValidationError {
    type: 'error' | 'warning';
    message: string;
    triple?: Triple;
    location?: { line?: number; column?: number };
}

export class RDFService {
    private serializer: RDFSerializer;
    private parser: RDFParser;
    private namespaceManager: NamespaceManager;
    
    constructor(
        private app: App,
        namespaceManager?: NamespaceManager
    ) {
        this.namespaceManager = namespaceManager || new NamespaceManager();
        this.serializer = new RDFSerializer(this.namespaceManager);
        this.parser = new RDFParser(this.namespaceManager);
    }
    
    /**
     * Export graph to RDF format
     */
    async exportGraph(graph: Graph, options: RDFExportOptions): Promise<Result<SerializationResult>> {
        try {
            // Validate options
            const validationResult = this.validateExportOptions(options);
            if (validationResult.isFailure) {
                return Result.fail<SerializationResult>(validationResult.errorValue());
            }
            
            // Prepare serialization options
            const serializationOptions: SerializationOptions = {
                format: options.format,
                includeComments: options.includeComments ?? true,
                prettyPrint: options.prettyPrint ?? true,
                baseIRI: options.baseIRI,
                namespaceManager: this.namespaceManager
            };
            
            // Serialize graph
            const result = this.serializer.serialize(graph, serializationOptions);
            if (result.isFailure) {
                return result;
            }
            
            const serializedData = result.getValue();
            
            // Save to vault if requested
            if (options.saveToVault) {
                const fileName = this.generateFileName(options.fileName, options.format);
                const filePath = options.targetFolder ? `${options.targetFolder}/${fileName}` : fileName;
                
                await this.saveToVault(serializedData.content, filePath);
                
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
            // Validate options
            const validationResult = this.validateImportOptions(options);
            if (validationResult.isFailure) {
                return Result.fail<{ graph: Graph; imported: ParseResult }>(validationResult.errorValue());
            }
            
            // Prepare parse options
            const parseOptions: ParseOptions = {
                format: options.format,
                baseIRI: options.baseIRI,
                namespaceManager: this.namespaceManager,
                validateInput: options.validateInput ?? true,
                strictMode: options.strictMode ?? false
            };
            
            // Parse RDF content
            const parseResult = this.parser.parse(content, parseOptions);
            if (parseResult.isFailure) {
                return Result.fail(`Import parsing failed: ${parseResult.errorValue()}`);
            }
            
            const imported = parseResult.getValue();
            
            // Validate imported graph
            const validationErrors = this.validateImportedGraph(imported.graph);
            if (validationErrors.length > 0 && options.strictMode) {
                return Result.fail(`Import validation failed: ${validationErrors.map(e => e.message).join('; ')}`);
            }
            
            // Handle merge mode
            let finalGraph: Graph;
            
            if (options.mergeMode === 'replace') {
                finalGraph = imported.graph;
            } else {
                // Merge with existing graph
                finalGraph = graph.clone();
                finalGraph.merge(imported.graph);
            }
            
            // Update namespace manager with imported namespaces
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
            const content = await this.app.vault.read(file);
            
            // Auto-detect format from file extension if not specified
            if (!options.format) {
                options.format = this.detectFormatFromFileName(file.name);
            }
            
            return await this.importRDF(content, graph, options);
        } catch (error) {
            return Result.fail(`Failed to read vault file: ${error.message}`);
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
            // Convert query results to graph
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
     * Validate export options
     */
    private validateExportOptions(options: RDFExportOptions): Result<void> {
        if (!options.format) {
            return Result.fail('Export format is required');
        }
        
        const supportedFormats: RDFFormat[] = ['turtle', 'ntriples', 'jsonld', 'rdfxml'];
        if (!supportedFormats.includes(options.format)) {
            return Result.fail(`Unsupported export format: ${options.format}`);
        }
        
        if (options.baseIRI) {
            try {
                new URL(options.baseIRI);
            } catch {
                return Result.fail('Invalid base IRI format');
            }
        }
        
        return Result.ok(undefined);
    }
    
    /**
     * Validate import options
     */
    private validateImportOptions(options: RDFImportOptions): Result<void> {
        if (options.format) {
            const supportedFormats: RDFFormat[] = ['turtle', 'ntriples', 'jsonld', 'rdfxml'];
            if (!supportedFormats.includes(options.format)) {
                return Result.fail(`Unsupported import format: ${options.format}`);
            }
        }
        
        if (!['merge', 'replace'].includes(options.mergeMode)) {
            return Result.fail('Invalid merge mode: must be "merge" or "replace"');
        }
        
        if (options.baseIRI) {
            try {
                new URL(options.baseIRI);
            } catch {
                return Result.fail('Invalid base IRI format');
            }
        }
        
        return Result.ok(undefined);
    }
    
    /**
     * Validate imported graph
     */
    private validateImportedGraph(graph: Graph): ValidationError[] {
        const errors: ValidationError[] = [];
        
        for (const triple of graph.toArray()) {
            // Check for valid subject
            const subject = triple.getSubject();
            if (!(subject instanceof IRI) && !(subject instanceof BlankNode)) {
                errors.push({
                    type: 'error',
                    message: 'Invalid subject: must be IRI or BlankNode',
                    triple
                });
            }
            
            // Check for valid predicate
            const predicate = triple.getPredicate();
            if (!(predicate instanceof IRI)) {
                errors.push({
                    type: 'error',
                    message: 'Invalid predicate: must be IRI',
                    triple
                });
            }
            
            // Check for valid object (any node type is valid)
            const object = triple.getObject();
            if (!(object instanceof IRI) && !(object instanceof BlankNode) && !(object instanceof Literal)) {
                errors.push({
                    type: 'error',
                    message: 'Invalid object: must be IRI, BlankNode, or Literal',
                    triple
                });
            }
            
            // Check for suspicious patterns
            if (subject instanceof IRI && !this.isValidIRI(subject.toString())) {
                errors.push({
                    type: 'warning',
                    message: 'Potentially invalid IRI format in subject',
                    triple
                });
            }
            
            if (predicate instanceof IRI && !this.isValidIRI(predicate.toString())) {
                errors.push({
                    type: 'warning',
                    message: 'Potentially invalid IRI format in predicate',
                    triple
                });
            }
        }
        
        return errors;
    }
    
    /**
     * Check if IRI format is valid
     */
    private isValidIRI(iri: string): boolean {
        try {
            new URL(iri);
            return true;
        } catch {
            // Check if it's a valid CURIE format
            return /^[a-zA-Z][a-zA-Z0-9]*:[a-zA-Z_][a-zA-Z0-9_-]*$/.test(iri);
        }
    }
    
    /**
     * Convert SPARQL query results to graph
     */
    private convertQueryResultsToGraph(results: any[]): Graph {
        const graph = new Graph();
        
        // This is a simplified conversion - in practice, you'd need to handle
        // different query result formats more comprehensively
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
            // Try to detect if it's an IRI, blank node, or literal
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
            // Handle structured query result values
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
     * Detect format from file name
     */
    private detectFormatFromFileName(fileName: string): RDFFormat | undefined {
        const extension = fileName.toLowerCase().split('.').pop();
        
        switch (extension) {
            case 'ttl': return 'turtle';
            case 'nt': return 'ntriples';
            case 'jsonld': return 'jsonld';
            case 'rdf': case 'xml': return 'rdfxml';
            case 'n3': return 'turtle'; // N3 is similar to Turtle
            default: return undefined;
        }
    }
    
    /**
     * Generate file name with appropriate extension
     */
    private generateFileName(baseName: string = 'export', format: RDFFormat): string {
        const extension = RDFSerializer.getFileExtension(format);
        return baseName.endsWith(extension) ? baseName : `${baseName}${extension}`;
    }
    
    /**
     * Save content to vault
     */
    private async saveToVault(content: string, filePath: string): Promise<void> {
        try {
            // Ensure target directory exists
            const pathParts = filePath.split('/');
            if (pathParts.length > 1) {
                const dirPath = pathParts.slice(0, -1).join('/');
                const dir = this.app.vault.getAbstractFileByPath(dirPath);
                if (!dir) {
                    await this.app.vault.createFolder(dirPath);
                }
            }
            
            // Create or update file
            const existingFile = this.app.vault.getAbstractFileByPath(filePath);
            if (existingFile instanceof TFile) {
                await this.app.vault.modify(existingFile, content);
            } else {
                await this.app.vault.create(filePath, content);
            }
        } catch (error) {
            throw new Error(`Failed to save to vault: ${error.message}`);
        }
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
        return ['turtle', 'ntriples', 'jsonld', 'rdfxml'];
    }
    
    /**
     * Get format information
     */
    getFormatInfo(format: RDFFormat): { extension: string; mimeType: string; name: string } {
        const formatMap = {
            turtle: { extension: '.ttl', mimeType: 'text/turtle', name: 'Turtle' },
            ntriples: { extension: '.nt', mimeType: 'application/n-triples', name: 'N-Triples' },
            jsonld: { extension: '.jsonld', mimeType: 'application/ld+json', name: 'JSON-LD' },
            rdfxml: { extension: '.rdf', mimeType: 'application/rdf+xml', name: 'RDF/XML' }
        };
        
        return formatMap[format];
    }
}