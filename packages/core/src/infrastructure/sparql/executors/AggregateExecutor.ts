import type { GroupOperation, AggregateExpression, Expression } from "../algebra/AlgebraOperation";
import type { SolutionMapping } from "../SolutionMapping";

export class AggregateExecutorError extends Error {
  constructor(message: string, cause?: Error) {
    super(message, cause ? { cause } : undefined);
    this.name = "AggregateExecutorError";
  }
}

export class AggregateExecutor {
  execute(
    operation: GroupOperation,
    inputSolutions: SolutionMapping[]
  ): SolutionMapping[] {
    const groups = this.groupSolutions(inputSolutions, operation.variables);
    const results: SolutionMapping[] = [];

    for (const [_groupKey, groupSolutions] of groups.entries()) {
      const resultBindings: Map<string, any> = new Map();

      for (const varName of operation.variables) {
        if (groupSolutions.length > 0) {
          const term = groupSolutions[0].get(varName);
          if (term) {
            resultBindings.set(varName, term);
          }
        }
      }

      for (const aggregate of operation.aggregates) {
        const value = this.computeAggregate(
          aggregate.expression,
          groupSolutions
        );
        resultBindings.set(aggregate.variable, value);
      }

      if (groupSolutions.length > 0) {
        const result = groupSolutions[0].clone();
        for (const [key, value] of resultBindings.entries()) {
          result.set(key, value);
        }
        results.push(result);
      } else {
        const result = new (groupSolutions[0]?.constructor as any || Map)();
        for (const [key, value] of resultBindings.entries()) {
          result.set(key, value);
        }
        results.push(result);
      }
    }

    if (results.length === 0 && operation.aggregates.length > 0) {
      const emptyResult = this.createEmptyAggregateResult(operation);
      if (emptyResult) {
        results.push(emptyResult);
      }
    }

    return results;
  }

  private groupSolutions(
    solutions: SolutionMapping[],
    groupVariables: string[]
  ): Map<string, SolutionMapping[]> {
    const groups = new Map<string, SolutionMapping[]>();

    if (groupVariables.length === 0) {
      groups.set("", solutions);
      return groups;
    }

    for (const solution of solutions) {
      const key = this.computeGroupKey(solution, groupVariables);
      const existing = groups.get(key);
      if (existing) {
        existing.push(solution);
      } else {
        groups.set(key, [solution]);
      }
    }

    return groups;
  }

  private computeGroupKey(solution: SolutionMapping, variables: string[]): string {
    return variables
      .map((v) => {
        const term = solution.get(v);
        if (!term) return "";
        return this.termToString(term);
      })
      .join("|");
  }

  private termToString(term: any): string {
    if (term && typeof term === "object") {
      if ("value" in term) return String(term.value);
      if ("id" in term) return String(term.id);
    }
    return String(term);
  }

  private computeAggregate(
    expr: AggregateExpression,
    solutions: SolutionMapping[]
  ): any {
    const values = this.extractValues(expr, solutions);

    switch (expr.aggregation) {
      case "count":
        return this.computeCount(values, expr.distinct);

      case "sum":
        return this.computeSum(values);

      case "avg":
        return this.computeAvg(values);

      case "min":
        return this.computeMin(values);

      case "max":
        return this.computeMax(values);

      case "group_concat":
        return this.computeGroupConcat(values, expr.separator || " ", expr.distinct);

      default:
        throw new AggregateExecutorError(`Unknown aggregation function: ${expr.aggregation}`);
    }
  }

  private extractValues(expr: AggregateExpression, solutions: SolutionMapping[]): any[] {
    if (!expr.expression) {
      return solutions.map(() => 1);
    }

    const values: any[] = [];
    for (const solution of solutions) {
      const value = this.evaluateExpression(expr.expression, solution);
      if (value !== undefined && value !== null) {
        values.push(value);
      }
    }

    return values;
  }

  private evaluateExpression(expr: Expression, solution: SolutionMapping): any {
    if (expr.type === "variable") {
      const term = solution.get(expr.name);
      if (!term) return undefined;

      if (typeof term === "object" && "value" in term) {
        return term.value;
      }
      return term;
    }

    if (expr.type === "literal") {
      return expr.value;
    }

    return undefined;
  }

  private computeCount(values: any[], distinct: boolean): number {
    if (distinct) {
      return new Set(values.map((v) => String(v))).size;
    }
    return values.length;
  }

  private computeSum(values: any[]): number {
    const nums = values.map((v) => parseFloat(String(v))).filter((n) => !isNaN(n));
    return nums.reduce((acc, n) => acc + n, 0);
  }

  private computeAvg(values: any[]): number {
    const nums = values.map((v) => parseFloat(String(v))).filter((n) => !isNaN(n));
    if (nums.length === 0) return 0;
    return nums.reduce((acc, n) => acc + n, 0) / nums.length;
  }

  private computeMin(values: any[]): any {
    if (values.length === 0) return undefined;

    const nums = values.map((v) => parseFloat(String(v))).filter((n) => !isNaN(n));
    if (nums.length > 0) {
      return Math.min(...nums);
    }

    const strs = values.map((v) => String(v));
    return strs.reduce((min, s) => (s < min ? s : min), strs[0]);
  }

  private computeMax(values: any[]): any {
    if (values.length === 0) return undefined;

    const nums = values.map((v) => parseFloat(String(v))).filter((n) => !isNaN(n));
    if (nums.length > 0) {
      return Math.max(...nums);
    }

    const strs = values.map((v) => String(v));
    return strs.reduce((max, s) => (s > max ? s : max), strs[0]);
  }

  private computeGroupConcat(values: any[], separator: string, distinct: boolean): string {
    let strs = values.map((v) => String(v));

    if (distinct) {
      strs = [...new Set(strs)];
    }

    return strs.join(separator);
  }

  private createEmptyAggregateResult(operation: GroupOperation): SolutionMapping | null {
    const { SolutionMapping: SM } = require("../SolutionMapping");
    const result = new SM();

    for (const aggregate of operation.aggregates) {
      switch (aggregate.expression.aggregation) {
        case "count":
          result.set(aggregate.variable, 0);
          break;
        case "sum":
        case "avg":
          result.set(aggregate.variable, 0);
          break;
        default:
          result.set(aggregate.variable, undefined);
      }
    }

    return result;
  }
}
