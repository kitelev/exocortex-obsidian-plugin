import { IVaultAdapter, IFile } from "../interfaces/IVaultAdapter";
export declare class ConceptCreationService {
    private vault;
    constructor(vault: IVaultAdapter);
    createNarrowerConcept(parentFile: IFile, fileName: string, definition: string, aliases: string[]): Promise<IFile>;
    private generateConceptFrontmatter;
}
//# sourceMappingURL=ConceptCreationService.d.ts.map