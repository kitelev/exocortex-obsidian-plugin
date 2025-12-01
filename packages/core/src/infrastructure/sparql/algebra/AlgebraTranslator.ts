import type { SPARQLQuery, SelectQuery } from "../SPARQLParser";
import type {
  AlgebraOperation,
  BGPOperation,
  FilterOperation,
  LeftJoinOperation,
  UnionOperation,
  ExtendOperation,
  SubqueryOperation,
  ExistsExpression,
  ArithmeticExpression,
  Triple,
  TripleElement,
  Expression,
  OrderComparator,
  AggregateBinding,
  AggregateExpression,
  PropertyPath,
  IRI,
} from "./AlgebraOperation";

export class AlgebraTranslatorError extends Error {
  constructor(message: string, cause?: Error) {
    super(message, cause ? { cause } : undefined);
    this.name = "AlgebraTranslatorError";
  }
}

export class AlgebraTranslator {
  translate(query: SPARQLQuery): AlgebraOperation {
    if (query.type !== "query") {
      throw new AlgebraTranslatorError("Only SELECT queries are currently supported");
    }

    if (query.queryType !== "SELECT") {
      throw new AlgebraTranslatorError(`Query type ${query.queryType} not yet supported`);
    }

    return this.translateSelect(query as SelectQuery);
  }

  private translateSelect(query: SelectQuery): AlgebraOperation {
    let operation: AlgebraOperation;

    if (!query.where || query.where.length === 0) {
      throw new AlgebraTranslatorError("SELECT query must have WHERE clause");
    }

    operation = this.translateWhere(query.where);

    const aggregates = this.extractAggregates(query.variables);
    const groupVars = this.extractGroupVariables(query.group);

    if (aggregates.length > 0 || groupVars.length > 0) {
      operation = {
        type: "group",
        variables: groupVars,
        aggregates: aggregates,
        input: operation,
      };
    }

    if (query.variables && query.variables.length > 0) {
      // First, create extend operations for computed expressions (e.g., (expr AS ?var))
      for (const v of query.variables) {
        const anyV = v as any;
        if (anyV.expression && anyV.variable) {
          // This is a computed expression like (exo:dateDiffMinutes(?start, ?end) AS ?duration)
          operation = {
            type: "extend",
            variable: anyV.variable.value,
            expression: anyV.expression,
            input: operation,
          };
        }
      }

      const varNames = query.variables
        .filter((v: any) => v.termType === "Variable" || (v as any).variable)
        .map((v: any) => v.termType === "Variable" ? v.value : (v as any).variable.value);

      if (varNames.length > 0) {
        operation = {
          type: "project",
          variables: varNames,
          input: operation,
        };
      }
    }

    if (query.distinct) {
      operation = {
        type: "distinct",
        input: operation,
      };
    }

    if (query.order && query.order.length > 0) {
      operation = {
        type: "orderby",
        comparators: query.order.map((o: any) => this.translateOrderComparator(o)),
        input: operation,
      };
    }

    if (query.limit !== undefined || query.offset !== undefined) {
      operation = {
        type: "slice",
        limit: query.limit,
        offset: query.offset,
        input: operation,
      };
    }

    return operation;
  }

  private extractAggregates(variables: any[]): AggregateBinding[] {
    if (!variables) return [];

    return variables
      .filter((v: any) => v.expression && v.expression.type === "aggregate")
      .map((v: any) => ({
        variable: v.variable.value,
        expression: this.translateAggregateExpression(v.expression),
      }));
  }

  private extractGroupVariables(group: any[] | undefined): string[] {
    if (!group) return [];

    return group
      .filter((g: any) => g.expression && g.expression.termType === "Variable")
      .map((g: any) => g.expression.value);
  }

  private translateAggregateExpression(expr: any): AggregateExpression {
    return {
      type: "aggregate",
      aggregation: expr.aggregation.toLowerCase() as AggregateExpression["aggregation"],
      expression: expr.expression ? this.translateExpression(expr.expression) : undefined,
      distinct: expr.distinct || false,
      separator: expr.separator,
    };
  }

