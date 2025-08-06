import { App, TFile } from 'obsidian';
import { IButtonRepository } from '../../domain/repositories/IButtonRepository';
import { UIButton } from '../../domain/entities/UIButton';
import { ButtonCommand, CommandType, CommandParameter } from '../../domain/entities/ButtonCommand';
import { AssetId } from '../../domain/value-objects/AssetId';
import { Result } from '../../domain/core/Result';

/**
 * Obsidian implementation of Button repository
 */
export class ObsidianButtonRepository implements IButtonRepository {
    constructor(private app: App) {}

    async findButtonById(id: AssetId): Promise<Result<UIButton | null>> {
        try {
            const file = this.app.vault.getAbstractFileByPath(id.toString() + '.md');
            if (!file || !(file instanceof TFile)) {
                return Result.ok<UIButton | null>(null);
            }

            return this.buildButtonFromFile(file);
        } catch (error) {
            return Result.fail<UIButton | null>(`Failed to find button: ${error.message}`);
        }
    }

    async findCommandById(id: AssetId): Promise<Result<ButtonCommand | null>> {
        try {
            const file = this.app.vault.getAbstractFileByPath(id.toString() + '.md');
            if (!file || !(file instanceof TFile)) {
                return Result.ok<ButtonCommand | null>(null);
            }

            return this.buildCommandFromFile(file);
        } catch (error) {
            return Result.fail<ButtonCommand | null>(`Failed to find command: ${error.message}`);
        }
    }

    async findAllButtons(): Promise<Result<UIButton[]>> {
        try {
            const buttons: UIButton[] = [];
            const files = this.app.vault.getMarkdownFiles();

            for (const file of files) {
                const metadata = this.app.metadataCache.getFileCache(file);
                if (!metadata?.frontmatter) continue;

                const instanceClass = metadata.frontmatter['exo__Instance_class'];
                if (instanceClass !== '[[ui__Button]]') continue;

                const buttonResult = await this.buildButtonFromFile(file);
                if (buttonResult.isSuccess && buttonResult.getValue()) {
                    buttons.push(buttonResult.getValue()!);
                }
            }

            return Result.ok<UIButton[]>(buttons);
        } catch (error) {
            return Result.fail<UIButton[]>(`Failed to find buttons: ${error.message}`);
        }
    }

    async findAllCommands(): Promise<Result<ButtonCommand[]>> {
        try {
            const commands: ButtonCommand[] = [];
            const files = this.app.vault.getMarkdownFiles();

            for (const file of files) {
                const metadata = this.app.metadataCache.getFileCache(file);
                if (!metadata?.frontmatter) continue;

                const instanceClass = metadata.frontmatter['exo__Instance_class'];
                if (instanceClass !== '[[ui__ButtonCommand]]') continue;

                const commandResult = await this.buildCommandFromFile(file);
                if (commandResult.isSuccess && commandResult.getValue()) {
                    commands.push(commandResult.getValue()!);
                }
            }

            return Result.ok<ButtonCommand[]>(commands);
        } catch (error) {
            return Result.fail<ButtonCommand[]>(`Failed to find commands: ${error.message}`);
        }
    }

    async findButtonsByCommandId(commandId: AssetId): Promise<Result<UIButton[]>> {
        try {
            const buttons: UIButton[] = [];
            const allButtonsResult = await this.findAllButtons();
            
            if (allButtonsResult.isFailure) {
                return Result.fail<UIButton[]>(allButtonsResult.error);
            }

            const allButtons = allButtonsResult.getValue();
            for (const button of allButtons) {
                if (button.commandId.equals(commandId)) {
                    buttons.push(button);
                }
            }

            return Result.ok<UIButton[]>(buttons);
        } catch (error) {
            return Result.fail<UIButton[]>(`Failed to find buttons by command: ${error.message}`);
        }
    }

    async saveButton(button: UIButton): Promise<Result<void>> {
        try {
            const filePath = `${button.id.toString()}.md`;
            const content = this.serializeButton(button);
            
            const existingFile = this.app.vault.getAbstractFileByPath(filePath);
            if (existingFile instanceof TFile) {
                await this.app.vault.modify(existingFile, content);
            } else {
                await this.app.vault.create(filePath, content);
            }

            return Result.ok<void>();
        } catch (error) {
            return Result.fail<void>(`Failed to save button: ${error.message}`);
        }
    }

    async saveCommand(command: ButtonCommand): Promise<Result<void>> {
        try {
            const filePath = `${command.id.toString()}.md`;
            const content = this.serializeCommand(command);
            
            const existingFile = this.app.vault.getAbstractFileByPath(filePath);
            if (existingFile instanceof TFile) {
                await this.app.vault.modify(existingFile, content);
            } else {
                await this.app.vault.create(filePath, content);
            }

            return Result.ok<void>();
        } catch (error) {
            return Result.fail<void>(`Failed to save command: ${error.message}`);
        }
    }

    async deleteButton(id: AssetId): Promise<Result<void>> {
        try {
            const file = this.app.vault.getAbstractFileByPath(id.toString() + '.md');
            if (file instanceof TFile) {
                await this.app.vault.delete(file);
            }
            return Result.ok<void>();
        } catch (error) {
            return Result.fail<void>(`Failed to delete button: ${error.message}`);
        }
    }

    async deleteCommand(id: AssetId): Promise<Result<void>> {
        try {
            const file = this.app.vault.getAbstractFileByPath(id.toString() + '.md');
            if (file instanceof TFile) {
                await this.app.vault.delete(file);
            }
            return Result.ok<void>();
        } catch (error) {
            return Result.fail<void>(`Failed to delete command: ${error.message}`);
        }
    }

