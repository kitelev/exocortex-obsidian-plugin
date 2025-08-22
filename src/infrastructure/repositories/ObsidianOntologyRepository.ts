import { App, TFile } from "obsidian";
import { IOntologyRepository } from "../../domain/repositories/IOntologyRepository";
import { Ontology } from "../../domain/entities/Ontology";
import { OntologyPrefix } from "../../domain/value-objects/OntologyPrefix";

/**
 * Obsidian implementation of IOntologyRepository
 * Handles ontology persistence using Obsidian vault
 */
export class ObsidianOntologyRepository implements IOntologyRepository {
  constructor(private app: App) {}

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
    const files = this.app.vault.getMarkdownFiles();
    const ontologies: Ontology[] = [];

    for (const file of files) {
      if (file.name.startsWith("!")) {
        const cache = this.app.metadataCache.getFileCache(file);
        if (cache?.frontmatter?.["exo__Ontology_prefix"]) {
          ontologies.push(Ontology.fromFrontmatter(cache.frontmatter));
        }
      }
    }

    return ontologies;
  }

  async save(ontology: Ontology): Promise<void> {
    const fileName = `!${ontology.getPrefix().toString()}.md`;
    const frontmatter = ontology.toFrontmatter();

    // Build YAML frontmatter
    const yamlLines = ["---"];
    for (const [key, value] of Object.entries(frontmatter)) {
      if (Array.isArray(value)) {
        yamlLines.push(`${key}:`);
        for (const item of value) {
          yamlLines.push(`  - ${item}`);
        }
      } else {
        yamlLines.push(`${key}: ${value}`);
      }
    }
    yamlLines.push("---", "");

    const content = yamlLines.join("\n");

    // Check if file exists
    const existingFile = this.app.vault.getAbstractFileByPath(fileName);
    if (existingFile instanceof TFile) {
      await this.app.vault.modify(existingFile, content);
    } else {
      await this.app.vault.create(fileName, content);
    }
  }

  async exists(prefix: OntologyPrefix): Promise<boolean> {
    const fileName = `!${prefix.toString()}.md`;
    const file = this.app.vault.getAbstractFileByPath(fileName);
    return file instanceof TFile;
  }
}
