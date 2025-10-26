import { TFile, Vault } from "obsidian";
export declare class TaskCreationService {
    private vault;
    private frontmatterGenerator;
    private algorithmExtractor;
    constructor(vault: Vault);
    createTask(sourceFile: TFile, sourceMetadata: Record<string, any>, sourceClass: string, label?: string, taskSize?: string | null): Promise<TFile>;
    createRelatedTask(sourceFile: TFile, sourceMetadata: Record<string, any>, label?: string, taskSize?: string | null): Promise<TFile>;
    generateTaskFrontmatter(sourceMetadata: Record<string, any>, sourceName: string, sourceClass: string, label?: string, uid?: string, taskSize?: string | null): Record<string, any>;
    private _generateRelatedTaskFrontmatter;
    private _extractH2Section;
    private addRelationToSourceFile;
    private addRelationToFrontmatter;
}
//# sourceMappingURL=TaskCreationService.d.ts.map