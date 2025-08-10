import { ISuggestionRepository } from '../../domain/repositories/ISuggestionRepository';
import { SPARQLSuggestion, SuggestionType } from '../../domain/autocomplete/SPARQLSuggestion';
import { QueryContext, ClauseType } from '../../domain/autocomplete/QueryContext';
import { Result } from '../../domain/core/Result';
import { Graph } from '../../domain/semantic/core/Graph';
import { KeywordSuggestionProvider } from '../autocomplete/KeywordSuggestionProvider';

interface UsageStats {
    [key: string]: {
        count: number;
        lastUsed: number;
    };
}

export class GraphSuggestionRepository implements ISuggestionRepository {
    private keywordProvider = new KeywordSuggestionProvider();
    private usageStats: UsageStats = {};
    private propertyCache: Map<string, SPARQLSuggestion[]> = new Map();
    private classCache: Map<string, SPARQLSuggestion[]> = new Map();
    private cacheTimestamp = 0;
    private readonly cacheTTL = 60000; // 1 minute

    constructor(private readonly graph: Graph) {}

    async findKeywordSuggestions(context: QueryContext): Promise<Result<SPARQLSuggestion[]>> {
        try {
            const suggestions = this.keywordProvider.getSuggestions(context);
            return Result.ok(suggestions);
        } catch (error) {
            return Result.fail(`Failed to get keyword suggestions: ${error}`);
        }
    }

    async findPropertySuggestions(context: QueryContext): Promise<Result<SPARQLSuggestion[]>> {
        try {
            if (this.shouldRefreshCache()) {
                this.refreshPropertyCache();
            }

            const cachedSuggestions = this.propertyCache.get(context.getCurrentToken());
            if (cachedSuggestions) {
                return Result.ok(cachedSuggestions);
            }

            const properties = this.extractPropertiesFromGraph();
            const suggestions = properties.map(prop => this.createPropertySuggestion(prop, context));
            
            this.propertyCache.set(context.getCurrentToken(), suggestions);
            return Result.ok(suggestions);
        } catch (error) {
            return Result.fail(`Failed to get property suggestions: ${error}`);
        }
    }

    async findClassSuggestions(context: QueryContext): Promise<Result<SPARQLSuggestion[]>> {
        try {
            if (this.shouldRefreshCache()) {
                this.refreshClassCache();
            }

            const cachedSuggestions = this.classCache.get(context.getCurrentToken());
            if (cachedSuggestions) {
                return Result.ok(cachedSuggestions);
            }

            const classes = this.extractClassesFromGraph();
            const suggestions = classes.map(cls => this.createClassSuggestion(cls, context));
            
            this.classCache.set(context.getCurrentToken(), suggestions);
            return Result.ok(suggestions);
        } catch (error) {
            return Result.fail(`Failed to get class suggestions: ${error}`);
        }
    }

    async findVariableSuggestions(context: QueryContext): Promise<Result<SPARQLSuggestion[]>> {
        try {
            const suggestions: SPARQLSuggestion[] = [];
            const existingVariables = context.getVariablesInScope();
            const currentToken = context.getCurrentToken();

            // Suggest reuse of existing variables
            for (const variable of existingVariables) {
                const varName = `?${variable}`;
                if (!currentToken || varName.startsWith(currentToken)) {
                    suggestions.push(SPARQLSuggestion.create({
                        id: `var_existing_${variable}`,
                        text: varName,
                        insertText: varName,
                        type: SuggestionType.VARIABLE,
                        confidence: 0.9,
                        contextualScore: 0.95,
                        metadata: {
                            description: 'Existing variable in query',
                            usage: 'Reuse this variable to join patterns'
                        }
                    }));
                }
            }

            // Suggest common variable names
            const commonVariables = [
                { name: 'subject', desc: 'Subject of a triple' },
                { name: 'predicate', desc: 'Predicate/property' },
                { name: 'object', desc: 'Object value' },
                { name: 'type', desc: 'RDF type/class' },
                { name: 'label', desc: 'Human-readable label' },
                { name: 'value', desc: 'Generic value' },
                { name: 'name', desc: 'Name property' },
                { name: 'id', desc: 'Identifier' },
                { name: 'date', desc: 'Date/time value' },
                { name: 'count', desc: 'Count aggregate' }
            ];

            for (const { name, desc } of commonVariables) {
                const varName = `?${name}`;
                if (!existingVariables.includes(name) && (!currentToken || varName.startsWith(currentToken))) {
                    suggestions.push(SPARQLSuggestion.create({
                        id: `var_common_${name}`,
                        text: varName,
                        insertText: varName,
                        type: SuggestionType.VARIABLE,
                        confidence: 0.7,
                        contextualScore: 0.6,
                        metadata: {
                            description: desc,
                            usage: `Common variable name for ${desc.toLowerCase()}`
                        }
                    }));
                }
            }

            return Result.ok(suggestions);
        } catch (error) {
            return Result.fail(`Failed to get variable suggestions: ${error}`);
        }
    }

