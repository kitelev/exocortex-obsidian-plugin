import { IFileSystemAdapter } from "../../infrastructure/interfaces/IFileSystemAdapter";
export declare class TaskStatusService {
    private fs;
    private frontmatterService;
    constructor(fs: IFileSystemAdapter);
    setDraftStatus(taskFilePath: string): Promise<void>;
    moveToBacklog(taskFilePath: string): Promise<void>;
    moveToAnalysis(projectFilePath: string): Promise<void>;
    moveToToDo(projectFilePath: string): Promise<void>;
    startEffort(taskFilePath: string): Promise<void>;
    markTaskAsDone(taskFilePath: string): Promise<void>;
    syncEffortEndTimestamp(taskFilePath: string, date?: Date): Promise<void>;
    trashEffort(taskFilePath: string): Promise<void>;
    archiveTask(taskFilePath: string): Promise<void>;
    planOnToday(taskFilePath: string): Promise<void>;
    planForEvening(taskFilePath: string): Promise<void>;
    shiftDayBackward(taskFilePath: string): Promise<void>;
    shiftDayForward(taskFilePath: string): Promise<void>;
    rollbackStatus(taskFilePath: string): Promise<void>;
    private parseDateFromWikilink;
    private extractEffortDay;
    private extractCurrentStatus;
    private getPreviousStatusFromWorkflow;
    private hasInstanceClass;
    private extractInstanceClass;
}
//# sourceMappingURL=TaskStatusService.d.ts.map