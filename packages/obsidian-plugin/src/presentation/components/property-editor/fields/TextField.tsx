import React, { useCallback } from "react";
import type { PropertySchemaDefinition } from "../../../../domain/property-editor/PropertySchemas";

export interface TextFieldProps {
  property: PropertySchemaDefinition;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  property,
  value,
  onChange,
  error,
}) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  return (
    <div className="property-editor-field property-editor-text-field">
      <label className="property-editor-label">
        {property.label}
        {property.required && <span className="required-indicator">*</span>}
      </label>
      {property.description && (
        <p className="property-editor-description">{property.description}</p>
      )}
      <input
        type="text"
        className={`property-editor-input ${error ? "has-error" : ""}`}
        value={value || ""}
        onChange={handleChange}
        disabled={property.readOnly}
        placeholder={property.label}
      />
      {error && <span className="property-editor-error">{error}</span>}
    </div>
  );
};
