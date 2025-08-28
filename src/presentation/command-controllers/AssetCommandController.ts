import { Plugin } from "obsidian";
import { ICommandController } from "../../application/ports/ICommandController";
import { CreateAssetModal } from "../modals/CreateAssetModal";
import { EnhancedCreateAssetModal } from "../modals/EnhancedCreateAssetModal";

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
      name: "Exocortex: Create Asset",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "n" }],
      callback: () => {
        new CreateAssetModal(this.plugin.app).open();
      },
    });

    // Register enhanced asset creation command with dynamic properties
    this.plugin.addCommand({
      id: "create-asset-enhanced",
      name: "Exocortex: Create Asset (Enhanced)",
      callback: async () => {
        // Get active file to determine context
        const activeFile = this.plugin.app.workspace.getActiveFile();
        let className: string | null = null;
        
        if (activeFile) {
          const cache = this.plugin.app.metadataCache.getFileCache(activeFile);
          const instanceClass = cache?.frontmatter?.["exo__Instance_class"];
          
          // If viewing a class file, use it as default
          if (instanceClass === "exo__Class") {
            className = activeFile.basename;
          }
        }

        // Create and open the enhanced modal with a default class if needed
        const modal = new EnhancedCreateAssetModal(
          this.plugin.app,
          className || "exo__Asset"
        );
        
        modal.open();
      },
    });

    // Register class-specific asset creation commands for common classes
    const commonClasses = ["ems__Area", "ems__Task", "ems__Project", "ems__Goal"];
    
    for (const cls of commonClasses) {
      this.plugin.addCommand({
        id: `create-${cls.toLowerCase().replace("__", "-")}`,
        name: `Exocortex: Create ${cls.replace("__", " ")}`,
        callback: async () => {
          const modal = new EnhancedCreateAssetModal(
            this.plugin.app,
            cls
          );
          
          modal.open();
        },
      });
    }

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
