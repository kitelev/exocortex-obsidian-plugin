import { App } from "obsidian";
import { ICommand } from "./ICommand";
import { ExocortexPluginInterface } from "../../types";
import { ObsidianVaultAdapter } from "../../adapters/ObsidianVaultAdapter";
import {
  TaskCreationService,
  ProjectCreationService,
  TaskStatusService,
  PropertyCleanupService,
  FolderRepairService,
  SupervisionCreationService,
  RenameToUidService,
  EffortVotingService,
  LabelToAliasService,
  AssetConversionService,
} from "@exocortex/core";

import { CreateTaskCommand } from "./CreateTaskCommand";
import { CreateProjectCommand } from "./CreateProjectCommand";
import { CreateInstanceCommand } from "./CreateInstanceCommand";
import { CreateRelatedTaskCommand } from "./CreateRelatedTaskCommand";
import { SetDraftStatusCommand } from "./SetDraftStatusCommand";
import { MoveToBacklogCommand } from "./MoveToBacklogCommand";
import { MoveToAnalysisCommand } from "./MoveToAnalysisCommand";
import { MoveToToDoCommand } from "./MoveToToDoCommand";
import { StartEffortCommand } from "./StartEffortCommand";
import { PlanOnTodayCommand } from "./PlanOnTodayCommand";
import { PlanForEveningCommand } from "./PlanForEveningCommand";
import { ShiftDayBackwardCommand } from "./ShiftDayBackwardCommand";
import { ShiftDayForwardCommand } from "./ShiftDayForwardCommand";
import { MarkDoneCommand } from "./MarkDoneCommand";
import { TrashEffortCommand } from "./TrashEffortCommand";
import { ArchiveTaskCommand } from "./ArchiveTaskCommand";
import { CleanPropertiesCommand } from "./CleanPropertiesCommand";
import { RepairFolderCommand } from "./RepairFolderCommand";
import { RenameToUidCommand } from "./RenameToUidCommand";
import { VoteOnEffortCommand } from "./VoteOnEffortCommand";
import { CopyLabelToAliasesCommand } from "./CopyLabelToAliasesCommand";
import { AddSupervisionCommand } from "./AddSupervisionCommand";
import { ReloadLayoutCommand } from "./ReloadLayoutCommand";
import { TogglePropertiesVisibilityCommand } from "./TogglePropertiesVisibilityCommand";
import { ToggleLayoutVisibilityCommand } from "./ToggleLayoutVisibilityCommand";
import { ToggleArchivedAssetsCommand } from "./ToggleArchivedAssetsCommand";
import { ConvertTaskToProjectCommand } from "./ConvertTaskToProjectCommand";
import { ConvertProjectToTaskCommand } from "./ConvertProjectToTaskCommand";

export class CommandRegistry {
  private commands: ICommand[] = [];
  private vaultAdapter: ObsidianVaultAdapter;

  constructor(
    app: App,
    plugin: ExocortexPluginInterface,
    reloadLayoutCallback?: () => void,
  ) {
    this.vaultAdapter = new ObsidianVaultAdapter(
      app.vault,
      app.metadataCache,
      app,
    );

    const taskCreationService = new TaskCreationService(this.vaultAdapter);
    const projectCreationService = new ProjectCreationService(
      this.vaultAdapter,
    );
    const taskStatusService = new TaskStatusService(this.vaultAdapter);
    const propertyCleanupService = new PropertyCleanupService(
      this.vaultAdapter,
    );
    const folderRepairService = new FolderRepairService(this.vaultAdapter);
    const supervisionCreationService = new SupervisionCreationService(
      this.vaultAdapter,
    );
    const renameToUidService = new RenameToUidService(this.vaultAdapter);
    const effortVotingService = new EffortVotingService(this.vaultAdapter);
    const labelToAliasService = new LabelToAliasService(this.vaultAdapter);
    const assetConversionService = new AssetConversionService(
      this.vaultAdapter,
    );

    this.commands = [
      new CreateTaskCommand(app, taskCreationService, this.vaultAdapter),
      new CreateProjectCommand(app, projectCreationService, this.vaultAdapter),
      new CreateInstanceCommand(app, taskCreationService, this.vaultAdapter),
      new CreateRelatedTaskCommand(app, taskCreationService, this.vaultAdapter),
      new SetDraftStatusCommand(taskStatusService),
      new MoveToBacklogCommand(taskStatusService),
      new MoveToAnalysisCommand(taskStatusService),
      new MoveToToDoCommand(taskStatusService),
      new StartEffortCommand(taskStatusService),
      new PlanOnTodayCommand(taskStatusService),
      new PlanForEveningCommand(taskStatusService),
      new ShiftDayBackwardCommand(taskStatusService),
      new ShiftDayForwardCommand(taskStatusService),
      new MarkDoneCommand(taskStatusService),
      new TrashEffortCommand(taskStatusService),
      new ArchiveTaskCommand(taskStatusService),
      new CleanPropertiesCommand(propertyCleanupService),
      new RepairFolderCommand(app, folderRepairService),
      new RenameToUidCommand(renameToUidService),
      new VoteOnEffortCommand(effortVotingService),
      new CopyLabelToAliasesCommand(labelToAliasService),
      new AddSupervisionCommand(
        app,
        supervisionCreationService,
        this.vaultAdapter,
      ),
      new ReloadLayoutCommand(reloadLayoutCallback),
      new TogglePropertiesVisibilityCommand(plugin),
      new ToggleLayoutVisibilityCommand(plugin),
      new ToggleArchivedAssetsCommand(plugin),
      new ConvertTaskToProjectCommand(assetConversionService),
      new ConvertProjectToTaskCommand(assetConversionService),
    ];
  }

  getAllCommands(): ICommand[] {
    return this.commands;
  }
}
