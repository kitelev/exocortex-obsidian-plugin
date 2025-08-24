/**
 * Domain-specific type definitions
 */

import { PropertyValue } from "./properties";

export interface AssetLike {
  id: string;
  title: string;
  className?: string;
  tags?: string[];
  properties?: Record<string, PropertyValue>;
  createdAt?: Date;
  updatedAt?: Date;
  getPropertyValue?(key: string): PropertyValue;
}

export interface SerializableExoFocus {
  name: string;
  description?: string;
  filters: Array<{
    type: string;
    operator: string;
    value: PropertyValue;
    property?: string;
  }>;
  priority: number;
  active: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface ComparisonOperator {
  type:
    | "includes"
    | "excludes"
    | "equals"
    | "contains"
    | "before"
    | "after"
    | "between";
}

export interface FilterValue {
  value: PropertyValue;
  compareTo: PropertyValue;
}
