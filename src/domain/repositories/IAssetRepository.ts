import { Asset } from "../entities/Asset";
import { AssetId } from "../value-objects/AssetId";
import { ClassName } from "../value-objects/ClassName";
import { OntologyPrefix } from "../value-objects/OntologyPrefix";

/**
 * Repository interface for Asset persistence
 * Domain layer interface - implementation in infrastructure
 */
export interface IAssetRepository {
  /**
   * Find an asset by its unique identifier
   */
  findById(id: AssetId): Promise<Asset | null>;

  /**
   * Find all assets of a specific class
   */
  findByClass(className: ClassName): Promise<Asset[]>;

  /**
   * Find all assets in an ontology
   */
  findByOntology(prefix: OntologyPrefix): Promise<Asset[]>;

  /**
   * Save or update an asset
   */
  save(asset: Asset): Promise<void>;

  /**
   * Delete an asset
   */
  delete(id: AssetId): Promise<void>;

  /**
   * Check if an asset exists
   */
  exists(id: AssetId): Promise<boolean>;

  /**
   * Find all assets
   */
  findAll(): Promise<Asset[]>;

  /**
   * Find asset by filename/path
   */
  findByFilename(filename: string): Promise<Asset | null>;
}
