/**
 * FindAllOntologiesUseCase - Discovers and manages all ontology definitions in the vault
 *
 * Business Logic:
 * - Scans vault for ontology definition files
 * - Validates ontology metadata structure
 * - Merges discovered ontologies with core defaults
 * - Handles template folder exclusions
 */

import { UseCase } from "../../core/UseCase";
import { Result } from "../../../domain/core/Result";
import { IVaultAdapter } from "../../ports/IVaultAdapter";
import { IOntologyRepository } from "../../../domain/repositories/IOntologyRepository";

export interface OntologyInfo {
  file: any | null;
  prefix: string;
  label: string;
  fileName: string;
}

export interface FindAllOntologiesRequest {
  includeDefaults?: boolean;
  excludeTemplates?: boolean;
}

export interface FindAllOntologiesResponse {
  ontologies: OntologyInfo[];
}

export class FindAllOntologiesUseCase
  implements UseCase<FindAllOntologiesRequest, FindAllOntologiesResponse>
{
  constructor(
    private vaultAdapter: IVaultAdapter,
    private ontologyRepository: IOntologyRepository,
  ) {}

  async execute(
    request: FindAllOntologiesRequest,
  ): Promise<Result<FindAllOntologiesResponse>> {
    try {
      const { includeDefaults = true, excludeTemplates = true } = request;

      const ontologies: OntologyInfo[] = [];

      // Get default/core ontologies if requested
      if (includeDefaults) {
        const coreOntologies = this.getCoreOntologies();
        ontologies.push(...coreOntologies);
      }

      // Scan vault for ontology files
      const files = await this.vaultAdapter.getFiles();

      for (const file of files) {
        // Skip template folders if configured
        if (excludeTemplates && this.isInTemplateFolder(file.path)) {
          continue;
        }

        // Check if file is an ontology definition
        const isOntology = await this.isOntologyFile(file);
        if (!isOntology) {
          continue;
        }

        // Extract ontology metadata
        const metadata = await this.vaultAdapter.getFileMetadata(file);
        if (!metadata || !metadata.frontmatter) {
          continue;
        }

        const ontologyInfo = this.extractOntologyInfo(
          file,
          metadata.frontmatter,
        );
        if (ontologyInfo) {
          // Check for duplicate prefix
          const existingIndex = ontologies.findIndex(
            (o) => o.prefix === ontologyInfo.prefix,
          );
          if (existingIndex >= 0) {
            // Replace default with discovered ontology
            if (ontologies[existingIndex].file === null) {
              ontologies[existingIndex] = ontologyInfo;
            }
          } else {
            ontologies.push(ontologyInfo);
          }
        }
      }

      // Sort ontologies by prefix
      ontologies.sort((a, b) => a.prefix.localeCompare(b.prefix));

      return Result.ok({ ontologies });
    } catch (error) {
      return Result.fail(`Failed to find ontologies: ${error.message}`);
    }
  }

  /**
   * Get core/default ontologies that are always available
   */
  private getCoreOntologies(): OntologyInfo[] {
    return [
      {
        file: null,
        prefix: "exo",
        label: "Exocortex Core",
        fileName: "core-ontology",
      },
      {
        file: null,
        prefix: "ems",
        label: "Effort Management System",
        fileName: "ems-ontology",
      },
      {
        file: null,
        prefix: "ims",
        label: "Information Management System",
        fileName: "ims-ontology",
      },
      {
        file: null,
        prefix: "ztlk",
        label: "Zettelkasten",
        fileName: "ztlk-ontology",
      },
    ];
  }

  /**
   * Check if a file is an ontology definition
   */
  private async isOntologyFile(file: any): Promise<boolean> {
    // Check file name pattern
    if (!file.basename.match(/ontology|onto|vocabulary|vocab/i)) {
      return false;
    }

    // Check for ontology markers in metadata
    const metadata = await this.vaultAdapter.getFileMetadata(file);
    if (!metadata || !metadata.frontmatter) {
      return false;
    }

    const fm = metadata.frontmatter;

    // Check for ontology-specific properties
    return !!(
      fm["exo__Ontology_prefix"] ||
      fm["exo__Ontology_namespace"] ||
      fm["ontology_prefix"] ||
      fm["rdf_type"] === "owl:Ontology" ||
      (fm["exo__Instance_class"] &&
        Array.isArray(fm["exo__Instance_class"]) &&
        fm["exo__Instance_class"].some(
          (c: string) => c.includes("Ontology") || c.includes("Vocabulary"),
        ))
    );
  }

  /**
   * Extract ontology information from file metadata
   */
  private extractOntologyInfo(
    file: any,
    frontmatter: any,
  ): OntologyInfo | null {
    // Try to extract prefix
    let prefix =
      frontmatter["exo__Ontology_prefix"] ||
      frontmatter["ontology_prefix"] ||
      frontmatter["prefix"];

    // Try to extract from file name if no prefix in metadata
    if (!prefix) {
      const nameMatch = file.basename.match(/^([a-z]+)[-_]ontology$/i);
      if (nameMatch) {
        prefix = nameMatch[1].toLowerCase();
      }
    }

    if (!prefix) {
      return null;
    }

    // Extract label
    const label =
      frontmatter["exo__Asset_label"] ||
      frontmatter["exo__Ontology_label"] ||
      frontmatter["label"] ||
      frontmatter["title"] ||
      file.basename;

    return {
      file,
      prefix,
      label,
      fileName: file.basename,
    };
  }

  /**
   * Check if a file path is in a template folder
   */
  private isInTemplateFolder(path: string): boolean {
    const templatePatterns = [
      "/templates/",
      "/Templates/",
      "/template/",
      "/Template/",
      "/_templates/",
      "/scaffolds/",
      "/Scaffolds/",
      "/archetypes/",
      "/Archetypes/",
    ];

    return templatePatterns.some((pattern) => path.includes(pattern));
  }
}
