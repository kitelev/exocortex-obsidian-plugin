import React from "react";

export interface AssetPropertiesTableProps {
  metadata: Record<string, any>;
  onLinkClick?: (path: string, event: React.MouseEvent) => void;
}

export const AssetPropertiesTable: React.FC<AssetPropertiesTableProps> = ({
  metadata,
  onLinkClick,
}) => {
  const isWikiLink = (value: any): boolean => {
    return typeof value === "string" && /\[\[.*?\]\]/.test(value);
  };

  const extractLinkTarget = (value: string): string => {
    return value.replace(/^\[\[|\]\]$/g, "");
  };

  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return "-";
    }

    if (typeof value === "boolean") {
      return String(value);
    }

    if (typeof value === "number") {
      return String(value);
    }

    if (typeof value === "string") {
      if (isWikiLink(value)) {
        const target = extractLinkTarget(value);
        return (
          <a
            href="#"
            className="internal-link"
            onClick={(e) => {
              e.preventDefault();
              onLinkClick?.(target, e);
            }}
          >
            {target}
          </a>
        );
      }
      return value;
    }

    if (Array.isArray(value)) {
      return (
        <>
          {value.map((item, index) => (
            <React.Fragment key={index}>
              {renderValue(item)}
              {index < value.length - 1 ? ", " : ""}
            </React.Fragment>
          ))}
        </>
      );
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  };

  const entries = Object.entries(metadata || {});

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="exocortex-asset-properties">
      <h3>Properties</h3>
      <table className="exocortex-properties-table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key}>
              <td className="property-key">{key}</td>
              <td className="property-value">{renderValue(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
