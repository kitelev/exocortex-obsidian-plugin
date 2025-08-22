import { Result } from "../../domain/core/Result";
import {
  ButtonCommand,
  CommandType,
} from "../../domain/entities/ButtonCommand";

/**
 * Interface for command execution service
 * This is an application service that orchestrates command execution
 */
export interface CommandExecutionRequest {
  command: ButtonCommand;
  context: {
    commandId: string;
    commandType: CommandType;
    parameters: Record<string, any>;
    timestamp: Date;
    template?: string;
    script?: string;
    targetClass?: string;
    assetId?: string;
    currentView?: string;
    currentClass?: string;
    selection?: string[];
  };
}

export interface CommandExecutionResult {
  commandId: string;
  status: "success" | "failure" | "cancelled";
  output?: any;
  error?: string;
  executionTime: number;
}

export interface ICommandExecutor {
  /**
   * Execute a command with given context
   */
  execute(
    request: CommandExecutionRequest,
  ): Promise<Result<CommandExecutionResult>>;

  /**
   * Register a custom command handler
   */
  registerHandler(
    type: CommandType,
    handler: (request: CommandExecutionRequest) => Promise<Result<any>>,
  ): void;

  /**
   * Check if a command type is supported
   */
  isSupported(type: CommandType): boolean;

  /**
   * Validate command parameters before execution
   */
  validate(request: CommandExecutionRequest): Result<void>;
}
