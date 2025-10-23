import React, { useState, useCallback, useMemo } from "react";

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

interface TreeNodeProps {
  node: AreaNode;
  currentAreaPath: string;
  onAreaClick?: (path: string, event: React.MouseEvent) => void;
  getAssetLabel?: (path: string) => string | null;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  currentAreaPath,
  onAreaClick,
  getAssetLabel,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onAreaClick?.(node.path, e);
    },
    [node.path, onAreaClick],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === "Enter") {
          onAreaClick?.(node.path, e as unknown as React.MouseEvent);
        } else {
          setIsExpanded((prev) => !prev);
        }
      } else if (e.key === "ArrowRight" && !isExpanded && node.children.length > 0) {
        e.preventDefault();
        setIsExpanded(true);
      } else if (e.key === "ArrowLeft" && isExpanded && node.children.length > 0) {
        e.preventDefault();
        setIsExpanded(false);
      }
    },
    [node.path, isExpanded, node.children.length, onAreaClick],
  );

  const customLabel = getAssetLabel?.(node.path);
  const displayLabel = customLabel || node.label || node.title;

  const isCurrent = node.path === currentAreaPath;
  const hasChildren = node.children.length > 0;

  const nodeClasses = [
    "area-tree-node",
    isCurrent && "current",
    node.isArchived && "archived",
  ]
    .filter(Boolean)
    .join(" ");

  const labelClasses = [
    "area-tree-label",
    isCurrent && "current",
    node.isArchived && "archived",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li className={nodeClasses} data-path={node.path}>
      <div className="area-tree-item">
        {hasChildren && (
          <button
            className="area-tree-toggle"
            onClick={handleToggle}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse" : "Expand"}
            tabIndex={0}
          >
            {isExpanded ? "▼" : "▶"}
          </button>
        )}
        {!hasChildren && <span className="area-tree-spacer" />}
        <a
          data-href={node.path}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className={labelClasses}
          tabIndex={0}
          role="link"
          aria-current={isCurrent ? "page" : undefined}
        >
          {displayLabel}
        </a>
      </div>
      {hasChildren && isExpanded && (
        <ul className="area-tree-children" role="group">
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              currentAreaPath={currentAreaPath}
              onAreaClick={onAreaClick}
              getAssetLabel={getAssetLabel}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export const AreaHierarchyTree: React.FC<AreaHierarchyTreeProps> = ({
  tree,
  currentAreaPath,
  onAreaClick,
  getAssetLabel,
}) => {
  return (
    <div className="area-hierarchy-tree">
      <ul className="area-tree-root" role="tree">
        <TreeNode
          node={tree}
          currentAreaPath={currentAreaPath}
          onAreaClick={onAreaClick}
          getAssetLabel={getAssetLabel}
        />
      </ul>
    </div>
  );
};
