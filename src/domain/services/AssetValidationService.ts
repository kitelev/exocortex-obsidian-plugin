import { Asset } from "../entities/Asset";
import {
  PropertyValue,
  PropertyValueType,
} from "../value-objects/PropertyValue";
import { ClassName } from "../value-objects/ClassName";
import { OntologyPrefix } from "../value-objects/OntologyPrefix";
import { Result } from "../core/Result";

/**
 * Validation rule interface
 */
export interface ValidationRule {
  readonly name: string;
  readonly description: string;
  validate(asset: Asset): ValidationResult;
}

/**
 * Validation result for individual rules
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
}

/**
 * Asset validation summary
 */
export interface AssetValidationSummary {
  readonly isValid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
  readonly appliedRules: string[];
}

/**
 * Property validation configuration
 */
export interface PropertyValidationConfig {
  readonly propertyName: string;
  readonly required: boolean;
  readonly type?: PropertyValueType;
  readonly pattern?: RegExp;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly allowedValues?: any[];
}

/**
 * Domain service for asset validation
 * Encapsulates complex validation business rules
 */
export class AssetValidationService {
  private readonly rules: ValidationRule[] = [];
  private readonly propertyConfigs: Map<string, PropertyValidationConfig> =
    new Map();

  constructor() {
    this.initializeDefaultRules();
    this.initializeDefaultPropertyConfigurations();
  }

