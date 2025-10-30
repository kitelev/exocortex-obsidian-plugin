import React, { useState, useMemo } from "react";

export interface DailyTask {
  file: {
    path: string;
    basename: string;
  };
  path: string;
  title: string;
  label: string;
  startTime: string;
  endTime: string;
  status: string;
  metadata: Record<string, unknown>;
  isDone: boolean;
  isTrashed: boolean;
  isDoing: boolean;
  isMeeting: boolean;
  isBlocked: boolean;
}

export interface DailyTasksTableProps {
  tasks: DailyTask[];
  onTaskClick?: (path: string, event: React.MouseEvent) => void;
  getAssetLabel?: (path: string) => string | null;
  getEffortArea?: (metadata: Record<string, unknown>) => string | null;
  showEffortArea?: boolean;
  showEffortVotes?: boolean;
}

interface SortState {
  column: string | null;
  order: "asc" | "desc" | null;
}

export const DailyTasksTable: React.FC<DailyTasksTableProps> = ({
  tasks,
  onTaskClick,
  getAssetLabel,
  getEffortArea,
  showEffortArea = false,
  showEffortVotes = false,
}) => {
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    order: null,
  });

  const handleSort = (column: string) => {
    setSortState((prev) => {
      if (prev.column !== column) {
        // First click on a new column: ascending
        return { column, order: "asc" };
      }
      if (prev.order === "asc") {
        // Second click: descending
        return { column, order: "desc" };
      }
      if (prev.order === "desc") {
        // Third click: reset sorting
        return { column: null, order: null };
      }
      // Default to ascending
      return { column, order: "asc" };
    });
  };
  interface WikiLink {
    target: string;
    alias?: string;
  }

  const parseWikiLink = (value: string): WikiLink => {
    // Remove [[ and ]]
    const content = value.replace(/^\[\[|\]\]$/g, "");

    // Check if there's an alias (format: target|alias)
    const pipeIndex = content.indexOf("|");

    if (pipeIndex !== -1) {
      return {
        target: content.substring(0, pipeIndex).trim(),
        alias: content.substring(pipeIndex + 1).trim(),
      };
    }

    return {
      target: content.trim(),
    };
  };

  const getDisplayName = (task: DailyTask): string => {
    const blockerIcon = task.isBlocked ? "🚩 " : "";
    const icon =
      task.isDone && task.isMeeting
        ? "✅ 👥 "
        : task.isDone
          ? "✅ "
          : task.isTrashed
            ? "❌ "
            : task.isDoing
              ? "🔄 "
              : task.isMeeting
                ? "👥 "
                : "";

    let displayText = task.label || task.title;

    // Check if getAssetLabel function is provided
    if (typeof getAssetLabel === "function") {
      const customLabel = getAssetLabel(task.path);
      // Only use custom label if it's a non-null, non-empty string
      if (
        customLabel !== null &&
        customLabel !== undefined &&
        customLabel !== ""
      ) {
        displayText = customLabel;
      }
    }

    return blockerIcon + icon + displayText;
  };

  const sortedTasks = useMemo(() => {
    if (!sortState.column || !sortState.order) {
      return tasks;
    }

    return [...tasks].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortState.column === "name") {
        aVal = getDisplayName(a).toLowerCase();
        bVal = getDisplayName(b).toLowerCase();
      } else if (sortState.column === "startTime") {
        aVal = a.startTime || "";
        bVal = b.startTime || "";
      } else if (sortState.column === "endTime") {
        aVal = a.endTime || "";
        bVal = b.endTime || "";
      } else if (sortState.column === "status") {
        // Extract text from wiki-link status
        const getStatusText = (status: string): string => {
          if (!status) return "";
          if (/\[\[.*?\]\]/.test(status)) {
            const content = status.replace(/^\[\[|\]\]$/g, "");
            const pipeIndex = content.indexOf("|");
            return pipeIndex !== -1
              ? content.substring(pipeIndex + 1).trim()
              : content.trim();
          }
          return status;
        };
        aVal = getStatusText(a.status).toLowerCase();
        bVal = getStatusText(b.status).toLowerCase();
      } else if (sortState.column === "effortArea") {
        const aArea = getEffortArea?.(a.metadata) || a.metadata.ems__Effort_area;
        const bArea = getEffortArea?.(b.metadata) || b.metadata.ems__Effort_area;

        const getAreaText = (area: any): string => {
          if (!area) return "";
          const areaStr = String(area);
          if (/\[\[.*?\]\]/.test(areaStr)) {
            const content = areaStr.replace(/^\[\[|\]\]$/g, "");
            const pipeIndex = content.indexOf("|");
            return pipeIndex !== -1
              ? content.substring(pipeIndex + 1).trim()
              : content.trim();
          } else if (areaStr.includes("|")) {
            const parts = areaStr.split("|");
            return parts[1]?.trim() || parts[0].trim();
          }
          return areaStr;
        };

        aVal = getAreaText(aArea).toLowerCase();
        bVal = getAreaText(bArea).toLowerCase();
      } else if (sortState.column === "effortVotes") {
        aVal =
          typeof a.metadata.ems__Effort_votes === "number"
            ? a.metadata.ems__Effort_votes
            : -1;
        bVal =
          typeof b.metadata.ems__Effort_votes === "number"
            ? b.metadata.ems__Effort_votes
            : -1;
      }

      // Handle null/undefined values
      if (!aVal && aVal !== 0) return 1;
      if (!bVal && bVal !== 0) return -1;

      // Compare values
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortState.order === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortState.order === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [tasks, sortState, getAssetLabel, getEffortArea]);

  return (
    <div className="exocortex-daily-tasks">
      <table className="exocortex-tasks-table">
        <thead>
          <tr>
            <th onClick={() => handleSort("name")} className="sortable">
              Name{" "}
              {sortState.column === "name" &&
                (sortState.order === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => handleSort("startTime")} className="sortable">
              Start{" "}
              {sortState.column === "startTime" &&
                (sortState.order === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => handleSort("endTime")} className="sortable">
              End{" "}
              {sortState.column === "endTime" &&
                (sortState.order === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => handleSort("status")} className="sortable">
              Status{" "}
              {sortState.column === "status" &&
                (sortState.order === "asc" ? "↑" : "↓")}
            </th>
            {showEffortArea && (
              <th onClick={() => handleSort("effortArea")} className="sortable">
                Effort Area{" "}
                {sortState.column === "effortArea" &&
                  (sortState.order === "asc" ? "↑" : "↓")}
              </th>
            )}
            {showEffortVotes && (
              <th
                onClick={() => handleSort("effortVotes")}
                className="sortable"
              >
                Votes{" "}
                {sortState.column === "effortVotes" &&
                  (sortState.order === "asc" ? "↑" : "↓")}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedTasks.map((task, index) => (
            <tr key={`${task.path}-${index}`} data-path={task.path}>
              <td className="task-name">
                <a
                  data-href={task.path}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onTaskClick?.(task.path, e);
                  }}
                  className="internal-link"
                  style={{ cursor: "pointer" }}
                >
                  {getDisplayName(task)}
                </a>
              </td>
              <td className="task-start">{task.startTime || "-"}</td>
              <td className="task-end">{task.endTime || "-"}</td>
              <td className="task-status">
                {task.status
                  ? (() => {
                      const isWikiLink =
                        typeof task.status === "string" &&
                        /\[\[.*?\]\]/.test(task.status);
                      const parsed = isWikiLink
                        ? parseWikiLink(task.status)
                        : { target: task.status };
                      const displayText = parsed.alias || parsed.target;

                      return (
                        <a
                          data-href={parsed.target}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onTaskClick?.(parsed.target, e);
                          }}
                          className="internal-link"
                          style={{ cursor: "pointer" }}
                        >
                          {displayText}
                        </a>
                      );
                    })()
                  : "-"}
              </td>
              {showEffortArea && (
                <td className="task-effort-area">
                  {(() => {
                    let effortArea: unknown = null;

                    if (getEffortArea) {
                      effortArea = getEffortArea(task.metadata);
                    }

                    if (!effortArea) {
                      effortArea = task.metadata.ems__Effort_area;
                    }

                    if (!effortArea) return "-";

                    // Parse both formats: [[UID|Alias]] and UID|Alias
                    let parsed: WikiLink;
                    const effortAreaStr = String(effortArea);

                    if (/\[\[.*?\]\]/.test(effortAreaStr)) {
                      // Format: [[UID|Alias]]
                      parsed = parseWikiLink(effortAreaStr);
                    } else if (effortAreaStr.includes("|")) {
                      // Format: UID|Alias (already extracted from wikilink)
                      const parts = effortAreaStr.split("|");
                      parsed = {
                        target: parts[0].trim(),
                        alias: parts[1]?.trim(),
                      };
                    } else {
                      // Plain value
                      parsed = { target: effortAreaStr.trim() };
                    }

                    const displayText = parsed.alias || parsed.target;

                    return (
                      <a
                        data-href={parsed.target}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onTaskClick?.(parsed.target, e);
                        }}
                        className="internal-link"
                        style={{ cursor: "pointer" }}
                      >
                        {getAssetLabel?.(parsed.target) || displayText}
                      </a>
                    );
                  })()}
                </td>
              )}
              {showEffortVotes && (
                <td className="task-effort-votes">
                  {typeof task.metadata.ems__Effort_votes === "number"
                    ? task.metadata.ems__Effort_votes
                    : "-"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export interface DailyTasksTableWithToggleProps
  extends Omit<DailyTasksTableProps, "showEffortArea" | "showEffortVotes"> {
  showEffortArea: boolean;
  onToggleEffortArea: () => void;
  showEffortVotes: boolean;
  onToggleEffortVotes: () => void;
}

export const DailyTasksTableWithToggle: React.FC<
  DailyTasksTableWithToggleProps
> = ({
  showEffortArea,
  onToggleEffortArea,
  showEffortVotes,
  onToggleEffortVotes,
  ...props
}) => {
  return (
    <div className="exocortex-daily-tasks-wrapper">
      <div className="exocortex-daily-tasks-controls">
        <button
          className="exocortex-toggle-effort-area"
          onClick={onToggleEffortArea}
          style={{
            marginBottom: "8px",
            marginRight: "8px",
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          {showEffortArea ? "Hide" : "Show"} Effort Area
        </button>
        <button
          className="exocortex-toggle-effort-votes"
          onClick={onToggleEffortVotes}
          style={{
            marginBottom: "8px",
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          {showEffortVotes ? "Hide" : "Show"} Votes
        </button>
      </div>
      <DailyTasksTable
        {...props}
        showEffortArea={showEffortArea}
        showEffortVotes={showEffortVotes}
      />
    </div>
  );
};
