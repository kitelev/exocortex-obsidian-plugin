import type { FilterOperation, Expression, AlgebraOperation, ExistsExpression, ArithmeticExpression } from "../algebra/AlgebraOperation";
import type { SolutionMapping } from "../SolutionMapping";
import { BuiltInFunctions } from "../filters/BuiltInFunctions";
import { Literal } from "../../../domain/models/rdf/Literal";

export class FilterExecutorError extends Error {
  constructor(message: string, cause?: Error) {
    super(message, cause ? { cause } : undefined);
    this.name = "FilterExecutorError";
  }
}

/**
 * Callback type for evaluating EXISTS patterns.
 * The callback executes the pattern with the given solution bindings
 * and returns true if at least one result is found.
 */
export type ExistsEvaluator = (pattern: AlgebraOperation, solution: SolutionMapping) => Promise<boolean>;

export class FilterExecutor {
  private existsEvaluator: ExistsEvaluator | null = null;

  /**
   * Set the EXISTS evaluator callback.
   * Must be called before evaluating expressions with EXISTS/NOT EXISTS.
   */
  setExistsEvaluator(evaluator: ExistsEvaluator): void {
    this.existsEvaluator = evaluator;
  }

  async *execute(
    operation: FilterOperation,
    inputSolutions: AsyncIterableIterator<SolutionMapping>
  ): AsyncIterableIterator<SolutionMapping> {
    // Check if expression contains EXISTS to decide sync vs async evaluation
    const hasExists = this.expressionContainsExists(operation.expression);

    for await (const solution of inputSolutions) {
      try {
        let result: boolean;
        if (hasExists) {
          result = await this.evaluateExpressionAsync(operation.expression, solution);
        } else {
          result = this.evaluateExpression(operation.expression, solution);
        }
        if (result === true) {
          yield solution;
        }
      } catch (error) {
        continue;
      }
    }
  }

