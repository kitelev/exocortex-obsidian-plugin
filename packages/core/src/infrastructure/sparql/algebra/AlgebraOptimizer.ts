import type {
  AlgebraOperation,
  FilterOperation,
  JoinOperation,
  Expression,
} from "./AlgebraOperation";

export interface OptimizationStats {
  tripleCount: number;
  selectivity: number;
}

export class AlgebraOptimizer {
  private stats: Map<string, OptimizationStats> = new Map();

  optimize(operation: AlgebraOperation): AlgebraOperation {
    let optimized = operation;

    optimized = this.filterPushDown(optimized);

    optimized = this.joinReordering(optimized);

    return optimized;
  }

  filterPushDown(operation: AlgebraOperation): AlgebraOperation {
    if (operation.type === "filter") {
      return this.pushDownFilter(operation);
    }

    if (operation.type === "join") {
      return {
        type: "join",
        left: this.filterPushDown(operation.left),
        right: this.filterPushDown(operation.right),
      };
    }

    if (operation.type === "leftjoin") {
      return {
        ...operation,
        left: this.filterPushDown(operation.left),
        right: this.filterPushDown(operation.right),
      };
    }

    if (operation.type === "union") {
      return {
        type: "union",
        left: this.filterPushDown(operation.left),
        right: this.filterPushDown(operation.right),
      };
    }

    if (operation.type === "project") {
      return {
        ...operation,
        input: this.filterPushDown(operation.input),
      };
    }

    if (operation.type === "orderby") {
      return {
        ...operation,
        input: this.filterPushDown(operation.input),
      };
    }

    if (operation.type === "slice") {
      return {
        ...operation,
        input: this.filterPushDown(operation.input),
      };
    }

    if (operation.type === "distinct") {
      return {
        ...operation,
        input: this.filterPushDown(operation.input),
      };
    }

    return operation;
  }

  private pushDownFilter(filter: FilterOperation): AlgebraOperation {
    const input = filter.input;

    if (input.type === "join") {
      const filterVars = this.getFilterVariables(filter.expression);
      const leftVars = this.getOperationVariables(input.left);
      const rightVars = this.getOperationVariables(input.right);

      const leftOnly = filterVars.every((v) => leftVars.has(v));
      const rightOnly = filterVars.every((v) => rightVars.has(v));

      if (leftOnly && !rightOnly) {
        return {
          type: "join",
          left: {
            type: "filter",
            expression: filter.expression,
            input: this.filterPushDown(input.left),
          },
          right: this.filterPushDown(input.right),
        };
      }

      if (rightOnly && !leftOnly) {
        return {
          type: "join",
          left: this.filterPushDown(input.left),
          right: {
            type: "filter",
            expression: filter.expression,
            input: this.filterPushDown(input.right),
          },
        };
      }

      return {
        type: "filter",
        expression: filter.expression,
        input: {
          type: "join",
          left: this.filterPushDown(input.left),
          right: this.filterPushDown(input.right),
        },
      };
    }

    if (input.type === "union") {
      return {
        type: "union",
        left: {
          type: "filter",
          expression: filter.expression,
          input: this.filterPushDown(input.left),
        },
        right: {
          type: "filter",
          expression: filter.expression,
          input: this.filterPushDown(input.right),
        },
      };
    }

    return {
      type: "filter",
      expression: filter.expression,
      input: this.filterPushDown(input),
    };
  }

  private getFilterVariables(expr: Expression): string[] {
    const vars: string[] = [];

    if (expr.type === "variable") {
      vars.push(expr.name);
    } else if (expr.type === "comparison") {
      vars.push(...this.getFilterVariables(expr.left));
      vars.push(...this.getFilterVariables(expr.right));
    } else if (expr.type === "logical") {
      for (const operand of expr.operands) {
        vars.push(...this.getFilterVariables(operand));
      }
    } else if (expr.type === "function") {
      for (const arg of expr.args) {
        vars.push(...this.getFilterVariables(arg));
      }
    }

    return Array.from(new Set(vars));
  }

