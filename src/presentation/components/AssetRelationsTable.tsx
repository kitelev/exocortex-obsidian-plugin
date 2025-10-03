import React, { useState, useMemo } from 'react';

export interface AssetRelation {
  path: string;
  title: string;
  propertyName?: string;
  isBodyLink: boolean;
  created: number;
  modified: number;
  metadata: Record<string, any>;
}

export interface AssetRelationsTableProps {
  relations: AssetRelation[];
  groupByProperty?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  showProperties?: string[];
  onAssetClick?: (path: string) => void;
}

interface SortState {
  column: string;
  order: 'asc' | 'desc';
}

export const AssetRelationsTable: React.FC<AssetRelationsTableProps> = ({
  relations,
  groupByProperty = false,
  sortBy = 'title',
  sortOrder = 'asc',
  showProperties = [],
  onAssetClick,
}) => {
  const [sortState, setSortState] = useState<SortState>({
    column: sortBy,
    order: sortOrder,
  });

  const handleSort = (column: string) => {
    setSortState(prev => ({
      column,
      order: prev.column === column && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedRelations = useMemo(() => {
    const sorted = [...relations].sort((a, b) => {
      let aVal: any = a[sortState.column as keyof AssetRelation];
      let bVal: any = b[sortState.column as keyof AssetRelation];

      if (sortState.column === 'title') {
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortState.order === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortState.order === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return sorted;
  }, [relations, sortState]);

  const groupedRelations = useMemo(() => {
    if (!groupByProperty) return { ungrouped: sortedRelations };

    return sortedRelations.reduce((acc, relation) => {
      const group = relation.propertyName || 'Body Links';
      if (!acc[group]) acc[group] = [];
      acc[group].push(relation);
      return acc;
    }, {} as Record<string, AssetRelation[]>);
  }, [sortedRelations, groupByProperty]);

  const renderTable = (items: AssetRelation[]) => (
    <table className="exocortex-relations-table">
      <thead>
        <tr>
          <th onClick={() => handleSort('title')} className="sortable">
            Title {sortState.column === 'title' && (sortState.order === 'asc' ? '↑' : '↓')}
          </th>
          <th onClick={() => handleSort('created')} className="sortable">
            Created {sortState.column === 'created' && (sortState.order === 'asc' ? '↑' : '↓')}
          </th>
          <th onClick={() => handleSort('modified')} className="sortable">
            Modified {sortState.column === 'modified' && (sortState.order === 'asc' ? '↑' : '↓')}
          </th>
          {showProperties.map(prop => (
            <th key={prop}>{prop}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map(relation => (
          <tr key={relation.path} data-path={relation.path}>
            <td>
              <a
                href="#"
                onClick={e => {
                  e.preventDefault();
                  onAssetClick?.(relation.path);
                }}
                className="internal-link"
              >
                {relation.title}
              </a>
            </td>
            <td>{new Date(relation.created).toLocaleDateString()}</td>
            <td>{new Date(relation.modified).toLocaleDateString()}</td>
            {showProperties.map(prop => (
              <td key={prop}>{relation.metadata[prop] || '-'}</td>
            ))}
          </tr>
        ))}
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

  return <div className="exocortex-relations">{renderTable(sortedRelations)}</div>;
};
