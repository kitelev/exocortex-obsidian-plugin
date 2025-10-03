import { j as jsxRuntimeExports } from './jsx-runtime-BX3UmbFx.js';
import { r as reactExports } from './index-DosZHr-4.js';

const STATUS_COLORS = {
  active: "status-active",
  completed: "status-completed",
  blocked: "status-blocked",
  pending: "status-pending"
};
const PRIORITY_COLORS = {
  high: "priority-high",
  medium: "priority-medium",
  low: "priority-low"
};
const ChildrenEffortsTable = ({
  children,
  showStatus = true,
  showPriority = true,
  showEffort = true,
  showProgress = true,
  onChildClick
}) => {
  const totals = reactExports.useMemo(() => {
    return children.reduce(
      (acc, child) => ({
        effort: acc.effort + (child.effort || 0),
        progress: acc.progress + (child.progress || 0)
      }),
      { effort: 0, progress: 0 }
    );
  }, [children]);
  const averageProgress = children.length > 0 ? totals.progress / children.length : 0;
  const renderStatusBadge = (status) => {
    if (!status) return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "status-badge", children: "-" });
    const colorClass = STATUS_COLORS[status.toLowerCase()] || "status-default";
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `status-badge ${colorClass}`, children: status });
  };
  const renderPriorityBadge = (priority) => {
    if (!priority) return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "priority-badge", children: "-" });
    const colorClass = PRIORITY_COLORS[priority.toLowerCase()] || "priority-default";
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `priority-badge ${colorClass}`, children: priority });
  };
  const renderProgressBar = (progress) => {
    if (progress === void 0) return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "-" });
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "progress-bar-container", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "progress-bar", style: { width: `${progress}%` }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "progress-text", children: [
      progress,
      "%"
    ] }) }) });
  };
  if (children.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "no-children", children: "No child efforts found" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "exocortex-children-efforts", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "children-efforts-table", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Title" }),
      showStatus && /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Status" }),
      showPriority && /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Priority" }),
      showEffort && /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Effort" }),
      showProgress && /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Progress" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: children.map((child) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { "data-path": child.path, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: "#",
          onClick: (e) => {
            e.preventDefault();
            onChildClick?.(child.path);
          },
          className: "internal-link",
          children: child.title
        }
      ) }),
      showStatus && /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: renderStatusBadge(child.status) }),
      showPriority && /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: renderPriorityBadge(child.priority) }),
      showEffort && /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: child.effort || "-" }),
      showProgress && /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: renderProgressBar(child.progress) })
    ] }, child.path)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("tfoot", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "totals-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
        "Totals (",
        children.length,
        " items)"
      ] }) }),
      showStatus && /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: "-" }),
      showPriority && /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: "-" }),
      showEffort && /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: totals.effort }) }),
      showProgress && /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
        averageProgress.toFixed(1),
        "%"
      ] }) })
    ] }) })
  ] }) });
};

export { ChildrenEffortsTable };
//# sourceMappingURL=ChildrenEffortsTable-BLBOihJk.js.map
