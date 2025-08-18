import { ButtonComponent, Modal, App, Setting, Notice } from 'obsidian';
import { RenderClassButtonsUseCase, ButtonRenderData } from '../../application/use-cases/RenderClassButtonsUseCase';
import { ExecuteButtonCommandUseCase } from '../../application/use-cases/ExecuteButtonCommandUseCase';
import { CommandParameter } from '../../domain/entities/ButtonCommand';
import { PlatformDetector } from '../../infrastructure/utils/PlatformDetector';

/**
 * Touch-optimized button renderer for iOS and mobile devices
 * Implements iOS Human Interface Guidelines with 44pt minimum touch targets
 */
export class TouchButtonRenderer {
    private hapticFeedback?: any;
    
    constructor(
        private app: App,
        private renderButtonsUseCase: RenderClassButtonsUseCase,
        private executeCommandUseCase: ExecuteButtonCommandUseCase
    ) {
        this.initializeHapticFeedback();
    }

    /**
     * Initialize haptic feedback for iOS devices
     */
    private initializeHapticFeedback(): void {
        if (PlatformDetector.isIOS() && 'vibrate' in navigator) {
            this.hapticFeedback = {
                light: () => navigator.vibrate?.(10),
                medium: () => navigator.vibrate?.(20),
                heavy: () => navigator.vibrate?.(30),
                selection: () => navigator.vibrate?.(5),
                impact: () => navigator.vibrate?.(15),
                notification: () => navigator.vibrate?.(25)
            };
        }
    }

    /**
     * Render touch-optimized buttons for mobile interface
     */
    async render(
        container: HTMLElement,
        className: string,
        assetId?: string,
        context?: any
    ): Promise<void> {
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

        // Create touch-optimized button container
        const buttonContainer = this.createButtonContainer(container, response.displayOptions.position);
        
        // Group buttons by priority for better mobile layout
        const groupedButtons = this.groupButtonsByPriority(response.buttons);
        
        // Render primary buttons first (more prominent)
        if (groupedButtons.primary.length > 0) {
            const primaryGroup = this.createButtonGroup(buttonContainer, 'primary');
            groupedButtons.primary.forEach(buttonData => {
                this.renderTouchButton(primaryGroup, buttonData, assetId, context, 'primary');
            });
        }

        // Render secondary buttons in a collapsible section if many
        if (groupedButtons.secondary.length > 0) {
            if (groupedButtons.secondary.length > 3 && PlatformDetector.isMobile()) {
                this.renderCollapsibleButtonGroup(buttonContainer, groupedButtons.secondary, assetId, context);
            } else {
                const secondaryGroup = this.createButtonGroup(buttonContainer, 'secondary');
                groupedButtons.secondary.forEach(buttonData => {
                    this.renderTouchButton(secondaryGroup, buttonData, assetId, context, 'secondary');
                });
            }
        }
    }

