import { TFile, Vault } from "obsidian";
import { v4 as uuidv4 } from "uuid";
import { DateFormatter } from "../utilities/DateFormatter";
import { MetadataHelpers } from "../utilities/MetadataHelpers";
import { AssetClass } from "../../domain/constants";

export class ConceptCreationService {
  constructor(private vault: Vault) {}

  async createNarrowerConcept(
    parentFile: TFile,
    fileName: string,
    definition: string,
    aliases: string[],
  ): Promise<TFile> {
    const uid = uuidv4();
    const fullFileName = fileName.endsWith(".md") ? fileName : `${fileName}.md`;

    const frontmatter = this.generateConceptFrontmatter(
      parentFile.basename,
      definition,
      aliases,
      uid,
    );

    const fileContent = MetadataHelpers.buildFileContent(frontmatter);

    const folderPath = "concepts";
    const filePath = `${folderPath}/${fullFileName}`;

    let folder = this.vault.getAbstractFileByPath(folderPath);
    if (!folder) {
      await this.vault.createFolder(folderPath);
    }

    const createdFile = await this.vault.create(filePath, fileContent);

    return createdFile;
  }

  private generateConceptFrontmatter(
    parentConceptName: string,
    definition: string,
    aliases: string[],
    uid: string,
  ): Record<string, any> {
    const now = new Date();
    const timestamp = DateFormatter.toLocalTimestamp(now);

    const frontmatter: Record<string, any> = {};
    frontmatter["exo__Asset_isDefinedBy"] = '"[[!concepts]]"';
    frontmatter["exo__Asset_uid"] = uid;
    frontmatter["exo__Asset_createdAt"] = timestamp;
    frontmatter["exo__Instance_class"] = [`"[[${AssetClass.CONCEPT}]]"`];
    frontmatter["ims__Concept_broader"] = `"[[${parentConceptName}]]"`;
    frontmatter["ims__Concept_definition"] = definition;

    if (aliases.length > 0) {
      frontmatter["aliases"] = aliases;
    }

    return frontmatter;
  }
}
