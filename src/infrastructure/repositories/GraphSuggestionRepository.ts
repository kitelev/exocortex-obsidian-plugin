import { ISuggestionRepository } from "../../domain/repositories/ISuggestionRepository";
import {
  QuerySuggestion,
  QuerySuggestionImpl,
  SuggestionType,
} from "../../domain/autocomplete/QuerySuggestion";
import {
  QueryContext,
  ClauseType,
} from "../../domain/autocomplete/QueryContext";
import { Result } from "../../domain/core/Result";
import { Graph } from "../../domain/semantic/core/Graph";
import { KeywordSuggestionProvider } from "../autocomplete/KeywordSuggestionProvider";

interface UsageStats {
  [key: string]: {
    count: number;
    lastUsed: number;
  };
}

export class GraphSuggestionRepository implements ISuggestionRepository {
  private keywordProvider = new KeywordSuggestionProvider();
  private usageStats: UsageStats = {};
  private propertyCache: Map<string, QuerySuggestion[]> = new Map();
  private classCache: Map<string, QuerySuggestion[]> = new Map();
  private cacheTimestamp = 0;
  private readonly cacheTTL = 60000; // 1 minute

  constructor(private readonly graph: Graph) {}

  async findKeywordSuggestions(
    context: QueryContext,
  ): Promise<Result<QuerySuggestion[]>> {
    try {
      const suggestions = this.keywordProvider.getSuggestions(context);
      return Result.ok(suggestions);
    } catch (error) {
      return Result.fail(`Failed to get keyword suggestions: ${error}`);
    }
  }

  async findPropertySuggestions(
    context: QueryContext,
  ): Promise<Result<QuerySuggestion[]>> {
    try {
      if (this.shouldRefreshCache()) {
        await this.refreshCaches();
      }

      const cached = this.propertyCache.get("all");
      if (cached) {
        const filtered = this.filterSuggestionsByContext(cached, context);
        return Result.ok(filtered);
      }

      // Fallback to basic property suggestions
      const suggestions: QuerySuggestion[] = [];
      const basicProperties = ["rdf:type", "rdfs:label", "rdfs:comment"];
      
      for (const prop of basicProperties) {
        suggestions.push(
          QuerySuggestionImpl.create({
            id: `property_${prop}`,
            text: prop,
            insertText: prop,
            type: SuggestionType.PROPERTY,
            confidence: 0.8,
            contextRelevance: 0.7,
            description: `Basic RDF property: ${prop}`,
          }),
        );
      }

      return Result.ok(suggestions);
    } catch (error) {
      return Result.fail(`Failed to get property suggestions: ${error}`);
    }
  }

  async findClassSuggestions(
    context: QueryContext,
  ): Promise<Result<QuerySuggestion[]>> {
    try {
      if (this.shouldRefreshCache()) {
        await this.refreshCaches();
      }

      const cached = this.classCache.get("all");
      if (cached) {
        const filtered = this.filterSuggestionsByContext(cached, context);
        return Result.ok(filtered);
      }

      // Fallback to basic class suggestions
      const suggestions: QuerySuggestion[] = [];
      const basicClasses = ["owl:Thing", "rdfs:Resource", "owl:Class"];
      
      for (const cls of basicClasses) {
        suggestions.push(
          QuerySuggestionImpl.create({
            id: `class_${cls}`,
            text: cls,
            insertText: cls,
            type: SuggestionType.CLASS,
            confidence: 0.8,
            contextRelevance: 0.7,
            description: `Basic OWL class: ${cls}`,
          }),
        );
      }

      return Result.ok(suggestions);
    } catch (error) {
      return Result.fail(`Failed to get class suggestions: ${error}`);
    }
  }

