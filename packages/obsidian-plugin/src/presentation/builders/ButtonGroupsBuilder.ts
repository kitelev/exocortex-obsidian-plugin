import { TFile } from "obsidian";
import { ILogger } from '../../adapters/logging/ILogger';
import { ExocortexSettings } from "../../domain/settings/ExocortexSettings";
import { ButtonGroup, ActionButton } from "../components/ActionButtonsGroup";
import {
  canCreateTask,
  canCreateProject,
  canCreateChildArea,
  canCreateInstance,
  canCreateRelatedTask,
  canCreateNarrowerConcept,
  canSetDraftStatus,
  canMoveToBacklog,
  canMoveToAnalysis,
  canMoveToToDo,
  canStartEffort,
  canMarkDone,
  canPlanOnToday,
  canPlanForEvening,
  canShiftDayBackward,
  canShiftDayForward,
  canTrashEffort,
  canArchiveTask,
  canCleanProperties,
  canRepairFolder,
  canRenameToUid,
  canVoteOnEffort,
  canRollbackStatus,
  canSetActiveFocus,
  canCopyLabelToAliases,
  CommandVisibilityContext,
} from '@exocortex/core';
import { LabelInputModal, type LabelInputModalResult } from "../modals/LabelInputModal";
import { NarrowerConceptModal, type NarrowerConceptModalResult } from "../modals/NarrowerConceptModal";
import { TaskCreationService } from '@exocortex/core';
import { ProjectCreationService } from '@exocortex/core';
import { AreaCreationService } from '@exocortex/core';
import { ConceptCreationService } from '@exocortex/core';
import { TaskStatusService } from '@exocortex/core';
import { PropertyCleanupService } from '@exocortex/core';
import { FolderRepairService } from '@exocortex/core';
import { RenameToUidService } from '@exocortex/core';
import { EffortVotingService } from '@exocortex/core';
import { LabelToAliasService } from '@exocortex/core';
import { WikiLinkHelpers } from '@exocortex/core';
import { AssetClass } from '@exocortex/core';
import { MetadataExtractor } from '@exocortex/core';
import { DateFormatter } from '@exocortex/core';

 
type ObsidianApp = any;

export class ButtonGroupsBuilder {
  constructor(
    private app: ObsidianApp,
    private settings: ExocortexSettings,
    private plugin: any,
    private taskCreationService: TaskCreationService,
    private projectCreationService: ProjectCreationService,
    private areaCreationService: AreaCreationService,
    private conceptCreationService: ConceptCreationService,
    private taskStatusService: TaskStatusService,
    private propertyCleanupService: PropertyCleanupService,
    private folderRepairService: FolderRepairService,
    private renameToUidService: RenameToUidService,
    private effortVotingService: EffortVotingService,
    private labelToAliasService: LabelToAliasService,
    private metadataExtractor: MetadataExtractor,
    private logger: ILogger,
    private refresh: () => Promise<void>,
  ) {}

  private generateDefaultMeetingLabel(metadata: Record<string, any>, fileName: string): string {
    const baseLabel = metadata.exo__Asset_label || fileName;
    const dateStr = DateFormatter.toDateString(new Date());
    return `${baseLabel} ${dateStr}`;
  }

