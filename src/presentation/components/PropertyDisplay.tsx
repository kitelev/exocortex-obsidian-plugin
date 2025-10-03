import React from "react";

export interface PropertyDisplayProps {
  name: string;
  value: any;
  type?: "text" | "number" | "date" | "boolean" | "list" | "link";
  editable?: boolean;
  onEdit?: (name: string, newValue: any) => void;
}

export const PropertyDisplay: React.FC<PropertyDisplayProps> = ({
  name,
  value,
  type = "text",
  editable = false,
  onEdit,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value);

  const handleSave = () => {
    onEdit?.(name, editValue);
    setIsEditing(false);
  };

  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return "-";

    switch (type) {
      case "date":
        return new Date(val).toLocaleDateString();
      case "boolean":
        return val ? "Yes" : "No";
      case "list":
        return Array.isArray(val) ? val.join(", ") : String(val);
      case "link":
        return val;
      default:
        return String(val);
    }
  };

  if (isEditing && editable) {
    return (
      <div className="exocortex-property editing" data-property={name}>
        <span className="property-name">{name}:</span>
        <input
          type={type === "number" ? "number" : "text"}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="property-input"
          autoFocus
        />
        <button onClick={handleSave} className="property-save">
          Save
        </button>
        <button onClick={() => setIsEditing(false)} className="property-cancel">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="exocortex-property" data-property={name}>
      <span className="property-name">{name}:</span>
      <span className="property-value">{formatValue(value)}</span>
      {editable && (
        <button onClick={() => setIsEditing(true)} className="property-edit">
          Edit
        </button>
      )}
    </div>
  );
};