  async findVariableSuggestions(
    context: QueryContext,
  ): Promise<Result<QuerySuggestion[]>> {
    try {
      const suggestions: QuerySuggestion[] = [];
      const existingVariables = context.getVariablesInScope();
      const currentToken = context.getCurrentToken();

      // Suggest existing variables
      for (const variable of existingVariables) {
        const varName = variable.startsWith("?") ? variable : `?${variable}`;
        if (!currentToken || varName.startsWith(currentToken)) {
          suggestions.push(
            QuerySuggestionImpl.create({
              id: `var_existing_${variable}`,
              text: varName,
              insertText: varName,
              type: SuggestionType.VARIABLE,
              confidence: 0.9,
              contextRelevance: 0.95,
              description: "Existing variable in query",
            }),
          );
        }
      }

      // Suggest common variable names
      const commonVariables = [
        { name: "subject", desc: "Subject of a triple" },
        { name: "predicate", desc: "Predicate/property" },
        { name: "object", desc: "Object value" },
        { name: "type", desc: "RDF type/class" },
        { name: "label", desc: "Human-readable label" },
        { name: "value", desc: "Property value" },
      ];

      for (const { name, desc } of commonVariables) {
        const varName = `?${name}`;
        if (
          !existingVariables.includes(name) &&
          (!currentToken || varName.startsWith(currentToken))
        ) {
          suggestions.push(
            QuerySuggestionImpl.create({
              id: `var_common_${name}`,
              text: varName,
              insertText: varName,
              type: SuggestionType.VARIABLE,
              confidence: 0.7,
              contextRelevance: 0.6,
              description: desc,
            }),
          );
        }
      }

      return Result.ok(suggestions);
    } catch (error) {
      return Result.fail(`Failed to get variable suggestions: ${error}`);
    }
  }

  async findNamespaceSuggestions(
    context: QueryContext,
  ): Promise<Result<QuerySuggestion[]>> {
    try {
      const namespaces = [
        { prefix: "rdf", uri: "http://www.w3.org/1999/02/22-rdf-syntax-ns#" },
        { prefix: "rdfs", uri: "http://www.w3.org/2000/01/rdf-schema#" },
        { prefix: "owl", uri: "http://www.w3.org/2002/07/owl#" },
        { prefix: "xsd", uri: "http://www.w3.org/2001/XMLSchema#" },
        { prefix: "dc", uri: "http://purl.org/dc/elements/1.1/" },
        { prefix: "foaf", uri: "http://xmlns.com/foaf/0.1/" },
      ];

      const currentToken = context.getCurrentToken();
      const suggestions = namespaces
        .filter(
          (ns) =>
            !currentToken ||
            ns.prefix.startsWith(currentToken) ||
            ns.uri.includes(currentToken),
        )
        .map((ns) =>
          QuerySuggestionImpl.create({
            id: `namespace_${ns.prefix}`,
            text: ns.prefix,
            insertText: `PREFIX ${ns.prefix}: <${ns.uri}>`,
            type: SuggestionType.NAMESPACE,
            confidence: 0.85,
            contextRelevance: 0.8,
            description: `Namespace: ${ns.uri}`,
          }),
        );

      return Result.ok(suggestions);
    } catch (error) {
      return Result.fail(`Failed to get namespace suggestions: ${error}`);
    }
  }

