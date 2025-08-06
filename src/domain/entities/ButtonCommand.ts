import { Entity } from '../core/Entity';
import { AssetId } from '../value-objects/AssetId';
import { Result } from '../core/Result';

/**
 * Types of commands that can be executed
 */
export enum CommandType {
    CREATE_ASSET = 'CREATE_ASSET',
    OPEN_ASSET = 'OPEN_ASSET',
    DELETE_ASSET = 'DELETE_ASSET',
    RUN_TEMPLATE = 'RUN_TEMPLATE',
    EXECUTE_SEARCH = 'EXECUTE_SEARCH',
    TRIGGER_WORKFLOW = 'TRIGGER_WORKFLOW',
    CUSTOM = 'CUSTOM'
}

/**
 * Parameter definition for command inputs
 */
export interface CommandParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'asset' | 'date' | 'array';
    required: boolean;
    defaultValue?: any;
    label?: string;
    description?: string;
    validation?: string; // Regex or validation rule
}

/**
 * Domain Entity representing a Button Command
 */
export interface ButtonCommandProps {
    id: AssetId;
    type: CommandType;
    name: string;
    description?: string;
    requiresInput: boolean;
    parameters: CommandParameter[];
    targetClass?: string; // For commands that operate on specific classes
    template?: string; // For template-based commands
    script?: string; // For custom script commands
}

export class ButtonCommand extends Entity<ButtonCommandProps> {
    private constructor(props: ButtonCommandProps) {
        super(props);
    }

    /**
     * Factory method with validation
     */
    public static create(props: ButtonCommandProps): Result<ButtonCommand> {
        // Validate command name
        if (!props.name || props.name.trim().length === 0) {
            return Result.fail<ButtonCommand>('Command name cannot be empty');
        }

        // Validate parameters if input is required
        if (props.requiresInput && (!props.parameters || props.parameters.length === 0)) {
            return Result.fail<ButtonCommand>('Commands requiring input must define parameters');
        }

        // Validate each parameter
        for (const param of props.parameters) {
            if (!param.name || param.name.trim().length === 0) {
                return Result.fail<ButtonCommand>('Parameter name cannot be empty');
            }
            
            if (param.validation) {
                try {
                    new RegExp(param.validation);
                } catch (e) {
                    return Result.fail<ButtonCommand>(`Invalid validation regex for parameter ${param.name}`);
                }
            }
        }

        // Validate command-specific requirements
        if (props.type === CommandType.RUN_TEMPLATE && !props.template) {
            return Result.fail<ButtonCommand>('Template commands must specify a template');
        }

        if (props.type === CommandType.CUSTOM && !props.script) {
            return Result.fail<ButtonCommand>('Custom commands must specify a script');
        }

        return Result.ok<ButtonCommand>(new ButtonCommand(props));
    }

    // Getters
    get id(): AssetId {
        return this.props.id;
    }

    get type(): CommandType {
        return this.props.type;
    }

    get name(): string {
        return this.props.name;
    }

    get description(): string | undefined {
        return this.props.description;
    }

    get requiresInput(): boolean {
        return this.props.requiresInput;
    }

    get parameters(): CommandParameter[] {
        return this.props.parameters;
    }

    get targetClass(): string | undefined {
        return this.props.targetClass;
    }

    get template(): string | undefined {
        return this.props.template;
    }

    get script(): string | undefined {
        return this.props.script;
    }

    /**
     * Validate input parameters against command definition
     */
    public validateInput(input: Record<string, any>): Result<Record<string, any>> {
        const validated: Record<string, any> = {};
        const errors: string[] = [];

        for (const param of this.parameters) {
            const value = input[param.name];

            // Check required parameters
            if (param.required && (value === undefined || value === null || value === '')) {
                errors.push(`Required parameter '${param.name}' is missing`);
                continue;
            }

            // Skip optional parameters if not provided
            if (!param.required && (value === undefined || value === null)) {
                if (param.defaultValue !== undefined) {
                    validated[param.name] = param.defaultValue;
                }
                continue;
            }

            // Type validation
            if (!this.validateParameterType(value, param.type)) {
                errors.push(`Parameter '${param.name}' must be of type ${param.type}`);
                continue;
            }

            // Custom validation
            if (param.validation) {
                const regex = new RegExp(param.validation);
                if (!regex.test(String(value))) {
                    errors.push(`Parameter '${param.name}' does not match validation pattern`);
                    continue;
                }
            }

            validated[param.name] = value;
        }

        if (errors.length > 0) {
            return Result.fail<Record<string, any>>(errors.join('; '));
        }

        return Result.ok<Record<string, any>>(validated);
    }

    /**
     * Check if command can be executed in current context
     */
    public canExecute(context: { currentClass?: string; hasSelection?: boolean }): boolean {
        // Check if command is applicable to current class
        if (this.targetClass && context.currentClass !== this.targetClass) {
            return false;
        }

        // Check if command requires selection
        if (this.type === CommandType.DELETE_ASSET && !context.hasSelection) {
            return false;
        }

        return true;
    }

    /**
     * Build execution context for the command
     */
    public buildExecutionContext(input: Record<string, any>): Result<CommandExecutionContext> {
        const validationResult = this.validateInput(input);
        
        if (validationResult.isFailure) {
            return Result.fail<CommandExecutionContext>(validationResult.error);
        }

        const context: CommandExecutionContext = {
            commandId: this.id.toString(),
            commandType: this.type,
            parameters: validationResult.getValue(),
            timestamp: new Date(),
            template: this.props.template,
            script: this.props.script,
            targetClass: this.props.targetClass
        };

        return Result.ok<CommandExecutionContext>(context);
    }

    private validateParameterType(value: any, type: string): boolean {
        switch (type) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' || !isNaN(Number(value));
            case 'boolean':
                return typeof value === 'boolean' || value === 'true' || value === 'false';
            case 'date':
                return !isNaN(Date.parse(String(value)));
            case 'asset':
                return typeof value === 'string' && value.startsWith('[[') && value.endsWith(']]');
            case 'array':
                return Array.isArray(value) || typeof value === 'string';
            default:
                return true;
        }
    }
}

/**
 * Context for command execution
 */
export interface CommandExecutionContext {
    commandId: string;
    commandType: CommandType;
    parameters: Record<string, any>;
    timestamp: Date;
    template?: string;
    script?: string;
    targetClass?: string;
}