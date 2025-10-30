import React, { useState, useMemo } from "react";

export interface AssetPropertiesTableProps {
  metadata: Record<string, any>;
  onLinkClick?: (path: string, event: React.MouseEvent) => void;
  getAssetLabel?: (path: string) => string | null;
}

interface SortState {
  column: "property" | "value" | null;
  order: "asc" | "desc" | null;
}

export const AssetPropertiesTable: React.FC<AssetPropertiesTableProps> = ({
  metadata,
  onLinkClick,
  getAssetLabel,
}) => {
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    order: null,
  });

  const handleSort = (column: "property" | "value") => {
    setSortState((prev) => {
      if (prev.column !== column) {
        // First click on a new column: ascending
        return { column, order: "asc" };
      }
      if (prev.order === "asc") {
        // Second click: descending
        return { column, order: "desc" };
      }
      if (prev.order === "desc") {
        // Third click: reset sorting
        return { column: null, order: null };
      }
      // Default to ascending
      return { column, order: "asc" };
    });
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
        const displayText = parsed.alias || label || parsed.target;
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

  const sortedEntries = useMemo(() => {
    if (!sortState.column || !sortState.order) {
      return metadataEntries;
    }

    return [...metadataEntries].sort(([keyA, valueA], [keyB, valueB]) => {
      let aVal: string;
      let bVal: string;

      if (sortState.column === "property") {
        aVal = keyA.toLowerCase();
        bVal = keyB.toLowerCase();
      } else {
        // Sort by value
        // Convert value to string for comparison
        const getStringValue = (val: any): string => {
          if (val === null || val === undefined) return "";
          if (typeof val === "string") {
            // Extract text from wiki-links for sorting
            if (/\[\[.*?\]\]/.test(val)) {
              const content = val.replace(/^\[\[|\]\]$/g, "");
              const pipeIndex = content.indexOf("|");
              return pipeIndex !== -1
                ? content.substring(pipeIndex + 1).trim()
                : content.trim();
            }
            return val;
          }
          if (Array.isArray(val)) {
            return val.length > 0 ? getStringValue(val[0]) : "";
          }
          if (typeof val === "object") {
            return JSON.stringify(val);
          }
          return String(val);
        };

        aVal = getStringValue(valueA).toLowerCase();
        bVal = getStringValue(valueB).toLowerCase();
      }

      return sortState.order === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });
  }, [metadataEntries, sortState]);

  if (sortedEntries.length === 0) {
    return null;
  }

  return (
    <div className="exocortex-asset-properties">
      <h3>Properties</h3>
      <table className="exocortex-properties-table">
        <thead>
          <tr>
            <th onClick={() => handleSort("property")} className="sortable">
              Property{" "}
              {sortState.column === "property" &&
                (sortState.order === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => handleSort("value")} className="sortable">
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
