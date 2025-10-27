import { IVaultAdapter, IFile } from "../interfaces/IVaultAdapter";
export declare class TaskCreationService {
    private vault;
    private frontmatterGenerator;
    private algorithmExtractor;
    constructor(vault: IVaultAdapter);
    createTask(sourceFile: IFile, sourceMetadata: Record<string, any>, sourceClass: string, label?: string, taskSize?: string | null): Promise<IFile>;
    createRelatedTask(sourceFile: IFile, sourceMetadata: Record<string, any>, label?: string, taskSize?: string | null): Promise<IFile>;
    generateTaskFrontmatter(sourceMetadata: Record<string, any>, sourceName: string, sourceClass: string, label?: string, uid?: string, taskSize?: string | null): Record<string, any>;
    private generateRelatedTaskFrontmatter;
    private extractH2Section;
    private addRelationToSourceFile;
    private addRelationToFrontmatter;
}
//# sourceMappingURL=TaskCreationService.d.ts.map