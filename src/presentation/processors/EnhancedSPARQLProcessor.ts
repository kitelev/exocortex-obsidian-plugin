import { MarkdownPostProcessorContext, Plugin, Notice } from "obsidian";
import { SPARQLProcessor } from "./SPARQLProcessor";
import { Graph } from "../../domain/semantic/core/Graph";
import { ExoFocusService } from "../../application/services/ExoFocusService";
import { QueryCacheConfig } from "../../application/services/QueryCache";
import { ErrorHandlerService } from "../../application/services/ErrorHandlerService";
import {
  ExocortexError,
  ErrorSeverity,
  ErrorCategory,
  ErrorBuilder,
} from "../../domain/errors/ExocortexError";
import { ErrorAnalyzer } from "../../domain/errors/ErrorAnalyzer";
import { ErrorMessageComponent } from "../components/ErrorMessageComponent";

export class EnhancedSPARQLProcessor extends SPARQLProcessor {
  private errorHandler: ErrorHandlerService;

  constructor(
    plugin: Plugin,
    graph: Graph,
    focusService?: ExoFocusService,
    cacheConfig?: Partial<QueryCacheConfig>,
    errorHandler?: ErrorHandlerService,
  ) {
    super(plugin, graph, focusService, cacheConfig);
    this.errorHandler =
      errorHandler ||
      new ErrorHandlerService({
        showUserNotification: true,
        logToConsole: true,
        trackMetrics: true,
      });
  }

  async processCodeBlock(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ): Promise<void> {
    el.empty();

    const container = document.createElement("div");
    container.className = "exocortex-sparql-container enhanced-error-handling";
    container.style.cssText =
      "border: 1px solid #e0e0e0; padding: 1em; margin: 1em 0; border-radius: 4px; background: #fafafa;";
    el.appendChild(container);

    try {
      const validationResult = this.validateQuery(source.trim());
      if (validationResult) {
        this.displayValidationError(container, validationResult, source);
        return;
      }

      const loadingEl = this.createLoadingIndicator();
      container.appendChild(loadingEl);

      const startTime = Date.now();
      const result = await this.executeQuery(source.trim());
      const executionTime = Date.now() - startTime;

      loadingEl.remove();

      this.displayResults(container, source, result, executionTime);
    } catch (error: any) {
      container.innerHTML = "";

      const exoError = this.convertToEnhancedError(error, source);

      await this.errorHandler.handleError(exoError, {
        operation: "SPARQL Query Execution",
        location: ctx.sourcePath,
      });

      const errorComponent = new ErrorMessageComponent(exoError, {
        showTechnicalDetails: true,
        compact: false,
        onRetry: async () => {
          await this.processCodeBlock(source, el, ctx);
        },
      });

      container.appendChild(errorComponent.render());

      this.addQueryHighlighting(container, source, exoError);
    }
  }

  private validateQuery(query: string): ExocortexError | null {
    const lines = query.split("\n");

    const bracketStack: string[] = [];
    const quoteStack: string[] = [];
    let inString = false;
    let currentQuote = "";

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];

