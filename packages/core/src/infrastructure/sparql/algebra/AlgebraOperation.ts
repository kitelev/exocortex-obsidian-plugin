export type AlgebraOperation =
  | BGPOperation
  | FilterOperation
  | JoinOperation
  | LeftJoinOperation
  | UnionOperation
  | MinusOperation
  | ValuesOperation
  | ProjectOperation
  | OrderByOperation
  | SliceOperation
  | DistinctOperation
  | GroupOperation
  | ExtendOperation
  | SubqueryOperation;

export interface BGPOperation {
  type: "bgp";
  triples: Triple[];
}

export interface Triple {
  subject: TripleElement;
  predicate: TripleElement | PropertyPath;
  object: TripleElement;
}

export type TripleElement = Variable | IRI | Literal | BlankNode;

/**
 * Property path expression for SPARQL 1.1 property paths.
 * Supports: sequence (/), alternative (|), inverse (^),
 * oneOrMore (+), zeroOrMore (*), zeroOrOne (?)
 */
export type PropertyPath =
  | SequencePath
  | AlternativePath
  | InversePath
  | OneOrMorePath
  | ZeroOrMorePath
  | ZeroOrOnePath;

export interface SequencePath {
  type: "path";
  pathType: "/";
  items: (IRI | PropertyPath)[];
}

export interface AlternativePath {
  type: "path";
  pathType: "|";
  items: (IRI | PropertyPath)[];
}

export interface InversePath {
  type: "path";
  pathType: "^";
  items: [IRI | PropertyPath]; // Single item
}

export interface OneOrMorePath {
  type: "path";
  pathType: "+";
  items: [IRI | PropertyPath]; // Single item
}

export interface ZeroOrMorePath {
  type: "path";
  pathType: "*";
  items: [IRI | PropertyPath]; // Single item
}

export interface ZeroOrOnePath {
  type: "path";
  pathType: "?";
  items: [IRI | PropertyPath]; // Single item
}

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
  | ArithmeticExpression
  | FunctionCallExpression
  | RawFunctionCallExpression
  | VariableExpression
  | LiteralExpression
  | ExistsExpression;

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

export interface ArithmeticExpression {
  type: "arithmetic";
  operator: "+" | "-" | "*" | "/";
  left: Expression;
  right: Expression;
}

export interface FunctionCallExpression {
  type: "function";
  function: string;
  args: Expression[];
}

// Raw sparqljs format - used for direct SELECT expressions before algebra translation
export interface RawFunctionCallExpression {
  type: "functionCall";
  function: string | { termType: string; value: string };
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

export interface ExistsExpression {
  type: "exists";
  negated: boolean;
  pattern: AlgebraOperation;
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

/**
 * MINUS operation for set difference.
 * Removes solutions from left that are compatible with any solution in right.
 *
 * Semantics (SPARQL 1.1):
 * - Two solutions are compatible if shared variables have the same values
 * - If no variables are shared, solutions are always compatible (MINUS removes nothing)
 * - Different from FILTER NOT EXISTS which evaluates patterns per-solution
 *
 * Example:
 * SELECT ?task WHERE {
 *   ?task a ems:Task .
 *   MINUS { ?task ems:status "done" }
 * }
 * Returns all tasks except those with status "done"
 */
export interface MinusOperation {
  type: "minus";
  left: AlgebraOperation;
  right: AlgebraOperation;
}

/**
 * VALUES operation for inline data injection.
 * Provides explicit value bindings that are joined with the query pattern.
 *
 * SPARQL 1.1 spec: VALUES allows specifying an inline table of values
 * that behave like a virtual table in the query.
 *
 * Each binding in the bindings array represents a single row of values.
 * UNDEF is represented by omitting the variable from the binding object.
 *
 * Example:
 * ```sparql
 * SELECT ?task ?status WHERE {
 *   VALUES ?status { "active" "pending" }
 *   ?task ems:status ?status .
 * }
 * ```
 *
 * Multi-variable example:
 * ```sparql
 * SELECT ?name ?role WHERE {
 *   VALUES (?name ?role) {
 *     ("Alice" "admin")
 *     ("Bob" "editor")
 *   }
 *   ?person foaf:name ?name .
 *   ?person schema:role ?role .
 * }
 * ```
 *
 * UNDEF example (variable omitted from binding):
 * ```sparql
 * VALUES (?x ?y) {
 *   (1 2)
 *   (UNDEF 3)  # ?x is unbound for this row
 * }
 * ```
 */
export interface ValuesOperation {
  type: "values";
  /** Variable names (without ? prefix) that are bound by this VALUES clause */
  variables: string[];
  /**
   * Array of bindings, each representing a row of values.
   * Each binding maps variable names to their bound terms.
   * UNDEF is represented by omitting the variable from the binding.
   */
  bindings: ValuesBinding[];
}

/**
 * A single row of variable bindings in a VALUES clause.
 * Maps variable names (without ? prefix) to their bound values.
 * UNDEF is represented by the absence of the variable key.
 */
export interface ValuesBinding {
  [variable: string]: ValuesBindingValue;
}

/**
 * A value in a VALUES binding - can be an IRI or Literal.
 * BlankNodes are not typically used in VALUES clauses.
 */
export type ValuesBindingValue = IRI | Literal;

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

/**
 * Subquery operation for nested SELECT queries.
 * A subquery is a complete SELECT query that produces solution mappings
 * which are then joined with the outer query.
 *
 * Example:
 * SELECT ?name WHERE {
 *   { SELECT ?x WHERE { ?x :hasAge ?age } ORDER BY ?age LIMIT 10 }
 *   ?x :hasName ?name .
 * }
 */
export interface SubqueryOperation {
  type: "subquery";
  /** The complete algebra tree for the inner SELECT query */
  query: AlgebraOperation;
}
