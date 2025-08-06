import { App, Setting, TextComponent, DropdownComponent, ToggleComponent, TextAreaComponent, ButtonComponent } from 'obsidian';
import { PropertyEditingUseCase } from '../../application/use-cases/PropertyEditingUseCase';
import { Result } from '../../domain/core/Result';

/**
 * Component for rendering editable properties in asset views
 * Following the same patterns as the asset creation form
 */
export class PropertyRenderer {
    private editingProperty: string | null = null;
    private originalValues: Map<string, any> = new Map();
    private propertyInputs: Map<string, any> = new Map();

    constructor(
        private app: App,
        private propertyEditingUseCase: PropertyEditingUseCase
    ) {}

    /**
     * Render properties block with inline editing capability
     */
    async renderPropertiesBlock(
        container: HTMLElement,
        assetId: string,
        className: string,
        currentProperties: Record<string, any>
    ): Promise<void> {
        // Get property definitions for the class
        const propertiesResult = await this.propertyEditingUseCase.getPropertiesForClass(className);
        
        if (propertiesResult.isFailure) {
            container.createEl('div', {
                text: 'Failed to load properties',
                cls: 'exocortex-error-message'
            });
            return;
        }

        const properties = propertiesResult.getValue();
        
        // Create properties container
        const propertiesEl = container.createDiv({ cls: 'exocortex-properties-editable' });
        
        // Render each property
        for (const prop of properties) {
            this.renderProperty(
                propertiesEl,
                assetId,
                prop,
                currentProperties[prop.propertyName]
            );
        }

        // Add custom properties not in schema
        const schemaPropertyNames = new Set(properties.map(p => p.propertyName));
        for (const [key, value] of Object.entries(currentProperties)) {
            if (!schemaPropertyNames.has(key) && !key.startsWith('exo__')) {
                this.renderCustomProperty(propertiesEl, assetId, key, value);
            }
        }
    }

    /**
     * Render individual property with edit capability
     */
    private renderProperty(
        container: HTMLElement,
        assetId: string,
        property: any,
        currentValue: any
    ): void {
        const propertyEl = container.createDiv({ cls: 'exocortex-property-item' });
        
        // Property label
        const labelEl = propertyEl.createDiv({ cls: 'exocortex-property-label' });
        labelEl.createSpan({ text: property.label || property.propertyName });
        if (property.isRequired) {
            labelEl.createSpan({ text: ' *', cls: 'required-indicator' });
        }

        // Property value container
        const valueContainer = propertyEl.createDiv({ cls: 'exocortex-property-value' });
        
        if (this.editingProperty === property.propertyName) {
            // Render edit control
            this.renderEditControl(
                valueContainer,
                assetId,
                property,
                currentValue
            );
        } else {
            // Render read-only value with click to edit
            this.renderReadOnlyValue(
                valueContainer,
                assetId,
                property,
                currentValue
            );
        }

        // Property description
        if (property.description) {
            propertyEl.createDiv({
                text: property.description,
                cls: 'exocortex-property-description'
            });
        }
    }

