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
  onAssetClick?: (path: string, event: React.MouseEvent) => void;
  getAssetLabel?: (path: string) => string | null;
}

interface SortState {
  column: string;
  order: "asc" | "desc";
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
    setSortState((prev) => ({
      column,
      order: prev.column === column && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getInstanceClass = (metadata: Record<string, any>): string => {
    const instanceClassRaw =
      metadata?.exo__Instance_class || metadata?.["exo__Instance_class"] || "-";

    const instanceClass = Array.isArray(instanceClassRaw)
      ? instanceClassRaw[0] || "-"
      : instanceClassRaw || "-";

    return String(instanceClass).replace(/^\[\[|\]\]$/g, "");
  };

  const getDisplayLabel = (relation: AssetRelation): string => {
    const label = relation.metadata?.exo__Asset_label;
    if (label && typeof label === "string" && label.trim() !== "") {
      return label;
    }
    return relation.title;
  };

  const isWikiLink = (value: any): boolean => {
    return typeof value === "string" && /\[\[.*?\]\]/.test(value);
  };

  const extractLinkTarget = (value: string): string => {
    return value.replace(/^\[\[|\]\]$/g, "");
  };

  const renderPropertyValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return "-";
    }

    if (typeof value === "string" && isWikiLink(value)) {
      const target = extractLinkTarget(value);
      const label = getAssetLabel?.(target);
      const displayText = label || target;

      return (
        <a
          data-href={target}
          className="internal-link"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAssetClick?.(target, e);
          }}
          style={{ cursor: 'pointer' }}
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
            <th key={prop}>{prop}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedItems.map((relation, index) => {
          const instanceClass = getInstanceClass(relation.metadata);
          // Use unique key: path + propertyName to handle multiple relations from same asset via different properties
          const uniqueKey = `${relation.path}-${relation.propertyName || 'body'}-${index}`;
          return (
            <tr key={uniqueKey} data-path={relation.path}>
              <td className="asset-name">
                <a
                  data-href={relation.path}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAssetClick?.(relation.path, e);
                  }}
                  className="internal-link"
                  style={{ cursor: 'pointer' }}
                >
                  {getDisplayLabel(relation)}
                </a>
              </td>
              <td className="instance-class">
                {instanceClass !== "-" ? (
                  <a
                    data-href={instanceClass}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onAssetClick?.(instanceClass, e);
                    }}
                    className="internal-link"
                    style={{ cursor: 'pointer' }}
                  >
                    {instanceClass}
                  </a>
                ) : (
                  "-"
                )}
              </td>
              {showProperties.map((prop) => (
                <td key={prop}>{renderPropertyValue(relation.metadata[prop])}</td>
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
        {Object.entries(groupedRelations).map(([groupName, items]) => (
          <div key={groupName} className="relation-group">
            <h3 className="group-header">{groupName}</h3>
            <SingleTable
              items={items}
              sortBy={sortBy}
              sortOrder={sortOrder}
              showProperties={showProperties}
              onAssetClick={onAssetClick}
              getAssetLabel={getAssetLabel}
            />
          </div>
        ))}
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
