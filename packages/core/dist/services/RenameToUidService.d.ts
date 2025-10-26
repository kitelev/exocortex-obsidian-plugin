import { TFile, App } from "obsidian";
export declare class RenameToUidService {
    private app;
    constructor(app: App);
    renameToUid(file: TFile, metadata: Record<string, any>): Promise<void>;
    private updateLabel;
}
//# sourceMappingURL=RenameToUidService.d.ts.map