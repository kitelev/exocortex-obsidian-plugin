import { v4 as uuidv4 } from "uuid";
import { IVaultAdapter, IFile } from "../interfaces/IVaultAdapter";
import { AssetClass } from "../domain/constants";
import { DateFormatter } from "../utilities/DateFormatter";
import { MetadataHelpers } from "../utilities/MetadataHelpers";

/**
 * Service for managing area focus session event tracking
 * Creates SessionStartEvent and SessionEndEvent assets when users activate/deactivate focus areas
 */
export class SessionEventService {
  constructor(
    private vault: IVaultAdapter,
    private defaultOntologyAsset: string | null = null,
  ) {}

  /**
   * Create a session start event when user activates a focus area
   * @param areaName - Name of the area being activated
   * @returns Created event file
   */
  async createSessionStartEvent(areaName: string): Promise<IFile> {
    return this.createSessionEvent(areaName, AssetClass.SESSION_START_EVENT);
  }

  /**
   * Create a session end event when user deactivates a focus area
   * @param areaName - Name of the area being deactivated
   * @returns Created event file
   */
  async createSessionEndEvent(areaName: string): Promise<IFile> {
    return this.createSessionEvent(areaName, AssetClass.SESSION_END_EVENT);
  }

  /**
   * Find the folder path where the ontology asset is located
   * @returns Folder path for ontology asset or "Events" as fallback
   */
  private async getOntologyAssetFolder(): Promise<string> {
    if (!this.defaultOntologyAsset) {
      return "Events";
    }

    const allFiles = this.vault.getAllFiles();
    
    for (const file of allFiles) {
      // Match by basename without extension
      if (file.basename === this.defaultOntologyAsset) {
        return file.parent?.path || "Events";
      }
    }
    
    // Fallback to "Events" if ontology asset not found
    return "Events";
  }

  /**
   * Private helper method to create session event assets
   * @param areaName - Name of the area
   * @param eventType - Type of session event (start or end)
   * @returns Created event file
   */
  private async createSessionEvent(
    areaName: string,
    eventType: AssetClass,
  ): Promise<IFile> {
    const uid = uuidv4();
    const timestamp = DateFormatter.toLocalTimestamp(new Date());

    const ontologyRef = this.defaultOntologyAsset
      ? `"[[${this.defaultOntologyAsset}]]"`
      : '"[[!kitelev]]"';

    const frontmatter = {
      exo__Asset_uid: uid,
      exo__Asset_createdAt: timestamp,
      exo__Asset_isDefinedBy: ontologyRef,
      exo__Instance_class: [`"[[${eventType}]]"`],
      ems__SessionEvent_timestamp: timestamp,
      ems__Session_area: `"[[${areaName}]]"`,
    };

    const fileContent = MetadataHelpers.buildFileContent(frontmatter);
    const folderPath = await this.getOntologyAssetFolder();
    const filePath = `${folderPath}/${uid}.md`;

    return await this.vault.create(filePath, fileContent);
  }
}
