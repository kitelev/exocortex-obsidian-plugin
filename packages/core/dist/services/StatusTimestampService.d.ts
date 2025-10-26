import { TFile, Vault } from "obsidian";
export declare class StatusTimestampService {
    private vault;
    private frontmatterService;
    constructor(vault: Vault);
    addStartTimestamp(taskFile: TFile): Promise<void>;
    addEndTimestamp(taskFile: TFile, date?: Date): Promise<void>;
    addResolutionTimestamp(taskFile: TFile): Promise<void>;
    addEndAndResolutionTimestamps(taskFile: TFile, date?: Date): Promise<void>;
    removeStartTimestamp(taskFile: TFile): Promise<void>;
    removeEndTimestamp(taskFile: TFile): Promise<void>;
    removeResolutionTimestamp(taskFile: TFile): Promise<void>;
    removeEndAndResolutionTimestamps(taskFile: TFile): Promise<void>;
}
//# sourceMappingURL=StatusTimestampService.d.ts.map