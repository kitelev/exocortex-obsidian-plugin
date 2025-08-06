import { UseCase } from '../core/UseCase';
import { Result } from '../../domain/core/Result';
import { IAssetRepository } from '../../domain/repositories/IAssetRepository';
import { AssetId } from '../../domain/value-objects/AssetId';
import { Asset } from '../../domain/entities/Asset';

/**
 * Use case for editing asset properties inline
 */
export interface UpdatePropertyRequest {
    assetId: string;
    propertyName: string;
    value: any;
    propertyDefinition: {
        propertyName: string;
        label: string;
        range: string;
        isRequired: boolean;
        isObjectProperty?: boolean;
        validation?: string;
    };
}

export interface UpdatePropertyResponse {
    success: boolean;
    updatedValue: any;
}

export class PropertyEditingUseCase implements UseCase<UpdatePropertyRequest, UpdatePropertyResponse> {
    constructor(
        private assetRepository: IAssetRepository,
        private plugin: any // Reference to main plugin for property discovery
    ) {}

    async execute(request: UpdatePropertyRequest): Promise<Result<UpdatePropertyResponse>> {
        // Validate request
        if (!request.assetId) {
            return Result.fail<UpdatePropertyResponse>('Asset ID is required');
        }

        if (!request.propertyName) {
            return Result.fail<UpdatePropertyResponse>('Property name is required');
        }

        // Validate property value
        const validationResult = this.validatePropertyValue(
            request.value,
            request.propertyDefinition
        );

        if (validationResult.isFailure) {
            return Result.fail<UpdatePropertyResponse>(validationResult.error);
        }

        // Load the asset - try multiple methods
        let asset: Asset | null = null;
        
        // First try as UUID
        const assetIdResult = AssetId.create(request.assetId);
        if (assetIdResult.isSuccess) {
            asset = await this.assetRepository.findById(assetIdResult.getValue());
        }
        
        // If not found by ID, try by filename
        if (!asset) {
            asset = await this.assetRepository.findByFilename(request.assetId);
        }
        
        if (!asset) {
            return Result.fail<UpdatePropertyResponse>(`Asset not found: ${request.assetId}`);
        }

        // Update the property
        asset.setProperty(request.propertyName, request.value);

        // Save the asset
        await this.assetRepository.save(asset);

        return Result.ok<UpdatePropertyResponse>({
            success: true,
            updatedValue: request.value
        });
    }

    /**
     * Validate property value based on its definition
     */
    private validatePropertyValue(
        value: any,
        definition: UpdatePropertyRequest['propertyDefinition']
    ): Result<void> {
        // Check required
        if (definition.isRequired && (value === null || value === undefined || value === '')) {
            return Result.fail<void>(`${definition.label} is required`);
        }

        // Skip further validation if value is empty and not required
        if (!definition.isRequired && (value === null || value === undefined || value === '')) {
            return Result.ok<void>();
        }

        // Validate based on range/type
        if (definition.range === 'number') {
            if (isNaN(Number(value))) {
                return Result.fail<void>(`${definition.label} must be a number`);
            }
        }

        if (definition.range === 'date') {
            if (isNaN(Date.parse(value))) {
                return Result.fail<void>(`${definition.label} must be a valid date`);
            }
        }

        if (definition.range === 'boolean') {
            if (typeof value !== 'boolean') {
                return Result.fail<void>(`${definition.label} must be true or false`);
            }
        }

        if (definition.range?.startsWith('enum:')) {
            const allowedValues = definition.range.substring(5).split(',').map(v => v.trim());
            if (!allowedValues.includes(value)) {
                return Result.fail<void>(`${definition.label} must be one of: ${allowedValues.join(', ')}`);
            }
        }

        // Custom validation regex
        if (definition.validation) {
            try {
                const regex = new RegExp(definition.validation);
                if (!regex.test(String(value))) {
                    return Result.fail<void>(`${definition.label} format is invalid`);
                }
            } catch (e) {
                // Invalid regex, skip validation
            }
        }

        return Result.ok<void>();
    }

    /**
     * Get properties for a class (delegating to plugin for now)
     */
    async getPropertiesForClass(className: string): Promise<Result<any[]>> {
        try {
            const properties = await this.plugin.findPropertiesForClass(className);
            return Result.ok(properties);
        } catch (error) {
            return Result.fail(`Failed to get properties: ${error.message}`);
        }
    }

    /**
     * Get assets for a class (for dropdowns)
     */
    async getAssetsForClass(className: string): Promise<Result<any[]>> {
        try {
            const assets = await this.plugin.findAssetsByClass(className, true);
            return Result.ok(assets);
        } catch (error) {
            return Result.fail(`Failed to get assets: ${error.message}`);
        }
    }
}