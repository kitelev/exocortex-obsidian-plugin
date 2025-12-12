import type { App, TFile, MetadataCache } from "obsidian";
import type { IAliasService } from '@plugin/presentation/editor-extensions/AliasIconViewPlugin';

/**
 * Service for managing aliases in frontmatter.
 * Used by the AliasIconViewPlugin to check and add aliases.
 */
export class WikilinkAliasService implements IAliasService {
  constructor(
    private app: App,
    private metadataCache: MetadataCache,
  ) {}

  /**
   * Get existing aliases from a file's frontmatter.
   * @param file The target file to read aliases from
   * @returns Array of alias strings
   */
  getAliases(file: TFile): string[] {
    const cache = this.metadataCache.getFileCache(file);
    const frontmatter = cache?.frontmatter;

    if (!frontmatter) {
      return [];
    }

    const aliases = frontmatter.aliases;

    if (Array.isArray(aliases)) {
      return aliases.filter((a): a is string => typeof a === "string");
    }

    if (typeof aliases === "string") {
      return [aliases];
    }

    return [];
  }

  /**
   * Add an alias to a file's frontmatter aliases property.
   * @param file The target file to add alias to
   * @param alias The alias string to add
   */
  async addAlias(file: TFile, alias: string): Promise<void> {
    const currentAliases = this.getAliases(file);

    // Don't add duplicate
    if (currentAliases.includes(alias)) {
      return;
    }

    const newAliases = [...currentAliases, alias];

    await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
      if (newAliases.length === 1) {
        // Single alias can be a string
        frontmatter.aliases = newAliases[0];
      } else {
        // Multiple aliases as array
        frontmatter.aliases = newAliases;
      }
    });
  }
}
