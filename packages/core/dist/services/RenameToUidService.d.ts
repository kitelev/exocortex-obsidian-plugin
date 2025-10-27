import { IVaultAdapter, IFile } from "../interfaces/IVaultAdapter";
export declare class RenameToUidService {
    private vault;
    constructor(vault: IVaultAdapter);
    renameToUid(file: IFile, metadata: Record<string, any>): Promise<void>;
    private updateLabel;
}
//# sourceMappingURL=RenameToUidService.d.ts.map