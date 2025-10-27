"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskFrontmatterGenerator = void 0;
const uuid_1 = require("uuid");
const DateFormatter_1 = require("../utilities/DateFormatter");
const WikiLinkHelpers_1 = require("../utilities/WikiLinkHelpers");
const MetadataExtractor_1 = require("../utilities/MetadataExtractor");
const MetadataHelpers_1 = require("../utilities/MetadataHelpers");
const constants_1 = require("../domain/constants");
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
class TaskFrontmatterGenerator {
    generateTaskFrontmatter(sourceMetadata, sourceName, sourceClass, label, uid, taskSize) {
        const now = new Date();
        const timestamp = DateFormatter_1.DateFormatter.toLocalTimestamp(now);
        const isDefinedBy = MetadataExtractor_1.MetadataExtractor.extractIsDefinedBy(sourceMetadata);
        const cleanSourceClass = WikiLinkHelpers_1.WikiLinkHelpers.normalize(sourceClass);
        const effortProperty = EFFORT_PROPERTY_MAP[cleanSourceClass] || "ems__Effort_area";
        const instanceClass = INSTANCE_CLASS_MAP[cleanSourceClass] || constants_1.AssetClass.TASK;
        const frontmatter = {};
        frontmatter["exo__Asset_isDefinedBy"] =
            MetadataHelpers_1.MetadataHelpers.ensureQuoted(isDefinedBy);
        frontmatter["exo__Asset_uid"] = uid || (0, uuid_1.v4)();
        frontmatter["exo__Asset_createdAt"] = timestamp;
        frontmatter["exo__Instance_class"] = [`"[[${instanceClass}]]"`];
        frontmatter["ems__Effort_status"] = '"[[ems__EffortStatusDraft]]"';
        frontmatter[effortProperty] = `"[[${sourceName}]]"`;
        let finalLabel = label;
        if (instanceClass === constants_1.AssetClass.MEETING &&
            (!label || label.trim() === "")) {
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
    generateRelatedTaskFrontmatter(sourceMetadata, sourceName, label, uid, taskSize) {
        const now = new Date();
        const timestamp = DateFormatter_1.DateFormatter.toLocalTimestamp(now);
        const isDefinedBy = MetadataExtractor_1.MetadataExtractor.extractIsDefinedBy(sourceMetadata);
        const frontmatter = {};
        frontmatter["exo__Asset_isDefinedBy"] =
            MetadataHelpers_1.MetadataHelpers.ensureQuoted(isDefinedBy);
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
}
exports.TaskFrontmatterGenerator = TaskFrontmatterGenerator;
