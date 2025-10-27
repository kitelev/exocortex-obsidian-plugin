import { IVaultAdapter, IFile } from "../interfaces/IVaultAdapter";
export declare class StatusTimestampService {
    private vault;
    private frontmatterService;
    constructor(vault: IVaultAdapter);
    addStartTimestamp(taskFile: IFile): Promise<void>;
    addEndTimestamp(taskFile: IFile, date?: Date): Promise<void>;
    addResolutionTimestamp(taskFile: IFile): Promise<void>;
    addEndAndResolutionTimestamps(taskFile: IFile, date?: Date): Promise<void>;
    removeStartTimestamp(taskFile: IFile): Promise<void>;
    removeEndTimestamp(taskFile: IFile): Promise<void>;
    removeResolutionTimestamp(taskFile: IFile): Promise<void>;
    removeEndAndResolutionTimestamps(taskFile: IFile): Promise<void>;
}
//# sourceMappingURL=StatusTimestampService.d.ts.map