    async findNamespaceSuggestions(context: QueryContext): Promise<Result<SPARQLSuggestion[]>> {
        try {
            const namespaces = [
                { prefix: 'rdf:', uri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#' },
                { prefix: 'rdfs:', uri: 'http://www.w3.org/2000/01/rdf-schema#' },
                { prefix: 'owl:', uri: 'http://www.w3.org/2002/07/owl#' },
                { prefix: 'xsd:', uri: 'http://www.w3.org/2001/XMLSchema#' },
                { prefix: 'skos:', uri: 'http://www.w3.org/2004/02/skos/core#' },
                { prefix: 'foaf:', uri: 'http://xmlns.com/foaf/0.1/' },
                { prefix: 'dc:', uri: 'http://purl.org/dc/elements/1.1/' },
                { prefix: 'exo:', uri: 'http://example.org/exocortex#' }
            ];

            const suggestions = namespaces
                .filter(ns => !context.getCurrentToken() || ns.prefix.startsWith(context.getCurrentToken()))
                .map(ns => SPARQLSuggestion.create({
                    id: `namespace_${ns.prefix}`,
                    text: ns.prefix,
                    insertText: `PREFIX ${ns.prefix} <${ns.uri}>`,
                    type: SuggestionType.NAMESPACE,
                    confidence: 0.85,
                    contextualScore: 0.8,
                    metadata: {
                        description: `Namespace: ${ns.uri}`,
                        namespace: ns.uri
                    }
                }));

            return Result.ok(suggestions);
        } catch (error) {
            return Result.fail(`Failed to get namespace suggestions: ${error}`);
        }
    }

    async findFunctionSuggestions(context: QueryContext): Promise<Result<SPARQLSuggestion[]>> {
        try {
            const functions = [
                { name: 'STR', desc: 'Convert to string', example: 'STR(?value)' },
                { name: 'LANG', desc: 'Get language tag', example: 'LANG(?label)' },
                { name: 'DATATYPE', desc: 'Get datatype IRI', example: 'DATATYPE(?literal)' },
                { name: 'BOUND', desc: 'Test if variable is bound', example: 'BOUND(?var)' },
                { name: 'REGEX', desc: 'Regular expression match', example: 'REGEX(?text, "pattern")' },
                { name: 'CONTAINS', desc: 'String contains', example: 'CONTAINS(?str, "substring")' },
                { name: 'STRSTARTS', desc: 'String starts with', example: 'STRSTARTS(?str, "prefix")' },
                { name: 'STRENDS', desc: 'String ends with', example: 'STRENDS(?str, "suffix")' },
                { name: 'STRLEN', desc: 'String length', example: 'STRLEN(?str)' },
                { name: 'SUBSTR', desc: 'Substring', example: 'SUBSTR(?str, 1, 10)' },
                { name: 'UCASE', desc: 'Convert to uppercase', example: 'UCASE(?str)' },
                { name: 'LCASE', desc: 'Convert to lowercase', example: 'LCASE(?str)' },
                { name: 'COUNT', desc: 'Count aggregate', example: 'COUNT(?item)' },
                { name: 'SUM', desc: 'Sum aggregate', example: 'SUM(?value)' },
                { name: 'AVG', desc: 'Average aggregate', example: 'AVG(?value)' },
                { name: 'MIN', desc: 'Minimum value', example: 'MIN(?value)' },
                { name: 'MAX', desc: 'Maximum value', example: 'MAX(?value)' },
                { name: 'NOW', desc: 'Current date/time', example: 'NOW()' },
                { name: 'YEAR', desc: 'Extract year', example: 'YEAR(?date)' },
                { name: 'MONTH', desc: 'Extract month', example: 'MONTH(?date)' }
            ];

            const currentToken = context.getCurrentToken().toUpperCase();
            const suggestions = functions
                .filter(fn => !currentToken || fn.name.startsWith(currentToken))
                .map(fn => SPARQLSuggestion.create({
                    id: `function_${fn.name.toLowerCase()}`,
                    text: fn.name,
                    insertText: fn.name + '(',
                    type: SuggestionType.FUNCTION,
                    confidence: 0.8,
                    contextualScore: context.isInClause(ClauseType.FILTER) ? 0.9 : 0.6,
                    metadata: {
                        description: fn.desc,
                        examples: [fn.example]
                    }
                }));

            return Result.ok(suggestions);
        } catch (error) {
            return Result.fail(`Failed to get function suggestions: ${error}`);
        }
    }

    async findTemplateSuggestions(context: QueryContext): Promise<Result<SPARQLSuggestion[]>> {
        try {
            const templates = [
                {
                    name: 'Basic SELECT Query',
                    template: 'SELECT ?subject ?predicate ?object\nWHERE {\n  ?subject ?predicate ?object .\n}\nLIMIT 100',
                    description: 'Simple triple pattern query'
                },
                {
                    name: 'Find All Classes',
                    template: 'SELECT DISTINCT ?class\nWHERE {\n  ?instance rdf:type ?class .\n}\nORDER BY ?class',
                    description: 'List all classes in the graph'
                },
                {
                    name: 'Find All Properties',
                    template: 'SELECT DISTINCT ?property\nWHERE {\n  ?subject ?property ?object .\n}\nORDER BY ?property',
                    description: 'List all properties used in the graph'
                },
                {
                    name: 'Get Class Instances',
                    template: 'SELECT ?instance ?label\nWHERE {\n  ?instance rdf:type <ClassURI> .\n  OPTIONAL { ?instance rdfs:label ?label }\n}',
                    description: 'Find all instances of a specific class'
                },
                {
                    name: 'Count by Type',
                    template: 'SELECT ?type (COUNT(?instance) AS ?count)\nWHERE {\n  ?instance rdf:type ?type .\n}\nGROUP BY ?type\nORDER BY DESC(?count)',
                    description: 'Count instances per class'
                },
                {
                    name: 'Search by Label',
                    template: 'SELECT ?resource ?label\nWHERE {\n  ?resource rdfs:label ?label .\n  FILTER(CONTAINS(LCASE(?label), "search term"))\n}',
                    description: 'Find resources by label text'
                }
            ];

            const suggestions = templates.map((template, index) => 
                SPARQLSuggestion.create({
                    id: `template_${index}`,
                    text: template.name,
                    insertText: template.template,
                    type: SuggestionType.TEMPLATE,
                    confidence: 0.75,
                    contextualScore: context.isStartOfQuery() ? 0.9 : 0.3,
                    metadata: {
                        description: template.description,
                        documentation: 'Query template - customize as needed'
                    }
                })
            );

            return Result.ok(suggestions);
        } catch (error) {
            return Result.fail(`Failed to get template suggestions: ${error}`);
        }
    }

    async updateUsageStatistics(suggestionId: string, selected: boolean): Promise<Result<void>> {
        try {
            if (!this.usageStats[suggestionId]) {
                this.usageStats[suggestionId] = { count: 0, lastUsed: 0 };
            }
            
            if (selected) {
                this.usageStats[suggestionId].count++;
                this.usageStats[suggestionId].lastUsed = Date.now();
            }
            
            return Result.ok();
        } catch (error) {
            return Result.fail(`Failed to update usage statistics: ${error}`);
        }
    }

    async getPopularSuggestions(limit: number): Promise<Result<SPARQLSuggestion[]>> {
        try {
            const sortedIds = Object.entries(this.usageStats)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, limit)
                .map(([id]) => id);
            
            // This would need to reconstruct suggestions from IDs
            // For now, return empty array
            return Result.ok([]);
        } catch (error) {
            return Result.fail(`Failed to get popular suggestions: ${error}`);
        }
    }

