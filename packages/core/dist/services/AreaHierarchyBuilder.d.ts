import { AreaNode } from "../domain/models/AreaNode";
import { IVaultAdapter } from "../interfaces/IVaultAdapter";
export interface AssetRelation {
  path: string;
  title: string;
  propertyName?: string;
  isArchived?: boolean;
  metadata: Record<string, any>;
}
export declare class AreaHierarchyBuilder {
  private vault;
  constructor(vault: IVaultAdapter);
  buildHierarchy(
    currentAreaPath: string,
    _relations: AssetRelation[],
  ): AreaNode | null;
  private isFile;
  private extractInstanceClass;
  private cleanWikiLink;
  private collectAllAreasFromVault;
  private extractParentPath;
  private isArchived;
  private buildTree;
}
//# sourceMappingURL=AreaHierarchyBuilder.d.ts.map
