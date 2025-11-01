import { IVaultAdapter, IFile } from "../interfaces/IVaultAdapter";
import { Triple } from "../domain/models/rdf/Triple";
import { IRI } from "../domain/models/rdf/IRI";
import { Literal } from "../domain/models/rdf/Literal";
import { Namespace } from "../domain/models/rdf/Namespace";

/**
 * Service for converting Obsidian notes (frontmatter + wikilinks) to RDF triples.
 *
 * @example
 * ```typescript
 * const converter = new NoteToRDFConverter(vault);
 * const triples = await converter.convertNote(file);
 * ```
 */
export class NoteToRDFConverter {
  private readonly OBSIDIAN_VAULT_SCHEME = "obsidian://vault/";

  constructor(private readonly vault: IVaultAdapter) {}

  /**
   * Converts a single note to RDF triples.
   *
   * @param file - The file to convert
   * @returns Array of RDF triples representing the note's metadata
   *
   * @example
   * ```typescript
   * const file = vault.getAbstractFileByPath("My Task.md");
   * const triples = await converter.convertNote(file);
   * ```
   */
  async convertNote(file: IFile): Promise<Triple[]> {
    const frontmatter = this.vault.getFrontmatter(file);

    if (!frontmatter) {
      return [];
    }

    const triples: Triple[] = [];
    const subject = this.notePathToIRI(file.path);

    for (const [key, value] of Object.entries(frontmatter)) {
      if (!this.isExocortexProperty(key)) {
        continue;
      }

      const predicate = this.propertyKeyToIRI(key);
      const values = Array.isArray(value) ? value : [value];

      for (const val of values) {
        const objectNode = await this.valueToRDFObject(val, file);
        triples.push(new Triple(subject, predicate, objectNode));
      }

      if (key === "exo__Instance_class") {
        for (const val of values) {
          const classIRI = this.expandClassValue(val);
          if (classIRI) {
            const rdfType = Namespace.RDF.term("type");
            triples.push(new Triple(subject, rdfType, classIRI));
          }
        }
      }
    }

    return triples;
  }

  /**
   * Converts all notes in the vault to RDF triples.
   *
   * @returns Array of all RDF triples from the vault
   *
   * @example
   * ```typescript
   * const allTriples = await converter.convertVault();
   * console.log(`Converted ${allTriples.length} triples`);
   * ```
   */
  async convertVault(): Promise<Triple[]> {
    const files = this.vault.getAllFiles();
    const allTriples: Triple[] = [];

    for (const file of files) {
      const triples = await this.convertNote(file);
      allTriples.push(...triples);
    }

    return allTriples;
  }

  /**
   * Converts a note path to an obsidian:// IRI.
   *
   * @param path - The note path (e.g., "path/to/note.md")
   * @returns IRI with obsidian:// scheme
   *
   * @example
   * ```typescript
   * const iri = converter.notePathToIRI("My Folder/My Note.md");
   * // Returns: obsidian://vault/My Folder/My Note.md
   * ```
   */
  notePathToIRI(path: string): IRI {
    return new IRI(`${this.OBSIDIAN_VAULT_SCHEME}${path}`);
  }

  private isExocortexProperty(key: string): boolean {
    return key.startsWith("exo__") || key.startsWith("ems__");
  }

  private propertyKeyToIRI(key: string): IRI {
    if (key.startsWith("exo__")) {
      const localName = key.substring(5);
      return Namespace.EXO.term(localName);
    }

    if (key.startsWith("ems__")) {
      const localName = key.substring(5);
      return Namespace.EMS.term(localName);
    }

    throw new Error(`Invalid property key: ${key}`);
  }

  private async valueToRDFObject(
    value: any,
    sourceFile: IFile
  ): Promise<IRI | Literal> {
    if (typeof value === "string") {
      const cleanValue = this.removeQuotes(value);

      const wikilink = this.extractWikilink(cleanValue);
      if (wikilink) {
        const targetFile = this.vault.getFirstLinkpathDest(
          wikilink,
          sourceFile.path
        );
        if (targetFile) {
          return this.notePathToIRI(targetFile.path);
        }
        return new Literal(cleanValue);
      }

      if (this.isClassReference(cleanValue)) {
        const classIRI = this.expandClassValue(cleanValue);
        if (classIRI) {
          return classIRI;
        }
      }

      return new Literal(cleanValue);
    }

    if (typeof value === "boolean") {
      return new Literal(value.toString());
    }

    if (typeof value === "number") {
      return new Literal(
        value.toString(),
        new IRI("http://www.w3.org/2001/XMLSchema#number")
      );
    }

    return new Literal(String(value));
  }

  private removeQuotes(value: string): string {
    const trimmed = value.trim();
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.substring(1, trimmed.length - 1);
    }
    return value;
  }

  private extractWikilink(value: string): string | null {
    const match = value.match(/^\[\[([^\]]+)\]\]$/);
    return match ? match[1] : null;
  }

  private isClassReference(value: string): boolean {
    return value.startsWith("ems__") || value.startsWith("exo__");
  }

  private expandClassValue(value: string): IRI | null {
    const cleanValue = this.removeQuotes(value);

    if (cleanValue.startsWith("ems__")) {
      const className = cleanValue.substring(5);
      return Namespace.EMS.term(className);
    }

    if (cleanValue.startsWith("exo__")) {
      const className = cleanValue.substring(5);
      return Namespace.EXO.term(className);
    }

    return null;
  }
}
