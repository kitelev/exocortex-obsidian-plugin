import {
  ErrorSeverity,
  ErrorCategory,
  ExocortexError,
  FixSuggestion,
  ErrorBuilder,
} from "./ExocortexError";

export interface ErrorPattern {
  pattern: RegExp;
  severity: ErrorSeverity;
  category: ErrorCategory;
  title: string;
  getUserMessage: (match: RegExpMatchArray) => string;
  getSuggestions: (match: RegExpMatchArray) => FixSuggestion[];
  recoverable: boolean;
}

export class ErrorAnalyzer {
  private static patterns: ErrorPattern[] = [
    {
      pattern: /Unexpected token '([^']+)' at position (\d+)/i,
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.SYNTAX,
      title: "SPARQL Syntax Error",
      getUserMessage: (match) =>
        `Unexpected '${match[1]}' at position ${match[2]}. Check for missing brackets or incorrect syntax.`,
      getSuggestions: (match) => [
        {
          title: "Check Syntax",
          description: `The character '${match[1]}' was not expected at this position.`,
          confidence: 0.9,
        },
        {
          title: "Common Fixes",
          description:
            "Ensure all brackets are closed and keywords are spelled correctly.",
          confidence: 0.7,
          learnMore: {
            url: "https://www.w3.org/TR/sparql11-query/",
            title: "SPARQL Syntax Guide",
          },
        },
      ],
      recoverable: true,
    },
    {
      pattern: /Unknown prefix: ([^\s]+)/i,
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.SEMANTIC,
      title: "Unknown Prefix",
      getUserMessage: (match) =>
        `The prefix '${match[1]}' is not defined. Add a PREFIX declaration at the beginning of your query.`,
      getSuggestions: (match) => [
        {
          title: "Add PREFIX Declaration",
          description: `Add: PREFIX ${match[1]} <http://example.org/${match[1].replace(":", "")}#> at the beginning`,
          confidence: 0.95,
          action: {
            label: "Add PREFIX",
            handler: () => console.log("Adding prefix..."),
          },
        },
      ],
      recoverable: true,
    },
    {
      pattern: /Query timeout after (\d+)ms/i,
      severity: ErrorSeverity.WARNING,
      category: ErrorCategory.SYSTEM,
      title: "Query Timeout",
      getUserMessage: (match) =>
        `Your query took longer than ${match[1]}ms and was cancelled. Try simplifying the query or adding limits.`,
      getSuggestions: () => [
        {
          title: "Add LIMIT Clause",
          description: "Restrict the number of results with LIMIT 100",
          confidence: 0.8,
          action: {
            label: "Add LIMIT",
            handler: () => console.log("Adding limit..."),
          },
        },
        {
          title: "Optimize Query",
          description: "Simplify triple patterns or reduce the scope",
          confidence: 0.7,
          learnMore: {
            url: "https://docs.exocortex.com/query-optimization",
            title: "Query Optimization Guide",
          },
        },
      ],
      recoverable: true,
    },
    {
      pattern: /Invalid IRI: ([^\s]+)/i,
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.VALIDATION,
      title: "Invalid IRI",
      getUserMessage: (match) =>
        `'${match[1]}' is not a valid IRI. IRIs must be absolute URIs enclosed in angle brackets.`,
      getSuggestions: (match) => {
        const suggestions: FixSuggestion[] = [];

        if (!match[1].startsWith("<") || !match[1].endsWith(">")) {
          suggestions.push({
            title: "Add Angle Brackets",
            description: `Enclose the IRI in angle brackets: <${match[1]}>`,
            confidence: 0.9,
          });
        }

        if (!match[1].includes("://")) {
          suggestions.push({
            title: "Use Absolute IRI",
            description:
              "IRIs must be absolute URLs, e.g., <http://example.org/resource>",
            confidence: 0.85,
          });
        }

        return suggestions;
      },
      recoverable: true,
    },
    {
      pattern: /Empty result set/i,
      severity: ErrorSeverity.INFO,
      category: ErrorCategory.SEMANTIC,
      title: "No Results Found",
      getUserMessage: () =>
        "Your query executed successfully but returned no results. This might be expected, or you may need to adjust your query criteria.",
      getSuggestions: () => [
        {
          title: "Check Triple Patterns",
          description: "Ensure your triple patterns match existing data",
          confidence: 0.6,
        },
        {
          title: "Broaden Search Criteria",
          description: "Try using more general patterns or OPTIONAL clauses",
          confidence: 0.5,
        },
      ],
      recoverable: true,
    },
    {
      pattern: /Circular reference detected/i,
      severity: ErrorSeverity.WARNING,
      category: ErrorCategory.SEMANTIC,
      title: "Circular Reference",
      getUserMessage: () =>
        "A circular reference was detected in your ontology. This may cause infinite loops in reasoning.",
      getSuggestions: () => [
        {
          title: "Review Ontology Structure",
          description:
            "Check for classes that reference themselves directly or indirectly",
          confidence: 0.7,
        },
        {
          title: "Use Reasoning Limits",
          description: "Set maximum inference depth to prevent infinite loops",
          confidence: 0.8,
        },
      ],
      recoverable: true,
    },
  ];

  static analyze(error: Error | string): ExocortexError {
    const errorMessage = typeof error === "string" ? error : error.message;
    const stackTrace = error instanceof Error ? error.stack : undefined;

    for (const pattern of this.patterns) {
      const match = errorMessage.match(pattern.pattern);
      if (match) {
        return ErrorBuilder.create()
          .withSeverity(pattern.severity)
          .withCategory(pattern.category)
          .withTitle(pattern.title)
          .withMessage(pattern.getUserMessage(match))
          .withContext({
            operation: "Error Analysis",
            timestamp: new Date(),
          })
          .withTechnicalDetails(errorMessage)
          .withSuggestions(pattern.getSuggestions(match))
          .withRecoverable(pattern.recoverable)
          .withStackTrace(stackTrace || "")
          .build();
      }
    }

    return ErrorBuilder.create()
      .withSeverity(ErrorSeverity.ERROR)
      .withCategory(ErrorCategory.SYSTEM)
      .withTitle("Unknown Error")
      .withMessage(
        "An unexpected error occurred. Please check the technical details for more information.",
      )
      .withContext({
        operation: "Error Analysis",
        timestamp: new Date(),
      })
      .withTechnicalDetails(errorMessage)
      .withRecoverable(false)
      .withStackTrace(stackTrace || "")
      .build();
  }

  static getSPARQLErrorLocation(
    query: string,
    errorPosition?: number,
  ): { line: number; column: number } | undefined {
    if (!errorPosition || errorPosition < 0) return undefined;

    const lines = query.split("\n");
    let currentPosition = 0;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const lineLength = lines[lineIndex].length;

      if (currentPosition + lineLength >= errorPosition) {
        return {
          line: lineIndex + 1,
          column: errorPosition - currentPosition + 1,
        };
      }

      currentPosition += lineLength + 1; // +1 for the newline character
    }

    return undefined;
  }

  static addPattern(pattern: ErrorPattern): void {
    this.patterns.push(pattern);
  }

  static clearPatterns(): void {
    this.patterns = [];
  }
}
