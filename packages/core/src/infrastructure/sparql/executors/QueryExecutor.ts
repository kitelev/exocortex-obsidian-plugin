import type { ITripleStore } from "../../../interfaces/ITripleStore";
import type {
  AlgebraOperation,
  BGPOperation,
  FilterOperation,
  JoinOperation,
  LeftJoinOperation,
  UnionOperation,
  ProjectOperation,
  OrderByOperation,
  SliceOperation,
  DistinctOperation,
} from "../algebra/AlgebraOperation";
import type { SolutionMapping } from "../SolutionMapping";
import { BGPExecutor } from "./BGPExecutor";
import { FilterExecutor } from "./FilterExecutor";
import { OptionalExecutor } from "./OptionalExecutor";
import { UnionExecutor } from "./UnionExecutor";

export class QueryExecutorError extends Error {
  constructor(message: string, cause?: Error) {
    super(message, cause ? { cause } : undefined);
    this.name = "QueryExecutorError";
  }
}

/**
 * Executes SPARQL algebra operations against a triple store.
 * Coordinates all specialized executors (BGP, Filter, Join, etc.)
 * to produce query results.
 */
export class QueryExecutor {
  private readonly bgpExecutor: BGPExecutor;
  private readonly filterExecutor: FilterExecutor;
  private readonly optionalExecutor: OptionalExecutor;
  private readonly unionExecutor: UnionExecutor;

  constructor(tripleStore: ITripleStore) {
    this.bgpExecutor = new BGPExecutor(tripleStore);
    this.filterExecutor = new FilterExecutor();
    this.optionalExecutor = new OptionalExecutor();
    this.unionExecutor = new UnionExecutor();
  }

  /**
   * Execute an algebra operation and return solution mappings.
   */
  async executeAll(operation: AlgebraOperation): Promise<SolutionMapping[]> {
    const results: SolutionMapping[] = [];
    for await (const solution of this.execute(operation)) {
      results.push(solution);
    }
    return results;
  }

  /**
   * Execute an algebra operation and stream solution mappings.
   */
  async *execute(operation: AlgebraOperation): AsyncIterableIterator<SolutionMapping> {
    switch (operation.type) {
      case "bgp":
        yield* this.executeBGP(operation);
        break;

      case "filter":
        yield* this.executeFilter(operation);
        break;

      case "join":
        yield* this.executeJoin(operation);
        break;

      case "leftjoin":
        yield* this.executeLeftJoin(operation);
        break;

      case "union":
        yield* this.executeUnion(operation);
        break;

      case "project":
        yield* this.executeProject(operation);
        break;

      case "orderby":
        yield* this.executeOrderBy(operation);
        break;

      case "slice":
        yield* this.executeSlice(operation);
        break;

      case "distinct":
        yield* this.executeDistinct(operation);
        break;

      default:
        throw new QueryExecutorError(`Unknown operation type: ${(operation as any).type}`);
    }
  }

  private async *executeBGP(operation: BGPOperation): AsyncIterableIterator<SolutionMapping> {
    yield* this.bgpExecutor.execute(operation);
  }

  private async *executeFilter(operation: FilterOperation): AsyncIterableIterator<SolutionMapping> {
    const inputSolutions = this.execute(operation.input);
    yield* this.filterExecutor.execute(operation, inputSolutions);
  }

  private async *executeJoin(operation: JoinOperation): AsyncIterableIterator<SolutionMapping> {
    // Collect left solutions
    const leftSolutions: SolutionMapping[] = [];
    for await (const solution of this.execute(operation.left)) {
      leftSolutions.push(solution);
    }

    // For each left solution, execute right and merge compatible
    for (const leftSolution of leftSolutions) {
      for await (const rightSolution of this.execute(operation.right)) {
        const merged = leftSolution.merge(rightSolution);
        if (merged !== null) {
          yield merged;
        }
      }
    }
  }

