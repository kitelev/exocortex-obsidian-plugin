import {
  ITripleStore,
  ITransaction,
  TransactionError,
} from "../../interfaces/ITripleStore";
import { Triple, Subject, Predicate, Object as RDFObject } from "../../domain/models/rdf/Triple";
import { IRI } from "../../domain/models/rdf/IRI";
import { BlankNode } from "../../domain/models/rdf/BlankNode";
import { Literal } from "../../domain/models/rdf/Literal";
import { Namespace } from "../../domain/models/rdf/Namespace";
import { LRUCache } from "./LRUCache";

/** XSD string datatype URI for RDF 1.1 compatibility */
const XSD_STRING = Namespace.XSD.term("string").value;

type TripleKey = string;
type NodeKey = string;

/** UUID pattern regex for standard UUID v4 format */
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

export class InMemoryTripleStore implements ITripleStore {
  private triples: Map<TripleKey, Triple> = new Map();
  private spo: Map<NodeKey, Map<NodeKey, Set<NodeKey>>> = new Map();
  private sop: Map<NodeKey, Map<NodeKey, Set<NodeKey>>> = new Map();
  private pso: Map<NodeKey, Map<NodeKey, Set<NodeKey>>> = new Map();
  private pos: Map<NodeKey, Map<NodeKey, Set<NodeKey>>> = new Map();
  private osp: Map<NodeKey, Map<NodeKey, Set<NodeKey>>> = new Map();
  private ops: Map<NodeKey, Map<NodeKey, Set<NodeKey>>> = new Map();
  private queryCache: LRUCache<string, Triple[]> = new LRUCache(1000);

  /**
   * UUID index: maps lowercase UUID strings to sets of subject IRIs.
   * Enables O(1) lookup for FILTER(CONTAINS(STR(?s), 'uuid')) patterns.
   */
  private uuidIndex: Map<string, Set<string>> = new Map();

  async add(triple: Triple): Promise<void> {
    const key = this.getTripleKey(triple);

    if (this.triples.has(key)) {
      return;
    }

    this.triples.set(key, triple);

    const s = this.getNodeKey(triple.subject);
    const p = this.getNodeKey(triple.predicate);
    const o = this.getNodeKey(triple.object);

    this.addToIndex(this.spo, s, p, o);
    this.addToIndex(this.sop, s, o, p);
    this.addToIndex(this.pso, p, s, o);
    this.addToIndex(this.pos, p, o, s);
    this.addToIndex(this.osp, o, s, p);
    this.addToIndex(this.ops, o, p, s);

    // Update UUID index for subject IRIs
    this.addToUUIDIndex(triple.subject);

    this.queryCache.clear();
  }

  async remove(triple: Triple): Promise<boolean> {
    const key = this.getTripleKey(triple);

    if (!this.triples.has(key)) {
      return false;
    }

    this.triples.delete(key);

    const s = this.getNodeKey(triple.subject);
    const p = this.getNodeKey(triple.predicate);
    const o = this.getNodeKey(triple.object);

    this.removeFromIndex(this.spo, s, p, o);
    this.removeFromIndex(this.sop, s, o, p);
    this.removeFromIndex(this.pso, p, s, o);
    this.removeFromIndex(this.pos, p, o, s);
    this.removeFromIndex(this.osp, o, s, p);
    this.removeFromIndex(this.ops, o, p, s);

    // Update UUID index - note: we don't remove from UUID index since
    // the same subject might be referenced in other triples
    // The index is rebuilt lazily if needed

    this.queryCache.clear();

    return true;
  }

  async has(triple: Triple): Promise<boolean> {
    const key = this.getTripleKey(triple);
    return this.triples.has(key);
  }

  async match(
    subject?: Subject,
    predicate?: Predicate,
    object?: RDFObject
  ): Promise<Triple[]> {
    const cacheKey = this.getMatchCacheKey(subject, predicate, object);
    const cached = this.queryCache.get(cacheKey);

    if (cached !== undefined) {
      return cached;
    }

    let results: Triple[];

    if (!subject && !predicate && !object) {
      results = Array.from(this.triples.values());
    } else if (subject && predicate && object) {
      results = this.matchSPO(subject, predicate, object);
    } else if (subject && predicate) {
      results = this.matchSP(subject, predicate);
    } else if (subject && object) {
      results = this.matchSO(subject, object);
    } else if (predicate && object) {
      results = this.matchPO(predicate, object);
    } else if (subject) {
      results = this.matchS(subject);
    } else if (predicate) {
      results = this.matchP(predicate);
    } else if (object) {
      results = this.matchO(object);
    } else {
      results = [];
    }

    this.queryCache.set(cacheKey, results);
    return results;
  }

  async addAll(triples: Triple[]): Promise<void> {
    for (const triple of triples) {
      await this.add(triple);
    }
  }

  async removeAll(triples: Triple[]): Promise<number> {
    let count = 0;
    for (const triple of triples) {
      if (await this.remove(triple)) {
        count++;
      }
    }
    return count;
  }

