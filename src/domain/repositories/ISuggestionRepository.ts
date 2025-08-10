import { SPARQLSuggestion } from '../autocomplete/SPARQLSuggestion';
import { QueryContext } from '../autocomplete/QueryContext';
import { Result } from '../core/Result';

export interface ISuggestionRepository {
    findKeywordSuggestions(context: QueryContext): Promise<Result<SPARQLSuggestion[]>>;
    findPropertySuggestions(context: QueryContext): Promise<Result<SPARQLSuggestion[]>>;
    findClassSuggestions(context: QueryContext): Promise<Result<SPARQLSuggestion[]>>;
    findVariableSuggestions(context: QueryContext): Promise<Result<SPARQLSuggestion[]>>;
    findNamespaceSuggestions(context: QueryContext): Promise<Result<SPARQLSuggestion[]>>;
    findFunctionSuggestions(context: QueryContext): Promise<Result<SPARQLSuggestion[]>>;
    findTemplateSuggestions(context: QueryContext): Promise<Result<SPARQLSuggestion[]>>;
    
    updateUsageStatistics(suggestionId: string, selected: boolean): Promise<Result<void>>;
    getPopularSuggestions(limit: number): Promise<Result<SPARQLSuggestion[]>>;
}