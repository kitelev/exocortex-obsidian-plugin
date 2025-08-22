/**
 * Common validation utilities to eliminate duplication
 * Implements DRY principle for input validation and data checking
 */
export class ValidationUtils {
  /**
   * Validate that a string is not empty or whitespace-only
   */
  static isNonEmptyString(value: any): value is string {
    return typeof value === "string" && value.trim().length > 0;
  }

  /**
   * Validate that an array is not empty
   */
  static isNonEmptyArray<T>(value: any): value is T[] {
    return Array.isArray(value) && value.length > 0;
  }

  /**
   * Validate that an object has required properties
   */
  static hasRequiredProperties(obj: any, requiredProps: string[]): boolean {
    if (!obj || typeof obj !== "object") return false;

    return requiredProps.every(
      (prop) =>
        obj.hasOwnProperty(prop) &&
        obj[prop] !== undefined &&
        obj[prop] !== null,
    );
  }

  /**
   * Validate filename format (no invalid characters)
   */
  static isValidFilename(filename: string): boolean {
    if (!this.isNonEmptyString(filename)) return false;

    // Check for invalid characters in filename
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    return !invalidChars.test(filename);
  }

  /**
   * Validate asset ID format (UUID v4 pattern)
   */
  static isValidAssetId(id: string): boolean {
    if (!this.isNonEmptyString(id)) return false;

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidPattern.test(id);
  }

  /**
   * Validate ontology prefix format
   */
  static isValidOntologyPrefix(prefix: string): boolean {
    if (!this.isNonEmptyString(prefix)) return false;

    // Basic validation: alphanumeric and underscores, no spaces
    const prefixPattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    return prefixPattern.test(prefix);
  }

  /**
   * Validate class name format
   */
  static isValidClassName(className: string): boolean {
    if (!this.isNonEmptyString(className)) return false;

    // Allow letters, numbers, underscores, and double underscores
    const classPattern = /^[a-zA-Z][a-zA-Z0-9_]*(__[a-zA-Z][a-zA-Z0-9_]*)?$/;
    return classPattern.test(className);
  }

  /**
   * Validate that a value is within expected range
   */
  static isInRange(value: number, min: number, max: number): boolean {
    return typeof value === "number" && value >= min && value <= max;
  }

  /**
   * Validate email format (basic)
   */
  static isValidEmail(email: string): boolean {
    if (!this.isNonEmptyString(email)) return false;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    if (!this.isNonEmptyString(url)) return false;

    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize string input (remove potentially harmful characters)
   */
  static sanitizeString(input: string): string {
    if (!this.isNonEmptyString(input)) return "";

    // Remove control characters and normalize whitespace
    return input
      .replace(/[\x00-\x1f\x7f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Validate JSON string
   */
  static isValidJson(jsonString: string): boolean {
    if (!this.isNonEmptyString(jsonString)) return false;

    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate that an object conforms to a schema (basic)
   */
  static conformsToSchema(
    obj: any,
    schema: {
      required?: string[];
      optional?: string[];
      types?: Record<string, string>;
    },
  ): boolean {
    if (!obj || typeof obj !== "object") return false;

    // Check required properties
    if (schema.required && !this.hasRequiredProperties(obj, schema.required)) {
      return false;
    }

    // Check property types if specified
    if (schema.types) {
      for (const [prop, expectedType] of Object.entries(schema.types)) {
        if (obj.hasOwnProperty(prop)) {
          const actualType = typeof obj[prop];
          if (actualType !== expectedType) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Create validation error with context
   */
  static createValidationError(
    field: string,
    value: any,
    rule: string,
    context?: string,
  ): Error {
    const message = context
      ? `Validation failed for ${field} in ${context}: ${rule}. Got: ${value}`
      : `Validation failed for ${field}: ${rule}. Got: ${value}`;

    const error = new Error(message);
    (error as any).field = field;
    (error as any).value = value;
    (error as any).rule = rule;
    (error as any).context = context;

    return error;
  }
}
