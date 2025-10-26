import { TFile, Vault } from "obsidian";
export declare class ProjectCreationService {
    private vault;
    constructor(vault: Vault);
    createProject(sourceFile: TFile, sourceMetadata: Record<string, any>, sourceClass: string, label?: string): Promise<TFile>;
    generateProjectFrontmatter(sourceMetadata: Record<string, any>, sourceName: string, sourceClass: string, label?: string, uid?: string): Record<string, any>;
}
//# sourceMappingURL=ProjectCreationService.d.ts.map