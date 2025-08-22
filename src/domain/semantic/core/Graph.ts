/**
 * RDF Graph implementation for managing collections of triples
 * Provides efficient querying and manipulation of semantic data
 */

import { Triple, IRI, BlankNode, Literal } from "./Triple";
import { Result } from "../../core/Result";

export type Node = IRI | BlankNode | Literal;
export type Subject = IRI | BlankNode;
export type Predicate = IRI;
export type Object = Node;

/**
 * RDF Graph - A collection of RDF triples
 */
export class Graph {
  private triples: Set<Triple> = new Set();
  private spo: Map<string, Map<string, Set<string>>> = new Map();
  private pos: Map<string, Map<string, Set<string>>> = new Map();
  private osp: Map<string, Map<string, Set<string>>> = new Map();

  constructor(triples: Triple[] = []) {
    for (const triple of triples) {
      this.add(triple);
    }
  }

  /**
   * Add a triple to the graph
   */
  add(triple: Triple): void {
    if (this.has(triple)) return;

    this.triples.add(triple);

    const s = triple.getSubject().toString();
    const p = triple.getPredicate().toString();
    const o = triple.getObject().toString();

    // Update SPO index
    if (!this.spo.has(s)) this.spo.set(s, new Map());
    if (!this.spo.get(s)!.has(p)) this.spo.get(s)!.set(p, new Set());
    this.spo.get(s)!.get(p)!.add(o);

    // Update POS index
    if (!this.pos.has(p)) this.pos.set(p, new Map());
    if (!this.pos.get(p)!.has(o)) this.pos.get(p)!.set(o, new Set());
    this.pos.get(p)!.get(o)!.add(s);

    // Update OSP index
    if (!this.osp.has(o)) this.osp.set(o, new Map());
    if (!this.osp.get(o)!.has(s)) this.osp.get(o)!.set(s, new Set());
    this.osp.get(o)!.get(s)!.add(p);
  }

  /**
   * Remove a triple from the graph
   */
  remove(triple: Triple): void {
    if (!this.has(triple)) return;

    this.triples.delete(triple);

    const s = triple.getSubject().toString();
    const p = triple.getPredicate().toString();
    const o = triple.getObject().toString();

    // Update SPO index
    this.spo.get(s)?.get(p)?.delete(o);
    if (this.spo.get(s)?.get(p)?.size === 0) {
      this.spo.get(s)?.delete(p);
    }
    if (this.spo.get(s)?.size === 0) {
      this.spo.delete(s);
    }

    // Update POS index
    this.pos.get(p)?.get(o)?.delete(s);
    if (this.pos.get(p)?.get(o)?.size === 0) {
      this.pos.get(p)?.delete(o);
    }
    if (this.pos.get(p)?.size === 0) {
      this.pos.delete(p);
    }

    // Update OSP index
    this.osp.get(o)?.get(s)?.delete(p);
    if (this.osp.get(o)?.get(s)?.size === 0) {
      this.osp.get(o)?.delete(s);
    }
    if (this.osp.get(o)?.size === 0) {
      this.osp.delete(o);
    }
  }

  /**
   * Check if the graph contains a triple
   */
  has(triple: Triple): boolean {
    const s = triple.getSubject().toString();
    const p = triple.getPredicate().toString();
    const o = triple.getObject().toString();

    return this.spo.get(s)?.get(p)?.has(o) ?? false;
  }

