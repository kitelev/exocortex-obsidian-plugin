import { TFile, Vault } from "obsidian";
export declare class ConceptCreationService {
    private vault;
    constructor(vault: Vault);
    createNarrowerConcept(parentFile: TFile, fileName: string, definition: string, aliases: string[]): Promise<TFile>;
    private generateConceptFrontmatter;
}
//# sourceMappingURL=ConceptCreationService.d.ts.map