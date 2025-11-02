import React, { useState, useMemo } from "react";

interface SortState {
  column: string;
  order: "asc" | "desc";
}

export interface AssetPropertiesTableProps {
  metadata: Record<string, any>;
  onLinkClick?: (path: string, event: React.MouseEvent) => void;
  getAssetLabel?: (path: string) => string | null;
}

export const AssetPropertiesTable: React.FC<AssetPropertiesTableProps> = ({
  metadata,
  onLinkClick,
  getAssetLabel,
}) => {
  const [sortState, setSortState] = useState<SortState>({
    column: "",
    order: "asc",
  });

  const handleSort = (column: string) => {
    setSortState((prev) => ({
      column,
      order: prev.column === column && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const isWikiLink = (value: any): boolean => {
    return typeof value === "string" && /\[\[.*?\]\]/.test(value);
  };

  interface WikiLink {
    target: string;
    alias?: string;
  }

  const parseWikiLink = (value: string): WikiLink => {
    // Remove [[ and ]]
    const content = value.replace(/^\[\[|\]\]$/g, "");

    // Check if there's an alias (format: target|alias)
    const pipeIndex = content.indexOf("|");

    if (pipeIndex !== -1) {
      return {
        target: content.substring(0, pipeIndex).trim(),
        alias: content.substring(pipeIndex + 1).trim(),
      };
    }

    return {
      target: content.trim(),
    };
  };

  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return "-";
    }

    if (typeof value === "boolean" || typeof value === "number") {
      return String(value);
    }

    if (typeof value === "string") {
      if (isWikiLink(value)) {
        const parsed = parseWikiLink(value);
        const label = getAssetLabel?.(parsed.target);
        const displayText = parsed.alias !== undefined ? parsed.alias : label || parsed.target;
        return (
          <a
            data-href={parsed.target}
            className="internal-link"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onLinkClick?.(parsed.target, e);
            }}
            style={{ cursor: "pointer" }}
          >
            {displayText}
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

  const metadataEntries = Object.entries(metadata || {});

  const getNormalizedValue = (value: any): string | number => {
    if (value === null || value === undefined) return "";
    if (typeof value === "number") return value;
    if (typeof value === "boolean") return value ? "true" : "false";

    if (typeof value === "string" && /\[\[.*?\]\]/.test(value)) {
      const content = value.replace(/^\[\[|\]\]$/g, "");
      const pipeIndex = content.indexOf("|");
      return (
        pipeIndex !== -1
          ? content.substring(pipeIndex + 1).trim()
          : content.trim()
      ).toLowerCase();
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? getNormalizedValue(value[0]) : "";
    }

    if (typeof value === "object") {
      return JSON.stringify(value).toLowerCase();
    }

    return String(value).toLowerCase();
  };

  const sortedEntries = useMemo(() => {
    if (!sortState.column) {
      return metadataEntries;
    }

    const sorted = [...metadataEntries];

    sorted.sort(([keyA, valueA], [keyB, valueB]) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortState.column === "property") {
        aValue = keyA.toLowerCase();
        bValue = keyB.toLowerCase();
      } else {
        aValue = getNormalizedValue(valueA);
        bValue = getNormalizedValue(valueB);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortState.order === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue);
      const bStr = String(bValue);

      if (aStr < bStr) {
        return sortState.order === "asc" ? -1 : 1;
      }
      if (aStr > bStr) {
        return sortState.order === "asc" ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [metadataEntries, sortState]);

  if (metadataEntries.length === 0) {
    return null;
  }

  return (
    <div className="exocortex-asset-properties">
      <h3>Properties</h3>
      <table className="exocortex-properties-table">
        <thead>
          <tr>
            <th
              onClick={() => handleSort("property")}
              className="sortable"
              style={{ cursor: "pointer" }}
            >
              Property{" "}
              {sortState.column === "property" &&
                (sortState.order === "asc" ? "↑" : "↓")}
            </th>
            <th
              onClick={() => handleSort("value")}
              className="sortable"
              style={{ cursor: "pointer" }}
            >
              Value{" "}
              {sortState.column === "value" &&
                (sortState.order === "asc" ? "↑" : "↓")}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedEntries.map(([key, value]) => (
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