  /**
   * Check if an expression contains EXISTS or NOT EXISTS.
   */
  private expressionContainsExists(expr: Expression): boolean {
    if (expr.type === "exists") {
      return true;
    }

    if (expr.type === "logical") {
      return (expr as any).operands.some((op: Expression) => this.expressionContainsExists(op));
    }

    if (expr.type === "comparison") {
      return (
        this.expressionContainsExists((expr as any).left) ||
        this.expressionContainsExists((expr as any).right)
      );
    }

    return false;
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

  /**
   * Evaluate a SPARQL expression against a solution mapping.
   * Public to allow reuse in QueryExecutor for BIND evaluation.
   * Note: EXISTS expressions require async evaluation - use evaluateExpressionAsync for those.
   */
  evaluateExpression(expr: Expression, solution: SolutionMapping): any {
    // Handle sparqljs native format (termType) - used by raw parsed expressions
    const anyExpr = expr as any;
    if (anyExpr.termType) {
      switch (anyExpr.termType) {
        case "Variable":
          return solution.get(anyExpr.value);
        case "Literal":
          return anyExpr.value;
        case "NamedNode":
          return anyExpr.value;
        default:
          throw new FilterExecutorError(`Unsupported termType: ${anyExpr.termType}`);
      }
    }

    switch (expr.type) {
      case "comparison":
        return this.evaluateComparison(expr, solution);

      case "logical":
        return this.evaluateLogical(expr, solution);

      case "arithmetic":
        return this.evaluateArithmetic(expr as ArithmeticExpression, solution);

      case "function":
      case "functionCall":
        return this.evaluateFunction(expr, solution);

      case "variable":
        return solution.get((expr as any).name);

      case "literal":
        return (expr as any).value;

      case "exists":
        // EXISTS requires async evaluation; throw error if called synchronously
        throw new FilterExecutorError(
          "EXISTS expressions require async evaluation. Use evaluateExpressionAsync instead."
        );

      default:
        throw new FilterExecutorError(`Unsupported expression type: ${(expr as any).type}, expr.termType=${anyExpr.termType}`);
    }
  }

  /**
   * Evaluate a SPARQL expression asynchronously.
   * Required for EXISTS/NOT EXISTS which need to execute subqueries.
   */
  async evaluateExpressionAsync(expr: Expression, solution: SolutionMapping): Promise<any> {
    if (expr.type === "exists") {
      return this.evaluateExists(expr as ExistsExpression, solution);
    }

    // For logical expressions, need to handle nested EXISTS
    if (expr.type === "logical") {
      return this.evaluateLogicalAsync(expr, solution);
    }

    // For other expression types, use synchronous evaluation
    return this.evaluateExpression(expr, solution);
  }

  /**
   * Evaluate EXISTS or NOT EXISTS expression.
   * Executes the subpattern with current bindings and checks for any results.
   */
  private async evaluateExists(expr: ExistsExpression, solution: SolutionMapping): Promise<boolean> {
    if (!this.existsEvaluator) {
      throw new FilterExecutorError(
        "EXISTS evaluator not set. Call setExistsEvaluator before evaluating EXISTS expressions."
      );
    }

    const exists = await this.existsEvaluator(expr.pattern, solution);
    return expr.negated ? !exists : exists;
  }

  /**
   * Evaluate logical expression asynchronously to handle nested EXISTS.
   */
  private async evaluateLogicalAsync(expr: any, solution: SolutionMapping): Promise<boolean> {
    if (expr.operator === "!") {
      const operand = await this.evaluateExpressionAsync(expr.operands[0], solution);
      return BuiltInFunctions.logicalNot(operand as boolean);
    }

    const results: boolean[] = [];
    for (const op of expr.operands) {
      const result = await this.evaluateExpressionAsync(op, solution);
      results.push(result as boolean);
    }

    if (expr.operator === "&&") {
      return BuiltInFunctions.logicalAnd(results);
    }

    if (expr.operator === "||") {
      return BuiltInFunctions.logicalOr(results);
    }

    throw new FilterExecutorError(`Unknown logical operator: ${expr.operator}`);
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

  /**
   * Evaluate arithmetic expression (+, -, *, /).
   * Supports:
   * - Numeric arithmetic
   * - xsd:dateTime subtraction (returns difference in milliseconds as number)
   */
  private evaluateArithmetic(expr: ArithmeticExpression, solution: SolutionMapping): number {
    const left = this.evaluateExpression(expr.left, solution);
    const right = this.evaluateExpression(expr.right, solution);

    const leftNum = this.toNumericValue(left);
    const rightNum = this.toNumericValue(right);

    // Special handling for dateTime subtraction
    if (expr.operator === "-" && this.isDateTimeValue(left) && this.isDateTimeValue(right)) {
      const leftMs = this.parseDateTimeToMs(left);
      const rightMs = this.parseDateTimeToMs(right);
      // Return difference in milliseconds (positive value)
      return leftMs - rightMs;
    }

    switch (expr.operator) {
      case "+":
        return leftNum + rightNum;
      case "-":
        return leftNum - rightNum;
      case "*":
        return leftNum * rightNum;
      case "/":
        if (rightNum === 0) {
          throw new FilterExecutorError("Division by zero");
        }
        return leftNum / rightNum;
      default:
        throw new FilterExecutorError(`Unknown arithmetic operator: ${expr.operator}`);
    }
  }

  /**
   * Convert a value to a numeric type.
   * Handles: number, Literal with numeric datatype, string representation.
   */
  private toNumericValue(value: any): number {
    if (typeof value === "number") {
      return value;
    }

    if (value instanceof Literal) {
      const datatypeValue = value.datatype?.value || "";
      // Handle numeric datatypes
      if (
        datatypeValue.includes("#integer") ||
        datatypeValue.includes("#decimal") ||
        datatypeValue.includes("#double") ||
        datatypeValue.includes("#float")
      ) {
        const num = parseFloat(value.value);
        if (!isNaN(num)) {
          return num;
        }
      }
      // Try to parse as number anyway
      const num = parseFloat(value.value);
      if (!isNaN(num)) {
        return num;
      }
    }

    if (typeof value === "string") {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        return num;
      }
    }

    // If value has a .value property (like RDF terms)
    if (value && typeof value === "object" && "value" in value) {
      const num = parseFloat(String(value.value));
      if (!isNaN(num)) {
        return num;
      }
    }

    throw new FilterExecutorError(`Cannot convert to number: ${value}`);
  }

  /**
   * Check if a value represents an xsd:dateTime.
   */
  private isDateTimeValue(value: any): boolean {
    if (value instanceof Literal) {
      const datatypeValue = value.datatype?.value || "";
      if (datatypeValue.includes("#dateTime") || datatypeValue.includes("#date")) {
        return true;
      }
      // Try to detect ISO date format in string value
      const datePattern = /^\d{4}-\d{2}-\d{2}(T|\s)/;
      return datePattern.test(value.value);
    }
    if (typeof value === "string") {
      const datePattern = /^\d{4}-\d{2}-\d{2}(T|\s)/;
      return datePattern.test(value);
    }
    return false;
  }

  /**
   * Parse a dateTime value to milliseconds since epoch.
   */
  private parseDateTimeToMs(value: any): number {
    let dateStr: string;
    if (value instanceof Literal) {
      dateStr = value.value;
    } else if (typeof value === "string") {
      dateStr = value;
    } else if (value && typeof value === "object" && "value" in value) {
      dateStr = String(value.value);
    } else {
      throw new FilterExecutorError(`Cannot parse dateTime: ${value}`);
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new FilterExecutorError(`Invalid dateTime format: ${dateStr}`);
    }
    return date.getTime();
  }

  private evaluateFunction(expr: any, solution: SolutionMapping): boolean | string | number {
    // Handle both string function names and NamedNode (IRI) function references
    let funcName: string;
    if (typeof expr.function === "string") {
      funcName = expr.function.toLowerCase();
    } else if (expr.function && typeof expr.function === "object" && "value" in expr.function) {
      // For IRI functions like exo:dateDiffMinutes, extract local name from IRI
      const iri = expr.function.value;
      const localName = iri.includes("#") ? iri.split("#").pop() : iri.split("/").pop();
      funcName = (localName || iri).toLowerCase();
    } else {
      throw new FilterExecutorError(`Unknown function format: ${expr.function}`);
    }

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
        const text = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        const pattern = this.getStringValue(this.evaluateExpression(expr.args[1], solution));
        const flags = expr.args[2] ? this.getStringValue(this.evaluateExpression(expr.args[2], solution)) : undefined;
        return BuiltInFunctions.regex(text, pattern, flags);

      // W3C SPARQL 1.1 String Functions
      case "contains":
        const containsStr = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        const containsSubstr = this.getStringValue(this.evaluateExpression(expr.args[1], solution));
        return BuiltInFunctions.contains(containsStr, containsSubstr);

      case "strstarts":
        const startsStr = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        const startsPrefix = this.getStringValue(this.evaluateExpression(expr.args[1], solution));
        return BuiltInFunctions.strStarts(startsStr, startsPrefix);

      case "strends":
        const endsStr = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        const endsSuffix = this.getStringValue(this.evaluateExpression(expr.args[1], solution));
        return BuiltInFunctions.strEnds(endsStr, endsSuffix);

      case "strlen":
        const lenStr = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        return BuiltInFunctions.strlen(lenStr);

      case "ucase":
        const ucaseStr = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        return BuiltInFunctions.ucase(ucaseStr);

      case "lcase":
        const lcaseStr = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        return BuiltInFunctions.lcase(lcaseStr);

      case "substr":
        const substrStr = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        const substrStart = Number(this.evaluateExpression(expr.args[1], solution));
        if (expr.args[2]) {
          const substrLength = Number(this.evaluateExpression(expr.args[2], solution));
          return BuiltInFunctions.substr(substrStr, substrStart, substrLength);
        }
        return BuiltInFunctions.substr(substrStr, substrStart);

      case "strbefore":
        const beforeStr = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        const beforeSep = this.getStringValue(this.evaluateExpression(expr.args[1], solution));
        return BuiltInFunctions.strBefore(beforeStr, beforeSep);

      case "strafter":
        const afterStr = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        const afterSep = this.getStringValue(this.evaluateExpression(expr.args[1], solution));
        return BuiltInFunctions.strAfter(afterStr, afterSep);

      case "concat":
        const concatArgs = expr.args.map((arg: Expression) =>
          this.getStringValue(this.evaluateExpression(arg, solution))
        );
        return BuiltInFunctions.concat(...concatArgs);

      case "replace":
        const replaceStr = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        const replacePattern = this.getStringValue(this.evaluateExpression(expr.args[1], solution));
        const replaceReplacement = this.getStringValue(this.evaluateExpression(expr.args[2], solution));
        const replaceFlags = expr.args[3] ? this.getStringValue(this.evaluateExpression(expr.args[3], solution)) : undefined;
        return BuiltInFunctions.replace(replaceStr, replacePattern, replaceReplacement, replaceFlags);

      // Date comparison functions
      case "parsedate":
        const parseDateArg = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        return BuiltInFunctions.parseDate(parseDateArg);

      case "datebefore":
        const beforeDate1 = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        const beforeDate2 = this.getStringValue(this.evaluateExpression(expr.args[1], solution));
        return BuiltInFunctions.dateBefore(beforeDate1, beforeDate2);

      case "dateafter":
        const afterDate1 = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        const afterDate2 = this.getStringValue(this.evaluateExpression(expr.args[1], solution));
        return BuiltInFunctions.dateAfter(afterDate1, afterDate2);

      case "dateinrange":
        const rangeDate = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        const rangeStart = this.getStringValue(this.evaluateExpression(expr.args[1], solution));
        const rangeEnd = this.getStringValue(this.evaluateExpression(expr.args[2], solution));
        return BuiltInFunctions.dateInRange(rangeDate, rangeStart, rangeEnd);

      case "datediffminutes":
        const diffMinDate1 = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        const diffMinDate2 = this.getStringValue(this.evaluateExpression(expr.args[1], solution));
        return BuiltInFunctions.dateDiffMinutes(diffMinDate1, diffMinDate2);

      case "datediffhours":
        const diffHoursDate1 = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        const diffHoursDate2 = this.getStringValue(this.evaluateExpression(expr.args[1], solution));
        return BuiltInFunctions.dateDiffHours(diffHoursDate1, diffHoursDate2);

      // SPARQL 1.1 DateTime accessor functions
      case "year":
        const yearDate = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        return BuiltInFunctions.year(yearDate);

      case "month":
        const monthDate = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        return BuiltInFunctions.month(monthDate);

      case "day":
        const dayDate = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        return BuiltInFunctions.day(dayDate);

      case "hours":
        const hoursDate = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        return BuiltInFunctions.hours(hoursDate);

      case "minutes":
        const minutesDate = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        return BuiltInFunctions.minutes(minutesDate);

      case "seconds":
        const secondsDate = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        return BuiltInFunctions.seconds(secondsDate);

      case "timezone":
      case "tz":
        const tzDate = this.getStringValue(this.evaluateExpression(expr.args[0], solution));
        return BuiltInFunctions.timezone(tzDate);

      case "now":
        return BuiltInFunctions.now();

      // Duration conversion functions (for arithmetic results)
      case "mstominutes":
        const msMinArg = Number(this.evaluateExpression(expr.args[0], solution));
        return BuiltInFunctions.msToMinutes(msMinArg);

      case "mstohours":
        const msHoursArg = Number(this.evaluateExpression(expr.args[0], solution));
        return BuiltInFunctions.msToHours(msHoursArg);

      case "mstoseconds":
        const msSecArg = Number(this.evaluateExpression(expr.args[0], solution));
        return BuiltInFunctions.msToSeconds(msSecArg);

      // SPARQL 1.1 Numeric Functions
      case "abs":
        const absArg = Number(this.evaluateExpression(expr.args[0], solution));
        return BuiltInFunctions.abs(absArg);

      case "round":
        const roundArg = Number(this.evaluateExpression(expr.args[0], solution));
        return BuiltInFunctions.round(roundArg);

      case "ceil":
        const ceilArg = Number(this.evaluateExpression(expr.args[0], solution));
        return BuiltInFunctions.ceil(ceilArg);

      case "floor":
        const floorArg = Number(this.evaluateExpression(expr.args[0], solution));
        return BuiltInFunctions.floor(floorArg);

      case "rand":
        return BuiltInFunctions.rand();

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

  /**
   * Extract raw string value from expression result.
   * Handles Literal/IRI objects properly (using .value instead of toString()).
   */
  private getStringValue(value: any): string {
    if (value === null || value === undefined) {
      return "";
    }
    // If it's an RDF term with a value property, use that
    if (typeof value === "object" && "value" in value) {
      return String(value.value);
    }
    return String(value);
  }
}
