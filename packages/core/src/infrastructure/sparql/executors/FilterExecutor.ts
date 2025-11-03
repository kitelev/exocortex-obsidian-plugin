import type { FilterOperation, Expression } from "../algebra/AlgebraOperation";
import type { SolutionMapping } from "../SolutionMapping";
import { BuiltInFunctions } from "../filters/BuiltInFunctions";

export class FilterExecutorError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "FilterExecutorError";
  }
}

export class FilterExecutor {
  async *execute(
    operation: FilterOperation,
    inputSolutions: AsyncIterableIterator<SolutionMapping>
  ): AsyncIterableIterator<SolutionMapping> {
    for await (const solution of inputSolutions) {
      try {
        const result = this.evaluateExpression(operation.expression, solution);
        if (result === true) {
          yield solution;
        }
      } catch (error) {
        continue;
      }
    }
  }

  async executeAll(operation: FilterOperation, inputSolutions: SolutionMapping[]): Promise<SolutionMapping[]> {
    const results: SolutionMapping[] = [];

    async function* generator() {
      for (const solution of inputSolutions) {
        yield solution;
      }
    }

    for await (const solution of this.execute(operation, generator())) {
      results.push(solution);
    }

    return results;
  }

  private evaluateExpression(expr: Expression, solution: SolutionMapping): any {
    switch (expr.type) {
      case "comparison":
        return this.evaluateComparison(expr, solution);

      case "logical":
        return this.evaluateLogical(expr, solution);

      case "function":
        return this.evaluateFunction(expr, solution);

      case "variable":
        return solution.get(expr.name);

      case "literal":
        return expr.value;

      default:
        throw new FilterExecutorError(`Unsupported expression type: ${(expr as any).type}`);
    }
  }

  private evaluateComparison(expr: any, solution: SolutionMapping): boolean {
    const left = this.evaluateExpression(expr.left, solution);
    const right = this.evaluateExpression(expr.right, solution);

    return BuiltInFunctions.compare(left, right, expr.operator);
  }

  private evaluateLogical(expr: any, solution: SolutionMapping): boolean {
    if (expr.operator === "!") {
      const operand = this.evaluateExpression(expr.operands[0], solution);
      return BuiltInFunctions.logicalNot(operand as boolean);
    }

    const results = expr.operands.map((op: Expression) => {
      const result = this.evaluateExpression(op, solution);
      return result as boolean;
    });

    if (expr.operator === "&&") {
      return BuiltInFunctions.logicalAnd(results);
    }

    if (expr.operator === "||") {
      return BuiltInFunctions.logicalOr(results);
    }

    throw new FilterExecutorError(`Unknown logical operator: ${expr.operator}`);
  }

  private evaluateFunction(expr: any, solution: SolutionMapping): boolean | string | number {
    const funcName = expr.function.toLowerCase();

    switch (funcName) {
      case "str":
        const strArg = this.getTermFromExpression(expr.args[0], solution);
        return BuiltInFunctions.str(strArg);

      case "lang":
        const langArg = this.getTermFromExpression(expr.args[0], solution);
        return BuiltInFunctions.lang(langArg);

      case "datatype":
        const dtArg = this.getTermFromExpression(expr.args[0], solution);
        return BuiltInFunctions.datatype(dtArg).value;

      case "bound":
        if (expr.args[0].type === "variable") {
          const term = solution.get(expr.args[0].name);
          return BuiltInFunctions.bound(term);
        }
        return true;

      case "isiri":
      case "isuri":
        const iriArg = this.getTermFromExpression(expr.args[0], solution);
        return BuiltInFunctions.isIRI(iriArg);

      case "isblank":
        const blankArg = this.getTermFromExpression(expr.args[0], solution);
        return BuiltInFunctions.isBlank(blankArg);

      case "isliteral":
        const litArg = this.getTermFromExpression(expr.args[0], solution);
        return BuiltInFunctions.isLiteral(litArg);

      case "regex":
        const text = String(this.evaluateExpression(expr.args[0], solution));
        const pattern = String(this.evaluateExpression(expr.args[1], solution));
        const flags = expr.args[2] ? String(this.evaluateExpression(expr.args[2], solution)) : undefined;
        return BuiltInFunctions.regex(text, pattern, flags);

      default:
        throw new FilterExecutorError(`Unknown function: ${funcName}`);
    }
  }

  private getTermFromExpression(expr: Expression, solution: SolutionMapping): any {
    if (expr.type === "variable") {
      return solution.get(expr.name);
    }
    return undefined;
  }
}
