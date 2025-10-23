import React, { useState } from "react";

export interface AreaNode {
  path: string;
  title: string;
  label?: string;
  isArchived: boolean;
  depth: number;
  parentPath?: string;
  children: AreaNode[];
}

export interface AreaHierarchyTreeProps {
  tree: AreaNode;
  currentAreaPath: string;
  onAreaClick?: (path: string, event: React.MouseEvent) => void;
  getAssetLabel?: (path: string) => string | null;
}

interface AreaTreeNodeProps {
  node: AreaNode;
  currentAreaPath: string;
  depth: number;
  onAreaClick?: (path: string, event: React.MouseEvent) => void;
  getAssetLabel?: (path: string) => string | null;
}

const AreaTreeNode: React.FC<AreaTreeNodeProps> = ({
  node,
  currentAreaPath,
  depth,
  onAreaClick,
  getAssetLabel,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const customLabel = getAssetLabel?.(node.path);
  const displayLabel = customLabel ?? node.label ?? node.title;
  const isCurrent = node.path === currentAreaPath;
  const hasChildren = node.children.length > 0;

  const indent = "  ".repeat(depth);

  return (
    <>
      <tr key={node.path} data-area-path={node.path}>
        <td>
          {hasChildren && (
            <span
              className="area-tree-toggle"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              style={{
                cursor: "pointer",
                marginRight: "4px",
                userSelect: "none"
              }}
            >
              {isExpanded ? "▼" : "▶"}
            </span>
          )}
          <a
            data-href={node.path}
            className={`internal-link ${isCurrent ? "area-tree-current" : ""} ${node.isArchived ? "is-archived" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAreaClick?.(node.path, e);
            }}
            style={{ cursor: "pointer" }}
          >
            {indent}
            {displayLabel}
          </a>
        </td>
        <td>
          <a className="internal-link">ems__Area</a>
        </td>
      </tr>
      {isExpanded && hasChildren && node.children.map((child) => (
        <AreaTreeNode
          key={child.path}
          node={child}
          currentAreaPath={currentAreaPath}
          depth={depth + 1}
          onAreaClick={onAreaClick}
          getAssetLabel={getAssetLabel}
        />
      ))}
    </>
  );
};

export const AreaHierarchyTree: React.FC<AreaHierarchyTreeProps> = ({
  tree,
  currentAreaPath,
  onAreaClick,
  getAssetLabel,
}) => {
  if (!tree.children || tree.children.length === 0) {
    return null;
  }

  return (
    <div className="exocortex-area-tree">
      <h3>Area Hierarchy</h3>
      <table className="exocortex-relation-table">
        <thead>
          <tr>
            <th>Area</th>
            <th>Class</th>
          </tr>
        </thead>
        <tbody>
          {tree.children.map((child) => (
            <AreaTreeNode
              key={child.path}
              node={child}
              currentAreaPath={currentAreaPath}
              depth={0}
              onAreaClick={onAreaClick}
              getAssetLabel={getAssetLabel}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