    private async buildButtonFromFile(file: TFile): Promise<Result<UIButton | null>> {
        try {
            const metadata = this.app.metadataCache.getFileCache(file);
            if (!metadata?.frontmatter) {
                return Result.ok<UIButton | null>(null);
            }

            const fm = metadata.frontmatter;
            
            const idResult = AssetId.create(file.basename);
            const commandIdResult = AssetId.create(
                this.cleanAssetReference(fm['ui__Button_command'] || '')
            );

            if (idResult.isFailure || commandIdResult.isFailure) {
                return Result.ok<UIButton | null>(null);
            }

            const buttonResult = UIButton.create({
                id: idResult.getValue(),
                label: fm['ui__Button_label'] || file.basename,
                commandId: commandIdResult.getValue(),
                order: fm['ui__Button_order'] || 0,
                isEnabled: fm['ui__Button_enabled'] !== false,
                tooltip: fm['ui__Button_tooltip']
            });

            if (buttonResult.isFailure) {
                return Result.fail<UIButton | null>(buttonResult.error);
            }

            return Result.ok<UIButton | null>(buttonResult.getValue());
        } catch (error) {
            return Result.fail<UIButton | null>(`Failed to build button: ${error.message}`);
        }
    }

    private async buildCommandFromFile(file: TFile): Promise<Result<ButtonCommand | null>> {
        try {
            const metadata = this.app.metadataCache.getFileCache(file);
            if (!metadata?.frontmatter) {
                return Result.ok<ButtonCommand | null>(null);
            }

            const fm = metadata.frontmatter;
            
            const idResult = AssetId.create(file.basename);
            if (idResult.isFailure) {
                return Result.ok<ButtonCommand | null>(null);
            }

            // Parse command type
            const typeString = fm['ui__Command_type'] || 'CUSTOM';
            const type = this.parseCommandType(typeString);

            // Parse parameters
            const parameters = this.parseParameters(fm['ui__Command_parameters']);

            const commandResult = ButtonCommand.create({
                id: idResult.getValue(),
                type: type,
                name: fm['ui__Command_name'] || file.basename,
                description: fm['ui__Command_description'],
                requiresInput: fm['ui__Command_requiresInput'] === true,
                parameters: parameters,
                targetClass: this.cleanAssetReference(fm['ui__Command_targetClass']),
                template: fm['ui__Command_template'],
                script: fm['ui__Command_script']
            });

            if (commandResult.isFailure) {
                return Result.fail<ButtonCommand | null>(commandResult.error);
            }

            return Result.ok<ButtonCommand | null>(commandResult.getValue());
        } catch (error) {
            return Result.fail<ButtonCommand | null>(`Failed to build command: ${error.message}`);
        }
    }

    private parseCommandType(typeString: string): CommandType {
        const upperType = typeString.toUpperCase();
        return CommandType[upperType as keyof typeof CommandType] || CommandType.CUSTOM;
    }

    private parseParameters(paramsData: any): CommandParameter[] {
        if (!paramsData) return [];
        
        const params: CommandParameter[] = [];
        const paramArray = this.ensureArray(paramsData);

        for (const param of paramArray) {
            if (typeof param === 'object' && param.name) {
                params.push({
                    name: param.name,
                    type: param.type || 'string',
                    required: param.required === true,
                    defaultValue: param.defaultValue,
                    label: param.label,
                    description: param.description,
                    validation: param.validation
                });
            }
        }

        return params;
    }

    private serializeButton(button: UIButton): string {
        const frontmatter = {
            'exo__Instance_class': '[[ui__Button]]',
            'ui__Button_label': button.label,
            'ui__Button_command': `[[${button.commandId.toString()}]]`,
            'ui__Button_order': button.order,
            'ui__Button_enabled': button.isEnabled,
            'ui__Button_tooltip': button.tooltip
        };

        const yamlContent = this.toYaml(frontmatter);
        return `---\n${yamlContent}---\n\n# Button: ${button.label}\n`;
    }

    private serializeCommand(command: ButtonCommand): string {
        const frontmatter = {
            'exo__Instance_class': '[[ui__ButtonCommand]]',
            'ui__Command_type': command.type,
            'ui__Command_name': command.name,
            'ui__Command_description': command.description,
            'ui__Command_requiresInput': command.requiresInput,
            'ui__Command_parameters': command.parameters,
            'ui__Command_targetClass': command.targetClass ? `[[${command.targetClass}]]` : null,
            'ui__Command_template': command.template,
            'ui__Command_script': command.script
        };

        const yamlContent = this.toYaml(frontmatter);
        return `---\n${yamlContent}---\n\n# Command: ${command.name}\n`;
    }

    private cleanAssetReference(ref: string): string {
        if (typeof ref !== 'string') return '';
        return ref.replace(/\[\[|\]\]/g, '').trim();
    }

    private ensureArray(value: any): any[] {
        if (Array.isArray(value)) return value;
        if (value) return [value];
        return [];
    }

    private toYaml(obj: any): string {
        // Simple YAML serialization
        return Object.entries(obj)
            .filter(([_, value]) => value !== null && value !== undefined)
            .map(([key, value]) => {
                if (Array.isArray(value)) {
                    if (value.length === 0) return `${key}: []`;
                    return `${key}:\n${value.map(v => `  - ${JSON.stringify(v)}`).join('\n')}`;
                }
                if (typeof value === 'object') {
                    return `${key}: ${JSON.stringify(value)}`;
                }
                return `${key}: ${value}`;
            })
            .join('\n') + '\n';
    }
}