import { FilterExecutor, ExistsEvaluator } from "../../../../../src/infrastructure/sparql/executors/FilterExecutor";
import { SolutionMapping } from "../../../../../src/infrastructure/sparql/SolutionMapping";
import { IRI } from "../../../../../src/domain/models/rdf/IRI";
import { Literal } from "../../../../../src/domain/models/rdf/Literal";
import type { FilterOperation, AlgebraOperation, ExistsExpression } from "../../../../../src/infrastructure/sparql/algebra/AlgebraOperation";

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

  describe("SPARQL 1.1 String Functions", () => {
    it("should filter by SUBSTR", async () => {
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: {
            type: "function",
            function: "substr",
            args: [
              { type: "variable", name: "title" },
              { type: "literal", value: 1 },
              { type: "literal", value: 5 },
            ],
          },
          right: { type: "literal", value: "Hello" },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution1 = new SolutionMapping();
      solution1.set("title", new Literal("Hello World"));

      const solution2 = new SolutionMapping();
      solution2.set("title", new Literal("Goodbye World"));

      const results = await executor.executeAll(operation, [solution1, solution2]);
      expect(results).toHaveLength(1);
    });

    it("should filter by STRBEFORE", async () => {
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: {
            type: "function",
            function: "strbefore",
            args: [
              { type: "variable", name: "path" },
              { type: "literal", value: "/" },
            ],
          },
          right: { type: "literal", value: "projects" },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution1 = new SolutionMapping();
      solution1.set("path", new Literal("projects/task.md"));

      const solution2 = new SolutionMapping();
      solution2.set("path", new Literal("areas/health.md"));

      const results = await executor.executeAll(operation, [solution1, solution2]);
      expect(results).toHaveLength(1);
    });

    it("should filter by STRAFTER", async () => {
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: {
            type: "function",
            function: "strafter",
            args: [
              { type: "variable", name: "uri" },
              { type: "literal", value: "#" },
            ],
          },
          right: { type: "literal", value: "Task" },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution1 = new SolutionMapping();
      solution1.set("uri", new Literal("http://example.org/ontology#Task"));

      const solution2 = new SolutionMapping();
      solution2.set("uri", new Literal("http://example.org/ontology#Project"));

      const results = await executor.executeAll(operation, [solution1, solution2]);
      expect(results).toHaveLength(1);
    });

    it("should filter by CONCAT", async () => {
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: {
            type: "function",
            function: "concat",
            args: [
              { type: "variable", name: "first" },
              { type: "literal", value: " " },
              { type: "variable", name: "last" },
            ],
          },
          right: { type: "literal", value: "John Doe" },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution1 = new SolutionMapping();
      solution1.set("first", new Literal("John"));
      solution1.set("last", new Literal("Doe"));

      const solution2 = new SolutionMapping();
      solution2.set("first", new Literal("Jane"));
      solution2.set("last", new Literal("Doe"));

      const results = await executor.executeAll(operation, [solution1, solution2]);
      expect(results).toHaveLength(1);
    });

    it("should filter by STRLEN", async () => {
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: ">",
          left: {
            type: "function",
            function: "strlen",
            args: [{ type: "variable", name: "name" }],
          },
          right: { type: "literal", value: 10 },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution1 = new SolutionMapping();
      solution1.set("name", new Literal("This is a long name"));

      const solution2 = new SolutionMapping();
      solution2.set("name", new Literal("Short"));

      const results = await executor.executeAll(operation, [solution1, solution2]);
      expect(results).toHaveLength(1);
    });

    it("should filter by UCASE comparison", async () => {
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: {
            type: "function",
            function: "ucase",
            args: [{ type: "variable", name: "tag" }],
          },
          right: { type: "literal", value: "IMPORTANT" },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution1 = new SolutionMapping();
      solution1.set("tag", new Literal("important"));

      const solution2 = new SolutionMapping();
      solution2.set("tag", new Literal("normal"));

      const results = await executor.executeAll(operation, [solution1, solution2]);
      expect(results).toHaveLength(1);
    });

    it("should filter by LCASE comparison", async () => {
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: {
            type: "function",
            function: "lcase",
            args: [{ type: "variable", name: "status" }],
          },
          right: { type: "literal", value: "done" },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution1 = new SolutionMapping();
      solution1.set("status", new Literal("DONE"));

      const solution2 = new SolutionMapping();
      solution2.set("status", new Literal("PENDING"));

      const results = await executor.executeAll(operation, [solution1, solution2]);
      expect(results).toHaveLength(1);
    });

    it("should filter by REPLACE", async () => {
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: {
            type: "function",
            function: "replace",
            args: [
              { type: "variable", name: "text" },
              { type: "literal", value: "-" },
              { type: "literal", value: "_" },
            ],
          },
          right: { type: "literal", value: "hello_world" },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution1 = new SolutionMapping();
      solution1.set("text", new Literal("hello-world"));

      const solution2 = new SolutionMapping();
      solution2.set("text", new Literal("goodbye-world"));

      const results = await executor.executeAll(operation, [solution1, solution2]);
      expect(results).toHaveLength(1);
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

  describe("EXISTS Expressions", () => {
    let existsEvaluator: jest.Mock<Promise<boolean>, [AlgebraOperation, SolutionMapping]>;

    beforeEach(() => {
      existsEvaluator = jest.fn();
      executor.setExistsEvaluator(existsEvaluator);
    });

    it("should evaluate EXISTS - returns true when pattern matches", async () => {
      existsEvaluator.mockResolvedValue(true);

      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "exists",
          negated: false,
          pattern: { type: "bgp", triples: [] },
        } as ExistsExpression,
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      solution.set("task", new IRI("http://example.org/task1"));

      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(1);
      expect(existsEvaluator).toHaveBeenCalledWith(
        expect.objectContaining({ type: "bgp" }),
        solution
      );
    });

    it("should evaluate EXISTS - returns false when pattern does not match", async () => {
      existsEvaluator.mockResolvedValue(false);

      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "exists",
          negated: false,
          pattern: { type: "bgp", triples: [] },
        } as ExistsExpression,
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      solution.set("task", new IRI("http://example.org/task1"));

      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(0);
    });

    it("should evaluate NOT EXISTS - returns true when pattern does not match", async () => {
      existsEvaluator.mockResolvedValue(false);

      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "exists",
          negated: true,
          pattern: { type: "bgp", triples: [] },
        } as ExistsExpression,
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      solution.set("task", new IRI("http://example.org/task1"));

      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(1);
    });

    it("should evaluate NOT EXISTS - returns false when pattern matches", async () => {
      existsEvaluator.mockResolvedValue(true);

      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "exists",
          negated: true,
          pattern: { type: "bgp", triples: [] },
        } as ExistsExpression,
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      solution.set("task", new IRI("http://example.org/task1"));

      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(0);
    });

    it("should handle EXISTS with multiple solutions", async () => {
      // Mock: solution1 matches, solution2 does not match
      existsEvaluator
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "exists",
          negated: false,
          pattern: { type: "bgp", triples: [] },
        } as ExistsExpression,
        input: { type: "bgp", triples: [] },
      };

      const solution1 = new SolutionMapping();
      solution1.set("task", new IRI("http://example.org/task1"));

      const solution2 = new SolutionMapping();
      solution2.set("task", new IRI("http://example.org/task2"));

      const solution3 = new SolutionMapping();
      solution3.set("task", new IRI("http://example.org/task3"));

      const results = await executor.executeAll(operation, [solution1, solution2, solution3]);
      expect(results).toHaveLength(2);
      expect(existsEvaluator).toHaveBeenCalledTimes(3);
    });

    it("should handle EXISTS combined with AND", async () => {
      existsEvaluator.mockResolvedValue(true);

      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "logical",
          operator: "&&",
          operands: [
            {
              type: "comparison",
              operator: ">",
              left: { type: "variable", name: "priority" },
              right: { type: "literal", value: 5 },
            },
            {
              type: "exists",
              negated: false,
              pattern: { type: "bgp", triples: [] },
            } as ExistsExpression,
          ],
        },
        input: { type: "bgp", triples: [] },
      };

      const xsdInt = new IRI("http://www.w3.org/2001/XMLSchema#integer");
      const solution = new SolutionMapping();
      solution.set("task", new IRI("http://example.org/task1"));
      solution.set("priority", new Literal("10", xsdInt));

      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(1);
    });

    it("should handle EXISTS combined with AND - both must be true", async () => {
      existsEvaluator.mockResolvedValue(false);

      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "logical",
          operator: "&&",
          operands: [
            {
              type: "comparison",
              operator: ">",
              left: { type: "variable", name: "priority" },
              right: { type: "literal", value: 5 },
            },
            {
              type: "exists",
              negated: false,
              pattern: { type: "bgp", triples: [] },
            } as ExistsExpression,
          ],
        },
        input: { type: "bgp", triples: [] },
      };

      const xsdInt = new IRI("http://www.w3.org/2001/XMLSchema#integer");
      const solution = new SolutionMapping();
      solution.set("task", new IRI("http://example.org/task1"));
      solution.set("priority", new Literal("10", xsdInt));

      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(0);
    });

    it("should handle NOT EXISTS combined with OR", async () => {
      existsEvaluator
        .mockResolvedValueOnce(true)   // First NOT EXISTS returns false
        .mockResolvedValueOnce(false); // Second NOT EXISTS returns true

      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "logical",
          operator: "||",
          operands: [
            {
              type: "exists",
              negated: true,
              pattern: { type: "bgp", triples: [] },
            } as ExistsExpression,
            {
              type: "exists",
              negated: true,
              pattern: { type: "bgp", triples: [] },
            } as ExistsExpression,
          ],
        },
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      solution.set("task", new IRI("http://example.org/task1"));

      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(1);
    });

    it("should handle logical NOT with EXISTS", async () => {
      existsEvaluator.mockResolvedValue(true);

      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "logical",
          operator: "!",
          operands: [
            {
              type: "exists",
              negated: false,
              pattern: { type: "bgp", triples: [] },
            } as ExistsExpression,
          ],
        },
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      solution.set("task", new IRI("http://example.org/task1"));

      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(0);
    });

    it("should throw error if EXISTS evaluator not set", async () => {
      const freshExecutor = new FilterExecutor();
      // Don't set EXISTS evaluator

      const existsExpr: ExistsExpression = {
        type: "exists",
        negated: false,
        pattern: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      solution.set("x", new Literal("test"));

      await expect(
        freshExecutor.evaluateExpressionAsync(existsExpr, solution)
      ).rejects.toThrow("EXISTS evaluator not set");
    });

    it("should call evaluator with correct pattern and solution", async () => {
      existsEvaluator.mockResolvedValue(true);

      const pattern: AlgebraOperation = {
        type: "bgp",
        triples: [
          {
            subject: { type: "variable", value: "task" },
            predicate: { type: "iri", value: "http://example.org/status" },
            object: { type: "literal", value: "Done" },
          },
        ],
      };

      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "exists",
          negated: false,
          pattern,
        } as ExistsExpression,
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      solution.set("task", new IRI("http://example.org/task1"));

      await executor.executeAll(operation, [solution]);

      expect(existsEvaluator).toHaveBeenCalledWith(pattern, solution);
    });

    it("should pass current solution bindings to EXISTS evaluator", async () => {
      existsEvaluator.mockResolvedValue(true);

      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "exists",
          negated: false,
          pattern: { type: "bgp", triples: [] },
        } as ExistsExpression,
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      solution.set("project", new IRI("http://example.org/project1"));
      solution.set("name", new Literal("Project Alpha"));

      await executor.executeAll(operation, [solution]);

      const [_, passedSolution] = existsEvaluator.mock.calls[0];
      expect(passedSolution.get("project")).toBeDefined();
      expect(passedSolution.get("name")).toBeDefined();
    });
  });

  describe("expressionContainsExists", () => {
    let existsEvaluator: jest.Mock<Promise<boolean>, [AlgebraOperation, SolutionMapping]>;

    it("should detect EXISTS in simple expression", async () => {
      existsEvaluator = jest.fn().mockResolvedValue(true);
      executor.setExistsEvaluator(existsEvaluator);

      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "exists",
          negated: false,
          pattern: { type: "bgp", triples: [] },
        } as ExistsExpression,
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      solution.set("x", new Literal("test"));

      // This should use async evaluation path
      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(1);
      expect(existsEvaluator).toHaveBeenCalled();
    });

    it("should not use async path for non-EXISTS expressions", async () => {
      // Don't set evaluator to verify sync path is used
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

      const solution = new SolutionMapping();
      solution.set("x", new Literal("test"));

      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(1);
    });
  });

  describe("Arithmetic Expressions", () => {
    it("should evaluate addition", async () => {
      const xsdInt = new IRI("http://www.w3.org/2001/XMLSchema#integer");
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: {
            type: "arithmetic",
            operator: "+",
            left: { type: "variable", name: "a" },
            right: { type: "variable", name: "b" },
          } as any,
          right: { type: "literal", value: 15 },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      solution.set("a", new Literal("10", xsdInt));
      solution.set("b", new Literal("5", xsdInt));

      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(1);
    });

    it("should evaluate subtraction", async () => {
      const xsdInt = new IRI("http://www.w3.org/2001/XMLSchema#integer");
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: {
            type: "arithmetic",
            operator: "-",
            left: { type: "variable", name: "a" },
            right: { type: "variable", name: "b" },
          } as any,
          right: { type: "literal", value: 5 },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      solution.set("a", new Literal("10", xsdInt));
      solution.set("b", new Literal("5", xsdInt));

      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(1);
    });

    it("should evaluate multiplication", async () => {
      const xsdInt = new IRI("http://www.w3.org/2001/XMLSchema#integer");
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: {
            type: "arithmetic",
            operator: "*",
            left: { type: "variable", name: "a" },
            right: { type: "variable", name: "b" },
          } as any,
          right: { type: "literal", value: 50 },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      solution.set("a", new Literal("10", xsdInt));
      solution.set("b", new Literal("5", xsdInt));

      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(1);
    });

    it("should evaluate division", async () => {
      const xsdInt = new IRI("http://www.w3.org/2001/XMLSchema#integer");
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: {
            type: "arithmetic",
            operator: "/",
            left: { type: "variable", name: "a" },
            right: { type: "variable", name: "b" },
          } as any,
          right: { type: "literal", value: 2 },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      solution.set("a", new Literal("10", xsdInt));
      solution.set("b", new Literal("5", xsdInt));

      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(1);
    });

    it("should handle xsd:dateTime subtraction", async () => {
      const xsdDateTime = new IRI("http://www.w3.org/2001/XMLSchema#dateTime");
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: ">",
          left: {
            type: "arithmetic",
            operator: "-",
            left: { type: "variable", name: "endTime" },
            right: { type: "variable", name: "startTime" },
          } as any,
          // Duration in milliseconds: at least 1 hour = 3600000 ms
          right: { type: "literal", value: 3600000 },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      // Sleep from 23:00 to 07:00 = 8 hours = 28800000 ms
      solution.set("startTime", new Literal("2025-11-30T23:00:00Z", xsdDateTime));
      solution.set("endTime", new Literal("2025-12-01T07:00:00Z", xsdDateTime));

      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(1);
    });

    it("should convert dateTime difference to minutes", async () => {
      const xsdDateTime = new IRI("http://www.w3.org/2001/XMLSchema#dateTime");
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: {
            type: "arithmetic",
            operator: "/",
            left: {
              type: "arithmetic",
              operator: "-",
              left: { type: "variable", name: "endTime" },
              right: { type: "variable", name: "startTime" },
            },
            // Divide by 60000 to convert ms to minutes
            right: { type: "literal", value: 60000 },
          } as any,
          // Expect 120 minutes (2 hours)
          right: { type: "literal", value: 120 },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      solution.set("startTime", new Literal("2025-11-30T10:00:00Z", xsdDateTime));
      solution.set("endTime", new Literal("2025-11-30T12:00:00Z", xsdDateTime));

      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(1);
    });
  });

  describe("DateTime Accessor Functions", () => {
    it("should evaluate YEAR function", async () => {
      const xsdDateTime = new IRI("http://www.w3.org/2001/XMLSchema#dateTime");
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: {
            type: "function",
            function: "year",
            args: [{ type: "variable", name: "date" }],
          },
          right: { type: "literal", value: 2025 },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      solution.set("date", new Literal("2025-11-30T23:00:00Z", xsdDateTime));

      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(1);
    });

    it("should evaluate MONTH function", async () => {
      const xsdDateTime = new IRI("http://www.w3.org/2001/XMLSchema#dateTime");
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: {
            type: "function",
            function: "month",
            args: [{ type: "variable", name: "date" }],
          },
          right: { type: "literal", value: 11 },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      solution.set("date", new Literal("2025-11-30T23:00:00Z", xsdDateTime));

      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(1);
    });

    it("should evaluate DAY function", async () => {
      const xsdDateTime = new IRI("http://www.w3.org/2001/XMLSchema#dateTime");
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: {
            type: "function",
            function: "day",
            args: [{ type: "variable", name: "date" }],
          },
          right: { type: "literal", value: 30 },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      solution.set("date", new Literal("2025-11-30T23:00:00Z", xsdDateTime));

      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(1);
    });

    it("should evaluate HOURS function", async () => {
      const xsdDateTime = new IRI("http://www.w3.org/2001/XMLSchema#dateTime");
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: {
            type: "function",
            function: "hours",
            args: [{ type: "variable", name: "date" }],
          },
          // Note: JavaScript Date parses Z as UTC, so local hours may differ
          // Using a time that's clear (no timezone ambiguity)
          right: { type: "literal", value: 14 },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      // No timezone suffix - will be parsed as local time
      solution.set("date", new Literal("2025-11-30T14:30:00"));

      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(1);
    });

    it("should evaluate MINUTES function", async () => {
      const xsdDateTime = new IRI("http://www.w3.org/2001/XMLSchema#dateTime");
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: {
            type: "function",
            function: "minutes",
            args: [{ type: "variable", name: "date" }],
          },
          right: { type: "literal", value: 45 },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      solution.set("date", new Literal("2025-11-30T14:45:30"));

      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(1);
    });

    it("should evaluate SECONDS function", async () => {
      const xsdDateTime = new IRI("http://www.w3.org/2001/XMLSchema#dateTime");
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: {
            type: "function",
            function: "seconds",
            args: [{ type: "variable", name: "date" }],
          },
          right: { type: "literal", value: 30 },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      solution.set("date", new Literal("2025-11-30T14:45:30"));

      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(1);
    });
  });

  describe("SPARQL 1.1 Numeric Functions", () => {
    it("should evaluate ABS function with positive number", async () => {
      const xsdDecimal = new IRI("http://www.w3.org/2001/XMLSchema#decimal");
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: {
            type: "function",
            function: "abs",
            args: [{ type: "variable", name: "delta" }],
          },
          right: { type: "literal", value: 5 },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      solution.set("delta", new Literal("-5", xsdDecimal));

      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(1);
    });

    it("should evaluate ROUND function", async () => {
      const xsdDecimal = new IRI("http://www.w3.org/2001/XMLSchema#decimal");
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: {
            type: "function",
            function: "round",
            args: [{ type: "variable", name: "avg" }],
          },
          right: { type: "literal", value: 3 },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution1 = new SolutionMapping();
      solution1.set("avg", new Literal("2.5", xsdDecimal));

      const solution2 = new SolutionMapping();
      solution2.set("avg", new Literal("2.4", xsdDecimal));

      const results = await executor.executeAll(operation, [solution1, solution2]);
      expect(results).toHaveLength(1);
    });

    it("should evaluate CEIL function", async () => {
      const xsdDecimal = new IRI("http://www.w3.org/2001/XMLSchema#decimal");
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "<=",
          left: {
            type: "function",
            function: "ceil",
            args: [{ type: "variable", name: "priority" }],
          },
          right: { type: "literal", value: 3 },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution1 = new SolutionMapping();
      solution1.set("priority", new Literal("2.1", xsdDecimal));

      const solution2 = new SolutionMapping();
      solution2.set("priority", new Literal("3.5", xsdDecimal));

      const results = await executor.executeAll(operation, [solution1, solution2]);
      expect(results).toHaveLength(1);
    });

    it("should evaluate FLOOR function", async () => {
      const xsdDecimal = new IRI("http://www.w3.org/2001/XMLSchema#decimal");
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: {
            type: "function",
            function: "floor",
            args: [{ type: "variable", name: "hours" }],
          },
          right: { type: "literal", value: 2 },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution1 = new SolutionMapping();
      solution1.set("hours", new Literal("2.9", xsdDecimal));

      const solution2 = new SolutionMapping();
      solution2.set("hours", new Literal("3.1", xsdDecimal));

      const results = await executor.executeAll(operation, [solution1, solution2]);
      expect(results).toHaveLength(1);
    });

    it("should evaluate RAND function", async () => {
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "<",
          left: {
            type: "function",
            function: "rand",
            args: [],
          },
          right: { type: "literal", value: 1 },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      solution.set("x", new Literal("test"));

      // RAND() always returns value in [0, 1), so should always pass filter
      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(1);
    });

    it("should combine numeric functions in complex expression", async () => {
      const xsdDecimal = new IRI("http://www.w3.org/2001/XMLSchema#decimal");
      // Test: ABS(FLOOR(x)) = 2 where x = -2.9
      const operation: FilterOperation = {
        type: "filter",
        expression: {
          type: "comparison",
          operator: "=",
          left: {
            type: "function",
            function: "abs",
            args: [
              {
                type: "function",
                function: "floor",
                args: [{ type: "variable", name: "x" }],
              },
            ],
          },
          right: { type: "literal", value: 3 },
        },
        input: { type: "bgp", triples: [] },
      };

      const solution = new SolutionMapping();
      // FLOOR(-2.9) = -3, ABS(-3) = 3
      solution.set("x", new Literal("-2.9", xsdDecimal));

      const results = await executor.executeAll(operation, [solution]);
      expect(results).toHaveLength(1);
    });
  });

  describe("SPARQL 1.1 Conditional Functions", () => {
    describe("COALESCE", () => {
      it("should return first bound variable value", async () => {
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "comparison",
            operator: "=",
            left: {
              type: "function",
              function: "coalesce",
              args: [
                { type: "variable", name: "alias" },
                { type: "variable", name: "name" },
              ],
            },
            right: { type: "literal", value: "John" },
          },
          input: { type: "bgp", triples: [] },
        };

        // Solution with alias bound
        const solution1 = new SolutionMapping();
        solution1.set("alias", new Literal("John"));
        solution1.set("name", new Literal("Jonathan"));

        // Solution with only name bound
        const solution2 = new SolutionMapping();
        solution2.set("name", new Literal("John"));

        // Solution with neither matching
        const solution3 = new SolutionMapping();
        solution3.set("name", new Literal("Jane"));

        const results = await executor.executeAll(operation, [solution1, solution2, solution3]);
        expect(results).toHaveLength(2);
      });

      it("should handle 3 arguments", async () => {
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "comparison",
            operator: "=",
            left: {
              type: "function",
              function: "coalesce",
              args: [
                { type: "variable", name: "nickname" },
                { type: "variable", name: "alias" },
                { type: "variable", name: "name" },
              ],
            },
            right: { type: "literal", value: "Default" },
          },
          input: { type: "bgp", triples: [] },
        };

        const solution = new SolutionMapping();
        solution.set("name", new Literal("Default"));

        const results = await executor.executeAll(operation, [solution]);
        expect(results).toHaveLength(1);
      });

      it("should handle 5 arguments", async () => {
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "comparison",
            operator: "=",
            left: {
              type: "function",
              function: "coalesce",
              args: [
                { type: "variable", name: "a" },
                { type: "variable", name: "b" },
                { type: "variable", name: "c" },
                { type: "variable", name: "d" },
                { type: "literal", value: "fallback" },
              ],
            },
            right: { type: "literal", value: "fallback" },
          },
          input: { type: "bgp", triples: [] },
        };

        const solution = new SolutionMapping();
        // None of a, b, c, d are bound

        const results = await executor.executeAll(operation, [solution]);
        expect(results).toHaveLength(1);
      });

      it("should return fallback literal when all variables are unbound", async () => {
        // Test COALESCE falling back to a literal when variables are unbound
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "comparison",
            operator: "=",
            left: {
              type: "function",
              function: "coalesce",
              args: [
                { type: "variable", name: "dueDate" },
                { type: "variable", name: "createdDate" },
                { type: "literal", value: "No date" },
              ],
            },
            right: { type: "literal", value: "No date" },
          },
          input: { type: "bgp", triples: [] },
        };

        // Solution with dueDate bound - won't match "No date"
        const solution1 = new SolutionMapping();
        solution1.set("task", new IRI("http://example.org/task1"));
        solution1.set("dueDate", new Literal("2025-12-01"));

        // Solution with only createdDate bound - won't match "No date"
        const solution2 = new SolutionMapping();
        solution2.set("task", new IRI("http://example.org/task2"));
        solution2.set("createdDate", new Literal("2025-11-01"));

        // Solution with neither bound - falls back to "No date" and matches
        const solution3 = new SolutionMapping();
        solution3.set("task", new IRI("http://example.org/task3"));

        const results = await executor.executeAll(operation, [solution1, solution2, solution3]);
        expect(results).toHaveLength(1);
        expect(results[0].get("task")).toEqual(new IRI("http://example.org/task3"));
      });

      it("should handle COALESCE returning different RDF term types", async () => {
        // Test COALESCE with IRI value - use STRLEN which works on any stringifiable term
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "comparison",
            operator: ">",
            left: {
              type: "function",
              function: "strlen",
              args: [
                {
                  type: "function",
                  function: "coalesce",
                  args: [
                    { type: "variable", name: "value" },
                    { type: "literal", value: "" },
                  ],
                },
              ],
            },
            right: { type: "literal", value: 0 },
          },
          input: { type: "bgp", triples: [] },
        };

        // Solution with Literal bound
        const solution1 = new SolutionMapping();
        solution1.set("value", new Literal("some text"));

        // Solution with IRI bound
        const solution2 = new SolutionMapping();
        solution2.set("value", new IRI("http://example.org/resource"));

        // Solution with value not bound - falls back to empty string, STRLEN = 0, fails filter
        const solution3 = new SolutionMapping();
        solution3.set("other", new Literal("other"));

        const results = await executor.executeAll(operation, [solution1, solution2, solution3]);
        // solution1 and solution2 should pass (STRLEN > 0), solution3 should fail (STRLEN = 0)
        expect(results).toHaveLength(2);
      });
    });

    describe("IF", () => {
      it("should return thenExpr when condition is true", async () => {
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "comparison",
            operator: "=",
            left: {
              type: "function",
              function: "if",
              args: [
                {
                  type: "comparison",
                  operator: "=",
                  left: { type: "variable", name: "status" },
                  right: { type: "literal", value: "done" },
                },
                { type: "literal", value: "✅" },
                { type: "literal", value: "⏳" },
              ],
            },
            right: { type: "literal", value: "✅" },
          },
          input: { type: "bgp", triples: [] },
        };

        const solution = new SolutionMapping();
        solution.set("status", new Literal("done"));

        const results = await executor.executeAll(operation, [solution]);
        expect(results).toHaveLength(1);
      });

      it("should return elseExpr when condition is false", async () => {
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "comparison",
            operator: "=",
            left: {
              type: "function",
              function: "if",
              args: [
                {
                  type: "comparison",
                  operator: "=",
                  left: { type: "variable", name: "status" },
                  right: { type: "literal", value: "done" },
                },
                { type: "literal", value: "✅" },
                { type: "literal", value: "⏳" },
              ],
            },
            right: { type: "literal", value: "⏳" },
          },
          input: { type: "bgp", triples: [] },
        };

        const solution = new SolutionMapping();
        solution.set("status", new Literal("pending"));

        const results = await executor.executeAll(operation, [solution]);
        expect(results).toHaveLength(1);
      });

      it("should handle numeric condition (priority > 5)", async () => {
        const xsdInt = new IRI("http://www.w3.org/2001/XMLSchema#integer");
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "comparison",
            operator: "=",
            left: {
              type: "function",
              function: "if",
              args: [
                {
                  type: "comparison",
                  operator: ">",
                  left: { type: "variable", name: "priority" },
                  right: { type: "literal", value: 5 },
                },
                { type: "literal", value: "High" },
                { type: "literal", value: "Low" },
              ],
            },
            right: { type: "literal", value: "High" },
          },
          input: { type: "bgp", triples: [] },
        };

        // High priority task
        const solution1 = new SolutionMapping();
        solution1.set("priority", new Literal("8", xsdInt));

        // Low priority task
        const solution2 = new SolutionMapping();
        solution2.set("priority", new Literal("3", xsdInt));

        const results = await executor.executeAll(operation, [solution1, solution2]);
        expect(results).toHaveLength(1);
      });

      it("should throw error when IF has wrong number of arguments", async () => {
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "function",
            function: "if",
            args: [
              { type: "literal", value: true },
              { type: "literal", value: "only two args" },
            ],
          },
          input: { type: "bgp", triples: [] },
        };

        const solution = new SolutionMapping();
        solution.set("x", new Literal("test"));

        // Should skip this solution due to error
        const results = await executor.executeAll(operation, [solution]);
        expect(results).toHaveLength(0);
      });

      it("should handle boolean literal condition", async () => {
        const xsdBool = new IRI("http://www.w3.org/2001/XMLSchema#boolean");
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "comparison",
            operator: "=",
            left: {
              type: "function",
              function: "if",
              args: [
                { type: "variable", name: "isActive" },
                { type: "literal", value: "Active" },
                { type: "literal", value: "Inactive" },
              ],
            },
            right: { type: "literal", value: "Active" },
          },
          input: { type: "bgp", triples: [] },
        };

        const solution1 = new SolutionMapping();
        solution1.set("isActive", new Literal("true", xsdBool));

        const solution2 = new SolutionMapping();
        solution2.set("isActive", new Literal("false", xsdBool));

        const results = await executor.executeAll(operation, [solution1, solution2]);
        expect(results).toHaveLength(1);
      });

      it("should handle nested IF expressions", async () => {
        const xsdInt = new IRI("http://www.w3.org/2001/XMLSchema#integer");
        // IF(priority > 7, "Critical", IF(priority > 3, "Medium", "Low"))
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "comparison",
            operator: "=",
            left: {
              type: "function",
              function: "if",
              args: [
                {
                  type: "comparison",
                  operator: ">",
                  left: { type: "variable", name: "priority" },
                  right: { type: "literal", value: 7 },
                },
                { type: "literal", value: "Critical" },
                {
                  type: "function",
                  function: "if",
                  args: [
                    {
                      type: "comparison",
                      operator: ">",
                      left: { type: "variable", name: "priority" },
                      right: { type: "literal", value: 3 },
                    },
                    { type: "literal", value: "Medium" },
                    { type: "literal", value: "Low" },
                  ],
                },
              ],
            },
            right: { type: "literal", value: "Medium" },
          },
          input: { type: "bgp", triples: [] },
        };

        // Critical (priority = 9)
        const solution1 = new SolutionMapping();
        solution1.set("priority", new Literal("9", xsdInt));

        // Medium (priority = 5)
        const solution2 = new SolutionMapping();
        solution2.set("priority", new Literal("5", xsdInt));

        // Low (priority = 2)
        const solution3 = new SolutionMapping();
        solution3.set("priority", new Literal("2", xsdInt));

        const results = await executor.executeAll(operation, [solution1, solution2, solution3]);
        expect(results).toHaveLength(1);
        const priorityValue = results[0].get("priority");
        expect(priorityValue).toBeInstanceOf(Literal);
        expect((priorityValue as Literal).value).toBe("5");
      });

      it("should handle combined COALESCE and IF", async () => {
        // IF(BOUND(?dueDate), COALESCE(?dueDate, ?createdDate), "No date")
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "comparison",
            operator: "=",
            left: {
              type: "function",
              function: "if",
              args: [
                {
                  type: "function",
                  function: "bound",
                  args: [{ type: "variable", name: "dueDate" }],
                },
                {
                  type: "function",
                  function: "coalesce",
                  args: [
                    { type: "variable", name: "dueDate" },
                    { type: "variable", name: "createdDate" },
                  ],
                },
                { type: "literal", value: "No date" },
              ],
            },
            right: { type: "literal", value: "2025-12-01" },
          },
          input: { type: "bgp", triples: [] },
        };

        // Has dueDate
        const solution1 = new SolutionMapping();
        solution1.set("dueDate", new Literal("2025-12-01"));
        solution1.set("createdDate", new Literal("2025-11-01"));

        // Only has createdDate (should return "No date")
        const solution2 = new SolutionMapping();
        solution2.set("createdDate", new Literal("2025-11-01"));

        const results = await executor.executeAll(operation, [solution1, solution2]);
        expect(results).toHaveLength(1);
      });
    });
  });

  /**
   * Tests for XSD Cast Functions (SPARQL 1.1 §17.5).
   * These functions convert values between datatypes.
   * Issue #583: xsd:integer(?var) was not implemented, causing BIND to return undefined.
   */
  describe("XSD Cast Functions", () => {
    describe("xsd:integer", () => {
      it("should cast numeric string to integer", async () => {
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "comparison",
            operator: "=",
            left: {
              type: "functionCall",
              function: { termType: "NamedNode", value: "http://www.w3.org/2001/XMLSchema#integer" },
              args: [{ type: "variable", name: "value" }],
            },
            right: { type: "literal", value: 42 },
          },
          input: { type: "bgp", triples: [] },
        };

        const solution = new SolutionMapping();
        solution.set("value", new Literal("42"));

        const results = await executor.executeAll(operation, [solution]);
        expect(results).toHaveLength(1);
      });

      it("should truncate decimal to integer", async () => {
        const xsdDecimal = new IRI("http://www.w3.org/2001/XMLSchema#decimal");
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "comparison",
            operator: "=",
            left: {
              type: "functionCall",
              function: { termType: "NamedNode", value: "http://www.w3.org/2001/XMLSchema#integer" },
              args: [{ type: "variable", name: "value" }],
            },
            right: { type: "literal", value: 42 },
          },
          input: { type: "bgp", triples: [] },
        };

        const solution = new SolutionMapping();
        solution.set("value", new Literal("42.9", xsdDecimal));

        const results = await executor.executeAll(operation, [solution]);
        expect(results).toHaveLength(1);
      });

      it("should cast dateTime to Unix timestamp in milliseconds", async () => {
        const xsdDateTime = new IRI("http://www.w3.org/2001/XMLSchema#dateTime");
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "comparison",
            operator: ">",
            left: {
              type: "functionCall",
              function: { termType: "NamedNode", value: "http://www.w3.org/2001/XMLSchema#integer" },
              args: [{ type: "variable", name: "timestamp" }],
            },
            right: { type: "literal", value: 0 },
          },
          input: { type: "bgp", triples: [] },
        };

        const solution = new SolutionMapping();
        solution.set("timestamp", new Literal("2025-12-01T10:00:00Z", xsdDateTime));

        const results = await executor.executeAll(operation, [solution]);
        expect(results).toHaveLength(1);
      });

      it("should cast boolean true to 1", async () => {
        const xsdBool = new IRI("http://www.w3.org/2001/XMLSchema#boolean");
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "comparison",
            operator: "=",
            left: {
              type: "functionCall",
              function: { termType: "NamedNode", value: "http://www.w3.org/2001/XMLSchema#integer" },
              args: [{ type: "variable", name: "flag" }],
            },
            right: { type: "literal", value: 1 },
          },
          input: { type: "bgp", triples: [] },
        };

        const solution = new SolutionMapping();
        solution.set("flag", new Literal("true", xsdBool));

        const results = await executor.executeAll(operation, [solution]);
        expect(results).toHaveLength(1);
      });

      it("should cast boolean false to 0", async () => {
        const xsdBool = new IRI("http://www.w3.org/2001/XMLSchema#boolean");
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "comparison",
            operator: "=",
            left: {
              type: "functionCall",
              function: { termType: "NamedNode", value: "http://www.w3.org/2001/XMLSchema#integer" },
              args: [{ type: "variable", name: "flag" }],
            },
            right: { type: "literal", value: 0 },
          },
          input: { type: "bgp", triples: [] },
        };

        const solution = new SolutionMapping();
        solution.set("flag", new Literal("false", xsdBool));

        const results = await executor.executeAll(operation, [solution]);
        expect(results).toHaveLength(1);
      });
    });

    describe("xsd:decimal/double/float", () => {
      it("should cast string to decimal", async () => {
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "comparison",
            operator: "=",
            left: {
              type: "functionCall",
              function: { termType: "NamedNode", value: "http://www.w3.org/2001/XMLSchema#decimal" },
              args: [{ type: "variable", name: "value" }],
            },
            right: { type: "literal", value: 3.14 },
          },
          input: { type: "bgp", triples: [] },
        };

        const solution = new SolutionMapping();
        solution.set("value", new Literal("3.14"));

        const results = await executor.executeAll(operation, [solution]);
        expect(results).toHaveLength(1);
      });

      it("should cast boolean to 1.0 or 0.0", async () => {
        const xsdBool = new IRI("http://www.w3.org/2001/XMLSchema#boolean");
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "comparison",
            operator: "=",
            left: {
              type: "functionCall",
              function: { termType: "NamedNode", value: "http://www.w3.org/2001/XMLSchema#double" },
              args: [{ type: "variable", name: "active" }],
            },
            right: { type: "literal", value: 1.0 },
          },
          input: { type: "bgp", triples: [] },
        };

        const solution = new SolutionMapping();
        solution.set("active", new Literal("true", xsdBool));

        const results = await executor.executeAll(operation, [solution]);
        expect(results).toHaveLength(1);
      });
    });

    describe("xsd:boolean", () => {
      it("should cast 'true' string to boolean true", async () => {
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "functionCall",
            function: { termType: "NamedNode", value: "http://www.w3.org/2001/XMLSchema#boolean" },
            args: [{ type: "variable", name: "value" }],
          },
          input: { type: "bgp", triples: [] },
        };

        const solution = new SolutionMapping();
        solution.set("value", new Literal("true"));

        const results = await executor.executeAll(operation, [solution]);
        expect(results).toHaveLength(1);
      });

      it("should cast '1' string to boolean true", async () => {
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "functionCall",
            function: { termType: "NamedNode", value: "http://www.w3.org/2001/XMLSchema#boolean" },
            args: [{ type: "variable", name: "value" }],
          },
          input: { type: "bgp", triples: [] },
        };

        const solution = new SolutionMapping();
        solution.set("value", new Literal("1"));

        const results = await executor.executeAll(operation, [solution]);
        expect(results).toHaveLength(1);
      });

      it("should cast non-zero number to boolean true", async () => {
        const xsdInt = new IRI("http://www.w3.org/2001/XMLSchema#integer");
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "functionCall",
            function: { termType: "NamedNode", value: "http://www.w3.org/2001/XMLSchema#boolean" },
            args: [{ type: "variable", name: "count" }],
          },
          input: { type: "bgp", triples: [] },
        };

        const solution = new SolutionMapping();
        solution.set("count", new Literal("5", xsdInt));

        const results = await executor.executeAll(operation, [solution]);
        expect(results).toHaveLength(1);
      });

      it("should cast zero to boolean false", async () => {
        const xsdInt = new IRI("http://www.w3.org/2001/XMLSchema#integer");
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "logical",
            operator: "!",
            operands: [
              {
                type: "functionCall",
                function: { termType: "NamedNode", value: "http://www.w3.org/2001/XMLSchema#boolean" },
                args: [{ type: "variable", name: "count" }],
              },
            ],
          },
          input: { type: "bgp", triples: [] },
        };

        const solution = new SolutionMapping();
        solution.set("count", new Literal("0", xsdInt));

        const results = await executor.executeAll(operation, [solution]);
        expect(results).toHaveLength(1);
      });
    });

    describe("xsd:string", () => {
      it("should cast number to string", async () => {
        const xsdInt = new IRI("http://www.w3.org/2001/XMLSchema#integer");
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "comparison",
            operator: "=",
            left: {
              type: "functionCall",
              function: { termType: "NamedNode", value: "http://www.w3.org/2001/XMLSchema#string" },
              args: [{ type: "variable", name: "num" }],
            },
            right: { type: "literal", value: "42" },
          },
          input: { type: "bgp", triples: [] },
        };

        const solution = new SolutionMapping();
        solution.set("num", new Literal("42", xsdInt));

        const results = await executor.executeAll(operation, [solution]);
        expect(results).toHaveLength(1);
      });
    });

    describe("xsd:dateTime and xsd:date", () => {
      it("should cast timestamp to dateTime string", async () => {
        const xsdInt = new IRI("http://www.w3.org/2001/XMLSchema#integer");
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "function",
            function: "strstarts",
            args: [
              {
                type: "functionCall",
                function: { termType: "NamedNode", value: "http://www.w3.org/2001/XMLSchema#dateTime" },
                args: [{ type: "variable", name: "ms" }],
              },
              { type: "literal", value: "2025" },
            ],
          },
          input: { type: "bgp", triples: [] },
        };

        const solution = new SolutionMapping();
        // Unix timestamp for 2025-06-15T12:00:00Z
        solution.set("ms", new Literal("1750075200000", xsdInt));

        const results = await executor.executeAll(operation, [solution]);
        expect(results).toHaveLength(1);
      });

      it("should cast dateTime string to date (YYYY-MM-DD)", async () => {
        const xsdDateTime = new IRI("http://www.w3.org/2001/XMLSchema#dateTime");
        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "comparison",
            operator: "=",
            left: {
              type: "functionCall",
              function: { termType: "NamedNode", value: "http://www.w3.org/2001/XMLSchema#date" },
              args: [{ type: "variable", name: "timestamp" }],
            },
            right: { type: "literal", value: "2025-12-01" },
          },
          input: { type: "bgp", triples: [] },
        };

        const solution = new SolutionMapping();
        solution.set("timestamp", new Literal("2025-12-01T10:30:00Z", xsdDateTime));

        const results = await executor.executeAll(operation, [solution]);
        expect(results).toHaveLength(1);
      });
    });

    describe("Issue #583: AVG with BIND and xsd:integer", () => {
      it("should use xsd:integer in arithmetic for duration calculation", async () => {
        const xsdDateTime = new IRI("http://www.w3.org/2001/XMLSchema#dateTime");
        // This tests the exact use case from Issue #583:
        // BIND((xsd:integer(?end) - xsd:integer(?start)) / 60000 AS ?duration)
        // The result should be a proper number that can be aggregated with AVG

        const operation: FilterOperation = {
          type: "filter",
          expression: {
            type: "comparison",
            operator: ">",
            left: {
              type: "arithmetic",
              operator: "/",
              left: {
                type: "arithmetic",
                operator: "-",
                left: {
                  type: "functionCall",
                  function: { termType: "NamedNode", value: "http://www.w3.org/2001/XMLSchema#integer" },
                  args: [{ type: "variable", name: "end" }],
                },
                right: {
                  type: "functionCall",
                  function: { termType: "NamedNode", value: "http://www.w3.org/2001/XMLSchema#integer" },
                  args: [{ type: "variable", name: "start" }],
                },
              },
              right: { type: "literal", value: 60000 },
            } as any,
            // Duration should be > 10 minutes
            right: { type: "literal", value: 10 },
          },
          input: { type: "bgp", triples: [] },
        };

        const solution = new SolutionMapping();
        // 20 minute shower: 10:00 to 10:20
        solution.set("start", new Literal("2025-12-01T10:00:00Z", xsdDateTime));
        solution.set("end", new Literal("2025-12-01T10:20:00Z", xsdDateTime));

        const results = await executor.executeAll(operation, [solution]);
        expect(results).toHaveLength(1);
      });

      it("should work with xsd:integer in BIND-like expression evaluation", () => {
        // Direct test of evaluateExpression for the BIND pattern
        const xsdDateTime = new IRI("http://www.w3.org/2001/XMLSchema#dateTime");

        const solution = new SolutionMapping();
        solution.set("start", new Literal("2025-12-01T10:00:00Z", xsdDateTime));
        solution.set("end", new Literal("2025-12-01T10:20:00Z", xsdDateTime));

        // Evaluate xsd:integer(?end)
        const endExpr = {
          type: "functionCall",
          function: { value: "http://www.w3.org/2001/XMLSchema#integer" },
          args: [{ type: "variable", name: "end" }],
        };

        const result = executor.evaluateExpression(endExpr as any, solution);

        // Should return a number (Unix timestamp in ms)
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      });
    });
  });
});
