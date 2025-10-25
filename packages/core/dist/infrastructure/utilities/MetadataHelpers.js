"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataHelpers = void 0;
class MetadataHelpers {
    static findAllReferencingProperties(metadata, currentFileName) {
        const properties = [];
        for (const [key, value] of Object.entries(metadata)) {
            if (this.containsReference(value, currentFileName)) {
                properties.push(key);
            }
        }
        return properties;
    }
    static findReferencingProperty(metadata, currentFileName) {
        for (const [key, value] of Object.entries(metadata)) {
            if (this.containsReference(value, currentFileName)) {
                return key;
            }
        }
        return undefined;
    }
    static containsReference(value, fileName) {
        if (!value)
            return false;
        const cleanName = fileName.replace(/\.md$/, "");
        if (typeof value === "string") {
            return value.includes(`[[${cleanName}]]`) || value.includes(cleanName);
        }
        if (Array.isArray(value)) {
            return value.some((v) => this.containsReference(v, fileName));
        }
        return false;
    }
    static isAssetArchived(metadata) {
        if (metadata?.exo__Asset_isArchived === true) {
            return true;
        }
        const archivedValue = metadata?.archived;
        if (archivedValue === undefined || archivedValue === null) {
            return false;
        }
        if (typeof archivedValue === "boolean") {
            return archivedValue;
        }
        if (typeof archivedValue === "number") {
            return archivedValue !== 0;
        }
        if (typeof archivedValue === "string") {
            const normalized = archivedValue.toLowerCase().trim();
            return (normalized === "true" || normalized === "yes" || normalized === "1");
        }
        return false;
    }
    static getPropertyValue(relation, propertyName) {
        if (propertyName === "Name")
            return relation.title;
        if (propertyName === "title")
            return relation.title;
        if (propertyName === "created")
            return relation.created;
        if (propertyName === "modified")
            return relation.modified;
        if (propertyName === "path")
            return relation.path;
        return relation.metadata?.[propertyName];
    }
    static ensureQuoted(value) {
        if (!value || value === '""')
            return '""';
        if (value.startsWith('"') && value.endsWith('"'))
            return value;
        return `"${value}"`;
    }
    static buildFileContent(frontmatter, bodyContent) {
        const frontmatterLines = Object.entries(frontmatter)
            .map(([key, value]) => {
            if (Array.isArray(value)) {
                const arrayItems = value.map((item) => `  - ${item}`).join("\n");
                return `${key}:\n${arrayItems}`;
            }
            return `${key}: ${value}`;
        })
            .join("\n");
        const body = bodyContent ? `\n${bodyContent}\n` : "\n";
        return `---\n${frontmatterLines}\n---\n${body}`;
    }
}
exports.MetadataHelpers = MetadataHelpers;
