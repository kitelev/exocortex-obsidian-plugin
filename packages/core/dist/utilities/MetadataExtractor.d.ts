import { TFile, MetadataCache, CachedMetadata } from "obsidian";
import { CommandVisibilityContext } from "../domain/commands/CommandVisibility";
export declare class MetadataExtractor {
    private metadataCache;
    constructor(metadataCache: MetadataCache);
    extractMetadata(file: TFile | null): Record<string, any>;
    extractInstanceClass(metadata: Record<string, any>): string | string[] | null;
    extractStatus(metadata: Record<string, any>): string | string[] | null;
    extractIsArchived(metadata: Record<string, any>): boolean;
    static extractIsDefinedBy(sourceMetadata: Record<string, any>): string;
    extractExpectedFolder(metadata: Record<string, any>): string | null;
    extractCommandVisibilityContext(file: TFile): CommandVisibilityContext;
    extractCache(file: TFile | null): CachedMetadata | null;
}
//# sourceMappingURL=MetadataExtractor.d.ts.map