    /**
     * Render read-only value that becomes editable on click
     */
    private renderReadOnlyValue(
        container: HTMLElement,
        assetId: string,
        property: any,
        value: any
    ): void {
        const valueEl = container.createDiv({
            cls: 'exocortex-property-value-readonly'
        });

        // Display formatted value
        const displayValue = this.formatDisplayValue(value, property.type || property.range);
        valueEl.createSpan({ text: displayValue || '(empty)' });

        // Add edit icon
        const editIcon = valueEl.createSpan({
            cls: 'exocortex-edit-icon',
            text: '✏️'
        });

        // Click handler to enter edit mode
        valueEl.addEventListener('click', () => {
            this.enterEditMode(container, assetId, property, value);
        });

        // Keyboard navigation
        valueEl.tabIndex = 0;
        valueEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.enterEditMode(container, assetId, property, value);
            }
        });
    }

    /**
     * Enter edit mode for a property
     */
    private enterEditMode(
        container: HTMLElement,
        assetId: string,
        property: any,
        currentValue: any
    ): void {
        // Save original value for cancel
        this.originalValues.set(property.propertyName, currentValue);
        this.editingProperty = property.propertyName;

        // Clear container and render edit control
        container.empty();
        this.renderEditControl(container, assetId, property, currentValue);
    }

    /**
     * Render appropriate edit control based on property type
     */
    private renderEditControl(
        container: HTMLElement,
        assetId: string,
        property: any,
        currentValue: any
    ): void {
        const controlContainer = container.createDiv({ cls: 'exocortex-edit-control' });

        // Handle different property types
        if (property.isObjectProperty) {
            this.renderObjectPropertyDropdown(controlContainer, assetId, property, currentValue);
        } else if (property.range?.startsWith('enum:')) {
            this.renderEnumDropdown(controlContainer, assetId, property, currentValue);
        } else if (property.range === 'boolean') {
            this.renderBooleanToggle(controlContainer, assetId, property, currentValue);
        } else if (property.range === 'date') {
            this.renderDateInput(controlContainer, assetId, property, currentValue);
        } else if (property.range === 'number') {
            this.renderNumberInput(controlContainer, assetId, property, currentValue);
        } else if (property.range === 'text' || property.range === 'description') {
            this.renderTextArea(controlContainer, assetId, property, currentValue);
        } else if (property.range === 'array') {
            this.renderArrayInput(controlContainer, assetId, property, currentValue);
        } else {
            // Default to text input
            this.renderTextInput(controlContainer, assetId, property, currentValue);
        }

        // Add save/cancel buttons
        this.renderEditActions(controlContainer, assetId, property);
    }

    /**
     * Render dropdown for object properties
     */
    private async renderObjectPropertyDropdown(
        container: HTMLElement,
        assetId: string,
        property: any,
        currentValue: any
    ): Promise<void> {
        const dropdown = new DropdownComponent(container);
        
        // Get assets of the range class
        const rangeClass = property.range?.replace(/\[\[|\]\]/g, '');
        if (rangeClass) {
            const assetsResult = await this.propertyEditingUseCase.getAssetsForClass(rangeClass);
            
            if (assetsResult.isSuccess) {
                const assets = assetsResult.getValue();
                
                dropdown.addOption('', '-- Select --');
                for (const asset of assets) {
                    const wikiLink = `[[${asset.fileName}]]`;
                    const displayName = asset.label !== asset.fileName 
                        ? `${asset.label} (${asset.fileName})`
                        : asset.fileName;
                    dropdown.addOption(wikiLink, displayName);
                }
            }
        }

        // Set current value
        if (currentValue) {
            dropdown.setValue(currentValue);
        }

        // Store reference for saving
        this.propertyInputs.set(property.propertyName, dropdown);
        
        // Focus the dropdown
        dropdown.selectEl.focus();
    }

    /**
     * Render enum dropdown
     */
    private renderEnumDropdown(
        container: HTMLElement,
        assetId: string,
        property: any,
        currentValue: any
    ): void {
        const dropdown = new DropdownComponent(container);
        
        const options = property.range.substring(5).split(',');
        dropdown.addOption('', '-- Select --');
        for (const option of options) {
            dropdown.addOption(option.trim(), option.trim());
        }

        if (currentValue) {
            dropdown.setValue(currentValue);
        }

        this.propertyInputs.set(property.propertyName, dropdown);
        dropdown.selectEl.focus();
    }

    /**
     * Render text input
     */
    private renderTextInput(
        container: HTMLElement,
        assetId: string,
        property: any,
        currentValue: any
    ): void {
        const textInput = new TextComponent(container);
        textInput.setValue(currentValue || '');
        
        this.propertyInputs.set(property.propertyName, textInput);
        textInput.inputEl.focus();
        textInput.inputEl.select();

        // Handle keyboard shortcuts
        textInput.inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.saveProperty(assetId, property);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.cancelEdit(container, assetId, property);
            }
        });
    }

    /**
     * Render edit action buttons
     */
    private renderEditActions(
        container: HTMLElement,
        assetId: string,
        property: any
    ): void {
        const actionsEl = container.createDiv({ cls: 'exocortex-edit-actions' });
        
        // Save button
        new ButtonComponent(actionsEl)
            .setIcon('check')
            .setTooltip('Save (Enter)')
            .onClick(() => this.saveProperty(assetId, property));

        // Cancel button
        new ButtonComponent(actionsEl)
            .setIcon('x')
            .setTooltip('Cancel (Escape)')
            .onClick(() => this.cancelEdit(container, assetId, property));
    }

    /**
     * Save property value
     */
    private async saveProperty(assetId: string, property: any): Promise<void> {
        const input = this.propertyInputs.get(property.propertyName);
        if (!input) return;

        let value: any;
        if (input instanceof TextComponent) {
            value = input.getValue();
        } else if (input instanceof DropdownComponent) {
            value = input.getValue();
        } else if (input instanceof ToggleComponent) {
            value = input.getValue();
        }

        // Validate and save
        const result = await this.propertyEditingUseCase.updateProperty({
            assetId,
            propertyName: property.propertyName,
            value,
            propertyDefinition: property
        });

        if (result.isSuccess) {
            // Exit edit mode and refresh display
            this.editingProperty = null;
            this.propertyInputs.delete(property.propertyName);
            this.originalValues.delete(property.propertyName);
            
            // Show success indicator
            // @ts-ignore
            new Notice('Property updated', 1000);
        } else {
            // Show error
            // @ts-ignore
            new Notice(`Error: ${result.error}`, 3000);
        }
    }

    /**
     * Cancel edit and restore original value
     */
    private cancelEdit(
        container: HTMLElement,
        assetId: string,
        property: any
    ): void {
        const originalValue = this.originalValues.get(property.propertyName);
        
        this.editingProperty = null;
        this.propertyInputs.delete(property.propertyName);
        this.originalValues.delete(property.propertyName);

        // Re-render as read-only
        container.empty();
        this.renderReadOnlyValue(container, assetId, property, originalValue);
    }

    /**
     * Format value for display
     */
    private formatDisplayValue(value: any, type: string): string {
        if (value === null || value === undefined) {
            return '';
        }

        if (Array.isArray(value)) {
            return value.join(', ');
        }

        if (typeof value === 'boolean') {
            return value ? '✓' : '✗';
        }

        return String(value);
    }

    /**
     * Render custom property not in schema
     */
    private renderCustomProperty(
        container: HTMLElement,
        assetId: string,
        propertyName: string,
        value: any
    ): void {
        const property = {
            propertyName,
            label: propertyName,
            range: 'string',
            isRequired: false,
            description: 'Custom property'
        };

        this.renderProperty(container, assetId, property, value);
    }

    // Additional methods for other input types...
    private renderBooleanToggle(container: HTMLElement, assetId: string, property: any, currentValue: any): void {
        const toggle = new ToggleComponent(container);
        toggle.setValue(currentValue || false);
        this.propertyInputs.set(property.propertyName, toggle);
    }

    private renderDateInput(container: HTMLElement, assetId: string, property: any, currentValue: any): void {
        const dateInput = new TextComponent(container);
        dateInput.inputEl.type = 'date';
        dateInput.setValue(currentValue || '');
        this.propertyInputs.set(property.propertyName, dateInput);
        dateInput.inputEl.focus();
    }

    private renderNumberInput(container: HTMLElement, assetId: string, property: any, currentValue: any): void {
        const numberInput = new TextComponent(container);
        numberInput.inputEl.type = 'number';
        numberInput.setValue(String(currentValue || ''));
        this.propertyInputs.set(property.propertyName, numberInput);
        numberInput.inputEl.focus();
    }

    private renderTextArea(container: HTMLElement, assetId: string, property: any, currentValue: any): void {
        const textArea = new TextAreaComponent(container);
        textArea.setValue(currentValue || '');
        this.propertyInputs.set(property.propertyName, textArea);
        textArea.inputEl.focus();
    }

    private renderArrayInput(container: HTMLElement, assetId: string, property: any, currentValue: any): void {
        const arrayContainer = container.createDiv({ cls: 'exocortex-array-input' });
        const values = Array.isArray(currentValue) ? currentValue : [];
        
        // Render existing values
        values.forEach((val, index) => {
            const itemEl = arrayContainer.createDiv({ cls: 'array-item' });
            const input = new TextComponent(itemEl);
            input.setValue(val);
            
            new ButtonComponent(itemEl)
                .setIcon('x')
                .onClick(() => {
                    values.splice(index, 1);
                    this.renderArrayInput(container, assetId, property, values);
                });
        });

        // Add new item button
        new ButtonComponent(arrayContainer)
            .setButtonText('Add item')
            .onClick(() => {
                values.push('');
                this.renderArrayInput(container, assetId, property, values);
            });

        this.propertyInputs.set(property.propertyName, { values });
    }
}