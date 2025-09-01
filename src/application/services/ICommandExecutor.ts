import { Result } from "../../domain/core/Result";

// Define CommandType enum locally since ButtonCommand was removed
export enum CommandType {
  CREATE_ASSET = "CREATE_ASSET",
  OPEN_ASSET = "OPEN_ASSET",
  DELETE_ASSET = "DELETE_ASSET",
  RUN_TEMPLATE = "RUN_TEMPLATE",
  EXECUTE_SEARCH = "EXECUTE_SEARCH",
  TRIGGER_WORKFLOW = "TRIGGER_WORKFLOW",
  CUSTOM = "CUSTOM",
  CREATE_CHILD_TASK = "CREATE_CHILD_TASK",
  CREATE_CHILD_AREA = "CREATE_CHILD_AREA",
}

/**
 * Interface for command execution service
 * This is an application service that orchestrates command execution
 */
export interface CommandExecutionRequest {
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
