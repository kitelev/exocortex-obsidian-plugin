import React from "react";
import type { PropertySchemaDefinition } from '@plugin/domain/property-editor/PropertySchemas';

export interface TimestampFieldProps {
  property: PropertySchemaDefinition;
  value: string;
}

export const TimestampField: React.FC<TimestampFieldProps> = ({
  property,
  value,
}) => {
  const formatTimestamp = (timestamp: string): string => {
    if (!timestamp) return "Not set";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="property-editor-field property-editor-timestamp-field">
      <label className="property-editor-label">
        {property.label}
        {property.required && <span className="required-indicator">*</span>}
      </label>
      {property.description && (
        <p className="property-editor-description">{property.description}</p>
      )}
      <div className="timestamp-display">{formatTimestamp(value)}</div>
    </div>
  );
};
