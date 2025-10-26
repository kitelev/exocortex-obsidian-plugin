import { Vault, MetadataCache } from "obsidian";
import { AreaNode } from '../domain/models/AreaNode';
export interface AssetRelation {
    path: string;
    title: string;
    propertyName?: string;
    isArchived?: boolean;
    metadata: Record<string, any>;
}
export declare class AreaHierarchyBuilder {
    private vault;
    private metadataCache;
    constructor(vault: Vault, metadataCache: MetadataCache);
    buildHierarchy(currentAreaPath: string, _relations: AssetRelation[]): AreaNode | null;
    private isFile;
    private extractInstanceClass;
    private cleanWikiLink;
    private collectAllAreasFromVault;
    private extractParentPath;
    private isArchived;
    private buildTree;
}
//# sourceMappingURL=AreaHierarchyBuilder.d.ts.map