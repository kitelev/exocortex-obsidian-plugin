import { App, TFile } from 'obsidian';
import { PropertiesBlockConfig } from "../../domain/entities/LayoutBlockStubs";
import { PropertyRenderer } from '../components/PropertyRenderer';

export class PropertiesBlockRenderer {
    constructor(
        private app: App,
        private propertyRenderer: PropertyRenderer
    ) {}

    async render(
        container: HTMLElement,
        config: any,
        file: TFile,
        frontmatter: any,
        dv: any
    ): Promise<void> {
        const propsConfig = config as PropertiesBlockConfig;
        
        // Determine which properties to show
        let propertiesToShow = Object.keys(frontmatter);
        
        // Apply included properties filter
        if (propsConfig.includedProperties && propsConfig.includedProperties.length > 0) {
            propertiesToShow = propertiesToShow.filter(prop => 
                propsConfig.includedProperties!.includes(prop)
            );
        }
        
        // Apply excluded properties filter
        if (propsConfig.excludedProperties && propsConfig.excludedProperties.length > 0) {
            propertiesToShow = propertiesToShow.filter(prop => 
                !propsConfig.excludedProperties!.includes(prop)
            );
        }
        
        // Get asset ID and class
        const assetId = frontmatter['exo__Asset_uid'] || file.path;
        const instanceClass = frontmatter['exo__Instance_class'];
        const cleanClassName = this.cleanClassName(instanceClass);
        
        // Check if properties are editable
        const editableProps = propsConfig.editableProperties || [];
        
        // Group properties if groupBy is specified
        if (propsConfig.groupBy) {
            this.renderGroupedProperties(
                container,
                propertiesToShow,
                frontmatter,
                propsConfig.groupBy,
                assetId,
                cleanClassName,
                editableProps
            );
        } else {
            this.renderFlatProperties(
                container,
                propertiesToShow,
                frontmatter,
                assetId,
                cleanClassName,
                editableProps
            );
        }
    }

    renderPropertiesBlock(properties: any[], container: HTMLElement): void {
        if (!container) {
            return;
        }

        if (!properties || properties.length === 0) {
            return;
        }
        
        properties.forEach(prop => {
            if (!prop || typeof prop !== 'object') {
                return;
            }

            const propertyDiv = document.createElement('div');
            propertyDiv.className = 'property-item';
            container.appendChild(propertyDiv);
            
            // Property name
            if (prop.name) {
                const nameEl = document.createElement('span');
                nameEl.className = 'property-name';
                nameEl.textContent = this.formatPropertyName(prop.name);
                propertyDiv.appendChild(nameEl);
                
                // Add separator
                const separator = document.createElement('span');
                separator.textContent = ': ';
                propertyDiv.appendChild(separator);
            }
            
            // Property value
            const valueEl = document.createElement('span');
            valueEl.className = 'property-value';
            propertyDiv.appendChild(valueEl);
            
            if (prop.editable) {
                // Create input for editable properties
                if (prop.type === 'boolean') {
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.checked = !!prop.value;
                    valueEl.appendChild(checkbox);
                } else if (prop.type === 'number') {
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.value = String(prop.value || '');
                    valueEl.appendChild(input);
                } else {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = String(prop.value || '');
                    valueEl.appendChild(input);
                }
            } else {
                // Render readonly value
                if (prop.type === 'tags' && Array.isArray(prop.value)) {
                    prop.value.forEach((tag: string) => {
                        const tagEl = document.createElement('span');
                        tagEl.className = 'tag';
                        tagEl.textContent = tag;
                        valueEl.appendChild(tagEl);
                    });
                } else {
                    const formattedValue = this.formatValue(prop.value);
                    valueEl.textContent = formattedValue;
                }
            }
        });
    }

