import { Asset } from "../../domain/entities/Asset";
import { AssetId } from "../../domain/value-objects/AssetId";
import { ClassName } from "../../domain/value-objects/ClassName";
import { OntologyPrefix } from "../../domain/value-objects/OntologyPrefix";
import { IAssetRepository } from "../../domain/repositories/IAssetRepository";
import { CreateAssetUseCase } from "./CreateAssetUseCase";
import { Result } from "../../domain/core/Result";

export class CreateChildTaskUseCase {
  constructor(
    private readonly assetRepository: IAssetRepository,
    private readonly createAssetUseCase: CreateAssetUseCase,
  ) {}

  async execute(
    request: CreateChildTaskRequest,
  ): Promise<CreateChildTaskResponse> {
    try {
      const projectIdResult = AssetId.create(request.projectAssetId);
      if (projectIdResult.isFailure) {
        return {
          success: false,
          message: `Invalid project ID: ${projectIdResult.error}`,
        };
      }

      const projectAsset = await this.assetRepository.findById(
        projectIdResult.getValue(),
      );
      if (!projectAsset) {
        return {
          success: false,
          message: "Project not found",
        };
      }

      const projectClassName = projectAsset.getClassName();
      if (
        !projectClassName.equals(ClassName.create("ems__Project").getValue())
      ) {
        return {
          success: false,
          message: "Asset is not a project",
        };
      }

      const taskId = AssetId.generate();
      const taskProperties = this.generateTaskProperties(projectAsset, taskId);

      const createResult = await this.createAssetUseCase.execute({
        title: taskId.toString(),
        className: "ems__Task",
        ontologyPrefix: projectAsset.getOntologyPrefix().toString(),
        properties: taskProperties,
      });

      if (!createResult.success) {
        return {
          success: false,
          message: createResult.message,
        };
      }

      return {
        success: true,
        taskId: createResult.assetId,
        taskFilePath: `${createResult.assetId}.md`,
        message: `Task created successfully for project "${projectAsset.getTitle()}"`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create task: ${error.message}`,
      };
    }
  }

  private generateTaskProperties(
    parentProject: Asset,
    taskId: AssetId,
  ): Record<string, any> {
    return {
      exo__Asset_uid: taskId.toString(),
      exo__Asset_label: `Task for ${parentProject.getTitle()}`,
      exo__Asset_isDefinedBy: `[[!${parentProject.getOntologyPrefix().toString()}]]`,
      exo__Asset_createdAt: new Date().toISOString().replace(/\.\d{3}Z$/, ""),
      exo__Instance_class: ["[[ems__Task]]"],
      exo__Effort_parent: `[[${parentProject.getTitle()}]]`,
      ems__Task_status: "[[ems__TaskStatus - TODO]]",
      ems__Task_priority: "[[ems__Priority - Medium]]",
      ems__Task_project: `[[${parentProject.getTitle()}]]`,
    };
  }
}

export interface CreateChildTaskRequest {
  projectAssetId: string;
  context?: {
    activeFile?: string;
    selection?: string;
  };
}

export interface CreateChildTaskResponse {
  success: boolean;
  taskId?: string;
  taskFilePath?: string;
  message: string;
}
