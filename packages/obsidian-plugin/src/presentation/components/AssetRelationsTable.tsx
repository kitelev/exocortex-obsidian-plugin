import React, { useState, useMemo } from "react";

export interface AssetRelation {
  path: string;
  title: string;
  propertyName?: string;
  isBodyLink: boolean;
  created: number;
  modified: number;
  isArchived?: boolean;
  isBlocked?: boolean;

  metadata: Record<string, any>;
}

export interface AssetRelationsTableProps {
  relations: AssetRelation[];
  groupByProperty?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  showProperties?: string[];
  groupSpecificProperties?: Record<string, string[]>;
  onAssetClick?: (path: string, event: React.MouseEvent) => void;
  getAssetLabel?: (path: string) => string | null;
}

interface SortState {
  column: string | null;
  order: "asc" | "desc" | null;
}

interface SingleTableProps {
  items: AssetRelation[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  showProperties: string[];
  onAssetClick?: (path: string, event: React.MouseEvent) => void;
  getAssetLabel?: (path: string) => string | null;
}

const SingleTable: React.FC<SingleTableProps> = ({
  items,
  sortBy,
  sortOrder,
  showProperties,
  onAssetClick,
  getAssetLabel,
}) => {
  const [sortState, setSortState] = useState<SortState>({
    column: sortBy,
    order: sortOrder,
  });

  const handleSort = (column: string) => {
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

  const getInstanceClass = (metadata: Record<string, any>): WikiLink => {
    const instanceClassRaw =
      metadata?.exo__Instance_class || metadata?.["exo__Instance_class"] || "-";

    const instanceClass = Array.isArray(instanceClassRaw)
      ? instanceClassRaw[0] || "-"
      : instanceClassRaw || "-";

    if (instanceClass === "-") {
      return { target: "-" };
    }

    const content = String(instanceClass).replace(/^\[\[|\]\]$/g, "");
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

  const getDisplayLabel = (relation: AssetRelation): string => {
    const blockerIcon = relation.isBlocked ? "🚩 " : "";
    const label = relation.metadata?.exo__Asset_label;
    if (label && typeof label === "string" && label.trim() !== "") {
      return blockerIcon + label;
    }
    return blockerIcon + relation.title;
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

  const renderPropertyValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return "-";
    }

    if (typeof value === "string" && isWikiLink(value)) {
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
            onAssetClick?.(parsed.target, e);
          }}
          style={{ cursor: "pointer" }}
        >
          {displayText}
        </a>
      );
    }

    if (Array.isArray(value)) {
      return value.map((item, index) => (
        <React.Fragment key={index}>
          {renderPropertyValue(item)}
          {index < value.length - 1 ? ", " : ""}
        </React.Fragment>
      ));
    }

