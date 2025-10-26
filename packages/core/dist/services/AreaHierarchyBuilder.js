"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AreaHierarchyBuilder = void 0;
const obsidian_1 = require("obsidian");
const constants_1 = require("../domain/constants");
class AreaHierarchyBuilder {
    constructor(vault, metadataCache) {
        this.vault = vault;
        this.metadataCache = metadataCache;
    }
    buildHierarchy(currentAreaPath, _relations) {
        const currentFile = this.vault.getAbstractFileByPath(currentAreaPath);
        if (!this.isFile(currentFile)) {
            return null;
        }
        // eslint-disable-next-line obsidianmd/no-tfile-tfolder-cast
        const cache = this.metadataCache.getFileCache(currentFile);
        const metadata = cache?.frontmatter || {};
        const instanceClass = this.extractInstanceClass(metadata);
        if (instanceClass !== constants_1.AssetClass.AREA) {
            return null;
        }
        const allAreas = this.collectAllAreasFromVault();
        const visited = new Set();
        return this.buildTree(currentAreaPath, allAreas, visited, 0);
    }
    isFile(file) {
        if (file instanceof obsidian_1.TFile) {
            return true;
        }
        return (file &&
            typeof file === "object" &&
            "basename" in file &&
            "path" in file &&
            "stat" in file);
    }
    extractInstanceClass(metadata) {
        const instanceClass = metadata.exo__Instance_class || "";
        if (Array.isArray(instanceClass)) {
            return this.cleanWikiLink(instanceClass[0] || "");
        }
        return this.cleanWikiLink(instanceClass);
    }
    cleanWikiLink(value) {
        if (typeof value !== "string")
            return "";
        return value.replace(/^\[\[|\]\]$/g, "").trim();
    }
    collectAllAreasFromVault() {
        const areas = new Map();
        const pathByBasename = new Map();
        const allFiles = this.vault.getMarkdownFiles();
        for (const file of allFiles) {
            const cache = this.metadataCache.getFileCache(file);
            const metadata = cache?.frontmatter || {};
            const instanceClass = this.extractInstanceClass(metadata);
            if (instanceClass === constants_1.AssetClass.AREA) {
                const parentPath = this.extractParentPath(metadata);
                areas.set(file.path, {
                    path: file.path,
                    title: file.basename,
                    label: metadata.exo__Asset_label || undefined,
                    isArchived: this.isArchived(metadata),
                    depth: 0,
                    parentPath: parentPath || undefined,
                });
                pathByBasename.set(file.basename, file.path);
            }
        }
        for (const [, area] of areas.entries()) {
            if (area.parentPath && pathByBasename.has(area.parentPath)) {
                area.parentPath = pathByBasename.get(area.parentPath);
            }
        }
        return areas;
    }
    extractParentPath(metadata) {
        const parentProperty = metadata.ems__Area_parent;
        if (!parentProperty) {
            return null;
        }
        if (Array.isArray(parentProperty)) {
            const firstParent = parentProperty[0] || "";
            return this.cleanWikiLink(firstParent);
        }
        return this.cleanWikiLink(parentProperty);
    }
    isArchived(metadata) {
        const archivedProp = metadata.exo__Asset_archived;
        if (archivedProp === true || archivedProp === "true") {
            return true;
        }
        if (Array.isArray(archivedProp) && archivedProp.length > 0) {
            const first = archivedProp[0];
            return first === true || first === "true";
        }
        return false;
    }
    buildTree(path, areas, visited, depth) {
        if (visited.has(path)) {
            return null;
        }
        visited.add(path);
        const area = areas.get(path);
        if (!area) {
            return null;
        }
        const children = [];
        for (const [childPath, childData] of areas.entries()) {
            if (childData.parentPath === path) {
                const childNode = this.buildTree(childPath, areas, visited, depth + 1);
                if (childNode) {
                    children.push(childNode);
                }
            }
        }
        children.sort((a, b) => {
            const aLabel = a.label || a.title;
            const bLabel = b.label || b.title;
            return aLabel.localeCompare(bLabel);
        });
        return {
            path: area.path,
            title: area.title,
            label: area.label,
            isArchived: area.isArchived,
            depth,
            parentPath: area.parentPath,
            children,
        };
    }
}
exports.AreaHierarchyBuilder = AreaHierarchyBuilder;
