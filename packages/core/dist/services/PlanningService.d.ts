import { IVaultAdapter } from "../interfaces/IVaultAdapter";
export declare class PlanningService {
    private vault;
    private frontmatterService;
    constructor(vault: IVaultAdapter);
    planOnToday(taskPath: string): Promise<void>;
    private isFile;
}
//# sourceMappingURL=PlanningService.d.ts.map