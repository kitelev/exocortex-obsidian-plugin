import { Asset } from "../../domain/entities/Asset";
import { AssetId } from "../../domain/value-objects/AssetId";
import { ClassName } from "../../domain/value-objects/ClassName";
import { IAssetRepository } from "../../domain/repositories/IAssetRepository";
import { CreateAssetUseCase } from "./CreateAssetUseCase";
import { Result } from "../../domain/core/Result";

export class CreateChildAreaUseCase {
  constructor(
    private readonly assetRepository: IAssetRepository,
    private readonly createAssetUseCase: CreateAssetUseCase,
  ) {}

  async execute(
    request: CreateChildAreaRequest,
  ): Promise<CreateChildAreaResponse> {
    try {
      const parentIdResult = AssetId.create(request.parentAreaId);
      if (parentIdResult.isFailure) {
        return {
          success: false,
          message: `Invalid parent area ID: ${parentIdResult.error}`,
        };
      }

      const parentAsset = await this.assetRepository.findById(
        parentIdResult.getValue(),
      );
      if (!parentAsset) {
        return {
          success: false,
          message: "Parent area not found",
        };
      }

      const parentClassName = parentAsset.getClassName();
      if (!parentClassName.equals(ClassName.create("ems__Area").getValue())) {
        return {
          success: false,
          message: "Parent asset is not an area",
        };
      }

      const areaId = AssetId.generate();
      const areaProperties = this.generateAreaProperties(
        parentAsset,
        areaId,
        request.areaTitle,
      );

      const createResult = await this.createAssetUseCase.execute({
        title:
          request.areaTitle || `Area - ${areaId.toString().substring(0, 8)}`,
        className: "ems__Area",
        ontologyPrefix: parentAsset.getOntologyPrefix().toString(),
        properties: areaProperties,
      });

      if (!createResult.success) {
        return {
          success: false,
          message: createResult.message,
        };
      }

      return {
        success: true,
        areaId: createResult.assetId,
        areaFilePath: `${createResult.assetId}.md`,
        message: `Child area created successfully under "${parentAsset.getTitle()}"`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create child area: ${error.message}`,
      };
    }
  }

  private generateAreaProperties(
    parentArea: Asset,
    areaId: AssetId,
    areaTitle?: string,
  ): Record<string, any> {
    const now = new Date().toISOString().replace(/\.\d{3}Z$/, "");
    const title = areaTitle || `Area - ${areaId.toString().substring(0, 8)}`;

    return {
      exo__Asset_uid: areaId.toString(),
      exo__Asset_label: title,
      exo__Asset_isDefinedBy: `[[!${parentArea.getOntologyPrefix().toString()}]]`,
      exo__Asset_createdAt: now,
      exo__Instance_class: ["[[ems__Area]]"],
      ems__Area_parent: `[[${parentArea.getTitle()}]]`,
      ems__Area_status: "Active",
    };
  }
}

export interface CreateChildAreaRequest {
  parentAreaId: string;
  areaTitle?: string;
  context?: {
    activeFile?: string;
    selection?: string;
  };
}

export interface CreateChildAreaResponse {
  success: boolean;
  areaId?: string;
  areaFilePath?: string;
  message: string;
}
