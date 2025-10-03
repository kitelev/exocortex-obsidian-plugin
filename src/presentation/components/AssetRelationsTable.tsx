import React, { useState, useMemo } from "react";

export interface AssetRelation {
  path: string;
  title: string;
  propertyName?: string;
  isBodyLink: boolean;
  created: number;
  modified: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
}

export interface AssetRelationsTableProps {
  relations: AssetRelation[];
  groupByProperty?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  showProperties?: string[];
  onAssetClick?: (path: string) => void;
}

interface SortState {
  column: string;
  order: "asc" | "desc";
}

export const AssetRelationsTable: React.FC<AssetRelationsTableProps> = ({
  relations,
  groupByProperty = false,
  sortBy = "title",
  sortOrder = "asc",
  showProperties = [],
  onAssetClick,
}) => {
  const [sortState, setSortState] = useState<SortState>({
    column: sortBy,
    order: sortOrder,
  });

  const handleSort = (column: string) => {
    setSortState((prev) => ({
      column,
      order: prev.column === column && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getInstanceClass = (metadata: Record<string, any>): string => {
    const instanceClassRaw =
      metadata?.exo__Instance_class || metadata?.["exo__Instance_class"] || "-";

    // Handle arrays and convert to string safely
    const instanceClass = Array.isArray(instanceClassRaw)
      ? instanceClassRaw[0] || "-"
      : instanceClassRaw || "-";

    // Remove [[ and ]] from wikilink syntax
    return String(instanceClass).replace(/^\[\[|\]\]$/g, "");
  };

  const sortRelations = (items: AssetRelation[]) => {
    return [...items].sort((a, b) => {
      let aVal: unknown;
      let bVal: unknown;

      if (sortState.column === "title") {
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
      } else if (sortState.column === "exo__Instance_class") {
        aVal = getInstanceClass(a.metadata).toLowerCase();
        bVal = getInstanceClass(b.metadata).toLowerCase();
      } else {
        aVal = a[sortState.column as keyof AssetRelation];
        bVal = b[sortState.column as keyof AssetRelation];
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortState.order === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortState.order === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  };

  const groupedRelations = useMemo(() => {
    if (!groupByProperty) {
      return { ungrouped: sortRelations(relations) };
    }

    // First, group relations by property
    const grouped = relations.reduce(
      (acc, relation) => {
        const group = relation.propertyName || "Body Links";
        if (!acc[group]) acc[group] = [];
        acc[group].push(relation);
        return acc;
      },
      {} as Record<string, AssetRelation[]>,
    );

    // Then, sort items within each group
    const sortedGrouped: Record<string, AssetRelation[]> = {};
    for (const [groupName, items] of Object.entries(grouped)) {
      sortedGrouped[groupName] = sortRelations(items);
    }

    return sortedGrouped;
  }, [relations, sortState, groupByProperty]);

  const renderTable = (items: AssetRelation[]) => (
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
            <th key={prop}>{prop}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((relation) => {
          const instanceClass = getInstanceClass(relation.metadata);
          return (
            <tr key={relation.path} data-path={relation.path}>
              <td className="asset-name">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onAssetClick?.(relation.path);
                  }}
                  className="internal-link"
                >
                  {relation.title}
                </a>
              </td>
              <td className="instance-class">
                {instanceClass !== "-" ? (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onAssetClick?.(instanceClass);
                    }}
                    className="internal-link"
                  >
                    {instanceClass}
                  </a>
                ) : (
                  "-"
                )}
              </td>
              {showProperties.map((prop) => (
                <td key={prop}>{String(relation.metadata[prop] || "-")}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  if (groupByProperty) {
    return (
      <div className="exocortex-relations-grouped">
        {Object.entries(groupedRelations).map(([groupName, items]) => (
          <div key={groupName} className="relation-group">
            <h3 className="group-header">{groupName}</h3>
            {renderTable(items)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="exocortex-relations">{renderTable(groupedRelations.ungrouped)}</div>
  );
};