  private async *executeLeftJoin(operation: LeftJoinOperation): AsyncIterableIterator<SolutionMapping> {
    // Collect solutions from both sides
    const leftSolutions: SolutionMapping[] = [];
    for await (const solution of this.execute(operation.left)) {
      leftSolutions.push(solution);
    }

    const rightSolutions: SolutionMapping[] = [];
    for await (const solution of this.execute(operation.right)) {
      rightSolutions.push(solution);
    }

    // Use OptionalExecutor for left join semantics
    async function* leftGen() {
      for (const s of leftSolutions) yield s;
    }
    async function* rightGen() {
      for (const s of rightSolutions) yield s;
    }

    yield* this.optionalExecutor.execute(leftGen(), rightGen());
  }

  private async *executeUnion(operation: UnionOperation): AsyncIterableIterator<SolutionMapping> {
    // Collect solutions from both sides
    const leftSolutions: SolutionMapping[] = [];
    for await (const solution of this.execute(operation.left)) {
      leftSolutions.push(solution);
    }

    const rightSolutions: SolutionMapping[] = [];
    for await (const solution of this.execute(operation.right)) {
      rightSolutions.push(solution);
    }

    // Use UnionExecutor
    async function* leftGen() {
      for (const s of leftSolutions) yield s;
    }
    async function* rightGen() {
      for (const s of rightSolutions) yield s;
    }

    yield* this.unionExecutor.execute(leftGen(), rightGen());
  }

  private async *executeProject(operation: ProjectOperation): AsyncIterableIterator<SolutionMapping> {
    // Project passes through to input, variable filtering happens at result formatting
    for await (const solution of this.execute(operation.input)) {
      yield solution;
    }
  }

  private async *executeOrderBy(operation: OrderByOperation): AsyncIterableIterator<SolutionMapping> {
    // Collect all solutions for sorting
    const solutions: SolutionMapping[] = [];
    for await (const solution of this.execute(operation.input)) {
      solutions.push(solution);
    }

    // Sort by comparators
    solutions.sort((a, b) => {
      for (const comparator of operation.comparators) {
        const aValue = this.getExpressionValue(comparator.expression, a);
        const bValue = this.getExpressionValue(comparator.expression, b);

        let comparison = 0;
        if (aValue === undefined && bValue === undefined) {
          comparison = 0;
        } else if (aValue === undefined) {
          comparison = 1; // undefined values go last
        } else if (bValue === undefined) {
          comparison = -1;
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          comparison = aValue - bValue;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }

        if (comparator.descending) {
          comparison = -comparison;
        }

        if (comparison !== 0) {
          return comparison;
        }
      }
      return 0;
    });

    for (const solution of solutions) {
      yield solution;
    }
  }

  private async *executeSlice(operation: SliceOperation): AsyncIterableIterator<SolutionMapping> {
    let count = 0;
    const offset = operation.offset ?? 0;
    const limit = operation.limit;

    for await (const solution of this.execute(operation.input)) {
      if (count >= offset) {
        if (limit !== undefined && count - offset >= limit) {
          break;
        }
        yield solution;
      }
      count++;
    }
  }

  private async *executeDistinct(operation: DistinctOperation): AsyncIterableIterator<SolutionMapping> {
    const seen = new Set<string>();

    for await (const solution of this.execute(operation.input)) {
      const key = this.getSolutionKey(solution);
      if (!seen.has(key)) {
        seen.add(key);
        yield solution;
      }
    }
  }

  private getExpressionValue(expr: any, solution: SolutionMapping): any {
    if (expr.type === "variable") {
      const term = solution.get(expr.name);
      if (term) {
        return (term as any).value ?? (term as any).id ?? String(term);
      }
      return undefined;
    }
    return expr.value;
  }

  private getSolutionKey(solution: SolutionMapping): string {
    const json = solution.toJSON();
    const keys = Object.keys(json).sort();
    return keys.map((k) => `${k}=${json[k]}`).join("|");
  }
}
