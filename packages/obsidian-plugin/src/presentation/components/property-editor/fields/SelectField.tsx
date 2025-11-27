import React, { useCallback } from "react";
import type { PropertySchemaDefinition } from "../../../../domain/property-editor/PropertySchemas";
import {
  EFFORT_STATUS_VALUES,
  TASK_SIZE_VALUES,
} from "../../../../domain/property-editor/PropertySchemas";

export interface SelectFieldProps {
  property: PropertySchemaDefinition;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  property,
  value,
  onChange,
  error,
}) => {
  const options =
    property.type === "status-select" ? EFFORT_STATUS_VALUES : TASK_SIZE_VALUES;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  const normalizedValue = value?.replace(/^"|"$/g, "") || "";

  return (
    <div className="property-editor-field property-editor-select-field">
      <label className="property-editor-label">
        {property.label}
        {property.required && <span className="required-indicator">*</span>}
      </label>
      {property.description && (
        <p className="property-editor-description">{property.description}</p>
      )}
      <select
        className={`property-editor-select dropdown ${error ? "has-error" : ""}`}
        value={normalizedValue}
        onChange={handleChange}
        disabled={property.readOnly}
      >
        {!property.required && <option value="">Not specified</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="property-editor-error">{error}</span>}
    </div>
  );
};
