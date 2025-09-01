import { App, TFile } from "obsidian";
import { IOntologyRepository } from "../../domain/repositories/IOntologyRepository";
import { Ontology } from "../../domain/entities/Ontology";
import { OntologyPrefix } from "../../domain/value-objects/OntologyPrefix";
import { AbstractFileRepository } from "../../shared/AbstractFileRepository";

/**
 * Obsidian implementation of IOntologyRepository
 * Handles ontology persistence using Obsidian vault
 * Extends AbstractFileRepository to eliminate code duplication
 */
export class ObsidianOntologyRepository
  extends AbstractFileRepository
  implements IOntologyRepository
{
  constructor(app: App) {
    super(app);
  }

  async findByPrefix(prefix: OntologyPrefix): Promise<Ontology | null> {
    const fileName = `!${prefix.toString()}.md`;
    const file = this.app.vault.getAbstractFileByPath(fileName);

    if (file instanceof TFile) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (cache?.frontmatter) {
        return Ontology.fromFrontmatter(cache.frontmatter);
      }
    }

    return null;
  }

  async findAll(): Promise<Ontology[]> {
    return this.findAllEntities(
      "exo__Ontology_prefix",
      (frontmatter) => Ontology.fromFrontmatter(frontmatter),
      "Ontology",
      (file) => file.name.startsWith("!"),
    );
  }

  async save(ontology: Ontology): Promise<void> {
    return this.saveEntityWithFrontmatter(
      ontology,
      (entity) => `!${entity.getPrefix().toString()}`,
      (entity) => entity.toFrontmatter(),
      (entity) => {
        const fileName = `!${entity.getPrefix().toString()}.md`;
        const file = this.app.vault.getAbstractFileByPath(fileName);
        return file instanceof TFile ? file : null;
      },
      "Ontology",
    );
  }

  async exists(prefix: OntologyPrefix): Promise<boolean> {
    try {
      const ontology = await this.findByPrefix(prefix);
      return ontology !== null;
    } catch (error) {
      console.error(`Error checking if Ontology exists: ${error}`);
      return false;
    }
  }
}
