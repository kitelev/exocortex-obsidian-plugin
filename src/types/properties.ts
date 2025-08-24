/**
 * TypeScript type definitions for property and configuration systems
 */

export type PropertyType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'enum' | 'text' | 'object';

export interface PropertyDefinition {
  name: string;
  type: PropertyType;
  required?: boolean;
  defaultValue?: PropertyValue;
  enumValues?: string[];
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export type PropertyValue = 
  | string 
  | number 
  | boolean 
  | Date 
  | string[] 
  | number[]
  | Record<string, unknown>
  | null 
  | undefined;

export interface PropertyFieldConfig {
  type: PropertyType;
  required?: boolean;
  defaultValue?: PropertyValue;
  enumValues?: string[];
  placeholder?: string;
  label?: string;
}

export interface FrontmatterData {
  [key: string]: PropertyValue;
}

export interface ConfigData {
  [key: string]: unknown;
}

export interface RendererConfig {
  blockType: string;
  templatePath?: string;
  customOptions?: Record<string, unknown>;
}

export interface QueryResult {
  success: boolean;
  data?: unknown[];
  error?: string;
  metadata?: {
    totalCount: number;
    executionTime: number;
  };
}

export interface FormSubmissionData {
  [fieldName: string]: PropertyValue;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}