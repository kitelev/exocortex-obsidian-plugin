import { IFileSystemAdapter } from "../../infrastructure/interfaces/IFileSystemAdapter";
export declare class TaskCreationService {
    private fs;
    constructor(fs: IFileSystemAdapter);
    private extractH2Section;
    createTask(sourceFilePath: string, sourceMetadata: Record<string, any>, sourceClass: string, label?: string, taskSize?: string | null): Promise<string>;
    createTaskFromArea(sourceFilePath: string, sourceMetadata: Record<string, any>): Promise<string>;
    createRelatedTask(sourceFilePath: string, sourceMetadata: Record<string, any>, label?: string, taskSize?: string | null): Promise<string>;
    private generateRelatedTaskFrontmatter;
    private addRelationToSourceFile;
    private addRelationToFrontmatter;
    generateTaskFrontmatter(sourceMetadata: Record<string, any>, sourceName: string, sourceClass: string, label?: string, uid?: string, taskSize?: string | null): Record<string, any>;
    generateTaskFileName(): string;
    private extractIsDefinedBy;
}
//# sourceMappingURL=TaskCreationService.d.ts.map