      for (let charIndex = 0; charIndex < line.length; charIndex++) {
        const char = line[charIndex];
        const prevChar = charIndex > 0 ? line[charIndex - 1] : "";

        if (inString) {
          if (char === currentQuote && prevChar !== "\\") {
            inString = false;
            quoteStack.pop();
          }
        } else {
          if (char === '"' || char === "'") {
            inString = true;
            currentQuote = char;
            quoteStack.push(char);
          } else if (char === "{") {
            bracketStack.push("{");
          } else if (char === "}") {
            if (
              bracketStack.length === 0 ||
              bracketStack[bracketStack.length - 1] !== "{"
            ) {
              return ErrorBuilder.create()
                .withTitle("SPARQL Syntax Error")
                .withMessage("Unexpected closing bracket }")
                .withSeverity(ErrorSeverity.ERROR)
                .withCategory(ErrorCategory.SYNTAX)
                .withContext({
                  operation: "Query Validation",
                  timestamp: new Date(),
                  location: {
                    line: lineIndex + 1,
                    column: charIndex + 1,
                    context: line,
                  },
                })
                .withSuggestions([
                  {
                    title: "Check Bracket Matching",
                    description:
                      "Ensure all opening brackets { have corresponding closing brackets }",
                    confidence: 0.9,
                  },
                ])
                .withRecoverable(true)
                .build();
            }
            bracketStack.pop();
          } else if (char === "(" || char === "[") {
            bracketStack.push(char);
          } else if (char === ")") {
            if (
              bracketStack.length === 0 ||
              bracketStack[bracketStack.length - 1] !== "("
            ) {
              return ErrorBuilder.create()
                .withTitle("SPARQL Syntax Error")
                .withMessage("Unmatched closing parenthesis )")
                .withSeverity(ErrorSeverity.ERROR)
                .withCategory(ErrorCategory.SYNTAX)
                .withContext({
                  operation: "Query Validation",
                  timestamp: new Date(),
                  location: {
                    line: lineIndex + 1,
                    column: charIndex + 1,
                    context: line,
                  },
                })
                .withSuggestions([
                  {
                    title: "Check Parenthesis Matching",
                    description:
                      "Ensure all opening parentheses ( have corresponding closing parentheses )",
                    confidence: 0.9,
                  },
                ])
                .withRecoverable(true)
                .build();
            }
            bracketStack.pop();
          } else if (char === "]") {
            if (
              bracketStack.length === 0 ||
              bracketStack[bracketStack.length - 1] !== "["
            ) {
              return ErrorBuilder.create()
                .withTitle("SPARQL Syntax Error")
                .withMessage("Unmatched closing bracket ]")
                .withSeverity(ErrorSeverity.ERROR)
                .withCategory(ErrorCategory.SYNTAX)
                .withContext({
                  operation: "Query Validation",
                  timestamp: new Date(),
                  location: {
                    line: lineIndex + 1,
                    column: charIndex + 1,
                    context: line,
                  },
                })
                .withRecoverable(true)
                .build();
            }
            bracketStack.pop();
          }
        }
      }
    }

    if (quoteStack.length > 0) {
      return ErrorBuilder.create()
        .withTitle("SPARQL Syntax Error")
        .withMessage("Unclosed string literal")
        .withSeverity(ErrorSeverity.ERROR)
        .withCategory(ErrorCategory.SYNTAX)
        .withContext({
          operation: "Query Validation",
          timestamp: new Date(),
        })
        .withSuggestions([
          {
            title: "Close String Literals",
            description: "Ensure all string literals have matching quotes",
            confidence: 0.95,
          },
        ])
        .withRecoverable(true)
        .build();
    }

    if (bracketStack.length > 0) {
      const unclosed = bracketStack[bracketStack.length - 1];
      const closingChar = unclosed === "{" ? "}" : unclosed === "(" ? ")" : "]";

      return ErrorBuilder.create()
        .withTitle("SPARQL Syntax Error")
        .withMessage(`Unclosed ${unclosed} - missing ${closingChar}`)
        .withSeverity(ErrorSeverity.ERROR)
        .withCategory(ErrorCategory.SYNTAX)
        .withContext({
          operation: "Query Validation",
          timestamp: new Date(),
        })
        .withSuggestions([
          {
            title: `Add Missing ${closingChar}`,
            description: `Add a ${closingChar} to close the ${unclosed}`,
            confidence: 0.9,
          },
        ])
        .withRecoverable(true)
        .build();
    }

    const commonPatterns = [
      {
        pattern: /SELECT\s+WHERE/i,
        message: "Missing variable selection after SELECT",
      },
      { pattern: /WHERE\s*$/i, message: "WHERE clause is empty" },
      { pattern: /FILTER\s*$/i, message: "FILTER expression is incomplete" },
      {
        pattern: /PREFIX\s+\w+\s*$/i,
        message: "PREFIX declaration missing IRI",
      },
    ];

    for (const { pattern, message } of commonPatterns) {
      if (pattern.test(query)) {
        return ErrorBuilder.create()
          .withTitle("SPARQL Query Incomplete")
          .withMessage(message)
          .withSeverity(ErrorSeverity.WARNING)
          .withCategory(ErrorCategory.SYNTAX)
          .withContext({
            operation: "Query Validation",
            timestamp: new Date(),
          })
          .withRecoverable(true)
          .build();
      }
    }

    return null;
  }

  private convertToEnhancedError(
    error: Error | any,
    query: string,
  ): ExocortexError {
    const baseError = ErrorAnalyzer.analyze(error);

    const errorPositionMatch = error.message?.match(/at position (\d+)/i);
    if (errorPositionMatch) {
      const position = parseInt(errorPositionMatch[1]);
      const location = ErrorAnalyzer.getSPARQLErrorLocation(query, position);

      if (location) {
        baseError.context.location = {
          ...location,
          context: this.getLineContext(query, location.line),
        };
      }
    }

    const lineMatch = error.message?.match(/line (\d+)/i);
    const columnMatch = error.message?.match(/column (\d+)/i);

    if (lineMatch || columnMatch) {
      baseError.context.location = {
        line: lineMatch ? parseInt(lineMatch[1]) : undefined,
        column: columnMatch ? parseInt(columnMatch[1]) : undefined,
        context: lineMatch
          ? this.getLineContext(query, parseInt(lineMatch[1]))
          : undefined,
      };
    }

    if (!baseError.suggestions || baseError.suggestions.length === 0) {
      baseError.suggestions = this.generateSmartSuggestions(error, query);
    }

    return baseError;
  }

  private getLineContext(query: string, lineNumber: number): string {
    const lines = query.split("\n");
    const lineIndex = lineNumber - 1;

    if (lineIndex < 0 || lineIndex >= lines.length) {
      return "";
    }

    const contextLines = [];
    if (lineIndex > 0) {
      contextLines.push(`${lineNumber - 1}: ${lines[lineIndex - 1]}`);
    }
    contextLines.push(`${lineNumber}: ${lines[lineIndex]} <-- HERE`);
    if (lineIndex < lines.length - 1) {
      contextLines.push(`${lineNumber + 1}: ${lines[lineIndex + 1]}`);
    }

    return contextLines.join("\n");
  }

  private generateSmartSuggestions(error: any, query: string): any[] {
    const suggestions = [];
    const errorMessage = error.message?.toLowerCase() || "";

    if (errorMessage.includes("timeout")) {
      suggestions.push({
        title: "Add LIMIT Clause",
        description: "Limit results to improve performance",
        confidence: 0.8,
        action: {
          label: "Add LIMIT 100",
          handler: () => {
            const limitedQuery =
              query.trim().replace(/;?\s*$/, "") + "\nLIMIT 100";
            navigator.clipboard.writeText(limitedQuery);
            new Notice("Query with LIMIT copied to clipboard");
          },
        },
      });
    }

    if (errorMessage.includes("prefix") || errorMessage.includes("namespace")) {
      const missingPrefix = errorMessage.match(/prefix[:\s]+(\w+)/i)?.[1];
      if (missingPrefix) {
        suggestions.push({
          title: "Add Missing PREFIX",
          description: `Define the ${missingPrefix} prefix`,
          confidence: 0.9,
          action: {
            label: "Copy PREFIX Template",
            handler: () => {
              const prefixLine = `PREFIX ${missingPrefix}: <http://example.org/${missingPrefix}#>`;
              navigator.clipboard.writeText(prefixLine);
              new Notice("PREFIX template copied to clipboard");
            },
          },
        });
      }
    }

    if (errorMessage.includes("variable") || errorMessage.includes("unbound")) {
      suggestions.push({
        title: "Check Variable Bindings",
        description: "Ensure all variables in SELECT are defined in WHERE",
        confidence: 0.7,
        learnMore: {
          url: "https://www.w3.org/TR/sparql11-query/#select",
          title: "SPARQL SELECT Documentation",
        },
      });
    }

    return suggestions;
  }

  private displayValidationError(
    container: HTMLElement,
    error: ExocortexError,
    query: string,
  ): void {
    const errorComponent = new ErrorMessageComponent(error, {
      showTechnicalDetails: false,
      compact: false,
    });

    container.appendChild(errorComponent.render());
    this.addQueryHighlighting(container, query, error);
  }

  private addQueryHighlighting(
    container: HTMLElement,
    query: string,
    error: ExocortexError,
  ): void {
    if (!error.context.location || typeof error.context.location !== "object") {
      return;
    }

    const location = error.context.location;
    const highlightedQuery = document.createElement("div");
    highlightedQuery.className = "error-query-highlight";
    highlightedQuery.style.cssText =
      "margin-top: 1em; padding: 0.5em; background: #fff; border: 1px solid #e0e0e0; border-radius: 4px;";

    const title = document.createElement("div");
    title.textContent = "Query with Error Location:";
    title.style.cssText =
      "font-weight: bold; margin-bottom: 0.5em; color: #666;";
    highlightedQuery.appendChild(title);

    const pre = document.createElement("pre");
    pre.style.cssText =
      "margin: 0; font-family: monospace; font-size: 0.9em; line-height: 1.4;";

    const lines = query.split("\n");
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const lineEl = document.createElement("div");
      lineEl.style.cssText = "display: flex;";

      const lineNumberEl = document.createElement("span");
      lineNumberEl.textContent = String(lineNumber).padStart(3, " ") + ": ";
      lineNumberEl.style.cssText = "color: #999; margin-right: 0.5em;";
      lineEl.appendChild(lineNumberEl);

      const lineContent = document.createElement("span");

      if (location.line === lineNumber) {
        lineContent.style.cssText = "background: #fee; color: #c00;";

        if (location.column) {
          const beforeError = line.substring(0, location.column - 1);
          const atError = line.substring(location.column - 1, location.column);
          const afterError = line.substring(location.column);

          lineContent.innerHTML = "";
          lineContent.appendChild(document.createTextNode(beforeError));

          const errorChar = document.createElement("span");
          errorChar.textContent = atError || " ";
          errorChar.style.cssText =
            "background: #f00; color: #fff; padding: 0 2px; font-weight: bold;";
          lineContent.appendChild(errorChar);

          lineContent.appendChild(document.createTextNode(afterError));
        } else {
          lineContent.textContent = line;
        }
      } else {
        lineContent.textContent = line;
      }

      lineEl.appendChild(lineContent);
      pre.appendChild(lineEl);
    });

    highlightedQuery.appendChild(pre);

    if (location.column) {
      const pointer = document.createElement("div");
      pointer.style.cssText =
        "margin-left: 3.5em; color: #f00; font-size: 0.8em;";
      pointer.textContent = " ".repeat(location.column - 1) + "^--- Error here";
      highlightedQuery.appendChild(pointer);
    }

    container.appendChild(highlightedQuery);
  }

  private displayResults(
    container: HTMLElement,
    source: string,
    result: any,
    executionTime: number,
  ): void {
    const title = document.createElement("h3");
    title.textContent = "SPARQL Query Results";
    title.style.cssText = "margin-top: 0; color: #333;";
    container.appendChild(title);

    const queryPre = document.createElement("pre");
    queryPre.textContent = source.trim();
    queryPre.style.cssText =
      "background: #f5f5f5; padding: 0.5em; border-radius: 3px; font-size: 0.9em; overflow-x: auto;";
    container.appendChild(queryPre);

    if (result.cached) {
      const cacheIndicator = this.createCacheIndicator(result.cached);
      container.appendChild(cacheIndicator);
    }

    if (!result.results || result.results.length === 0) {
      const noResultsError = ErrorBuilder.create()
        .withTitle("No Results Found")
        .withMessage(
          "Your query executed successfully but returned no results.",
        )
        .withSeverity(ErrorSeverity.INFO)
        .withCategory(ErrorCategory.SEMANTIC)
        .withContext({
          operation: "Query Execution",
          timestamp: new Date(),
        })
        .withSuggestions([
          {
            title: "Check Your Query Patterns",
            description:
              "Ensure your triple patterns match existing data in the graph",
            confidence: 0.6,
          },
          {
            title: "Use OPTIONAL Clauses",
            description: "Make some patterns optional to get partial matches",
            confidence: 0.5,
            learnMore: {
              url: "https://www.w3.org/TR/sparql11-query/#optionals",
              title: "SPARQL OPTIONAL Documentation",
            },
          },
        ])
        .withRecoverable(true)
        .build();

      const errorComponent = new ErrorMessageComponent(noResultsError, {
        compact: true,
        showTechnicalDetails: false,
      });

      container.appendChild(errorComponent.render());
    } else {
      const table = this.createResultTable(result.results);
      container.appendChild(table);

      const exportControls = this.createExportControls(
        result.results,
        source.trim(),
      );
      container.appendChild(exportControls);

      const stats = this.createStatsElement(
        result.results.length,
        executionTime,
        result.cached,
      );
      container.appendChild(stats);
    }
  }
}