    /**
     * Create touch-optimized button container with iOS styling
     */
    private createButtonContainer(parent: HTMLElement, position: string): HTMLElement {
        const container = parent.createDiv({
            cls: `exocortex-touch-button-container exocortex-buttons-${position}`
        });

        container.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 16px;
            background: var(--background-secondary);
            border-radius: 12px;
            margin: 16px 0;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
            border: 1px solid var(--background-modifier-border);
        `;

        return container;
    }

    /**
     * Create button group for organizing related buttons
     */
    private createButtonGroup(parent: HTMLElement, type: 'primary' | 'secondary'): HTMLElement {
        const group = parent.createDiv({
            cls: `exocortex-button-group exocortex-button-group--${type}`
        });

        const isVertical = PlatformDetector.isMobile() || PlatformDetector.isTablet();
        
        group.style.cssText = `
            display: flex;
            flex-direction: ${isVertical ? 'column' : 'row'};
            gap: ${isVertical ? '8px' : '12px'};
            align-items: stretch;
        `;

        return group;
    }

    /**
     * Group buttons by priority for better mobile UX
     */
    private groupButtonsByPriority(buttons: ButtonRenderData[]): {
        primary: ButtonRenderData[];
        secondary: ButtonRenderData[];
    } {
        const primary: ButtonRenderData[] = [];
        const secondary: ButtonRenderData[] = [];

        buttons.forEach(button => {
            // Consider buttons with lower order values as primary
            if (button.order <= 5) {
                primary.push(button);
            } else {
                secondary.push(button);
            }
        });

        return { primary, secondary };
    }

    /**
     * Render collapsible button group for secondary actions
     */
    private renderCollapsibleButtonGroup(
        container: HTMLElement,
        buttons: ButtonRenderData[],
        assetId?: string,
        context?: any
    ): void {
        const expandableContainer = container.createDiv({
            cls: 'exocortex-expandable-buttons'
        });

        const toggleButton = this.createTouchButton(
            expandableContainer,
            'More Actions',
            false,
            () => {
                const isExpanded = toggleButton.hasClass('expanded');
                if (isExpanded) {
                    buttonsContainer.style.display = 'none';
                    toggleButton.removeClass('expanded');
                    toggleButton.setText('More Actions');
                    this.triggerHaptic('selection');
                } else {
                    buttonsContainer.style.display = 'flex';
                    toggleButton.addClass('expanded');
                    toggleButton.setText('Less Actions');
                    this.triggerHaptic('selection');
                }
            },
            'secondary'
        );

        const buttonsContainer = expandableContainer.createDiv({
            cls: 'exocortex-button-group exocortex-button-group--secondary'
        });
        
        buttonsContainer.style.cssText = `
            display: none;
            flex-direction: column;
            gap: 8px;
            margin-top: 8px;
            padding-top: 12px;
            border-top: 1px solid var(--background-modifier-border);
        `;

        buttons.forEach(buttonData => {
            this.renderTouchButton(buttonsContainer, buttonData, assetId, context, 'secondary');
        });
    }

    /**
     * Render individual touch-optimized button
     */
    private renderTouchButton(
        container: HTMLElement,
        buttonData: ButtonRenderData,
        assetId?: string,
        context?: any,
        variant: 'primary' | 'secondary' = 'primary'
    ): HTMLElement {
        const button = this.createTouchButton(
            container,
            buttonData.label,
            !buttonData.isEnabled,
            async () => {
                this.triggerHaptic('impact');
                await this.handleButtonClick(buttonData, assetId, context);
            },
            variant
        );

        if (buttonData.tooltip) {
            button.title = buttonData.tooltip;
        }

        button.setAttribute('data-button-id', buttonData.buttonId);
        button.setAttribute('data-order', buttonData.order.toString());

        return button;
    }

    /**
     * Create touch-optimized button with iOS styling
     */
    private createTouchButton(
        container: HTMLElement,
        text: string,
        disabled: boolean,
        onClick: () => void,
        variant: 'primary' | 'secondary' = 'primary'
    ): HTMLElement {
        const button = container.createEl('button', {
            text,
            cls: `exocortex-touch-button exocortex-touch-button--${variant}`
        });

        // iOS-compliant touch target size (44x44pt minimum)
        button.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 44px;
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            position: relative;
            overflow: hidden;
            
            ${variant === 'primary' ? `
                background: var(--interactive-accent);
                color: var(--text-on-accent);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            ` : `
                background: var(--background-primary);
                color: var(--text-normal);
                border: 1px solid var(--background-modifier-border);
            `}
        `;

        if (disabled) {
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
            button.disabled = true;
        } else {
            this.addTouchInteractions(button, variant);
        }

        button.addEventListener('click', (e) => {
            e.preventDefault();
            if (!disabled) {
                onClick();
            }
        });

        return button;
    }

