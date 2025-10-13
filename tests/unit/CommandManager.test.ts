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

      // Verify that addCommand was called for each command (8 commands total)
      expect(mockPlugin.addCommand).toHaveBeenCalledTimes(8);
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
      expect(registeredCommands).toContain("create-instance");
      expect(registeredCommands).toContain("start-effort");
      expect(registeredCommands).toContain("plan-on-today");
      expect(registeredCommands).toContain("mark-done");
      expect(registeredCommands).toContain("archive-task");
      expect(registeredCommands).toContain("clean-properties");
      expect(registeredCommands).toContain("repair-folder");
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
      expect(registeredNames).toContain("Create Instance");
      expect(registeredNames).toContain("Start Effort");
      expect(registeredNames).toContain("Plan on today");
      expect(registeredNames).toContain("Mark as Done");
      expect(registeredNames).toContain("Archive Task");
      expect(registeredNames).toContain("Clean Empty Properties");
      expect(registeredNames).toContain("Repair Folder");
    });

    it("should register commands with checkCallback function", () => {
      const mockApp = {
        vault: {},
        metadataCache: {},
        workspace: {},
      } as any;

      const registeredCallbacks: any[] = [];
      const mockPlugin = {
        addCommand: jest.fn((command: any) => {
          registeredCallbacks.push(command.checkCallback);
        }),
      };

      const commandManager = new CommandManager(mockApp);
      commandManager.registerAllCommands(mockPlugin);

      // Verify all commands have checkCallback functions
      registeredCallbacks.forEach((callback) => {
        expect(typeof callback).toBe("function");
      });
    });
  });
});
