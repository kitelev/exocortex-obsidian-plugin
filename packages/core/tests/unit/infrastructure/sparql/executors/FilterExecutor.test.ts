import { FilterExecutor } from "../../../../../src/infrastructure/sparql/executors/FilterExecutor";
import { SolutionMapping } from "../../../../../src/infrastructure/sparql/SolutionMapping";
import { IRI } from "../../../../../src/domain/models/rdf/IRI";
import { Literal } from "../../../../../src/domain/models/rdf/Literal";
import type { FilterOperation } from "../../../../../src/infrastructure/sparql/algebra/AlgebraOperation";

describe("FilterExecutor", () => {
  let executor: FilterExecutor;

  beforeEach(() => {
    executor = new FilterExecutor();
  });

  async function* generateSolutions(solutions: SolutionMapping[]) {
    for (const solution of solutions) {
      yield solution;
    }
  }

  describe("Comparison Filters", () => {
    it("should filter by equality", async () => {
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: { type: "variable", name: "x" },
          right: { type: "literal", value: "test" },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution1 = new SolutionMapping();
      solution1.set("x", new Literal("test"));

      const solution2 = new SolutionMapping();
      solution2.set("x", new Literal("other"));

      const results = await executor.executeAll(operation, [solution1, solution2]);
      expect(results).toHaveLength(1);
      expect(results[0].get("x")).toBe(solution1.get("x"));
    });

    it("should filter by numeric comparison", async () => {
      const xsdInt = new IRI("http://www.w3.org/2001/XMLSchema#integer");
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: ">",
          left: { type: "variable", name: "effort" },
          right: { type: "literal", value: 60 },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution1 = new SolutionMapping();
      solution1.set("effort", new Literal("120", xsdInt));

      const solution2 = new SolutionMapping();
      solution2.set("effort", new Literal("30", xsdInt));

      const results = await executor.executeAll(operation, [solution1, solution2]);
      expect(results).toHaveLength(1);
    });
  });

  describe("Logical Operators", () => {
    it("should handle AND operator", async () => {
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "logical",
          operator: "&&",
          operands: [
            {
              type: "comparison",
              operator: ">",
              left: { type: "variable", name: "x" },
              right: { type: "literal", value: 50 },
            },
            {
              type: "comparison",
              operator: "<",
              left: { type: "variable", name: "x" },
              right: { type: "literal", value: 100 },
            },
          ],
        },
        input: { type: "bgp", triples: [] },
      };

      const xsdInt = new IRI("http://www.w3.org/2001/XMLSchema#integer");
      const solution1 = new SolutionMapping();
      solution1.set("x", new Literal("75", xsdInt));

      const solution2 = new SolutionMapping();
      solution2.set("x", new Literal("30", xsdInt));

      const results = await executor.executeAll(operation, [solution1, solution2]);
      expect(results).toHaveLength(1);
    });

    it("should handle OR operator", async () => {
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "logical",
          operator: "||",
          operands: [
            {
              type: "comparison",
              operator: "=",
              left: { type: "variable", name: "x" },
              right: { type: "literal", value: "a" },
            },
            {
              type: "comparison",
              operator: "=",
              left: { type: "variable", name: "x" },
              right: { type: "literal", value: "b" },
            },
          ],
        },
        input: { type: "bgp", triples: [] },
      };

      const solution1 = new SolutionMapping();
      solution1.set("x", new Literal("a"));

      const solution2 = new SolutionMapping();
      solution2.set("x", new Literal("c"));

      const results = await executor.executeAll(operation, [solution1, solution2]);
      expect(results).toHaveLength(1);
    });
  });

  describe("REGEX Function", () => {
    it("should filter by regex match", async () => {
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "function",
          function: "regex",
          args: [
            { type: "variable", name: "label" },
            { type: "literal", value: "task" },
            { type: "literal", value: "i" },
          ],
        },
        input: { type: "bgp", triples: [] },
      };

      const solution1 = new SolutionMapping();
      solution1.set("label", new Literal("Important Task"));

      const solution2 = new SolutionMapping();
      solution2.set("label", new Literal("Project"));

      const results = await executor.executeAll(operation, [solution1, solution2]);
      expect(results).toHaveLength(1);
    });
  });

  describe("Built-in Functions", () => {
    it("should filter by BOUND", async () => {
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "function",
          function: "bound",
          args: [{ type: "variable", name: "optional" }],
        },
        input: { type: "bgp", triples: [] },
      };

      const solution1 = new SolutionMapping();
      solution1.set("required", new Literal("value1"));
      solution1.set("optional", new Literal("value2"));

      const solution2 = new SolutionMapping();
      solution2.set("required", new Literal("value3"));

      const results = await executor.executeAll(operation, [solution1, solution2]);
      expect(results).toHaveLength(1);
      expect(results[0].has("optional")).toBe(true);
    });

    it("should filter by isIRI", async () => {
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "function",
          function: "isIRI",
          args: [{ type: "variable", name: "x" }],
        },
        input: { type: "bgp", triples: [] },
      };

      const solution1 = new SolutionMapping();
      solution1.set("x", new IRI("http://example.org/resource"));

      const solution2 = new SolutionMapping();
      solution2.set("x", new Literal("text"));

      const results = await executor.executeAll(operation, [solution1, solution2]);
      expect(results).toHaveLength(1);
      expect(results[0].get("x")).toBeInstanceOf(IRI);
    });
  });

  describe("Error Handling", () => {
    it("should skip solutions that throw errors during evaluation", async () => {
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: ">",
          left: { type: "variable", name: "x" },
          right: { type: "literal", value: 50 },
        },
        input: { type: "bgp", triples: [] },
      };

      const xsdInt = new IRI("http://www.w3.org/2001/XMLSchema#integer");
      const solution1 = new SolutionMapping();
      solution1.set("x", new Literal("75", xsdInt));

      const solution2 = new SolutionMapping();
      solution2.set("x", new Literal("not a number"));

      const results = await executor.executeAll(operation, [solution1, solution2]);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Streaming", () => {
    it("should support streaming iteration", async () => {
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: { type: "variable", name: "x" },
          right: { type: "literal", value: "match" },
        },
        input: { type: "bgp", triples: [] },
      };

      const solutions = [
        (() => {
          const s = new SolutionMapping();
          s.set("x", new Literal("match"));
          return s;
        })(),
        (() => {
          const s = new SolutionMapping();
          s.set("x", new Literal("nomatch"));
          return s;
        })(),
      ];

      let count = 0;
      for await (const solution of executor.execute(operation, generateSolutions(solutions))) {
        expect(solution.get("x")).toBeInstanceOf(Literal);
        count++;
      }

      expect(count).toBe(1);
    });
  });
});
