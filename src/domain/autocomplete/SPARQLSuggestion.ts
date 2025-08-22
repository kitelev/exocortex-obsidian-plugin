export enum SuggestionType {
  KEYWORD = "keyword",
  FUNCTION = "function",
  PREFIX = "prefix",
  VARIABLE = "variable",
  PROPERTY = "property",
  CLASS = "class",
  NAMESPACE = "namespace",
  OPERATOR = "operator",
  TEMPLATE = "template",
}

export interface SuggestionMetadata {
  description?: string;
  usage?: string;
  examples?: string[];
  namespace?: string;
  deprecated?: boolean;
  documentation?: string;
}

export class SPARQLSuggestion {
  constructor(
    private readonly id: string,
    private readonly text: string,
    private readonly insertText: string,
    private readonly type: SuggestionType,
    private readonly confidence: number,
    private readonly contextualScore: number,
    private readonly metadata?: SuggestionMetadata,
  ) {
    Object.freeze(this);
  }

  getId(): string {
    return this.id;
  }

  getText(): string {
    return this.text;
  }

  getInsertText(): string {
    return this.insertText;
  }

  getType(): SuggestionType {
    return this.type;
  }

  getConfidence(): number {
    return this.confidence;
  }

  getContextualScore(): number {
    return this.contextualScore;
  }

  getMetadata(): SuggestionMetadata | undefined {
    return this.metadata;
  }

  calculateFinalScore(boostFactor: number = 1.0): number {
    return (this.confidence * 0.6 + this.contextualScore * 0.4) * boostFactor;
  }

  static create(params: {
    id: string;
    text: string;
    insertText?: string;
    type: SuggestionType;
    confidence: number;
    contextualScore: number;
    metadata?: SuggestionMetadata;
  }): SPARQLSuggestion {
    return new SPARQLSuggestion(
      params.id,
      params.text,
      params.insertText || params.text,
      params.type,
      params.confidence,
      params.contextualScore,
      params.metadata,
    );
  }
}
