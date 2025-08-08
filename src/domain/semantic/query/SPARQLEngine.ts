/**
 * SPARQL Query Engine for semantic querying
 * Implements a subset of SPARQL 1.1 for knowledge object queries
 */

import { Graph, Node, Subject, Predicate, Object } from '../core/Graph';
import { Triple, IRI, BlankNode, Literal } from '../core/Triple';
import { Result } from '../../core/Result';

export interface BindingSet {
  [variable: string]: Node;
}

export interface QueryResult {
  variables: string[];
  bindings: BindingSet[];
}

export interface TriplePattern {
  subject: string | IRI | BlankNode;
  predicate: string | IRI;
  object: string | IRI | BlankNode | Literal;
}

type PatternNode = string | IRI | BlankNode | Literal;

/**
 * SPARQL Query Engine
 * Supports basic graph pattern matching with optional filters
 */
export class SPARQLEngine {
  constructor(private graph: Graph) {}

  /**
   * Execute a SPARQL SELECT query
   */
  select(query: string): Result<QueryResult> {
    try {
      const parsed = this.parseQuery(query);
      if (parsed.isFailure) {
        return Result.fail(parsed.error);
      }

      const { variables, patterns, filters } = parsed.getValue();
      const bindings = this.evaluatePatterns(patterns, filters);

      return Result.ok({
        variables,
        bindings
      });
    } catch (error) {
      return Result.fail(`Query execution failed: ${error.message}`);
    }
  }

  /**
   * Execute a SPARQL ASK query (returns boolean)
   */
  ask(query: string): Result<boolean> {
    try {
      const parsed = this.parseQuery(query);
      if (parsed.isFailure) {
        return Result.fail(parsed.error);
      }

      const { patterns, filters } = parsed.getValue();
      const bindings = this.evaluatePatterns(patterns, filters);

      return Result.ok(bindings.length > 0);
    } catch (error) {
      return Result.fail(`Query execution failed: ${error.message}`);
    }
  }

  /**
   * Execute a SPARQL CONSTRUCT query (returns new graph)
   */
  construct(query: string): Result<Graph> {
    try {
      const parsed = this.parseConstructQuery(query);
      if (parsed.isFailure) {
        return Result.fail(parsed.error);
      }

      const { template, patterns, filters } = parsed.getValue();
      const bindings = this.evaluatePatterns(patterns, filters);
      const resultGraph = new Graph();

      for (const binding of bindings) {
        for (const pattern of template) {
          const triple = this.instantiatePattern(pattern, binding);
          if (triple) {
            resultGraph.add(triple);
          }
        }
      }

      return Result.ok(resultGraph);
    } catch (error) {
      return Result.fail(`Query execution failed: ${error.message}`);
    }
  }

  /**
   * Parse a SELECT/ASK query
   */
  private parseQuery(query: string): Result<{
    variables: string[];
    patterns: TriplePattern[];
    filters: string[];
  }> {
    // Simplified SPARQL parsing
    // In production, use a proper SPARQL parser library

    const variables: string[] = [];
    const patterns: TriplePattern[] = [];
    const filters: string[] = [];

    // Extract SELECT variables
    const selectMatch = query.match(/SELECT\s+(.*?)\s+WHERE/i);
    if (selectMatch) {
      const varString = selectMatch[1];
      if (varString === '*') {
        // Will extract all variables from patterns
      } else {
        const varMatches = varString.matchAll(/\?(\w+)/g);
        for (const match of varMatches) {
          variables.push(match[1]);
        }
      }
    }

    // Extract WHERE clause
    const whereMatch = query.match(/WHERE\s*\{(.*?)\}/is);
    if (!whereMatch) {
      return Result.fail('Invalid query: missing WHERE clause');
    }

    const whereClause = whereMatch[1];
    const lines = whereClause.split(/[\n;]/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('FILTER')) {
        filters.push(trimmed);
      } else {
        // Parse triple pattern
        const parts = this.parseTriplePattern(trimmed);
        if (parts) {
          patterns.push(parts);
          
          // Extract variables if SELECT *
          if (selectMatch && selectMatch[1] === '*') {
            for (const part of [parts.subject, parts.predicate, parts.object]) {
              if (typeof part === 'string' && part.startsWith('?')) {
                const varName = part.substring(1);
                if (!variables.includes(varName)) {
                  variables.push(varName);
                }
              }
            }
          }
        }
      }
    }

