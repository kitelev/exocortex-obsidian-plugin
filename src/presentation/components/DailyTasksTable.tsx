import React, { useState } from "react";

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
}

export const DailyTasksTable: React.FC<DailyTasksTableProps> = ({
  tasks,
  onTaskClick,
  getAssetLabel,
  getEffortArea,
  showEffortArea = false,
}) => {
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
        alias: content.substring(pipeIndex + 1).trim()
      };
    }

    return {
      target: content.trim()
    };
  };

  const getDisplayName = (task: DailyTask): string => {
    const blockerIcon = task.isBlocked ? "🚩 " : "";
    const icon = (task.isDone && task.isMeeting) ? "✅ 👥 " : task.isDone ? "✅ " : task.isTrashed ? "❌ " : task.isDoing ? "🔄 " : task.isMeeting ? "👥 " : "";

    let displayText = task.label || task.title;

    // Check if getAssetLabel function is provided
    if (typeof getAssetLabel === 'function') {
      const customLabel = getAssetLabel(task.path);
      // Only use custom label if it's a non-null, non-empty string
      if (customLabel !== null && customLabel !== undefined && customLabel !== '') {
        displayText = customLabel;
      }
    }

    return blockerIcon + icon + displayText;
  };

  return (
    <div className="exocortex-daily-tasks">
      <table className="exocortex-tasks-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Start</th>
            <th>End</th>
            <th>Status</th>
            {showEffortArea && <th>Effort Area</th>}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, index) => (
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
                {task.status ? (() => {
                  const isWikiLink = typeof task.status === "string" && /\[\[.*?\]\]/.test(task.status);
                  const parsed = isWikiLink ? parseWikiLink(task.status) : { target: task.status };
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
                })() : "-"}
              </td>
              {showEffortArea && (
                <td className="task-effort-area">
                  {(() => {
                    const effortArea = getEffortArea?.(task.metadata) || task.metadata.ems__Effort_area;
                    if (!effortArea) return "-";

                    const isWikiLink = typeof effortArea === "string" && /\[\[.*?\]\]/.test(effortArea);
                    const parsed = isWikiLink ? parseWikiLink(effortArea as string) : { target: effortArea as string };
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const DailyTasksTableWithToggle: React.FC<Omit<DailyTasksTableProps, 'showEffortArea'>> = (props) => {
  const [showEffortArea, setShowEffortArea] = useState(false);

  return (
    <div className="exocortex-daily-tasks-wrapper">
      <div className="exocortex-daily-tasks-controls">
        <button
          className="exocortex-toggle-effort-area"
          onClick={() => setShowEffortArea(!showEffortArea)}
          style={{
            marginBottom: "8px",
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          {showEffortArea ? "Hide" : "Show"} Effort Area
        </button>
      </div>
      <DailyTasksTable {...props} showEffortArea={showEffortArea} />
    </div>
  );
};