  public async build(file: TFile): Promise<ButtonGroup[]> {
    const metadata = this.metadataExtractor.extractMetadata(file);
    const instanceClass = this.metadataExtractor.extractInstanceClass(metadata);
    const currentStatus = this.metadataExtractor.extractStatus(metadata);
    const isArchived = this.metadataExtractor.extractIsArchived(metadata);
    const currentFolder = file.parent?.path || "";
    const expectedFolder = await this.folderRepairService.getExpectedFolder(file, metadata);

    const context: CommandVisibilityContext = {
      instanceClass,
      currentStatus,
      metadata,
      isArchived,
      currentFolder,
      expectedFolder,
    };

    const groups: ButtonGroup[] = [];

    const creationButtons: ActionButton[] = [
      {
        id: "create-task",
        label: "Create Task",
        variant: "primary",
        visible: canCreateTask(context),
        onClick: async () => {
          const result = await new Promise<LabelInputModalResult>((resolve) => {
            new LabelInputModal(this.app, resolve).open();
          });
          if (result.label === null) return;

          const sourceClass = WikiLinkHelpers.normalize(
            Array.isArray(instanceClass) ? instanceClass[0] : instanceClass
          );

          const createdFile = await this.taskCreationService.createTask(file, metadata, sourceClass, result.label, result.taskSize);
          const leaf = this.app.workspace.getLeaf("tab");
          await leaf.openFile(createdFile);
          this.app.workspace.setActiveLeaf(leaf, { focus: true });
          this.logger.info(`Created Task from ${sourceClass}: ${createdFile.path}`);
        },
      },
      {
        id: "create-project",
        label: "Create Project",
        variant: "primary",
        visible: canCreateProject(context),
        onClick: async () => {
          const result = await new Promise<LabelInputModalResult>((resolve) => {
            new LabelInputModal(this.app, resolve).open();
          });
          if (result.label === null) return;

          const sourceClass = WikiLinkHelpers.normalize(
            Array.isArray(instanceClass) ? instanceClass[0] : instanceClass
          );

          const createdFile = await this.projectCreationService.createProject(file, metadata, sourceClass, result.label);
          const leaf = this.app.workspace.getLeaf("tab");
          await leaf.openFile(createdFile);
          this.app.workspace.setActiveLeaf(leaf, { focus: true });
          this.logger.info(`Created Project from ${sourceClass}: ${createdFile.path}`);
        },
      },
      {
        id: "create-area",
        label: "Create Area",
        variant: "primary",
        visible: canCreateChildArea(context),
        onClick: async () => {
          const result = await new Promise<LabelInputModalResult>((resolve) => {
            new LabelInputModal(this.app, resolve).open();
          });
          if (result.label === null) return;

          const createdFile = await this.areaCreationService.createChildArea(file, metadata, result.label);
          const leaf = this.app.workspace.getLeaf("tab");
          await leaf.openFile(createdFile);
          this.app.workspace.setActiveLeaf(leaf, { focus: true });
          this.logger.info(`Created child Area: ${createdFile.path}`);
        },
      },
      {
        id: "create-instance",
        label: "Create Instance",
        variant: "primary",
        visible: canCreateInstance(context),
        onClick: async () => {
          const sourceClass = WikiLinkHelpers.normalize(
            Array.isArray(instanceClass) ? instanceClass[0] : instanceClass
          );

          const defaultValue = sourceClass === AssetClass.MEETING_PROTOTYPE || sourceClass === AssetClass.TASK_PROTOTYPE
            ? this.generateDefaultMeetingLabel(metadata, file.basename)
            : "";

          const showTaskSize = sourceClass !== AssetClass.MEETING_PROTOTYPE;

          const result = await new Promise<LabelInputModalResult>((resolve) => {
            new LabelInputModal(this.app, resolve, defaultValue, showTaskSize).open();
          });
          if (result.label === null) return;

          const createdFile = await this.taskCreationService.createTask(file, metadata, sourceClass, result.label, result.taskSize);
          const leaf = this.app.workspace.getLeaf("tab");
          await leaf.openFile(createdFile);
          this.app.workspace.setActiveLeaf(leaf, { focus: true });
          this.logger.info(`Created Instance from TaskPrototype: ${createdFile.path}`);
        },
      },
      {
        id: "create-related-task",
        label: "Create Related Task",
        variant: "primary",
        visible: canCreateRelatedTask(context),
        onClick: async () => {
          const result = await new Promise<LabelInputModalResult>((resolve) => {
            new LabelInputModal(this.app, resolve).open();
          });
          if (result.label === null) return;

          const createdFile = await this.taskCreationService.createRelatedTask(file, metadata, result.label, result.taskSize);
          const leaf = this.app.workspace.getLeaf("tab");
          await leaf.openFile(createdFile);
          this.app.workspace.setActiveLeaf(leaf, { focus: true });
          this.logger.info(`Created Related Task: ${createdFile.path}`);
        },
      },
      {
        id: "create-narrower-concept",
        label: "Create Narrower Concept",
        variant: "primary",
        visible: canCreateNarrowerConcept(context),
        onClick: async () => {
          const result = await new Promise<NarrowerConceptModalResult>((resolve) => {
            new NarrowerConceptModal(this.app, resolve).open();
          });
          if (result.fileName === null || result.definition === null) return;

          const createdFile = await this.conceptCreationService.createNarrowerConcept(
            file,
            result.fileName,
            result.definition,
            result.aliases,
          );
          const leaf = this.app.workspace.getLeaf("tab");
          await leaf.openFile(createdFile);
          this.app.workspace.setActiveLeaf(leaf, { focus: true });
          this.logger.info(`Created Narrower Concept: ${createdFile.path}`);
        },
      },
    ];

    if (creationButtons.some(btn => btn.visible)) {
      groups.push({
        id: "creation",
        title: "Creation",
        buttons: creationButtons,
      });
    }

    const statusButtons: ActionButton[] = [
      {
        id: "set-draft-status",
        label: "Set Draft Status",
        variant: "secondary",
        visible: canSetDraftStatus(context),
        onClick: async () => {
          await this.taskStatusService.setDraftStatus(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Set Draft status: ${file.path}`);
        },
      },
      {
        id: "move-to-backlog",
        label: "Move to Backlog",
        variant: "secondary",
        visible: canMoveToBacklog(context),
        onClick: async () => {
          await this.taskStatusService.moveToBacklog(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Moved to Backlog: ${file.path}`);
        },
      },
      {
        id: "move-to-analysis",
        label: "Move to Analysis",
        variant: "secondary",
        visible: canMoveToAnalysis(context),
        onClick: async () => {
          await this.taskStatusService.moveToAnalysis(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Moved to Analysis: ${file.path}`);
        },
      },
      {
        id: "move-to-todo",
        label: "Move to ToDo",
        variant: "secondary",
        visible: canMoveToToDo(context),
        onClick: async () => {
          await this.taskStatusService.moveToToDo(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Moved to ToDo: ${file.path}`);
        },
      },
      {
        id: "start-effort",
        label: "Start Effort",
        variant: "secondary",
        visible: canStartEffort(context),
        onClick: async () => {
          await this.taskStatusService.startEffort(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Started effort: ${file.path}`);
        },
      },
      {
        id: "mark-done",
        label: "Mark Done",
        variant: "success",
        visible: canMarkDone(context),
        onClick: async () => {
          await this.taskStatusService.markTaskAsDone(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Marked task as Done: ${file.path}`);
        },
      },
      {
        id: "rollback-status",
        label: "Rollback Status",
        variant: "warning",
        visible: canRollbackStatus(context),
        onClick: async () => {
          await this.taskStatusService.rollbackStatus(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Rolled back status: ${file.path}`);
        },
      },
    ];

    if (statusButtons.some(btn => btn.visible)) {
      groups.push({
        id: "status",
        title: "Status",
        buttons: statusButtons,
      });
    }

    const planningButtons: ActionButton[] = [
      {
        id: "set-active-focus",
        label: this.settings.activeFocusArea === file.basename ? "Clear Active Focus" : "Set Active Focus",
        variant: "warning",
        visible: canSetActiveFocus(context),
        onClick: async () => {
          if (this.settings.activeFocusArea === file.basename) {
            this.settings.activeFocusArea = null;
          } else {
            this.settings.activeFocusArea = file.basename;
          }
          await this.plugin.saveSettings();
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Active focus area set to: ${this.settings.activeFocusArea}`);
        },
      },
      {
        id: "plan-on-today",
        label: "Plan on Today",
        variant: "warning",
        visible: canPlanOnToday(context),
        onClick: async () => {
          await this.taskStatusService.planOnToday(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Planned on today: ${file.path}`);
        },
      },
      {
        id: "plan-for-evening",
        label: "Plan for Evening (19:00)",
        variant: "warning",
        visible: canPlanForEvening(context),
        onClick: async () => {
          await this.taskStatusService.planForEvening(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Planned for evening: ${file.path}`);
        },
      },
      {
        id: "shift-day-backward",
        label: "Shift Day ◀",
        variant: "warning",
        visible: canShiftDayBackward(context),
        onClick: async () => {
          await this.taskStatusService.shiftDayBackward(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Day shifted backward: ${file.path}`);
        },
      },
      {
        id: "shift-day-forward",
        label: "Shift Day ▶",
        variant: "warning",
        visible: canShiftDayForward(context),
        onClick: async () => {
          await this.taskStatusService.shiftDayForward(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Day shifted forward: ${file.path}`);
        },
      },
      {
        id: "vote-on-effort",
        label: metadata.ems__Effort_votes && typeof metadata.ems__Effort_votes === "number" && metadata.ems__Effort_votes > 0
          ? `Vote (${metadata.ems__Effort_votes})`
          : "Vote",
        variant: "warning",
        visible: canVoteOnEffort(context),
        onClick: async () => {
          const newVoteCount = await this.effortVotingService.incrementEffortVotes(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Voted on effort: ${file.path} (votes: ${newVoteCount})`);
        },
      },
    ];

    if (planningButtons.some(btn => btn.visible)) {
      groups.push({
        id: "planning",
        title: "Planning",
        buttons: planningButtons,
      });
    }

    const maintenanceButtons: ActionButton[] = [
      {
        id: "trash",
        label: "Trash",
        variant: "danger",
        visible: canTrashEffort(context),
        onClick: async () => {
          await this.taskStatusService.trashEffort(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Trashed effort: ${file.path}`);
        },
      },
      {
        id: "archive",
        label: "Archive",
        variant: "danger",
        visible: canArchiveTask(context),
        onClick: async () => {
          await this.taskStatusService.archiveTask(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Archived task: ${file.path}`);
        },
      },
      {
        id: "clean-properties",
        label: "Clean Properties",
        variant: "secondary",
        visible: canCleanProperties(context),
        onClick: async () => {
          await this.propertyCleanupService.cleanEmptyProperties(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Cleaned empty properties: ${file.path}`);
        },
      },
      {
        id: "repair-folder",
        label: "Repair Folder",
        variant: "secondary",
        visible: canRepairFolder(context),
        onClick: async () => {
          if (expectedFolder) {
            await this.folderRepairService.repairFolder(file, expectedFolder);
            await new Promise((resolve) => setTimeout(resolve, 100));
            await this.refresh();
            this.logger.info(`Repaired folder for ${file.path}: ${currentFolder} -> ${expectedFolder}`);
          }
        },
      },
      {
        id: "rename-to-uid",
        label: "Rename to UID",
        variant: "secondary",
        visible: canRenameToUid(context, file.basename),
        onClick: async () => {
          const oldName = file.basename;
          const uid = metadata.exo__Asset_uid;
          await this.renameToUidService.renameToUid(file, metadata);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Renamed "${oldName}" to "${uid}"`);
        },
      },
      {
        id: "copy-label-to-aliases",
        label: "Copy Label to Aliases",
        variant: "secondary",
        visible: canCopyLabelToAliases(context),
        onClick: async () => {
          await this.labelToAliasService.copyLabelToAliases(file);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await this.refresh();
          this.logger.info(`Copied label to aliases: ${file.path}`);
        },
      },
    ];

    if (maintenanceButtons.some(btn => btn.visible)) {
      groups.push({
        id: "maintenance",
        title: "Maintenance",
        buttons: maintenanceButtons,
      });
    }

    return groups;
  }
}
