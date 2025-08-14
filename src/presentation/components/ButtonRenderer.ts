import { ButtonComponent, Modal, App, Setting, Notice } from 'obsidian';
import { RenderClassButtonsUseCase, ButtonRenderData } from '../../application/use-cases/RenderClassButtonsUseCase';
import { ExecuteButtonCommandUseCase } from '../../application/use-cases/ExecuteButtonCommandUseCase';
import { CommandParameter } from '../../domain/entities/ButtonCommand';

/**
 * Presentation layer component for rendering buttons in asset views
 * Following Clean Architecture - this is a framework-specific adapter
 */
export class ButtonRenderer {
    constructor(
        private app: App,
        private renderButtonsUseCase: RenderClassButtonsUseCase,
        private executeCommandUseCase: ExecuteButtonCommandUseCase
    ) {}

    /**
     * Render buttons for a class view
     */
    async render(
        container: HTMLElement,
        className: string,
        assetId?: string,
        context?: any
    ): Promise<void> {
        // Get buttons from use case
        const result = await this.renderButtonsUseCase.execute({
            className,
            assetId,
            context
        });

        if (result.isFailure) {
            console.error(`Failed to render buttons: ${result.error}`);
            return;
        }

        const response = result.getValue();
        
        if (!response.displayOptions.showButtons || response.buttons.length === 0) {
            return;
        }

        // Create button container
        const buttonContainer = container.createDiv({
            cls: `exocortex-button-container exocortex-buttons-${response.displayOptions.position}`
        });

        // Render each button
        for (const buttonData of response.buttons) {
            this.renderButton(buttonContainer, buttonData, assetId, context);
        }
    }

    /**
     * Render individual button
     */
    private renderButton(
        container: HTMLElement,
        buttonData: ButtonRenderData,
        assetId?: string,
        context?: any
    ): void {
        const button = new ButtonComponent(container)
            .setButtonText(buttonData.label)
            .onClick(async () => {
                await this.handleButtonClick(buttonData, assetId, context);
            });

        if (buttonData.tooltip) {
            button.setTooltip(buttonData.tooltip);
        }

        if (!buttonData.isEnabled) {
            button.setDisabled(true);
        }

        // Add custom CSS class for styling
        button.buttonEl.addClass('exocortex-ui-button');
        button.buttonEl.setAttribute('data-button-id', buttonData.buttonId);
        button.buttonEl.setAttribute('data-order', buttonData.order.toString());
    }

    /**
     * Handle button click
     */
    private async handleButtonClick(
        buttonData: ButtonRenderData,
        assetId?: string,
        context?: any
    ): Promise<void> {
        // First execution attempt without parameters
        const result = await this.executeCommandUseCase.execute({
            buttonId: buttonData.buttonId,
            assetId,
            context
        });

        if (result.isFailure) {
            console.error(`Button execution failed: ${result.error}`);
            // Show error notification
            this.showNotification(`Error: ${result.error}`, 'error');
            return;
        }

        const response = result.getValue();

        // Check if input is required
        if (response.requiresInput && response.inputSchema) {
            // Open input modal
            const modal = new CommandInputModal(
                this.app,
                response.inputSchema,
                async (inputValues) => {
                    // Execute with parameters
                    const execResult = await this.executeCommandUseCase.execute({
                        buttonId: buttonData.buttonId,
                        assetId,
                        inputParameters: inputValues,
                        context
                    });

                    if (execResult.isFailure) {
                        this.showNotification(`Error: ${execResult.error}`, 'error');
                    } else {
                        const execResponse = execResult.getValue();
                        if (execResponse.success) {
                            this.showNotification(
                                execResponse.message || 'Command executed successfully',
                                'success'
                            );
                        }
                    }
                }
            );
            modal.open();
        } else if (response.success) {
            // Command executed successfully
            this.showNotification(
                response.message || 'Command executed successfully',
                'success'
            );
        }
    }

    /**
     * Show notification to user
     */
    private showNotification(message: string, type: 'success' | 'error' | 'info'): void {
        // In Obsidian, we use Notice for notifications
        new Notice(message, type === 'error' ? 5000 : 3000);
    }
}

/**
 * Modal for collecting command input parameters
 */
class CommandInputModal extends Modal {
    private inputValues: Record<string, any> = {};

    constructor(
        app: App,
        private schema: {
            title: string;
            description?: string;
            parameters: CommandParameter[];
        },
        private onSubmit: (values: Record<string, any>) => void
    ) {
        super(app);
    }

