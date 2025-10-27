import { SupervisionFormData } from "../types/SupervisionFormData";
import { IVaultAdapter, IFile } from "../interfaces/IVaultAdapter";
export declare class SupervisionCreationService {
    private vault;
    constructor(vault: IVaultAdapter);
    createSupervision(formData: SupervisionFormData): Promise<IFile>;
    generateFrontmatter(uid: string): Record<string, any>;
    generateBody(formData: SupervisionFormData): string;
    private buildFileContent;
}
//# sourceMappingURL=SupervisionCreationService.d.ts.map