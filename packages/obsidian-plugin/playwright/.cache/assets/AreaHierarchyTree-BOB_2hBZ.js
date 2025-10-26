import { j as jsxRuntimeExports } from './jsx-runtime-KAobzw4c.js';
import { r as reactExports } from './index-BIdHmUZ9.js';

"use strict";
const AreaTreeNode = ({
  node,
  currentAreaPath,
  depth,
  onAreaClick,
  getAssetLabel
}) => {
  const [isExpanded, setIsExpanded] = reactExports.useState(true);
  const customLabel = getAssetLabel?.(node.path);
  const displayLabel = customLabel ?? node.label ?? node.title;
  const isCurrent = node.path === currentAreaPath;
  const hasChildren = node.children.length > 0;
  const handleToggle = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onAreaClick?.(node.path, e);
  };
  const handleKeyDown = (e) => {
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
        onAreaClick?.(node.path, e);
        break;
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "tr",
      {
        "data-area-path": node.path,
        role: "treeitem",
        "aria-level": depth + 1,
        "aria-expanded": hasChildren ? isExpanded : void 0,
        "aria-selected": isCurrent,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: `area-tree-item ${isCurrent ? "is-current" : ""} ${node.isArchived ? "is-archived" : ""}`,
              "data-depth": depth,
              style: {
                paddingLeft: `${8 + depth * 20}px`
              },
              onKeyDown: handleKeyDown,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "area-tree-toggle-container", children: hasChildren ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    className: "area-tree-toggle",
                    onClick: handleToggle,
                    "aria-expanded": isExpanded,
                    "aria-label": `${isExpanded ? "Collapse" : "Expand"} ${displayLabel}`,
                    tabIndex: -1,
                    children: isExpanded ? "▼" : "▶"
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "area-tree-toggle-spacer", "aria-hidden": "true" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "a",
                  {
                    "data-href": node.path,
                    className: "area-tree-link internal-link",
                    onClick: handleClick,
                    tabIndex: 0,
                    "aria-current": isCurrent ? "page" : void 0,
                    children: displayLabel
                  }
                )
              ]
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { className: "internal-link", children: "ems__Area" }) })
        ]
      },
      node.path
    ),
    isExpanded && hasChildren && node.children.map((child) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      AreaTreeNode,
      {
        node: child,
        currentAreaPath,
        depth: depth + 1,
        onAreaClick,
        getAssetLabel
      },
      child.path
    ))
  ] });
};
const AreaHierarchyTree = ({
  tree,
  currentAreaPath,
  onAreaClick,
  getAssetLabel
}) => {
  if (!tree.children || tree.children.length === 0) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "exocortex-area-tree", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "Area Hierarchy" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "table",
      {
        className: "exocortex-relation-table",
        role: "tree",
        "aria-label": "Area hierarchy tree",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Area" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Class" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: tree.children.map((child) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            AreaTreeNode,
            {
              node: child,
              currentAreaPath,
              depth: 0,
              onAreaClick,
              getAssetLabel
            },
            child.path
          )) })
        ]
      }
    )
  ] });
};

export { AreaHierarchyTree };
//# sourceMappingURL=AreaHierarchyTree-BOB_2hBZ.js.map
