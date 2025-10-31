import { IVaultAdapter, IFile } from "../interfaces/IVaultAdapter";
export declare class LabelToAliasService {
  private vault;
  constructor(vault: IVaultAdapter);
  copyLabelToAliases(file: IFile): Promise<void>;
  private extractLabel;
  private addLabelToAliases;
}
//# sourceMappingURL=LabelToAliasService.d.ts.map
