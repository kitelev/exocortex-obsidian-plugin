import { App, Notice } from "obsidian";
import { CreateAssetUseCase } from "../../../application/use-cases/CreateAssetUseCase";
import { CircuitBreakerService } from "../../../infrastructure/resilience/CircuitBreakerService";
import { FormFieldValues } from "./FormUIManager";
import { Result } from "../../../domain/core/Result";

export interface AssetCreationRequest {
  title: string;
  className: string;
  ontologyPrefix?: string;
  properties: Map<string, any>;
}

export interface AssetCreationCallbacks {
  onSuccess: (assetPath: string) => void;
  onError: (error: string) => void;
  onValidationError: (errors: string[]) => void;
}

/**
 * Orchestrates the asset creation process
 * Extracted from CreateAssetModal to follow Single Responsibility Principle
 */
export class AssetCreationOrchestrator {
  constructor(
    private app: App,
    private createAssetUseCase: CreateAssetUseCase,
    private circuitBreaker: CircuitBreakerService,
  ) {}

  async createAsset(
    request: AssetCreationRequest,
    callbacks: AssetCreationCallbacks,
  ): Promise<void> {
    try {
      // Validate request
      const validationResult = this.validateRequest(request);
      if (!validationResult.isSuccess) {
        callbacks.onValidationError([validationResult.getError()]);
        return;
      }

      // Execute asset creation with circuit breaker protection
      const result = await this.circuitBreaker.execute("createAsset", async () => {
        return await this.createAssetUseCase.execute({
          title: request.title,
          className: request.className,
          ontologyPrefix: request.ontologyPrefix || "",
          properties: Object.fromEntries(request.properties),
        });
      });

      if (result && typeof result === 'object' && 'success' in result) {
        const typedResponse = result as { success: boolean; assetId?: string; message?: string };
        if (typedResponse.success) {
          new Notice(`Asset "${request.title}" created successfully!`);
          // Use the asset title as the path since we don't get a path back
          callbacks.onSuccess(`${request.title}.md`);
        } else {
          callbacks.onError(typedResponse.message || "Asset creation failed");
        }
      } else {
        callbacks.onError("Invalid response from asset creation service");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Asset creation failed:", error);
      callbacks.onError(`Asset creation failed: ${errorMessage}`);
    }
  }

  private validateRequest(
    request: AssetCreationRequest,
  ): Result<AssetCreationRequest> {
    const errors: string[] = [];

    if (!request.title?.trim()) {
      errors.push("Asset title is required");
    }

    if (!request.className?.trim()) {
      errors.push("Asset class is required");
    }

    // Validate title doesn't contain invalid characters
    if (request.title && /[<>:"/\\|?*]/.test(request.title)) {
      errors.push("Asset title contains invalid characters");
    }

    // Validate title length
    if (request.title && request.title.length > 255) {
      errors.push("Asset title is too long (max 255 characters)");
    }

    // Validate properties
    if (request.properties) {
      for (const [key, value] of request.properties) {
        if (typeof value === "string" && value.length > 10000) {
          errors.push(`Property "${key}" value is too long (max 10,000 characters)`);
        }
      }
    }

    if (errors.length > 0) {
      return Result.fail(errors.join(", "));
    }

    return Result.ok(request);
  }

  async checkAssetExists(title: string): Promise<boolean> {
    try {
      const fileName = `${title}.md`;
      const existingFile = this.app.vault.getAbstractFileByPath(fileName);
      return existingFile !== null;
    } catch {
      return false;
    }
  }

  async suggestAlternativeTitle(originalTitle: string): Promise<string> {
    let counter = 1;
    let suggestedTitle = `${originalTitle} ${counter}`;

    while (await this.checkAssetExists(suggestedTitle)) {
      counter++;
      suggestedTitle = `${originalTitle} ${counter}`;
    }

    return suggestedTitle;
  }

  formatPropertyValues(properties: Map<string, any>): Record<string, any> {
    const formatted: Record<string, any> = {};

    for (const [key, value] of properties) {
      if (value === null || value === undefined || value === "") {
        continue; // Skip empty values
      }

      // Format array values
      if (Array.isArray(value)) {
        formatted[key] = value.filter(item => item !== null && item !== undefined && item !== "");
        if (formatted[key].length === 0) {
          delete formatted[key];
        }
      } else {
        formatted[key] = value;
      }
    }

    return formatted;
  }

  createAssetCreationRequest(
    formValues: FormFieldValues,
    properties: Map<string, any>,
  ): AssetCreationRequest {
    return {
      title: formValues.assetTitle.trim(),
      className: formValues.assetClass,
      ontologyPrefix: formValues.assetOntology || undefined,
      properties: new Map(
        Array.from(properties.entries()).filter(
          ([_, value]) => value !== null && value !== undefined && value !== "",
        ),
      ),
    };
  }
}