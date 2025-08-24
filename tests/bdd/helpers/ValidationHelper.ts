import { expect } from 'chai';

/**
 * Validation Helper for BDD Tests
 * 
 * Provides comprehensive validation utilities for BDD test assertions.
 * Follows ISO/IEC 25010 quality model for comprehensive validation.
 */
export class ValidationHelper {
  private validationErrors: ValidationError[] = [];
  
  /**
   * Validate that an object has expected properties
   */
  validateObjectStructure<T extends Record<string, any>>(
    obj: T,
    expectedStructure: ValidationSchema<T>,
    context: string = 'object'
  ): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Check required properties
    for (const [key, schema] of Object.entries(expectedStructure)) {
      if (schema.required && !(key in obj)) {
        errors.push({
          type: 'missing_property',
          message: `Required property '${key}' is missing from ${context}`,
          property: key,
          expected: 'defined',
          actual: 'undefined',
          context
        });
        continue;
      }
      
      if (key in obj) {
        const value = obj[key];
        const propertyErrors = this.validateProperty(key, value, schema, context);
        errors.push(...propertyErrors);
      }
    }
    
    // Check for unexpected properties if strict mode
    if (expectedStructure.__strict) {
      const allowedKeys = new Set(Object.keys(expectedStructure).filter(k => k !== '__strict'));
      const actualKeys = Object.keys(obj);
      
      actualKeys.forEach(key => {
        if (!allowedKeys.has(key)) {
          errors.push({
            type: 'unexpected_property',
            message: `Unexpected property '${key}' found in ${context}`,
            property: key,
            expected: 'not present',
            actual: 'present',
            context
          });
        }
      });
    }
    
    this.validationErrors.push(...errors);
    
