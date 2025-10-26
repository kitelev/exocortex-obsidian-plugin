import { j as jsxRuntimeExports } from './jsx-runtime-KAobzw4c.js';
import './index-BIdHmUZ9.js';

"use strict";
const DailyTasksTable = ({
  tasks,
  onTaskClick,
  getAssetLabel,
  getEffortArea,
  showEffortArea = false,
  showEffortVotes = false
}) => {
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
  const getDisplayName = (task) => {
    const blockerIcon = task.isBlocked ? "🚩 " : "";
    const icon = task.isDone && task.isMeeting ? "✅ 👥 " : task.isDone ? "✅ " : task.isTrashed ? "❌ " : task.isDoing ? "🔄 " : task.isMeeting ? "👥 " : "";
    let displayText = task.label || task.title;
    if (typeof getAssetLabel === "function") {
      const customLabel = getAssetLabel(task.path);
      if (customLabel !== null && customLabel !== void 0 && customLabel !== "") {
        displayText = customLabel;
      }
    }
    return blockerIcon + icon + displayText;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "exocortex-daily-tasks", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "exocortex-tasks-table", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Name" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Start" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "End" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Status" }),
      showEffortArea && /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Effort Area" }),
      showEffortVotes && /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Votes" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: tasks.map((task, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { "data-path": task.path, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "task-name", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          "data-href": task.path,
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            onTaskClick?.(task.path, e);
          },
          className: "internal-link",
          style: { cursor: "pointer" },
          children: getDisplayName(task)
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "task-start", children: task.startTime || "-" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "task-end", children: task.endTime || "-" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "task-status", children: task.status ? (() => {
        const isWikiLink = typeof task.status === "string" && /\[\[.*?\]\]/.test(task.status);
        const parsed = isWikiLink ? parseWikiLink(task.status) : { target: task.status };
        const displayText = parsed.alias || parsed.target;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "a",
          {
            "data-href": parsed.target,
            onClick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              onTaskClick?.(parsed.target, e);
            },
            className: "internal-link",
            style: { cursor: "pointer" },
            children: displayText
          }
        );
      })() : "-" }),
      showEffortArea && /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "task-effort-area", children: (() => {
        const effortArea = getEffortArea?.(task.metadata) || task.metadata.ems__Effort_area;
        if (!effortArea) return "-";
        let parsed;
        const effortAreaStr = String(effortArea);
        if (/\[\[.*?\]\]/.test(effortAreaStr)) {
          parsed = parseWikiLink(effortAreaStr);
        } else if (effortAreaStr.includes("|")) {
          const parts = effortAreaStr.split("|");
          parsed = {
            target: parts[0].trim(),
            alias: parts[1]?.trim()
          };
        } else {
          parsed = { target: effortAreaStr.trim() };
        }
        const displayText = parsed.alias || parsed.target;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "a",
          {
            "data-href": parsed.target,
            onClick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              onTaskClick?.(parsed.target, e);
            },
            className: "internal-link",
            style: { cursor: "pointer" },
            children: getAssetLabel?.(parsed.target) || displayText
          }
        );
      })() }),
      showEffortVotes && /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "task-effort-votes", children: typeof task.metadata.ems__Effort_votes === "number" ? task.metadata.ems__Effort_votes : "-" })
    ] }, `${task.path}-${index}`)) })
  ] }) });
};
const DailyTasksTableWithToggle = ({
  showEffortArea,
  onToggleEffortArea,
  showEffortVotes,
  onToggleEffortVotes,
  ...props
}) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "exocortex-daily-tasks-wrapper", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "exocortex-daily-tasks-controls", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          className: "exocortex-toggle-effort-area",
          onClick: onToggleEffortArea,
          style: {
            marginBottom: "8px",
            marginRight: "8px",
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: "12px"
          },
          children: [
            showEffortArea ? "Hide" : "Show",
            " Effort Area"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          className: "exocortex-toggle-effort-votes",
          onClick: onToggleEffortVotes,
          style: {
            marginBottom: "8px",
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: "12px"
          },
          children: [
            showEffortVotes ? "Hide" : "Show",
            " Votes"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DailyTasksTable, { ...props, showEffortArea, showEffortVotes })
  ] });
};

export { DailyTasksTable, DailyTasksTableWithToggle };
//# sourceMappingURL=DailyTasksTable-cRkqSZQf.js.map