    return Result.ok({ variables, patterns, filters });
  }

  /**
   * Parse a CONSTRUCT query
   */
  private parseConstructQuery(query: string): Result<{
    template: TriplePattern[];
    patterns: TriplePattern[];
    filters: string[];
  }> {
    const template: TriplePattern[] = [];
    const patterns: TriplePattern[] = [];
    const filters: string[] = [];

    // Extract CONSTRUCT template
    const constructMatch = query.match(/CONSTRUCT\s*\{(.*?)\}\s*WHERE/is);
    if (!constructMatch) {
      return Result.fail('Invalid CONSTRUCT query');
    }

    const templateClause = constructMatch[1];
    const templateLines = templateClause.split(/[\n;]/);

    for (const line of templateLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const parts = this.parseTriplePattern(trimmed);
      if (parts) {
        template.push(parts);
      }
    }

    // Extract WHERE clause
    const whereMatch = query.match(/WHERE\s*\{(.*?)\}/is);
    if (!whereMatch) {
      return Result.fail('Invalid query: missing WHERE clause');
    }

    const whereClause = whereMatch[1];
    const lines = whereClause.split(/[\n;]/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('FILTER')) {
        filters.push(trimmed);
      } else {
        const parts = this.parseTriplePattern(trimmed);
        if (parts) {
          patterns.push(parts);
        }
      }
    }

    return Result.ok({ template, patterns, filters });
  }

  /**
   * Parse a single triple pattern
   */
  private parseTriplePattern(pattern: string): TriplePattern | null {
    // Remove trailing period if present
    pattern = pattern.replace(/\s*\.\s*$/, '');
    
    // Simple pattern: subject predicate object
    const parts = pattern.split(/\s+/);
    if (parts.length < 3) return null;

    const [subjectStr, predicateStr, ...objectParts] = parts;
    const objectStr = objectParts.join(' ');

    const subject = this.parseNode(subjectStr);
    const predicate = this.parseNode(predicateStr);
    const object = this.parseNode(objectStr);

    if (!subject || !predicate || !object) return null;

    // Cast to appropriate types for the pattern
    const subjectNode = subject as string | IRI | BlankNode;
    const predicateNode = predicate as string | IRI;
    const objectNode = object as string | IRI | BlankNode | Literal;

    return { 
      subject: subjectNode, 
      predicate: predicateNode, 
      object: objectNode 
    };
  }

  /**
   * Parse a node (IRI, variable, or literal)
   */
  private parseNode(str: string): string | IRI | BlankNode | Literal | null {
    if (!str) return null;

    // Variable
    if (str.startsWith('?')) {
      return str;
    }

    // IRI in angle brackets
    if (str.startsWith('<') && str.endsWith('>')) {
      return new IRI(str.substring(1, str.length - 1));
    }

    // Prefixed IRI
    if (str.includes(':') && !str.startsWith('"')) {
      // For simplicity, expand common prefixes
      const expanded = this.expandPrefix(str);
      return new IRI(expanded);
    }

    // Literal with quotes
    if (str.startsWith('"') && str.endsWith('"')) {
      return Literal.string(str.substring(1, str.length - 1));
    }

    // Number literal
    if (!isNaN(Number(str))) {
      if (str.includes('.')) {
        return Literal.double(parseFloat(str));
      }
      return Literal.integer(parseInt(str, 10));
    }

    // Boolean literal
    if (str === 'true' || str === 'false') {
      return Literal.boolean(str === 'true');
    }

    // Default to IRI
    return new IRI(str);
  }

  /**
   * Expand common prefixes
   */
  private expandPrefix(prefixed: string): string {
    const prefixMap: Record<string, string> = {
      'rdf:': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      'rdfs:': 'http://www.w3.org/2000/01/rdf-schema#',
      'owl:': 'http://www.w3.org/2002/07/owl#',
      'xsd:': 'http://www.w3.org/2001/XMLSchema#',
      'exo:': 'https://exocortex.io/ontology/core#',
      'ems:': 'https://exocortex.io/ontology/ems#',
      'ims:': 'https://exocortex.io/ontology/ims#'
    };

    for (const [prefix, namespace] of Object.entries(prefixMap)) {
      if (prefixed.startsWith(prefix)) {
        return namespace + prefixed.substring(prefix.length);
      }
    }

    return prefixed;
  }

  /**
   * Evaluate triple patterns and return bindings
   */
  private evaluatePatterns(patterns: TriplePattern[], filters: string[]): BindingSet[] {
    if (patterns.length === 0) {
      return [{}];
    }

    let bindings: BindingSet[] = [{}];

    for (const pattern of patterns) {
      const newBindings: BindingSet[] = [];

      for (const binding of bindings) {
        const matches = this.matchPattern(pattern, binding);
        for (const match of matches) {
          newBindings.push({ ...binding, ...match });
        }
      }

      bindings = newBindings;
    }

    // Apply filters
    for (const filter of filters) {
      bindings = this.applyFilter(bindings, filter);
    }

    return bindings;
  }

  /**
   * Match a single pattern against the graph with existing bindings
   */
  private matchPattern(pattern: TriplePattern, binding: BindingSet): BindingSet[] {
    const results: BindingSet[] = [];

    // Resolve pattern with existing bindings
    const subject = this.resolvePatternNode(pattern.subject, binding);
    const predicate = this.resolvePatternNode(pattern.predicate, binding);
    const object = this.resolvePatternNode(pattern.object, binding);

    // Get matching triples
    const triples = this.graph.match(
      subject instanceof IRI || subject instanceof BlankNode ? subject : null,
      predicate instanceof IRI ? predicate : null,
      object instanceof IRI || object instanceof BlankNode || object instanceof Literal ? object : null
    );

    for (const triple of triples) {
      const newBinding: BindingSet = {};

      // Bind subject variable
      if (typeof pattern.subject === 'string' && pattern.subject.startsWith('?')) {
        const varName = pattern.subject.substring(1);
        if (binding[varName]) {
          if (!this.nodesEqual(binding[varName], triple.getSubject())) {
            continue;
          }
        } else {
          newBinding[varName] = triple.getSubject();
        }
      }

      // Bind predicate variable
      if (typeof pattern.predicate === 'string' && pattern.predicate.startsWith('?')) {
        const varName = pattern.predicate.substring(1);
        if (binding[varName]) {
          if (!this.nodesEqual(binding[varName], triple.getPredicate())) {
            continue;
          }
        } else {
          newBinding[varName] = triple.getPredicate();
        }
      }

      // Bind object variable
      if (typeof pattern.object === 'string' && pattern.object.startsWith('?')) {
        const varName = pattern.object.substring(1);
        if (binding[varName]) {
          if (!this.nodesEqual(binding[varName], triple.getObject())) {
            continue;
          }
        } else {
          newBinding[varName] = triple.getObject();
        }
      }

      results.push(newBinding);
    }

    return results;
  }

  /**
   * Resolve a pattern node with bindings
   */
  private resolvePatternNode(
    node: string | IRI | BlankNode | Literal,
    binding: BindingSet
  ): Node | null {
    if (typeof node === 'string' && node.startsWith('?')) {
      const varName = node.substring(1);
      return binding[varName] || null;
    }
    return node as Node;
  }

  /**
   * Apply a FILTER to bindings
   */
  private applyFilter(bindings: BindingSet[], filter: string): BindingSet[] {
    // Simplified filter evaluation
    // In production, use a proper expression evaluator

    // Example: FILTER(?age > 18)
    const match = filter.match(/FILTER\s*\((.*?)\)/i);
    if (!match) return bindings;

    const expression = match[1];

    return bindings.filter(binding => {
      // Very basic filter evaluation
      // This is a placeholder for demonstration
      return this.evaluateFilterExpression(expression, binding);
    });
  }

  /**
   * Evaluate a filter expression
   */
  private evaluateFilterExpression(expression: string, binding: BindingSet): boolean {
    // This is a simplified implementation
    // In production, use a proper expression parser/evaluator

    // Handle basic comparisons
    const comparisonMatch = expression.match(/\?(\w+)\s*(>|<|>=|<=|=|!=)\s*(.+)/);
    if (comparisonMatch) {
      const [, varName, operator, valueStr] = comparisonMatch;
      const varValue = binding[varName];

      if (!varValue) return false;

      if (varValue instanceof Literal) {
        const value = this.parseLiteralValue(valueStr);
        return this.compareLiterals(varValue, operator, value);
      }
    }

    // Default to true for now
    return true;
  }

  /**
   * Parse a literal value from string
   */
  private parseLiteralValue(str: string): any {
    if (str.startsWith('"') && str.endsWith('"')) {
      return str.substring(1, str.length - 1);
    }
    if (!isNaN(Number(str))) {
      return Number(str);
    }
    if (str === 'true' || str === 'false') {
      return str === 'true';
    }
    return str;
  }

  /**
   * Compare two literals
   */
  private compareLiterals(literal: Literal, operator: string, value: any): boolean {
    const litValue = literal.getValue();

    switch (operator) {
      case '>':
        return litValue > value;
      case '<':
        return litValue < value;
      case '>=':
        return litValue >= value;
      case '<=':
        return litValue <= value;
      case '=':
        return litValue === value;
      case '!=':
        return litValue !== value;
      default:
        return false;
    }
  }

  /**
   * Check if two nodes are equal
   */
  private nodesEqual(node1: Node, node2: Node): boolean {
    if (node1 instanceof IRI && node2 instanceof IRI) {
      return node1.equals(node2);
    }
    if (node1 instanceof Literal && node2 instanceof Literal) {
      return node1.equals(node2);
    }
    if (node1 instanceof BlankNode && node2 instanceof BlankNode) {
      return node1.equals(node2);
    }
    return false;
  }

  /**
   * Instantiate a pattern with bindings to create a triple
   */
  private instantiatePattern(pattern: TriplePattern, binding: BindingSet): Triple | null {
    const subject = this.resolvePatternNode(pattern.subject, binding);
    const predicate = this.resolvePatternNode(pattern.predicate, binding);
    const object = this.resolvePatternNode(pattern.object, binding);

    if (
      (subject instanceof IRI || subject instanceof BlankNode) &&
      predicate instanceof IRI &&
      (object instanceof IRI || object instanceof BlankNode || object instanceof Literal)
    ) {
      return new Triple(subject, predicate, object);
    }

    return null;
  }
}

