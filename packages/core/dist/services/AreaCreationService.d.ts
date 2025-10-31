import { IVaultAdapter, IFile } from "../interfaces/IVaultAdapter";
export declare class AreaCreationService {
  private vault;
  constructor(vault: IVaultAdapter);
  createChildArea(
    sourceFile: IFile,
    sourceMetadata: Record<string, any>,
    label?: string,
  ): Promise<IFile>;
  generateChildAreaFrontmatter(
    sourceMetadata: Record<string, any>,
    sourceName: string,
    label?: string,
    uid?: string,
  ): Record<string, any>;
}
//# sourceMappingURL=AreaCreationService.d.ts.map
