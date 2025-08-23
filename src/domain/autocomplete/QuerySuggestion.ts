export enum SuggestionType {
  KEYWORD = "keyword",
  PROPERTY = "property",
  CLASS = "class",
  INDIVIDUAL = "individual",
  VARIABLE = "variable",
  PREFIX = "prefix",
  FUNCTION = "function",
  OPERATOR = "operator",
  LITERAL = "literal",
  IRI = "iri",
  NAMESPACE = "namespace",
  TEMPLATE = "template",
}

export interface QuerySuggestion {
  text: string;
  insertText: string;
  type: SuggestionType;
  description?: string;
  confidence: number;
  contextRelevance: number;
  examples?: string[];
  documentation?: string;
  isValid: boolean;
}

export class QuerySuggestionImpl implements QuerySuggestion {
  constructor(
    public readonly text: string,
    public readonly insertText: string,
    public readonly type: SuggestionType,
    public readonly confidence: number = 1.0,
    public readonly contextRelevance: number = 1.0,
    public readonly description?: string,
    public readonly examples?: string[],
    public readonly documentation?: string,
    public readonly isValid: boolean = true,
  ) {}

  static createKeyword(
    keyword: string,
    description?: string,
    examples?: string[],
  ): QuerySuggestion {
    return new QuerySuggestionImpl(
      keyword,
      keyword + " ",
      SuggestionType.KEYWORD,
      1.0,
      1.0,
      description,
      examples,
      undefined,
      true,
    );
  }

  static createProperty(
    property: string,
    description?: string,
  ): QuerySuggestion {
    return new QuerySuggestionImpl(
      property,
      property,
      SuggestionType.PROPERTY,
      0.9,
      1.0,
      description,
      undefined,
      undefined,
      true,
    );
  }

  static createClass(
    className: string,
    description?: string,
  ): QuerySuggestion {
    return new QuerySuggestionImpl(
      className,
      className,
      SuggestionType.CLASS,
      0.9,
      1.0,
      description,
      undefined,
      undefined,
      true,
    );
  }

  static createVariable(variableName: string): QuerySuggestion {
    return new QuerySuggestionImpl(
      variableName,
      variableName,
      SuggestionType.VARIABLE,
      0.8,
      1.0,
      `Variable: ${variableName}`,
      undefined,
      undefined,
      true,
    );
  }

  static create(options: {
    id: string;
    text: string;
    insertText?: string;
    type: SuggestionType;
    description?: string;
    confidence?: number;
    contextRelevance?: number;
    examples?: string[];
    documentation?: string;
    isValid?: boolean;
  }): QuerySuggestion {
    return new QuerySuggestionImpl(
      options.text,
      options.insertText || options.text,
      options.type,
      options.confidence || 1.0,
      options.contextRelevance || 1.0,
      options.description,
      options.examples,
      options.documentation,
      options.isValid !== false,
    );
  }
}