  private translateWhere(patterns: any[]): AlgebraOperation {
    if (patterns.length === 0) {
      throw new AlgebraTranslatorError("Empty WHERE clause");
    }

    // Separate FILTER and BIND patterns from other patterns
    // FILTER and BIND apply to the result of other patterns, not joined with them
    const filterPatterns = patterns.filter((p) => p.type === "filter");
    const bindPatterns = patterns.filter((p) => p.type === "bind");
    const otherPatterns = patterns.filter((p) => p.type !== "filter" && p.type !== "bind");

    // First, translate and join all non-filter, non-bind patterns
    let result: AlgebraOperation;

    if (otherPatterns.length === 0) {
      // Only filters/binds with no base patterns - use empty BGP
      result = { type: "bgp", triples: [] } as BGPOperation;
    } else if (otherPatterns.length === 1) {
      result = this.translatePattern(otherPatterns[0]);
    } else {
      const operations = otherPatterns.map((p) => this.translatePattern(p));
      result = operations.reduce((left, right) => ({
        type: "join",
        left,
        right,
      }));
    }

    // Apply BIND operations (they extend solutions with computed values)
    for (const bindPattern of bindPatterns) {
      result = this.translateBind(bindPattern, result);
    }

    // Then, wrap with FILTER operations (they apply to the combined result)
    for (const filterPattern of filterPatterns) {
      result = {
        type: "filter",
        expression: this.translateExpression(filterPattern.expression),
        input: result,
      };
    }

    return result;
  }

  private translatePattern(pattern: any): AlgebraOperation {
    if (!pattern || !pattern.type) {
      throw new AlgebraTranslatorError("Invalid pattern: missing type");
    }

    switch (pattern.type) {
      case "bgp":
        return this.translateBGP(pattern);
      case "filter":
        return this.translateFilter(pattern);
      case "optional":
        return this.translateOptional(pattern);
      case "union":
        return this.translateUnion(pattern);
      case "group":
        return this.translateWhere(pattern.patterns);
      case "query":
        return this.translateSubquery(pattern);
      default:
        throw new AlgebraTranslatorError(`Unsupported pattern type: ${pattern.type}`);
    }
  }

  private translateBGP(pattern: any): BGPOperation {
    if (!pattern.triples || !Array.isArray(pattern.triples)) {
      throw new AlgebraTranslatorError("BGP pattern must have triples array");
    }

    return {
      type: "bgp",
      triples: pattern.triples.map((t: any) => this.translateTriple(t)),
    };
  }

  private translateTriple(triple: any): Triple {
    if (!triple.subject || !triple.predicate || !triple.object) {
      throw new AlgebraTranslatorError("Triple must have subject, predicate, and object");
    }

    return {
      subject: this.translateTripleElement(triple.subject),
      predicate: this.translatePredicate(triple.predicate),
      object: this.translateTripleElement(triple.object),
    };
  }

  /**
   * Translate a predicate which can be either a simple IRI/Variable or a property path.
   * sparqljs uses type: "path" for property paths, termType for regular terms.
   */
  private translatePredicate(predicate: any): TripleElement | PropertyPath {
    // Check if this is a property path (sparqljs uses type: "path")
    if (predicate.type === "path") {
      return this.translatePropertyPath(predicate);
    }

    // Otherwise it's a regular triple element (IRI, Variable, etc.)
    return this.translateTripleElement(predicate);
  }

  /**
   * Translate a property path expression from sparqljs AST.
   * sparqljs format: { type: "path", pathType: "+"|"*"|"?"|"^"|"/"|"|", items: [...] }
   */
  private translatePropertyPath(path: any): PropertyPath {
    if (!path.pathType) {
      throw new AlgebraTranslatorError("Property path must have pathType");
    }

    if (!path.items || !Array.isArray(path.items)) {
      throw new AlgebraTranslatorError("Property path must have items array");
    }

    const translatedItems = path.items.map((item: any) => this.translatePathItem(item));

    switch (path.pathType) {
      case "/":
        return {
          type: "path",
          pathType: "/",
          items: translatedItems,
        };
      case "|":
        return {
          type: "path",
          pathType: "|",
          items: translatedItems,
        };
      case "^":
        if (translatedItems.length !== 1) {
          throw new AlgebraTranslatorError("Inverse path must have exactly one item");
        }
        return {
          type: "path",
          pathType: "^",
          items: [translatedItems[0]],
        };
      case "+":
        if (translatedItems.length !== 1) {
          throw new AlgebraTranslatorError("OneOrMore path must have exactly one item");
        }
        return {
          type: "path",
          pathType: "+",
          items: [translatedItems[0]],
        };
      case "*":
        if (translatedItems.length !== 1) {
          throw new AlgebraTranslatorError("ZeroOrMore path must have exactly one item");
        }
        return {
          type: "path",
          pathType: "*",
          items: [translatedItems[0]],
        };
      case "?":
        if (translatedItems.length !== 1) {
          throw new AlgebraTranslatorError("ZeroOrOne path must have exactly one item");
        }
        return {
          type: "path",
          pathType: "?",
          items: [translatedItems[0]],
        };
      default:
        throw new AlgebraTranslatorError(`Unsupported property path type: ${path.pathType}`);
    }
  }

