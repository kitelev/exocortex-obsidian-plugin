import {
  setupDailyTasksRendererTest,
  createMockElement,
  DailyTasksRendererTestContext,
  TFile,
} from "./DailyTasksRenderer.fixtures";

describe("DailyTasksRenderer - getDailyTasks filtering", () => {
  let ctx: DailyTasksRendererTestContext;

  beforeEach(() => {
    jest.clearAllMocks();
    ctx = setupDailyTasksRendererTest();
  });

  it("should filter tasks without ems__Effort_day", async () => {
    const mockFile = {
      path: "test.md",
      parent: { path: "DailyNotes" },
      basename: "2025-10-20",
    } as TFile;
    const metadata = {
      exo__Instance_class: "[[pn__DailyNote]]",
      pn__DailyNote_day: "[[2025-10-20]]",
    };

    const taskFile1 = {
      path: "task1.md",
      basename: "task1",
    } as TFile;

    const taskFile2 = {
      path: "task2.md",
      basename: "task2",
    } as TFile;

    const taskMetadata1 = {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_status: "[[ems__EffortStatusBacklog]]",
    };

    const taskMetadata2 = {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_day: "[[2025-10-20]]",
      ems__Effort_startTimestamp: "2025-10-20T09:00:00",
      ems__Effort_status: "[[ems__EffortStatusBacklog]]",
    };

    ctx.mockMetadataExtractor.extractMetadata
      .mockReturnValueOnce(metadata)
      .mockReturnValueOnce(taskMetadata1)
      .mockReturnValueOnce(taskMetadata2);

    ctx.mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
      "[[pn__DailyNote]]",
    );

    ctx.mockVaultAdapter.getAllFiles.mockReturnValue([taskFile1, taskFile2]);

    const mockEl = createMockElement();
    await ctx.renderer.render(mockEl, mockFile);

    expect(ctx.mockReactRenderer.render).toHaveBeenCalled();
    const renderCall = ctx.mockReactRenderer.render.mock.calls[0];
    const tasks = renderCall[1].props.tasks;
    expect(tasks.length).toBe(1);
    expect(tasks[0].path).toBe("task2.md");
  });

  it("should filter tasks for different days", async () => {
    const mockFile = {
      path: "test.md",
      parent: { path: "DailyNotes" },
      basename: "2025-10-20",
    } as TFile;
    const metadata = {
      exo__Instance_class: "[[pn__DailyNote]]",
      pn__DailyNote_day: "[[2025-10-20]]",
    };

    const taskFile1 = {
      path: "task1.md",
      basename: "task1",
    } as TFile;

    const taskFile2 = {
      path: "task2.md",
      basename: "task2",
    } as TFile;

    const taskMetadata1 = {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_day: "[[2025-10-21]]",
      ems__Effort_startTimestamp: "2025-10-21T09:00:00",
      ems__Effort_status: "[[ems__EffortStatusBacklog]]",
    };

    const taskMetadata2 = {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_day: "[[2025-10-20]]",
      ems__Effort_startTimestamp: "2025-10-20T09:00:00",
      ems__Effort_status: "[[ems__EffortStatusBacklog]]",
    };

    ctx.mockMetadataExtractor.extractMetadata
      .mockReturnValueOnce(metadata)
      .mockReturnValueOnce(taskMetadata1)
      .mockReturnValueOnce(taskMetadata2);

    ctx.mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
      "[[pn__DailyNote]]",
    );

    ctx.mockVaultAdapter.getAllFiles.mockReturnValue([taskFile1, taskFile2]);

    const mockEl = createMockElement();
    await ctx.renderer.render(mockEl, mockFile);

    expect(ctx.mockReactRenderer.render).toHaveBeenCalled();
    const renderCall = ctx.mockReactRenderer.render.mock.calls[0];
    const tasks = renderCall[1].props.tasks;
    expect(tasks.length).toBe(1);
    expect(tasks[0].path).toBe("task2.md");
  });

  it("should filter out projects from daily tasks", async () => {
    const mockFile = {
      path: "test.md",
      parent: { path: "DailyNotes" },
      basename: "2025-10-20",
    } as TFile;
    const metadata = {
      exo__Instance_class: "[[pn__DailyNote]]",
      pn__DailyNote_day: "[[2025-10-20]]",
    };

    const projectFile = {
      path: "project.md",
      basename: "project",
    } as TFile;

    const taskFile = {
      path: "task.md",
      basename: "task",
    } as TFile;

    const projectMetadata = {
      exo__Instance_class: ["[[ems__Project]]"],
      ems__Effort_day: "[[2025-10-20]]",
      ems__Effort_startTimestamp: "2025-10-20T09:00:00",
      ems__Effort_status: "[[ems__EffortStatusBacklog]]",
    };

    const taskMetadata = {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_day: "[[2025-10-20]]",
      ems__Effort_startTimestamp: "2025-10-20T09:00:00",
      ems__Effort_status: "[[ems__EffortStatusBacklog]]",
    };

    ctx.mockMetadataExtractor.extractMetadata
      .mockReturnValueOnce(metadata)
      .mockReturnValueOnce(projectMetadata)
      .mockReturnValueOnce(taskMetadata);

    ctx.mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
      "[[pn__DailyNote]]",
    );

    ctx.mockVaultAdapter.getAllFiles.mockReturnValue([projectFile, taskFile]);

    const mockEl = createMockElement();
    await ctx.renderer.render(mockEl, mockFile);

    expect(ctx.mockReactRenderer.render).toHaveBeenCalled();
    const renderCall = ctx.mockReactRenderer.render.mock.calls[0];
    const tasks = renderCall[1].props.tasks;
    expect(tasks.length).toBe(1);
    expect(tasks[0].path).toBe("task.md");
  });

  it.skip("should filter by active focus area", async () => {
    ctx.mockSettings.activeFocusArea = "Development";

    const mockFile = {
      path: "test.md",
      parent: { path: "DailyNotes" },
      basename: "2025-10-20",
    } as TFile;
    const metadata = {
      exo__Instance_class: "[[pn__DailyNote]]",
      pn__DailyNote_day: "[[2025-10-20]]",
    };

    const taskFile1 = {
      path: "task1.md",
      basename: "task1",
    } as TFile;

    const taskFile2 = {
      path: "task2.md",
      basename: "task2",
    } as TFile;

    const taskMetadata1 = {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_day: "[[2025-10-20]]",
      ems__Effort_startTimestamp: "2025-10-20T09:00:00",
      ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      ems__Effort_area: "[[Development]]",
    };

    const taskMetadata2 = {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_day: "[[2025-10-20]]",
      ems__Effort_startTimestamp: "2025-10-20T09:00:00",
      ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      ems__Effort_area: "[[Marketing]]",
    };

    ctx.mockMetadataExtractor.extractMetadata
      .mockReturnValueOnce(metadata)
      .mockReturnValueOnce(taskMetadata1)
      .mockReturnValueOnce(taskMetadata2);

    ctx.mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
      "[[pn__DailyNote]]",
    );

    ctx.mockVaultAdapter.getAllFiles.mockReturnValue([taskFile1, taskFile2]);

    const mockEl = createMockElement();
    await ctx.renderer.render(mockEl, mockFile);

    expect(ctx.mockReactRenderer.render).toHaveBeenCalled();
    const renderCall = ctx.mockReactRenderer.render.mock.calls[0];
    const tasks = renderCall[1].props.tasks;
    expect(tasks.length).toBe(1);
    expect(tasks[0].path).toBe("task1.md");
  });

  it("should include child areas when filtering by focus area", async () => {
    ctx.mockSettings.activeFocusArea = "Engineering";

    const mockFile = {
      path: "test.md",
      parent: { path: "DailyNotes" },
      basename: "2025-10-20",
    } as TFile;
    const metadata = {
      exo__Instance_class: "[[pn__DailyNote]]",
      pn__DailyNote_day: "[[2025-10-20]]",
    };

    const taskFile1 = {
      path: "task1.md",
      basename: "task1",
    } as TFile;

    const taskFile2 = {
      path: "task2.md",
      basename: "task2",
    } as TFile;

    const areaFile = {
      path: "Frontend.md",
      basename: "Frontend",
    } as TFile;

    const taskMetadata1 = {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_day: "[[2025-10-20]]",
      ems__Effort_startTimestamp: "2025-10-20T09:00:00",
      ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      ems__Effort_area: "[[Frontend]]",
    };

    const taskMetadata2 = {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_day: "[[2025-10-20]]",
      ems__Effort_startTimestamp: "2025-10-20T09:00:00",
      ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      ems__Effort_area: "[[Marketing]]",
    };

    const areaMetadata = {
      ems__Area_parent: "[[Engineering]]",
    };

    ctx.mockMetadataExtractor.extractMetadata
      .mockReturnValueOnce(metadata)
      .mockReturnValueOnce(taskMetadata1)
      .mockReturnValueOnce(taskMetadata2)
      .mockReturnValueOnce(areaMetadata);

    ctx.mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
      "[[pn__DailyNote]]",
    );

    ctx.mockVaultAdapter.getAllFiles
      .mockReturnValueOnce([taskFile1, taskFile2])
      .mockReturnValueOnce([areaFile]);

    const mockEl = createMockElement();
    await ctx.renderer.render(mockEl, mockFile);

    expect(ctx.mockReactRenderer.render).toHaveBeenCalled();
    const renderCall = ctx.mockReactRenderer.render.mock.calls[0];
    const tasks = renderCall[1].props.tasks;
    expect(tasks.length).toBe(1);
    expect(tasks[0].path).toBe("task1.md");
  });
});
