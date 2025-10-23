import React, { useMemo } from "react";

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

interface FlatArea {
  node: AreaNode;
  depth: number;
}

function flattenTree(node: AreaNode, depth = 0): FlatArea[] {
  const result: FlatArea[] = [{ node, depth }];

  node.children.forEach((child) => {
    result.push(...flattenTree(child, depth + 1));
  });

  return result;
}

export const AreaHierarchyTree: React.FC<AreaHierarchyTreeProps> = ({
  tree,
  currentAreaPath,
  onAreaClick,
  getAssetLabel,
}) => {
  const flatAreas = useMemo(() => {
    return flattenTree(tree);
  }, [tree]);

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
          {flatAreas.map((item) => {
            const customLabel = getAssetLabel?.(item.node.path);
            const displayLabel = customLabel ?? item.node.label ?? item.node.title;
            const isCurrent = item.node.path === currentAreaPath;

            const indent = "  ".repeat(item.depth);

            return (
              <tr key={item.node.path}>
                <td>
                  <a
                    data-href={item.node.path}
                    className={`internal-link ${isCurrent ? "area-tree-current" : ""} ${item.node.isArchived ? "is-archived" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onAreaClick?.(item.node.path, e);
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
