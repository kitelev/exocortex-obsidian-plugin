import {
  setupDailyTasksRendererTest,
  createMockElement,
  DailyTasksRendererTestContext,
  TFile,
} from "./DailyTasksRenderer.fixtures";

describe("DailyTasksRenderer - getAssetLabel with prototype fallback", () => {
  let ctx: DailyTasksRendererTestContext;

  beforeEach(() => {
    jest.clearAllMocks();
    ctx = setupDailyTasksRendererTest();
  });

  it.skip("should return label from file when available", async () => {
    const mockFile = {
      path: "test.md",
      parent: { path: "DailyNotes" },
      basename: "2025-10-20",
    } as TFile;
    const metadata = {
      exo__Instance_class: "[[pn__DailyNote]]",
      pn__DailyNote_day: "[[2025-10-20]]",
    };

    const taskFile = {
      path: "task.md",
      basename: "task",
    } as TFile;

    const taskMetadata = {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_day: "[[2025-10-20]]",
      ems__Effort_startTimestamp: "2025-10-20T09:00:00",
      ems__Effort_status: "[[ems__EffortStatusBacklog]]",
    };

    ctx.mockMetadataExtractor.extractMetadata
      .mockReturnValueOnce(metadata)
      .mockReturnValueOnce(taskMetadata);

    ctx.mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
      "[[pn__DailyNote]]",
    );

    ctx.mockVaultAdapter.getAllFiles.mockReturnValue([taskFile]);

    const linkedFile = {
      path: "linked.md",
      basename: "linked",
    } as TFile;

    const linkedMetadata = {
      exo__Asset_label: "Linked Label",
    };

    ctx.mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(linkedFile);
    ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
      frontmatter: linkedMetadata,
    });

    const mockEl = createMockElement();
    await ctx.renderer.render(mockEl, mockFile);

    const renderCall = ctx.mockReactRenderer.render.mock.calls[0];
    const getAssetLabel = renderCall[1].props.getAssetLabel;
    const result = getAssetLabel("linked");
    expect(result).toBe("Linked Label");
  });

  it.skip("should fallback to prototype label when direct label not available", async () => {
    const mockFile = {
      path: "test.md",
      parent: { path: "DailyNotes" },
      basename: "2025-10-20",
    } as TFile;
    const metadata = {
      exo__Instance_class: "[[pn__DailyNote]]",
      pn__DailyNote_day: "[[2025-10-20]]",
    };

    const taskFile = {
      path: "task.md",
      basename: "task",
    } as TFile;

    const taskMetadata = {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_day: "[[2025-10-20]]",
      ems__Effort_startTimestamp: "2025-10-20T09:00:00",
      ems__Effort_status: "[[ems__EffortStatusBacklog]]",
    };

    ctx.mockMetadataExtractor.extractMetadata
      .mockReturnValueOnce(metadata)
      .mockReturnValueOnce(taskMetadata);

    ctx.mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
      "[[pn__DailyNote]]",
    );

    ctx.mockVaultAdapter.getAllFiles.mockReturnValue([taskFile]);

    const linkedFile = {
      path: "linked.md",
      basename: "linked",
    } as TFile;

    const prototypeFile = {
      path: "prototype.md",
      basename: "prototype",
    } as TFile;

    const linkedMetadata = {
      exo__Asset_prototype: "[[prototype]]",
    };

    const prototypeMetadata = {
      exo__Asset_label: "Prototype Label",
    };

    ctx.mockApp.metadataCache.getFirstLinkpathDest
      .mockReturnValueOnce(linkedFile)
      .mockReturnValueOnce(prototypeFile);

    ctx.mockApp.metadataCache.getFileCache
      .mockReturnValueOnce({ frontmatter: linkedMetadata })
      .mockReturnValueOnce({ frontmatter: prototypeMetadata });

    const mockEl = createMockElement();
    await ctx.renderer.render(mockEl, mockFile);

    const renderCall = ctx.mockReactRenderer.render.mock.calls[0];
    const getAssetLabel = renderCall[1].props.getAssetLabel;
    const result = getAssetLabel("linked");
    expect(result).toBe("Prototype Label");
  });

  it("should return null when file not found", async () => {
    const mockFile = {
      path: "test.md",
      parent: { path: "DailyNotes" },
      basename: "2025-10-20",
    } as TFile;
    const metadata = {
      exo__Instance_class: "[[pn__DailyNote]]",
      pn__DailyNote_day: "[[2025-10-20]]",
    };

    const taskFile = {
      path: "task.md",
      basename: "task",
    } as TFile;

    const taskMetadata = {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_day: "[[2025-10-20]]",
      ems__Effort_startTimestamp: "2025-10-20T09:00:00",
      ems__Effort_status: "[[ems__EffortStatusBacklog]]",
    };

    ctx.mockMetadataExtractor.extractMetadata
      .mockReturnValueOnce(metadata)
      .mockReturnValueOnce(taskMetadata);

    ctx.mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
      "[[pn__DailyNote]]",
    );

    ctx.mockVaultAdapter.getAllFiles.mockReturnValue([taskFile]);
    ctx.mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(null);

    const mockEl = createMockElement();
    await ctx.renderer.render(mockEl, mockFile);

    const renderCall = ctx.mockReactRenderer.render.mock.calls[0];
    const getAssetLabel = renderCall[1].props.getAssetLabel;
    const result = getAssetLabel("nonexistent");
    expect(result).toBeNull();
  });

  it.skip("should try adding .md extension when file not found", async () => {
    const mockFile = {
      path: "test.md",
      parent: { path: "DailyNotes" },
      basename: "2025-10-20",
    } as TFile;
    const metadata = {
      exo__Instance_class: "[[pn__DailyNote]]",
      pn__DailyNote_day: "[[2025-10-20]]",
    };

    const taskFile = {
      path: "task.md",
      basename: "task",
    } as TFile;

    const taskMetadata = {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_day: "[[2025-10-20]]",
      ems__Effort_startTimestamp: "2025-10-20T09:00:00",
      ems__Effort_status: "[[ems__EffortStatusBacklog]]",
    };

    ctx.mockMetadataExtractor.extractMetadata
      .mockReturnValueOnce(metadata)
      .mockReturnValueOnce(taskMetadata);

    ctx.mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
      "[[pn__DailyNote]]",
    );

    ctx.mockVaultAdapter.getAllFiles.mockReturnValue([taskFile]);

    const linkedFile = {
      path: "linked.md",
      basename: "linked",
    } as TFile;

    const linkedMetadata = {
      exo__Asset_label: "Found with .md",
    };

    ctx.mockApp.metadataCache.getFirstLinkpathDest
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(linkedFile);

    ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
      frontmatter: linkedMetadata,
    });

    const mockEl = createMockElement();
    await ctx.renderer.render(mockEl, mockFile);

    const renderCall = ctx.mockReactRenderer.render.mock.calls[0];
    const getAssetLabel = renderCall[1].props.getAssetLabel;
    const result = getAssetLabel("linked");
    expect(result).toBe("Found with .md");
  });

  it("should return null when label is whitespace only", async () => {
    const mockFile = {
      path: "test.md",
      parent: { path: "DailyNotes" },
      basename: "2025-10-20",
    } as TFile;
    const metadata = {
      exo__Instance_class: "[[pn__DailyNote]]",
      pn__DailyNote_day: "[[2025-10-20]]",
    };

    const taskFile = {
      path: "task.md",
      basename: "task",
    } as TFile;

    const taskMetadata = {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_day: "[[2025-10-20]]",
      ems__Effort_startTimestamp: "2025-10-20T09:00:00",
      ems__Effort_status: "[[ems__EffortStatusBacklog]]",
    };

    ctx.mockMetadataExtractor.extractMetadata
      .mockReturnValueOnce(metadata)
      .mockReturnValueOnce(taskMetadata);

    ctx.mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
      "[[pn__DailyNote]]",
    );

    ctx.mockVaultAdapter.getAllFiles.mockReturnValue([taskFile]);

    const linkedFile = {
      path: "linked.md",
      basename: "linked",
    } as TFile;

    const linkedMetadata = {
      exo__Asset_label: "   ",
    };

    ctx.mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(linkedFile);
    ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
      frontmatter: linkedMetadata,
    });

    const mockEl = createMockElement();
    await ctx.renderer.render(mockEl, mockFile);

    const renderCall = ctx.mockReactRenderer.render.mock.calls[0];
    const getAssetLabel = renderCall[1].props.getAssetLabel;
    const result = getAssetLabel("linked");
    expect(result).toBeNull();
  });
});
