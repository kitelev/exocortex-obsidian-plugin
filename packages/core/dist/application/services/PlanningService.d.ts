import { IFileSystemAdapter } from "../../infrastructure/interfaces/IFileSystemAdapter";
export declare class PlanningService {
    private fs;
    private frontmatterService;
    constructor(fs: IFileSystemAdapter);
    planOnToday(taskFilePath: string): Promise<void>;
    planOnDate(taskFilePath: string, date: Date): Promise<void>;
    planForEvening(taskFilePath: string): Promise<void>;
    shiftDayBackward(taskFilePath: string): Promise<void>;
    shiftDayForward(taskFilePath: string): Promise<void>;
    private parseDateFromWikilink;
    private extractEffortDay;
}
//# sourceMappingURL=PlanningService.d.ts.map