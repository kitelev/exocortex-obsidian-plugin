import { IVaultAdapter, IFile } from "../interfaces/IVaultAdapter";
export declare class ProjectCreationService {
    private vault;
    constructor(vault: IVaultAdapter);
    createProject(sourceFile: IFile, sourceMetadata: Record<string, any>, sourceClass: string, label?: string): Promise<IFile>;
    generateProjectFrontmatter(sourceMetadata: Record<string, any>, sourceName: string, sourceClass: string, label?: string, uid?: string): Record<string, any>;
}
//# sourceMappingURL=ProjectCreationService.d.ts.map