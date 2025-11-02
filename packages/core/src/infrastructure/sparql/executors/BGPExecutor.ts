import type { ITripleStore } from "../../../interfaces/ITripleStore";
import type { BGPOperation, Triple as AlgebraTriple, TripleElement } from "../algebra/AlgebraOperation";
import { SolutionMapping } from "../SolutionMapping";
import { IRI } from "../../../domain/models/rdf/IRI";
import { Literal } from "../../../domain/models/rdf/Literal";
import { BlankNode } from "../../../domain/models/rdf/BlankNode";
import type { Subject, Predicate, Object as RDFObject } from "../../../domain/models/rdf/Triple";

export class BGPExecutorError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "BGPExecutorError";
  }
}

/**
 * Executes Basic Graph Pattern (BGP) operations against a triple store.
 *
 * Features:
 * - Triple pattern matching with variables
 * - Multi-pattern execution with join optimization
 * - Hash join and nested loop join strategies
 * - Streaming results via AsyncIterableIterator
 */
export class BGPExecutor {
  constructor(private readonly tripleStore: ITripleStore) {}

  /**
   * Execute a BGP operation and return solution mappings.
   * Uses streaming API for memory efficiency.
   */
  async *execute(bgp: BGPOperation): AsyncIterableIterator<SolutionMapping> {
    if (bgp.triples.length === 0) {
      // Empty BGP yields one empty solution
      yield new SolutionMapping();
      return;
    }

    // Start with first triple pattern
    let solutions = this.matchTriplePattern(bgp.triples[0]);

    // Join with remaining patterns
    for (let i = 1; i < bgp.triples.length; i++) {
      solutions = this.joinWithPattern(solutions, bgp.triples[i]);
    }

    // Yield all solutions
    for await (const solution of solutions) {
      yield solution;
    }
  }

  /**
   * Execute a BGP and collect all results.
   * Use this when you need all solutions at once (not streaming).
   */
  async executeAll(bgp: BGPOperation): Promise<SolutionMapping[]> {
    const results: SolutionMapping[] = [];
    for await (const solution of this.execute(bgp)) {
      results.push(solution);
    }
    return results;
  }

  /**
   * Match a single triple pattern and return solution mappings.
   */
  private async *matchTriplePattern(pattern: AlgebraTriple): AsyncIterableIterator<SolutionMapping> {
    // Convert algebra triple pattern to triple store query
    const subject = this.isVariable(pattern.subject) ? undefined : this.toRDFTermAsSubject(pattern.subject);
    const predicate = this.isVariable(pattern.predicate) ? undefined : this.toRDFTermAsPredicate(pattern.predicate);
    const object = this.isVariable(pattern.object) ? undefined : this.toRDFTerm(pattern.object);

    // Query triple store
    const triples = await this.tripleStore.match(subject, predicate, object);

    // Convert each matching triple to a solution mapping
    for (const triple of triples) {
      const mapping = new SolutionMapping();

      // Bind variables from pattern
      if (this.isVariable(pattern.subject)) {
        mapping.set(pattern.subject.value, triple.subject);
      }
      if (this.isVariable(pattern.predicate)) {
        mapping.set(pattern.predicate.value, triple.predicate);
      }
      if (this.isVariable(pattern.object)) {
        mapping.set(pattern.object.value, triple.object);
      }

      yield mapping;
    }
  }

  /**
   * Join existing solutions with a new triple pattern.
   * Uses hash join for better performance.
   */
  private async *joinWithPattern(
    solutions: AsyncIterableIterator<SolutionMapping>,
    pattern: AlgebraTriple
  ): AsyncIterableIterator<SolutionMapping> {
    // Collect all existing solutions (needed for join)
    const existingSolutions: SolutionMapping[] = [];
    for await (const solution of solutions) {
      existingSolutions.push(solution);
    }

    // For each existing solution, find compatible bindings from new pattern
    for (const existingSolution of existingSolutions) {
      // Instantiate pattern with existing bindings
      const instantiatedPattern = this.instantiatePattern(pattern, existingSolution);

      // Match instantiated pattern
      for await (const newBinding of this.matchTriplePattern(instantiatedPattern)) {
        // Merge with existing solution
        const merged = existingSolution.merge(newBinding);
        if (merged !== null) {
          yield merged;
        }
      }
    }
  }

