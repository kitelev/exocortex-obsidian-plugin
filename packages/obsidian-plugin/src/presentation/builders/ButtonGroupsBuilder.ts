import { TFile } from "obsidian";
import { ILogger } from "../../adapters/logging/ILogger";
import { ExocortexSettings } from "../../domain/settings/ExocortexSettings";
import { ButtonGroup } from "../components/ActionButtonsGroup";
import { CommandVisibilityContext } from "@exocortex/core";
import { TaskCreationService } from "@exocortex/core";
import { ProjectCreationService } from "@exocortex/core";
import { AreaCreationService } from "@exocortex/core";
import { ClassCreationService } from "@exocortex/core";
import { ConceptCreationService } from "@exocortex/core";
import { TaskStatusService } from "@exocortex/core";
import { PropertyCleanupService } from "@exocortex/core";
import { FolderRepairService } from "@exocortex/core";
import { RenameToUidService } from "@exocortex/core";
import { EffortVotingService } from "@exocortex/core";
import { LabelToAliasService } from "@exocortex/core";
import { AssetConversionService } from "@exocortex/core";
import { MetadataExtractor } from "@exocortex/core";
import {
  ButtonBuilderContext,
  ButtonBuilderServices,
  IButtonGroupBuilder,
  createButtonGroupIfVisible,
  CreationButtonGroupBuilder,
  StatusButtonGroupBuilder,
  PlanningButtonGroupBuilder,
  MaintenanceButtonGroupBuilder,
} from "./button-groups";
import { ObsidianApp, ExocortexPluginInterface } from "../../types";

/**
 * Orchestrator for building button groups.
 *
 * Delegates to specialized button group builders:
 * - CreationButtonGroupBuilder: Create Task, Create Project, etc.
 * - StatusButtonGroupBuilder: Set Draft, Move to Backlog, etc.
 * - PlanningButtonGroupBuilder: Plan on Today, Vote, etc.
 * - MaintenanceButtonGroupBuilder: Trash, Archive, Clean Properties, etc.
 */
export class ButtonGroupsBuilder {
  private services: ButtonBuilderServices;
  private builders: IButtonGroupBuilder[];

  constructor(
    private app: ObsidianApp,
    private settings: ExocortexSettings,
    private plugin: ExocortexPluginInterface,
    taskCreationService: TaskCreationService,
    projectCreationService: ProjectCreationService,
    areaCreationService: AreaCreationService,
    classCreationService: ClassCreationService,
    conceptCreationService: ConceptCreationService,
    taskStatusService: TaskStatusService,
    propertyCleanupService: PropertyCleanupService,
    folderRepairService: FolderRepairService,
    renameToUidService: RenameToUidService,
    effortVotingService: EffortVotingService,
    labelToAliasService: LabelToAliasService,
    assetConversionService: AssetConversionService,
    private metadataExtractor: MetadataExtractor,
    private logger: ILogger,
    private refresh: () => Promise<void>,
  ) {
    // Aggregate services for button builders
    this.services = {
      taskCreationService,
      projectCreationService,
      areaCreationService,
      classCreationService,
      conceptCreationService,
      taskStatusService,
      propertyCleanupService,
      folderRepairService,
      renameToUidService,
      effortVotingService,
      labelToAliasService,
      assetConversionService,
    };

    // Initialize specialized builders
    this.builders = [
      new CreationButtonGroupBuilder(this.services),
      new StatusButtonGroupBuilder(this.services),
      new PlanningButtonGroupBuilder(this.services),
      new MaintenanceButtonGroupBuilder(this.services),
    ];
  }

  /**
   * Build all button groups for the given file.
   *
   * @param file - The file to build buttons for
   * @returns Array of button groups with visible buttons
   */
  public async build(file: TFile): Promise<ButtonGroup[]> {
    const metadata = this.metadataExtractor.extractMetadata(file);
    const instanceClass = this.metadataExtractor.extractInstanceClass(metadata);
    const currentStatus = this.metadataExtractor.extractStatus(metadata);
    const isArchived = this.metadataExtractor.extractIsArchived(metadata);
    const currentFolder = file.parent?.path || "";
    const expectedFolder = await this.services.folderRepairService.getExpectedFolder(
      file,
      metadata,
    );

    const visibilityContext: CommandVisibilityContext = {
      instanceClass,
      currentStatus,
      metadata,
      isArchived,
      currentFolder,
      expectedFolder,
    };

    const context: ButtonBuilderContext = {
      app: this.app,
      settings: this.settings,
      plugin: this.plugin,
      file,
      metadata,
      instanceClass,
      visibilityContext,
      logger: this.logger,
      refresh: this.refresh,
    };

    // Build groups from all builders, filtering out empty ones
    const groups: ButtonGroup[] = [];
    for (const builder of this.builders) {
      const group = createButtonGroupIfVisible(builder, context);
      if (group) {
        groups.push(group);
      }
    }

    return groups;
  }
}
