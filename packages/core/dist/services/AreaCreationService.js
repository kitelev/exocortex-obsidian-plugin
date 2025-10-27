"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AreaCreationService = void 0;
const uuid_1 = require("uuid");
const constants_1 = require("../domain/constants");
const DateFormatter_1 = require("../utilities/DateFormatter");
const MetadataExtractor_1 = require("../utilities/MetadataExtractor");
const MetadataHelpers_1 = require("../utilities/MetadataHelpers");
class AreaCreationService {
    constructor(vault) {
        this.vault = vault;
    }
    async createChildArea(sourceFile, sourceMetadata, label) {
        const uid = (0, uuid_1.v4)();
        const fileName = `${uid}.md`;
        const frontmatter = this.generateChildAreaFrontmatter(sourceMetadata, sourceFile.basename, label, uid);
        const fileContent = MetadataHelpers_1.MetadataHelpers.buildFileContent(frontmatter);
        const folderPath = sourceFile.parent?.path || "";
        const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
        const createdFile = await this.vault.create(filePath, fileContent);
        return createdFile;
    }
    generateChildAreaFrontmatter(sourceMetadata, sourceName, label, uid) {
        const now = new Date();
        const timestamp = DateFormatter_1.DateFormatter.toLocalTimestamp(now);
        const isDefinedBy = MetadataExtractor_1.MetadataExtractor.extractIsDefinedBy(sourceMetadata);
        const frontmatter = {};
        frontmatter["exo__Asset_isDefinedBy"] =
            MetadataHelpers_1.MetadataHelpers.ensureQuoted(isDefinedBy);
        frontmatter["exo__Asset_uid"] = uid || (0, uuid_1.v4)();
        frontmatter["exo__Asset_createdAt"] = timestamp;
        frontmatter["exo__Instance_class"] = [`"[[${constants_1.AssetClass.AREA}]]"`];
        frontmatter["ems__Area_parent"] = `"[[${sourceName}]]"`;
        if (label && label.trim() !== "") {
            const trimmedLabel = label.trim();
            frontmatter["exo__Asset_label"] = trimmedLabel;
            frontmatter["aliases"] = [trimmedLabel];
        }
        return frontmatter;
    }
}
exports.AreaCreationService = AreaCreationService;