  async clear(): Promise<void> {
    this.triples.clear();
    this.spo.clear();
    this.sop.clear();
    this.pso.clear();
    this.pos.clear();
    this.osp.clear();
    this.ops.clear();
    this.uuidIndex.clear();
    this.queryCache.clear();
  }

  async count(): Promise<number> {
    return this.triples.size;
  }

  async subjects(): Promise<Subject[]> {
    const subjects = new Set<Subject>();
    for (const triple of this.triples.values()) {
      subjects.add(triple.subject);
    }
    return Array.from(subjects);
  }

  async predicates(): Promise<Predicate[]> {
    const predicates = new Set<Predicate>();
    for (const triple of this.triples.values()) {
      predicates.add(triple.predicate);
    }
    return Array.from(predicates);
  }

  async objects(): Promise<RDFObject[]> {
    const objects = new Set<RDFObject>();
    for (const triple of this.triples.values()) {
      objects.add(triple.object);
    }
    return Array.from(objects);
  }

  async beginTransaction(): Promise<ITransaction> {
    return new InMemoryTransaction(this);
  }

  /**
   * Find subjects containing a specific UUID.
   * This is an optimization for FILTER(CONTAINS(STR(?s), 'uuid')) patterns.
   * Uses the UUID index for O(1) lookup instead of O(n) scan.
   *
   * @param uuid - The UUID string to search for (case-insensitive)
   * @returns Array of subjects whose URI contains the UUID
   */
  async findSubjectsByUUID(uuid: string): Promise<Subject[]> {
    const normalizedUUID = uuid.toLowerCase();
    const subjectUris = this.uuidIndex.get(normalizedUUID);

    if (!subjectUris || subjectUris.size === 0) {
      return [];
    }

    // Convert URIs back to IRI objects, but only include ones that still exist
    const results: Subject[] = [];
    for (const uri of subjectUris) {
      // Check if this subject still exists in the store
      if (this.spo.has(`i:${uri}`)) {
        results.push(new IRI(uri));
      }
    }

    return results;
  }

  /**
   * Add a subject to the UUID index if it's an IRI containing UUIDs.
   */
  private addToUUIDIndex(subject: Subject): void {
    if (!(subject instanceof IRI)) {
      return;
    }

    const uri = subject.value;
    // Find all UUIDs in the URI
    const matches = uri.match(UUID_PATTERN);
    if (!matches) {
      return;
    }

    for (const match of matches) {
      const normalizedUUID = match.toLowerCase();
      if (!this.uuidIndex.has(normalizedUUID)) {
        this.uuidIndex.set(normalizedUUID, new Set());
      }
      this.uuidIndex.get(normalizedUUID)!.add(uri);
    }
  }

  private matchSPO(s: Subject, p: Predicate, o: RDFObject): Triple[] {
    const sKey = this.getNodeKey(s);
    const pKey = this.getNodeKey(p);
    const oKey = this.getNodeKey(o);

    const pMap = this.spo.get(sKey);
    if (!pMap) return [];

    const oSet = pMap.get(pKey);
    if (!oSet) return [];

    if (oSet.has(oKey)) {
      const tripleKey = this.buildTripleKey(sKey, pKey, oKey);
      const triple = this.triples.get(tripleKey);
      return triple ? [triple] : [];
    }

    return [];
  }

  private matchSP(s: Subject, p: Predicate): Triple[] {
    const sKey = this.getNodeKey(s);
    const pKey = this.getNodeKey(p);

    const pMap = this.spo.get(sKey);
    if (!pMap) return [];

    const oSet = pMap.get(pKey);
    if (!oSet) return [];

    return this.getTriplesByKeys(Array.from(oSet).map((o) => this.buildTripleKey(sKey, pKey, o)));
  }

  private matchSO(s: Subject, o: RDFObject): Triple[] {
    const sKey = this.getNodeKey(s);
    const oKey = this.getNodeKey(o);

    const oMap = this.sop.get(sKey);
    if (!oMap) return [];

    const pSet = oMap.get(oKey);
    if (!pSet) return [];

    return this.getTriplesByKeys(Array.from(pSet).map((p) => this.buildTripleKey(sKey, p, oKey)));
  }

  private matchPO(p: Predicate, o: RDFObject): Triple[] {
    const pKey = this.getNodeKey(p);
    const oKey = this.getNodeKey(o);

    const oMap = this.pos.get(pKey);
    if (!oMap) return [];

    const sSet = oMap.get(oKey);
    if (!sSet) return [];

    return this.getTriplesByKeys(Array.from(sSet).map((s) => this.buildTripleKey(s, pKey, oKey)));
  }

  private matchS(s: Subject): Triple[] {
    const sKey = this.getNodeKey(s);
    const pMap = this.spo.get(sKey);
    if (!pMap) return [];

    const keys: TripleKey[] = [];
    for (const [p, oSet] of pMap.entries()) {
      for (const o of oSet) {
        keys.push(this.buildTripleKey(sKey, p, o));
      }
    }

    return this.getTriplesByKeys(keys);
  }

