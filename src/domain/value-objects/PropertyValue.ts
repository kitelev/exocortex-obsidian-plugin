import { Result } from "../core/Result";

/**
 * Enumeration of supported property value types
 */
export enum PropertyValueType {
  STRING = "string",
  NUMBER = "number",
  BOOLEAN = "boolean",
  DATE = "date",
  ARRAY = "array",
  OBJECT = "object",
  REFERENCE = "reference", // For WikiLinks like [[AssetName]]
  IRI = "iri", // For semantic web IRIs
}

/**
 * Value object representing a typed property value in the domain
 * Ensures type safety and validation for asset properties
 */
export class PropertyValue {
  private readonly _value: any;
  private readonly _type: PropertyValueType;
  private readonly _constraints: PropertyConstraints;

  private constructor(
    value: any,
    type: PropertyValueType,
    constraints: PropertyConstraints = {},
  ) {
    this._value = value;
    this._type = type;
    this._constraints = constraints;
  }

  /**
   * Create a PropertyValue with automatic type detection
   */
  static create(
    value: any,
    constraints: PropertyConstraints = {},
  ): Result<PropertyValue> {
    if (value === null || value === undefined) {
      return Result.fail<PropertyValue>(
        "Property value cannot be null or undefined",
      );
    }

    const type = PropertyValue.detectType(value);
    const validationResult = PropertyValue.validateValue(
      value,
      type,
      constraints,
    );

    if (!validationResult.isValid) {
      return Result.fail<PropertyValue>(validationResult.error);
    }

    return Result.ok<PropertyValue>(
      new PropertyValue(value, type, constraints),
    );
  }

  /**
   * Create a PropertyValue with explicit type
   */
  static createTyped(
    value: any,
    type: PropertyValueType,
    constraints: PropertyConstraints = {},
  ): Result<PropertyValue> {
    const validationResult = PropertyValue.validateValue(
      value,
      type,
      constraints,
    );

    if (!validationResult.isValid) {
      return Result.fail<PropertyValue>(validationResult.error);
    }

    const convertedValue = PropertyValue.convertValue(value, type);
    return Result.ok<PropertyValue>(
      new PropertyValue(convertedValue, type, constraints),
    );
  }

  /**
   * Detect type from JavaScript value
   */
  private static detectType(value: any): PropertyValueType {
    if (typeof value === "string") {
      // Check for WikiLink pattern [[...]]
      if (/^\[\[.*\]\]$/.test(value)) {
        return PropertyValueType.REFERENCE;
      }
      // Check for IRI pattern
      if (/^https?:\/\/|^[a-z][a-z0-9+.-]*:/i.test(value)) {
        return PropertyValueType.IRI;
      }
      // Check for ISO date pattern
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return PropertyValueType.DATE;
      }
      return PropertyValueType.STRING;
    }

    if (typeof value === "number") {
      return PropertyValueType.NUMBER;
    }

    if (typeof value === "boolean") {
      return PropertyValueType.BOOLEAN;
    }

    if (value instanceof Date) {
      return PropertyValueType.DATE;
    }

    if (Array.isArray(value)) {
      return PropertyValueType.ARRAY;
    }

