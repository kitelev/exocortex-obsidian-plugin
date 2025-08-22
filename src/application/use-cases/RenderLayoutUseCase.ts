import { Result } from "../../domain/core/Result";
import { ClassLayout } from "../../domain/entities/ClassLayout";
import { IClassLayoutRepository } from "../../domain/repositories/IClassLayoutRepository";
import {
  ILayoutRenderer,
  RenderContext,
  LayoutRenderResult,
} from "../../domain/ports/ILayoutRenderer";
import { IFileSystemPort } from "../../domain/ports/IFileSystemPort";
import { ClassName } from "../../domain/value-objects/ClassName";

export interface RenderLayoutRequest {
  readonly containerId: string;
  readonly assetPath: string;
  readonly className?: string;
  readonly useDefaultIfNotFound?: boolean;
}

export class RenderLayoutUseCase {
  constructor(
    private readonly layoutRepository: IClassLayoutRepository,
    private readonly layoutRenderer: ILayoutRenderer,
    private readonly fileSystemPort: IFileSystemPort,
  ) {}

  async execute(
    request: RenderLayoutRequest,
  ): Promise<Result<LayoutRenderResult>> {
    try {
      // Get file metadata
      const metadataResult = await this.fileSystemPort.getFileMetadata(
        request.assetPath,
      );
      if (metadataResult.isFailure) {
        return Result.fail(
          `Failed to read file metadata: ${metadataResult.error}`,
        );
      }

      const metadata = metadataResult.getValue();
      const frontmatter = metadata.frontmatter;

      // Determine class name
      const className =
        request.className || frontmatter["exo__Instance_class"] || "exo__Asset";

      // Create render context
      const context: RenderContext = {
        containerId: request.containerId,
        assetPath: request.assetPath,
        metadata: { frontmatter },
        frontmatter,
      };

      // Get layout for class
      const layout = await this.getLayoutForClass(className);

      // Render layout or default
      if (layout) {
        return await this.layoutRenderer.renderLayout(layout, context);
      } else if (request.useDefaultIfNotFound !== false) {
        return await this.layoutRenderer.renderDefaultLayout(context);
      } else {
        return Result.fail(
          "No layout found for class and default rendering disabled",
        );
      }
    } catch (error) {
      return Result.fail(`Failed to render layout: ${error}`);
    }
  }

  private async getLayoutForClass(
    className: string,
  ): Promise<ClassLayout | null> {
    const classNameResult = ClassName.create(className);
    if (classNameResult.isFailure) {
      return null;
    }

    const layouts = await this.layoutRepository.findEnabledByClass(
      classNameResult.getValue(),
    );
    return layouts.length > 0 ? layouts[0] : null;
  }
}
