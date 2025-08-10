import { App, Notice, TFile, TFolder, Modal } from 'obsidian';
import { ICommandExecutor, CommandExecutionRequest, CommandExecutionResult } from '../../application/services/ICommandExecutor';
import { Result } from '../../domain/core/Result';
import { CommandType } from '../../domain/entities/ButtonCommand';
import { IAssetRepository } from '../../domain/repositories/IAssetRepository';
import { Asset } from '../../domain/entities/Asset';
import { AssetId } from '../../domain/value-objects/AssetId';
import { ClassName } from '../../domain/value-objects/ClassName';
import { OntologyPrefix } from '../../domain/value-objects/OntologyPrefix';

/**
 * Obsidian implementation of command executor
 * Handles actual command execution in the Obsidian environment
 */
export class ObsidianCommandExecutor implements ICommandExecutor {
    private handlers: Map<CommandType, (request: CommandExecutionRequest) => Promise<Result<any>>>;

    constructor(
        private app: App,
        private assetRepository: IAssetRepository
    ) {
        this.handlers = new Map();
        this.registerDefaultHandlers();
    }

    async execute(request: CommandExecutionRequest): Promise<Result<CommandExecutionResult>> {
        const startTime = Date.now();

        try {
            // Validate request
            const validationResult = this.validate(request);
            if (validationResult.isFailure) {
                return Result.fail<CommandExecutionResult>(validationResult.error);
            }

            // Get handler for command type
            const handler = this.handlers.get(request.command.type);
            if (!handler) {
                return Result.fail<CommandExecutionResult>(
                    `No handler registered for command type: ${request.command.type}`
                );
            }

            // Execute command
            const executionResult = await handler(request);
            
            const executionTime = Date.now() - startTime;

            if (executionResult.isFailure) {
                return Result.ok<CommandExecutionResult>({
                    commandId: request.context.commandId,
                    status: 'failure',
                    error: executionResult.error,
                    executionTime
                });
            }

            return Result.ok<CommandExecutionResult>({
                commandId: request.context.commandId,
                status: 'success',
                output: executionResult.getValue(),
                executionTime
            });

        } catch (error) {
            const executionTime = Date.now() - startTime;
            return Result.ok<CommandExecutionResult>({
                commandId: request.context.commandId,
                status: 'failure',
                error: `Unexpected error: ${error.message}`,
                executionTime
            });
        }
    }

    registerHandler(
        type: CommandType,
        handler: (request: CommandExecutionRequest) => Promise<Result<any>>
    ): void {
        this.handlers.set(type, handler);
    }

    isSupported(type: CommandType): boolean {
        return this.handlers.has(type);
    }

    validate(request: CommandExecutionRequest): Result<void> {
        if (!request.command) {
            return Result.fail<void>('Command is required');
        }

        if (!request.context) {
            return Result.fail<void>('Execution context is required');
        }

        // Validate command-specific requirements
        const command = request.command;
        
        if (command.requiresInput && (!request.context.parameters || Object.keys(request.context.parameters).length === 0)) {
            return Result.fail<void>('Command requires input parameters');
        }

        return Result.ok<void>();
    }

