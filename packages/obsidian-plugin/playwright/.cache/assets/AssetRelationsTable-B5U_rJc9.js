import { j as jsxRuntimeExports } from './jsx-runtime-KAobzw4c.js';
import { r as reactExports, R as React } from './index-BIdHmUZ9.js';

"use strict";
const SingleTable = ({
  items,
  sortBy,
  sortOrder,
  showProperties,
  onAssetClick,
  getAssetLabel
}) => {
  const [sortState, setSortState] = reactExports.useState({
    column: sortBy,
    order: sortOrder
  });
  const handleSort = (column) => {
    setSortState((prev) => ({
      column,
      order: prev.column === column && prev.order === "asc" ? "desc" : "asc"
    }));
  };
  const getInstanceClass = (metadata) => {
    const instanceClassRaw = metadata?.exo__Instance_class || metadata?.["exo__Instance_class"] || "-";
    const instanceClass = Array.isArray(instanceClassRaw) ? instanceClassRaw[0] || "-" : instanceClassRaw || "-";
    if (instanceClass === "-") {
      return { target: "-" };
    }
    const content = String(instanceClass).replace(/^\[\[|\]\]$/g, "");
    const pipeIndex = content.indexOf("|");
    if (pipeIndex !== -1) {
      return {
        target: content.substring(0, pipeIndex).trim(),
        alias: content.substring(pipeIndex + 1).trim()
      };
    }
    return {
      target: content.trim()
    };
  };
  const getDisplayLabel = (relation) => {
    const label = relation.metadata?.exo__Asset_label;
    if (label && typeof label === "string" && label.trim() !== "") {
      return label;
    }
    return relation.title;
  };
  const isWikiLink = (value) => {
    return typeof value === "string" && /\[\[.*?\]\]/.test(value);
  };
  const parseWikiLink = (value) => {
    const content = value.replace(/^\[\[|\]\]$/g, "");
    const pipeIndex = content.indexOf("|");
    if (pipeIndex !== -1) {
      return {
        target: content.substring(0, pipeIndex).trim(),
        alias: content.substring(pipeIndex + 1).trim()
      };
    }
    return {
      target: content.trim()
    };
  };
  const renderPropertyValue = (value) => {
    if (value === null || value === void 0) {
      return "-";
    }
    if (typeof value === "string" && isWikiLink(value)) {
      const parsed = parseWikiLink(value);
      const label = getAssetLabel?.(parsed.target);
      const displayText = parsed.alias || label || parsed.target;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          "data-href": parsed.target,
          className: "internal-link",
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            onAssetClick?.(parsed.target, e);
          },
          style: { cursor: "pointer" },
          children: displayText
        }
      );
    }
    if (Array.isArray(value)) {
      return value.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(React.Fragment, { children: [
        renderPropertyValue(item),
        index < value.length - 1 ? ", " : ""
      ] }, index));
    }
    return String(value);
  };
  const sortedItems = reactExports.useMemo(() => {
    return [...items].sort((a, b) => {
      let aVal;
      let bVal;
      if (sortState.column === "title") {
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
      } else if (sortState.column === "exo__Instance_class") {
        const aClass = getInstanceClass(a.metadata);
        const bClass = getInstanceClass(b.metadata);
        aVal = (aClass.alias || aClass.target).toLowerCase();
        bVal = (bClass.alias || bClass.target).toLowerCase();
      } else {
        aVal = a[sortState.column];
        bVal = b[sortState.column];
      }
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortState.order === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortState.order === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [items, sortState]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "exocortex-relations-table", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("th", { onClick: () => handleSort("title"), className: "sortable", children: [
        "Name",
        " ",
        sortState.column === "title" && (sortState.order === "asc" ? "↑" : "↓")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "th",
        {
          onClick: () => handleSort("exo__Instance_class"),
          className: "sortable",
          children: [
            "exo__Instance_class",
            " ",
            sortState.column === "exo__Instance_class" && (sortState.order === "asc" ? "↑" : "↓")
          ]
        }
      ),
      showProperties.map((prop) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: prop }, prop))
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: sortedItems.map((relation, index) => {
      const instanceClass = getInstanceClass(relation.metadata);
      const uniqueKey = `${relation.path}-${relation.propertyName || "body"}-${index}`;
      const rowClassName = relation.isArchived ? "archived-asset" : "";
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { "data-path": relation.path, className: rowClassName, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "asset-name", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "a",
          {
            "data-href": relation.path,
            onClick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              onAssetClick?.(relation.path, e);
            },
            className: "internal-link",
            style: { cursor: "pointer" },
            children: getDisplayLabel(relation)
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "instance-class", children: instanceClass.target !== "-" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "a",
          {
            "data-href": instanceClass.target,
            onClick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              onAssetClick?.(instanceClass.target, e);
            },
            className: "internal-link",
            style: { cursor: "pointer" },
            children: instanceClass.alias || instanceClass.target
          }
        ) : "-" }),
        showProperties.map((prop) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: renderPropertyValue(relation.metadata[prop]) }, prop))
      ] }, uniqueKey);
    }) })
  ] });
};
const AssetRelationsTable = ({
  relations,
  groupByProperty = false,
  sortBy = "title",
  sortOrder = "asc",
  showProperties = [],
  groupSpecificProperties = {},
  onAssetClick,
  getAssetLabel
}) => {
  const groupedRelations = reactExports.useMemo(() => {
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
      {}
    );
    return grouped;
  }, [relations, groupByProperty]);
  if (groupByProperty) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "exocortex-relations-grouped", children: Object.entries(groupedRelations).map(([groupName, items]) => {
      const groupProps = groupSpecificProperties[groupName] || [];
      const mergedProperties = [...showProperties, ...groupProps];
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relation-group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "group-header", children: groupName }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SingleTable,
          {
            items,
            sortBy,
            sortOrder,
            showProperties: mergedProperties,
            onAssetClick,
            getAssetLabel
          }
        )
      ] }, groupName);
    }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "exocortex-relations", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    SingleTable,
    {
      items: groupedRelations.ungrouped,
      sortBy,
      sortOrder,
      showProperties,
      onAssetClick,
      getAssetLabel
    }
  ) });
};

export { AssetRelationsTable };
//# sourceMappingURL=AssetRelationsTable-B5U_rJc9.js.map
