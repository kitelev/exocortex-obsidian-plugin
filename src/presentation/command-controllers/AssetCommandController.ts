import { Plugin } from "obsidian";
import { ICommandController } from "../../application/ports/ICommandController";
import { CreateAssetModal } from "../modals/CreateAssetModal";

/**
 * Asset Command Controller following Controller Pattern (GRASP)
 * Single Responsibility: Handle asset-related commands only
 */
export class AssetCommandController implements ICommandController {
  constructor(private readonly plugin: Plugin) {}

  async registerCommands(): Promise<void> {
    // Register command: Create new asset
    this.plugin.addCommand({
      id: "create-exo-asset",
      name: "Create new ExoAsset",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "n" }],
      callback: () => {
        new CreateAssetModal(this.plugin.app).open();
      },
    });

    // Add ribbon icon for quick access
    this.plugin.addRibbonIcon("plus-circle", "Create ExoAsset", () => {
      new CreateAssetModal(this.plugin.app).open();
    });
  }

  async cleanup(): Promise<void> {
    // No specific cleanup needed for asset commands
  }

  getControllerId(): string {
    return "AssetCommandController";
  }
}