  /**
   * Translate a single item in a property path.
   * Can be either an IRI (NamedNode) or a nested path.
   */
  private translatePathItem(item: any): IRI | PropertyPath {
    // Nested property path
    if (item.type === "path") {
      return this.translatePropertyPath(item);
    }

    // IRI (NamedNode)
    if (item.termType === "NamedNode") {
      return {
        type: "iri",
        value: item.value,
      };
    }

    throw new AlgebraTranslatorError(`Unsupported path item type: ${item.type || item.termType}`);
  }

  private translateTripleElement(element: any): TripleElement {
    if (!element || !element.termType) {
      throw new AlgebraTranslatorError("Triple element must have termType");
    }

    switch (element.termType) {
      case "Variable":
        return {
          type: "variable",
          value: element.value,
        };
      case "NamedNode":
        return {
          type: "iri",
          value: element.value,
        };
      case "Literal":
        return {
          type: "literal",
          value: element.value,
          datatype: element.datatype?.value,
          language: element.language,
        };
      case "BlankNode":
        return {
          type: "blank",
          value: element.value,
        };
      default:
        throw new AlgebraTranslatorError(`Unsupported term type: ${element.termType}`);
    }
  }

  private translateFilter(pattern: any): FilterOperation {
    if (!pattern.expression) {
      throw new AlgebraTranslatorError("Filter pattern must have expression");
    }

    const input: AlgebraOperation = pattern.patterns
      ? this.translateWhere(pattern.patterns)
      : ({ type: "bgp", triples: [] } as BGPOperation);

    return {
      type: "filter",
      expression: this.translateExpression(pattern.expression),
      input,
    };
  }

  private translateExpression(expr: any): Expression {
    if (!expr) {
      throw new AlgebraTranslatorError("Expression cannot be null or undefined");
    }

    // Handle expressions with 'type' property (operations, function calls)
    if (expr.type === "operation") {
      return this.translateOperationExpression(expr);
    }

    if (expr.type === "functioncall" || expr.type === "functionCall") {
      return {
        type: "functionCall",
        function: expr.function,
        args: expr.args.map((a: any) => this.translateExpression(a)),
      };
    }

    // Handle terms with 'termType' property (variables, literals, IRIs)
    if (expr.termType) {
      return this.translateTermExpression(expr);
    }

    // If neither type nor termType, throw error
    throw new AlgebraTranslatorError(`Unsupported expression structure: ${JSON.stringify(expr)}`);
  }

  private translateOperationExpression(expr: any): Expression {
    const comparisonOps = ["=", "!=", "<", ">", "<=", ">="];
    const logicalOps = ["&&", "||", "!"];
    const arithmeticOps = ["+", "-", "*", "/"];

    if (comparisonOps.includes(expr.operator)) {
      return {
        type: "comparison",
        operator: expr.operator,
        left: this.translateExpression(expr.args[0]),
        right: this.translateExpression(expr.args[1]),
      };
    }

    if (logicalOps.includes(expr.operator)) {
      return {
        type: "logical",
        operator: expr.operator,
        operands: expr.args.map((a: any) => this.translateExpression(a)),
      };
    }

    // Handle arithmetic operators (+, -, *, /)
    if (arithmeticOps.includes(expr.operator)) {
      return {
        type: "arithmetic",
        operator: expr.operator as ArithmeticExpression["operator"],
        left: this.translateExpression(expr.args[0]),
        right: this.translateExpression(expr.args[1]),
      };
    }

    // Handle EXISTS and NOT EXISTS
    if (expr.operator === "exists" || expr.operator === "notexists") {
      return this.translateExistsExpression(expr);
    }

    return {
      type: "function",
      function: expr.operator,
      args: expr.args.map((a: any) => this.translateExpression(a)),
    };
  }

