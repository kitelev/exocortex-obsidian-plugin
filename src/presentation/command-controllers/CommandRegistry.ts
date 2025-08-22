import { Plugin } from "obsidian";
import { ICommandController } from "../../application/ports/ICommandController";

/**
 * Command Registry following Open/Closed Principle
 * Open for extension (new controllers), closed for modification
 */
export class CommandRegistry {
  private readonly controllers: ICommandController[] = [];

  constructor(private readonly plugin: Plugin) {}

  /**
   * Register a command controller
   */
  registerController(controller: ICommandController): void {
    this.controllers.push(controller);
  }

  /**
   * Initialize all registered controllers
   */
  async initializeAll(): Promise<void> {
    for (const controller of this.controllers) {
      try {
        await controller.registerCommands();
        console.log(`Initialized controller: ${controller.getControllerId()}`);
      } catch (error) {
        console.error(
          `Failed to initialize controller ${controller.getControllerId()}:`,
          error,
        );
      }
    }
  }

  /**
   * Cleanup all registered controllers
   */
  async cleanupAll(): Promise<void> {
    for (const controller of this.controllers) {
      try {
        await controller.cleanup();
        console.log(`Cleaned up controller: ${controller.getControllerId()}`);
      } catch (error) {
        console.error(
          `Failed to cleanup controller ${controller.getControllerId()}:`,
          error,
        );
      }
    }
  }

  /**
   * Get all registered controllers
   */
  getControllers(): readonly ICommandController[] {
    return this.controllers;
  }
}
