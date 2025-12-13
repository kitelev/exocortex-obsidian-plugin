import {
  setupCommandManagerTest,
  CommandManagerTestContext,
  TFile,
  Notice,
  flushPromises,
} from "./CommandManager.fixtures";

describe("CommandManager - error handling", () => {
  let ctx: CommandManagerTestContext;

  beforeEach(() => {
    ctx = setupCommandManagerTest();
  });

  describe("Command Execution - Error Handling", () => {
    beforeEach(() => {
      ctx.commandManager.registerAllCommands(ctx.mockPlugin);
    });

    it("should handle errors in set draft status execution", async () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
        },
      });

      ctx.mockApp.vault.modify.mockRejectedValue(new Error("Vault error"));

      const command = ctx.registeredCommands.get("set-draft-status");
      await command.checkCallback(false);

      await flushPromises();

      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining("Failed to set draft status"),
      );
    });

    it("should handle errors in move to backlog execution", async () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusDraft",
        },
      });

      ctx.mockApp.vault.modify.mockRejectedValue(new Error("Vault error"));

      const command = ctx.registeredCommands.get("move-to-backlog");
      await command.checkCallback(false);

      await flushPromises();

      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining("Failed to move to backlog"),
      );
    });

    it("should handle errors in move to analysis execution", async () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Project]]",
          ems__Effort_status: "ems__EffortStatusBacklog",
        },
      });

      ctx.mockApp.vault.modify.mockRejectedValue(new Error("Vault error"));

      const command = ctx.registeredCommands.get("move-to-analysis");
      await command.checkCallback(false);

      await flushPromises();

      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining("Failed to move to analysis"),
      );
    });

    it("should handle errors in move to todo execution", async () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Project]]",
          ems__Effort_status: "ems__EffortStatusAnalysis",
        },
      });

      ctx.mockApp.vault.modify.mockRejectedValue(new Error("Vault error"));

      const command = ctx.registeredCommands.get("move-to-todo");
      await command.checkCallback(false);

      await flushPromises();

      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining("Failed to move to todo"),
      );
    });

    it("should handle errors in start effort execution", async () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusBacklog",
        },
      });

      ctx.mockApp.vault.modify.mockRejectedValue(new Error("Vault error"));

      const command = ctx.registeredCommands.get("start-effort");
      await command.checkCallback(false);

      await flushPromises();

      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining("Failed to start effort"),
      );
    });

    it("should handle errors in plan on today execution", async () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusToDo",
        },
      });

      ctx.mockApp.vault.modify.mockRejectedValue(new Error("Vault error"));

      const command = ctx.registeredCommands.get("plan-on-today");
      await command.checkCallback(false);

      await flushPromises();

      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining("Failed to plan on today"),
      );
    });

    it("should handle errors in plan for evening execution", async () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusBacklog",
        },
      });

      ctx.mockApp.vault.modify.mockRejectedValue(new Error("Vault error"));

      const command = ctx.registeredCommands.get("plan-for-evening");
      await command.checkCallback(false);

      await flushPromises();

      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining("Failed to plan for evening"),
      );
    });

    it("should handle errors in shift day backward execution", async () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_plannedStartTimestamp: "2025-01-20T00:00:00",
        },
      });

      ctx.mockApp.vault.modify.mockRejectedValue(new Error("Vault error"));

      const command = ctx.registeredCommands.get("shift-day-backward");
      await command.checkCallback(false);

      await flushPromises();

      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining("Failed to shift day backward"),
      );
    });

    it("should handle errors in shift day forward execution", async () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_plannedStartTimestamp: "2025-01-20T00:00:00",
        },
      });

      ctx.mockApp.vault.modify.mockRejectedValue(new Error("Vault error"));

      const command = ctx.registeredCommands.get("shift-day-forward");
      await command.checkCallback(false);

      await flushPromises();

      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining("Failed to shift day forward"),
      );
    });

    it("should handle errors in mark done execution", async () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusDoing",
        },
      });

      ctx.mockApp.vault.modify.mockRejectedValue(new Error("Vault error"));

      const command = ctx.registeredCommands.get("mark-done");
      await command.checkCallback(false);

      await flushPromises();

      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining("Failed to mark as done"),
      );
    });

    // Skip: TrashEffortCommand requires modal which uses path alias (@plugin/...)
    // that Jest's moduleNameMapper doesn't resolve correctly for mock paths.
    // The command is fully tested in TrashEffortCommand.test.ts
    it.skip("should handle errors in trash effort execution", async () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
        },
      });

      ctx.mockApp.vault.modify.mockRejectedValue(new Error("Vault error"));

      const command = ctx.registeredCommands.get("trash-effort");
      await command.checkCallback(false);

      await flushPromises();

      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining("Failed to trash effort"),
      );
    });

    it("should handle errors in archive task execution", async () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusDone",
        },
      });

      ctx.mockApp.vault.modify.mockRejectedValue(new Error("Vault error"));

      const command = ctx.registeredCommands.get("archive-task");
      await command.checkCallback(false);

      await flushPromises();

      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining("Failed to archive task"),
      );
    });

    it("should handle errors in clean properties execution", async () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          empty_prop: "",
        },
      });

      ctx.mockApp.vault.modify.mockRejectedValue(new Error("Vault error"));

      const command = ctx.registeredCommands.get("clean-properties");
      await command.checkCallback(false);

      await flushPromises();

      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining("Failed to clean properties"),
      );
    });

    it("should handle errors in repair folder execution", async () => {
      ctx.mockFile = {
        basename: "test-file",
        path: "wrong-folder/test-file.md",
        parent: { path: "wrong-folder" },
      } as unknown as TFile;
      ctx.mockApp.workspace.getActiveFile.mockReturnValue(ctx.mockFile);

      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_isDefinedBy: "[[test-area]]",
        },
      });

      const mockArea = {
        path: "correct-folder/test-area.md",
        parent: { path: "correct-folder" },
      };
      ctx.mockApp.metadataCache.getFirstLinkpathDest = jest
        .fn()
        .mockReturnValue(mockArea);

      ctx.mockApp.vault.rename = jest
        .fn()
        .mockRejectedValue(new Error("Vault error"));

      const command = ctx.registeredCommands.get("repair-folder");
      await command.checkCallback(false);

      await flushPromises();

      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining("Failed to repair folder"),
      );
    });

    it("should handle errors in rename to uid execution", async () => {
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

      ctx.mockApp.fileManager.renameFile = jest
        .fn()
        .mockRejectedValue(new Error("Vault error"));

      const command = ctx.registeredCommands.get("rename-to-uid");
      await command.checkCallback(false);

      await flushPromises();

      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining("Failed to rename"),
      );
    });

    it("should handle errors in vote on effort execution", async () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
        },
      });

      ctx.mockApp.vault.modify.mockRejectedValue(new Error("Vault error"));

      const command = ctx.registeredCommands.get("vote-on-effort");
      await command.checkCallback(false);

      await flushPromises();

      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining("Failed to vote"),
      );
    });

    it("should handle errors in copy label to aliases execution", async () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_label: "Test Label",
        },
      });

      ctx.mockApp.vault.modify.mockRejectedValue(new Error("Vault error"));

      const command = ctx.registeredCommands.get("copy-label-to-aliases");
      await command.checkCallback(false);

      await flushPromises();

      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining("Failed to copy label"),
      );
    });
  });
});
