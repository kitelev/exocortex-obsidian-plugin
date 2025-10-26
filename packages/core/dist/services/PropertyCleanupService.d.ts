import { TFile, Vault } from "obsidian";
/**
 * Service for cleaning empty properties from file frontmatter
 */
export declare class PropertyCleanupService {
    private vault;
    constructor(vault: Vault);
    /**
     * Remove all empty properties from file frontmatter
     * Empty properties are: null, undefined, "", [], {}
     */
    cleanEmptyProperties(file: TFile): Promise<void>;
    /**
     * Remove empty properties from file content
     */
    private removeEmptyPropertiesFromContent;
    /**
     * Check if a value string represents an empty value
     */
    private isEmptyValue;
}
//# sourceMappingURL=PropertyCleanupService.d.ts.map