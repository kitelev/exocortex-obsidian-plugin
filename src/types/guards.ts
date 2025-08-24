/**
 * Type guard functions for runtime type validation
 */

import { PropertyValue, PropertyType, FrontmatterData } from "./properties";
import { ObsidianFile, ObsidianMetadata } from "./obsidian";

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isStringArray(value: unknown): value is string[] {
  return isArray(value) && value.every((item) => isString(item));
}

export function isNumberArray(value: unknown): value is number[] {
  return isArray(value) && value.every((item) => isNumber(item));
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !isArray(value) &&
    !isDate(value)
  );
}

export function isPropertyValue(value: unknown): value is PropertyValue {
  return (
    value === null ||
    value === undefined ||
    isString(value) ||
    isNumber(value) ||
    isBoolean(value) ||
    isDate(value) ||
    isStringArray(value) ||
    isNumberArray(value) ||
    isObject(value)
  );
}

export function isPropertyType(value: string): value is PropertyType {
  const validTypes: PropertyType[] = [
    "string",
    "number",
    "boolean",
    "date",
    "array",
    "enum",
    "text",
    "object",
  ];
  return validTypes.includes(value as PropertyType);
}

export function isFrontmatterData(value: unknown): value is FrontmatterData {
  if (!isObject(value)) {
    return false;
  }

  return Object.values(value).every((v) => isPropertyValue(v));
}

export function isObsidianFile(value: unknown): value is ObsidianFile {
  if (!isObject(value)) {
    return false;
  }

  const file = value as Record<string, unknown>;
  return (
    isString(file.path) &&
    isString(file.name) &&
    isString(file.basename) &&
    isString(file.extension) &&
    isObject(file.stat)
  );
}

export function hasProperty<T extends string>(
  obj: unknown,
  key: T,
): obj is Record<T, unknown> {
  return isObject(obj) && key in obj;
}

export function assertIsString(
  value: unknown,
  name = "value",
): asserts value is string {
  if (!isString(value)) {
    throw new TypeError(`Expected ${name} to be a string, got ${typeof value}`);
  }
}

export function assertIsNumber(
  value: unknown,
  name = "value",
): asserts value is number {
  if (!isNumber(value)) {
    throw new TypeError(`Expected ${name} to be a number, got ${typeof value}`);
  }
}

export function assertIsObject(
  value: unknown,
  name = "value",
): asserts value is Record<string, unknown> {
  if (!isObject(value)) {
    throw new TypeError(
      `Expected ${name} to be an object, got ${typeof value}`,
    );
  }
}

export function validatePropertyValue(
  value: unknown,
  type: PropertyType,
): PropertyValue {
  switch (type) {
    case "string":
    case "text":
      if (value === null || value === undefined) return value;
      if (!isString(value))
        throw new TypeError(`Expected string, got ${typeof value}`);
      return value;

    case "number":
      if (value === null || value === undefined) return value;
      if (!isNumber(value))
        throw new TypeError(`Expected number, got ${typeof value}`);
      return value;

    case "boolean":
      if (value === null || value === undefined) return value;
      if (!isBoolean(value))
        throw new TypeError(`Expected boolean, got ${typeof value}`);
      return value;

    case "date":
      if (value === null || value === undefined) return value;
      if (isString(value)) {
        const date = new Date(value);
        if (isNaN(date.getTime()))
          throw new TypeError(`Invalid date string: ${value}`);
        return date;
      }
      if (!isDate(value))
        throw new TypeError(`Expected date, got ${typeof value}`);
      return value;

    case "array":
      if (value === null || value === undefined) return value;
      if (!isArray(value))
        throw new TypeError(`Expected array, got ${typeof value}`);
      return value as PropertyValue;

    case "object":
      if (value === null || value === undefined) return value;
      if (!isObject(value))
        throw new TypeError(`Expected object, got ${typeof value}`);
      return value;

    case "enum":
      if (value === null || value === undefined) return value;
      if (!isString(value))
        throw new TypeError(`Expected enum string, got ${typeof value}`);
      return value;

    default:
      throw new TypeError(`Unknown property type: ${type}`);
  }
}
