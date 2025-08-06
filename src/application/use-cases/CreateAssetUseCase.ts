import { Asset } from '../../domain/entities/Asset';
import { AssetId } from '../../domain/value-objects/AssetId';
import { ClassName } from '../../domain/value-objects/ClassName';
import { OntologyPrefix } from '../../domain/value-objects/OntologyPrefix';
import { IAssetRepository } from '../../domain/repositories/IAssetRepository';
import { IOntologyRepository } from '../../domain/repositories/IOntologyRepository';

/**
 * Use case for creating a new asset
 * Orchestrates the asset creation process
 */
export class CreateAssetUseCase {
  constructor(
    private readonly assetRepository: IAssetRepository,
    private readonly ontologyRepository: IOntologyRepository
  ) {}

  async execute(request: CreateAssetRequest): Promise<CreateAssetResponse> {
    // Validate the request
    this.validateRequest(request);

    // Verify ontology exists
    const ontologyPrefix = new OntologyPrefix(request.ontologyPrefix);
    const ontology = await this.ontologyRepository.findByPrefix(ontologyPrefix);
    if (!ontology) {
      throw new Error(`Ontology ${request.ontologyPrefix} not found`);
    }

    // Create the asset
    const asset = new Asset({
      title: request.title,
      className: new ClassName(request.className),
      ontologyPrefix: ontologyPrefix,
      properties: new Map(Object.entries(request.properties || {}))
    });

    // Save the asset
    await this.assetRepository.save(asset);

    return {
      success: true,
      assetId: asset.getId().toString(),
      message: `Created asset: ${asset.getTitle()}`
    };
  }

  private validateRequest(request: CreateAssetRequest): void {
    if (!request.title || request.title.trim().length === 0) {
      throw new Error('Asset title is required');
    }

    if (!request.className) {
      throw new Error('Asset class is required');
    }

    if (!request.ontologyPrefix) {
      throw new Error('Ontology prefix is required');
    }
  }
}

export interface CreateAssetRequest {
  title: string;
  className: string;
  ontologyPrefix: string;
  properties?: Record<string, any>;
}

export interface CreateAssetResponse {
  success: boolean;
  assetId: string;
  message: string;
}