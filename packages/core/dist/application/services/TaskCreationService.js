"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskCreationService = void 0;
const uuid_1 = require("uuid");
const DateFormatter_1 = require("../../infrastructure/utilities/DateFormatter");
const WikiLinkHelpers_1 = require("../../infrastructure/utilities/WikiLinkHelpers");
const MetadataHelpers_1 = require("../../infrastructure/utilities/MetadataHelpers");
const constants_1 = require("../../domain/constants");
const EFFORT_PROPERTY_MAP = {
    [constants_1.AssetClass.AREA]: "ems__Effort_area",
    [constants_1.AssetClass.PROJECT]: "ems__Effort_parent",
    [constants_1.AssetClass.TASK_PROTOTYPE]: "ems__Effort_prototype",
    [constants_1.AssetClass.MEETING_PROTOTYPE]: "ems__Effort_prototype",
};
const INSTANCE_CLASS_MAP = {
    [constants_1.AssetClass.AREA]: constants_1.AssetClass.TASK,
    [constants_1.AssetClass.PROJECT]: constants_1.AssetClass.TASK,
    [constants_1.AssetClass.TASK_PROTOTYPE]: constants_1.AssetClass.TASK,
    [constants_1.AssetClass.MEETING_PROTOTYPE]: constants_1.AssetClass.MEETING,
};
class TaskCreationService {
    constructor(fs) {
        this.fs = fs;
    }
    extractH2Section(content, heading) {
        const lines = content.split("\n");
        const targetHeading = `## ${heading}`;
        let inSection = false;
        const sectionContent = [];
        for (const line of lines) {
            if (line.trim() === targetHeading) {
                inSection = true;
                continue;
            }
            if (inSection) {
                if (line.startsWith("## ") || line.startsWith("# ")) {
                    break;
                }
                sectionContent.push(line);
            }
        }
        if (sectionContent.length === 0) {
            return null;
        }
        const content_text = sectionContent.join("\n").trim();
        return content_text || null;
    }
    async createTask(sourceFilePath, sourceMetadata, sourceClass, label, taskSize) {
        const uid = (0, uuid_1.v4)();
        const fileName = `${uid}.md`;
        const sourceFileBasename = sourceFilePath.split('/').pop()?.replace('.md', '') || '';
        const frontmatter = this.generateTaskFrontmatter(sourceMetadata, sourceFileBasename, sourceClass, label, uid, taskSize);
        let bodyContent = "";
        const cleanSourceClass = WikiLinkHelpers_1.WikiLinkHelpers.normalize(sourceClass);
        if (cleanSourceClass === constants_1.AssetClass.TASK_PROTOTYPE) {
            const prototypeContent = await this.fs.readFile(sourceFilePath);
            const algorithmSection = this.extractH2Section(prototypeContent, "Algorithm");
            if (algorithmSection) {
                bodyContent = `## Algorithm\n\n${algorithmSection}`;
            }
        }
        const fileContent = MetadataHelpers_1.MetadataHelpers.buildFileContent(frontmatter, bodyContent);
        const folderPath = sourceFilePath.substring(0, sourceFilePath.lastIndexOf('/'));
        const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
        const createdPath = await this.fs.createFile(filePath, fileContent);
        return createdPath;
    }
    async createTaskFromArea(sourceFilePath, sourceMetadata) {
        return this.createTask(sourceFilePath, sourceMetadata, constants_1.AssetClass.AREA);
    }
    async createRelatedTask(sourceFilePath, sourceMetadata, label, taskSize) {
        const uid = (0, uuid_1.v4)();
        const fileName = `${uid}.md`;
        const sourceFileBasename = sourceFilePath.split('/').pop()?.replace('.md', '') || '';
        const frontmatter = this.generateRelatedTaskFrontmatter(sourceMetadata, sourceFileBasename, label, uid, taskSize);
        const fileContent = MetadataHelpers_1.MetadataHelpers.buildFileContent(frontmatter);
        const folderPath = sourceFilePath.substring(0, sourceFilePath.lastIndexOf('/'));
        const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
        const createdPath = await this.fs.createFile(filePath, fileContent);
        await this.addRelationToSourceFile(sourceFilePath, uid);
        return createdPath;
    }
    generateRelatedTaskFrontmatter(sourceMetadata, sourceName, label, uid, taskSize) {
        const now = new Date();
        const timestamp = DateFormatter_1.DateFormatter.toLocalTimestamp(now);
        const isDefinedBy = this.extractIsDefinedBy(sourceMetadata);
        const frontmatter = {};
        frontmatter["exo__Asset_isDefinedBy"] = MetadataHelpers_1.MetadataHelpers.ensureQuoted(isDefinedBy);
        frontmatter["exo__Asset_uid"] = uid || (0, uuid_1.v4)();
        frontmatter["exo__Asset_createdAt"] = timestamp;
        frontmatter["exo__Instance_class"] = [`"[[${constants_1.AssetClass.TASK}]]"`];
        frontmatter["ems__Effort_status"] = '"[[ems__EffortStatusDraft]]"';
        frontmatter["exo__Asset_relates"] = [`"[[${sourceName}]]"`];
        if (label && label.trim() !== "") {
            const trimmedLabel = label.trim();
            frontmatter["exo__Asset_label"] = trimmedLabel;
            frontmatter["aliases"] = [trimmedLabel];
        }
        if (taskSize) {
            frontmatter["ems__Task_size"] = taskSize;
        }
        return frontmatter;
    }
    async addRelationToSourceFile(sourceFilePath, newTaskUid) {
        const content = await this.fs.readFile(sourceFilePath);
        const updatedContent = this.addRelationToFrontmatter(content, newTaskUid);
        await this.fs.updateFile(sourceFilePath, updatedContent);
    }
    addRelationToFrontmatter(content, relatedTaskUid) {
        const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
        const match = content.match(frontmatterRegex);
        const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
        if (!match) {
            const newFrontmatter = `---${lineEnding}exo__Asset_relates:${lineEnding}  - "[[${relatedTaskUid}]]"${lineEnding}---${lineEnding}${content}`;
            return newFrontmatter;
        }
        const frontmatterContent = match[1];
        let updatedFrontmatter = frontmatterContent;
        if (updatedFrontmatter.includes("exo__Asset_relates:")) {
            const relatesMatch = updatedFrontmatter.match(/exo__Asset_relates:\r?\n((?: {2}- .*\r?\n)*)/);
            if (relatesMatch) {
                const existingItems = relatesMatch[1];
                const newItem = `  - "[[${relatedTaskUid}]]"${lineEnding}`;
                updatedFrontmatter = updatedFrontmatter.replace(/exo__Asset_relates:\r?\n((?: {2}- .*\r?\n)*)/, `exo__Asset_relates:${lineEnding}${existingItems}${newItem}`);
            }
        }
        else {
            updatedFrontmatter += `${lineEnding}exo__Asset_relates:${lineEnding}  - "[[${relatedTaskUid}]]"`;
        }
        return content.replace(frontmatterRegex, `---${lineEnding}${updatedFrontmatter}${lineEnding}---`);
    }
    generateTaskFrontmatter(sourceMetadata, sourceName, sourceClass, label, uid, taskSize) {
        const now = new Date();
        const timestamp = DateFormatter_1.DateFormatter.toLocalTimestamp(now);
        const isDefinedBy = this.extractIsDefinedBy(sourceMetadata);
        const cleanSourceClass = WikiLinkHelpers_1.WikiLinkHelpers.normalize(sourceClass);
        const effortProperty = EFFORT_PROPERTY_MAP[cleanSourceClass] || "ems__Effort_area";
        const instanceClass = INSTANCE_CLASS_MAP[cleanSourceClass] || constants_1.AssetClass.TASK;
        const frontmatter = {};
        frontmatter["exo__Asset_isDefinedBy"] = MetadataHelpers_1.MetadataHelpers.ensureQuoted(isDefinedBy);
        frontmatter["exo__Asset_uid"] = uid || (0, uuid_1.v4)();
        frontmatter["exo__Asset_createdAt"] = timestamp;
        frontmatter["exo__Instance_class"] = [`"[[${instanceClass}]]"`];
        frontmatter["ems__Effort_status"] = '"[[ems__EffortStatusDraft]]"';
        frontmatter[effortProperty] = `"[[${sourceName}]]"`;
        let finalLabel = label;
        if (instanceClass === constants_1.AssetClass.MEETING && (!label || label.trim() === "")) {
            const baseLabel = sourceMetadata.exo__Asset_label || sourceName;
            const dateStr = DateFormatter_1.DateFormatter.toDateString(now);
            finalLabel = `${baseLabel} ${dateStr}`;
        }
        if (finalLabel && finalLabel.trim() !== "") {
            const trimmedLabel = finalLabel.trim();
            frontmatter["exo__Asset_label"] = trimmedLabel;
            frontmatter["aliases"] = [trimmedLabel];
        }
        if (taskSize) {
            frontmatter["ems__Task_size"] = taskSize;
        }
        return frontmatter;
    }
    generateTaskFileName() {
        const now = new Date();
        const timestamp = DateFormatter_1.DateFormatter.toLocalTimestamp(now).replace(/:/g, "-");
        return `Task-${timestamp}.md`;
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
exports.TaskCreationService = TaskCreationService;
