import { TFile } from "obsidian";
import { ILogger } from "../../../adapters/logging/ILogger";
import { ExocortexSettings } from "../../../domain/settings/ExocortexSettings";
import { ActionButton, ButtonGroup } from "../../components/ActionButtonsGroup";
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

type ObsidianApp = any;

/**
 * Context passed to button group builders
 */
export interface ButtonBuilderContext {
  app: ObsidianApp;
  settings: ExocortexSettings;
  plugin: any;
  file: TFile;
  metadata: Record<string, any>;
  instanceClass: string | string[] | null;
  visibilityContext: CommandVisibilityContext;
  logger: ILogger;
  refresh: () => Promise<void>;
}

/**
 * Services container for button actions
 */
export interface ButtonBuilderServices {
  taskCreationService: TaskCreationService;
  projectCreationService: ProjectCreationService;
  areaCreationService: AreaCreationService;
  classCreationService: ClassCreationService;
  conceptCreationService: ConceptCreationService;
  taskStatusService: TaskStatusService;
  propertyCleanupService: PropertyCleanupService;
  folderRepairService: FolderRepairService;
  renameToUidService: RenameToUidService;
  effortVotingService: EffortVotingService;
  labelToAliasService: LabelToAliasService;
  assetConversionService: AssetConversionService;
}

/**
 * Interface for button group builders
 */
export interface IButtonGroupBuilder {
  build(context: ButtonBuilderContext): ActionButton[];
  getGroupId(): string;
  getGroupTitle(): string;
}

/**
 * Helper to create button group if it has visible buttons
 */
export function createButtonGroupIfVisible(
  builder: IButtonGroupBuilder,
  context: ButtonBuilderContext,
): ButtonGroup | null {
  const buttons = builder.build(context);
  if (buttons.some((btn) => btn.visible)) {
    return {
      id: builder.getGroupId(),
      title: builder.getGroupTitle(),
      buttons,
    };
  }
  return null;
}