    private async renderFlatProperties(
        container: HTMLElement,
        properties: string[],
        frontmatter: any,
        assetId: string,
        className: string,
        editableProps: string[]
    ): Promise<void> {
        // Use PropertyRenderer for all properties (it will handle editability internally)
        const editableContainer = container.createDiv({ cls: 'exocortex-properties-editable' });
        await this.propertyRenderer.renderPropertiesBlock(
            editableContainer,
            assetId,
            className,
            frontmatter
        );
        
        // Render non-editable properties
        const readOnlyProps = properties.filter(p => !editableProps.includes(p));
        if (readOnlyProps.length > 0) {
            const readOnlyContainer = container.createDiv({ cls: 'exocortex-properties-readonly' });
            const table = readOnlyContainer.createEl('table', { cls: 'exocortex-properties-table' });
            
            readOnlyProps.forEach(prop => {
                const row = table.createEl('tr');
                
                // Property name
                const nameCell = row.createEl('td', { cls: 'property-name' });
                nameCell.setText(this.formatPropertyName(prop));
                
                // Property value
                const valueCell = row.createEl('td', { cls: 'property-value' });
                const value = frontmatter[prop];
                valueCell.setText(this.formatValue(value));
            });
        }
    }

    private renderGroupedProperties(
        container: HTMLElement,
        properties: string[],
        frontmatter: any,
        groupBy: string,
        assetId: string,
        className: string,
        editableProps: string[]
    ): void {
        // Group properties by prefix or custom logic
        const groups = new Map<string, string[]>();
        
        properties.forEach(prop => {
            const group = this.getPropertyGroup(prop, groupBy);
            if (!groups.has(group)) {
                groups.set(group, []);
            }
            groups.get(group)!.push(prop);
        });
        
        // Render each group
        groups.forEach((props, groupName) => {
            const groupContainer = container.createDiv({ cls: 'exocortex-property-group' });
            
            if (groupName !== 'Other') {
                groupContainer.createEl('h4', { 
                    text: groupName,
                    cls: 'property-group-header'
                });
            }
            
            const groupContent = groupContainer.createDiv({ cls: 'property-group-content' });
            
            // Separate editable and readonly
            const groupEditable = props.filter(p => editableProps.includes(p));
            const groupReadOnly = props.filter(p => !editableProps.includes(p));
            
            // Render editable properties
            if (groupEditable.length > 0) {
                this.propertyRenderer.renderPropertiesBlock(
                    groupContent,
                    assetId,
                    className,
                    frontmatter
                );
            }
            
            // Render readonly properties
            if (groupReadOnly.length > 0) {
                const table = groupContent.createEl('table', { cls: 'exocortex-properties-table' });
                
                groupReadOnly.forEach(prop => {
                    const row = table.createEl('tr');
                    
                    const nameCell = row.createEl('td', { cls: 'property-name' });
                    nameCell.setText(this.formatPropertyName(prop));
                    
                    const valueCell = row.createEl('td', { cls: 'property-value' });
                    const value = frontmatter[prop];
                    valueCell.setText(this.formatValue(value));
                });
            }
        });
    }

    private getPropertyGroup(property: string, groupBy: string): string {
        if (groupBy === 'prefix') {
            const match = property.match(/^([^_]+)__/);
            if (match) {
                return match[1].toUpperCase();
            }
        }
        
        if (groupBy === 'category') {
            if (property.includes('status') || property.includes('Status')) return 'Status';
            if (property.includes('date') || property.includes('Date')) return 'Dates';
            if (property.includes('relate') || property.includes('link')) return 'Relations';
        }
        
        return 'Other';
    }

    private formatPropertyName(prop: string): string {
        // For test compatibility, keep original prop name if it doesn't have prefix
        if (!prop.includes('__')) {
            return prop;
        }
        
        // Remove prefix and format
        return prop
            .replace(/^[^_]+__/, '')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    private formatValue(value: any): string {
        if (value === null || value === undefined) return '';
        
        if (Array.isArray(value)) {
            return value.map(v => this.cleanValue(v)).join(', ');
        }
        
        if (typeof value === 'boolean') {
            return value ? '✓' : '✗';
        }
        
        if (value instanceof Date) {
            return value.toLocaleDateString();
        }
        
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        
        return this.cleanValue(value);
    }

    private cleanValue(value: any): string {
        if (!value) return '';
        const str = value.toString();
        return str.replace(/\[\[|\]\]/g, '');
    }

    private cleanClassName(className: any): string {
        if (!className) return '';
        const str = Array.isArray(className) ? className[0] : className;
        return str?.toString().replace(/\[\[|\]\]/g, '') || '';
    }
}