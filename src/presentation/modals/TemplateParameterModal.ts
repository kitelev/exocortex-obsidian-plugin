import { Modal, App, Setting } from 'obsidian';
import { QueryTemplate, TemplateParameter } from '../../domain/visual/QueryTemplate';

export interface TemplateParameterModalOptions {
    onSubmit: (template: QueryTemplate, parameterValues: Map<string, string>) => void;
    onCancel?: () => void;
}

export class TemplateParameterModal extends Modal {
    private template: QueryTemplate;
    private parameterInputs: Map<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> = new Map();
    private validationErrors: Map<string, string> = new Map();

    constructor(
        app: App,
        template: QueryTemplate,
        private options: TemplateParameterModalOptions
    ) {
        super(app);
        this.template = template;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();

        this.createHeader();
        this.createParameterForm();
        this.createButtons();
        this.setupKeyboardHandlers();
        
        // Focus first input
        const firstInput = Array.from(this.parameterInputs.values())[0];
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    onClose(): void {
        this.parameterInputs.clear();
        this.validationErrors.clear();
    }

    private createHeader(): void {
        const header = this.contentEl.createDiv('template-parameter-header');
        header.style.cssText = `
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--background-modifier-border);
        `;

        const title = header.createEl('h2');
        title.textContent = 'Configure Template Parameters';
        title.style.cssText = `
            margin: 0 0 8px 0;
            color: var(--text-normal);
            font-size: 20px;
            font-weight: 600;
        `;

        const templateName = header.createDiv('template-name');
        templateName.textContent = this.template.getMetadata().name;
        templateName.style.cssText = `
            color: var(--text-accent);
            font-weight: 500;
            margin-bottom: 8px;
        `;

        const description = header.createDiv('template-description');
        description.textContent = this.template.getMetadata().description;
        description.style.cssText = `
            color: var(--text-muted);
            line-height: 1.5;
            margin-bottom: 16px;
        `;

        if (this.template.getMetadata().exampleUsage) {
            const example = header.createDiv('template-example');
            example.innerHTML = `
                <strong style="color: var(--text-normal);">Example:</strong>
                <em style="color: var(--text-muted);">${this.template.getMetadata().exampleUsage}</em>
            `;
        }
    }

    private createParameterForm(): void {
        const parameters = this.template.getParameters();
        
        if (parameters.length === 0) {
            const noParams = this.contentEl.createDiv('no-parameters');
            noParams.textContent = 'This template has no parameters to configure.';
            noParams.style.cssText = `
                text-align: center;
                color: var(--text-muted);
                font-style: italic;
                padding: 20px;
            `;
            return;
        }

        const form = this.contentEl.createDiv('parameter-form');
        form.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-bottom: 24px;
            max-height: 400px;
            overflow-y: auto;
            padding-right: 8px;
        `;

        parameters.forEach(parameter => {
            this.createParameterInput(form, parameter);
        });
    }

    private createParameterInput(container: HTMLElement, parameter: TemplateParameter): void {
        const paramContainer = container.createDiv('parameter-container');
        paramContainer.style.cssText = `
            padding: 16px;
            border: 1px solid var(--background-modifier-border);
            border-radius: var(--radius-s);
            background: var(--background-secondary);
        `;

        // Parameter header
        const header = paramContainer.createDiv('parameter-header');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
        `;

        const nameContainer = header.createDiv();
        const name = nameContainer.createEl('label');
        name.textContent = parameter.name;
        name.style.cssText = `
            color: var(--text-normal);
            font-weight: 500;
            font-size: 14px;
            display: block;
        `;

        if (parameter.required) {
            const required = nameContainer.createSpan();
            required.textContent = ' *';
            required.style.cssText = 'color: var(--text-error);';
        }

        const badges = header.createDiv();
        badges.style.cssText = 'display: flex; gap: 4px; align-items: center;';

        const typeBadge = badges.createSpan();
        typeBadge.textContent = parameter.type;
        typeBadge.style.cssText = `
            font-size: 10px;
            padding: 2px 6px;
            background: var(--background-primary);
            color: var(--text-muted);
            border-radius: 4px;
            border: 1px solid var(--background-modifier-border);
        `;

        // Description
        if (parameter.description) {
            const description = paramContainer.createDiv();
            description.textContent = parameter.description;
            description.style.cssText = `
                color: var(--text-muted);
                font-size: 12px;
                line-height: 1.4;
                margin-bottom: 8px;
            `;
        }

        // Input field
        const input = this.createInputElement(parameter);
        input.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--background-modifier-border);
            border-radius: var(--radius-s);
            background: var(--background-primary);
            color: var(--text-normal);
            font-size: 14px;
            font-family: ${parameter.type === 'literal' ? 'var(--font-monospace)' : 'inherit'};
        `;

        // Set default value
        if (parameter.defaultValue) {
            input.value = parameter.defaultValue;
        }

        // Validation
        const errorContainer = paramContainer.createDiv('parameter-error');
        errorContainer.style.cssText = `
            color: var(--text-error);
            font-size: 12px;
            margin-top: 4px;
            min-height: 16px;
        `;

        // Event handlers
        input.addEventListener('input', () => this.validateParameter(parameter, input, errorContainer));
        input.addEventListener('blur', () => this.validateParameter(parameter, input, errorContainer));

        paramContainer.appendChild(input);
        this.parameterInputs.set(parameter.id, input);

        // Constraints help text
        if (parameter.constraints) {
            this.createConstraintsHelp(paramContainer, parameter.constraints);
        }
    }

    private createInputElement(parameter: TemplateParameter): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
        if (parameter.constraints?.allowedValues) {
            const select = document.createElement('select');
            
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = 'Select...';
            select.appendChild(emptyOption);

            parameter.constraints.allowedValues.forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            });

            return select;
        }

        if (parameter.type === 'literal' && (!parameter.constraints?.maxLength || parameter.constraints.maxLength > 100)) {
            const textarea = document.createElement('textarea');
            textarea.rows = 3;
            return textarea;
        }

        const input = document.createElement('input');
        input.type = 'text';

        if (parameter.type === 'entity' || parameter.type === 'property') {
            input.placeholder = parameter.type === 'entity' ? 'e.g., Person, ex:John, <http://example.org/Person>' : 'e.g., name, ex:hasAge, ?property';
        }

        return input;
    }

    private createConstraintsHelp(container: HTMLElement, constraints: TemplateParameter['constraints']): void {
        const hints: string[] = [];

        if (constraints?.pattern) {
            hints.push(`Pattern: ${constraints.pattern}`);
        }

        if (constraints?.minLength) {
            hints.push(`Min length: ${constraints.minLength}`);
        }

        if (constraints?.maxLength) {
            hints.push(`Max length: ${constraints.maxLength}`);
        }

        if (hints.length > 0) {
            const help = container.createDiv('parameter-help');
            help.textContent = hints.join(' • ');
            help.style.cssText = `
                color: var(--text-muted);
                font-size: 11px;
                margin-top: 4px;
                font-style: italic;
            `;
        }
    }

    private validateParameter(
        parameter: TemplateParameter, 
        input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, 
        errorContainer: HTMLElement
    ): boolean {
        const value = input.value.trim();
        errorContainer.textContent = '';
        this.validationErrors.delete(parameter.id);

        // Required check
        if (parameter.required && !value) {
            const error = `${parameter.name} is required`;
            errorContainer.textContent = error;
            this.validationErrors.set(parameter.id, error);
            input.style.borderColor = 'var(--text-error)';
            return false;
        }

        // Skip other validations if empty and not required
        if (!value && !parameter.required) {
            input.style.borderColor = 'var(--background-modifier-border)';
            return true;
        }

        // Constraints validation
        if (parameter.constraints) {
            const constraints = parameter.constraints;

            if (constraints.pattern && !new RegExp(constraints.pattern).test(value)) {
                const error = 'Value does not match required pattern';
                errorContainer.textContent = error;
                this.validationErrors.set(parameter.id, error);
                input.style.borderColor = 'var(--text-error)';
                return false;
            }

            if (constraints.minLength && value.length < constraints.minLength) {
                const error = `Minimum length is ${constraints.minLength}`;
                errorContainer.textContent = error;
                this.validationErrors.set(parameter.id, error);
                input.style.borderColor = 'var(--text-error)';
                return false;
            }

            if (constraints.maxLength && value.length > constraints.maxLength) {
                const error = `Maximum length is ${constraints.maxLength}`;
                errorContainer.textContent = error;
                this.validationErrors.set(parameter.id, error);
                input.style.borderColor = 'var(--text-error)';
                return false;
            }

            if (constraints.allowedValues && !constraints.allowedValues.includes(value)) {
                const error = 'Value must be one of the allowed options';
                errorContainer.textContent = error;
                this.validationErrors.set(parameter.id, error);
                input.style.borderColor = 'var(--text-error)';
                return false;
            }
        }

        input.style.borderColor = 'var(--background-modifier-border)';
        return true;
    }

    private validateAllParameters(): boolean {
        let allValid = true;

        for (const [parameterId, input] of this.parameterInputs) {
            const parameter = this.template.getParameter(parameterId);
            if (!parameter) continue;

            const errorContainer = input.parentElement?.querySelector('.parameter-error') as HTMLElement;
            if (!this.validateParameter(parameter, input, errorContainer)) {
                allValid = false;
            }
        }

        return allValid;
    }

    private createButtons(): void {
        const buttonContainer = this.contentEl.createDiv('modal-button-container');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid var(--background-modifier-border);
        `;

        const cancelButton = buttonContainer.createEl('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', () => {
            this.options.onCancel?.();
            this.close();
        });

        const submitButton = buttonContainer.createEl('button');
        submitButton.textContent = 'Apply Template';
        submitButton.className = 'mod-cta';
        submitButton.addEventListener('click', () => this.handleSubmit());
    }

    private handleSubmit(): void {
        if (!this.validateAllParameters()) {
            return;
        }

        const parameterValues = new Map<string, string>();
        
        for (const [parameterId, input] of this.parameterInputs) {
            const value = input.value.trim();
            if (value) {
                parameterValues.set(parameterId, value);
            }
        }

        // Set parameter values on template
        for (const [parameterId, value] of parameterValues) {
            try {
                this.template.setParameterValue(parameterId, value);
            } catch (error) {
                console.error(`Failed to set parameter ${parameterId}:`, error);
                return;
            }
        }

        this.options.onSubmit(this.template, parameterValues);
        this.close();
    }

    private setupKeyboardHandlers(): void {
        this.contentEl.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.handleSubmit();
            }
            
            if (e.key === 'Escape') {
                e.preventDefault();
                this.options.onCancel?.();
                this.close();
            }
        });
    }
}