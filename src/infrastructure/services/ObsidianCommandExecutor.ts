import { App, Notice, TFile } from "obsidian";
import {
  ICommandExecutor,
  CommandExecutionRequest,
  CommandExecutionResult,
  CommandType,
} from "../../application/services/ICommandExecutor";
import { Result } from "../../domain/core/Result";
import { IAssetRepository } from "../../domain/repositories/IAssetRepository";
import { Asset } from "../../domain/entities/Asset";
import { AssetId } from "../../domain/value-objects/AssetId";
import { ClassName } from "../../domain/value-objects/ClassName";
import { OntologyPrefix } from "../../domain/value-objects/OntologyPrefix";

/**
 * Simplified Obsidian implementation of command executor
 * Handles essential command execution in the Obsidian environment
 */
export class ObsidianCommandExecutor implements ICommandExecutor {
  private handlers: Map<
    CommandType,
    (request: CommandExecutionRequest) => Promise<Result<any>>
  > = new Map();

  constructor(
    private app: App,
    private assetRepository: IAssetRepository,
    private plugin: any = null,
  ) {
    this.initializeHandlers();
  }

  async execute(
    request: CommandExecutionRequest,
  ): Promise<Result<CommandExecutionResult>> {
    const startTime = Date.now();

    try {
      // Validate request
      const validationResult = this.validate(request);
      if (validationResult.isFailure) {
        return Result.fail(validationResult.getError());
      }

      // Find and execute handler
      const handler = this.handlers.get(request.commandType);
      if (!handler) {
        return Result.fail(`Unsupported command type: ${request.commandType}`);
      }

      const executionResult = await handler(request);
      const executionTime = Date.now() - startTime;

      if (executionResult.isSuccess) {
        return Result.ok<CommandExecutionResult>({
          commandId: request.commandId,
          status: "success",
          output: executionResult.getValue(),
          executionTime,
        });
      } else {
        return Result.ok<CommandExecutionResult>({
          commandId: request.commandId,
          status: "failure",
          error: executionResult.getError(),
          executionTime,
        });
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return Result.ok<CommandExecutionResult>({
        commandId: request.commandId,
        status: "failure",
        error: error.message,
        executionTime,
      });
    }
  }

  registerHandler(
    type: CommandType,
    handler: (request: CommandExecutionRequest) => Promise<Result<any>>,
  ): void {
    this.handlers.set(type, handler);
  }

  isSupported(type: CommandType): boolean {
    return this.handlers.has(type);
  }

  validate(request: CommandExecutionRequest): Result<void> {
    if (!request.commandId || !request.commandType) {
      return Result.fail("Command ID and type are required");
    }

    if (!request.timestamp) {
      return Result.fail("Command timestamp is required");
    }

    return Result.ok();
  }

  private initializeHandlers(): void {
    // Register CREATE_ASSET handler
    this.registerHandler(CommandType.CREATE_ASSET, async (request) => {
      try {
        const className = request.targetClass;
        if (!className) {
          return Result.fail("Target class is required for asset creation");
        }

        const classNameResult = ClassName.create(className);
        if (classNameResult.isFailure) {
          return Result.fail(classNameResult.getError());
        }

        // Create asset with proper interface
        const assetId = AssetId.generate();
        const ontology = OntologyPrefix.create("exo").getValue(); // Default ontology

        const assetResult = Asset.create({
          id: assetId,
          className: classNameResult.getValue(),
          ontology: ontology,
          label: request.parameters?.title || "New Asset",
          description: request.parameters?.description,
          properties: request.parameters || {},
        });

        if (assetResult.isFailure) {
          return Result.fail(assetResult.getError());
        }

        await this.assetRepository.save(assetResult.getValue());

        new Notice(`Asset created: ${assetId.toString()}`);
        return Result.ok({
          assetId: assetId.toString(),
          className: className,
        });
      } catch (error) {
        return Result.fail(`Failed to create asset: ${error.message}`);
      }
    });

    // Register OPEN_ASSET handler
    this.registerHandler(CommandType.OPEN_ASSET, async (request) => {
      try {
        const assetId = request.assetId;
        if (!assetId) {
          return Result.fail("Asset ID is required");
        }

        const file = this.app.vault.getAbstractFileByPath(assetId + ".md");
        if (file && file instanceof TFile) {
          await this.app.workspace.getLeaf().openFile(file);
          return Result.ok({ opened: assetId });
        } else {
          return Result.fail(`Asset not found: ${assetId}`);
        }
      } catch (error) {
        return Result.fail(`Failed to open asset: ${error.message}`);
      }
    });
  }
}
