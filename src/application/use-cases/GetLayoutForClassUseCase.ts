import { IClassLayoutRepository } from "../../domain/repositories/IClassLayoutRepository";
import { ClassLayout } from "../../domain/entities/ClassLayout";
import { ClassName } from "../../domain/value-objects/ClassName";
import { Result } from "../../domain/core/Result";

export interface GetLayoutForClassRequest {
  className: string;
  includeDisabled?: boolean;
}

export interface GetLayoutForClassResponse {
  layout: ClassLayout | null;
  fallbackUsed: boolean;
}

export class GetLayoutForClassUseCase {
  constructor(private layoutRepository: IClassLayoutRepository) {}

  async execute(
    request: GetLayoutForClassRequest,
  ): Promise<Result<GetLayoutForClassResponse>> {
    try {
      // Validate class name
      const classNameResult = ClassName.create(request.className);
      if (classNameResult.isFailure) {
        return Result.fail<GetLayoutForClassResponse>(
          `Invalid class name: ${classNameResult.error}`,
        );
      }

      const className = classNameResult.getValue();

      // Find layouts for this class
      const layouts = request.includeDisabled
        ? await this.layoutRepository.findByClass(className)
        : await this.layoutRepository.findEnabledByClass(className);

      // Return highest priority layout if found
      if (layouts.length > 0) {
        return Result.ok<GetLayoutForClassResponse>({
          layout: layouts[0], // Already sorted by priority
          fallbackUsed: false,
        });
      }

      // Try to find parent class layouts (inheritance chain)
      const parentLayout = await this.findParentClassLayout(className);
      if (parentLayout) {
        return Result.ok<GetLayoutForClassResponse>({
          layout: parentLayout,
          fallbackUsed: true,
        });
      }

      // No layout found - will use default
      return Result.ok<GetLayoutForClassResponse>({
        layout: null,
        fallbackUsed: true,
      });
    } catch (error) {
      return Result.fail<GetLayoutForClassResponse>(
        `Failed to get layout for class: ${error}`,
      );
    }
  }

  private async findParentClassLayout(
    className: ClassName,
  ): Promise<ClassLayout | null> {
    // Check common parent classes
    const parentClasses = this.getParentClasses(className.value);

    for (const parentClass of parentClasses) {
      const parentClassName = ClassName.create(parentClass);
      if (parentClassName.isFailure) continue;

      const layouts = await this.layoutRepository.findEnabledByClass(
        parentClassName.getValue(),
      );

      if (layouts.length > 0) {
        return layouts[0];
      }
    }

    return null;
  }

  private getParentClasses(className: string): string[] {
    // Define inheritance hierarchy
    const hierarchy: Record<string, string[]> = {
      ems__Project: ["ems__Effort", "exo__Asset"],
      ems__Task: ["ems__Effort", "exo__Asset"],
      ems__Area: ["exo__Asset"],
      ems__Goal: ["exo__Asset"],
      ems__Effort: ["exo__Asset"],
    };

    return hierarchy[className] || ["exo__Asset"];
  }
}
