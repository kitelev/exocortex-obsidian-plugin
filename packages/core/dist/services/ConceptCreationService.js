"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConceptCreationService = void 0;
const uuid_1 = require("uuid");
const DateFormatter_1 = require("../utilities/DateFormatter");
const MetadataHelpers_1 = require("../utilities/MetadataHelpers");
const constants_1 = require("../domain/constants");
class ConceptCreationService {
    constructor(vault) {
        this.vault = vault;
    }
    async createNarrowerConcept(parentFile, fileName, definition, aliases) {
        const uid = (0, uuid_1.v4)();
        const fullFileName = fileName.endsWith(".md") ? fileName : `${fileName}.md`;
        const frontmatter = this.generateConceptFrontmatter(parentFile.basename, definition, aliases, uid);
        const fileContent = MetadataHelpers_1.MetadataHelpers.buildFileContent(frontmatter);
        const folderPath = "concepts";
        const filePath = `${folderPath}/${fullFileName}`;
        const folder = this.vault.getAbstractFileByPath(folderPath);
        if (!folder) {
            await this.vault.createFolder(folderPath);
        }
        const createdFile = await this.vault.create(filePath, fileContent);
        return createdFile;
    }
    generateConceptFrontmatter(parentConceptName, definition, aliases, uid) {
        const now = new Date();
        const timestamp = DateFormatter_1.DateFormatter.toLocalTimestamp(now);
        const frontmatter = {};
        frontmatter["exo__Asset_isDefinedBy"] = '"[[!concepts]]"';
        frontmatter["exo__Asset_uid"] = uid;
        frontmatter["exo__Asset_createdAt"] = timestamp;
        frontmatter["exo__Instance_class"] = [`"[[${constants_1.AssetClass.CONCEPT}]]"`];
        frontmatter["ims__Concept_broader"] = `"[[${parentConceptName}]]"`;
        frontmatter["ims__Concept_definition"] = definition;
        if (aliases.length > 0) {
            frontmatter["aliases"] = aliases;
        }
        return frontmatter;
    }
}
exports.ConceptCreationService = ConceptCreationService;
