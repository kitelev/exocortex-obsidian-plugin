import { Asset } from "../../domain/entities/Asset";
import { AssetId } from "../../domain/value-objects/AssetId";
import { ClassName } from "../../domain/value-objects/ClassName";
import { OntologyPrefix } from "../../domain/value-objects/OntologyPrefix";
import { IAssetRepository } from "../../domain/repositories/IAssetRepository";
import { IOntologyRepository } from "../../domain/repositories/IOntologyRepository";
import { OntologyProvisioningService } from "../../domain/services/OntologyProvisioningService";
import { Result } from "../../domain/core/Result";

/**
 * Use case for creating a new asset
 * Orchestrates the asset creation process
 */
export class CreateAssetUseCase {
  constructor(
    private readonly assetRepository: IAssetRepository,
    private readonly ontologyRepository: IOntologyRepository,
    private readonly ontologyProvisioningService: OntologyProvisioningService,
  ) {}

  async execute(request: CreateAssetRequest): Promise<CreateAssetResponse> {
    try {
      // Validate the request
      const validationResult = this.validateRequest(request);
      if (!validationResult.isSuccess) {
        return {
          success: false,
          assetId: "",
          message: validationResult.getError(),
          error: validationResult.getError(),
        };
      }

      // Ensure ontology exists (auto-provision if needed)
      await this.ontologyProvisioningService.ensureOntologyExists(
        request.ontologyPrefix,
      );

      // Create ontology prefix
      const ontologyPrefixResult = OntologyPrefix.create(
        request.ontologyPrefix,
      );
      if (ontologyPrefixResult.isFailure) {
        return {
          success: false,
          assetId: "",
          message: `Invalid ontology prefix: ${ontologyPrefixResult.error}`,
          error: ontologyPrefixResult.error,
        };
      }
      const ontologyPrefix = ontologyPrefixResult.getValue();

      // Create class name
      const classNameResult = ClassName.create(request.className);
      if (!classNameResult.isSuccess) {
        return {
          success: false,
          assetId: "",
          message: `Invalid class name: ${classNameResult.getError()}`,
          error: classNameResult.getError(),
        };
      }
      const className = classNameResult.getValue()!;

      // Create the asset
      const assetResult = Asset.create({
        id: AssetId.generate(),
        label: request.title,
        className: className,
        ontology: ontologyPrefix,
        properties: request.properties || {},
      });

      if (!assetResult.isSuccess) {
        return {
          success: false,
          assetId: "",
          message: `Asset creation failed: ${assetResult.getError()}`,
          error: assetResult.getError(),
        };
      }
      const asset = assetResult.getValue()!;

      // Save the asset
      await this.assetRepository.save(asset);

      return {
        success: true,
        assetId: asset.getId().toString(),
        message: `Created asset: ${asset.getTitle()}`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        assetId: "",
        message: `Unexpected error: ${errorMessage}`,
        error: errorMessage,
      };
    }
  }

  private validateRequest(request: CreateAssetRequest): Result<void> {
    if (!request.title || request.title.trim().length === 0) {
      return Result.fail<void>("Asset title is required");
    }

    if (request.title.length > 200) {
      return Result.fail<void>("Asset title cannot exceed 200 characters");
    }

    if (!request.className) {
      return Result.fail<void>("Asset class is required");
    }

    if (!request.ontologyPrefix) {
      return Result.fail<void>("Ontology prefix is required");
    }

    if (request.ontologyPrefix.trim().length === 0) {
      return Result.fail<void>("Ontology prefix cannot be empty");
    }

    return Result.ok<void>();
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
  error?: string;
}