/**
 * SPARQL query builder for common patterns
 */
export class SPARQLBuilder {
  private prefixes: Map<string, string> = new Map();
  private selectVars: string[] = [];
  private wherePatterns: string[] = [];
  private filters: string[] = [];
  private orderBy: string[] = [];
  private limitValue?: number;
  private offsetValue?: number;

  constructor() {
    // Add default prefixes
    this.prefix('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#');
    this.prefix('rdfs', 'http://www.w3.org/2000/01/rdf-schema#');
    this.prefix('exo', 'https://exocortex.io/ontology/core#');
    this.prefix('ems', 'https://exocortex.io/ontology/ems#');
    this.prefix('ims', 'https://exocortex.io/ontology/ims#');
  }

  prefix(prefix: string, namespace: string): SPARQLBuilder {
    this.prefixes.set(prefix, namespace);
    return this;
  }

  select(...vars: string[]): SPARQLBuilder {
    this.selectVars.push(...vars);
    return this;
  }

  where(pattern: string): SPARQLBuilder {
    this.wherePatterns.push(pattern);
    return this;
  }

  filter(expression: string): SPARQLBuilder {
    this.filters.push(expression);
    return this;
  }

  orderByAsc(variable: string): SPARQLBuilder {
    this.orderBy.push(`ASC(${variable})`);
    return this;
  }

