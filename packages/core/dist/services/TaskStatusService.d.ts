import { IVaultAdapter, IFile } from "../interfaces/IVaultAdapter";
export declare class TaskStatusService {
    private vault;
    private frontmatterService;
    private workflow;
    private timestampService;
    constructor(vault: IVaultAdapter);
    setDraftStatus(taskFile: IFile): Promise<void>;
    moveToBacklog(taskFile: IFile): Promise<void>;
    moveToAnalysis(projectFile: IFile): Promise<void>;
    moveToToDo(projectFile: IFile): Promise<void>;
    startEffort(taskFile: IFile): Promise<void>;
    markTaskAsDone(taskFile: IFile): Promise<void>;
    syncEffortEndTimestamp(taskFile: IFile, date?: Date): Promise<void>;
    trashEffort(taskFile: IFile): Promise<void>;
    archiveTask(taskFile: IFile): Promise<void>;
    planOnToday(taskFile: IFile): Promise<void>;
    planForEvening(taskFile: IFile): Promise<void>;
    shiftDayBackward(taskFile: IFile): Promise<void>;
    shiftDayForward(taskFile: IFile): Promise<void>;
    rollbackStatus(taskFile: IFile): Promise<void>;
    private updateStatus;
    private shiftDay;
    private parseDateFromWikilink;
    private extractEffortDay;
    private extractCurrentStatus;
    private extractInstanceClass;
}
//# sourceMappingURL=TaskStatusService.d.ts.map