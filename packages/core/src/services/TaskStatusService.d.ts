import { TFile, Vault } from "obsidian";
export declare class TaskStatusService {
    private vault;
    private frontmatterService;
    private workflow;
    private timestampService;
    constructor(vault: Vault);
    setDraftStatus(taskFile: TFile): Promise<void>;
    moveToBacklog(taskFile: TFile): Promise<void>;
    moveToAnalysis(projectFile: TFile): Promise<void>;
    moveToToDo(projectFile: TFile): Promise<void>;
    startEffort(taskFile: TFile): Promise<void>;
    markTaskAsDone(taskFile: TFile): Promise<void>;
    syncEffortEndTimestamp(taskFile: TFile, date?: Date): Promise<void>;
    trashEffort(taskFile: TFile): Promise<void>;
    archiveTask(taskFile: TFile): Promise<void>;
    planOnToday(taskFile: TFile): Promise<void>;
    planForEvening(taskFile: TFile): Promise<void>;
    shiftDayBackward(taskFile: TFile): Promise<void>;
    shiftDayForward(taskFile: TFile): Promise<void>;
    rollbackStatus(taskFile: TFile): Promise<void>;
    private updateStatus;
    private shiftDay;
    private parseDateFromWikilink;
    private extractEffortDay;
    private extractCurrentStatus;
    private extractInstanceClass;
}
//# sourceMappingURL=TaskStatusService.d.ts.map