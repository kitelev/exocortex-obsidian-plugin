"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectCreationService = void 0;
const uuid_1 = require("uuid");
const WikiLinkHelpers_1 = require("../../infrastructure/utilities/WikiLinkHelpers");
const constants_1 = require("../../domain/constants");
const DateFormatter_1 = require("../../infrastructure/utilities/DateFormatter");
const MetadataHelpers_1 = require("../../infrastructure/utilities/MetadataHelpers");
const EFFORT_PROPERTY_MAP = {
    [constants_1.AssetClass.AREA]: "ems__Effort_area",
    [constants_1.AssetClass.INITIATIVE]: "ems__Effort_parent",
    [constants_1.AssetClass.PROJECT]: "ems__Effort_parent",
};
class ProjectCreationService {
    constructor(fs) {
        this.fs = fs;
    }
    async createProject(sourceFilePath, sourceMetadata, sourceClass, label) {
        const uid = (0, uuid_1.v4)();
        const fileName = `${uid}.md`;
        const sourceFileBasename = sourceFilePath.split('/').pop()?.replace('.md', '') || '';
        const frontmatter = this.generateProjectFrontmatter(sourceMetadata, sourceFileBasename, sourceClass, label, uid);
        const fileContent = MetadataHelpers_1.MetadataHelpers.buildFileContent(frontmatter);
        const folderPath = sourceFilePath.substring(0, sourceFilePath.lastIndexOf('/'));
        const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
        const createdPath = await this.fs.createFile(filePath, fileContent);
        return createdPath;
    }
    generateProjectFrontmatter(sourceMetadata, sourceName, sourceClass, label, uid) {
        const now = new Date();
        const timestamp = DateFormatter_1.DateFormatter.toLocalTimestamp(now);
        const isDefinedBy = this.extractIsDefinedBy(sourceMetadata);
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
    extractIsDefinedBy(metadata) {
        const value = metadata.exo__Asset_isDefinedBy;
        if (!value)
            return "";
        if (Array.isArray(value)) {
            return value[0] || "";
        }
        return String(value);
    }
}
exports.ProjectCreationService = ProjectCreationService;
