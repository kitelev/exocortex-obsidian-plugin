import { IFileSystemAdapter } from "../../infrastructure/interfaces/IFileSystemAdapter";
export declare class ProjectCreationService {
    private fs;
    constructor(fs: IFileSystemAdapter);
    createProject(sourceFilePath: string, sourceMetadata: Record<string, any>, sourceClass: string, label?: string): Promise<string>;
    generateProjectFrontmatter(sourceMetadata: Record<string, any>, sourceName: string, sourceClass: string, label?: string, uid?: string): Record<string, any>;
    private extractIsDefinedBy;
}
//# sourceMappingURL=ProjectCreationService.d.ts.map