  /**
   * Translate EXISTS or NOT EXISTS expression.
   * sparqljs AST: { type: "operation", operator: "exists"|"notexists", args: [pattern] }
   * The pattern is a graph pattern (BGP, group, etc.) that needs to be evaluated.
   */
  private translateExistsExpression(expr: any): ExistsExpression {
    if (!expr.args || expr.args.length !== 1) {
      throw new AlgebraTranslatorError("EXISTS/NOT EXISTS must have exactly one pattern argument");
    }

    const patternArg = expr.args[0];
    let pattern: AlgebraOperation;

    // Handle group pattern (most common for EXISTS)
    if (patternArg.type === "group" && patternArg.patterns) {
      pattern = this.translateWhere(patternArg.patterns);
    } else if (patternArg.type === "bgp") {
      pattern = this.translateBGP(patternArg);
    } else {
      // Try to translate as a generic pattern
      pattern = this.translatePattern(patternArg);
    }

    return {
      type: "exists",
      negated: expr.operator === "notexists",
      pattern,
    };
  }

  private translateTermExpression(term: any): Expression {
    if (term.termType === "Variable") {
      return {
        type: "variable",
        name: term.value,
      };
    }

    if (term.termType === "Literal") {
      let value: string | number | boolean = term.value;
      if (term.datatype) {
        if (term.datatype.value.includes("#integer") || term.datatype.value.includes("#decimal")) {
          value = parseFloat(term.value);
        } else if (term.datatype.value.includes("#boolean")) {
          value = term.value === "true";
        }
      }

      return {
        type: "literal",
        value,
        datatype: term.datatype?.value,
      };
    }

    return {
      type: "literal",
      value: String(term.value || term),
    };
  }

  private translateOptional(pattern: any): LeftJoinOperation {
    if (!pattern.patterns || pattern.patterns.length === 0) {
      throw new AlgebraTranslatorError("OPTIONAL pattern must have patterns");
    }

    return {
      type: "leftjoin",
      left: { type: "bgp", triples: [] },
      right: this.translateWhere(pattern.patterns),
      expression: pattern.expression ? this.translateExpression(pattern.expression) : undefined,
    };
  }

  private translateUnion(pattern: any): UnionOperation {
    if (!pattern.patterns || pattern.patterns.length !== 2) {
      throw new AlgebraTranslatorError("UNION pattern must have exactly 2 patterns");
    }

    return {
      type: "union",
      left: this.translateWhere(pattern.patterns[0].patterns || [pattern.patterns[0]]),
      right: this.translateWhere(pattern.patterns[1].patterns || [pattern.patterns[1]]),
    };
  }

  /**
   * Translate BIND(expression AS ?variable) pattern to extend operation.
   * BIND creates a new binding in each solution by evaluating an expression.
   */
  private translateBind(pattern: any, input: AlgebraOperation): ExtendOperation {
    if (!pattern.variable || !pattern.expression) {
      throw new AlgebraTranslatorError("BIND pattern must have variable and expression");
    }

    return {
      type: "extend",
      variable: pattern.variable.value,
      expression: this.translateExpression(pattern.expression),
      input,
    };
  }

  private translateOrderComparator(order: any): OrderComparator {
    return {
      expression: this.translateExpression(order.expression),
      descending: order.descending || false,
    };
  }

  /**
   * Translate a subquery (nested SELECT) into a SubqueryOperation.
   * A subquery is a complete SELECT query that produces solution mappings
   * which are then joined with the outer query.
   *
   * sparqljs AST format:
   * {
   *   type: "query",
   *   queryType: "SELECT",
   *   variables: [...],
   *   where: [...],
   *   order: [...],
   *   limit: number,
   *   offset: number,
   *   distinct: boolean
   * }
   */
  private translateSubquery(pattern: any): SubqueryOperation {
    if (pattern.queryType !== "SELECT") {
      throw new AlgebraTranslatorError(`Only SELECT subqueries are supported, got: ${pattern.queryType}`);
    }

    // Translate the inner SELECT query using the same translateSelect method
    // This reuses all existing logic for handling variables, WHERE clause,
    // GROUP BY, ORDER BY, LIMIT, OFFSET, DISTINCT, etc.
    const innerQuery = this.translateSelect(pattern as SelectQuery);

    return {
      type: "subquery",
      query: innerQuery,
    };
  }
}
