import React, { useCallback } from "react";
import type { PropertySchemaDefinition } from "../../../../domain/property-editor/PropertySchemas";

export interface WikiLinkFieldProps {
  property: PropertySchemaDefinition;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const WikiLinkField: React.FC<WikiLinkFieldProps> = ({
  property,
  value,
  onChange,
  error,
}) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (newValue && !newValue.startsWith("[[")) {
        onChange(`[[${newValue}]]`);
      } else {
        onChange(newValue);
      }
    },
    [onChange],
  );

  const displayValue = value?.replace(/^\[\[|\]\]$/g, "").replace(/^"|"$/g, "");

  return (
    <div className="property-editor-field property-editor-wikilink-field">
      <label className="property-editor-label">
        {property.label}
        {property.required && <span className="required-indicator">*</span>}
      </label>
      {property.description && (
        <p className="property-editor-description">{property.description}</p>
      )}
      <div className="wikilink-input-wrapper">
        <span className="wikilink-prefix">[[</span>
        <input
          type="text"
          className={`property-editor-input wikilink-input ${error ? "has-error" : ""}`}
          value={displayValue || ""}
          onChange={handleChange}
          disabled={property.readOnly}
          placeholder={`Enter ${property.label.toLowerCase()}`}
        />
        <span className="wikilink-suffix">]]</span>
      </div>
      {property.filter && property.filter.length > 0 && (
        <span className="property-editor-hint">
          Accepts: {property.filter.join(", ")}
        </span>
      )}
      {error && <span className="property-editor-error">{error}</span>}
    </div>
  );
};