    onOpen(): void {
        const { contentEl } = this;
        
        // Add title
        contentEl.createEl('h2', { text: this.schema.title });
        
        // Add description if present
        if (this.schema.description) {
            contentEl.createEl('p', { 
                text: this.schema.description,
                cls: 'exocortex-modal-description'
            });
        }

        // Create form
        const formEl = contentEl.createDiv({ cls: 'exocortex-command-form' });

        // Add input for each parameter
        for (const param of this.schema.parameters) {
            this.createParameterInput(formEl, param);
        }

        // Add buttons
        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
        
        new Setting(buttonContainer)
            .addButton(btn => btn
                .setButtonText('Cancel')
                .onClick(() => this.close()))
            .addButton(btn => btn
                .setButtonText('Execute')
                .setCta()
                .onClick(() => {
                    // Validate required fields
                    const errors = this.validateInputs();
                    if (errors.length > 0) {
                        this.showErrors(errors);
                        return;
                    }
                    
                    this.onSubmit(this.inputValues);
                    this.close();
                }));
    }

    private createParameterInput(container: HTMLElement, param: CommandParameter): void {
        const setting = new Setting(container)
            .setName(param.label || param.name)
            .setDesc(param.description || '');

        // Mark required fields
        if (param.required) {
            setting.nameEl.createSpan({ text: ' *', cls: 'required-indicator' });
        }

        // Create appropriate input based on type
        switch (param.type) {
            case 'string':
                setting.addText(text => {
                    text.setPlaceholder(param.label || param.name);
                    if (param.defaultValue) {
                        text.setValue(param.defaultValue);
                        this.inputValues[param.name] = param.defaultValue;
                    }
                    text.onChange(value => {
                        this.inputValues[param.name] = value;
                    });
                });
                break;

            case 'number':
                setting.addText(text => {
                    text.inputEl.type = 'number';
                    if (param.defaultValue !== undefined) {
                        text.setValue(String(param.defaultValue));
                        this.inputValues[param.name] = param.defaultValue;
                    }
                    text.onChange(value => {
                        this.inputValues[param.name] = Number(value);
                    });
                });
                break;

            case 'boolean':
                setting.addToggle(toggle => {
                    if (param.defaultValue !== undefined) {
                        toggle.setValue(param.defaultValue);
                        this.inputValues[param.name] = param.defaultValue;
                    }
                    toggle.onChange(value => {
                        this.inputValues[param.name] = value;
                    });
                });
                break;

            case 'date':
                setting.addText(text => {
                    text.inputEl.type = 'date';
                    if (param.defaultValue) {
                        text.setValue(param.defaultValue);
                        this.inputValues[param.name] = param.defaultValue;
                    }
                    text.onChange(value => {
                        this.inputValues[param.name] = value;
                    });
                });
                break;

            case 'asset':
                setting.addText(text => {
                    text.setPlaceholder('[[Asset Name]]');
                    if (param.defaultValue) {
                        text.setValue(param.defaultValue);
                        this.inputValues[param.name] = param.defaultValue;
                    }
                    text.onChange(value => {
                        // Ensure it's in wiki link format
                        if (value && !value.startsWith('[[')) {
                            value = `[[${value}]]`;
                        }
                        this.inputValues[param.name] = value;
                    });
                });
                break;

            case 'array':
                setting.addTextArea(textarea => {
                    textarea.setPlaceholder('One item per line');
                    if (param.defaultValue) {
                        const defaultText = Array.isArray(param.defaultValue)
                            ? param.defaultValue.join('\n')
                            : param.defaultValue;
                        textarea.setValue(defaultText);
                        this.inputValues[param.name] = param.defaultValue;
                    }
                    textarea.onChange(value => {
                        this.inputValues[param.name] = value.split('\n').filter(v => v.trim());
                    });
                });
                break;

            default:
                // Default to text input
                setting.addText(text => {
                    text.onChange(value => {
                        this.inputValues[param.name] = value;
                    });
                });
        }
    }

    private validateInputs(): string[] {
        const errors: string[] = [];
        
        for (const param of this.schema.parameters) {
            if (param.required) {
                const value = this.inputValues[param.name];
                if (value === undefined || value === null || value === '') {
                    errors.push(`${param.label || param.name} is required`);
                }
            }

            // Custom validation if provided
            if (param.validation && this.inputValues[param.name]) {
                try {
                    const regex = new RegExp(param.validation);
                    if (!regex.test(String(this.inputValues[param.name]))) {
                        errors.push(`${param.label || param.name} format is invalid`);
                    }
                } catch (e) {
                    // Invalid regex, skip validation
                }
            }
        }

        return errors;
    }

    private showErrors(errors: string[]): void {
        // Show errors in a notice
        const errorMessage = 'Please fix the following errors:\n' + errors.join('\n');
        new Notice(errorMessage, 5000);
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}