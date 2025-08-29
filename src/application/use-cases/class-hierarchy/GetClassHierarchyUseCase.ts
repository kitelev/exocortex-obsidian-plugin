/**
 * GetClassHierarchyUseCase - Retrieves the complete class hierarchy for a given class
 *
 * Business Logic:
 * - Recursively builds parent class chain
 * - Handles circular reference detection
 * - Maintains visited set for cycle prevention
 * - Returns ordered hierarchy from most specific to most general
 */

import { UseCase } from "../../core/UseCase";
import { Result } from "../../../domain/core/Result";
import { IVaultAdapter } from "../../ports/IVaultAdapter";
import { IClassLayoutRepository } from "../../../domain/repositories/IClassLayoutRepository";

export interface GetClassHierarchyRequest {
  className: string;
  maxDepth?: number;
}

export interface GetClassHierarchyResponse {
  hierarchy: string[];
  hasCircularReference: boolean;
}

export class GetClassHierarchyUseCase
  implements UseCase<GetClassHierarchyRequest, GetClassHierarchyResponse>
{
  private static readonly DEFAULT_MAX_DEPTH = 20;

  constructor(
    private vaultAdapter: IVaultAdapter,
    private classLayoutRepository: IClassLayoutRepository,
  ) {}

  async execute(
    request: GetClassHierarchyRequest,
  ): Promise<Result<GetClassHierarchyResponse>> {
    try {
      const {
        className,
        maxDepth = GetClassHierarchyUseCase.DEFAULT_MAX_DEPTH,
      } = request;

      const hierarchy: string[] = [];
      const visited = new Set<string>();
      let hasCircularReference = false;

      // Build hierarchy recursively
      const buildHierarchy = async (
        currentClass: string,
        depth: number,
      ): Promise<void> => {
        // Prevent infinite recursion
        if (depth > maxDepth) {
          hasCircularReference = true;
          return;
        }

        // Check for circular reference
        if (visited.has(currentClass)) {
          hasCircularReference = true;
          return;
        }

        visited.add(currentClass);
        hierarchy.push(currentClass);

        // Clean class name for file search
        const cleanClassName = this.cleanClassName(currentClass);

        // Find class definition file
        const classFile = await this.findClassDefinitionFile(cleanClassName);
        if (!classFile) {
          return;
        }

        // Get parent classes from metadata
        const metadata = await this.vaultAdapter.getFileMetadata(classFile);
        if (!metadata || !metadata.frontmatter) {
          return;
        }

        const parentClasses = this.extractParentClasses(metadata.frontmatter);

        // Process each parent class
        for (const parentClass of parentClasses) {
          if (!visited.has(parentClass)) {
            await buildHierarchy(parentClass, depth + 1);
          }
        }
      };

      await buildHierarchy(className, 0);

      return Result.ok({
        hierarchy,
        hasCircularReference,
      });
    } catch (error) {
      return Result.fail(`Failed to get class hierarchy: ${error.message}`);
    }
  }

  /**
   * Clean class name by removing wiki links and prefixes
   */
  private cleanClassName(className: string): string {
    return className
      .replace(/\[\[/g, "")
      .replace(/\]\]/g, "")
      .replace(/^.*__/, ""); // Remove prefix like 'exo__'
  }

  /**
   * Find the file that defines a class
   */
  private async findClassDefinitionFile(
    className: string,
  ): Promise<any | null> {
    const files = await this.vaultAdapter.getFiles();

    // Look for exact match first
    for (const file of files) {
      if (file.basename === className) {
        const metadata = await this.vaultAdapter.getFileMetadata(file);
        if (this.isClassDefinition(metadata)) {
          return file;
        }
      }
    }

    // Look for class with prefix
    for (const file of files) {
      if (file.basename.endsWith(`__${className}`)) {
        const metadata = await this.vaultAdapter.getFileMetadata(file);
        if (this.isClassDefinition(metadata)) {
          return file;
        }
      }
    }

    // Look for class in metadata
    for (const file of files) {
      const metadata = await this.vaultAdapter.getFileMetadata(file);
      if (metadata && metadata.frontmatter) {
        const instanceClass = metadata.frontmatter["exo__Instance_class"];
        if (instanceClass) {
          const classes = Array.isArray(instanceClass)
            ? instanceClass
            : [instanceClass];
          if (classes.some((c) => this.cleanClassName(c) === className)) {
            return file;
          }
        }
      }
    }

    return null;
  }

  /**
   * Check if metadata represents a class definition
   */
  private isClassDefinition(metadata: any): boolean {
    if (!metadata || !metadata.frontmatter) {
      return false;
    }

    const fm = metadata.frontmatter;
    return !!(
      fm["exo__Class_superClass"] ||  // Primary property used in vault
      fm["exo__Class_subClassOf"] ||  // Backward compatibility
      fm["rdfs__subClassOf"] ||
      fm["owl__Class"] ||
      (fm["rdf__type"] && fm["rdf__type"].includes("Class"))
    );
  }

  /**
   * Extract parent classes from frontmatter
   */
  private extractParentClasses(frontmatter: any): string[] {
    const parents: string[] = [];

    // Check various parent class properties
    const parentProperties = [
      "exo__Class_superClass",  // Updated from exo__Class_subClassOf to match vault naming
      "exo__Class_subClassOf",  // Keep for backward compatibility
      "rdfs__subClassOf",
      "subClassOf",
      "extends",
      "parent",
      "superClass",
    ];

    for (const prop of parentProperties) {
      const value = frontmatter[prop];
      if (value) {
        if (Array.isArray(value)) {
          parents.push(...value.map((v) => this.cleanClassName(v)));
        } else {
          parents.push(this.cleanClassName(value));
        }
      }
    }

    // Remove duplicates
    return [...new Set(parents)];
  }
}
