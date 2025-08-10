import { Graph } from '../domain/semantic/core/Graph';
import { Triple, IRI, Literal } from '../domain/semantic/core/Triple';
import { QueryCache, QueryCacheConfig } from './services/QueryCache';

export interface ConstructResult {
    triples: Triple[];
    provenance: string;
    cached?: boolean;
}

export interface SelectResult {
    results: any[];
    cached?: boolean;
}

export class SPARQLEngine {
    private queryCache: QueryCache;

    constructor(private graph: Graph, cacheConfig?: Partial<QueryCacheConfig>) {
        this.queryCache = new QueryCache(cacheConfig);
    }
    
    /**
     * Execute CONSTRUCT query to generate new triples
     */
    construct(query: string): ConstructResult {
        // Check cache first
        const cacheKey = this.queryCache.createCacheKey(`CONSTRUCT:${query}`);
        const cachedResult = this.queryCache.get<ConstructResult>(cacheKey);
        
        if (cachedResult) {
            return { ...cachedResult, cached: true };
        }
        // Parse CONSTRUCT query
        const constructMatch = query.match(/CONSTRUCT\s*\{(.*?)\}\s*WHERE\s*\{(.*?)\}/is);
        if (!constructMatch) {
            throw new Error('Invalid CONSTRUCT query format');
        }
        
        const template = this.parseConstructTemplate(constructMatch[1]);
        const patterns = this.parsePatterns(constructMatch[2]);
        
        if (patterns.length === 0) {
            return { triples: [], provenance: `CONSTRUCT query at ${new Date().toISOString()}` };
        }
        
        const generatedTriples: Triple[] = [];
        
        // Handle multiple patterns by joining results
        if (patterns.length === 1) {
            // Single pattern - simple case
            const pattern = patterns[0];
            const matchedTriples = this.graph.match(
                pattern.subject.startsWith('?') ? null : pattern.subject,
                pattern.predicate.startsWith('?') ? null : pattern.predicate,
                pattern.object.startsWith('?') ? null : pattern.object
            );
            
            for (const triple of matchedTriples) {
                const binding = this.createBinding(pattern, triple);
                const newTriples = this.instantiateTemplate(template, binding);
                generatedTriples.push(...newTriples);
            }
        } else {
            // Multiple patterns - need to join bindings
            const bindings = this.executeWhereClause(patterns);
            
            for (const binding of bindings) {
                const newTriples = this.instantiateTemplate(template, binding);
                generatedTriples.push(...newTriples);
            }
        }
        
        // Apply LIMIT if present
        const limitMatch = query.match(/LIMIT\s+(\d+)/i);
        let result: ConstructResult;
        
        if (limitMatch) {
            const limit = parseInt(limitMatch[1]);
            result = {
                triples: generatedTriples.slice(0, limit),
                provenance: `CONSTRUCT query at ${new Date().toISOString()}`,
                cached: false
            };
        } else {
            result = {
                triples: generatedTriples,
                provenance: `CONSTRUCT query at ${new Date().toISOString()}`,
                cached: false
            };
        }
        
        // Cache the result
        this.queryCache.set(cacheKey, result);
        
        return result;
    }
    
