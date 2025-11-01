import { Triple, Subject, Predicate, Object as RDFObject } from "../domain/models/rdf/Triple";

export interface ITripleStore {
  add(triple: Triple): Promise<void>;

  remove(triple: Triple): Promise<boolean>;

  has(triple: Triple): Promise<boolean>;

  match(
    subject?: Subject,
    predicate?: Predicate,
    object?: RDFObject
  ): Promise<Triple[]>;

  addAll(triples: Triple[]): Promise<void>;

  removeAll(triples: Triple[]): Promise<number>;

  clear(): Promise<void>;

  count(): Promise<number>;

  subjects(): Promise<Subject[]>;

  predicates(): Promise<Predicate[]>;

  objects(): Promise<RDFObject[]>;

  beginTransaction(): Promise<ITransaction>;
}

export interface ITransaction {
  add(triple: Triple): Promise<void>;

  remove(triple: Triple): Promise<boolean>;

  commit(): Promise<void>;

  rollback(): Promise<void>;
}

export class TripleAlreadyExistsError extends Error {
  constructor(triple: Triple) {
    super(`Triple already exists: ${triple.toString()}`);
    this.name = "TripleAlreadyExistsError";
  }
}

export class TripleNotFoundError extends Error {
  constructor(triple: Triple) {
    super(`Triple not found: ${triple.toString()}`);
    this.name = "TripleNotFoundError";
  }
}

export class TransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransactionError";
  }
}