    private registerDefaultHandlers(): void {
        // CREATE_ASSET handler
        this.registerHandler(CommandType.CREATE_ASSET, async (request) => {
            const params = request.context.parameters;
            
            // Extract parameters
            const title = params.title || 'Untitled';
            const className = params.className || request.context.targetClass || 'exo__Asset';
            const ontology = params.ontology || 'exo';
            const properties = params.properties || {};

            // Create asset ID
            const idResult = AssetId.create(this.sanitizeFileName(title));
            if (idResult.isFailure) {
                return Result.fail<any>(idResult.error);
            }

            // Create class name
            const classNameResult = ClassName.create(className);
            if (classNameResult.isFailure) {
                return Result.fail<any>(classNameResult.error);
            }

            // Create ontology prefix
            const ontologyResult = OntologyPrefix.create(ontology);
            if (ontologyResult.isFailure) {
                return Result.fail<any>(ontologyResult.error);
            }

            // Create asset
            const assetResult = Asset.create({
                id: idResult.getValue(),
                className: classNameResult.getValue(),
                ontology: ontologyResult.getValue(),
                label: title,
                description: params.description || '',
                properties: properties
            });

            if (assetResult.isFailure) {
                return Result.fail<any>(assetResult.error);
            }

            // Save asset
            await this.assetRepository.save(assetResult.getValue());

            // Open the new asset
            const file = this.app.vault.getAbstractFileByPath(`${title}.md`);
            if (file instanceof TFile) {
                await this.app.workspace.getLeaf().openFile(file);
            }

            new Notice(`Asset "${title}" created successfully`);
            return Result.ok<any>({ assetId: idResult.getValue().toString() });
        });

        // OPEN_ASSET handler
        this.registerHandler(CommandType.OPEN_ASSET, async (request) => {
            const assetId = request.context.assetId || request.context.parameters.assetId;
            
            if (!assetId) {
                return Result.fail<any>('Asset ID is required for OPEN_ASSET command');
            }

            const file = this.app.vault.getAbstractFileByPath(`${assetId}.md`);
            if (!(file instanceof TFile)) {
                return Result.fail<any>(`Asset not found: ${assetId}`);
            }

            await this.app.workspace.getLeaf(true).openFile(file);
            return Result.ok<any>({ opened: assetId });
        });

        // DELETE_ASSET handler
        this.registerHandler(CommandType.DELETE_ASSET, async (request) => {
            const assetId = request.context.assetId || request.context.parameters.assetId;
            
            if (!assetId) {
                return Result.fail<any>('Asset ID is required for DELETE_ASSET command');
            }

            const file = this.app.vault.getAbstractFileByPath(`${assetId}.md`);
            if (!(file instanceof TFile)) {
                return Result.fail<any>(`Asset not found: ${assetId}`);
            }

            // Confirm deletion
            const confirmDelete = await this.confirmAction(
                `Delete Asset`,
                `Are you sure you want to delete "${assetId}"? This cannot be undone.`
            );

            if (!confirmDelete) {
                return Result.ok<any>({ cancelled: true });
            }

            await this.app.vault.delete(file);
            new Notice(`Asset "${assetId}" deleted`);
            return Result.ok<any>({ deleted: assetId });
        });

        // RUN_TEMPLATE handler
        this.registerHandler(CommandType.RUN_TEMPLATE, async (request) => {
            const templateName = request.context.template || request.context.parameters.template_name;
            const targetAssetId = request.context.assetId;

            if (!templateName) {
                return Result.fail<any>('Template name is required');
            }

            if (!targetAssetId) {
                return Result.fail<any>('Target asset is required for template application');
            }

            // Find template file
            const templateFile = this.app.vault.getAbstractFileByPath(`templates/${templateName}.md`);
            if (!(templateFile instanceof TFile)) {
                return Result.fail<any>(`Template not found: ${templateName}`);
            }

            // Read template content
            const templateContent = await this.app.vault.read(templateFile);

            // Find target asset
            const targetFile = this.app.vault.getAbstractFileByPath(`${targetAssetId}.md`);
            if (!(targetFile instanceof TFile)) {
                return Result.fail<any>(`Target asset not found: ${targetAssetId}`);
            }

            // Apply template (append to existing content)
            const currentContent = await this.app.vault.read(targetFile);
            const newContent = currentContent + '\n\n' + this.processTemplate(templateContent, request.context.parameters);
            
            await this.app.vault.modify(targetFile, newContent);
            
            new Notice(`Template "${templateName}" applied successfully`);
            return Result.ok<any>({ template: templateName, target: targetAssetId });
        });

        // EXECUTE_SEARCH handler
        this.registerHandler(CommandType.EXECUTE_SEARCH, async (request) => {
            const query = request.context.parameters.query;
            
            if (!query) {
                return Result.fail<any>('Search query is required');
            }

            // Open search with query
            // @ts-ignore - Obsidian internal API
            this.app.internalPlugins.getPluginById('global-search').instance.openGlobalSearch(query);
            
            return Result.ok<any>({ query });
        });

        // TRIGGER_WORKFLOW handler
        this.registerHandler(CommandType.TRIGGER_WORKFLOW, async (request) => {
            const workflowName = request.context.parameters.workflow;
            
            if (!workflowName) {
                return Result.fail<any>('Workflow name is required');
            }

            // This would integrate with a workflow system
            // For now, just log the workflow trigger
            console.log(`Triggering workflow: ${workflowName}`, request.context.parameters);
            
            new Notice(`Workflow "${workflowName}" triggered`);
            return Result.ok<any>({ workflow: workflowName });
        });

        // CUSTOM handler
        this.registerHandler(CommandType.CUSTOM, async (request) => {
            const script = request.context.script;
            
            if (!script) {
                return Result.fail<any>('Script is required for custom commands');
            }

            // Script execution is disabled for security reasons
            // Dynamic code execution (eval, new Function) poses significant security risks:
            // - Arbitrary code execution
            // - Access to sensitive APIs
            // - Potential data exfiltration
            // Please use predefined commands or safe templating instead
            return Result.fail<any>('Script execution is disabled for security. Use predefined commands instead.');
        });
    }

    private sanitizeFileName(name: string): string {
        // Remove characters that are invalid in file names
        return name.replace(/[\\/:*?"<>|]/g, '-').trim();
    }

    private processTemplate(template: string, parameters: Record<string, any>): string {
        // Replace template variables
        let processed = template;
        
        for (const [key, value] of Object.entries(parameters)) {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            processed = processed.replace(regex, String(value));
        }

        // Replace date variables
        const now = new Date();
        processed = processed.replace(/{{date}}/g, now.toISOString().split('T')[0]);
        processed = processed.replace(/{{time}}/g, now.toTimeString().split(' ')[0]);
        processed = processed.replace(/{{datetime}}/g, now.toISOString());

        return processed;
    }

    private async confirmAction(title: string, message: string): Promise<boolean> {
        return new Promise((resolve) => {
            // Create a simple confirmation modal
            const modal = new ConfirmationModal(this.app, title, message, resolve);
            modal.open();
        });
    }
}

/**
 * Simple confirmation modal
 */
class ConfirmationModal extends Modal {
    constructor(
        app: App,
        private title: string,
        private message: string,
        private onConfirm: (confirmed: boolean) => void
    ) {
        super(app);
    }

    onOpen(): void {
        const { contentEl } = this;
        
        contentEl.createEl('h2', { text: this.title });
        contentEl.createEl('p', { text: this.message });

        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
        
        const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelBtn.addEventListener('click', () => {
            this.onConfirm(false);
            this.close();
        });

        const confirmBtn = buttonContainer.createEl('button', { 
            text: 'Confirm',
            cls: 'mod-warning'
        });
        confirmBtn.addEventListener('click', () => {
            this.onConfirm(true);
            this.close();
        });
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}