    private parseConstructTemplate(templateClause: string): any[] {
        const templates: any[] = [];
        const lines = templateClause.trim().split(/[\.\n]/);
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            const parts = trimmed.split(/\s+/);
            if (parts.length >= 3) {
                templates.push({
                    subject: parts[0],
                    predicate: parts[1],
                    object: parts.slice(2).join(' ').replace(/["']/g, '')
                });
            }
        }
        
        return templates;
    }
    
    private createBinding(pattern: any, triple: Triple): Record<string, string> {
        const binding: Record<string, string> = {};
        
        if (pattern.subject.startsWith('?')) {
            binding[pattern.subject.substring(1)] = triple.getSubject().toString();
        }
        if (pattern.predicate.startsWith('?')) {
            binding[pattern.predicate.substring(1)] = triple.getPredicate().toString();
        }
        if (pattern.object.startsWith('?')) {
            binding[pattern.object.substring(1)] = triple.getObject().toString();
        }
        
        return binding;
    }
    
    private instantiateTemplate(template: any[], binding: Record<string, string>): Triple[] {
        const triples: Triple[] = [];
        
        for (const t of template) {
            const subjectStr = this.resolveValue(t.subject, binding);
            const predicateStr = this.resolveValue(t.predicate, binding);
            const objectStr = this.resolveValue(t.object, binding);
            
            if (subjectStr && predicateStr && objectStr) {
                // Create proper Triple objects
                const subject = new IRI(subjectStr);
                const predicate = new IRI(predicateStr);
                const object = objectStr.startsWith('"') 
                    ? Literal.string(objectStr.replace(/^"|"$/g, ''))
                    : new IRI(objectStr);
                
                triples.push(new Triple(subject, predicate, object));
            }
        }
        
        return triples;
    }
    
    private resolveValue(value: string, binding: Record<string, string>): string | null {
        if (value.startsWith('?')) {
            const varName = value.substring(1);
            return binding[varName] || null;
        }
        return value;
    }
    
    private executeWhereClause(patterns: any[]): Record<string, string>[] {
        if (patterns.length === 0) return [];
        
        // Start with first pattern
        const firstPattern = patterns[0];
        const firstTriples = this.graph.match(
            firstPattern.subject.startsWith('?') ? null : firstPattern.subject,
            firstPattern.predicate.startsWith('?') ? null : firstPattern.predicate,
            firstPattern.object.startsWith('?') ? null : firstPattern.object
        );
        
        let bindings: Record<string, string>[] = [];
        for (const triple of firstTriples) {
            bindings.push(this.createBinding(firstPattern, triple));
        }
        
        // Join with subsequent patterns
        for (let i = 1; i < patterns.length; i++) {
            const pattern = patterns[i];
            const newBindings: Record<string, string>[] = [];
            
            for (const binding of bindings) {
                // Resolve pattern with current binding
                const subjectStr = pattern.subject.startsWith('?') 
                    ? (binding[pattern.subject.substring(1)] || null)
                    : pattern.subject;
                const predicateStr = pattern.predicate.startsWith('?')
                    ? (binding[pattern.predicate.substring(1)] || null)
                    : pattern.predicate;
                const objectStr = pattern.object.startsWith('?')
                    ? (binding[pattern.object.substring(1)] || null)
                    : pattern.object;
                
                // Convert strings to proper types for match
                const subject = subjectStr ? new IRI(subjectStr) : null;
                const predicate = predicateStr ? new IRI(predicateStr) : null;
                const object = objectStr ? 
                    (objectStr.startsWith('"') ? Literal.string(objectStr.replace(/^"|"$/g, '')) : new IRI(objectStr))
                    : null;
                
                // Find matching triples
                const matches = this.graph.match(subject, predicate, object);
                
                for (const triple of matches) {
                    const extendedBinding = { ...binding };
                    
                    // Add new variable bindings
                    if (pattern.subject.startsWith('?') && !subjectStr) {
                        extendedBinding[pattern.subject.substring(1)] = triple.getSubject().toString();
                    }
                    if (pattern.predicate.startsWith('?') && !predicateStr) {
                        extendedBinding[pattern.predicate.substring(1)] = triple.getPredicate().toString();
                    }
                    if (pattern.object.startsWith('?') && !objectStr) {
                        extendedBinding[pattern.object.substring(1)] = triple.getObject().toString();
                    }
                    
                    newBindings.push(extendedBinding);
                }
            }
            
            bindings = newBindings;
        }
        
        return bindings;
    }
    
    select(query: string): SelectResult {
        // Check cache first
        const cacheKey = this.queryCache.createCacheKey(`SELECT:${query}`);
        const cachedResult = this.queryCache.get<SelectResult>(cacheKey);
        
        if (cachedResult) {
            return { ...cachedResult, cached: true };
        }

        // Very basic SPARQL SELECT implementation for MVP
        const results: any[] = [];
        
        // Parse basic SELECT ?var WHERE { ?s ?p ?o } pattern
        const selectMatch = query.match(/SELECT\s+(.*?)\s+WHERE\s*\{(.*?)\}/is);
        if (!selectMatch) {
            throw new Error('Invalid SPARQL query format');
        }
        
        const variables = this.parseVariables(selectMatch[1]);
        const patterns = this.parsePatterns(selectMatch[2]);
        
        if (patterns.length === 0) {
            const emptyResult: SelectResult = { results: [], cached: false };
            this.queryCache.set(cacheKey, emptyResult);
            return emptyResult;
        }
        
        // Execute first pattern (MVP - single pattern support)
        const pattern = patterns[0];
        const triples = this.graph.match(
            pattern.subject.startsWith('?') ? null : pattern.subject,
            pattern.predicate.startsWith('?') ? null : pattern.predicate,
            pattern.object.startsWith('?') ? null : pattern.object
        );
        
        // Bind variables
        for (const triple of triples) {
            const binding: any = {};
            
            if (pattern.subject.startsWith('?')) {
                const varName = pattern.subject.substring(1);
                if (variables.includes('*') || variables.includes(varName)) {
                    binding[varName] = triple.subject;
                }
            }
            
            if (pattern.predicate.startsWith('?')) {
                const varName = pattern.predicate.substring(1);
                if (variables.includes('*') || variables.includes(varName)) {
                    binding[varName] = triple.predicate;
                }
            }
            
            if (pattern.object.startsWith('?')) {
                const varName = pattern.object.substring(1);
                if (variables.includes('*') || variables.includes(varName)) {
                    binding[varName] = triple.object;
                }
            }
            
            if (Object.keys(binding).length > 0) {
                results.push(binding);
            }
        }
        
        // Apply LIMIT if present
        const limitMatch = query.match(/LIMIT\s+(\d+)/i);
        let result: SelectResult;
        
        if (limitMatch) {
            const limit = parseInt(limitMatch[1]);
            result = { results: results.slice(0, limit), cached: false };
        } else {
            result = { results, cached: false };
        }
        
        // Cache the result
        this.queryCache.set(cacheKey, result);
        
        return result;
    }
    
    private parseVariables(selectClause: string): string[] {
        const trimmed = selectClause.trim();
        if (trimmed === '*') {
            return ['*'];
        }
        
        const variables: string[] = [];
        const varPattern = /\?(\w+)/g;
        let match;
        while ((match = varPattern.exec(trimmed)) !== null) {
            variables.push(match[1]);
        }
        return variables;
    }
    
    private parsePatterns(whereClause: string): any[] {
        const patterns: any[] = [];
        
        // Simple triple pattern: ?s ?p ?o or with literals
        const lines = whereClause.trim().split(/[\.\n]/);
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            // Match triple pattern (very basic)
            const parts = trimmed.split(/\s+/);
            if (parts.length >= 3) {
                patterns.push({
                    subject: parts[0],
                    predicate: parts[1],
                    object: parts.slice(2).join(' ').replace(/["']/g, '')
                });
            }
        }
        
        return patterns;
    }

    /**
     * Get cache statistics
     */
    getCacheStatistics() {
        return this.queryCache.getStatistics();
    }

    /**
     * Invalidate all cached queries
     */
    invalidateCache(): void {
        this.queryCache.invalidateAll();
    }

    /**
     * Update cache configuration
     */
    updateCacheConfig(config: Partial<QueryCacheConfig>): void {
        this.queryCache.updateConfig(config);
    }

    /**
     * Get current cache configuration
     */
    getCacheConfig(): QueryCacheConfig {
        return this.queryCache.getConfig();
    }

    /**
     * Cleanup expired cache entries
     */
    cleanupCache(): number {
        return this.queryCache.cleanup();
    }

    /**
     * Destroy cache and cleanup resources
     */
    destroy(): void {
        this.queryCache.destroy();
    }
}