  async findFunctionSuggestions(
    context: QueryContext,
  ): Promise<Result<QuerySuggestion[]>> {
    try {
      const functions = [
        {
          name: "COUNT",
          desc: "Count the number of results",
          example: "COUNT(?item)",
        },
        {
          name: "DISTINCT",
          desc: "Remove duplicate results",
          example: "SELECT DISTINCT ?item",
        },
        {
          name: "FILTER",
          desc: "Filter results based on a condition",
          example: "FILTER(?age > 18)",
        },
        {
          name: "OPTIONAL",
          desc: "Optional graph pattern",
          example: "OPTIONAL { ?item rdfs:label ?label }",
        },
        {
          name: "UNION",
          desc: "Union of graph patterns",
          example: "{ ?item rdf:type ?type } UNION { ?item rdfs:subClassOf ?type }",
        },
        {
          name: "BIND",
          desc: "Bind a value to a variable",
          example: "BIND(?price * 1.2 AS ?totalPrice)",
        },
        {
          name: "EXISTS",
          desc: "Test whether a graph pattern exists",
          example: "FILTER EXISTS { ?item rdfs:label ?label }",
        },
        {
          name: "NOT EXISTS",
          desc: "Test whether a graph pattern does not exist",
          example: "FILTER NOT EXISTS { ?item rdfs:label ?label }",
        },
      ];

      const currentToken = context.getCurrentToken();
      const suggestions = functions
        .filter((fn) => !currentToken || fn.name.startsWith(currentToken))
        .map((fn) =>
          QuerySuggestionImpl.create({
            id: `function_${fn.name.toLowerCase()}`,
            text: fn.name,
            insertText: `${fn.name} `,
            type: SuggestionType.FUNCTION,
            confidence: 0.8,
            contextRelevance: 0.7,
            description: fn.desc,
            examples: [fn.example],
          }),
        );

      return Result.ok(suggestions);
    } catch (error) {
      return Result.fail(`Failed to get function suggestions: ${error}`);
    }
  }

  async findTemplateSuggestions(
    context: QueryContext,
  ): Promise<Result<QuerySuggestion[]>> {
    try {
      const templates = [
        {
          name: "Basic SELECT",
          description: "Basic SELECT query template",
          pattern: "SELECT ?subject ?predicate ?object WHERE { ?subject ?predicate ?object }",
        },
        {
          name: "Find by Type",
          description: "Find all instances of a specific type",
          pattern: "SELECT ?item WHERE { ?item rdf:type ?type }",
        },
        {
          name: "Count Items",
          description: "Count items of a specific type",
          pattern: "SELECT (COUNT(?item) AS ?count) WHERE { ?item rdf:type ?type }",
        },
      ];

      const suggestions = templates.map((template, index) =>
        QuerySuggestionImpl.create({
          id: `template_${index}`,
          text: template.name,
          insertText: template.pattern,
          type: SuggestionType.TEMPLATE,
          confidence: 0.9,
          contextRelevance: 0.8,
          description: template.description,
        }),
      );

      return Result.ok(suggestions);
    } catch (error) {
      return Result.fail(`Failed to get template suggestions: ${error}`);
    }
  }

  async updateUsageStatistics(
    suggestionId: string,
    selected: boolean,
  ): Promise<Result<void>> {
    try {
      if (selected) {
        const current = this.usageStats[suggestionId] || {
          count: 0,
          lastUsed: 0,
        };
        this.usageStats[suggestionId] = {
          count: current.count + 1,
          lastUsed: Date.now(),
        };
      }
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(`Failed to update usage statistics: ${error}`);
    }
  }

  async getPopularSuggestions(
    limit: number,
  ): Promise<Result<QuerySuggestion[]>> {
    try {
      const sortedIds = Object.entries(this.usageStats)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, limit)
        .map(([id]) => id);

      // For now, return empty array since we don't have a way to recreate suggestions by ID
      const suggestions: QuerySuggestion[] = [];
      return Result.ok(suggestions);
    } catch (error) {
      return Result.fail(`Failed to get popular suggestions: ${error}`);
    }
  }

  private shouldRefreshCache(): boolean {
    return Date.now() - this.cacheTimestamp > this.cacheTTL;
  }

  private async refreshCaches(): Promise<void> {
    // Implementation would populate caches from the graph
    // For now, we'll keep the caches empty
    this.cacheTimestamp = Date.now();
  }

  private filterSuggestionsByContext(
    suggestions: QuerySuggestion[],
    context: QueryContext,
  ): QuerySuggestion[] {
    const currentToken = context.getCurrentToken();
    if (!currentToken) {
      return suggestions;
    }

    return suggestions.filter((suggestion) =>
      suggestion.text.toLowerCase().startsWith(currentToken.toLowerCase()),
    );
  }
}