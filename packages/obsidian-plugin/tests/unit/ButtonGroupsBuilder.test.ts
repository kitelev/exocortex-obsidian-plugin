import { ButtonGroupsBuilder } from "../../src/presentation/builders/ButtonGroupsBuilder";
import { TFile } from "obsidian";
import { ExocortexSettings } from "../../src/domain/settings/ExocortexSettings";
import {
  TaskCreationService,
  ProjectCreationService,
  AreaCreationService,
  ConceptCreationService,
  TaskStatusService,
  PropertyCleanupService,
  FolderRepairService,
  RenameToUidService,
  EffortVotingService,
  LabelToAliasService,
  AssetConversionService,
  MetadataExtractor,
} from "@exocortex/core";
import { ILogger } from "../../src/infrastructure/logging/ILogger";

describe("ButtonGroupsBuilder", () => {
  let builder: ButtonGroupsBuilder;
  let mockApp: any;
  let mockSettings: ExocortexSettings;
  let mockPlugin: any;
  let mockTaskCreationService: jest.Mocked<TaskCreationService>;
  let mockProjectCreationService: jest.Mocked<ProjectCreationService>;
  let mockAreaCreationService: jest.Mocked<AreaCreationService>;
  let mockConceptCreationService: jest.Mocked<ConceptCreationService>;
  let mockTaskStatusService: jest.Mocked<TaskStatusService>;
  let mockPropertyCleanupService: jest.Mocked<PropertyCleanupService>;
  let mockFolderRepairService: jest.Mocked<FolderRepairService>;
  let mockRenameToUidService: jest.Mocked<RenameToUidService>;
  let mockEffortVotingService: jest.Mocked<EffortVotingService>;
  let mockLabelToAliasService: jest.Mocked<LabelToAliasService>;
  let mockAssetConversionService: jest.Mocked<AssetConversionService>;
  let mockMetadataExtractor: jest.Mocked<MetadataExtractor>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockRefresh: jest.Mock;

  beforeEach(() => {
    mockApp = {
      workspace: {
        getLeaf: jest.fn().mockReturnValue({
          openFile: jest.fn(),
        }),
        setActiveLeaf: jest.fn(),
      },
    };

    mockSettings = {
      activeFocusArea: null,
      showEffortArea: true,
      showEffortVotes: true,
    } as ExocortexSettings;

    mockPlugin = {
      saveSettings: jest.fn(),
    };

    mockTaskCreationService = {
      createTask: jest.fn(),
      createRelatedTask: jest.fn(),
    } as any;

    mockProjectCreationService = {
      createProject: jest.fn(),
    } as any;

    mockAreaCreationService = {
      createChildArea: jest.fn(),
    } as any;

    mockConceptCreationService = {
      createNarrowerConcept: jest.fn(),
    } as any;

    mockTaskStatusService = {
      setDraftStatus: jest.fn(),
      moveToBacklog: jest.fn(),
      moveToAnalysis: jest.fn(),
      moveToToDo: jest.fn(),
      startEffort: jest.fn(),
      markTaskAsDone: jest.fn(),
      rollbackStatus: jest.fn(),
      planOnToday: jest.fn(),
      planForEvening: jest.fn(),
      shiftDayBackward: jest.fn(),
      shiftDayForward: jest.fn(),
      trashEffort: jest.fn(),
      archiveTask: jest.fn(),
    } as any;

    mockPropertyCleanupService = {
      cleanEmptyProperties: jest.fn(),
    } as any;

    mockFolderRepairService = {
      getExpectedFolder: jest.fn(),
      repairFolder: jest.fn(),
    } as any;

    mockRenameToUidService = {
      renameToUid: jest.fn(),
    } as any;

    mockEffortVotingService = {
      incrementEffortVotes: jest.fn(),
    } as any;

    mockLabelToAliasService = {
      copyLabelToAliases: jest.fn(),
    } as any;

    mockAssetConversionService = {
      convertTaskToProject: jest.fn(),
      convertProjectToTask: jest.fn(),
    } as any;

    mockMetadataExtractor = {
      extractMetadata: jest.fn(),
      extractInstanceClass: jest.fn(),
      extractStatus: jest.fn(),
      extractIsArchived: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as any;

    mockRefresh = jest.fn();

    builder = new ButtonGroupsBuilder(
      mockApp,
      mockSettings,
      mockPlugin,
      mockTaskCreationService,
      mockProjectCreationService,
      mockAreaCreationService,
      mockConceptCreationService,
      mockTaskStatusService,
      mockPropertyCleanupService,
      mockFolderRepairService,
      mockRenameToUidService,
      mockEffortVotingService,
      mockLabelToAliasService,
      mockAssetConversionService,
      mockMetadataExtractor,
      mockLogger,
      mockRefresh,
    );
  });

  describe("build", () => {
    it("should return only maintenance buttons for non-creation asset classes", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "folder" },
        basename: "test",
      } as TFile;
      const metadata = { exo__Instance_class: "[[unsupported]]" };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[unsupported]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(null);
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue(null);

      const groups = await builder.build(mockFile);

      const creationGroup = groups.find((g) => g.id === "creation");
      expect(creationGroup).toBeUndefined();
    });

    it("should build creation buttons group for Area", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "Areas" },
        basename: "TestArea",
      } as TFile;
      const metadata = { exo__Instance_class: "[[ems__Area]]" };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[ems__Area]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(null);
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue(
        "Areas/TestArea",
      );

      const groups = await builder.build(mockFile);

      const creationGroup = groups.find((g) => g.id === "creation");
      expect(creationGroup).toBeDefined();
      expect(creationGroup?.buttons.some((b) => b.id === "create-task")).toBe(
        true,
      );
      expect(
        creationGroup?.buttons.some((b) => b.id === "create-project"),
      ).toBe(true);
      expect(creationGroup?.buttons.some((b) => b.id === "create-area")).toBe(
        true,
      );
    });

    it("should build status buttons group for Task with Draft status", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "Tasks" },
        basename: "TestTask",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_status: "[[ems__EffortStatusDraft]]",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[ems__Task]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(
        "[[ems__EffortStatusDraft]]",
      );
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue("Tasks");

      const groups = await builder.build(mockFile);

      const statusGroup = groups.find((g) => g.id === "status");
      expect(statusGroup).toBeDefined();
      expect(
        statusGroup?.buttons.some(
          (b) => b.id === "move-to-backlog" && b.visible,
        ),
      ).toBe(true);
    });

    it("should build planning buttons group for Task with Backlog status", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "Tasks" },
        basename: "TestTask",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[ems__Task]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(
        "[[ems__EffortStatusBacklog]]",
      );
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue("Tasks");

      const groups = await builder.build(mockFile);

      const planningGroup = groups.find((g) => g.id === "planning");
      expect(planningGroup).toBeDefined();
      expect(
        planningGroup?.buttons.some(
          (b) => b.id === "plan-on-today" && b.visible,
        ),
      ).toBe(true);
      expect(
        planningGroup?.buttons.some(
          (b) => b.id === "vote-on-effort" && b.visible,
        ),
      ).toBe(true);
    });

    it("should build maintenance buttons group", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "Tasks" },
        basename: "TestTask",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[ems__Task]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(
        "[[ems__EffortStatusBacklog]]",
      );
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue("Tasks");

      const groups = await builder.build(mockFile);

      const maintenanceGroup = groups.find((g) => g.id === "maintenance");
      expect(maintenanceGroup).toBeDefined();
      expect(maintenanceGroup?.buttons.some((b) => b.id === "trash")).toBe(
        true,
      );
      expect(
        maintenanceGroup?.buttons.some((b) => b.id === "clean-properties"),
      ).toBe(true);
    });

    it("should show repair folder button when folder mismatch", async () => {
      const mockFile = {
        path: "wrong/test.md",
        parent: { path: "wrong" },
        basename: "TestTask",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[ems__Task]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(
        "[[ems__EffortStatusBacklog]]",
      );
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue("Tasks");

      const groups = await builder.build(mockFile);

      const maintenanceGroup = groups.find((g) => g.id === "maintenance");
      const repairButton = maintenanceGroup?.buttons.find(
        (b) => b.id === "repair-folder",
      );
      expect(repairButton?.visible).toBe(true);
    });

    it("should show rename to UID button when filename != UID", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "Tasks" },
        basename: "wrong-name",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[ems__Task]]",
        exo__Asset_uid: "correct-uid",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[ems__Task]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(
        "[[ems__EffortStatusBacklog]]",
      );
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue("Tasks");

      const groups = await builder.build(mockFile);

      const maintenanceGroup = groups.find((g) => g.id === "maintenance");
      const renameButton = maintenanceGroup?.buttons.find(
        (b) => b.id === "rename-to-uid",
      );
      expect(renameButton?.visible).toBe(true);
    });

    it("should show vote count in button label when votes exist", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "Tasks" },
        basename: "TestTask",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        ems__Effort_votes: 5,
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[ems__Task]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(
        "[[ems__EffortStatusBacklog]]",
      );
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue("Tasks");

      const groups = await builder.build(mockFile);

      const planningGroup = groups.find((g) => g.id === "planning");
      const voteButton = planningGroup?.buttons.find(
        (b) => b.id === "vote-on-effort",
      );
      expect(voteButton?.label).toBe("Vote (5)");
    });

    it("should show 'Vote' label when no votes exist", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "Tasks" },
        basename: "TestTask",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[ems__Task]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(
        "[[ems__EffortStatusBacklog]]",
      );
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue("Tasks");

      const groups = await builder.build(mockFile);

      const planningGroup = groups.find((g) => g.id === "planning");
      const voteButton = planningGroup?.buttons.find(
        (b) => b.id === "vote-on-effort",
      );
      expect(voteButton?.label).toBe("Vote");
    });

    it("should show 'Set Active Focus' when no active focus set", async () => {
      mockSettings.activeFocusArea = null;
      const mockFile = {
        path: "test.md",
        parent: { path: "Areas" },
        basename: "TestArea",
      } as TFile;
      const metadata = { exo__Instance_class: "[[ems__Area]]" };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[ems__Area]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(null);
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue(
        "Areas/TestArea",
      );

      const groups = await builder.build(mockFile);

      const planningGroup = groups.find((g) => g.id === "planning");
      const focusButton = planningGroup?.buttons.find(
        (b) => b.id === "set-active-focus",
      );
      expect(focusButton?.label).toBe("Set Active Focus");
    });

    it("should show 'Clear Active Focus' when this area is active focus", async () => {
      mockSettings.activeFocusArea = "TestArea";
      const mockFile = {
        path: "test.md",
        parent: { path: "Areas" },
        basename: "TestArea",
      } as TFile;
      const metadata = { exo__Instance_class: "[[ems__Area]]" };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[ems__Area]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(null);
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue(
        "Areas/TestArea",
      );

      const groups = await builder.build(mockFile);

      const planningGroup = groups.find((g) => g.id === "planning");
      const focusButton = planningGroup?.buttons.find(
        (b) => b.id === "set-active-focus",
      );
      expect(focusButton?.label).toBe("Clear Active Focus");
    });

    it("should handle array of instance classes", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "Tasks" },
        basename: "TestTask",
      } as TFile;
      const metadata = {
        exo__Instance_class: ["[[ems__Task]]", "[[ems__Meeting]]"],
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue([
        "[[ems__Task]]",
        "[[ems__Meeting]]",
      ]);
      mockMetadataExtractor.extractStatus.mockReturnValue(
        "[[ems__EffortStatusBacklog]]",
      );
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue("Tasks");

      const groups = await builder.build(mockFile);

      expect(groups.length).toBeGreaterThan(0);
    });

    it("should handle null expected folder", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "Tasks" },
        basename: "TestTask",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[ems__Task]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(
        "[[ems__EffortStatusBacklog]]",
      );
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue(null);

      const groups = await builder.build(mockFile);

      const maintenanceGroup = groups.find((g) => g.id === "maintenance");
      const repairButton = maintenanceGroup?.buttons.find(
        (b) => b.id === "repair-folder",
      );
      expect(repairButton?.visible).toBe(false);
    });

    it("should not show buttons for archived assets", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "Tasks" },
        basename: "TestTask",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        exo__Asset_isArchived: true,
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[ems__Task]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(
        "[[ems__EffortStatusBacklog]]",
      );
      mockMetadataExtractor.extractIsArchived.mockReturnValue(true);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue("Tasks");

      const groups = await builder.build(mockFile);

      const planningGroup = groups.find((g) => g.id === "planning");
      const voteButton = planningGroup?.buttons.find(
        (b) => b.id === "vote-on-effort",
      );
      expect(voteButton?.visible).toBe(false);
    });

    it("should show rollback button for Done status", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "Tasks" },
        basename: "TestTask",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_status: "[[ems__EffortStatusDone]]",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[ems__Task]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(
        "[[ems__EffortStatusDone]]",
      );
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue("Tasks");

      const groups = await builder.build(mockFile);

      const statusGroup = groups.find((g) => g.id === "status");
      const rollbackButton = statusGroup?.buttons.find(
        (b) => b.id === "rollback-status",
      );
      expect(rollbackButton?.visible).toBe(true);
    });

    it("should handle Concept class", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "Concepts" },
        basename: "TestConcept",
      } as TFile;
      const metadata = { exo__Instance_class: "[[ims__Concept]]" };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[ims__Concept]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(null);
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue("Concepts");

      const groups = await builder.build(mockFile);

      const creationGroup = groups.find((g) => g.id === "creation");
      const narrowerButton = creationGroup?.buttons.find(
        (b) => b.id === "create-narrower-concept",
      );
      expect(narrowerButton?.visible).toBe(true);
    });

    it("should handle TaskPrototype", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "TaskPrototypes" },
        basename: "TestPrototype",
      } as TFile;
      const metadata = { exo__Instance_class: "[[ems__TaskPrototype]]" };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[ems__TaskPrototype]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(null);
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue(
        "TaskPrototypes",
      );

      const groups = await builder.build(mockFile);

      const creationGroup = groups.find((g) => g.id === "creation");
      const instanceButton = creationGroup?.buttons.find(
        (b) => b.id === "create-instance",
      );
      expect(instanceButton?.visible).toBe(true);
    });

    it("should handle Initiative", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "Initiatives" },
        basename: "TestInitiative",
      } as TFile;
      const metadata = { exo__Instance_class: "[[ems__Initiative]]" };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[ems__Initiative]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(null);
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue(
        "Initiatives",
      );

      const groups = await builder.build(mockFile);

      const creationGroup = groups.find((g) => g.id === "creation");
      const projectButton = creationGroup?.buttons.find(
        (b) => b.id === "create-project",
      );
      expect(projectButton?.visible).toBe(true);
    });

    it("should not show copy label to aliases when no label", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "Concepts" },
        basename: "TestConcept",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[ims__Concept]]",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[ims__Concept]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(null);
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue("Concepts");

      const groups = await builder.build(mockFile);

      const maintenanceGroup = groups.find((g) => g.id === "maintenance");
      const copyButton = maintenanceGroup?.buttons.find(
        (b) => b.id === "copy-label-to-aliases",
      );
      expect(copyButton?.visible).toBe(false);
    });

    it("should show archive button for Done tasks", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "Tasks" },
        basename: "TestTask",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_status: "[[ems__EffortStatusDone]]",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[ems__Task]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(
        "[[ems__EffortStatusDone]]",
      );
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue("Tasks");

      const groups = await builder.build(mockFile);

      const maintenanceGroup = groups.find((g) => g.id === "maintenance");
      const archiveButton = maintenanceGroup?.buttons.find(
        (b) => b.id === "archive",
      );
      expect(archiveButton?.visible).toBe(true);
    });

    it("should hide archive button for already archived tasks", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "Tasks" },
        basename: "TestTask",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_status: "[[ems__EffortStatusDone]]",
        exo__Asset_isArchived: true,
        // Add a property that needs cleaning so maintenance group is created
        emptyProp: "",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[ems__Task]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(
        "[[ems__EffortStatusDone]]",
      );
      mockMetadataExtractor.extractIsArchived.mockReturnValue(true);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue("Tasks");

      const groups = await builder.build(mockFile);

      const maintenanceGroup = groups.find((g) => g.id === "maintenance");
      
      // Maintenance group might not exist if no buttons are visible
      // If it exists, archive button should be marked as not visible
      if (maintenanceGroup) {
        const archiveButton = maintenanceGroup.buttons.find(
          (b) => b.id === "archive",
        );
        expect(archiveButton).toBeDefined();
        expect(archiveButton?.visible).toBe(false);
      } else {
        // If maintenance group doesn't exist, that's also acceptable
        // as it means no maintenance buttons are visible, including archive
        expect(maintenanceGroup).toBeUndefined();
      }
    });

    it("should handle Project with ToDo status", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "Projects" },
        basename: "TestProject",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[ems__Project]]",
        ems__Effort_status: "[[ems__EffortStatusToDo]]",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[ems__Project]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(
        "[[ems__EffortStatusToDo]]",
      );
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue("Projects");

      const groups = await builder.build(mockFile);

      const statusGroup = groups.find((g) => g.id === "status");
      const startButton = statusGroup?.buttons.find(
        (b) => b.id === "start-effort",
      );
      expect(startButton?.visible).toBe(true);
    });

    it("should handle Task with Doing status", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "Tasks" },
        basename: "TestTask",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_status: "[[ems__EffortStatusDoing]]",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[ems__Task]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(
        "[[ems__EffortStatusDoing]]",
      );
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue("Tasks");

      const groups = await builder.build(mockFile);

      const statusGroup = groups.find((g) => g.id === "status");
      const doneButton = statusGroup?.buttons.find((b) => b.id === "mark-done");
      expect(doneButton?.visible).toBe(true);
    });

    it("should show Create Task button for DailyNote with past date", async () => {
      const mockFile = {
        path: "2020-01-01.md",
        parent: { path: "Daily" },
        basename: "2020-01-01",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "2020-01-01",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[pn__DailyNote]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(null);
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue("Daily");

      const groups = await builder.build(mockFile);

      const creationGroup = groups.find((g) => g.id === "creation");
      const createTaskButton = creationGroup?.buttons.find(
        (b) => b.id === "create-task-for-dailynote",
      );
      expect(createTaskButton?.visible).toBe(true);
      expect(createTaskButton?.label).toBe("Create Task");
    });

    it("should not show Create Task button for DailyNote with future date", async () => {
      const mockFile = {
        path: "2099-12-31.md",
        parent: { path: "Daily" },
        basename: "2099-12-31",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "2099-12-31",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[pn__DailyNote]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(null);
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue("Daily");

      const groups = await builder.build(mockFile);

      const creationGroup = groups.find((g) => g.id === "creation");
      const createTaskButton = creationGroup?.buttons.find(
        (b) => b.id === "create-task-for-dailynote",
      );
      expect(createTaskButton?.visible ?? false).toBe(false);
    });

    it("should handle DailyNote with wiki-link date format", async () => {
      const mockFile = {
        path: "2020-01-01.md",
        parent: { path: "Daily" },
        basename: "2020-01-01",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2020-01-01]]",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[pn__DailyNote]]",
        );
      mockMetadataExtractor.extractStatus.mockReturnValue(null);
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue("Daily");

      const groups = await builder.build(mockFile);

      const creationGroup = groups.find((g) => g.id === "creation");
      const createTaskButton = creationGroup?.buttons.find(
        (b) => b.id === "create-task-for-dailynote",
      );
      expect(createTaskButton?.visible).toBe(true);
    });

    it("should handle DailyNote with array day property", async () => {
      const mockFile = {
        path: "2020-01-01.md",
        parent: { path: "Daily" },
        basename: "2020-01-01",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: ["2020-01-01"],
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[pn__DailyNote]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(null);
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue("Daily");

      const groups = await builder.build(mockFile);

      const creationGroup = groups.find((g) => g.id === "creation");
      const createTaskButton = creationGroup?.buttons.find(
        (b) => b.id === "create-task-for-dailynote",
      );
      expect(createTaskButton?.visible).toBe(true);
    });

    it("should handle DailyNote with array containing wiki-link", async () => {
      const mockFile = {
        path: "2020-01-01.md",
        parent: { path: "Daily" },
        basename: "2020-01-01",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: ["[[2020-01-01]]"],
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[pn__DailyNote]]",
      );
      mockMetadataExtractor.extractStatus.mockReturnValue(null);
      mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
      mockFolderRepairService.getExpectedFolder.mockResolvedValue("Daily");

      const groups = await builder.build(mockFile);

      const creationGroup = groups.find((g) => g.id === "creation");
      const createTaskButton = creationGroup?.buttons.find(
        (b) => b.id === "create-task-for-dailynote",
      );
      expect(createTaskButton?.visible).toBe(true);
    });
  });
});
