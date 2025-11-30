import {
  setupCommandManagerTest,
  CommandManagerTestContext,
} from "./CommandManager.fixtures";

describe("CommandManager - create commands", () => {
  let ctx: CommandManagerTestContext;

  beforeEach(() => {
    ctx = setupCommandManagerTest();
  });

  describe("Create Task Command", () => {
    beforeEach(() => {
      ctx.commandManager.registerAllCommands(ctx.mockPlugin);
    });

    it("should be visible for Area class", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Area]]",
        },
      });

      const command = ctx.registeredCommands.get("create-task");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should be visible for Project class", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Project]]",
        },
      });

      const command = ctx.registeredCommands.get("create-task");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for Task class", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
        },
      });

      const command = ctx.registeredCommands.get("create-task");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });

    it("should be visible even for archived Area", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Area]]",
          exo__Asset_isArchived: true,
        },
      });

      const command = ctx.registeredCommands.get("create-task");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });
  });

  describe("Create Project Command", () => {
    beforeEach(() => {
      ctx.commandManager.registerAllCommands(ctx.mockPlugin);
    });

    it("should be visible for Area class", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Area]]",
        },
      });

      const command = ctx.registeredCommands.get("create-project");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should be visible for Project class", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Project]]",
        },
      });

      const command = ctx.registeredCommands.get("create-project");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });
  });

  describe("Create Instance Command", () => {
    beforeEach(() => {
      ctx.commandManager.registerAllCommands(ctx.mockPlugin);
    });

    it("should be visible for Task Prototype class", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__TaskPrototype]]",
        },
      });

      const command = ctx.registeredCommands.get("create-instance");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for Task class", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
        },
      });

      const command = ctx.registeredCommands.get("create-instance");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Create Related Task Command", () => {
    beforeEach(() => {
      ctx.commandManager.registerAllCommands(ctx.mockPlugin);
    });

    it("should be visible for Task class", () => {
      ctx.mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
        },
      });

      const command = ctx.registeredCommands.get("create-related-task");
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

      const command = ctx.registeredCommands.get("create-related-task");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });
});
