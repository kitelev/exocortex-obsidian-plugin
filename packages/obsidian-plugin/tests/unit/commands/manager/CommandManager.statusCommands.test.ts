import {
  setupCommandManagerTest,
  CommandManagerTestContext,
} from "./CommandManager.fixtures";

describe("CommandManager - status commands", () => {
  let ctx: CommandManagerTestContext;

  beforeEach(() => {
    ctx = setupCommandManagerTest();
  });

  describe("Set Draft Status Command", () => {
    beforeEach(() => {
      ctx.commandManager.registerAllCommands(ctx.mockPlugin);
    });

    it("should be visible for Task without status", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
        },
      });

      const command = ctx.registeredCommands.get("set-draft-status");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for Task with Draft status", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusDraft",
        },
      });

      const command = ctx.registeredCommands.get("set-draft-status");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Move To Backlog Command", () => {
    beforeEach(() => {
      ctx.commandManager.registerAllCommands(ctx.mockPlugin);
    });

    it("should be visible for Task with Draft status", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusDraft",
        },
      });

      const command = ctx.registeredCommands.get("move-to-backlog");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for Task with Backlog status", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusBacklog",
        },
      });

      const command = ctx.registeredCommands.get("move-to-backlog");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Move To Analysis Command", () => {
    beforeEach(() => {
      ctx.commandManager.registerAllCommands(ctx.mockPlugin);
    });

    it("should be visible for Project with Backlog status", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Project]]",
          ems__Effort_status: "ems__EffortStatusBacklog",
        },
      });

      const command = ctx.registeredCommands.get("move-to-analysis");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });
  });

  describe("Move To ToDo Command", () => {
    beforeEach(() => {
      ctx.commandManager.registerAllCommands(ctx.mockPlugin);
    });

    it("should be visible for Project with Analysis status", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Project]]",
          ems__Effort_status: "ems__EffortStatusAnalysis",
        },
      });

      const command = ctx.registeredCommands.get("move-to-todo");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });
  });

  describe("Start Effort Command", () => {
    beforeEach(() => {
      ctx.commandManager.registerAllCommands(ctx.mockPlugin);
    });

    it("should be visible for Task with Backlog status", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusBacklog",
        },
      });

      const command = ctx.registeredCommands.get("start-effort");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for Task with In Progress status", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusDoing",
        },
      });

      const command = ctx.registeredCommands.get("start-effort");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Plan On Today Command", () => {
    beforeEach(() => {
      ctx.commandManager.registerAllCommands(ctx.mockPlugin);
    });

    it("should be visible for Task with ToDo status", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusToDo",
        },
      });

      const command = ctx.registeredCommands.get("plan-on-today");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });
  });

  describe("Plan For Evening Command", () => {
    beforeEach(() => {
      ctx.commandManager.registerAllCommands(ctx.mockPlugin);
    });

    it("should be visible for Task with Backlog status", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusBacklog",
        },
      });

      const command = ctx.registeredCommands.get("plan-for-evening");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });
  });

  describe("Shift Day Backward Command", () => {
    beforeEach(() => {
      ctx.commandManager.registerAllCommands(ctx.mockPlugin);
    });

    it("should be visible for Task with effort day", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_plannedStartTimestamp: "2025-01-20T00:00:00",
        },
      });

      const command = ctx.registeredCommands.get("shift-day-backward");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for Task without effort day", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
        },
      });

      const command = ctx.registeredCommands.get("shift-day-backward");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Shift Day Forward Command", () => {
    beforeEach(() => {
      ctx.commandManager.registerAllCommands(ctx.mockPlugin);
    });

    it("should be visible for Task with effort day", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_plannedStartTimestamp: "2025-01-20T00:00:00",
        },
      });

      const command = ctx.registeredCommands.get("shift-day-forward");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });
  });

  describe("Mark Done Command", () => {
    beforeEach(() => {
      ctx.commandManager.registerAllCommands(ctx.mockPlugin);
    });

    it("should be visible for Task with In Progress status", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusDoing",
        },
      });

      const command = ctx.registeredCommands.get("mark-done");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for Task with Done status", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusDone",
        },
      });

      const command = ctx.registeredCommands.get("mark-done");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Trash Effort Command", () => {
    beforeEach(() => {
      ctx.commandManager.registerAllCommands(ctx.mockPlugin);
    });

    it("should be visible for Task not trashed", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
        },
      });

      const command = ctx.registeredCommands.get("trash-effort");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for trashed Task", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusTrashed",
        },
      });

      const command = ctx.registeredCommands.get("trash-effort");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });
});
