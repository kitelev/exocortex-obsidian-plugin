import { CommandVisibilityContext } from "../domain/commands/CommandVisibility";
import { IVaultAdapter, IFile } from "../interfaces/IVaultAdapter";
export declare class MetadataExtractor {
  private vault;
  constructor(vault: IVaultAdapter);
  extractMetadata(file: IFile | null): Record<string, any>;
  extractInstanceClass(metadata: Record<string, any>): string | string[] | null;
  extractStatus(metadata: Record<string, any>): string | string[] | null;
  extractIsArchived(metadata: Record<string, any>): boolean;
  static extractIsDefinedBy(sourceMetadata: Record<string, any>): string;
  extractExpectedFolder(metadata: Record<string, any>): string | null;
  extractCommandVisibilityContext(file: IFile): CommandVisibilityContext;
  extractCache(file: IFile | null): any | null;
}
//# sourceMappingURL=MetadataExtractor.d.ts.map
