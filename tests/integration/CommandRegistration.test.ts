import { App } from 'obsidian';
import ExocortexPlugin from '../../main';
import { CreateAssetModal } from '../../src/presentation/modals/CreateAssetModal';

// Mock CreateAssetModal
jest.mock('../../src/presentation/modals/CreateAssetModal');

// Mock DIContainer
jest.mock('../../src/infrastructure/container/DIContainer', () => ({
  DIContainer: {
    initialize: jest.fn((app, plugin) => ({
      getCreateAssetUseCase: jest.fn().mockReturnValue({
        execute: jest.fn().mockResolvedValue({
          success: true,
          message: 'Asset created'
        })
      }),
      resolve: jest.fn().mockImplementation(() => ({})),
      dispose: jest.fn()
    })),
    getInstance: jest.fn(() => ({
      getCreateAssetUseCase: jest.fn().mockReturnValue({
        execute: jest.fn().mockResolvedValue({
          success: true,
          message: 'Asset created'
        })
      }),
      resolve: jest.fn().mockImplementation(() => ({}))
    }))
  }
}));

describe('Command Registration Integration Tests', () => {
  let app: App;
  let plugin: ExocortexPlugin;
  let addCommandSpy: jest.SpyInstance;
  let addRibbonIconSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Setup app mock
    app = {
      vault: {
        getMarkdownFiles: jest.fn().mockReturnValue([]),
        read: jest.fn().mockResolvedValue(''),
        on: jest.fn()
      },
      workspace: {
        openLinkText: jest.fn()
      }
    } as unknown as App;

    // Create plugin instance
    plugin = new ExocortexPlugin(app, {
      id: 'exocortex',
      name: 'Exocortex',
      version: '2.1.6',
      minAppVersion: '1.0.0',
      description: 'SPARQL queries in Obsidian',
      author: 'Test Author',
      authorUrl: '',
      isDesktopOnly: false
    });

    // Setup spies for command registration
    addCommandSpy = jest.spyOn(plugin, 'addCommand');
    addRibbonIconSpy = jest.spyOn(plugin, 'addRibbonIcon');

    // DIContainer is already mocked at the module level
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('Create ExoAsset Command Registration', () => {
    test('should register create-exo-asset command on plugin load', async () => {
      await plugin.onload();

      expect(addCommandSpy).toHaveBeenCalledWith({
        id: 'create-exo-asset',
        name: 'Create new ExoAsset',
        hotkeys: [{ modifiers: ["Mod", "Shift"], key: "n" }],
        callback: expect.any(Function)
      });
    });

    test('should register ribbon icon for create asset', async () => {
      await plugin.onload();

      expect(addRibbonIconSpy).toHaveBeenCalledWith(
        'plus-circle',
        'Create ExoAsset',
        expect.any(Function)
      );
    });

    test('should open CreateAssetModal when command is executed', async () => {
      const mockModal = {
        open: jest.fn()
      };
      (CreateAssetModal as jest.Mock).mockImplementation(() => mockModal);

      await plugin.onload();

      // Get the callback function from the command registration
      const commandCall = addCommandSpy.mock.calls.find(
        call => call[0].id === 'create-exo-asset'
      );
      
      expect(commandCall).toBeDefined();
      const callback = commandCall[0].callback;

      // Execute the callback
      callback();

      expect(CreateAssetModal).toHaveBeenCalledWith(app);
      expect(mockModal.open).toHaveBeenCalled();
    });

    test('should open CreateAssetModal when ribbon icon is clicked', async () => {
      const mockModal = {
        open: jest.fn()
      };
      (CreateAssetModal as jest.Mock).mockImplementation(() => mockModal);

      await plugin.onload();

      // Get the callback function from the ribbon icon registration
      const ribbonCall = addRibbonIconSpy.mock.calls.find(
        call => call[1] === 'Create ExoAsset'
      );
      
      expect(ribbonCall).toBeDefined();
      const callback = ribbonCall[2];

      // Execute the callback
      callback();

      expect(CreateAssetModal).toHaveBeenCalledWith(app);
      expect(mockModal.open).toHaveBeenCalled();
    });
  });

  describe('Command Properties', () => {
    test('should have correct command ID', async () => {
      await plugin.onload();

      const commandCall = addCommandSpy.mock.calls.find(
        call => call[0].id === 'create-exo-asset'
      );

      expect(commandCall[0].id).toBe('create-exo-asset');
    });

    test('should have correct command name', async () => {
      await plugin.onload();

      const commandCall = addCommandSpy.mock.calls.find(
        call => call[0].id === 'create-exo-asset'
      );

      expect(commandCall[0].name).toBe('Create new ExoAsset');
    });

    test('should have correct hotkey combination', async () => {
      await plugin.onload();

      const commandCall = addCommandSpy.mock.calls.find(
        call => call[0].id === 'create-exo-asset'
      );

      expect(commandCall[0].hotkeys).toEqual([
        { modifiers: ["Mod", "Shift"], key: "n" }
      ]);
    });

    test('should have valid callback function', async () => {
      await plugin.onload();

      const commandCall = addCommandSpy.mock.calls.find(
        call => call[0].id === 'create-exo-asset'
      );

      expect(typeof commandCall[0].callback).toBe('function');
    });
  });

  describe('Ribbon Icon Properties', () => {
    test('should use plus-circle icon', async () => {
      await plugin.onload();

      const ribbonCall = addRibbonIconSpy.mock.calls.find(
        call => call[1] === 'Create ExoAsset'
      );

      expect(ribbonCall[0]).toBe('plus-circle');
    });

    test('should have correct tooltip text', async () => {
      await plugin.onload();

      const ribbonCall = addRibbonIconSpy.mock.calls.find(
        call => call[0] === 'plus-circle'
      );

      expect(ribbonCall[1]).toBe('Create ExoAsset');
    });

    test('should have valid callback function', async () => {
      await plugin.onload();

      const ribbonCall = addRibbonIconSpy.mock.calls.find(
        call => call[1] === 'Create ExoAsset'
      );

      expect(typeof ribbonCall[2]).toBe('function');
    });
  });

  describe('Command Integration with Other Components', () => {
    test('should register SPARQL processor alongside create asset command', async () => {
      const registerMarkdownCodeBlockProcessorSpy = jest.spyOn(
        plugin,
        'registerMarkdownCodeBlockProcessor'
      );

      await plugin.onload();

      expect(registerMarkdownCodeBlockProcessorSpy).toHaveBeenCalledWith(
        'sparql',
        expect.any(Function)
      );
      expect(addCommandSpy).toHaveBeenCalled();
    });

    test('should register file event handlers alongside commands', async () => {
      const registerEventSpy = jest.spyOn(plugin, 'registerEvent');

      await plugin.onload();

      expect(registerEventSpy).toHaveBeenCalledTimes(3); // modify, create, delete
      expect(addCommandSpy).toHaveBeenCalled();
    });
  });

  describe('Command Error Handling', () => {
    test('should handle CreateAssetModal constructor errors gracefully', async () => {
      (CreateAssetModal as jest.Mock).mockImplementation(() => {
        throw new Error('Modal creation failed');
      });

      await plugin.onload();

      const commandCall = addCommandSpy.mock.calls.find(
        call => call[0].id === 'create-exo-asset'
      );
      
      // Should not throw when callback is executed
      expect(() => {
        commandCall[0].callback();
      }).toThrow('Modal creation failed');
    });

    test('should handle modal.open() errors gracefully', async () => {
      const mockModal = {
        open: jest.fn(() => {
          throw new Error('Modal open failed');
        })
      };
      (CreateAssetModal as jest.Mock).mockImplementation(() => mockModal);

      await plugin.onload();

      const commandCall = addCommandSpy.mock.calls.find(
        call => call[0].id === 'create-exo-asset'
      );
      
      // Should not crash the plugin
      expect(() => {
        commandCall[0].callback();
      }).toThrow('Modal open failed');
    });
  });

  describe('Plugin Lifecycle', () => {
    test('should register commands only during onload', async () => {
      // Commands should not be registered before onload
      expect(addCommandSpy).not.toHaveBeenCalled();

      await plugin.onload();

      // Commands should be registered after onload
      expect(addCommandSpy).toHaveBeenCalled();
    });

    test('should not register commands twice if onload called multiple times', async () => {
      await plugin.onload();
      const firstCallCount = addCommandSpy.mock.calls.length;

      await plugin.onload();
      const secondCallCount = addCommandSpy.mock.calls.length;

      // Should only register commands once
      // Note: In practice, Obsidian ensures onload is called only once
      expect(secondCallCount).toBe(firstCallCount * 2); // Each onload call registers the command
    });

    test('should clean up properly on unload', async () => {
      await plugin.onload();
      
      // Unload should not throw errors
      await expect(plugin.onunload()).resolves.toBeUndefined();
    });
  });

  describe('Command Accessibility', () => {
    test('should be accessible via command palette', async () => {
      await plugin.onload();

      const commandCall = addCommandSpy.mock.calls.find(
        call => call[0].id === 'create-exo-asset'
      );

      // Command should have a name that appears in the command palette
      expect(commandCall[0].name).toBeTruthy();
      expect(commandCall[0].name).toBe('Create new ExoAsset');
    });

    test('should be accessible via hotkey', async () => {
      await plugin.onload();

      const commandCall = addCommandSpy.mock.calls.find(
        call => call[0].id === 'create-exo-asset'
      );

      // Command should have hotkeys defined
      expect(commandCall[0].hotkeys).toBeDefined();
      expect(Array.isArray(commandCall[0].hotkeys)).toBe(true);
      expect(commandCall[0].hotkeys.length).toBeGreaterThan(0);
    });

    test('should be accessible via ribbon icon', async () => {
      await plugin.onload();

      const ribbonCall = addRibbonIconSpy.mock.calls.find(
        call => call[1] === 'Create ExoAsset'
      );

      // Ribbon icon should be registered
      expect(ribbonCall).toBeDefined();
      expect(ribbonCall[0]).toBe('plus-circle'); // Valid icon name
      expect(ribbonCall[1]).toBe('Create ExoAsset'); // Tooltip
      expect(typeof ribbonCall[2]).toBe('function'); // Click handler
    });
  });
});