    return String(value);
  };

  const sortedItems = useMemo(() => {
    // If no sorting is active, return items as-is
    if (!sortState.column || !sortState.order) {
      return items;
    }

    const sortColumn = sortState.column; // Store in a const for type narrowing

    return [...items].sort((a, b) => {
      let aVal: unknown;
      let bVal: unknown;

      if (sortColumn === "title") {
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
      } else if (sortColumn === "exo__Instance_class") {
        const aClass = getInstanceClass(a.metadata);
        const bClass = getInstanceClass(b.metadata);
        aVal = (aClass.alias || aClass.target).toLowerCase();
        bVal = (bClass.alias || bClass.target).toLowerCase();
      } else {
        // Handle dynamic property columns
        aVal = a.metadata?.[sortColumn];
        bVal = b.metadata?.[sortColumn];

        // Handle array values - use first element for sorting
        if (Array.isArray(aVal)) {
          aVal = aVal.length > 0 ? aVal[0] : null;
        }
        if (Array.isArray(bVal)) {
          bVal = bVal.length > 0 ? bVal[0] : null;
        }

        // Handle wiki-link values - extract target for sorting
        if (typeof aVal === "string" && /\[\[.*?\]\]/.test(aVal)) {
          const content = aVal.replace(/^\[\[|\]\]$/g, "");
          const pipeIndex = content.indexOf("|");
          aVal =
            pipeIndex !== -1
              ? content.substring(pipeIndex + 1).trim().toLowerCase()
              : content.trim().toLowerCase();
        } else if (typeof aVal === "string") {
          aVal = aVal.toLowerCase();
        }

        if (typeof bVal === "string" && /\[\[.*?\]\]/.test(bVal)) {
          const content = bVal.replace(/^\[\[|\]\]$/g, "");
          const pipeIndex = content.indexOf("|");
          bVal =
            pipeIndex !== -1
              ? content.substring(pipeIndex + 1).trim().toLowerCase()
              : content.trim().toLowerCase();
        } else if (typeof bVal === "string") {
          bVal = bVal.toLowerCase();
        }
      }

      // Handle null/undefined values (put them at the end)
      if (aVal === null || aVal === undefined) {
        return 1;
      }
      if (bVal === null || bVal === undefined) {
        return -1;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortState.order === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortState.order === "asc" ? aVal - bVal : bVal - aVal;
      }

      if (typeof aVal === "boolean" && typeof bVal === "boolean") {
        const aNum = aVal ? 1 : 0;
        const bNum = bVal ? 1 : 0;
        return sortState.order === "asc" ? aNum - bNum : bNum - aNum;
      }

      return 0;
    });
  }, [items, sortState]);

  return (
    <table className="exocortex-relations-table">
      <thead>
        <tr>
          <th onClick={() => handleSort("title")} className="sortable">
            Name{" "}
            {sortState.column === "title" &&
              (sortState.order === "asc" ? "↑" : "↓")}
          </th>
          <th
            onClick={() => handleSort("exo__Instance_class")}
            className="sortable"
          >
            exo__Instance_class{" "}
            {sortState.column === "exo__Instance_class" &&
              (sortState.order === "asc" ? "↑" : "↓")}
          </th>
          {showProperties.map((prop) => (
            <th key={prop} onClick={() => handleSort(prop)} className="sortable">
              {prop}{" "}
              {sortState.column === prop &&
                (sortState.order === "asc" ? "↑" : "↓")}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedItems.map((relation, index) => {
          const instanceClass = getInstanceClass(relation.metadata);
          // Use unique key: path + propertyName to handle multiple relations from same asset via different properties
          const uniqueKey = `${relation.path}-${relation.propertyName || "body"}-${index}`;
          const rowClassName = relation.isArchived ? "archived-asset" : "";
          return (
            <tr
              key={uniqueKey}
              data-path={relation.path}
              className={rowClassName}
            >
              <td className="asset-name">
                <a
                  data-href={relation.path}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAssetClick?.(relation.path, e);
                  }}
                  className="internal-link"
                  style={{ cursor: "pointer" }}
                >
                  {getDisplayLabel(relation)}
                </a>
              </td>
              <td className="instance-class">
                {instanceClass.target !== "-" ? (
                  <a
                    data-href={instanceClass.target}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onAssetClick?.(instanceClass.target, e);
                    }}
                    className="internal-link"
                    style={{ cursor: "pointer" }}
                  >
                    {instanceClass.alias || instanceClass.target}
                  </a>
                ) : (
                  "-"
                )}
              </td>
              {showProperties.map((prop) => (
                <td key={prop}>
                  {renderPropertyValue(relation.metadata[prop])}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export const AssetRelationsTable: React.FC<AssetRelationsTableProps> = ({
  relations,
  groupByProperty = false,
  sortBy = "title",
  sortOrder = "asc",
  showProperties = [],
  groupSpecificProperties = {},
  onAssetClick,
  getAssetLabel,
}) => {
  const groupedRelations = useMemo(() => {
    if (!groupByProperty) {
      return { ungrouped: relations };
    }

    const grouped = relations.reduce(
      (acc, relation) => {
        const group = relation.propertyName || "Body Links";
        if (!acc[group]) acc[group] = [];
        acc[group].push(relation);
        return acc;
      },
      {} as Record<string, AssetRelation[]>,
    );

    return grouped;
  }, [relations, groupByProperty]);

  if (groupByProperty) {
    return (
      <div className="exocortex-relations-grouped">
        {Object.entries(groupedRelations).map(([groupName, items]) => {
          const groupProps = groupSpecificProperties[groupName] || [];
          const mergedProperties = [...showProperties, ...groupProps];

          return (
            <div key={groupName} className="relation-group">
              <h3 className="group-header">{groupName}</h3>
              <SingleTable
                items={items}
                sortBy={sortBy}
                sortOrder={sortOrder}
                showProperties={mergedProperties}
                onAssetClick={onAssetClick}
                getAssetLabel={getAssetLabel}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="exocortex-relations">
      <SingleTable
        items={groupedRelations.ungrouped}
        sortBy={sortBy}
        sortOrder={sortOrder}
        showProperties={showProperties}
        onAssetClick={onAssetClick}
        getAssetLabel={getAssetLabel}
      />
    </div>
  );
};
