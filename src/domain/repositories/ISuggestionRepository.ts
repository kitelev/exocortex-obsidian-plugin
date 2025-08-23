import { QuerySuggestion } from "../autocomplete/QuerySuggestion";
import { QueryContext } from "../autocomplete/QueryContext";
import { Result } from "../core/Result";

export interface ISuggestionRepository {
  findKeywordSuggestions(
    context: QueryContext,
  ): Promise<Result<QuerySuggestion[]>>;
  findPropertySuggestions(
    context: QueryContext,
  ): Promise<Result<QuerySuggestion[]>>;
  findClassSuggestions(
    context: QueryContext,
  ): Promise<Result<QuerySuggestion[]>>;
  findVariableSuggestions(
    context: QueryContext,
  ): Promise<Result<QuerySuggestion[]>>;
  findNamespaceSuggestions(
    context: QueryContext,
  ): Promise<Result<QuerySuggestion[]>>;
  findFunctionSuggestions(
    context: QueryContext,
  ): Promise<Result<QuerySuggestion[]>>;
  findTemplateSuggestions(
    context: QueryContext,
  ): Promise<Result<QuerySuggestion[]>>;

  updateUsageStatistics(
    suggestionId: string,
    selected: boolean,
  ): Promise<Result<void>>;
  getPopularSuggestions(limit: number): Promise<Result<QuerySuggestion[]>>;
}