  private getOperationVariables(operation: AlgebraOperation): Set<string> {
    const vars = new Set<string>();

    if (operation.type === "bgp") {
      for (const triple of operation.triples) {
        if (triple.subject.type === "variable") vars.add(triple.subject.value);
        if (triple.predicate.type === "variable") vars.add(triple.predicate.value);
        if (triple.object.type === "variable") vars.add(triple.object.value);
      }
    } else if (operation.type === "join") {
      const leftVars = this.getOperationVariables(operation.left);
      const rightVars = this.getOperationVariables(operation.right);
      return new Set([...leftVars, ...rightVars]);
    } else if (operation.type === "filter") {
      return this.getOperationVariables(operation.input);
    } else if (operation.type === "leftjoin") {
      const leftVars = this.getOperationVariables(operation.left);
      const rightVars = this.getOperationVariables(operation.right);
      return new Set([...leftVars, ...rightVars]);
    } else if (operation.type === "union") {
      const leftVars = this.getOperationVariables(operation.left);
      const rightVars = this.getOperationVariables(operation.right);
      return new Set([...leftVars, ...rightVars]);
    } else if (operation.type === "project") {
      return new Set(operation.variables);
    }

    return vars;
  }

  joinReordering(operation: AlgebraOperation): AlgebraOperation {
    if (operation.type === "join") {
      return this.reorderJoin(operation);
    }

    if (operation.type === "filter") {
      return {
        ...operation,
        input: this.joinReordering(operation.input),
      };
    }

    if (operation.type === "leftjoin") {
      return {
        ...operation,
        left: this.joinReordering(operation.left),
        right: this.joinReordering(operation.right),
      };
    }

    if (operation.type === "union") {
      return {
        ...operation,
        left: this.joinReordering(operation.left),
        right: this.joinReordering(operation.right),
      };
    }

    if (operation.type === "project") {
      return {
        ...operation,
        input: this.joinReordering(operation.input),
      };
    }

    if (operation.type === "orderby") {
      return {
        ...operation,
        input: this.joinReordering(operation.input),
      };
    }

    if (operation.type === "slice") {
      return {
        ...operation,
        input: this.joinReordering(operation.input),
      };
    }

    if (operation.type === "distinct") {
      return {
        ...operation,
        input: this.joinReordering(operation.input),
      };
    }

    return operation;
  }

  private reorderJoin(join: JoinOperation): AlgebraOperation {
    const leftCost = this.estimateCost(join.left);
    const rightCost = this.estimateCost(join.right);

    if (rightCost < leftCost) {
      return {
        type: "join",
        left: this.joinReordering(join.right),
        right: this.joinReordering(join.left),
      };
    }

    return {
      type: "join",
      left: this.joinReordering(join.left),
      right: this.joinReordering(join.right),
    };
  }

  private estimateCost(operation: AlgebraOperation): number {
    if (operation.type === "bgp") {
      let cost = operation.triples.length * 100;

      for (const triple of operation.triples) {
        if (triple.subject.type === "variable") cost += 10;
        if (triple.predicate.type === "variable") cost += 20;
        if (triple.object.type === "variable") cost += 10;
      }

      return cost;
    }

    if (operation.type === "filter") {
      return this.estimateCost(operation.input) * 0.3;
    }

    if (operation.type === "join") {
      return this.estimateCost(operation.left) * this.estimateCost(operation.right);
    }

    if (operation.type === "leftjoin") {
      return this.estimateCost(operation.left) + this.estimateCost(operation.right) * 0.5;
    }

    if (operation.type === "union") {
      return this.estimateCost(operation.left) + this.estimateCost(operation.right);
    }

    return 100;
  }

  setStatistics(operation: string, stats: OptimizationStats): void {
    this.stats.set(operation, stats);
  }

  getStatistics(operation: string): OptimizationStats | undefined {
    return this.stats.get(operation);
  }
}
