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

      // Verify that addCommand was called for each command (20 commands total)
      expect(mockPlugin.addCommand).toHaveBeenCalledTimes(20);
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
      expect(registeredCommands).toContain("reload-layout");
      expect(registeredCommands).toContain("add-supervision");
      expect(registeredCommands).toContain("rename-to-uid");
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

      // Verify all expected command names are registered
      expect(registeredNames).toContain("Create Task");
      expect(registeredNames).toContain("Create Project");
      expect(registeredNames).toContain("Create Instance");
      expect(registeredNames).toContain("Set Draft Status");
      expect(registeredNames).toContain("Move to Backlog");
      expect(registeredNames).toContain("Start Effort");
      expect(registeredNames).toContain("Plan on today");
      expect(registeredNames).toContain("Plan for Evening (19:00)");
      expect(registeredNames).toContain("Shift Day Backward");
      expect(registeredNames).toContain("Shift Day Forward");
      expect(registeredNames).toContain("Mark as Done");
      expect(registeredNames).toContain("Trash");
      expect(registeredNames).toContain("Archive Task");
      expect(registeredNames).toContain("Clean Empty Properties");
      expect(registeredNames).toContain("Repair Folder");
      expect(registeredNames).toContain("Reload Layout");
      expect(registeredNames).toContain("Add Supervision");
      expect(registeredNames).toContain("Rename to UID");
      expect(registeredNames).toContain("Toggle Properties Visibility");
      expect(registeredNames).toContain("Toggle Layout Visibility");
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
