/**
 * Command Controller abstraction following Controller Pattern (GRASP)
 * Defines interface for command handling and registration
 */
export interface ICommandController {
  /**
   * Register commands with the Obsidian plugin system
   */
  registerCommands(): Promise<void>;

  /**
   * Cleanup resources when plugin unloads
   */
  cleanup(): Promise<void>;

  /**
   * Get controller identifier for logging/debugging
   */
  getControllerId(): string;
}
