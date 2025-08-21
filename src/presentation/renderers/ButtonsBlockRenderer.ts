import { App, TFile, ButtonComponent, Notice } from 'obsidian';
import { ButtonsBlockConfig } from "../../domain/entities/LayoutBlockStubs";
import { CommandType } from '../../domain/entities/ButtonCommand';
import { DIContainer } from '../../infrastructure/container/DIContainer';
import { CreateChildTaskUseCase } from '../../application/use-cases/CreateChildTaskUseCase';

export class ButtonsBlockRenderer {
    constructor(private app: App) {}

    async render(
        container: HTMLElement,
        config: any,
        file: TFile,
        frontmatter: any
    ): Promise<void> {
        const buttonsConfig = config as ButtonsBlockConfig;
        
        if (!buttonsConfig.buttons || buttonsConfig.buttons.length === 0) {
            return;
        }

        const buttonContainer = container.createDiv({
            cls: `exocortex-buttons-block exocortex-buttons-${buttonsConfig.position || 'top'}`
        });

        for (const buttonConfig of buttonsConfig.buttons) {
            this.renderButton(buttonContainer, buttonConfig, file, frontmatter);
        }
    }

    private renderButton(
        container: HTMLElement,
        buttonConfig: any,
        file: TFile,
        frontmatter: any
    ): void {
        const button = new ButtonComponent(container)
            .setButtonText(buttonConfig.label)
            .onClick(async () => {
                await this.handleButtonClick(buttonConfig, file, frontmatter);
            });

        if (buttonConfig.tooltip) {
            button.setTooltip(buttonConfig.tooltip);
        }

        button.buttonEl.addClass('exocortex-layout-button');
        
        if (buttonConfig.style && buttonConfig.style !== 'default') {
            button.buttonEl.addClass(`exocortex-button-${buttonConfig.style}`);
        }
    }

    private async handleButtonClick(
        buttonConfig: any,
        file: TFile,
        frontmatter: any
    ): Promise<void> {
        const commandType = buttonConfig.commandType as CommandType;
        
        if (commandType === CommandType.CREATE_CHILD_TASK) {
            await this.handleCreateChildTask(file, frontmatter);
        } else {
            new Notice(`Command ${buttonConfig.commandType} not yet implemented`);
        }
    }

    private async handleCreateChildTask(file: TFile, frontmatter: any): Promise<void> {
        try {
            const container = DIContainer.getInstance();
            const createChildTaskUseCase = container.resolve<CreateChildTaskUseCase>('CreateChildTaskUseCase');
            
            if (!createChildTaskUseCase) {
                new Notice('Create Child Task functionality not available');
                return;
            }

            const assetId = frontmatter['exo__Asset_uid'] || file.basename;
            
            const result = await createChildTaskUseCase.execute({
                projectAssetId: assetId
            });

            if (result.success) {
                new Notice(result.message);
                
                // Open the new task file if created
                if (result.taskFilePath) {
                    const taskFile = this.app.vault.getAbstractFileByPath(result.taskFilePath);
                    if (taskFile instanceof TFile) {
                        await this.app.workspace.getLeaf(true).openFile(taskFile);
                    }
                }
            } else {
                new Notice(`Failed to create task: ${result.message}`);
            }
        } catch (error) {
            console.error('Error creating child task:', error);
            new Notice(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}