/**
 * CommandManager Unit Tests
 *
 * Note: These tests focus on the structure and initialization of CommandManager.
 * Full integration testing requires mocking Obsidian API which is handled by
 * integration tests and BDD scenarios.
 */

import { CommandManager } from "../../src/application/services/CommandManager";

describe("CommandManager", () => {
  describe("Constructor", () => {
    it("should be instantiable with App", () => {
      const mockApp = {} as any;
      const commandManager = new CommandManager(mockApp);

      expect(commandManager).toBeDefined();
      expect(commandManager).toBeInstanceOf(CommandManager);
    });
  });

  describe("Service Dependencies", () => {
    it("should initialize with required services", () => {
      const mockApp = {
        vault: {},
        metadataCache: {},
        workspace: {},
      } as any;

      const commandManager = new CommandManager(mockApp);

      // CommandManager should be created successfully with app dependencies
      expect(commandManager).toBeDefined();
    });
  });

  describe("registerAllCommands", () => {
    it("should not throw when registering commands", () => {
      const mockApp = {
        vault: {},
        metadataCache: {},
        workspace: {},
      } as any;

      const mockPlugin = {
        addCommand: jest.fn(),
      };

      const commandManager = new CommandManager(mockApp);

      // Should register commands without errors
      expect(() => {
        commandManager.registerAllCommands(mockPlugin);
      }).not.toThrow();

      // Verify that addCommand was called for each command (26 commands total)
      expect(mockPlugin.addCommand).toHaveBeenCalledTimes(26);
    });

    it("should register commands with correct IDs", () => {
      const mockApp = {
        vault: {},
        metadataCache: {},
        workspace: {},
      } as any;

      const registeredCommands: string[] = [];
      const mockPlugin = {
        addCommand: jest.fn((command: any) => {
          registeredCommands.push(command.id);
        }),
      };

      const commandManager = new CommandManager(mockApp);
      commandManager.registerAllCommands(mockPlugin);

      // Verify all expected command IDs are registered
      expect(registeredCommands).toContain("create-task");
      expect(registeredCommands).toContain("create-project");
      expect(registeredCommands).toContain("create-instance");
      expect(registeredCommands).toContain("create-related-task");
      expect(registeredCommands).toContain("set-draft-status");
      expect(registeredCommands).toContain("move-to-backlog");
      expect(registeredCommands).toContain("start-effort");
      expect(registeredCommands).toContain("plan-on-today");
      expect(registeredCommands).toContain("plan-for-evening");
      expect(registeredCommands).toContain("shift-day-backward");
      expect(registeredCommands).toContain("shift-day-forward");
      expect(registeredCommands).toContain("mark-done");
      expect(registeredCommands).toContain("trash-effort");
      expect(registeredCommands).toContain("archive-task");
      expect(registeredCommands).toContain("clean-properties");
      expect(registeredCommands).toContain("repair-folder");
      expect(registeredCommands).toContain("rename-to-uid");
      expect(registeredCommands).toContain("vote-on-effort");
      expect(registeredCommands).toContain("copy-label-to-aliases");
      expect(registeredCommands).toContain("reload-layout");
      expect(registeredCommands).toContain("add-supervision");
      expect(registeredCommands).toContain("toggle-properties-visibility");
      expect(registeredCommands).toContain("toggle-layout-visibility");
    });

    it("should register commands with correct names", () => {
      const mockApp = {
        vault: {},
        metadataCache: {},
        workspace: {},
      } as any;

      const registeredNames: string[] = [];
      const mockPlugin = {
        addCommand: jest.fn((command: any) => {
          registeredNames.push(command.name);
        }),
      };

      const commandManager = new CommandManager(mockApp);
      commandManager.registerAllCommands(mockPlugin);

      // Verify all expected command names are registered (sentence case)
      expect(registeredNames).toContain("Create task");
      expect(registeredNames).toContain("Create project");
      expect(registeredNames).toContain("Create instance");
      expect(registeredNames).toContain("Create related task");
      expect(registeredNames).toContain("Set draft status");
      expect(registeredNames).toContain("Move to backlog");
      expect(registeredNames).toContain("Start effort");
      expect(registeredNames).toContain("Plan on today");
      expect(registeredNames).toContain("Plan for evening (19:00)");
      expect(registeredNames).toContain("Shift day backward");
      expect(registeredNames).toContain("Shift day forward");
      expect(registeredNames).toContain("Mark as done");
      expect(registeredNames).toContain("Trash");
      expect(registeredNames).toContain("Archive task");
      expect(registeredNames).toContain("Clean empty properties");
      expect(registeredNames).toContain("Repair folder");
      expect(registeredNames).toContain("Rename to uid");
      expect(registeredNames).toContain("Vote on effort");
      expect(registeredNames).toContain("Copy label to aliases");
      expect(registeredNames).toContain("Reload layout");
      expect(registeredNames).toContain("Add supervision");
      expect(registeredNames).toContain("Toggle properties visibility");
      expect(registeredNames).toContain("Toggle layout visibility");
    });

    it("should register commands with checkCallback or callback function", () => {
      const mockApp = {
        vault: {},
        metadataCache: {},
        workspace: {},
      } as any;

      const registeredCommands: any[] = [];
      const mockPlugin = {
        addCommand: jest.fn((command: any) => {
          registeredCommands.push(command);
        }),
      };

      const commandManager = new CommandManager(mockApp);
      commandManager.registerAllCommands(mockPlugin);

      // Verify all commands have either checkCallback or callback function
      registeredCommands.forEach((command) => {
        const hasCheckCallback = typeof command.checkCallback === "function";
        const hasCallback = typeof command.callback === "function";
        expect(hasCheckCallback || hasCallback).toBe(true);
      });
    });
  });
});
