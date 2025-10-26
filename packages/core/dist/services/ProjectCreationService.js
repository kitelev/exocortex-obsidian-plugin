"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectCreationService = void 0;
const uuid_1 = require("uuid");
const WikiLinkHelpers_1 = require("../utilities/WikiLinkHelpers");
const constants_1 = require("../domain/constants");
const DateFormatter_1 = require("../utilities/DateFormatter");
const MetadataExtractor_1 = require("../utilities/MetadataExtractor");
const MetadataHelpers_1 = require("../utilities/MetadataHelpers");
/**
 * Mapping of source class to effort property name
 * Implements Strategy pattern for property selection
 */
const EFFORT_PROPERTY_MAP = {
    [constants_1.AssetClass.AREA]: "ems__Effort_area",
    [constants_1.AssetClass.INITIATIVE]: "ems__Effort_parent",
    [constants_1.AssetClass.PROJECT]: "ems__Effort_parent",
};
class ProjectCreationService {
    constructor(vault) {
        this.vault = vault;
    }
    async createProject(sourceFile, sourceMetadata, sourceClass, label) {
        const uid = (0, uuid_1.v4)();
        const fileName = `${uid}.md`;
        const frontmatter = this.generateProjectFrontmatter(sourceMetadata, sourceFile.basename, sourceClass, label, uid);
        const fileContent = MetadataHelpers_1.MetadataHelpers.buildFileContent(frontmatter);
        const folderPath = sourceFile.parent?.path || "";
        const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
        const createdFile = await this.vault.create(filePath, fileContent);
        return createdFile;
    }
    generateProjectFrontmatter(sourceMetadata, sourceName, sourceClass, label, uid) {
        const now = new Date();
        const timestamp = DateFormatter_1.DateFormatter.toLocalTimestamp(now);
        const isDefinedBy = MetadataExtractor_1.MetadataExtractor.extractIsDefinedBy(sourceMetadata);
        // Get appropriate effort property name based on source class
        const cleanSourceClass = WikiLinkHelpers_1.WikiLinkHelpers.normalize(sourceClass);
        const effortProperty = EFFORT_PROPERTY_MAP[cleanSourceClass] || "ems__Effort_area";
        const frontmatter = {};
        frontmatter["exo__Asset_isDefinedBy"] = MetadataHelpers_1.MetadataHelpers.ensureQuoted(isDefinedBy);
        frontmatter["exo__Asset_uid"] = uid || (0, uuid_1.v4)();
        frontmatter["exo__Asset_createdAt"] = timestamp;
        frontmatter["exo__Instance_class"] = [`"[[${constants_1.AssetClass.PROJECT}]]"`];
        frontmatter["ems__Effort_status"] = '"[[ems__EffortStatusDraft]]"';
        frontmatter[effortProperty] = `"[[${sourceName}]]"`;
        if (label && label.trim() !== "") {
            const trimmedLabel = label.trim();
            frontmatter["exo__Asset_label"] = trimmedLabel;
            frontmatter["aliases"] = [trimmedLabel];
        }
        return frontmatter;
    }
}
exports.ProjectCreationService = ProjectCreationService;