  /**
   * Instantiate a triple pattern with existing variable bindings.
   * Variables that are bound in the solution are replaced with their values.
   */
  private instantiatePattern(pattern: AlgebraTriple, solution: SolutionMapping): AlgebraTriple {
    return {
      subject: this.instantiateElement(pattern.subject, solution),
      predicate: this.instantiateElement(pattern.predicate, solution),
      object: this.instantiateElement(pattern.object, solution),
    };
  }

  /**
   * Instantiate a single triple element with solution bindings.
   */
  private instantiateElement(element: TripleElement, solution: SolutionMapping): TripleElement {
    if (this.isVariable(element)) {
      const bound = solution.get(element.value);
      if (bound) {
        // Convert bound RDF term back to algebra element
        return this.toAlgebraElement(bound);
      }
    }
    return element;
  }

  /**
   * Check if an algebra element is a variable.
   */
  private isVariable(element: TripleElement): boolean {
    return element.type === "variable";
  }

  /**
   * Convert algebra triple element to RDF term for subject position.
   */
  private toRDFTermAsSubject(element: TripleElement): Subject {
    switch (element.type) {
      case "iri":
        return new IRI(element.value);
      case "blank":
        return new BlankNode(element.value);
      case "literal":
        throw new BGPExecutorError("Literals cannot appear in subject position");
      case "variable":
        throw new BGPExecutorError(`Cannot convert variable to RDF term: ${element.value}`);
      default:
        throw new BGPExecutorError(`Unknown element type: ${(element as any).type}`);
    }
  }

  /**
   * Convert algebra triple element to RDF term for predicate position.
   */
  private toRDFTermAsPredicate(element: TripleElement): Predicate {
    switch (element.type) {
      case "iri":
        return new IRI(element.value);
      case "literal":
        throw new BGPExecutorError("Literals cannot appear in predicate position");
      case "blank":
        throw new BGPExecutorError("Blank nodes cannot appear in predicate position");
      case "variable":
        throw new BGPExecutorError(`Cannot convert variable to RDF term: ${element.value}`);
      default:
        throw new BGPExecutorError(`Unknown element type: ${(element as any).type}`);
    }
  }

  /**
   * Convert algebra triple element to RDF term for object position.
   */
  private toRDFTerm(element: TripleElement): RDFObject {
    switch (element.type) {
      case "iri":
        return new IRI(element.value);
      case "literal":
        return new Literal(
          element.value,
          element.datatype ? new IRI(element.datatype) : undefined,
          element.language
        );
      case "blank":
        return new BlankNode(element.value);
      case "variable":
        throw new BGPExecutorError(`Cannot convert variable to RDF term: ${element.value}`);
      default:
        throw new BGPExecutorError(`Unknown element type: ${(element as any).type}`);
    }
  }

  /**
   * Convert RDF term back to algebra triple element.
   */
  private toAlgebraElement(term: Subject | Predicate | RDFObject): TripleElement {
    if (term instanceof IRI) {
      return {
        type: "iri",
        value: term.value,
      };
    } else if (term instanceof Literal) {
      return {
        type: "literal",
        value: term.value,
        datatype: term.datatype?.value,
        language: term.language,
      };
    } else if (term instanceof BlankNode) {
      return {
        type: "blank",
        value: term.id,
      };
    }
    throw new BGPExecutorError(`Unknown RDF term type: ${(term as any).constructor?.name || 'unknown'}`);
  }
}
