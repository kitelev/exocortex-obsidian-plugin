import { TFile, Vault } from "obsidian";
export declare class AreaCreationService {
    private vault;
    constructor(vault: Vault);
    createChildArea(sourceFile: TFile, sourceMetadata: Record<string, any>, label?: string): Promise<TFile>;
    generateChildAreaFrontmatter(sourceMetadata: Record<string, any>, sourceName: string, label?: string, uid?: string): Record<string, any>;
}
//# sourceMappingURL=AreaCreationService.d.ts.map