    /**
     * Add touch interactions with visual feedback
     */
    private addTouchInteractions(button: HTMLElement, variant: 'primary' | 'secondary'): void {
        let pressAnimation: Animation | null = null;

        const handleTouchStart = () => {
            this.triggerHaptic('selection');
            
            // Create ripple effect
            this.createRippleEffect(button);
            
            // Scale down animation
            pressAnimation = button.animate([
                { transform: 'scale(1)' },
                { transform: 'scale(0.97)' }
            ], {
                duration: 100,
                easing: 'ease-out',
                fill: 'forwards'
            });
        };

        const handleTouchEnd = () => {
            // Scale back up
            button.animate([
                { transform: 'scale(0.97)' },
                { transform: 'scale(1)' }
            ], {
                duration: 150,
                easing: 'ease-out',
                fill: 'forwards'
            });
        };

        // Touch events for mobile
        button.addEventListener('touchstart', handleTouchStart, { passive: true });
        button.addEventListener('touchend', handleTouchEnd, { passive: true });
        button.addEventListener('touchcancel', handleTouchEnd, { passive: true });

        // Mouse events for desktop fallback
        button.addEventListener('mousedown', handleTouchStart);
        button.addEventListener('mouseup', handleTouchEnd);
        button.addEventListener('mouseleave', handleTouchEnd);

        // Hover effects for non-touch devices
        if (!PlatformDetector.hasTouch()) {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-1px)';
                button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = variant === 'primary' 
                    ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
                    : 'none';
            });
        }
    }

    /**
     * Create Material Design ripple effect
     */
    private createRippleEffect(button: HTMLElement): void {
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple 0.4s linear;
            pointer-events: none;
        `;

        const size = Math.max(button.offsetWidth, button.offsetHeight);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (button.offsetWidth / 2 - size / 2) + 'px';
        ripple.style.top = (button.offsetHeight / 2 - size / 2) + 'px';

        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);

        button.appendChild(ripple);
        setTimeout(() => {
            ripple.remove();
            style.remove();
        }, 400);
    }

    /**
     * Trigger haptic feedback if available
     */
    private triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'selection' | 'impact' | 'notification'): void {
        if (this.hapticFeedback && this.hapticFeedback[type]) {
            this.hapticFeedback[type]();
        }
    }

    /**
     * Handle button click with mobile-optimized interaction
     */
    private async handleButtonClick(
        buttonData: ButtonRenderData,
        assetId?: string,
        context?: any
    ): Promise<void> {
        const result = await this.executeCommandUseCase.execute({
            buttonId: buttonData.buttonId,
            assetId,
            context
        });

        if (result.isFailure) {
            console.error(`Button execution failed: ${result.error}`);
            this.showMobileNotification(`Error: ${result.error}`, 'error');
            this.triggerHaptic('notification');
            return;
        }

        const response = result.getValue();

        if (response.requiresInput && response.inputSchema) {
            const modal = new TouchCommandInputModal(
                this.app,
                response.inputSchema,
                async (inputValues) => {
                    const execResult = await this.executeCommandUseCase.execute({
                        buttonId: buttonData.buttonId,
                        assetId,
                        inputParameters: inputValues,
                        context
                    });

                    if (execResult.isFailure) {
                        this.showMobileNotification(`Error: ${execResult.error}`, 'error');
                        this.triggerHaptic('notification');
                    } else {
                        const execResponse = execResult.getValue();
                        if (execResponse.success) {
                            this.showMobileNotification(
                                execResponse.message || 'Command executed successfully',
                                'success'
                            );
                            this.triggerHaptic('selection');
                        }
                    }
                }
            );
            modal.open();
        } else if (response.success) {
            this.showMobileNotification(
                response.message || 'Command executed successfully',
                'success'
            );
            this.triggerHaptic('selection');
        }
    }

    /**
     * Show mobile-optimized notification
     */
    private showMobileNotification(message: string, type: 'success' | 'error' | 'info'): void {
        new Notice(message, type === 'error' ? 5000 : 3000);
    }
}

/**
 * Touch-optimized modal for command input parameters
 */
class TouchCommandInputModal extends Modal {
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
        this.modalEl.addClass('exocortex-touch-modal');
    }

    onOpen(): void {
        const { contentEl } = this;
        
        // Add mobile-optimized styles
        contentEl.style.cssText = `
            padding: 20px;
            max-height: 90vh;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        `;

        // Header
        const headerEl = contentEl.createDiv({ cls: 'touch-modal-header' });
        headerEl.style.cssText = `
            position: sticky;
            top: 0;
            background: var(--background-primary);
            padding-bottom: 16px;
            margin-bottom: 16px;
            border-bottom: 1px solid var(--background-modifier-border);
            z-index: 1;
        `;
        
        headerEl.createEl('h2', { 
            text: this.schema.title,
            cls: 'touch-modal-title'
        });
        
        if (this.schema.description) {
            headerEl.createEl('p', { 
                text: this.schema.description,
                cls: 'touch-modal-description'
            });
        }

        // Form container
        const formEl = contentEl.createDiv({ cls: 'touch-command-form' });
        formEl.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 16px;
        `;

        // Add inputs for each parameter
        this.schema.parameters.forEach(param => {
            this.createTouchParameterInput(formEl, param);
        });

        // Sticky footer with buttons
        const footerEl = contentEl.createDiv({ cls: 'touch-modal-footer' });
        footerEl.style.cssText = `
            position: sticky;
            bottom: 0;
            background: var(--background-primary);
            padding-top: 16px;
            margin-top: 24px;
            border-top: 1px solid var(--background-modifier-border);
            display: flex;
            gap: 12px;
            flex-direction: ${PlatformDetector.isMobile() ? 'column-reverse' : 'row'};
        `;
        
        const touchButtonRenderer = new TouchButtonRenderer(this.app, null as any, null as any);
        
        // Execute button (primary)
        (touchButtonRenderer as any).createTouchButton(
            footerEl,
            'Execute',
            false,
            () => {
                const errors = this.validateInputs();
                if (errors.length > 0) {
                    this.showErrors(errors);
                    return;
                }
                
                this.onSubmit(this.inputValues);
                this.close();
            },
            'primary'
        );

        // Cancel button (secondary)
        (touchButtonRenderer as any).createTouchButton(
            footerEl,
            'Cancel',
            false,
            () => this.close(),
            'secondary'
        );
    }

    private createTouchParameterInput(container: HTMLElement, param: CommandParameter): void {
        const inputContainer = container.createDiv({ cls: 'touch-input-container' });
        
        // Label
        const label = inputContainer.createEl('label', {
            text: param.label || param.name,
            cls: 'touch-input-label'
        });
        
        if (param.required) {
            label.createSpan({ text: ' *', cls: 'required-indicator' });
        }

        if (param.description) {
            inputContainer.createEl('p', {
                text: param.description,
                cls: 'touch-input-description'
            });
        }

        // Input field
        this.createInputField(inputContainer, param);
    }

    private createInputField(container: HTMLElement, param: CommandParameter): void {
        const inputWrapper = container.createDiv({ cls: 'touch-input-wrapper' });
        
        switch (param.type) {
            case 'string':
            case 'asset':
                const textInput = inputWrapper.createEl('input', {
                    type: 'text',
                    cls: 'touch-input'
                });
                textInput.placeholder = param.label || param.name;
                if (param.defaultValue) {
                    textInput.value = param.defaultValue;
                    this.inputValues[param.name] = param.defaultValue;
                }
                textInput.addEventListener('input', (e) => {
                    let value = (e.target as HTMLInputElement).value;
                    if (param.type === 'asset' && value && !value.startsWith('[[')) {
                        value = `[[${value}]]`;
                    }
                    this.inputValues[param.name] = value;
                });
                break;

            case 'number':
                const numberInput = inputWrapper.createEl('input', {
                    type: 'number',
                    cls: 'touch-input'
                });
                if (param.defaultValue !== undefined) {
                    numberInput.value = String(param.defaultValue);
                    this.inputValues[param.name] = param.defaultValue;
                }
                numberInput.addEventListener('input', (e) => {
                    this.inputValues[param.name] = Number((e.target as HTMLInputElement).value);
                });
                break;

            case 'boolean':
                const toggleWrapper = inputWrapper.createDiv({ cls: 'touch-toggle-wrapper' });
                const toggle = toggleWrapper.createEl('input', {
                    type: 'checkbox',
                    cls: 'touch-toggle'
                });
                const toggleLabel = toggleWrapper.createEl('label', {
                    cls: 'touch-toggle-label'
                });
                toggleLabel.appendChild(toggle);
                
                if (param.defaultValue !== undefined) {
                    toggle.checked = param.defaultValue;
                    this.inputValues[param.name] = param.defaultValue;
                }
                toggle.addEventListener('change', (e) => {
                    this.inputValues[param.name] = (e.target as HTMLInputElement).checked;
                });
                break;

            case 'date':
                const dateInput = inputWrapper.createEl('input', {
                    type: 'date',
                    cls: 'touch-input'
                });
                if (param.defaultValue) {
                    dateInput.value = param.defaultValue;
                    this.inputValues[param.name] = param.defaultValue;
                }
                dateInput.addEventListener('change', (e) => {
                    this.inputValues[param.name] = (e.target as HTMLInputElement).value;
                });
                break;

            case 'array':
                const arrayInput = inputWrapper.createEl('textarea', {
                    cls: 'touch-textarea'
                });
                arrayInput.placeholder = 'One item per line';
                arrayInput.rows = 3;
                
                if (param.defaultValue) {
                    const defaultText = Array.isArray(param.defaultValue)
                        ? param.defaultValue.join('\n')
                        : param.defaultValue;
                    arrayInput.value = defaultText;
                    this.inputValues[param.name] = param.defaultValue;
                }
                arrayInput.addEventListener('input', (e) => {
                    const value = (e.target as HTMLTextAreaElement).value;
                    this.inputValues[param.name] = value.split('\n').filter(v => v.trim());
                });
                break;

            default:
                const defaultInput = inputWrapper.createEl('input', {
                    type: 'text',
                    cls: 'touch-input'
                });
                defaultInput.addEventListener('input', (e) => {
                    this.inputValues[param.name] = (e.target as HTMLInputElement).value;
                });
        }

        // Add common touch input styles
        const inputs = inputWrapper.querySelectorAll('.touch-input, .touch-textarea');
        inputs.forEach(input => {
            (input as HTMLElement).style.cssText = `
                width: 100%;
                min-height: 44px;
                padding: 12px 16px;
                font-size: 16px;
                border: 2px solid var(--background-modifier-border);
                border-radius: 8px;
                background: var(--background-modifier-form-field);
                color: var(--text-normal);
                outline: none;
                transition: border-color 0.2s ease;
            `;
            
            input.addEventListener('focus', () => {
                (input as HTMLElement).style.borderColor = 'var(--interactive-accent)';
            });
            
            input.addEventListener('blur', () => {
                (input as HTMLElement).style.borderColor = 'var(--background-modifier-border)';
            });
        });
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
        }

        return errors;
    }

    private showErrors(errors: string[]): void {
        const errorMessage = 'Please fix the following errors:\n' + errors.join('\n');
        new Notice(errorMessage, 5000);
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}