    return {
      isValid: errors.length === 0,
      errors,
      context
    };
  }
  
  /**
   * Validate array contents
   */
  validateArray<T>(
    array: T[],
    elementValidator: (item: T, index: number) => ValidationResult,
    options: ArrayValidationOptions = {}
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const context = options.context || 'array';
    
    // Check array length constraints
    if (options.minLength !== undefined && array.length < options.minLength) {
      errors.push({
        type: 'array_too_short',
        message: `Array length ${array.length} is less than minimum ${options.minLength}`,
        property: 'length',
        expected: `>= ${options.minLength}`,
        actual: array.length.toString(),
        context
      });
    }
    
    if (options.maxLength !== undefined && array.length > options.maxLength) {
      errors.push({
        type: 'array_too_long',
        message: `Array length ${array.length} exceeds maximum ${options.maxLength}`,
        property: 'length',
        expected: `<= ${options.maxLength}`,
        actual: array.length.toString(),
        context
      });
    }
    
    // Validate each element
    array.forEach((item, index) => {
      const elementResult = elementValidator(item, index);
      if (!elementResult.isValid) {
        elementResult.errors.forEach(error => {
          errors.push({
            ...error,
            context: `${context}[${index}]`
          });
        });
      }
    });
    
    // Check uniqueness if required
    if (options.unique) {
      const duplicates = this.findDuplicates(array, options.uniqueKey);
      duplicates.forEach(duplicate => {
        errors.push({
          type: 'duplicate_element',
          message: `Duplicate element found: ${duplicate.value} at indices ${duplicate.indices.join(', ')}`,
          property: options.uniqueKey || 'value',
          expected: 'unique',
          actual: 'duplicate',
          context
        });
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      context
    };
  }
  
  /**
   * Validate performance metrics
   */
  validatePerformance(
    actualMetrics: PerformanceMetrics,
    expectedMetrics: PerformanceExpectations,
    context: string = 'performance'
  ): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Execution time validation
    if (expectedMetrics.maxExecutionTime !== undefined) {
      if (actualMetrics.executionTime > expectedMetrics.maxExecutionTime) {
        errors.push({
          type: 'performance_timeout',
          message: `Execution time ${actualMetrics.executionTime}ms exceeds maximum ${expectedMetrics.maxExecutionTime}ms`,
          property: 'executionTime',
          expected: `<= ${expectedMetrics.maxExecutionTime}ms`,
          actual: `${actualMetrics.executionTime}ms`,
          context
        });
      }
    }
    
    // Memory usage validation
    if (expectedMetrics.maxMemoryUsage !== undefined) {
      if (actualMetrics.memoryUsage > expectedMetrics.maxMemoryUsage) {
        errors.push({
          type: 'memory_overflow',
          message: `Memory usage ${actualMetrics.memoryUsage}MB exceeds maximum ${expectedMetrics.maxMemoryUsage}MB`,
          property: 'memoryUsage',
          expected: `<= ${expectedMetrics.maxMemoryUsage}MB`,
          actual: `${actualMetrics.memoryUsage}MB`,
          context
        });
      }
    }
    
    // Throughput validation
    if (expectedMetrics.minThroughput !== undefined) {
      if (actualMetrics.throughput < expectedMetrics.minThroughput) {
        errors.push({
          type: 'low_throughput',
          message: `Throughput ${actualMetrics.throughput} ops/sec is below minimum ${expectedMetrics.minThroughput}`,
          property: 'throughput',
          expected: `>= ${expectedMetrics.minThroughput} ops/sec`,
          actual: `${actualMetrics.throughput} ops/sec`,
          context
        });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      context
    };
  }
  
  /**
   * Validate semantic query results
   */
  validateQueryResults(
    actualResults: QueryResults,
    expectedResults: QueryExpectations,
    context: string = 'query'
  ): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Check result count
    if (expectedResults.expectedCount !== undefined) {
      if (actualResults.bindings.length !== expectedResults.expectedCount) {
        errors.push({
          type: 'wrong_result_count',
          message: `Query returned ${actualResults.bindings.length} results, expected ${expectedResults.expectedCount}`,
          property: 'resultCount',
          expected: expectedResults.expectedCount.toString(),
          actual: actualResults.bindings.length.toString(),
          context
        });
      }
    }
    
    // Check minimum result count
    if (expectedResults.minCount !== undefined) {
      if (actualResults.bindings.length < expectedResults.minCount) {
        errors.push({
          type: 'insufficient_results',
          message: `Query returned ${actualResults.bindings.length} results, minimum expected ${expectedResults.minCount}`,
          property: 'resultCount',
          expected: `>= ${expectedResults.minCount}`,
          actual: actualResults.bindings.length.toString(),
          context
        });
      }
    }
    
    // Check expected bindings
    if (expectedResults.expectedBindings) {
      expectedResults.expectedBindings.forEach((expectedBinding, index) => {
        const found = actualResults.bindings.some(actualBinding => {
          return Object.keys(expectedBinding).every(key => {
            return actualBinding[key] === expectedBinding[key];
          });
        });
        
        if (!found) {
          errors.push({
            type: 'missing_binding',
            message: `Expected binding not found: ${JSON.stringify(expectedBinding)}`,
            property: `binding[${index}]`,
            expected: JSON.stringify(expectedBinding),
            actual: 'not found',
            context
          });
        }
      });
    }
    
    // Check query execution time
    if (expectedResults.maxExecutionTime !== undefined) {
      if (actualResults.executionTime > expectedResults.maxExecutionTime) {
        errors.push({
          type: 'query_timeout',
          message: `Query execution time ${actualResults.executionTime}ms exceeds maximum ${expectedResults.maxExecutionTime}ms`,
          property: 'executionTime',
          expected: `<= ${expectedResults.maxExecutionTime}ms`,
          actual: `${actualResults.executionTime}ms`,
          context
        });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      context
    };
  }
  
  /**
   * Validate business rules
   */
  validateBusinessRules(
    data: any,
    rules: BusinessRule[],
    context: string = 'business_logic'
  ): ValidationResult {
    const errors: ValidationError[] = [];
    
    rules.forEach((rule, index) => {
      try {
        const result = rule.validator(data);
        if (!result.isValid) {
          errors.push({
            type: 'business_rule_violation',
            message: `Business rule '${rule.name}' violated: ${result.message}`,
            property: rule.property || 'unknown',
            expected: rule.description,
            actual: result.actualValue || 'rule violation',
            context: `${context}.rule[${index}]`
          });
        }
      } catch (error) {
        errors.push({
          type: 'business_rule_error',
          message: `Error validating business rule '${rule.name}': ${(error as Error).message}`,
          property: rule.property || 'unknown',
          expected: 'valid rule execution',
          actual: 'rule execution error',
          context: `${context}.rule[${index}]`
        });
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      context
    };
  }
  
  /**
   * Validate data integrity constraints
   */
  validateDataIntegrity(
    data: any,
    constraints: DataIntegrityConstraint[],
    context: string = 'data_integrity'
  ): ValidationResult {
    const errors: ValidationError[] = [];
    
    constraints.forEach((constraint, index) => {
      const result = this.validateConstraint(data, constraint);
      if (!result.isValid) {
        result.errors.forEach(error => {
          errors.push({
            ...error,
            context: `${context}.constraint[${index}]`
          });
        });
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      context
    };
  }
  
  /**
   * Assert validation result
   */
  assertValid(result: ValidationResult, message?: string): void {
    if (!result.isValid) {
      const errorMessages = result.errors.map(error => 
        `${error.context}: ${error.message}`
      ).join('\n');
      
      const fullMessage = message 
        ? `${message}\nValidation errors:\n${errorMessages}`
        : `Validation failed:\n${errorMessages}`;
      
      throw new Error(fullMessage);
    }
  }
  
  /**
   * Get all validation errors
   */
  getValidationErrors(): ValidationError[] {
    return [...this.validationErrors];
  }
  
  /**
   * Clear validation errors
   */
  clearValidationErrors(): void {
    this.validationErrors = [];
  }
  
  /**
   * Create a custom validator
   */
  createValidator<T>(
    name: string,
    validatorFunction: (value: T) => boolean | ValidationResult,
    errorMessage?: string
  ): (value: T) => ValidationResult {
    return (value: T): ValidationResult => {
      const result = validatorFunction(value);
      
      if (typeof result === 'boolean') {
        return {
          isValid: result,
          errors: result ? [] : [{
            type: 'custom_validation',
            message: errorMessage || `Custom validation '${name}' failed`,
            property: name,
            expected: 'valid',
            actual: 'invalid',
            context: name
          }],
          context: name
        };
      }
      
      return result;
    };
  }
  
  /**
   * Validate individual property
   */
  private validateProperty(
    key: string,
    value: any,
    schema: PropertySchema,
    context: string
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Type validation
    if (schema.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== schema.type) {
        errors.push({
          type: 'wrong_type',
          message: `Property '${key}' has wrong type`,
          property: key,
          expected: schema.type,
          actual: actualType,
          context
        });
        return errors; // Skip further validation if type is wrong
      }
    }
    
    // Value validation
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push({
        type: 'invalid_enum_value',
        message: `Property '${key}' has invalid value`,
        property: key,
        expected: `one of [${schema.enum.join(', ')}]`,
        actual: String(value),
        context
      });
    }
    
    // Pattern validation for strings
    if (schema.pattern && typeof value === 'string') {
      if (!schema.pattern.test(value)) {
        errors.push({
          type: 'pattern_mismatch',
          message: `Property '${key}' does not match required pattern`,
          property: key,
          expected: schema.pattern.source,
          actual: value,
          context
        });
      }
    }
    
    // Range validation for numbers
    if (typeof value === 'number' && schema.min !== undefined && value < schema.min) {
      errors.push({
        type: 'below_minimum',
        message: `Property '${key}' is below minimum value`,
        property: key,
        expected: `>= ${schema.min}`,
        actual: String(value),
        context
      });
    }
    
    if (typeof value === 'number' && schema.max !== undefined && value > schema.max) {
      errors.push({
        type: 'above_maximum',
        message: `Property '${key}' exceeds maximum value`,
        property: key,
        expected: `<= ${schema.max}`,
        actual: String(value),
        context
      });
    }
    
    // Custom validator
    if (schema.validator) {
      try {
        const result = schema.validator(value);
        if (!result) {
          errors.push({
            type: 'custom_validation_failed',
            message: `Property '${key}' failed custom validation`,
            property: key,
            expected: 'valid',
            actual: 'invalid',
            context
          });
        }
      } catch (error) {
        errors.push({
          type: 'validation_error',
          message: `Error validating property '${key}': ${(error as Error).message}`,
          property: key,
          expected: 'valid validation',
          actual: 'validation error',
          context
        });
      }
    }
    
    return errors;
  }
  
  /**
   * Find duplicates in array
   */
  private findDuplicates<T>(
    array: T[],
    keySelector?: string | ((item: T) => any)
  ): Array<{ value: any; indices: number[] }> {
    const valueMap = new Map<any, number[]>();
    
    array.forEach((item, index) => {
      const value = keySelector 
        ? (typeof keySelector === 'string' ? (item as any)[keySelector] : keySelector(item))
        : item;
      
      if (!valueMap.has(value)) {
        valueMap.set(value, []);
      }
      valueMap.get(value)!.push(index);
    });
    
    return Array.from(valueMap.entries())
      .filter(([_, indices]) => indices.length > 1)
      .map(([value, indices]) => ({ value, indices }));
  }
  
  /**
   * Validate a single constraint
   */
  private validateConstraint(
    data: any,
    constraint: DataIntegrityConstraint
  ): ValidationResult {
    const errors: ValidationError[] = [];
    
    try {
      const result = constraint.validator(data);
      if (!result) {
        errors.push({
          type: 'constraint_violation',
          message: constraint.message || `Data integrity constraint '${constraint.name}' violated`,
          property: constraint.property || 'unknown',
          expected: constraint.description,
          actual: 'constraint violation',
          context: constraint.name
        });
      }
    } catch (error) {
      errors.push({
        type: 'constraint_error',
        message: `Error validating constraint '${constraint.name}': ${(error as Error).message}`,
        property: constraint.property || 'unknown',
        expected: 'valid constraint execution',
        actual: 'constraint execution error',
        context: constraint.name
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      context: constraint.name
    };
  }
}

// Type definitions
export interface ValidationError {
  type: string;
  message: string;
  property: string;
  expected: string;
  actual: string;
  context: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  context: string;
}

export interface PropertySchema {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  enum?: any[];
  pattern?: RegExp;
  min?: number;
  max?: number;
  validator?: (value: any) => boolean;
}

export interface ValidationSchema<T> {
  [K in keyof T]?: PropertySchema;
} & {
  __strict?: boolean;
}

export interface ArrayValidationOptions {
  minLength?: number;
  maxLength?: number;
  unique?: boolean;
  uniqueKey?: string | ((item: any) => any);
  context?: string;
}

export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  throughput: number;
}

export interface PerformanceExpectations {
  maxExecutionTime?: number;
  maxMemoryUsage?: number;
  minThroughput?: number;
}

export interface QueryResults {
  bindings: Array<Record<string, any>>;
  executionTime: number;
}

export interface QueryExpectations {
  expectedCount?: number;
  minCount?: number;
  maxCount?: number;
  expectedBindings?: Array<Record<string, any>>;
  maxExecutionTime?: number;
}

export interface BusinessRule {
  name: string;
  description: string;
  property?: string;
  validator: (data: any) => { isValid: boolean; message?: string; actualValue?: string };
}

export interface DataIntegrityConstraint {
  name: string;
  description: string;
  property?: string;
  message?: string;
  validator: (data: any) => boolean;
}