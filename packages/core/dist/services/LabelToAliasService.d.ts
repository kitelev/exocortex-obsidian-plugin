import { TFile, Vault } from "obsidian";
export declare class LabelToAliasService {
    private vault;
    constructor(vault: Vault);
    copyLabelToAliases(file: TFile): Promise<void>;
    private extractLabel;
    private addLabelToAliases;
}
//# sourceMappingURL=LabelToAliasService.d.ts.map