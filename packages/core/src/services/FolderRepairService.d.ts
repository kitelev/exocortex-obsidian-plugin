import { TFile, Vault } from "obsidian";
/**
 * Service for repairing asset folder locations based on exo__Asset_isDefinedBy references
 */
export declare class FolderRepairService {
    private vault;
    private app;
    constructor(vault: Vault, app: any);
    /**
     * Get the expected folder for an asset based on its exo__Asset_isDefinedBy property
     * Returns null if no expected folder can be determined
     */
    getExpectedFolder(file: TFile, metadata: Record<string, any>): Promise<string | null>;
    /**
     * Move asset to its expected folder based on exo__Asset_isDefinedBy
     */
    repairFolder(file: TFile, expectedFolder: string): Promise<void>;
    /**
     * Get the folder path for a file
     */
    private getFileFolder;
    /**
     * Extract reference from various formats:
     * - [[Reference]] -> Reference
     * - "[[Reference]]" -> Reference
     * - Reference -> Reference
     */
    private extractReference;
    /**
     * Ensure a folder exists, creating it if necessary
     */
    private ensureFolderExists;
}
//# sourceMappingURL=FolderRepairService.d.ts.map