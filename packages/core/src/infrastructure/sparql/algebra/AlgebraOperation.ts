export type AlgebraOperation =
  | BGPOperation
  | FilterOperation
  | JoinOperation
  | LeftJoinOperation
  | UnionOperation
  | ProjectOperation
  | OrderByOperation
  | SliceOperation
  | DistinctOperation
  | GroupOperation
  | ExtendOperation;

export interface BGPOperation {
  type: "bgp";
  triples: Triple[];
}

export interface Triple {
  subject: TripleElement;
  predicate: TripleElement;
  object: TripleElement;
}

export type TripleElement = Variable | IRI | Literal | BlankNode;

export interface Variable {
  type: "variable";
  value: string;
}

export interface IRI {
  type: "iri";
  value: string;
}

export interface Literal {
  type: "literal";
  value: string;
  datatype?: string;
  language?: string;
}

export interface BlankNode {
  type: "blank";
  value: string;
}

export interface FilterOperation {
  type: "filter";
  expression: Expression;
  input: AlgebraOperation;
}

export type Expression =
  | ComparisonExpression
  | LogicalExpression
  | FunctionCallExpression
  | VariableExpression
  | LiteralExpression;

export interface ComparisonExpression {
  type: "comparison";
  operator: "=" | "!=" | "<" | ">" | "<=" | ">=";
  left: Expression;
  right: Expression;
}

export interface LogicalExpression {
  type: "logical";
  operator: "&&" | "||" | "!";
  operands: Expression[];
}

export interface FunctionCallExpression {
  type: "function";
  function: string;
  args: Expression[];
}

export interface VariableExpression {
  type: "variable";
  name: string;
}

export interface LiteralExpression {
  type: "literal";
  value: string | number | boolean;
  datatype?: string;
}

export interface JoinOperation {
  type: "join";
  left: AlgebraOperation;
  right: AlgebraOperation;
}

export interface LeftJoinOperation {
  type: "leftjoin";
  left: AlgebraOperation;
  right: AlgebraOperation;
  expression?: Expression;
}

export interface UnionOperation {
  type: "union";
  left: AlgebraOperation;
  right: AlgebraOperation;
}

export interface ProjectOperation {
  type: "project";
  variables: string[];
  input: AlgebraOperation;
}

export interface OrderByOperation {
  type: "orderby";
  comparators: OrderComparator[];
  input: AlgebraOperation;
}

export interface OrderComparator {
  expression: Expression;
  descending: boolean;
}

export interface SliceOperation {
  type: "slice";
  offset?: number;
  limit?: number;
  input: AlgebraOperation;
}

export interface DistinctOperation {
  type: "distinct";
  input: AlgebraOperation;
}

export interface GroupOperation {
  type: "group";
  variables: string[];
  aggregates: AggregateBinding[];
  input: AlgebraOperation;
}

export interface AggregateBinding {
  variable: string;
  expression: AggregateExpression;
}

export interface AggregateExpression {
  type: "aggregate";
  aggregation: "count" | "sum" | "avg" | "min" | "max" | "group_concat";
  expression?: Expression;
  distinct: boolean;
  separator?: string;
}

export interface ExtendOperation {
  type: "extend";
  variable: string;
  expression: Expression | AggregateExpression;
  input: AlgebraOperation;
}
