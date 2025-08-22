import { UseCase } from "../core/UseCase";
import { Result } from "../../domain/core/Result";
import { IButtonRepository } from "../../domain/repositories/IButtonRepository";
import { ICommandExecutor } from "../services/ICommandExecutor";
import { AssetId } from "../../domain/value-objects/AssetId";
import { CommandType } from "../../domain/entities/ButtonCommand";

/**
 * Use Case for executing a button command
 */
export interface ExecuteButtonCommandRequest {
  buttonId: string;
  assetId?: string;
  inputParameters?: Record<string, any>;
  context?: {
    currentView?: string;
    currentClass?: string;
    selection?: string[];
  };
}

export interface ExecuteButtonCommandResponse {
  success: boolean;
  message?: string;
  result?: any;
  requiresInput?: boolean;
  inputSchema?: any;
}

export class ExecuteButtonCommandUseCase
  implements UseCase<ExecuteButtonCommandRequest, ExecuteButtonCommandResponse>
{
  constructor(
    private buttonRepository: IButtonRepository,
    private commandExecutor: ICommandExecutor,
  ) {}

  async execute(
    request: ExecuteButtonCommandRequest,
  ): Promise<Result<ExecuteButtonCommandResponse>> {
    // Validate request
    if (!request.buttonId) {
      return Result.fail<ExecuteButtonCommandResponse>("Button ID is required");
    }

    // Parse button ID
    const buttonIdResult = AssetId.create(request.buttonId);
    if (buttonIdResult.isFailure) {
      return Result.fail<ExecuteButtonCommandResponse>("Invalid button ID");
    }
    const buttonId = buttonIdResult.getValue();

    // Find the button
    const buttonResult = await this.buttonRepository.findButtonById(buttonId);
    if (buttonResult.isFailure) {
      return Result.fail<ExecuteButtonCommandResponse>(
        `Failed to load button: ${buttonResult.error}`,
      );
    }

    const button = buttonResult.getValue();
    if (!button) {
      return Result.fail<ExecuteButtonCommandResponse>("Button not found");
    }

    // Check if button can be executed
    if (!button.canExecute()) {
      return Result.fail<ExecuteButtonCommandResponse>("Button is disabled");
    }

    // Load the command
    const commandResult = await this.buttonRepository.findCommandById(
      button.commandId,
    );
    if (commandResult.isFailure) {
      return Result.fail<ExecuteButtonCommandResponse>(
        `Failed to load command: ${commandResult.error}`,
      );
    }

    const command = commandResult.getValue();
    if (!command) {
      return Result.fail<ExecuteButtonCommandResponse>("Command not found");
    }

    // Check if command requires input but none provided
    if (command.requiresInput && !request.inputParameters) {
      // Return schema for input collection
      return Result.ok<ExecuteButtonCommandResponse>({
        success: false,
        requiresInput: true,
        inputSchema: {
          title: command.name,
          description: command.description,
          parameters: command.parameters,
        },
      });
    }

    // Validate and prepare execution context
    const contextResult = command.buildExecutionContext(
      request.inputParameters || {},
    );

    if (contextResult.isFailure) {
      return Result.fail<ExecuteButtonCommandResponse>(
        `Invalid parameters: ${contextResult.error}`,
      );
    }

    const executionContext = contextResult.getValue();

    // Execute the command through the command executor service
    try {
      const executionResult = await this.commandExecutor.execute({
        command: command,
        context: {
          ...executionContext,
          assetId: request.assetId,
          currentView: request.context?.currentView,
          currentClass: request.context?.currentClass,
          selection: request.context?.selection,
        },
      });

      if (executionResult.isFailure) {
        return Result.fail<ExecuteButtonCommandResponse>(
          `Command execution failed: ${executionResult.error}`,
        );
      }

      const result = executionResult.getValue();

      // Record button click event
      button.click();

      return Result.ok<ExecuteButtonCommandResponse>({
        success: true,
        message: `Command '${command.name}' executed successfully`,
        result: result,
      });
    } catch (error) {
      return Result.fail<ExecuteButtonCommandResponse>(
        `Unexpected error during command execution: ${error.message}`,
      );
    }
  }
}
