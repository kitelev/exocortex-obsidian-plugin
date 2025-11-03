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
  constructor(private vault: IVaultAdapter) {}

  /**
   * Create a session start event when user activates a focus area
   * @param areaName - Name of the area being activated
   * @param areaFile - Optional file reference for the area
   * @returns Created event file
   */
  async createSessionStartEvent(
    areaName: string,
    areaFile: IFile | null,
  ): Promise<IFile> {
    const uid = uuidv4();
    const timestamp = DateFormatter.toLocalTimestamp(new Date());
    const label = `Session Start - ${areaName}`;

    const frontmatter = {
      exo__Asset_uid: uid,
      exo__Asset_label: label,
      exo__Asset_createdAt: timestamp,
      exo__Asset_isDefinedBy: '"[[Ontology/EMS]]"',
      exo__Instance_class: [`"[[${AssetClass.SESSION_START_EVENT}]]"`],
      ems__SessionEvent_timestamp: timestamp,
      ems__Session_area: `"[[${areaName}]]"`,
      aliases: [label],
    };

    const fileContent = MetadataHelpers.buildFileContent(frontmatter);
    const folderPath = areaFile?.parent?.path || "Events";
    const filePath = `${folderPath}/${uid}.md`;

    return await this.vault.create(filePath, fileContent);
  }

  /**
   * Create a session end event when user deactivates a focus area
   * @param areaName - Name of the area being deactivated
   * @param areaFile - Optional file reference for the area
   * @returns Created event file
   */
  async createSessionEndEvent(
    areaName: string,
    areaFile: IFile | null,
  ): Promise<IFile> {
    const uid = uuidv4();
    const timestamp = DateFormatter.toLocalTimestamp(new Date());
    const label = `Session End - ${areaName}`;

    const frontmatter = {
      exo__Asset_uid: uid,
      exo__Asset_label: label,
      exo__Asset_createdAt: timestamp,
      exo__Asset_isDefinedBy: '"[[Ontology/EMS]]"',
      exo__Instance_class: [`"[[${AssetClass.SESSION_END_EVENT}]]"`],
      ems__SessionEvent_timestamp: timestamp,
      ems__Session_area: `"[[${areaName}]]"`,
      aliases: [label],
    };

    const fileContent = MetadataHelpers.buildFileContent(frontmatter);
    const folderPath = areaFile?.parent?.path || "Events";
    const filePath = `${folderPath}/${uid}.md`;

    return await this.vault.create(filePath, fileContent);
  }
}