    private extractPropertiesFromGraph(): Array<{ uri: string; frequency: number }> {
        const properties = new Map<string, number>();
        
        try {
            // Use match with undefined to get all triples
            const triples = this.graph.match(undefined, undefined, undefined);
            for (const triple of triples) {
                const predicate = triple.getPredicate().toString();
                properties.set(predicate, (properties.get(predicate) || 0) + 1);
            }
        } catch (error) {
            console.warn('Failed to extract properties from graph:', error);
        }
        
        return Array.from(properties.entries())
            .map(([uri, frequency]) => ({ uri, frequency }))
            .sort((a, b) => b.frequency - a.frequency);
    }

    private extractClassesFromGraph(): Array<{ uri: string; instanceCount: number }> {
        const classes = new Map<string, number>();
        const rdfType = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
        
        try {
            // Use match with undefined to get all triples
            const triples = this.graph.match(undefined, undefined, undefined);
            for (const triple of triples) {
                if (triple.getPredicate().toString() === rdfType) {
                    const classUri = triple.getObject().toString();
                    classes.set(classUri, (classes.get(classUri) || 0) + 1);
                }
            }
        } catch (error) {
            console.warn('Failed to extract classes from graph:', error);
        }
        
        return Array.from(classes.entries())
            .map(([uri, instanceCount]) => ({ uri, instanceCount }))
            .sort((a, b) => b.instanceCount - a.instanceCount);
    }

