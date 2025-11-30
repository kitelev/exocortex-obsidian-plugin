import {
  setupButtonGroupsBuilderTest,
  ButtonGroupsBuilderTestContext,
  TFile,
} from "./ButtonGroupsBuilder.fixtures";

describe("ButtonGroupsBuilder - onClick handlers", () => {
  let ctx: ButtonGroupsBuilderTestContext;

  beforeEach(() => {
    ctx = setupButtonGroupsBuilderTest();
  });

  it("should call taskStatusService.setDraftStatus when Set Draft Status button clicked", async () => {
    const mockFile = {
      path: "test.md",
      parent: { path: "Tasks" },
      basename: "TestTask",
    } as TFile;
    const metadata = {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_status: null,
    };

    ctx.mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
    ctx.mockMetadataExtractor.extractInstanceClass.mockReturnValue(
      "[[ems__Task]]",
    );
    ctx.mockMetadataExtractor.extractStatus.mockReturnValue(null);
    ctx.mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
    ctx.mockFolderRepairService.getExpectedFolder.mockResolvedValue("Tasks");

    const groups = await ctx.builder.build(mockFile);
    const statusGroup = groups.find((g) => g.id === "status");
    const draftButton = statusGroup?.buttons.find(
      (b) => b.id === "set-draft-status",
    );

    expect(draftButton).toBeDefined();
    if (draftButton?.onClick) {
      await draftButton.onClick();
    }

    expect(ctx.mockTaskStatusService.setDraftStatus).toHaveBeenCalledWith(
      mockFile,
    );
    expect(ctx.mockRefresh).toHaveBeenCalled();
  });

  it("should call taskStatusService.moveToBacklog when Move to Backlog button clicked", async () => {
    const mockFile = {
      path: "test.md",
      parent: { path: "Tasks" },
      basename: "TestTask",
    } as TFile;
    const metadata = {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_status: "[[ems__EffortStatusDraft]]",
    };

    ctx.mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
    ctx.mockMetadataExtractor.extractInstanceClass.mockReturnValue(
      "[[ems__Task]]",
    );
    ctx.mockMetadataExtractor.extractStatus.mockReturnValue(
      "[[ems__EffortStatusDraft]]",
    );
    ctx.mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
    ctx.mockFolderRepairService.getExpectedFolder.mockResolvedValue("Tasks");

    const groups = await ctx.builder.build(mockFile);
    const statusGroup = groups.find((g) => g.id === "status");
    const backlogButton = statusGroup?.buttons.find(
      (b) => b.id === "move-to-backlog",
    );

    expect(backlogButton).toBeDefined();
    if (backlogButton?.onClick) {
      await backlogButton.onClick();
    }

    expect(ctx.mockTaskStatusService.moveToBacklog).toHaveBeenCalledWith(
      mockFile,
    );
    expect(ctx.mockRefresh).toHaveBeenCalled();
  });

  it("should call taskStatusService.moveToAnalysis when Move to Analysis button clicked", async () => {
    const mockFile = {
      path: "test.md",
      parent: { path: "Tasks" },
      basename: "TestTask",
    } as TFile;
    const metadata = {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_status: "[[ems__EffortStatusBacklog]]",
    };

    ctx.mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
    ctx.mockMetadataExtractor.extractInstanceClass.mockReturnValue(
      "[[ems__Task]]",
    );
    ctx.mockMetadataExtractor.extractStatus.mockReturnValue(
      "[[ems__EffortStatusBacklog]]",
    );
    ctx.mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
    ctx.mockFolderRepairService.getExpectedFolder.mockResolvedValue("Tasks");

    const groups = await ctx.builder.build(mockFile);
    const statusGroup = groups.find((g) => g.id === "status");
    const analysisButton = statusGroup?.buttons.find(
      (b) => b.id === "move-to-analysis",
    );

    expect(analysisButton).toBeDefined();
    if (analysisButton?.onClick) {
      await analysisButton.onClick();
    }

    expect(ctx.mockTaskStatusService.moveToAnalysis).toHaveBeenCalledWith(
      mockFile,
    );
    expect(ctx.mockRefresh).toHaveBeenCalled();
  });

  it("should call taskStatusService.moveToToDo when Move to ToDo button clicked", async () => {
    const mockFile = {
      path: "test.md",
      parent: { path: "Tasks" },
      basename: "TestTask",
    } as TFile;
    const metadata = {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_status: "[[ems__EffortStatusAnalysis]]",
    };

    ctx.mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
    ctx.mockMetadataExtractor.extractInstanceClass.mockReturnValue(
      "[[ems__Task]]",
    );
    ctx.mockMetadataExtractor.extractStatus.mockReturnValue(
      "[[ems__EffortStatusAnalysis]]",
    );
    ctx.mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
    ctx.mockFolderRepairService.getExpectedFolder.mockResolvedValue("Tasks");

    const groups = await ctx.builder.build(mockFile);
    const statusGroup = groups.find((g) => g.id === "status");
    const todoButton = statusGroup?.buttons.find(
      (b) => b.id === "move-to-todo",
    );

    expect(todoButton).toBeDefined();
    if (todoButton?.onClick) {
      await todoButton.onClick();
    }

    expect(ctx.mockTaskStatusService.moveToToDo).toHaveBeenCalledWith(mockFile);
    expect(ctx.mockRefresh).toHaveBeenCalled();
  });

  it("should call taskStatusService.startEffort when Start Effort button clicked", async () => {
    const mockFile = {
      path: "test.md",
      parent: { path: "Tasks" },
      basename: "TestTask",
    } as TFile;
    const metadata = {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_status: "[[ems__EffortStatusToDo]]",
    };

    ctx.mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
    ctx.mockMetadataExtractor.extractInstanceClass.mockReturnValue(
      "[[ems__Task]]",
    );
    ctx.mockMetadataExtractor.extractStatus.mockReturnValue(
      "[[ems__EffortStatusToDo]]",
    );
    ctx.mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
    ctx.mockFolderRepairService.getExpectedFolder.mockResolvedValue("Tasks");

    const groups = await ctx.builder.build(mockFile);
    const statusGroup = groups.find((g) => g.id === "status");
    const startButton = statusGroup?.buttons.find(
      (b) => b.id === "start-effort",
    );

    expect(startButton).toBeDefined();
    if (startButton?.onClick) {
      await startButton.onClick();
    }

    expect(ctx.mockTaskStatusService.startEffort).toHaveBeenCalledWith(mockFile);
    expect(ctx.mockRefresh).toHaveBeenCalled();
  });

  it("should call taskStatusService.markTaskAsDone when Mark Done button clicked", async () => {
    const mockFile = {
      path: "test.md",
      parent: { path: "Tasks" },
      basename: "TestTask",
    } as TFile;
    const metadata = {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_status: "[[ems__EffortStatusInProgress]]",
    };

    ctx.mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
    ctx.mockMetadataExtractor.extractInstanceClass.mockReturnValue(
      "[[ems__Task]]",
    );
    ctx.mockMetadataExtractor.extractStatus.mockReturnValue(
      "[[ems__EffortStatusInProgress]]",
    );
    ctx.mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
    ctx.mockFolderRepairService.getExpectedFolder.mockResolvedValue("Tasks");

    const groups = await ctx.builder.build(mockFile);
    const statusGroup = groups.find((g) => g.id === "status");
    const doneButton = statusGroup?.buttons.find((b) => b.id === "mark-done");

    expect(doneButton).toBeDefined();
    if (doneButton?.onClick) {
      await doneButton.onClick();
    }

    expect(ctx.mockTaskStatusService.markTaskAsDone).toHaveBeenCalledWith(
      mockFile,
    );
    expect(ctx.mockRefresh).toHaveBeenCalled();
  });

  it("should call taskStatusService.rollbackStatus when Rollback Status button clicked", async () => {
    const mockFile = {
      path: "test.md",
      parent: { path: "Tasks" },
      basename: "TestTask",
    } as TFile;
    const metadata = {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      ems__Effort_statusHistory: [
        "2024-01-01T00:00:00 → [[ems__EffortStatusBacklog]]",
      ],
    };

    ctx.mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
    ctx.mockMetadataExtractor.extractInstanceClass.mockReturnValue(
      "[[ems__Task]]",
    );
    ctx.mockMetadataExtractor.extractStatus.mockReturnValue(
      "[[ems__EffortStatusBacklog]]",
    );
    ctx.mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
    ctx.mockFolderRepairService.getExpectedFolder.mockResolvedValue("Tasks");

    const groups = await ctx.builder.build(mockFile);
    const statusGroup = groups.find((g) => g.id === "status");
    const rollbackButton = statusGroup?.buttons.find(
      (b) => b.id === "rollback-status",
    );

    expect(rollbackButton).toBeDefined();
    if (rollbackButton?.onClick) {
      await rollbackButton.onClick();
    }

    expect(ctx.mockTaskStatusService.rollbackStatus).toHaveBeenCalledWith(
      mockFile,
    );
    expect(ctx.mockRefresh).toHaveBeenCalled();
  });

  it("should call taskStatusService.trashEffort when Trash button clicked", async () => {
    const mockFile = {
      path: "test.md",
      parent: { path: "Tasks" },
      basename: "TestTask",
    } as TFile;
    const metadata = {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_status: "[[ems__EffortStatusBacklog]]",
    };

    ctx.mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
    ctx.mockMetadataExtractor.extractInstanceClass.mockReturnValue(
      "[[ems__Task]]",
    );
    ctx.mockMetadataExtractor.extractStatus.mockReturnValue(
      "[[ems__EffortStatusBacklog]]",
    );
    ctx.mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
    ctx.mockFolderRepairService.getExpectedFolder.mockResolvedValue("Tasks");

    const groups = await ctx.builder.build(mockFile);
    const maintenanceGroup = groups.find((g) => g.id === "maintenance");
    const trashButton = maintenanceGroup?.buttons.find(
      (b) => b.id === "trash",
    );

    expect(trashButton).toBeDefined();
    if (trashButton?.onClick) {
      await trashButton.onClick();
    }

    expect(ctx.mockTaskStatusService.trashEffort).toHaveBeenCalledWith(mockFile);
    expect(ctx.mockRefresh).toHaveBeenCalled();
  });

  it("should call taskStatusService.archiveTask when Archive button clicked", async () => {
    const mockFile = {
      path: "test.md",
      parent: { path: "Tasks" },
      basename: "TestTask",
    } as TFile;
    const metadata = {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_status: "[[ems__EffortStatusDone]]",
    };

    ctx.mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
    ctx.mockMetadataExtractor.extractInstanceClass.mockReturnValue(
      "[[ems__Task]]",
    );
    ctx.mockMetadataExtractor.extractStatus.mockReturnValue(
      "[[ems__EffortStatusDone]]",
    );
    ctx.mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
    ctx.mockFolderRepairService.getExpectedFolder.mockResolvedValue("Tasks");

    const groups = await ctx.builder.build(mockFile);
    const maintenanceGroup = groups.find((g) => g.id === "maintenance");
    const archiveButton = maintenanceGroup?.buttons.find(
      (b) => b.id === "archive",
    );

    expect(archiveButton).toBeDefined();
    if (archiveButton?.onClick) {
      await archiveButton.onClick();
    }

    expect(ctx.mockTaskStatusService.archiveTask).toHaveBeenCalledWith(mockFile);
    expect(ctx.mockRefresh).toHaveBeenCalled();
  });

  it("should call propertyCleanupService.cleanEmptyProperties when Clean Properties button clicked", async () => {
    const mockFile = {
      path: "test.md",
      parent: { path: "Tasks" },
      basename: "TestTask",
    } as TFile;
    const metadata = {
      exo__Instance_class: "[[ems__Task]]",
    };

    ctx.mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
    ctx.mockMetadataExtractor.extractInstanceClass.mockReturnValue(
      "[[ems__Task]]",
    );
    ctx.mockMetadataExtractor.extractStatus.mockReturnValue(null);
    ctx.mockMetadataExtractor.extractIsArchived.mockReturnValue(false);
    ctx.mockFolderRepairService.getExpectedFolder.mockResolvedValue("Tasks");

    const groups = await ctx.builder.build(mockFile);
    const maintenanceGroup = groups.find((g) => g.id === "maintenance");
    const cleanButton = maintenanceGroup?.buttons.find(
      (b) => b.id === "clean-properties",
    );

    expect(cleanButton).toBeDefined();
    if (cleanButton?.onClick) {
      await cleanButton.onClick();
    }

    expect(
      ctx.mockPropertyCleanupService.cleanEmptyProperties,
    ).toHaveBeenCalledWith(mockFile);
    expect(ctx.mockRefresh).toHaveBeenCalled();
  });
});
