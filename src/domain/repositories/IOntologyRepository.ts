import { Ontology } from '../entities/Ontology';
import { OntologyPrefix } from '../value-objects/OntologyPrefix';

/**
 * Repository interface for Ontology persistence
 * Domain layer interface - implementation in infrastructure
 */
export interface IOntologyRepository {
  /**
   * Find an ontology by its prefix
   */
  findByPrefix(prefix: OntologyPrefix): Promise<Ontology | null>;

  /**
   * Find all available ontologies
   */
  findAll(): Promise<Ontology[]>;

  /**
   * Save or update an ontology
   */
  save(ontology: Ontology): Promise<void>;

  /**
   * Check if an ontology exists
   */
  exists(prefix: OntologyPrefix): Promise<boolean>;
}