  private matchP(p: Predicate): Triple[] {
    const pKey = this.getNodeKey(p);
    const sMap = this.pso.get(pKey);
    if (!sMap) return [];

    const keys: TripleKey[] = [];
    for (const [s, oSet] of sMap.entries()) {
      for (const o of oSet) {
        keys.push(this.buildTripleKey(s, pKey, o));
      }
    }

    return this.getTriplesByKeys(keys);
  }

  private matchO(o: RDFObject): Triple[] {
    const oKey = this.getNodeKey(o);
    const sMap = this.osp.get(oKey);
    if (!sMap) return [];

    const keys: TripleKey[] = [];
    for (const [s, pSet] of sMap.entries()) {
      for (const p of pSet) {
        keys.push(this.buildTripleKey(s, p, oKey));
      }
    }

    return this.getTriplesByKeys(keys);
  }

  private getTriplesByKeys(keys: TripleKey[]): Triple[] {
    const results: Triple[] = [];
    for (const key of keys) {
      const triple = this.triples.get(key);
      if (triple) {
        results.push(triple);
      }
    }
    return results;
  }

  private addToIndex(
    index: Map<NodeKey, Map<NodeKey, Set<NodeKey>>>,
    key1: NodeKey,
    key2: NodeKey,
    key3: NodeKey
  ): void {
    if (!index.has(key1)) {
      index.set(key1, new Map());
    }

    const map2 = index.get(key1)!;
    if (!map2.has(key2)) {
      map2.set(key2, new Set());
    }

    const set3 = map2.get(key2)!;
    set3.add(key3);
  }

  private removeFromIndex(
    index: Map<NodeKey, Map<NodeKey, Set<NodeKey>>>,
    key1: NodeKey,
    key2: NodeKey,
    key3: NodeKey
  ): void {
    const map2 = index.get(key1);
    if (!map2) return;

    const set3 = map2.get(key2);
    if (!set3) return;

    set3.delete(key3);

    if (set3.size === 0) {
      map2.delete(key2);
    }

    if (map2.size === 0) {
      index.delete(key1);
    }
  }

  private getTripleKey(triple: Triple): TripleKey {
    const s = this.getNodeKey(triple.subject);
    const p = this.getNodeKey(triple.predicate);
    const o = this.getNodeKey(triple.object);
    return this.buildTripleKey(s, p, o);
  }

  private buildTripleKey(s: NodeKey, p: NodeKey, o: NodeKey): TripleKey {
    return `${s}|${p}|${o}`;
  }

  private getNodeKey(node: Subject | Predicate | RDFObject): NodeKey {
    if (node instanceof IRI) {
      return `i:${node.value}`;
    } else if (node instanceof BlankNode) {
      return `b:${node.id}`;
    } else if (node instanceof Literal) {
      let key = `l:${node.value}`;
      // Per RDF 1.1 semantics, xsd:string typed literals are equivalent to
      // plain literals (simple literals). We normalize by omitting xsd:string
      // from the key to ensure consistent matching.
      // See: https://www.w3.org/TR/rdf11-concepts/#section-Graph-Literal
      if (node.datatype && node.datatype.value !== XSD_STRING) {
        key += `^^${node.datatype.value}`;
      } else if (node.language) {
        key += `@${node.language}`;
      }
      return key;
    }
    return "";
  }

  private getMatchCacheKey(
    subject?: Subject,
    predicate?: Predicate,
    object?: RDFObject
  ): string {
    const s = subject ? this.getNodeKey(subject) : "?";
    const p = predicate ? this.getNodeKey(predicate) : "?";
    const o = object ? this.getNodeKey(object) : "?";
    return `${s}|${p}|${o}`;
  }
}

class InMemoryTransaction implements ITransaction {
  private operations: Array<{ type: "add" | "remove"; triple: Triple }> = [];
  private committed = false;
  private rolledBack = false;

  constructor(private store: InMemoryTripleStore) {}

  async add(triple: Triple): Promise<void> {
    if (this.committed) {
      throw new TransactionError("Transaction already committed");
    }
    if (this.rolledBack) {
      throw new TransactionError("Transaction already rolled back");
    }

    this.operations.push({ type: "add", triple });
  }

  async remove(triple: Triple): Promise<boolean> {
    if (this.committed) {
      throw new TransactionError("Transaction already committed");
    }
    if (this.rolledBack) {
      throw new TransactionError("Transaction already rolled back");
    }

    this.operations.push({ type: "remove", triple });
    return true;
  }

  async commit(): Promise<void> {
    if (this.committed) {
      throw new TransactionError("Transaction already committed");
    }
    if (this.rolledBack) {
      throw new TransactionError("Transaction already rolled back");
    }

    for (const op of this.operations) {
      if (op.type === "add") {
        await this.store.add(op.triple);
      } else {
        await this.store.remove(op.triple);
      }
    }

    this.committed = true;
    this.operations = [];
  }

  async rollback(): Promise<void> {
    if (this.committed) {
      throw new TransactionError("Transaction already committed");
    }
    if (this.rolledBack) {
      throw new TransactionError("Transaction already rolled back");
    }

    this.operations = [];
    this.rolledBack = true;
  }
}
