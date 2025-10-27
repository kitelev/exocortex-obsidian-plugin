import { IVaultAdapter, IFile } from "../interfaces/IVaultAdapter";
/**
 * Service for cleaning empty properties from file frontmatter
 */
export declare class PropertyCleanupService {
    private vault;
    constructor(vault: IVaultAdapter);
    /**
     * Remove all empty properties from file frontmatter
     * Empty properties are: null, undefined, "", [], {}
     */
    cleanEmptyProperties(file: IFile): Promise<void>;
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