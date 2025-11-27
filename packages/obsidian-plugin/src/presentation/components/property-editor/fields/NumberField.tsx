import React, { useCallback } from "react";
import type { PropertySchemaDefinition } from "../../../../domain/property-editor/PropertySchemas";

export interface NumberFieldProps {
  property: PropertySchemaDefinition;
  value: number | string;
  onChange: (value: number) => void;
  error?: string;
}

export const NumberField: React.FC<NumberFieldProps> = ({
  property,
  value,
  onChange,
  error,
}) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = parseInt(e.target.value, 10);
      if (!isNaN(numValue)) {
        onChange(numValue);
      } else if (e.target.value === "") {
        onChange(0);
      }
    },
    [onChange],
  );

  const numericValue = typeof value === "number" ? value : parseInt(value, 10);

  return (
    <div className="property-editor-field property-editor-number-field">
      <label className="property-editor-label">
        {property.label}
        {property.required && <span className="required-indicator">*</span>}
      </label>
      {property.description && (
        <p className="property-editor-description">{property.description}</p>
      )}
      <input
        type="number"
        className={`property-editor-input ${error ? "has-error" : ""}`}
        value={isNaN(numericValue) ? "" : numericValue}
        onChange={handleChange}
        disabled={property.readOnly}
        min={property.min}
        max={property.max}
        placeholder={property.label}
      />
      {error && <span className="property-editor-error">{error}</span>}
    </div>
  );
};
