import { AggregateExecutor } from "../../../../src/infrastructure/sparql/executors/AggregateExecutor";
import { SolutionMapping } from "../../../../src/infrastructure/sparql/SolutionMapping";
import type { GroupOperation, AggregateBinding, AggregateExpression } from "../../../../src/infrastructure/sparql/algebra/AlgebraOperation";
import { Literal } from "../../../../src/domain/models/rdf/Literal";

describe("AggregateExecutor", () => {
  let executor: AggregateExecutor;

  beforeEach(() => {
    executor = new AggregateExecutor();
  });

  const createSolution = (bindings: Record<string, any>): SolutionMapping => {
    const solution = new SolutionMapping();
    for (const [key, value] of Object.entries(bindings)) {
      solution.set(key, value);
    }
    return solution;
  };

  /**
   * Helper to get aggregate result value - aggregate results are now RDF Literals
   */
  const getAggregateValue = (solution: SolutionMapping, variable: string): any => {
    const term = solution.get(variable);
    if (term instanceof Literal) {
      const rawValue = term.value;
      // Try to parse as number if it looks like one
      const num = parseFloat(rawValue);
      if (!isNaN(num) && rawValue === String(num)) {
        return num;
      }
      return rawValue;
    }
    return term;
  };

  const createGroupOperation = (
    variables: string[],
    aggregates: AggregateBinding[],
    input: any = { type: "bgp", patterns: [] }
  ): GroupOperation => ({
    type: "group",
    variables,
    aggregates,
    input,
  });

  const createCountAggregate = (variable: string, distinct = false): AggregateBinding => ({
    variable,
    expression: {
      type: "aggregate",
      aggregation: "count",
      distinct,
    },
  });

  const createSumAggregate = (variable: string, varName: string): AggregateBinding => ({
    variable,
    expression: {
      type: "aggregate",
      aggregation: "sum",
      expression: { type: "variable", name: varName },
      distinct: false,
    },
  });

  const createAvgAggregate = (variable: string, varName: string): AggregateBinding => ({
    variable,
    expression: {
      type: "aggregate",
      aggregation: "avg",
      expression: { type: "variable", name: varName },
      distinct: false,
    },
  });

  const createMinAggregate = (variable: string, varName: string): AggregateBinding => ({
    variable,
    expression: {
      type: "aggregate",
      aggregation: "min",
      expression: { type: "variable", name: varName },
      distinct: false,
    },
  });

  const createMaxAggregate = (variable: string, varName: string): AggregateBinding => ({
    variable,
    expression: {
      type: "aggregate",
      aggregation: "max",
      expression: { type: "variable", name: varName },
      distinct: false,
    },
  });

  const createGroupConcatAggregate = (
    variable: string,
    varName: string,
    separator = " ",
    distinct = false
  ): AggregateBinding => ({
    variable,
    expression: {
      type: "aggregate",
      aggregation: "group_concat",
      expression: { type: "variable", name: varName },
      separator,
      distinct,
    },
  });

  describe("COUNT", () => {
    it("should count all solutions without grouping", () => {
      const solutions = [
        createSolution({ x: "a" }),
        createSolution({ x: "b" }),
        createSolution({ x: "c" }),
      ];

      const operation = createGroupOperation([], [createCountAggregate("count")]);
      const results = executor.execute(operation, solutions);

      expect(results).toHaveLength(1);
      expect(getAggregateValue(results[0], "count")).toBe(3);
    });

    it("should count with GROUP BY", () => {
      const solutions = [
        createSolution({ class: "Task", x: "1" }),
        createSolution({ class: "Task", x: "2" }),
        createSolution({ class: "Project", x: "3" }),
      ];

      const operation = createGroupOperation(["class"], [createCountAggregate("count")]);
      const results = executor.execute(operation, solutions);

      expect(results).toHaveLength(2);

      // Use toJSON() for string comparison since get() returns RDF terms
      const taskResult = results.find((r) => r.toJSON()["class"] === "Task");
      const projectResult = results.find((r) => r.toJSON()["class"] === "Project");

      expect(getAggregateValue(taskResult!, "count")).toBe(2);
      expect(getAggregateValue(projectResult!, "count")).toBe(1);
    });

    it("should count distinct values", () => {
      const solutions = [
        createSolution({ x: "a" }),
        createSolution({ x: "a" }),
        createSolution({ x: "b" }),
      ];

      // COUNT(DISTINCT ?x) - must specify expression for distinct
      const operation = createGroupOperation([], [{
        variable: "count",
        expression: {
          type: "aggregate",
          aggregation: "count",
          expression: { type: "variable", name: "x" },
          distinct: true,
        },
      }]);
      const results = executor.execute(operation, solutions);

      expect(results).toHaveLength(1);
      expect(getAggregateValue(results[0], "count")).toBe(2); // distinct: 'a' and 'b'
    });
  });

  describe("SUM", () => {
    it("should sum numeric values", () => {
      const solutions = [
        createSolution({ value: 10 }),
        createSolution({ value: 20 }),
        createSolution({ value: 30 }),
      ];

      const operation = createGroupOperation([], [createSumAggregate("total", "value")]);
      const results = executor.execute(operation, solutions);

      expect(results).toHaveLength(1);
      expect(getAggregateValue(results[0], "total")).toBe(60);
    });

    it("should handle string numbers", () => {
      const solutions = [
        createSolution({ value: "10" }),
        createSolution({ value: "20" }),
      ];

      const operation = createGroupOperation([], [createSumAggregate("total", "value")]);
      const results = executor.execute(operation, solutions);

      expect(results).toHaveLength(1);
      expect(getAggregateValue(results[0], "total")).toBe(30);
    });
  });

  describe("AVG", () => {
    it("should compute average", () => {
      const solutions = [
        createSolution({ value: 10 }),
        createSolution({ value: 20 }),
        createSolution({ value: 30 }),
      ];

      const operation = createGroupOperation([], [createAvgAggregate("avg", "value")]);
      const results = executor.execute(operation, solutions);

      expect(results).toHaveLength(1);
      expect(getAggregateValue(results[0], "avg")).toBe(20);
    });

    it("should return 0 for empty input", () => {
      const solutions: SolutionMapping[] = [];

      const operation = createGroupOperation([], [createAvgAggregate("avg", "value")]);
      const results = executor.execute(operation, solutions);

      expect(results).toHaveLength(1);
      expect(getAggregateValue(results[0], "avg")).toBe(0);
    });
  });

  describe("MIN", () => {
    it("should find minimum numeric value", () => {
      const solutions = [
        createSolution({ value: 30 }),
        createSolution({ value: 10 }),
        createSolution({ value: 20 }),
      ];

      const operation = createGroupOperation([], [createMinAggregate("min", "value")]);
      const results = executor.execute(operation, solutions);

      expect(results).toHaveLength(1);
      expect(getAggregateValue(results[0], "min")).toBe(10);
    });

    it("should find minimum string value", () => {
      const solutions = [
        createSolution({ value: "charlie" }),
        createSolution({ value: "alpha" }),
        createSolution({ value: "bravo" }),
      ];

      const operation = createGroupOperation([], [createMinAggregate("min", "value")]);
      const results = executor.execute(operation, solutions);

      expect(results).toHaveLength(1);
      expect(getAggregateValue(results[0], "min")).toBe("alpha");
    });
  });

  describe("MAX", () => {
    it("should find maximum numeric value", () => {
      const solutions = [
        createSolution({ value: 10 }),
        createSolution({ value: 30 }),
        createSolution({ value: 20 }),
      ];

      const operation = createGroupOperation([], [createMaxAggregate("max", "value")]);
      const results = executor.execute(operation, solutions);

      expect(results).toHaveLength(1);
      expect(getAggregateValue(results[0], "max")).toBe(30);
    });
  });

  describe("GROUP_CONCAT", () => {
    it("should concatenate values with default separator", () => {
      const solutions = [
        createSolution({ name: "Alice" }),
        createSolution({ name: "Bob" }),
        createSolution({ name: "Charlie" }),
      ];

      const operation = createGroupOperation([], [createGroupConcatAggregate("names", "name")]);
      const results = executor.execute(operation, solutions);

      expect(results).toHaveLength(1);
      expect(getAggregateValue(results[0], "names")).toBe("Alice Bob Charlie");
    });

    it("should concatenate values with custom separator", () => {
      const solutions = [
        createSolution({ name: "Alice" }),
        createSolution({ name: "Bob" }),
      ];

      const operation = createGroupOperation([], [createGroupConcatAggregate("names", "name", ", ")]);
      const results = executor.execute(operation, solutions);

      expect(results).toHaveLength(1);
      expect(getAggregateValue(results[0], "names")).toBe("Alice, Bob");
    });

    it("should handle distinct values", () => {
      const solutions = [
        createSolution({ name: "Alice" }),
        createSolution({ name: "Alice" }),
        createSolution({ name: "Bob" }),
      ];

      const operation = createGroupOperation([], [createGroupConcatAggregate("names", "name", " ", true)]);
      const results = executor.execute(operation, solutions);

      expect(results).toHaveLength(1);
      expect(getAggregateValue(results[0], "names")).toBe("Alice Bob");
    });
  });

  describe("Multiple aggregates", () => {
    it("should compute multiple aggregates in one query", () => {
      const solutions = [
        createSolution({ value: 10 }),
        createSolution({ value: 20 }),
        createSolution({ value: 30 }),
      ];

      const operation = createGroupOperation([], [
        createCountAggregate("count"),
        createSumAggregate("total", "value"),
        createAvgAggregate("average", "value"),
        createMinAggregate("minimum", "value"),
        createMaxAggregate("maximum", "value"),
      ]);
      const results = executor.execute(operation, solutions);

      expect(results).toHaveLength(1);
      expect(getAggregateValue(results[0], "count")).toBe(3);
      expect(getAggregateValue(results[0], "total")).toBe(60);
      expect(getAggregateValue(results[0], "average")).toBe(20);
      expect(getAggregateValue(results[0], "minimum")).toBe(10);
      expect(getAggregateValue(results[0], "maximum")).toBe(30);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty input with COUNT returning 0", () => {
      const solutions: SolutionMapping[] = [];

      const operation = createGroupOperation([], [createCountAggregate("count")]);
      const results = executor.execute(operation, solutions);

      expect(results).toHaveLength(1);
      expect(getAggregateValue(results[0], "count")).toBe(0);
    });

    it("should handle missing values in aggregation", () => {
      const solutions = [
        createSolution({ value: 10 }),
        createSolution({}), // missing 'value'
        createSolution({ value: 20 }),
      ];

      const operation = createGroupOperation([], [createSumAggregate("total", "value")]);
      const results = executor.execute(operation, solutions);

      expect(results).toHaveLength(1);
      expect(getAggregateValue(results[0], "total")).toBe(30); // Only valid values summed
    });
  });
});
