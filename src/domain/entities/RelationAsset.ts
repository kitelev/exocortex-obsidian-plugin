import { v4 as uuidv4 } from "uuid";

/**
 * Represents a relation between assets as a first-class entity
 * This enables Event Sourcing, versioning, and flexible access control
 */
export interface RelationAsset {
  uid: string;
  type: "adapter__Relation";
  subject: string; // Source Asset UID
  predicate: string; // Relation type (e.g., 'exo__Asset_relates', 'ems__Task_project')
  object: string; // Target Asset UID or value
  createdAt: Date;
  modifiedAt?: Date;
  isDefinedBy: string; // Ontology namespace
  confidence?: number; // 0.0 to 1.0
  provenance?: string; // How this relation was created
  inverseOf?: string; // UID of inverse relation
  metadata?: Record<string, any>;
}

/**
 * Represents N-ary relations (connecting more than 2 assets)
 */
export interface NaryRelationAsset extends Omit<RelationAsset, "type"> {
  type: "adapter__NaryRelation";
  participants: Array<{
    role: string;
    assetUid: string;
  }>;
}

/**
 * Relation types with their inverses
 */
export const RELATION_INVERSES: Record<string, string> = {
  exo__Asset_relates: "exo__Asset_relatedBy",
  ems__Task_project: "ems__Project_hasTasks",
  ems__Task_assignedTo: "ems__Person_assignedTasks",
  ems__Area_parent: "ems__Area_children",
  exo__subClassOf: "exo__superClassOf",
  ems__partOf: "ems__hasPart",
  ems__blocks: "ems__blockedBy",
  ems__dependsOn: "ems__requiredBy",
};

/**
 * Helper class for working with relations
 */
export class RelationAssetHelper {
  /**
   * Create a new relation asset
   */
  static create(params: {
    subject: string;
    predicate: string;
    object: string;
    ontology?: string;
    confidence?: number;
    provenance?: string;
  }): RelationAsset {
    return {
      uid: uuidv4(),
      type: "adapter__Relation",
      subject: params.subject,
      predicate: params.predicate,
      object: params.object,
      createdAt: new Date(),
      isDefinedBy: params.ontology || this.extractOntology(params.predicate),
      confidence: params.confidence,
      provenance: params.provenance || "manual",
    };
  }

  /**
   * Create bidirectional relation (returns both relation and its inverse)
   */
  static createBidirectional(params: {
    subject: string;
    predicate: string;
    object: string;
    ontology?: string;
  }): [RelationAsset, RelationAsset] {
    const forward = this.create(params);

    const inversePredicate = this.getInversePredicate(params.predicate);
    const inverse = this.create({
      subject: params.object,
      predicate: inversePredicate,
      object: params.subject,
      ontology: params.ontology,
      provenance: `inverse of ${forward.uid}`,
    });

    forward.inverseOf = inverse.uid;
    inverse.inverseOf = forward.uid;

    return [forward, inverse];
  }

  /**
   * Get inverse predicate name
   */
  static getInversePredicate(predicate: string): string {
    // Check known inverses
    if (RELATION_INVERSES[predicate]) {
      return RELATION_INVERSES[predicate];
    }

    // Check reverse mapping
    for (const [key, value] of Object.entries(RELATION_INVERSES)) {
      if (value === predicate) {
        return key;
      }
    }

    // Generate inverse name
    if (predicate.includes("__")) {
      const parts = predicate.split("__");
      return `${parts[0]}__inverseOf_${parts[1]}`;
    }

    return `inverseOf_${predicate}`;
  }

  /**
   * Extract ontology namespace from predicate
   */
  static extractOntology(predicate: string): string {
    if (predicate.includes("__")) {
      return predicate.split("__")[0];
    }
    if (predicate.includes(":")) {
      return predicate.split(":")[0];
    }
    return "exo";
  }

  /**
   * Convert relation to markdown frontmatter
   */
  static toFrontmatter(relation: RelationAsset): Record<string, any> {
    return {
      exo__Instance_class: "[[adapter__Relation]]",
      exo__Asset_uid: relation.uid,
      adapter__Relation_subject: `[[${relation.subject}]]`,
      adapter__Relation_predicate: relation.predicate,
      adapter__Relation_object: `[[${relation.object}]]`,
      exo__Asset_createdAt: relation.createdAt.toISOString(),
      exo__Asset_isDefinedBy: `[[${relation.isDefinedBy}]]`,
      adapter__Relation_confidence: relation.confidence || 1.0,
      adapter__Relation_provenance: relation.provenance,
      adapter__Relation_inverseOf: relation.inverseOf,
    };
  }

  /**
   * Generate filename for relation asset
   */
  static generateFilename(relation: RelationAsset): string {
    const subjectName = relation.subject
      .replace(/[^\w-]/g, "_")
      .substring(0, 20);
    const predicateName = relation.predicate.replace(/[^\w-]/g, "_");
    const objectName = relation.object.replace(/[^\w-]/g, "_").substring(0, 20);
    const timestamp = relation.createdAt.getTime();

    return `Relation_${subjectName}_${predicateName}_${objectName}_${timestamp}.md`;
  }
}
