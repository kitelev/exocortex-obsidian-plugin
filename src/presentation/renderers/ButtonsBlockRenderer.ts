import { App, TFile, ButtonComponent, Notice } from "obsidian";
import { ButtonsBlockConfig } from "../../domain/entities/LayoutBlockStubs";
import { CommandType } from "../../domain/entities/ButtonCommand";

export class ButtonsBlockRenderer {
  constructor(private app: App) {}

  async render(
    container: HTMLElement,
    config: any,
    file: TFile,
    frontmatter: any,
  ): Promise<void> {
    const buttonsConfig = config as ButtonsBlockConfig;

    if (!buttonsConfig.buttons || buttonsConfig.buttons.length === 0) {
      return;
    }

    const buttonContainer = container.createDiv({
      cls: `exocortex-buttons-block exocortex-buttons-${buttonsConfig.position || "top"}`,
    });

    for (const buttonConfig of buttonsConfig.buttons) {
      this.renderButton(buttonContainer, buttonConfig, file, frontmatter);
    }
  }

  private renderButton(
    container: HTMLElement,
    buttonConfig: any,
    file: TFile,
    frontmatter: any,
  ): void {
    const button = new ButtonComponent(container)
      .setButtonText(buttonConfig.label)
      .onClick(async () => {
        await this.handleButtonClick(buttonConfig, file, frontmatter);
      });

    if (buttonConfig.tooltip) {
      button.setTooltip(buttonConfig.tooltip);
    }

    button.buttonEl.addClass("exocortex-layout-button");

    if (buttonConfig.style && buttonConfig.style !== "default") {
      button.buttonEl.addClass(`exocortex-button-${buttonConfig.style}`);
    }
  }

  private async handleButtonClick(
    buttonConfig: any,
    file: TFile,
    frontmatter: any,
  ): Promise<void> {
    const commandType = buttonConfig.commandType;

    if (
      commandType === "CREATE_CHILD_TASK" ||
      commandType === CommandType.CREATE_CHILD_TASK
    ) {
      await this.handleCreateChildTask(file, frontmatter);
    } else if (
      commandType === "CREATE_CHILD_AREA" ||
      commandType === CommandType.CREATE_CHILD_AREA
    ) {
      await this.handleCreateChildArea(file, frontmatter);
    } else if (commandType === "CREATE_ASSET") {
      await this.handleCreateAsset(buttonConfig, file, frontmatter);
    } else {
      new Notice(`Command ${buttonConfig.commandType} not yet implemented`);
    }
  }

  private async handleCreateChildTask(
    file: TFile,
    frontmatter: any,
  ): Promise<void> {
    new Notice("Create Child Task functionality has been removed");
  }

  private async handleCreateChildArea(
    file: TFile,
    frontmatter: any,
  ): Promise<void> {
    new Notice("Create Child Area functionality has been removed");
  }

  private async handleCreateAsset(
    buttonConfig: any,
    file: TFile,
    frontmatter: any,
  ): Promise<void> {
    try {
      const className = buttonConfig.commandArgs?.className;
      if (!className) {
        new Notice("No class specified for asset creation");
        return;
      }

      // Import the EnhancedCreateAssetModal
      const { EnhancedCreateAssetModal } = await import(
        "../modals/EnhancedCreateAssetModal"
      );

      // Create and open the modal
      const modal = new EnhancedCreateAssetModal(this.app, className);

      // TODO: Add parent context support when modal is updated

      modal.open();
    } catch (error) {
      console.error("Failed to create asset:", error);
      new Notice(`Failed to create asset: ${error}`);
    }
  }
}
