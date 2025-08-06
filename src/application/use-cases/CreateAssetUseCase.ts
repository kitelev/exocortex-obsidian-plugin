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
    const ontologyPrefixResult = OntologyPrefix.create(request.ontologyPrefix);
    if (ontologyPrefixResult.isFailure) {
      throw new Error(ontologyPrefixResult.error);
    }
    const ontologyPrefix = ontologyPrefixResult.getValue();
    
    const ontology = await this.ontologyRepository.findByPrefix(ontologyPrefix);
    if (!ontology) {
      throw new Error(`Ontology ${request.ontologyPrefix} not found`);
    }

    // Create class name
    const classNameResult = ClassName.create(request.className);
    if (classNameResult.isFailure) {
      throw new Error(classNameResult.error);
    }
    const className = classNameResult.getValue();

    // Create the asset
    const assetResult = Asset.create({
      id: AssetId.generate(),
      label: request.title,
      className: className,
      ontology: ontologyPrefix,
      properties: request.properties || {}
    });
    
    if (assetResult.isFailure) {
      throw new Error(assetResult.error);
    }
    const asset = assetResult.getValue();

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