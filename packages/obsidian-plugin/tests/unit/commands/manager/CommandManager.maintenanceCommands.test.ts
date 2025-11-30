import {
  setupCommandManagerTest,
  CommandManagerTestContext,
  TFile,
} from "./CommandManager.fixtures";

describe("CommandManager - maintenance commands", () => {
  let ctx: CommandManagerTestContext;

  beforeEach(() => {
    ctx = setupCommandManagerTest();
  });

  describe("Archive Task Command", () => {
    beforeEach(() => {
      ctx.commandManager.registerAllCommands(ctx.mockPlugin);
    });

    it("should be visible for Task with Done status", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusDone",
        },
      });

      const command = ctx.registeredCommands.get("archive-task");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for archived Task", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusDone",
          exo__Asset_isArchived: true,
        },
      });

      const command = ctx.registeredCommands.get("archive-task");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Clean Properties Command", () => {
    beforeEach(() => {
      ctx.commandManager.registerAllCommands(ctx.mockPlugin);
    });

    it("should be visible for file with empty properties", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          empty_prop: "",
          null_prop: null,
        },
      });

      const command = ctx.registeredCommands.get("clean-properties");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for file without empty properties", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
        },
      });

      const command = ctx.registeredCommands.get("clean-properties");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });

    it("should not be visible for file without frontmatter", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: null,
      });

      const command = ctx.registeredCommands.get("clean-properties");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Repair Folder Command", () => {
    beforeEach(() => {
      ctx.commandManager.registerAllCommands(ctx.mockPlugin);
    });

    it("should be visible for file with isDefinedBy property", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_isDefinedBy: "[[ems__Area]]",
        },
      });

      const command = ctx.registeredCommands.get("repair-folder");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for file without isDefinedBy property", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {},
      });

      const command = ctx.registeredCommands.get("repair-folder");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Rename To UID Command", () => {
    beforeEach(() => {
      ctx.commandManager.registerAllCommands(ctx.mockPlugin);
    });

    it("should be visible when filename differs from UID", () => {
      ctx.mockFile = {
        basename: "wrong-name",
        path: "test/wrong-name.md",
        parent: { path: "test" },
      } as unknown as TFile;
      ctx.mockApp.workspace.getActiveFile.mockReturnValue(ctx.mockFile);

      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_uid: "correct-uid",
        },
      });

      const command = ctx.registeredCommands.get("rename-to-uid");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible when filename matches UID", () => {
      ctx.mockFile = {
        basename: "matching-uid",
        path: "test/matching-uid.md",
        parent: { path: "test" },
      } as unknown as TFile;
      ctx.mockApp.workspace.getActiveFile.mockReturnValue(ctx.mockFile);

      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_uid: "matching-uid",
        },
      });

      const command = ctx.registeredCommands.get("rename-to-uid");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Vote On Effort Command", () => {
    beforeEach(() => {
      ctx.commandManager.registerAllCommands(ctx.mockPlugin);
    });

    it("should be visible for non-archived Task", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
        },
      });

      const command = ctx.registeredCommands.get("vote-on-effort");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for archived Task", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          exo__Asset_isArchived: true,
        },
      });

      const command = ctx.registeredCommands.get("vote-on-effort");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Copy Label To Aliases Command", () => {
    beforeEach(() => {
      ctx.commandManager.registerAllCommands(ctx.mockPlugin);
    });

    it("should be visible for file with label", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_label: "Test Label",
        },
      });

      const command = ctx.registeredCommands.get("copy-label-to-aliases");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for file without label", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {},
      });

      const command = ctx.registeredCommands.get("copy-label-to-aliases");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });

    it("should not be visible for file with empty label", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_label: "",
        },
      });

      const command = ctx.registeredCommands.get("copy-label-to-aliases");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });

    it("should be visible when label not in aliases", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_label: "Test Label",
          aliases: ["Other Alias"],
        },
      });

      const command = ctx.registeredCommands.get("copy-label-to-aliases");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });
  });
});