  /**
   * Get all triples matching a pattern
   * null values act as wildcards
   */
  match(
    subject: Subject | null = null,
    predicate: Predicate | null = null,
    object: Object | null = null,
  ): Triple[] {
    const results: Triple[] = [];

    if (subject && predicate && object) {
      // Exact match
      for (const triple of this.triples) {
        if (
          triple.getSubject().toString() === subject.toString() &&
          triple.getPredicate().toString() === predicate.toString() &&
          triple.getObject().toString() === object.toString()
        ) {
          results.push(triple);
        }
      }
    } else if (subject && predicate) {
      // S P ?
      const objects = this.spo
        .get(subject.toString())
        ?.get(predicate.toString());
      if (objects) {
        for (const triple of this.triples) {
          if (
            triple.getSubject().toString() === subject.toString() &&
            triple.getPredicate().toString() === predicate.toString()
          ) {
            results.push(triple);
          }
        }
      }
    } else if (predicate && object) {
      // ? P O
      const subjects = this.pos
        .get(predicate.toString())
        ?.get(object.toString());
      if (subjects) {
        for (const triple of this.triples) {
          if (
            triple.getPredicate().toString() === predicate.toString() &&
            triple.getObject().toString() === object.toString()
          ) {
            results.push(triple);
          }
        }
      }
    } else if (subject && object) {
      // S ? O
      const predicates = this.osp
        .get(object.toString())
        ?.get(subject.toString());
      if (predicates) {
        for (const triple of this.triples) {
          if (
            triple.getSubject().toString() === subject.toString() &&
            triple.getObject().toString() === object.toString()
          ) {
            results.push(triple);
          }
        }
      }
    } else if (subject) {
      // S ? ?
      for (const triple of this.triples) {
        if (triple.getSubject().toString() === subject.toString()) {
          results.push(triple);
        }
      }
    } else if (predicate) {
      // ? P ?
      for (const triple of this.triples) {
        if (triple.getPredicate().toString() === predicate.toString()) {
          results.push(triple);
        }
      }
    } else if (object) {
      // ? ? O
      for (const triple of this.triples) {
        if (triple.getObject().toString() === object.toString()) {
          results.push(triple);
        }
      }
    } else {
      // ? ? ? - return all
      return Array.from(this.triples);
    }

    return results;
  }

  /**
   * Get all subjects in the graph
   */
  subjects(): Set<Subject> {
    const subjects = new Set<Subject>();
    for (const triple of this.triples) {
      subjects.add(triple.getSubject());
    }
    return subjects;
  }

  /**
   * Get all predicates in the graph
   */
  predicates(): Set<Predicate> {
    const predicates = new Set<Predicate>();
    for (const triple of this.triples) {
      predicates.add(triple.getPredicate());
    }
    return predicates;
  }

  /**
   * Get all objects in the graph
   */
  objects(): Set<Object> {
    const objects = new Set<Object>();
    for (const triple of this.triples) {
      objects.add(triple.getObject());
    }
    return objects;
  }

  /**
   * Get the size of the graph (number of triples)
   */
  size(): number {
    return this.triples.size;
  }

  /**
   * Check if the graph is empty
   */
  isEmpty(): boolean {
    return this.triples.size === 0;
  }

  /**
   * Clear all triples from the graph
   */
  clear(): void {
    this.triples.clear();
    this.spo.clear();
    this.pos.clear();
    this.osp.clear();
  }

  /**
   * Merge another graph into this one
   */
  merge(other: Graph): void {
    for (const triple of other.toArray()) {
      this.add(triple);
    }
  }

  /**
   * Create a new graph with triples matching a pattern
   */
  filter(
    subject: Subject | null = null,
    predicate: Predicate | null = null,
    object: Object | null = null,
  ): Graph {
    return new Graph(this.match(subject, predicate, object));
  }

  /**
   * Convert the graph to an array of triples
   */
  toArray(): Triple[] {
    return Array.from(this.triples);
  }

  /**
   * Create a human-readable string representation
   */
  toString(): string {
    return Array.from(this.triples)
      .map((t) => t.toString())
      .join("\n");
  }

  /**
   * Create a copy of this graph
   */
  clone(): Graph {
    return new Graph(this.toArray());
  }

  /**
   * Check if two graphs are equal
   */
  equals(other: Graph): boolean {
    if (this.size() !== other.size()) return false;

    for (const triple of this.triples) {
      if (!other.has(triple)) return false;
    }

    return true;
  }
}
