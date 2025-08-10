import { SPARQLSuggestion, SuggestionType } from '../../domain/autocomplete/SPARQLSuggestion';
import { QueryContext, QueryType, ClauseType } from '../../domain/autocomplete/QueryContext';
import { ISuggestionRepository } from '../../domain/repositories/ISuggestionRepository';
import { Result } from '../../domain/core/Result';
import { Graph } from '../../domain/semantic/core/Graph';

export interface AutocompleteOptions {
    maxSuggestions?: number;
    includeDescriptions?: boolean;
    contextBoost?: boolean;
    cacheResults?: boolean;
}

export class SPARQLAutocompleteService {
    private cache = new Map<string, { suggestions: SPARQLSuggestion[]; timestamp: number }>();
    private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes
    private readonly defaultMaxSuggestions = 20;

    constructor(
        private readonly suggestionRepository: ISuggestionRepository,
        private readonly graph: Graph
    ) {}

    async getSuggestions(
        query: string,
        cursorPosition: number,
        options: AutocompleteOptions = {}
    ): Promise<Result<SPARQLSuggestion[]>> {
        try {
            const context = this.analyzeContext(query, cursorPosition);
            
            if (options.cacheResults) {
                const cached = this.getCachedSuggestions(context);
                if (cached) {
                    return Result.ok(cached);
                }
            }

            const suggestions = await this.collectSuggestions(context, options);
            const rankedSuggestions = this.rankSuggestions(suggestions, context, options);
            const limitedSuggestions = rankedSuggestions.slice(0, options.maxSuggestions || this.defaultMaxSuggestions);

            if (options.cacheResults) {
                this.cacheSuggestions(context, limitedSuggestions);
            }

            return Result.ok(limitedSuggestions);
        } catch (error) {
            return Result.fail(`Failed to get suggestions: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private analyzeContext(query: string, cursorPosition: number): QueryContext {
        const tokens = this.tokenizeQuery(query, cursorPosition);
        const currentToken = this.getCurrentToken(query, cursorPosition);
        const previousTokens = tokens.filter(t => t.position < cursorPosition).map(t => t.text);
        const queryType = this.detectQueryType(tokens);
        const currentClause = this.detectCurrentClause(query, cursorPosition);
        const clauses = this.extractClauses(query);

        return QueryContext.create({
            query,
            cursorPosition,
            currentToken,
            previousTokens,
            queryType,
            currentClause,
            clauses
        });
    }

    private tokenizeQuery(query: string, upToCursor: number): Array<{ text: string; position: number }> {
        const tokens: Array<{ text: string; position: number }> = [];
        const regex = /\S+/g;
        let match;

        while ((match = regex.exec(query)) !== null) {
            if (match.index >= upToCursor) break;
            tokens.push({
                text: match[0],
                position: match.index
            });
        }

        return tokens;
    }

    private getCurrentToken(query: string, cursorPosition: number): string {
        const beforeCursor = query.substring(0, cursorPosition);
        const afterCursor = query.substring(cursorPosition);
        
        const beforeMatch = beforeCursor.match(/\S+$/);
        const afterMatch = afterCursor.match(/^\S+/);
        
        const before = beforeMatch ? beforeMatch[0] : '';
        const after = afterMatch ? afterMatch[0] : '';
        
        return before + after;
    }

    private detectQueryType(tokens: Array<{ text: string; position: number }>): QueryType | null {
        if (tokens.length === 0) return null;
        
        const firstToken = tokens[0].text.toUpperCase();
        
        switch (firstToken) {
            case 'SELECT': return QueryType.SELECT;
            case 'CONSTRUCT': return QueryType.CONSTRUCT;
            case 'ASK': return QueryType.ASK;
            case 'DESCRIBE': return QueryType.DESCRIBE;
            case 'INSERT': return QueryType.INSERT;
            case 'DELETE': return QueryType.DELETE;
            default: return null;
        }
    }

    private detectCurrentClause(query: string, cursorPosition: number): ClauseType | null {
        const beforeCursor = query.substring(0, cursorPosition).toUpperCase();
        
        const clausePatterns: Array<{ pattern: RegExp; type: ClauseType }> = [
            { pattern: /WHERE\s*\{[^}]*$/, type: ClauseType.WHERE },
            { pattern: /FILTER\s*\([^)]*$/, type: ClauseType.FILTER },
            { pattern: /OPTIONAL\s*\{[^}]*$/, type: ClauseType.OPTIONAL },
            { pattern: /UNION\s*\{[^}]*$/, type: ClauseType.UNION },
            { pattern: /ORDER\s+BY\s+[^{]*$/, type: ClauseType.ORDER_BY },
            { pattern: /GROUP\s+BY\s+[^{]*$/, type: ClauseType.GROUP_BY },
            { pattern: /SELECT\s+[^{]*$/, type: ClauseType.SELECT },
            { pattern: /PREFIX\s+\S*:\s*<[^>]*$/, type: ClauseType.PREFIX }
        ];
        
        for (const { pattern, type } of clausePatterns) {
            if (pattern.test(beforeCursor)) {
                return type;
            }
        }
        
        return null;
    }

    private extractClauses(query: string): Array<{ type: ClauseType; startPosition: number; endPosition: number; variables: string[]; content: string }> {
        const clauses: Array<{ type: ClauseType; startPosition: number; endPosition: number; variables: string[]; content: string }> = [];
        
        const selectMatch = query.match(/SELECT\s+(.*?)(?:WHERE|FROM|$)/si);
        if (selectMatch && selectMatch.index !== undefined) {
            const variables = this.extractVariables(selectMatch[1]);
            clauses.push({
                type: ClauseType.SELECT,
                startPosition: selectMatch.index,
                endPosition: selectMatch.index + selectMatch[0].length,
                variables,
                content: selectMatch[0]
            });
        }
        
        const whereMatch = query.match(/WHERE\s*\{([^}]*)}/si);
        if (whereMatch && whereMatch.index !== undefined) {
            const variables = this.extractVariables(whereMatch[1]);
            clauses.push({
                type: ClauseType.WHERE,
                startPosition: whereMatch.index,
                endPosition: whereMatch.index + whereMatch[0].length,
                variables,
                content: whereMatch[0]
            });
        }
        
        return clauses;
    }

    private extractVariables(text: string): string[] {
        const variables = new Set<string>();
        const regex = /\?(\w+)/g;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            variables.add(match[1]);
        }
        
        return Array.from(variables);
    }

    private async collectSuggestions(context: QueryContext, options: AutocompleteOptions): Promise<SPARQLSuggestion[]> {
        const suggestions: SPARQLSuggestion[] = [];
        const promises: Promise<Result<SPARQLSuggestion[]>>[] = [];

        if (this.shouldIncludeKeywords(context)) {
            promises.push(this.suggestionRepository.findKeywordSuggestions(context));
        }

        if (this.shouldIncludeProperties(context)) {
            promises.push(this.suggestionRepository.findPropertySuggestions(context));
        }

        if (this.shouldIncludeClasses(context)) {
            promises.push(this.suggestionRepository.findClassSuggestions(context));
        }

        if (this.shouldIncludeVariables(context)) {
            promises.push(this.suggestionRepository.findVariableSuggestions(context));
        }

        if (this.shouldIncludeFunctions(context)) {
            promises.push(this.suggestionRepository.findFunctionSuggestions(context));
        }

        if (this.shouldIncludeTemplates(context)) {
            promises.push(this.suggestionRepository.findTemplateSuggestions(context));
        }

        const results = await Promise.all(promises);
        
        for (const result of results) {
            if (result.isSuccess) {
                suggestions.push(...result.getValue());
            }
        }

        return this.deduplicateSuggestions(suggestions);
    }

    private shouldIncludeKeywords(context: QueryContext): boolean {
        const token = context.getCurrentToken().toUpperCase();
        
        if (context.isStartOfQuery()) return true;
        if (!context.getQueryType()) return true;
        if (context.isInClause(ClauseType.WHERE)) return true;
        if (context.isAfterClause(ClauseType.WHERE)) return true;
        
        const keywords = ['SELECT', 'WHERE', 'FILTER', 'OPTIONAL', 'UNION', 'ORDER', 'GROUP', 'LIMIT'];
        return keywords.some(k => k.startsWith(token));
    }

    private shouldIncludeProperties(context: QueryContext): boolean {
        return context.isInClause(ClauseType.WHERE) || 
               context.isInClause(ClauseType.OPTIONAL) ||
               context.isInClause(ClauseType.FILTER);
    }

    private shouldIncludeClasses(context: QueryContext): boolean {
        const previousTokens = context.getPreviousTokens();
        const lastTwo = previousTokens.slice(-2).join(' ');
        
        return lastTwo.includes('rdf:type') || 
               lastTwo.includes('a ') ||
               context.getCurrentToken().startsWith(':');
    }

    private shouldIncludeVariables(context: QueryContext): boolean {
        return context.getCurrentToken().startsWith('?') ||
               context.isInClause(ClauseType.SELECT) ||
               context.isInClause(ClauseType.WHERE);
    }

    private shouldIncludeFunctions(context: QueryContext): boolean {
        return context.isInClause(ClauseType.FILTER) ||
               context.getCurrentToken().toUpperCase().startsWith('STR') ||
               context.getCurrentToken().toUpperCase().startsWith('REGEX');
    }

    private shouldIncludeTemplates(context: QueryContext): boolean {
        return context.isStartOfQuery() || 
               (!context.getQueryType() && context.getCurrentToken().length < 3);
    }

    private deduplicateSuggestions(suggestions: SPARQLSuggestion[]): SPARQLSuggestion[] {
        const seen = new Set<string>();
        return suggestions.filter(s => {
            const key = `${s.getType()}-${s.getText()}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    private rankSuggestions(
        suggestions: SPARQLSuggestion[],
        context: QueryContext,
        options: AutocompleteOptions
    ): SPARQLSuggestion[] {
        const currentToken = context.getCurrentToken().toLowerCase();
        
        return suggestions
            .map(suggestion => {
                let score = suggestion.calculateFinalScore();
                
                if (currentToken && suggestion.getText().toLowerCase().startsWith(currentToken)) {
                    score *= 1.5;
                }
                
                if (options.contextBoost && this.isContextuallyRelevant(suggestion, context)) {
                    score *= 1.3;
                }
                
                return { suggestion, score };
            })
            .sort((a, b) => b.score - a.score)
            .map(item => item.suggestion);
    }

    private isContextuallyRelevant(suggestion: SPARQLSuggestion, context: QueryContext): boolean {
        if (suggestion.getType() === SuggestionType.KEYWORD) {
            if (suggestion.getText() === 'WHERE' && !context.getQueryType()) return false;
            if (suggestion.getText() === 'WHERE' && context.isAfterClause(ClauseType.WHERE)) return false;
        }
        
        if (suggestion.getType() === SuggestionType.VARIABLE) {
            const existingVars = context.getVariablesInScope();
            if (existingVars.includes(suggestion.getText().substring(1))) {
                return true;
            }
        }
        
        return true;
    }

    private getCachedSuggestions(context: QueryContext): SPARQLSuggestion[] | null {
        const cacheKey = this.getCacheKey(context);
        const cached = this.cache.get(cacheKey);
        
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.cacheTTL) {
            this.cache.delete(cacheKey);
            return null;
        }
        
        return cached.suggestions;
    }

    private cacheSuggestions(context: QueryContext, suggestions: SPARQLSuggestion[]): void {
        const cacheKey = this.getCacheKey(context);
        this.cache.set(cacheKey, {
            suggestions,
            timestamp: Date.now()
        });
        
        if (this.cache.size > 100) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) this.cache.delete(firstKey);
        }
    }

    private getCacheKey(context: QueryContext): string {
        return `${context.getQuery().substring(0, context.getCursorPosition())}-${context.getCurrentToken()}`;
    }

    clearCache(): void {
        this.cache.clear();
    }
}