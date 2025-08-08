import { Graph, Triple } from '../domain/Graph';

export class SPARQLEngine {
    constructor(private graph: Graph) {}
    
    select(query: string): any[] {
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
            return [];
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
        if (limitMatch) {
            const limit = parseInt(limitMatch[1]);
            return results.slice(0, limit);
        }
        
        return results;
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
}
