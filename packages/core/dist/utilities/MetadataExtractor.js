"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataExtractor = void 0;
class MetadataExtractor {
    constructor(vault) {
        this.vault = vault;
    }
    extractMetadata(file) {
        if (!file)
            return {};
        return this.vault.getFrontmatter(file) || {};
    }
    extractInstanceClass(metadata) {
        return metadata.exo__Instance_class || null;
    }
    extractStatus(metadata) {
        return metadata.ems__Effort_status || null;
    }
    extractIsArchived(metadata) {
        const archived = metadata.exo__Asset_isArchived;
        if (archived === true || archived === 1)
            return true;
        if (typeof archived === "string") {
            const lowerValue = archived.toLowerCase();
            return lowerValue === "true" || lowerValue === "yes";
        }
        return false;
    }
    static extractIsDefinedBy(sourceMetadata) {
        let isDefinedBy = sourceMetadata.exo__Asset_isDefinedBy || '""';
        if (Array.isArray(isDefinedBy)) {
            isDefinedBy = isDefinedBy[0] || '""';
        }
        return isDefinedBy;
    }
    extractExpectedFolder(metadata) {
        const isDefinedBy = metadata.exo__Asset_isDefinedBy;
        if (!isDefinedBy)
            return null;
        const definedByValue = Array.isArray(isDefinedBy) ? isDefinedBy[0] : isDefinedBy;
        if (!definedByValue || typeof definedByValue !== "string")
            return null;
        const cleanValue = definedByValue.replace(/["'[\]]/g, "").trim();
        if (!cleanValue)
            return null;
        const parts = cleanValue.split("/");
        parts.pop();
        return parts.join("/");
    }
    extractCommandVisibilityContext(file) {
        const metadata = this.extractMetadata(file);
        const instanceClass = this.extractInstanceClass(metadata);
        const currentStatus = this.extractStatus(metadata);
        const isArchived = this.extractIsArchived(metadata);
        const currentFolder = file.parent?.path || "";
        const expectedFolder = this.extractExpectedFolder(metadata);
        return {
            instanceClass,
            currentStatus,
            metadata,
            isArchived,
            currentFolder,
            expectedFolder,
        };
    }
    extractCache(file) {
        if (!file)
            return null;
        return this.vault.getFrontmatter(file);
    }
}
exports.MetadataExtractor = MetadataExtractor;
