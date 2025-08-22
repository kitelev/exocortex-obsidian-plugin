import { Result } from "../../domain/core/Result";
import { IVaultAdapter } from "../ports/IVaultAdapter";
import { IUIAdapter } from "../ports/IUIAdapter";

export interface PropertyBasedBacklink {
  propertyName: string;
  referencingFiles: any[];
}

export interface BacklinkDiscoveryOptions {
  excludeProperties?: string[];
  maxResultsPerProperty?: number;
  filterByClass?: string;
}

export class DynamicBacklinksService {
  constructor(
    private vaultAdapter: IVaultAdapter,
    private uiAdapter: IUIAdapter,
  ) {}

  async discoverPropertyBasedBacklinks(
    targetFile: any,
    options: BacklinkDiscoveryOptions = {},
  ): Promise<Result<PropertyBasedBacklink[]>> {
    try {
      const propertyBacklinks = new Map<string, any[]>();

      // Scan all markdown files in the vault
      const allFiles = await this.vaultAdapter.getFiles();

      for (const file of allFiles) {
        if (file.path === targetFile.path) continue; // Skip self-references

        const metadata = await this.vaultAdapter.getFileMetadata(file);
        if (!metadata) continue;

        // Filter by class if specified
        if (options.filterByClass) {
          const instanceClass = this.uiAdapter.cleanClassName(
            metadata["exo__Instance_class"],
          );
          if (instanceClass !== options.filterByClass) continue;
        }

        // Check each frontmatter property for references to target file
        for (const [propertyName, value] of Object.entries(metadata)) {
          // Skip excluded properties
          if (options.excludeProperties?.includes(propertyName)) continue;

          if (this.isReferencingTarget(value, targetFile)) {
            if (!propertyBacklinks.has(propertyName)) {
              propertyBacklinks.set(propertyName, []);
            }
            propertyBacklinks.get(propertyName)!.push(file);
          }
        }
      }

      // Convert to result format and apply limits
      const results: PropertyBasedBacklink[] = [];
      for (const [propertyName, files] of propertyBacklinks.entries()) {
        const limitedFiles = options.maxResultsPerProperty
          ? files.slice(0, options.maxResultsPerProperty)
          : files;

        results.push({
          propertyName,
          referencingFiles: limitedFiles,
        });
      }

      // Sort by property name for consistent ordering
      results.sort((a, b) => a.propertyName.localeCompare(b.propertyName));

      return Result.ok(results);
    } catch (error) {
      return Result.fail(`Failed to discover backlinks: ${error}`);
    }
  }

  private isReferencingTarget(value: any, targetFile: any): boolean {
    if (!value) return false;

    // Handle arrays
    if (Array.isArray(value)) {
      return value.some((item) => this.isReferencingTarget(item, targetFile));
    }

    // Convert to string and check various reference formats
    const strValue = value.toString();
    const targetFileName =
      targetFile.basename || targetFile.name?.replace(/\.[^/.]+$/, "") || "";
    const targetPath = targetFile.path || targetFile.name || "";

    // Get target file's UUID for UUID-based matching (via vault adapter)
    const targetUuid = null; // TODO: Implement via vaultAdapter if needed

    // Direct basename match
    if (strValue === targetFileName) return true;

    // Wiki-link format exact match
    if (strValue.includes(`[[${targetFileName}]]`)) return true;

    // Wiki-link with display text
    if (strValue.includes(`[[${targetFileName}|`)) return true;

    // Path-based matching for references like [[Area - My]]
    if (strValue.startsWith("[[") && strValue.endsWith("]]")) {
      const linkText = strValue.slice(2, -2).split("|")[0]; // Remove [[ ]] and display text

      // Try to resolve the link to see if it points to our target file
      // TODO: Implement proper link resolution via vault adapter
      if (linkText === targetFileName) return true;

      // Also check if the link text partially matches the target filename
      if (
        targetFileName.includes(linkText) ||
        linkText.includes(targetFileName)
      )
        return true;
    }

    // UUID-based matching
    if (targetUuid && strValue.includes(targetUuid)) return true;

    // Partial match within string (for composite references)
    if (strValue.includes(targetFileName)) return true;

    return false;
  }

  private cleanClassName(className: any): string {
    if (!className) return "";
    const str = Array.isArray(className) ? className[0] : className;
    return str?.toString().replace(/\[\[|\]\]/g, "") || "";
  }
}
