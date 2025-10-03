import { j as jsxRuntimeExports } from './jsx-runtime-BX3UmbFx.js';
import { r as reactExports } from './index-DosZHr-4.js';

const AssetRelationsTable = ({
  relations,
  groupByProperty = false,
  sortBy = "title",
  sortOrder = "asc",
  showProperties = [],
  onAssetClick
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
  const sortedRelations = reactExports.useMemo(() => {
    const sorted = [...relations].sort((a, b) => {
      let aVal = a[sortState.column];
      let bVal = b[sortState.column];
      if (sortState.column === "title") {
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
      }
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortState.order === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortState.order === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
    return sorted;
  }, [relations, sortState]);
  const groupedRelations = reactExports.useMemo(() => {
    if (!groupByProperty) return { ungrouped: sortedRelations };
    return sortedRelations.reduce((acc, relation) => {
      const group = relation.propertyName || "Body Links";
      if (!acc[group]) acc[group] = [];
      acc[group].push(relation);
      return acc;
    }, {});
  }, [sortedRelations, groupByProperty]);
  const renderTable = (items) => /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "exocortex-relations-table", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("th", { onClick: () => handleSort("title"), className: "sortable", children: [
        "Title ",
        sortState.column === "title" && (sortState.order === "asc" ? "↑" : "↓")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("th", { onClick: () => handleSort("created"), className: "sortable", children: [
        "Created ",
        sortState.column === "created" && (sortState.order === "asc" ? "↑" : "↓")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("th", { onClick: () => handleSort("modified"), className: "sortable", children: [
        "Modified ",
        sortState.column === "modified" && (sortState.order === "asc" ? "↑" : "↓")
      ] }),
      showProperties.map((prop) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: prop }, prop))
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: items.map((relation) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { "data-path": relation.path, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: "#",
          onClick: (e) => {
            e.preventDefault();
            onAssetClick?.(relation.path);
          },
          className: "internal-link",
          children: relation.title
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: new Date(relation.created).toLocaleDateString() }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: new Date(relation.modified).toLocaleDateString() }),
      showProperties.map((prop) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: relation.metadata[prop] || "-" }, prop))
    ] }, relation.path)) })
  ] });
  if (groupByProperty) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "exocortex-relations-grouped", children: Object.entries(groupedRelations).map(([groupName, items]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relation-group", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "group-header", children: groupName }),
      renderTable(items)
    ] }, groupName)) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "exocortex-relations", children: renderTable(sortedRelations) });
};

export { AssetRelationsTable };
//# sourceMappingURL=AssetRelationsTable-I56SX5mf.js.map