  /**
   * Validate an asset against all configured rules
   */
  validateAsset(asset: Asset): AssetValidationSummary {
    const errors: string[] = [];
    const warnings: string[] = [];
    const appliedRules: string[] = [];

    // Run all validation rules
    for (const rule of this.rules) {
      try {
        const result = rule.validate(asset);
        appliedRules.push(rule.name);

        errors.push(...result.errors);
        warnings.push(...result.warnings);
      } catch (error) {
        errors.push(`Validation rule '${rule.name}' failed: ${error}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      appliedRules,
    };
  }

  /**
   * Validate asset properties against configuration
   */
  validateProperties(asset: Asset): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const properties = asset.getProperties();

    // Check required properties
    for (const [propertyName, config] of this.propertyConfigs) {
      if (config.required && !properties.has(propertyName)) {
        errors.push(`Required property '${propertyName}' is missing`);
        continue;
      }

      if (properties.has(propertyName)) {
        const value = properties.get(propertyName);
        const propertyValidation = this.validatePropertyValue(
          propertyName,
          value,
          config,
        );

        errors.push(...propertyValidation.errors);
        warnings.push(...propertyValidation.warnings);
      }
    }

    // Check for unknown properties (optional warning)
    for (const [propertyName] of properties) {
      if (
        !this.propertyConfigs.has(propertyName) &&
        !propertyName.startsWith("exo__")
      ) {
        warnings.push(
          `Unknown property '${propertyName}' - consider adding validation configuration`,
        );
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate individual property value
   */
  private validatePropertyValue(
    propertyName: string,
    value: any,
    config: PropertyValidationConfig,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Type validation
    if (config.type) {
      const propertyValueResult = PropertyValue.create(value);
      if (propertyValueResult.isSuccess) {
        const propertyValue = propertyValueResult.getValue()!;
        if (propertyValue.getType() !== config.type) {
          errors.push(
            `Property '${propertyName}' has type ${propertyValue.getType()}, expected ${config.type}`,
          );
        }
      } else {
        errors.push(
          `Property '${propertyName}' has invalid value: ${propertyValueResult.getError()}`,
        );
      }
    }

    // String-specific validations
    if (typeof value === "string") {
      if (config.minLength && value.length < config.minLength) {
        errors.push(
          `Property '${propertyName}' is too short (minimum ${config.minLength} characters)`,
        );
      }

      if (config.maxLength && value.length > config.maxLength) {
        errors.push(
          `Property '${propertyName}' is too long (maximum ${config.maxLength} characters)`,
        );
      }

      if (config.pattern && !config.pattern.test(value)) {
        errors.push(
          `Property '${propertyName}' does not match required pattern`,
        );
      }
    }

    // Allowed values validation
    if (config.allowedValues && !config.allowedValues.includes(value)) {
      errors.push(
        `Property '${propertyName}' has invalid value. Allowed: ${config.allowedValues.join(", ")}`,
      );
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Add custom validation rule
   */
  addValidationRule(rule: ValidationRule): void {
    // Remove existing rule with same name
    const existingIndex = this.rules.findIndex((r) => r.name === rule.name);
    if (existingIndex >= 0) {
      this.rules.splice(existingIndex, 1);
    }

    this.rules.push(rule);
  }

  /**
   * Add property validation configuration
   */
  addPropertyConfiguration(config: PropertyValidationConfig): void {
    this.propertyConfigs.set(config.propertyName, config);
  }

  /**
   * Initialize default validation rules
   */
  private initializeDefaultRules(): void {
    // Asset label validation rule
    this.addValidationRule({
      name: "AssetLabelValidation",
      description:
        "Validates asset label is not empty and meets format requirements",
      validate: (asset: Asset): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];

        const title = asset.getTitle();
        if (!title || title.trim().length === 0) {
          errors.push("Asset title cannot be empty");
        } else if (title.length > 200) {
          errors.push("Asset title cannot exceed 200 characters");
        } else if (title.length < 3) {
          warnings.push(
            "Asset title is very short - consider a more descriptive name",
          );
        }

        return { isValid: errors.length === 0, errors, warnings };
      },
    });

    // Class consistency validation rule
    this.addValidationRule({
      name: "ClassConsistencyValidation",
      description: "Validates asset class is consistent with its properties",
      validate: (asset: Asset): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];

        const className = asset.getClassName();
        const properties = asset.getProperties();

        // Check if class-specific properties are present
        if (className.toString() === "exo__Person") {
          if (!properties.has("firstName") && !properties.has("lastName")) {
            warnings.push(
              "Person assets typically have firstName or lastName properties",
            );
          }
        } else if (className.toString() === "exo__Organization") {
          if (!properties.has("organizationName")) {
            warnings.push(
              "Organization assets typically have organizationName property",
            );
          }
        }

        return { isValid: errors.length === 0, errors, warnings };
      },
    });

    // Ontology validation rule
    this.addValidationRule({
      name: "OntologyValidation",
      description: "Validates asset ontology is valid and accessible",
      validate: (asset: Asset): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];

        const ontology = asset.getOntologyPrefix();

        // Basic ontology validation
        if (!ontology || ontology.toString().length === 0) {
          errors.push("Asset must have a valid ontology");
        } else if (ontology.toString().length > 50) {
          errors.push("Ontology prefix cannot exceed 50 characters");
        }

        return { isValid: errors.length === 0, errors, warnings };
      },
    });

    // Property consistency validation rule
    this.addValidationRule({
      name: "PropertyConsistencyValidation",
      description: "Validates property values are consistent and well-formed",
      validate: (asset: Asset): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];

        const properties = asset.getProperties();

        // Check for empty property values
        for (const [key, propertyValue] of properties) {
          const value = propertyValue ? propertyValue.getValue() : undefined;
          if (value === null || value === undefined || value === "") {
            warnings.push(
              `Property '${key}' has empty value - consider removing or providing a value`,
            );
          }

          // Check for very long property values
          if (typeof value === "string" && value.length > 1000) {
            warnings.push(
              `Property '${key}' has very long value - consider using references or shorter content`,
            );
          }
        }

        return { isValid: errors.length === 0, errors, warnings };
      },
    });
  }

  /**
   * Initialize default property configurations
   */
  private initializeDefaultPropertyConfigurations(): void {
    // Common property configurations
    this.addPropertyConfiguration({
      propertyName: "status",
      required: false,
      type: PropertyValueType.STRING,
      allowedValues: ["active", "inactive", "draft", "published", "archived"],
    });

    this.addPropertyConfiguration({
      propertyName: "priority",
      required: false,
      type: PropertyValueType.STRING,
      allowedValues: ["high", "medium", "low", "critical"],
    });

    this.addPropertyConfiguration({
      propertyName: "description",
      required: false,
      type: PropertyValueType.STRING,
      maxLength: 2000,
    });

    this.addPropertyConfiguration({
      propertyName: "tags",
      required: false,
      type: PropertyValueType.ARRAY,
    });

    this.addPropertyConfiguration({
      propertyName: "url",
      required: false,
      type: PropertyValueType.IRI,
    });

    this.addPropertyConfiguration({
      propertyName: "email",
      required: false,
      type: PropertyValueType.STRING,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    });

    this.addPropertyConfiguration({
      propertyName: "phone",
      required: false,
      type: PropertyValueType.STRING,
      pattern: /^[+]?[1-9][\d]{0,15}$/,
    });
  }

  /**
   * Get all configured validation rules
   */
  getValidationRules(): ReadonlyArray<ValidationRule> {
    return [...this.rules];
  }

  /**
   * Get all property configurations
   */
  getPropertyConfigurations(): ReadonlyMap<string, PropertyValidationConfig> {
    return new Map(this.propertyConfigs);
  }

  /**
   * Create validation service with custom rules and configurations
   */
  static createWithConfiguration(
    rules: ValidationRule[],
    propertyConfigs: PropertyValidationConfig[],
  ): AssetValidationService {
    const service = new AssetValidationService();

    // Clear default rules if custom ones provided
    if (rules.length > 0) {
      (service as any).rules = [];
      rules.forEach((rule) => service.addValidationRule(rule));
    }

    // Add custom property configurations
    propertyConfigs.forEach((config) =>
      service.addPropertyConfiguration(config),
    );

    return service;
  }
}