    private createPropertySuggestion(property: { uri: string; frequency: number }, context: QueryContext): SPARQLSuggestion {
        const shortName = this.getShortName(property.uri);
        const confidence = Math.min(0.9, 0.5 + (property.frequency / 100));
        
        return SPARQLSuggestion.create({
            id: `property_${property.uri}`,
            text: shortName,
            insertText: shortName,
            type: SuggestionType.PROPERTY,
            confidence,
            contextualScore: context.isInClause(ClauseType.WHERE) ? 0.9 : 0.5,
            metadata: {
                description: `Property (used ${property.frequency} times)`,
                namespace: property.uri
            }
        });
    }

    private createClassSuggestion(cls: { uri: string; instanceCount: number }, context: QueryContext): SPARQLSuggestion {
        const shortName = this.getShortName(cls.uri);
        const confidence = Math.min(0.9, 0.5 + (cls.instanceCount / 50));
        
        return SPARQLSuggestion.create({
            id: `class_${cls.uri}`,
            text: shortName,
            insertText: shortName,
            type: SuggestionType.CLASS,
            confidence,
            contextualScore: this.isAfterRdfType(context) ? 0.95 : 0.6,
            metadata: {
                description: `Class (${cls.instanceCount} instances)`,
                namespace: cls.uri
            }
        });
    }

    private getShortName(uri: string): string {
        const hashIndex = uri.lastIndexOf('#');
        const slashIndex = uri.lastIndexOf('/');
        const splitIndex = Math.max(hashIndex, slashIndex);
        
        if (splitIndex > 0 && splitIndex < uri.length - 1) {
            return uri.substring(splitIndex + 1);
        }
        
        return uri;
    }

    private isAfterRdfType(context: QueryContext): boolean {
        const previousTokens = context.getPreviousTokens();
        if (previousTokens.length < 2) return false;
        
        const lastTwo = previousTokens.slice(-2).join(' ').toLowerCase();
        return lastTwo.includes('rdf:type') || lastTwo.includes(' a ');
    }

    private shouldRefreshCache(): boolean {
        return Date.now() - this.cacheTimestamp > this.cacheTTL;
    }

    private refreshPropertyCache(): void {
        this.propertyCache.clear();
        this.cacheTimestamp = Date.now();
    }

    private refreshClassCache(): void {
        this.classCache.clear();
        this.cacheTimestamp = Date.now();
    }
}