    return PropertyValueType.OBJECT;
  }

  /**
   * Convert value to appropriate type
   */
  private static convertValue(value: any, type: PropertyValueType): any {
    switch (type) {
      case PropertyValueType.STRING:
        return String(value);
      case PropertyValueType.NUMBER:
        return Number(value);
      case PropertyValueType.BOOLEAN:
        return Boolean(value);
      case PropertyValueType.DATE:
        return value instanceof Date ? value : new Date(value);
      case PropertyValueType.ARRAY:
        return Array.isArray(value) ? [...value] : [value];
      case PropertyValueType.REFERENCE:
      case PropertyValueType.IRI:
        return String(value);
      default:
        return value;
    }
  }

  /**
   * Validate value against type and constraints
   */
  private static validateValue(
    value: any,
    type: PropertyValueType,
    constraints: PropertyConstraints,
  ): { isValid: boolean; error: string } {
    switch (type) {
      case PropertyValueType.STRING:
      case PropertyValueType.REFERENCE:
      case PropertyValueType.IRI:
        if (typeof value !== "string") {
          return {
            isValid: false,
            error: `Expected string, got ${typeof value}`,
          };
        }
        if (constraints.minLength && value.length < constraints.minLength) {
          return {
            isValid: false,
            error: `String too short, minimum ${constraints.minLength}`,
          };
        }
        if (constraints.maxLength && value.length > constraints.maxLength) {
          return {
            isValid: false,
            error: `String too long, maximum ${constraints.maxLength}`,
          };
        }
        if (constraints.pattern && !constraints.pattern.test(value)) {
          return {
            isValid: false,
            error: "String does not match required pattern",
          };
        }
        break;

      case PropertyValueType.NUMBER: {
        const num = Number(value);
        if (isNaN(num)) {
          return { isValid: false, error: "Invalid number" };
        }
        if (constraints.min !== undefined && num < constraints.min) {
          return {
            isValid: false,
            error: `Number too small, minimum ${constraints.min}`,
          };
        }
        if (constraints.max !== undefined && num > constraints.max) {
          return {
            isValid: false,
            error: `Number too large, maximum ${constraints.max}`,
          };
        }
        break;
      }

      case PropertyValueType.DATE: {
        const date = value instanceof Date ? value : new Date(value);
        if (isNaN(date.getTime())) {
          return { isValid: false, error: "Invalid date" };
        }
        break;
      }

      case PropertyValueType.ARRAY:
        if (!Array.isArray(value)) {
          return { isValid: false, error: "Expected array" };
        }
        if (constraints.minItems && value.length < constraints.minItems) {
          return {
            isValid: false,
            error: `Array too short, minimum ${constraints.minItems} items`,
          };
        }
        if (constraints.maxItems && value.length > constraints.maxItems) {
          return {
            isValid: false,
            error: `Array too long, maximum ${constraints.maxItems} items`,
          };
        }
        break;
    }

    return { isValid: true, error: "" };
  }

  /**
   * Get the raw value
   */
  getValue(): any {
    // Return deep copy for objects and arrays to maintain immutability
    if (this._type === PropertyValueType.ARRAY) {
      return [...this._value];
    }
    if (this._type === PropertyValueType.OBJECT) {
      return { ...this._value };
    }
    return this._value;
  }

  /**
   * Get the property type
   */
  getType(): PropertyValueType {
    return this._type;
  }

  /**
   * Get the constraints
   */
  getConstraints(): PropertyConstraints {
    return { ...this._constraints };
  }

  /**
   * Check if this is a semantic reference (WikiLink)
   */
  isReference(): boolean {
    return this._type === PropertyValueType.REFERENCE;
  }

  /**
   * Check if this is an IRI
   */
  isIRI(): boolean {
    return this._type === PropertyValueType.IRI;
  }

  /**
   * Extract reference target from WikiLink
   */
  getReferenceTarget(): string | null {
    if (!this.isReference()) {
      return null;
    }
    const match = this._value.match(/^\[\[(.*?)\]\]$/);
    return match ? match[1] : null;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    if (this._type === PropertyValueType.DATE && this._value instanceof Date) {
      return this._value.toISOString().replace(/\.\d{3}Z$/, "");
    }
    return String(this._value);
  }

  /**
   * Equality comparison
   */
  equals(other: PropertyValue): boolean {
    if (this._type !== other._type) {
      return false;
    }

    // For complex types, use JSON comparison
    if (
      this._type === PropertyValueType.ARRAY ||
      this._type === PropertyValueType.OBJECT
    ) {
      return JSON.stringify(this._value) === JSON.stringify(other._value);
    }

    return this._value === other._value;
  }

  /**
   * Create a new PropertyValue with updated constraints
   */
  withConstraints(constraints: PropertyConstraints): Result<PropertyValue> {
    return PropertyValue.createTyped(this._value, this._type, {
      ...this._constraints,
      ...constraints,
    });
  }
}

/**
 * Property validation constraints
 */
export interface PropertyConstraints {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  minItems?: number;
  maxItems?: number;
  required?: boolean;
}
