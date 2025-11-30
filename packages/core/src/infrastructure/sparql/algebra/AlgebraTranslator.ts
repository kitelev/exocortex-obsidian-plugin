import type { SPARQLQuery, SelectQuery } from "../SPARQLParser";
import type {
  AlgebraOperation,
  BGPOperation,
  FilterOperation,
  LeftJoinOperation,
  UnionOperation,
  Triple,
  TripleElement,
  Expression,
  OrderComparator,
  AggregateBinding,
  AggregateExpression,
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
      const varNames = query.variables
        .filter((v: any) => v.termType === "Variable" || v.variable)
        .map((v: any) => v.termType === "Variable" ? v.value : v.variable.value);

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

    const operations = patterns.map((p) => this.translatePattern(p));

    if (operations.length === 1) {
      return operations[0];
    }

    return operations.reduce((left, right) => ({
      type: "join",
      left,
      right,
    }));
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
      predicate: this.translateTripleElement(triple.predicate),
      object: this.translateTripleElement(triple.object),
    };
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

    if (expr.type === "functioncall") {
      return {
        type: "function",
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

    return {
      type: "function",
      function: expr.operator,
      args: expr.args.map((a: any) => this.translateExpression(a)),
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

  private translateOrderComparator(order: any): OrderComparator {
    return {
      expression: this.translateExpression(order.expression),
      descending: order.descending || false,
    };
  }
}