  orderByDesc(variable: string): SPARQLBuilder {
    this.orderBy.push(`DESC(${variable})`);
    return this;
  }

  limit(n: number): SPARQLBuilder {
    this.limitValue = n;
    return this;
  }

  offset(n: number): SPARQLBuilder {
    this.offsetValue = n;
    return this;
  }

  build(): string {
    const lines: string[] = [];

    // Add prefixes
    for (const [prefix, namespace] of this.prefixes) {
      lines.push(`PREFIX ${prefix}: <${namespace}>`);
    }

    // SELECT clause
    const vars = this.selectVars.length > 0 ? this.selectVars.join(' ') : '*';
    lines.push(`SELECT ${vars}`);

    // WHERE clause
    lines.push('WHERE {');
    for (const pattern of this.wherePatterns) {
      lines.push(`  ${pattern}`);
    }
    for (const filter of this.filters) {
      lines.push(`  FILTER(${filter})`);
    }
    lines.push('}');

    // ORDER BY
    if (this.orderBy.length > 0) {
      lines.push(`ORDER BY ${this.orderBy.join(' ')}`);
    }

    // LIMIT
    if (this.limitValue !== undefined) {
      lines.push(`LIMIT ${this.limitValue}`);
    }

    // OFFSET
    if (this.offsetValue !== undefined) {
      lines.push(`OFFSET ${this.offsetValue}`);
    }

    return lines.join('\n');
  }
}