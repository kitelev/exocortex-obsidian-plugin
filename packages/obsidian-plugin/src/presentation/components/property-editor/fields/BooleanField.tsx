import React, { useCallback } from "react";
import type { PropertySchemaDefinition } from "../../../../domain/property-editor/PropertySchemas";

export interface BooleanFieldProps {
  property: PropertySchemaDefinition;
  value: boolean | string;
  onChange: (value: boolean) => void;
  error?: string;
}

export const BooleanField: React.FC<BooleanFieldProps> = ({
  property,
  value,
  onChange,
  error,
}) => {
  const isChecked =
    value === true || value === "true" || value === "yes";

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.checked);
    },
    [onChange],
  );

  const checkboxId = `property-${property.name}`;

  return (
    <div className="property-editor-field property-editor-boolean-field">
      <div className="boolean-field-wrapper">
        <input
          type="checkbox"
          id={checkboxId}
          className={`property-editor-checkbox ${error ? "has-error" : ""}`}
          checked={isChecked}
          onChange={handleChange}
          disabled={property.readOnly}
        />
        <label htmlFor={checkboxId} className="property-editor-label">
          {property.label}
          {property.required && <span className="required-indicator">*</span>}
        </label>
      </div>
      {property.description && (
        <p className="property-editor-description">{property.description}</p>
      )}
      {error && <span className="property-editor-error">{error}</span>}
    </div>
  );
};
