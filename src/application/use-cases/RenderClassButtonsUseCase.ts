import { UseCase } from "../core/UseCase";
import { Result } from "../../domain/core/Result";
import { IClassViewRepository } from "../../domain/repositories/IClassViewRepository";
import { IButtonRepository } from "../../domain/repositories/IButtonRepository";
import { ClassName } from "../../domain/value-objects/ClassName";
import { UIButton } from "../../domain/entities/UIButton";
import { ButtonCommand } from "../../domain/entities/ButtonCommand";

/**
 * Use Case for rendering buttons in an asset view
 * Following Clean Architecture - orchestrates domain logic
 */
export interface RenderClassButtonsRequest {
  className: string;
  assetId?: string;
  context?: {
    hasSelection: boolean;
    currentUser?: string;
  };
}

export interface ButtonRenderData {
  buttonId: string;
  label: string;
  tooltip?: string;
  isEnabled: boolean;
  order: number;
  command: {
    id: string;
    type: string;
    requiresInput: boolean;
    parameters: any[];
  };
}

export interface RenderClassButtonsResponse {
  buttons: ButtonRenderData[];
  displayOptions: {
    position: "top" | "bottom" | "floating";
    showButtons: boolean;
  };
}

export class RenderClassButtonsUseCase
  implements UseCase<RenderClassButtonsRequest, RenderClassButtonsResponse>
{
  constructor(
    private classViewRepository: IClassViewRepository,
    private buttonRepository: IButtonRepository,
  ) {}

  async execute(
    request: RenderClassButtonsRequest,
  ): Promise<Result<RenderClassButtonsResponse>> {
    // Validate request
    if (!request.className) {
      return Result.fail<RenderClassButtonsResponse>("Class name is required");
    }

    // Create ClassName value object
    const classNameResult = ClassName.create(request.className);
    if (classNameResult.isFailure) {
      return Result.fail<RenderClassButtonsResponse>(classNameResult.error);
    }
    const className = classNameResult.getValue();

    // Find ClassView configuration
    const classViewResult =
      await this.classViewRepository.findByClassName(className);
    if (classViewResult.isFailure) {
      return Result.fail<RenderClassButtonsResponse>(
        `Failed to load class view: ${classViewResult.error}`,
      );
    }

    const classView = classViewResult.getValue();

    // If no ClassView configured, return empty buttons
    if (!classView) {
      return Result.ok<RenderClassButtonsResponse>({
        buttons: [],
        displayOptions: {
          position: "top",
          showButtons: false,
        },
      });
    }

    // Check if buttons should be shown
    if (!classView.displayOptions.showButtons) {
      return Result.ok<RenderClassButtonsResponse>({
        buttons: [],
        displayOptions: {
          position: classView.displayOptions.buttonPosition,
          showButtons: false,
        },
      });
    }

    // Get enabled buttons
    const enabledButtons = classView.getEnabledButtons();

    // Load commands for each button
    const buttonRenderData: ButtonRenderData[] = [];

    for (const button of enabledButtons) {
      const commandResult = await this.buttonRepository.findCommandById(
        button.commandId,
      );

      if (commandResult.isFailure) {
        console.warn(
          `Failed to load command for button ${button.id}: ${commandResult.error}`,
        );
        continue;
      }

      const command = commandResult.getValue();
      if (!command) {
        console.warn(`Command not found for button ${button.id}`);
        continue;
      }

      // Check if command can be executed in current context
      const canExecute = command.canExecute({
        currentClass: request.className,
        hasSelection: request.context?.hasSelection || false,
      });

      // Only include button if it can be executed
      if (canExecute) {
        buttonRenderData.push({
          buttonId: button.id.toString(),
          label: button.label,
          tooltip: button.tooltip,
          isEnabled: button.isEnabled,
          order: button.order,
          command: {
            id: command.id.toString(),
            type: command.type,
            requiresInput: command.requiresInput,
            parameters: command.parameters,
          },
        });
      }
    }

    // Sort buttons by order
    buttonRenderData.sort((a, b) => a.order - b.order);

    return Result.ok<RenderClassButtonsResponse>({
      buttons: buttonRenderData,
      displayOptions: {
        position: classView.displayOptions.buttonPosition,
        showButtons: true,
      },
    });
  }
}
