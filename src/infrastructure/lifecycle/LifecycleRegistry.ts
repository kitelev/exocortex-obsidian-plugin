import { Plugin } from "obsidian";
import { ILifecycleManager } from "../../application/ports/ILifecycleManager";

/**
 * Lifecycle Registry following Pure Fabrication Pattern (GRASP)
 * Single Responsibility: Coordinate all lifecycle managers
 */
export class LifecycleRegistry {
  private readonly managers: ILifecycleManager[] = [];

  constructor(private readonly plugin: Plugin) {}

  /**
   * Register a lifecycle manager
   */
  registerManager(manager: ILifecycleManager): void {
    this.managers.push(manager);
  }

  /**
   * Initialize all registered managers
   */
  async initializeAll(): Promise<void> {
    for (const manager of this.managers) {
      try {
        await manager.initialize();
        console.log(`Initialized manager: ${manager.getManagerId()}`);
      } catch (error) {
        console.error(
          `Failed to initialize manager ${manager.getManagerId()}:`,
          error
        );
      }
    }
  }

  /**
   * Cleanup all registered managers
   */
  async cleanupAll(): Promise<void> {
    // Cleanup in reverse order
    for (let i = this.managers.length - 1; i >= 0; i--) {
      const manager = this.managers[i];
      try {
        await manager.cleanup();
        console.log(`Cleaned up manager: ${manager.getManagerId()}`);
      } catch (error) {
        console.error(
          `Failed to cleanup manager ${manager.getManagerId()}:`,
          error
        );
      }
    }
  }

  /**
   * Get a specific manager by type
   */
  getManager<T extends ILifecycleManager>(managerType: new (...args: any[]) => T): T | null {
    return this.managers.find(manager => manager instanceof managerType) as T || null;
  }

  /**
   * Get all registered managers
   */
  getManagers(): readonly ILifecycleManager[] {
    return this.managers;
  }
}