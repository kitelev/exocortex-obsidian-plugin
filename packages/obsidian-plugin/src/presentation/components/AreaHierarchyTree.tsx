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

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAreaClick?.(node.path, e);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowRight":
        if (hasChildren && !isExpanded) {
          setIsExpanded(true);
        }
        break;
      case "ArrowLeft":
        if (hasChildren && isExpanded) {
          setIsExpanded(false);
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        onAreaClick?.(node.path, e as any);
        break;
    }
  };

  return (
    <>
      <tr
        key={node.path}
        data-area-path={node.path}
        role="treeitem"
        aria-level={depth + 1}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-selected={isCurrent}
      >
        <td>
          <div
            className={`area-tree-item ${isCurrent ? "is-current" : ""} ${node.isArchived ? "is-archived" : ""}`}
            data-depth={depth}
            style={{
              paddingLeft: `${8 + depth * 20}px`
            }}
            onKeyDown={handleKeyDown}
          >
            <span className="area-tree-toggle-container">
              {hasChildren ? (
                <button
                  className="area-tree-toggle"
                  onClick={handleToggle}
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? "Collapse" : "Expand"} ${displayLabel}`}
                  tabIndex={-1}
                >
                  {isExpanded ? "▼" : "▶"}
                </button>
              ) : (
                <span className="area-tree-toggle-spacer" aria-hidden="true" />
              )}
            </span>
            <a
              data-href={node.path}
              className="area-tree-link internal-link"
              onClick={handleClick}
              tabIndex={0}
              aria-current={isCurrent ? "page" : undefined}
            >
              {displayLabel}
            </a>
          </div>
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
      <table
        className="exocortex-relation-table"
        role="tree"
        aria-label="Area hierarchy tree"
      >
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
