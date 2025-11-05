import React, { useState, useMemo } from "react";

interface SortState {
  column: string;
  order: "asc" | "desc";
}

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
  showArchived?: boolean;
}

export const DailyTasksTable: React.FC<DailyTasksTableProps> = ({
  tasks,
  onTaskClick,
  getAssetLabel,
  getEffortArea,
  showEffortArea = false,
  showEffortVotes = false,
  showArchived = false,
}) => {
  const [sortState, setSortState] = useState<SortState>({
    column: "",
    order: "asc",
  });

  const handleSort = (column: string) => {
    setSortState((prev) => ({
      column,
      order: prev.column === column && prev.order === "asc" ? "desc" : "asc",
    }));
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

  const getEffortAreaDisplayText = (task: DailyTask): string => {
    let effortArea: unknown = null;

    if (getEffortArea) {
      effortArea = getEffortArea(task.metadata);
    }

    if (!effortArea) {
      effortArea = task.metadata.ems__Effort_area;
    }

    if (!effortArea) return "";

    const effortAreaStr = String(effortArea);

    if (/\[\[.*?\]\]/.test(effortAreaStr)) {
      const parsed = parseWikiLink(effortAreaStr);
      return (parsed.alias || parsed.target).toLowerCase();
    } else if (effortAreaStr.includes("|")) {
      const parts = effortAreaStr.split("|");
      const alias = parts[1]?.trim() || parts[0].trim();
      return alias.toLowerCase();
    } else {
      return effortAreaStr.trim().toLowerCase();
    }
  };

  const isAssetArchived = (metadata: Record<string, unknown>): boolean => {
    const value = metadata.exo__Asset_isArchived;
    if (!value) return false;
    if (value === true || value === 1) return true;
    if (typeof value === "string") {
      const lower = String(value).toLowerCase().trim();
      return lower === "true" || lower === "yes" || lower === "1";
    }
    return Boolean(value);
  };

  const sortedTasks = useMemo(() => {
    let filtered = tasks;

    if (!showArchived) {
      filtered = tasks.filter((task) => {
        return !isAssetArchived(task.metadata);
      });
    }

    if (!sortState.column) {
      return filtered;
    }

    const sorted = [...filtered];

    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortState.column) {
        case "name":
          aValue = getDisplayName(a).toLowerCase();
          bValue = getDisplayName(b).toLowerCase();
          break;
        case "start":
          aValue = a.startTime || "";
          bValue = b.startTime || "";
          break;
        case "end":
          aValue = a.endTime || "";
          bValue = b.endTime || "";
          break;
        case "status":
          aValue = a.status?.toLowerCase() || "";
          bValue = b.status?.toLowerCase() || "";
          break;
        case "effortArea":
          aValue = getEffortAreaDisplayText(a);
          bValue = getEffortAreaDisplayText(b);
          break;
        case "votes":
          aValue = typeof a.metadata.ems__Effort_votes === "number"
            ? a.metadata.ems__Effort_votes
            : -1;
          bValue = typeof b.metadata.ems__Effort_votes === "number"
            ? b.metadata.ems__Effort_votes
            : -1;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortState.order === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortState.order === "asc" ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [tasks, sortState, getAssetLabel, getEffortArea, showArchived]);

  return (
    <div className="exocortex-daily-tasks">
      <table className="exocortex-tasks-table">
        <thead>
          <tr>
            <th
              onClick={() => handleSort("name")}
              className="sortable"
              style={{ cursor: "pointer" }}
            >
              Name{" "}
              {sortState.column === "name" &&
                (sortState.order === "asc" ? "↑" : "↓")}
            </th>
            <th
              onClick={() => handleSort("start")}
              className="sortable"
              style={{ cursor: "pointer" }}
            >
              Start{" "}
              {sortState.column === "start" &&
                (sortState.order === "asc" ? "↑" : "↓")}
            </th>
            <th
              onClick={() => handleSort("end")}
              className="sortable"
              style={{ cursor: "pointer" }}
            >
              End{" "}
              {sortState.column === "end" &&
                (sortState.order === "asc" ? "↑" : "↓")}
            </th>
            <th
              onClick={() => handleSort("status")}
              className="sortable"
              style={{ cursor: "pointer" }}
            >
              Status{" "}
              {sortState.column === "status" &&
                (sortState.order === "asc" ? "↑" : "↓")}
            </th>
            {showEffortArea && (
              <th
                onClick={() => handleSort("effortArea")}
                className="sortable"
                style={{ cursor: "pointer" }}
              >
                Effort Area{" "}
                {sortState.column === "effortArea" &&
                  (sortState.order === "asc" ? "↑" : "↓")}
              </th>
            )}
            {showEffortVotes && (
              <th
                onClick={() => handleSort("votes")}
                className="sortable"
                style={{ cursor: "pointer" }}
              >
                Votes{" "}
                {sortState.column === "votes" &&
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
  extends Omit<
    DailyTasksTableProps,
    "showEffortArea" | "showEffortVotes" | "showArchived"
  > {
  showEffortArea: boolean;
  onToggleEffortArea: () => void;
  showEffortVotes: boolean;
  onToggleEffortVotes: () => void;
  showArchived: boolean;
  onToggleArchived: () => void;
}

export const DailyTasksTableWithToggle: React.FC<
  DailyTasksTableWithToggleProps
> = ({
  showEffortArea,
  onToggleEffortArea,
  showEffortVotes,
  onToggleEffortVotes,
  showArchived,
  onToggleArchived,
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
            marginRight: "8px",
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          {showEffortVotes ? "Hide" : "Show"} Votes
        </button>
        <button
          className="exocortex-toggle-archived"
          onClick={onToggleArchived}
          style={{
            marginBottom: "8px",
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          {showArchived ? "Hide" : "Show"} Archived
        </button>
      </div>
      <DailyTasksTable
        {...props}
        showEffortArea={showEffortArea}
        showEffortVotes={showEffortVotes}
        showArchived={showArchived}
      />
    </div>
  );
};
