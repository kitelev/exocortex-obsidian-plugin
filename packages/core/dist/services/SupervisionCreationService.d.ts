import { TFile, Vault } from "obsidian";
import { SupervisionFormData } from "../types/SupervisionFormData";
export declare class SupervisionCreationService {
    private vault;
    constructor(vault: Vault);
    createSupervision(formData: SupervisionFormData): Promise<TFile>;
    generateFrontmatter(uid: string): Record<string, any>;
    generateBody(formData: SupervisionFormData): string;
    private buildFileContent;
}
//# sourceMappingURL=SupervisionCreationService.d.ts.map